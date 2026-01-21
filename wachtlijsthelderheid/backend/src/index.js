const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const {
  findTopCandidates,
  calculateWaitlistPosition,
  calculateMatchScore,
  simulatePreferenceChange,
  checkRulesFairness
} = require('./matching');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wachtlijst-helderheid-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for CSV imports

// Generate unique access code
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WL-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.orgId = decoded.orgId;
    req.orgName = decoded.orgName;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

// Enhanced log decision helper (Feature 5)
function logDecision(orgId, actionType, description, relatedIds = {}, metadata = {}, options = {}) {
  const stmt = db.prepare(`
    INSERT INTO decision_log (org_id, action_type, category, description, related_entry_id, related_spot_id, related_match_id, employee_name, reason, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    orgId,
    actionType,
    options.category || 'general',
    description,
    relatedIds.entryId || null,
    relatedIds.spotId || null,
    relatedIds.matchId || null,
    options.employeeName || null,
    options.reason || null,
    JSON.stringify(metadata)
  );
}

// Feature 9: Update confirmation statuses based on time
function updateConfirmationStatuses(orgId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // Update active -> pending_confirmation (30-60 days without confirmation)
  db.prepare(`
    UPDATE waitlist_entries
    SET confirmation_status = 'pending_confirmation'
    WHERE org_id = ?
    AND confirmation_status = 'active'
    AND last_confirmed_at < ?
    AND last_confirmed_at >= ?
    AND status = 'waiting'
  `).run(orgId, thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString());

  // Update pending_confirmation -> expired (> 60 days without confirmation)
  const expiredEntries = db.prepare(`
    SELECT id, child_name FROM waitlist_entries
    WHERE org_id = ?
    AND confirmation_status = 'pending_confirmation'
    AND last_confirmed_at < ?
    AND status = 'waiting'
  `).all(orgId, sixtyDaysAgo.toISOString());

  for (const entry of expiredEntries) {
    db.prepare(`
      UPDATE waitlist_entries
      SET confirmation_status = 'expired'
      WHERE id = ?
    `).run(entry.id);

    logDecision(orgId, 'entry_expired', `Inschrijving verlopen (geen bevestiging): ${entry.child_name}`,
      { entryId: entry.id }, {}, { category: 'archivering' });
  }

  // Update expired -> archived (> 90 days / 30 days after expiry)
  const archivedEntries = db.prepare(`
    SELECT id, child_name FROM waitlist_entries
    WHERE org_id = ?
    AND confirmation_status = 'expired'
    AND last_confirmed_at < ?
    AND status = 'waiting'
  `).all(orgId, ninetyDaysAgo.toISOString());

  for (const entry of archivedEntries) {
    db.prepare(`
      UPDATE waitlist_entries
      SET confirmation_status = 'archived', status = 'removed', archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(entry.id);

    logDecision(orgId, 'entry_archived', `Inschrijving gearchiveerd: ${entry.child_name}`,
      { entryId: entry.id }, {}, { category: 'archivering' });
  }
}

// Parse entry helper
function parseEntry(entry) {
  return {
    ...entry,
    preferred_days: JSON.parse(entry.preferred_days || '[]'),
    priority_factors: entry.priority_factors ? JSON.parse(entry.priority_factors) : {},
    other_registrations: entry.other_registrations ? JSON.parse(entry.other_registrations) : []
  };
}

// ============ AUTH ROUTES ============

// Register organization
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, type } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Naam, email en wachtwoord zijn verplicht' });
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM organizations WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is al in gebruik' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO organizations (name, email, password_hash, type) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, passwordHash, type || 'KDV');

    // Create default priority rules
    const defaultRules = [
      { name: 'Inschrijfdatum', type: 'registration_date', weight: 50, desc: 'Wie het eerst komt, het eerst maalt' },
      { name: 'Broertje/zusje', type: 'sibling', weight: 30, desc: 'Voorrang voor kinderen met broertje/zusje op locatie' },
      { name: 'Alleenstaand ouder', type: 'single_parent', weight: 20, desc: 'Voorrang voor alleenstaande ouders' }
    ];

    const ruleStmt = db.prepare(`
      INSERT INTO priority_rules (org_id, rule_name, rule_type, weight_percentage, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const rule of defaultRules) {
      ruleStmt.run(result.lastInsertRowid, rule.name, rule.type, rule.weight, rule.desc);
    }

    const token = jwt.sign(
      { orgId: result.lastInsertRowid, orgName: name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      organization: { id: result.lastInsertRowid, name, email, type: type || 'KDV' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const org = db.prepare('SELECT * FROM organizations WHERE email = ?').get(email);
    if (!org) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const validPassword = await bcrypt.compare(password, org.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    // Update confirmation statuses on login
    updateConfirmationStatuses(org.id);

    const token = jwt.sign(
      { orgId: org.id, orgName: org.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      organization: { id: org.id, name: org.name, email: org.email, type: org.type || 'KDV' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current org info
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const org = db.prepare('SELECT id, name, email, type, created_at FROM organizations WHERE id = ?').get(req.orgId);
  res.json({ organization: org });
});

// ============ WAITLIST ENTRIES ROUTES ============

// Get all entries for organization (with filters for Feature 9)
app.get('/api/entries', authMiddleware, (req, res) => {
  // Update statuses first
  updateConfirmationStatuses(req.orgId);

  const { status, confirmationStatus, includeArchived } = req.query;

  let query = `
    SELECT * FROM waitlist_entries
    WHERE org_id = ?
  `;
  const params = [req.orgId];

  if (status && status !== 'all') {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (confirmationStatus && confirmationStatus !== 'all') {
    query += ` AND confirmation_status = ?`;
    params.push(confirmationStatus);
  }

  if (includeArchived !== 'true') {
    query += ` AND (confirmation_status != 'archived' OR confirmation_status IS NULL)`;
  }

  query += ` ORDER BY created_at ASC`;

  const entries = db.prepare(query).all(...params);
  const parsed = entries.map(parseEntry);

  res.json({ entries: parsed });
});

// Get archived entries (Feature 9)
app.get('/api/entries/archived', authMiddleware, (req, res) => {
  const entries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ? AND confirmation_status = 'archived'
    ORDER BY archived_at DESC
  `).all(req.orgId);

  res.json({ entries: entries.map(parseEntry) });
});

// Get single entry
app.get('/api/entries/:id', authMiddleware, (req, res) => {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
    .get(req.params.id, req.orgId);

  if (!entry) {
    return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  }

  res.json({ entry: parseEntry(entry) });
});

// Create new entry (Feature 9: includes other_registrations)
app.post('/api/entries', authMiddleware, (req, res) => {
  try {
    const {
      parent_name,
      parent_email,
      parent_phone,
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      notes,
      priority_factors,
      other_registrations
    } = req.body;

    if (!parent_name || !child_name || !preferred_days || !desired_start_date) {
      return res.status(400).json({ error: 'Verplichte velden ontbreken' });
    }

    const accessCode = generateAccessCode();

    const stmt = db.prepare(`
      INSERT INTO waitlist_entries
      (org_id, parent_name, parent_email, parent_phone, child_name, child_birthdate, preferred_days, desired_start_date, notes, access_code, priority_factors, other_registrations, last_confirmed_at, confirmation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')
    `);

    const result = stmt.run(
      req.orgId,
      parent_name,
      parent_email || null,
      parent_phone || null,
      child_name,
      child_birthdate || null,
      JSON.stringify(preferred_days),
      desired_start_date,
      notes || null,
      accessCode,
      JSON.stringify(priority_factors || {}),
      JSON.stringify(other_registrations || [])
    );

    logDecision(req.orgId, 'entry_added', `Nieuwe inschrijving: ${child_name} (ouder: ${parent_name})`,
      { entryId: result.lastInsertRowid }, {}, { category: 'inschrijving' });

    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(result.lastInsertRowid);

    res.json({ entry: parseEntry(entry) });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update entry
app.put('/api/entries/:id', authMiddleware, (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
      .get(req.params.id, req.orgId);

    if (!entry) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    const {
      parent_name,
      parent_email,
      parent_phone,
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      notes,
      status,
      priority_factors,
      other_registrations,
      confirmation_status
    } = req.body;

    const stmt = db.prepare(`
      UPDATE waitlist_entries SET
        parent_name = COALESCE(?, parent_name),
        parent_email = COALESCE(?, parent_email),
        parent_phone = COALESCE(?, parent_phone),
        child_name = COALESCE(?, child_name),
        child_birthdate = COALESCE(?, child_birthdate),
        preferred_days = COALESCE(?, preferred_days),
        desired_start_date = COALESCE(?, desired_start_date),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        priority_factors = COALESCE(?, priority_factors),
        other_registrations = COALESCE(?, other_registrations),
        confirmation_status = COALESCE(?, confirmation_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      parent_name || null,
      parent_email || null,
      parent_phone || null,
      child_name || null,
      child_birthdate || null,
      preferred_days ? JSON.stringify(preferred_days) : null,
      desired_start_date || null,
      notes || null,
      status || null,
      priority_factors ? JSON.stringify(priority_factors) : null,
      other_registrations ? JSON.stringify(other_registrations) : null,
      confirmation_status || null,
      req.params.id
    );

    logDecision(req.orgId, 'entry_updated', `Inschrijving bijgewerkt: ${child_name || entry.child_name}`,
      { entryId: entry.id }, {}, { category: 'inschrijving' });

    const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(req.params.id);

    res.json({ entry: parseEntry(updated) });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete entry
app.delete('/api/entries/:id', authMiddleware, (req, res) => {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
    .get(req.params.id, req.orgId);

  if (!entry) {
    return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  }

  db.prepare('DELETE FROM waitlist_entries WHERE id = ?').run(req.params.id);

  logDecision(req.orgId, 'entry_removed', `Inschrijving verwijderd: ${entry.child_name}`,
    { entryId: entry.id }, {}, { category: 'inschrijving' });

  res.json({ success: true });
});

// Feature 9: Reset confirmation status (admin action)
app.post('/api/entries/:id/reset-confirmation', authMiddleware, (req, res) => {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
    .get(req.params.id, req.orgId);

  if (!entry) {
    return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  }

  db.prepare(`
    UPDATE waitlist_entries
    SET confirmation_status = 'active', last_confirmed_at = CURRENT_TIMESTAMP, status = 'waiting'
    WHERE id = ?
  `).run(req.params.id);

  logDecision(req.orgId, 'entry_updated', `Bevestigingsstatus gereset door admin: ${entry.child_name}`,
    { entryId: entry.id }, {}, { category: 'archivering' });

  const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(req.params.id);
  res.json({ entry: parseEntry(updated) });
});

// Feature 9: Bulk reset confirmation status
app.post('/api/entries/bulk-reset-confirmation', authMiddleware, (req, res) => {
  const { entryIds } = req.body;

  if (!entryIds || !Array.isArray(entryIds)) {
    return res.status(400).json({ error: 'entryIds array is required' });
  }

  for (const id of entryIds) {
    db.prepare(`
      UPDATE waitlist_entries
      SET confirmation_status = 'active', last_confirmed_at = CURRENT_TIMESTAMP, status = 'waiting'
      WHERE id = ? AND org_id = ?
    `).run(id, req.orgId);
  }

  logDecision(req.orgId, 'entry_updated', `Bevestigingsstatus gereset voor ${entryIds.length} inschrijvingen`,
    {}, {}, { category: 'archivering' });

  res.json({ success: true, count: entryIds.length });
});

// Feature 9: Restore archived entry
app.post('/api/entries/:id/restore', authMiddleware, (req, res) => {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
    .get(req.params.id, req.orgId);

  if (!entry) {
    return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  }

  db.prepare(`
    UPDATE waitlist_entries
    SET confirmation_status = 'active', status = 'waiting', last_confirmed_at = CURRENT_TIMESTAMP, archived_at = NULL
    WHERE id = ?
  `).run(req.params.id);

  logDecision(req.orgId, 'entry_updated', `Gearchiveerde inschrijving hersteld: ${entry.child_name}`,
    { entryId: entry.id }, {}, { category: 'archivering' });

  const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(req.params.id);
  res.json({ entry: parseEntry(updated) });
});

// ============ PRIORITY RULES ROUTES ============

// Get rules for organization (Feature 8: includes fairness check)
app.get('/api/rules', authMiddleware, (req, res) => {
  const rules = db.prepare('SELECT * FROM priority_rules WHERE org_id = ? ORDER BY weight_percentage DESC')
    .all(req.orgId);

  // Include fairness analysis
  const fairnessAnalysis = checkRulesFairness(req.orgId);

  res.json({ rules, fairnessAnalysis });
});

// Update rules (replace all)
app.put('/api/rules', authMiddleware, (req, res) => {
  try {
    const { rules, reason } = req.body;

    // Count affected entries before change
    const waitingCount = db.prepare(`
      SELECT COUNT(*) as count FROM waitlist_entries WHERE org_id = ? AND status = 'waiting'
    `).get(req.orgId).count;

    // Delete existing rules
    db.prepare('DELETE FROM priority_rules WHERE org_id = ?').run(req.orgId);

    // Insert new rules
    const stmt = db.prepare(`
      INSERT INTO priority_rules (org_id, rule_name, rule_type, weight_percentage, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const rule of rules) {
      stmt.run(req.orgId, rule.rule_name, rule.rule_type, rule.weight_percentage, rule.description || '', rule.is_active !== false ? 1 : 0);
    }

    logDecision(req.orgId, 'rule_updated', `Prioriteitsregels bijgewerkt: ${rules.length} regels (${waitingCount} wachtenden beïnvloed)`,
      {}, { affectedCount: waitingCount }, { category: 'regelwijziging', reason });

    const updated = db.prepare('SELECT * FROM priority_rules WHERE org_id = ? ORDER BY weight_percentage DESC')
      .all(req.orgId);

    // Include updated fairness analysis
    const fairnessAnalysis = checkRulesFairness(req.orgId);

    res.json({ rules: updated, fairnessAnalysis });
  } catch (error) {
    console.error('Update rules error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Feature 8: Get fairness analysis only
app.get('/api/rules/fairness', authMiddleware, (req, res) => {
  const fairnessAnalysis = checkRulesFairness(req.orgId);
  res.json(fairnessAnalysis);
});

// ============ AVAILABLE SPOTS ROUTES ============

// Get all spots for organization
app.get('/api/spots', authMiddleware, (req, res) => {
  const spots = db.prepare(`
    SELECT * FROM available_spots
    WHERE org_id = ?
    ORDER BY created_at DESC
  `).all(req.orgId);

  const parsed = spots.map(s => ({
    ...s,
    days: JSON.parse(s.days)
  }));

  res.json({ spots: parsed });
});

// Create new spot and get matches
app.post('/api/spots', authMiddleware, (req, res) => {
  try {
    const { days, start_date, num_spots } = req.body;

    if (!days || !start_date) {
      return res.status(400).json({ error: 'Dagen en startdatum zijn verplicht' });
    }

    const stmt = db.prepare(`
      INSERT INTO available_spots (org_id, days, start_date, num_spots)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(req.orgId, JSON.stringify(days), start_date, num_spots || 1);

    logDecision(req.orgId, 'spot_created', `Nieuwe plek beschikbaar: ${days.join('/')} vanaf ${start_date}`,
      { spotId: result.lastInsertRowid }, {}, { category: 'matching' });

    // Get top candidates
    const candidates = findTopCandidates(result.lastInsertRowid, 10);

    const spot = db.prepare('SELECT * FROM available_spots WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      spot: {
        ...spot,
        days: JSON.parse(spot.days)
      },
      candidates: candidates.map(c => ({
        entry: parseEntry(c.entry),
        score: c.totalScore,
        percentage: c.percentage,
        breakdown: c.breakdown,
        summary: c.summary
      }))
    });
  } catch (error) {
    console.error('Create spot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get candidates for existing spot
app.get('/api/spots/:id/candidates', authMiddleware, (req, res) => {
  try {
    const spot = db.prepare('SELECT * FROM available_spots WHERE id = ? AND org_id = ?')
      .get(req.params.id, req.orgId);

    if (!spot) {
      return res.status(404).json({ error: 'Plek niet gevonden' });
    }

    const candidates = findTopCandidates(spot.id, 10);

    res.json({
      candidates: candidates.map(c => ({
        entry: parseEntry(c.entry),
        score: c.totalScore,
        percentage: c.percentage,
        breakdown: c.breakdown,
        summary: c.summary
      }))
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ MATCHES ROUTES ============

// Create match proposal
app.post('/api/matches', authMiddleware, (req, res) => {
  try {
    const { spot_id, entry_id, reason } = req.body;

    const spot = db.prepare('SELECT * FROM available_spots WHERE id = ? AND org_id = ?')
      .get(spot_id, req.orgId);
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
      .get(entry_id, req.orgId);

    if (!spot || !entry) {
      return res.status(404).json({ error: 'Plek of inschrijving niet gevonden' });
    }

    // Calculate score
    const rules = db.prepare('SELECT * FROM priority_rules WHERE org_id = ?').all(req.orgId);
    const allEntries = db.prepare('SELECT * FROM waitlist_entries WHERE org_id = ? AND status = ?')
      .all(req.orgId, 'waiting');

    const scoreData = calculateMatchScore(spot, entry, rules, allEntries);

    const stmt = db.prepare(`
      INSERT INTO matches (spot_id, entry_id, match_score, score_breakdown, status)
      VALUES (?, ?, ?, ?, 'proposed')
    `);

    const result = stmt.run(spot_id, entry_id, scoreData.totalScore, JSON.stringify(scoreData.breakdown));

    // Update entry status
    db.prepare("UPDATE waitlist_entries SET status = 'matched' WHERE id = ?").run(entry_id);

    const spotDays = JSON.parse(spot.days);
    logDecision(
      req.orgId,
      'proposal_sent',
      `Voorstel verstuurd: ${spotDays.join('/')} aan ${entry.parent_name} (${entry.child_name}), Score: ${scoreData.percentage}%`,
      { entryId: entry_id, spotId: spot_id, matchId: result.lastInsertRowid },
      { score: scoreData.totalScore, breakdown: scoreData.breakdown },
      { category: 'matching', reason }
    );

    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      match: {
        ...match,
        score_breakdown: JSON.parse(match.score_breakdown)
      },
      emailPreview: {
        to: entry.parent_email || 'geen email opgegeven',
        subject: `Kinderopvang voorstel voor ${entry.child_name}`,
        body: `Beste ${entry.parent_name},

Goed nieuws! Er is een plek beschikbaar gekomen die past bij uw voorkeuren.

Beschikbare dagen: ${spotDays.join(', ')}
Startdatum: ${spot.start_date}
Match score: ${scoreData.percentage}%

U kunt dit voorstel bekijken en accepteren via uw persoonlijke dashboard met toegangscode: ${entry.access_code}

Met vriendelijke groet,
${req.orgName}`
      }
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all matches for organization
app.get('/api/matches', authMiddleware, (req, res) => {
  const matches = db.prepare(`
    SELECT m.*, e.parent_name, e.child_name, e.preferred_days as entry_days, s.days as spot_days, s.start_date
    FROM matches m
    JOIN waitlist_entries e ON m.entry_id = e.id
    JOIN available_spots s ON m.spot_id = s.id
    WHERE e.org_id = ?
    ORDER BY m.proposed_at DESC
  `).all(req.orgId);

  const parsed = matches.map(m => ({
    ...m,
    score_breakdown: m.score_breakdown ? JSON.parse(m.score_breakdown) : {},
    entry_days: JSON.parse(m.entry_days),
    spot_days: JSON.parse(m.spot_days)
  }));

  res.json({ matches: parsed });
});

// ============ PARENT PORTAL ROUTES (NO AUTH) ============

// Get entry by access code (Feature 1, 2, 3: enhanced with position range and rule breakdown)
app.get('/api/portal/:accessCode', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    // Get organization name
    const org = db.prepare('SELECT name, type FROM organizations WHERE id = ?').get(entry.org_id);

    // Calculate extended position (Features 1 & 2)
    const position = calculateWaitlistPosition(entry.id);

    // Get pending matches with score breakdown (Feature 3)
    const matches = db.prepare(`
      SELECT m.*, s.days, s.start_date
      FROM matches m
      JOIN available_spots s ON m.spot_id = s.id
      WHERE m.entry_id = ? AND m.status = 'proposed'
    `).all(entry.id);

    // Get timeline events
    const events = db.prepare(`
      SELECT * FROM decision_log
      WHERE related_entry_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(entry.id);

    // Check if confirmation is needed (Feature 9)
    const lastConfirmed = new Date(entry.last_confirmed_at || entry.created_at);
    const daysSinceConfirmation = Math.floor((Date.now() - lastConfirmed.getTime()) / (1000 * 60 * 60 * 24));
    const confirmationNeeded = daysSinceConfirmation >= 30;

    res.json({
      entry: parseEntry(entry),
      organization: org.name,
      organizationType: org.type,
      position,
      pendingMatches: matches.map(m => ({
        ...m,
        days: JSON.parse(m.days),
        score_breakdown: m.score_breakdown ? JSON.parse(m.score_breakdown) : {}
      })),
      timeline: events,
      // Feature 9: Confirmation info
      confirmationInfo: {
        lastConfirmed: entry.last_confirmed_at || entry.created_at,
        daysSinceConfirmation,
        confirmationNeeded,
        status: entry.confirmation_status || 'active'
      }
    });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Feature 9: Confirm interest
app.post('/api/portal/:accessCode/confirm-interest', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    db.prepare(`
      UPDATE waitlist_entries
      SET last_confirmed_at = CURRENT_TIMESTAMP, confirmation_status = 'active'
      WHERE id = ?
    `).run(entry.id);

    logDecision(entry.org_id, 'interest_confirmed', `Interesse bevestigd door ouder: ${entry.child_name}`,
      { entryId: entry.id }, {}, { category: 'inschrijving' });

    const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entry.id);
    const position = calculateWaitlistPosition(entry.id);

    res.json({
      entry: parseEntry(updated),
      position,
      message: 'Uw interesse is bevestigd. Bedankt!'
    });
  } catch (error) {
    console.error('Confirm interest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Feature 4: Simulate preference change
app.post('/api/portal/:accessCode/simulate', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    const { preferred_days, desired_start_date } = req.body;

    const simulation = simulatePreferenceChange(entry.id, {
      preferred_days,
      desired_start_date
    });

    res.json(simulation);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update preferences from portal
app.put('/api/portal/:accessCode/preferences', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    const { preferred_days, desired_start_date, notes, other_registrations } = req.body;

    const stmt = db.prepare(`
      UPDATE waitlist_entries SET
        preferred_days = COALESCE(?, preferred_days),
        desired_start_date = COALESCE(?, desired_start_date),
        notes = COALESCE(?, notes),
        other_registrations = COALESCE(?, other_registrations),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      preferred_days ? JSON.stringify(preferred_days) : null,
      desired_start_date || null,
      notes || null,
      other_registrations ? JSON.stringify(other_registrations) : null,
      entry.id
    );

    logDecision(entry.org_id, 'entry_updated', `Voorkeuren aangepast door ouder: ${entry.child_name}`,
      { entryId: entry.id }, {}, { category: 'inschrijving' });

    // Get updated entry
    const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entry.id);
    const position = calculateWaitlistPosition(entry.id);

    res.json({
      entry: parseEntry(updated),
      position
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept or reject match from portal
app.post('/api/portal/:accessCode/match/:matchId/respond', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    const match = db.prepare('SELECT * FROM matches WHERE id = ? AND entry_id = ?')
      .get(req.params.matchId, entry.id);

    if (!match) {
      return res.status(404).json({ error: 'Voorstel niet gevonden' });
    }

    const { accept, rejection_reason } = req.body;

    if (accept) {
      db.prepare(`
        UPDATE matches SET status = 'accepted', response_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(match.id);

      db.prepare("UPDATE waitlist_entries SET status = 'accepted' WHERE id = ?").run(entry.id);
      db.prepare("UPDATE available_spots SET num_spots = num_spots - 1 WHERE id = ?").run(match.spot_id);

      logDecision(
        entry.org_id,
        'proposal_accepted',
        `Voorstel geaccepteerd door ${entry.parent_name} (${entry.child_name})`,
        { entryId: entry.id, spotId: match.spot_id, matchId: match.id },
        {},
        { category: 'matching' }
      );
    } else {
      db.prepare(`
        UPDATE matches SET status = 'rejected', response_date = CURRENT_TIMESTAMP, rejection_reason = ?
        WHERE id = ?
      `).run(rejection_reason || null, match.id);

      db.prepare("UPDATE waitlist_entries SET status = 'waiting' WHERE id = ?").run(entry.id);

      logDecision(
        entry.org_id,
        'proposal_rejected',
        `Voorstel afgewezen door ${entry.parent_name} (${entry.child_name})${rejection_reason ? ': ' + rejection_reason : ''}`,
        { entryId: entry.id, spotId: match.spot_id, matchId: match.id },
        { reason: rejection_reason },
        { category: 'matching' }
      );
    }

    res.json({ success: true, accepted: accept });
  } catch (error) {
    console.error('Match respond error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ DECISION LOG ROUTES (Feature 5: Enhanced) ============

// Get decision log with filters
app.get('/api/log', authMiddleware, (req, res) => {
  const { category, actionType, search, dateFrom, dateTo, entryId, limit } = req.query;

  let query = `
    SELECT dl.*, we.child_name, we.parent_name
    FROM decision_log dl
    LEFT JOIN waitlist_entries we ON dl.related_entry_id = we.id
    WHERE dl.org_id = ?
  `;
  const params = [req.orgId];

  if (category && category !== 'all') {
    query += ` AND dl.category = ?`;
    params.push(category);
  }

  if (actionType && actionType !== 'all') {
    query += ` AND dl.action_type = ?`;
    params.push(actionType);
  }

  if (search) {
    query += ` AND dl.description LIKE ?`;
    params.push(`%${search}%`);
  }

  if (dateFrom) {
    query += ` AND dl.created_at >= ?`;
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ` AND dl.created_at <= ?`;
    params.push(dateTo);
  }

  if (entryId) {
    query += ` AND dl.related_entry_id = ?`;
    params.push(entryId);
  }

  query += ` ORDER BY dl.created_at DESC LIMIT ?`;
  params.push(parseInt(limit) || 100);

  const logs = db.prepare(query).all(...params);

  const parsed = logs.map(l => ({
    ...l,
    metadata: l.metadata ? JSON.parse(l.metadata) : {}
  }));

  res.json({ logs: parsed });
});

// Export log as CSV (Feature 5: Enhanced)
app.get('/api/log/export', authMiddleware, (req, res) => {
  const { format, dateFrom, dateTo, category } = req.query;

  let query = `
    SELECT dl.*, we.child_name, we.parent_name
    FROM decision_log dl
    LEFT JOIN waitlist_entries we ON dl.related_entry_id = we.id
    WHERE dl.org_id = ?
  `;
  const params = [req.orgId];

  if (dateFrom) {
    query += ` AND dl.created_at >= ?`;
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ` AND dl.created_at <= ?`;
    params.push(dateTo);
  }

  if (category && category !== 'all') {
    query += ` AND dl.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY dl.created_at DESC`;

  const logs = db.prepare(query).all(...params);

  logDecision(req.orgId, 'export', `Beslissingslog geëxporteerd (${logs.length} items)`,
    {}, {}, { category: 'import_export' });

  const csv = [
    'Datum,Categorie,Type,Beschrijving,Kind,Ouder,Medewerker,Reden',
    ...logs.map(l => `"${l.created_at}","${l.category || ''}","${l.action_type}","${l.description.replace(/"/g, '""')}","${l.child_name || ''}","${l.parent_name || ''}","${l.employee_name || ''}","${(l.reason || '').replace(/"/g, '""')}"`)
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=beslissingslog.csv');
  res.send('\ufeff' + csv); // BOM for Excel UTF-8 compatibility
});

// ============ IMPORT/EXPORT ROUTES (Feature 7) ============

// Export waitlist to CSV
app.get('/api/export/waitlist', authMiddleware, (req, res) => {
  const entries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ?
    ORDER BY created_at ASC
  `).all(req.orgId);

  const csv = [
    'Kind,Ouder,Email,Telefoon,Geboortedatum,Gewenste Dagen,Gewenste Startdatum,Status,Bevestigingsstatus,Toegangscode,Broertje/Zusje,Alleenstaand Ouder,Andere Inschrijvingen,Notities,Ingeschreven Op',
    ...entries.map(e => {
      const days = JSON.parse(e.preferred_days || '[]');
      const factors = e.priority_factors ? JSON.parse(e.priority_factors) : {};
      const other = e.other_registrations ? JSON.parse(e.other_registrations) : [];
      return `"${e.child_name}","${e.parent_name}","${e.parent_email || ''}","${e.parent_phone || ''}","${e.child_birthdate || ''}","${days.join(';')}","${e.desired_start_date}","${e.status}","${e.confirmation_status || 'active'}","${e.access_code}","${factors.has_sibling ? 'Ja' : 'Nee'}","${factors.single_parent ? 'Ja' : 'Nee'}","${other.join(';')}","${(e.notes || '').replace(/"/g, '""')}","${e.created_at}"`;
    })
  ].join('\n');

  logDecision(req.orgId, 'export', `Wachtlijst geëxporteerd (${entries.length} inschrijvingen)`,
    {}, {}, { category: 'import_export' });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=wachtlijst.csv');
  res.send('\ufeff' + csv);
});

// Get import template
app.get('/api/import/template', authMiddleware, (req, res) => {
  const template = `Kind,Ouder,Email,Telefoon,Geboortedatum,Gewenste Dagen,Gewenste Startdatum,Broertje/Zusje,Alleenstaand Ouder,Andere Inschrijvingen,Notities
Emma de Vries,Jan de Vries,jan@email.nl,0612345678,2022-03-15,MA;WO;VR,2025-01-15,Nee,Nee,KDV Zonnestraal,Flexibele dagen gewenst
Liam Jansen,Anna Jansen,anna@email.nl,0687654321,2021-08-20,DI;DO,2025-02-01,Ja,Nee,,Graag dezelfde groep als zusje`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=import-template.csv');
  res.send('\ufeff' + template);
});

// Import waitlist from CSV
app.post('/api/import/waitlist', authMiddleware, (req, res) => {
  try {
    const { data, dryRun } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Geen geldige data ontvangen' });
    }

    const results = {
      total: data.length,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      errors: [],
      imported: []
    };

    // Get existing entries for duplicate check
    const existingEntries = db.prepare(`
      SELECT child_name, child_birthdate FROM waitlist_entries WHERE org_id = ?
    `).all(req.orgId);

    const existingSet = new Set(existingEntries.map(e => `${e.child_name}-${e.child_birthdate}`));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 for header and 0-index

      // Validate required fields
      if (!row.child_name || !row.parent_name || !row.preferred_days || !row.desired_start_date) {
        results.invalid++;
        results.errors.push({ row: rowNum, error: 'Verplichte velden ontbreken (kind, ouder, dagen, startdatum)' });
        continue;
      }

      // Check for duplicates
      const key = `${row.child_name}-${row.child_birthdate || ''}`;
      if (existingSet.has(key)) {
        results.duplicates++;
        results.errors.push({ row: rowNum, error: `Duplicaat: ${row.child_name} bestaat al` });
        continue;
      }

      // Parse days
      const days = row.preferred_days.split(';').map(d => d.trim().toUpperCase()).filter(d => ['MA', 'DI', 'WO', 'DO', 'VR'].includes(d));
      if (days.length === 0) {
        results.invalid++;
        results.errors.push({ row: rowNum, error: 'Ongeldige dagen (gebruik MA;DI;WO;DO;VR)' });
        continue;
      }

      if (!dryRun) {
        const accessCode = generateAccessCode();
        const otherRegs = row.other_registrations ? row.other_registrations.split(';').map(s => s.trim()).filter(Boolean) : [];

        const stmt = db.prepare(`
          INSERT INTO waitlist_entries
          (org_id, parent_name, parent_email, parent_phone, child_name, child_birthdate, preferred_days, desired_start_date, notes, access_code, priority_factors, other_registrations, last_confirmed_at, confirmation_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')
        `);

        stmt.run(
          req.orgId,
          row.parent_name,
          row.email || null,
          row.phone || null,
          row.child_name,
          row.child_birthdate || null,
          JSON.stringify(days),
          row.desired_start_date,
          row.notes || null,
          accessCode,
          JSON.stringify({
            has_sibling: row.has_sibling?.toLowerCase() === 'ja',
            single_parent: row.single_parent?.toLowerCase() === 'ja'
          }),
          JSON.stringify(otherRegs)
        );

        results.imported.push({ child_name: row.child_name, access_code: accessCode });
      }

      results.valid++;
      existingSet.add(key); // Prevent duplicates within same import
    }

    if (!dryRun && results.valid > 0) {
      logDecision(req.orgId, 'import', `${results.valid} inschrijvingen geïmporteerd`,
        {}, { total: results.total, valid: results.valid, duplicates: results.duplicates },
        { category: 'import_export' });
    }

    res.json(results);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Server error bij importeren' });
  }
});

// ============ ANALYTICS ROUTES ============

// Get analytics
app.get('/api/analytics', authMiddleware, (req, res) => {
  // Update confirmation statuses first
  updateConfirmationStatuses(req.orgId);

  // Total waiting
  const totalWaiting = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting' AND (confirmation_status = 'active' OR confirmation_status IS NULL)
  `).get(req.orgId).count;

  // Total entries (excluding archived)
  const totalEntries = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ? AND confirmation_status != 'archived'
  `).get(req.orgId).count;

  // Accepted count
  const acceptedCount = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ? AND status = 'accepted'
  `).get(req.orgId).count;

  // Average wait time (for accepted entries)
  const avgWaitTime = db.prepare(`
    SELECT AVG(julianday(updated_at) - julianday(created_at)) as avg_days
    FROM waitlist_entries
    WHERE org_id = ? AND status = 'accepted'
  `).get(req.orgId).avg_days || 0;

  // Demand per day
  const entries = db.prepare(`
    SELECT preferred_days FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting' AND (confirmation_status = 'active' OR confirmation_status IS NULL)
  `).all(req.orgId);

  const dayDemand = { MA: 0, DI: 0, WO: 0, DO: 0, VR: 0 };
  for (const entry of entries) {
    const days = JSON.parse(entry.preferred_days);
    for (const day of days) {
      if (dayDemand.hasOwnProperty(day)) {
        dayDemand[day]++;
      }
    }
  }

  // Recent activity count
  const recentActivity = db.prepare(`
    SELECT COUNT(*) as count FROM decision_log
    WHERE org_id = ? AND created_at > datetime('now', '-7 days')
  `).get(req.orgId).count;

  // Feature 9: Confirmation status counts
  const confirmationStats = {
    active: db.prepare(`SELECT COUNT(*) as count FROM waitlist_entries WHERE org_id = ? AND confirmation_status = 'active'`).get(req.orgId).count,
    pending: db.prepare(`SELECT COUNT(*) as count FROM waitlist_entries WHERE org_id = ? AND confirmation_status = 'pending_confirmation'`).get(req.orgId).count,
    expired: db.prepare(`SELECT COUNT(*) as count FROM waitlist_entries WHERE org_id = ? AND confirmation_status = 'expired'`).get(req.orgId).count,
    archived: db.prepare(`SELECT COUNT(*) as count FROM waitlist_entries WHERE org_id = ? AND confirmation_status = 'archived'`).get(req.orgId).count
  };

  // Feature 9: Multi-waitlist stats
  const multiWaitlistCount = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ? AND other_registrations IS NOT NULL AND other_registrations != '[]' AND status = 'waiting'
  `).get(req.orgId).count;

  res.json({
    totalWaiting,
    totalEntries,
    acceptedCount,
    avgWaitTimeDays: Math.round(avgWaitTime),
    dayDemand,
    recentActivity,
    confirmationStats,
    multiWaitlistCount
  });
});

// ============ SEED DATA ROUTES (Feature 10) ============

// Load demo data
app.post('/api/seed/demo', authMiddleware, (req, res) => {
  try {
    const dutchFirstNames = ['Emma', 'Liam', 'Sophie', 'Noah', 'Julia', 'Lucas', 'Mila', 'Finn', 'Tess', 'Daan', 'Eva', 'Sem', 'Anna', 'Luuk', 'Saar', 'Milan', 'Evi', 'Tim', 'Noor', 'Jesse'];
    const dutchLastNames = ['de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Peters', 'Hendriks', 'van Dijk', 'van den Berg', 'Schouten'];
    const otherDaycares = ['KDV Zonnestraal', 'BSO De Regenboog', 'Kinderopvang Pippi', 'Kinderdagverblijf Luna', 'BSO Avontuur'];

    const entries = [];
    const now = new Date();

    for (let i = 0; i < 25; i++) {
      const firstName = dutchFirstNames[Math.floor(Math.random() * dutchFirstNames.length)];
      const lastName = dutchLastNames[Math.floor(Math.random() * dutchLastNames.length)];
      const parentFirstName = dutchFirstNames[Math.floor(Math.random() * dutchFirstNames.length)];

      // Random registration date (spread over 6 months)
      const createdAt = new Date(now - Math.random() * 180 * 24 * 60 * 60 * 1000);

      // Random last confirmed date
      const confirmDaysAgo = Math.floor(Math.random() * 90);
      const lastConfirmed = new Date(now - confirmDaysAgo * 24 * 60 * 60 * 1000);

      // Determine confirmation status based on days
      let confirmationStatus = 'active';
      if (confirmDaysAgo > 60) {
        confirmationStatus = Math.random() > 0.5 ? 'expired' : 'archived';
      } else if (confirmDaysAgo > 30) {
        confirmationStatus = 'pending_confirmation';
      }

      // Random days (1-5 days)
      const allDays = ['MA', 'DI', 'WO', 'DO', 'VR'];
      const numDays = Math.floor(Math.random() * 4) + 1;
      const shuffledDays = allDays.sort(() => Math.random() - 0.5);
      const selectedDays = shuffledDays.slice(0, numDays);

      // Random start date (1-4 months from now)
      const startDate = new Date(now.getTime() + (30 + Math.random() * 90) * 24 * 60 * 60 * 1000);

      // Random birthdate (1-4 years old)
      const birthdate = new Date(now.getFullYear() - 1 - Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      // Random priority factors
      const hasSibling = Math.random() < 0.2;
      const singleParent = Math.random() < 0.1;

      // Random other registrations
      const otherRegs = Math.random() < 0.3 ? [otherDaycares[Math.floor(Math.random() * otherDaycares.length)]] : [];

      const accessCode = generateAccessCode();

      // Determine status based on confirmation
      let status = 'waiting';
      if (confirmationStatus === 'archived') {
        status = 'removed';
      }

      entries.push({
        child_name: `${firstName} ${lastName}`,
        parent_name: `${parentFirstName} ${lastName}`,
        parent_email: `${parentFirstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@email.nl`,
        parent_phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
        child_birthdate: birthdate.toISOString().split('T')[0],
        preferred_days: selectedDays,
        desired_start_date: startDate.toISOString().split('T')[0],
        notes: Math.random() < 0.3 ? 'Flexibel met dagen indien nodig' : null,
        access_code: accessCode,
        priority_factors: { has_sibling: hasSibling, single_parent: singleParent },
        other_registrations: otherRegs,
        status,
        confirmation_status: confirmationStatus,
        created_at: createdAt.toISOString(),
        last_confirmed_at: lastConfirmed.toISOString()
      });
    }

    // Insert entries
    const stmt = db.prepare(`
      INSERT INTO waitlist_entries
      (org_id, parent_name, parent_email, parent_phone, child_name, child_birthdate, preferred_days, desired_start_date, notes, access_code, priority_factors, other_registrations, status, confirmation_status, created_at, last_confirmed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const entry of entries) {
      stmt.run(
        req.orgId,
        entry.parent_name,
        entry.parent_email,
        entry.parent_phone,
        entry.child_name,
        entry.child_birthdate,
        JSON.stringify(entry.preferred_days),
        entry.desired_start_date,
        entry.notes,
        entry.access_code,
        JSON.stringify(entry.priority_factors),
        JSON.stringify(entry.other_registrations),
        entry.status,
        entry.confirmation_status,
        entry.created_at,
        entry.last_confirmed_at
      );
    }

    // Add some demo log entries
    const logEntries = [
      { action: 'entry_added', desc: 'Demo data geladen', category: 'system' },
      { action: 'rule_updated', desc: 'Prioriteitsregels aangepast door beheerder', category: 'regelwijziging' },
      { action: 'spot_created', desc: 'Nieuwe plek beschikbaar: MA/WO/VR', category: 'matching' },
      { action: 'proposal_sent', desc: 'Voorstel verstuurd aan ouder', category: 'matching' },
      { action: 'interest_confirmed', desc: 'Interesse bevestigd door ouder', category: 'inschrijving' },
      { action: 'entry_expired', desc: 'Inschrijving verlopen (geen bevestiging)', category: 'archivering' }
    ];

    for (const log of logEntries) {
      logDecision(req.orgId, log.action, log.desc, {}, {}, { category: log.category });
    }

    logDecision(req.orgId, 'import', `Demo data geladen: ${entries.length} inschrijvingen`,
      {}, {}, { category: 'system' });

    res.json({
      success: true,
      message: `${entries.length} demo inschrijvingen toegevoegd`,
      created: {
        entries: entries.length,
        spots: 0
      },
      stats: {
        total: entries.length,
        active: entries.filter(e => e.confirmation_status === 'active').length,
        pending: entries.filter(e => e.confirmation_status === 'pending_confirmation').length,
        expired: entries.filter(e => e.confirmation_status === 'expired').length,
        archived: entries.filter(e => e.confirmation_status === 'archived').length,
        withSibling: entries.filter(e => e.priority_factors.has_sibling).length,
        withOtherRegistrations: entries.filter(e => e.other_registrations.length > 0).length
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Server error bij laden demo data' });
  }
});

// Reset/clear all data for organization
app.post('/api/seed/reset', authMiddleware, (req, res) => {
  try {
    // Delete all data for this organization
    db.prepare('DELETE FROM matches WHERE spot_id IN (SELECT id FROM available_spots WHERE org_id = ?)').run(req.orgId);
    db.prepare('DELETE FROM available_spots WHERE org_id = ?').run(req.orgId);
    db.prepare('DELETE FROM waitlist_entries WHERE org_id = ?').run(req.orgId);
    db.prepare('DELETE FROM decision_log WHERE org_id = ?').run(req.orgId);

    logDecision(req.orgId, 'system', 'Alle data gereset door beheerder', {}, {}, { category: 'system' });

    res.json({ success: true, message: 'Alle data is verwijderd' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Server error bij resetten' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`WachtlijstHelderheid API running on http://localhost:${PORT}`);
});
