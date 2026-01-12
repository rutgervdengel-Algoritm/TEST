const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const {
  findTopCandidates,
  calculateWaitlistPosition,
  calculateMatchScore
} = require('./matching');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wachtlijst-helderheid-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

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

// Log decision helper
function logDecision(orgId, actionType, description, relatedIds = {}, metadata = {}) {
  const stmt = db.prepare(`
    INSERT INTO decision_log (org_id, action_type, description, related_entry_id, related_spot_id, related_match_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    orgId,
    actionType,
    description,
    relatedIds.entryId || null,
    relatedIds.spotId || null,
    relatedIds.matchId || null,
    JSON.stringify(metadata)
  );
}

// ============ AUTH ROUTES ============

// Register organization
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Naam, email en wachtwoord zijn verplicht' });
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM organizations WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is al in gebruik' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO organizations (name, email, password_hash) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, passwordHash);

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
      organization: { id: result.lastInsertRowid, name, email }
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

    const token = jwt.sign(
      { orgId: org.id, orgName: org.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      organization: { id: org.id, name: org.name, email: org.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current org info
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const org = db.prepare('SELECT id, name, email, created_at FROM organizations WHERE id = ?').get(req.orgId);
  res.json({ organization: org });
});

// ============ WAITLIST ENTRIES ROUTES ============

// Get all entries for organization
app.get('/api/entries', authMiddleware, (req, res) => {
  const entries = db.prepare(`
    SELECT * FROM waitlist_entries
    WHERE org_id = ?
    ORDER BY created_at ASC
  `).all(req.orgId);

  // Parse JSON fields
  const parsed = entries.map(e => ({
    ...e,
    preferred_days: JSON.parse(e.preferred_days),
    priority_factors: e.priority_factors ? JSON.parse(e.priority_factors) : {}
  }));

  res.json({ entries: parsed });
});

// Get single entry
app.get('/api/entries/:id', authMiddleware, (req, res) => {
  const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ? AND org_id = ?')
    .get(req.params.id, req.orgId);

  if (!entry) {
    return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  }

  res.json({
    entry: {
      ...entry,
      preferred_days: JSON.parse(entry.preferred_days),
      priority_factors: entry.priority_factors ? JSON.parse(entry.priority_factors) : {}
    }
  });
});

// Create new entry
app.post('/api/entries', authMiddleware, (req, res) => {
  try {
    const {
      parent_name,
      parent_email,
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      notes,
      priority_factors
    } = req.body;

    if (!parent_name || !child_name || !preferred_days || !desired_start_date) {
      return res.status(400).json({ error: 'Verplichte velden ontbreken' });
    }

    const accessCode = generateAccessCode();

    const stmt = db.prepare(`
      INSERT INTO waitlist_entries
      (org_id, parent_name, parent_email, child_name, child_birthdate, preferred_days, desired_start_date, notes, access_code, priority_factors)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.orgId,
      parent_name,
      parent_email || null,
      child_name,
      child_birthdate || null,
      JSON.stringify(preferred_days),
      desired_start_date,
      notes || null,
      accessCode,
      JSON.stringify(priority_factors || {})
    );

    logDecision(req.orgId, 'entry_added', `Nieuwe inschrijving: ${child_name} (ouder: ${parent_name})`, { entryId: result.lastInsertRowid });

    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      entry: {
        ...entry,
        preferred_days: JSON.parse(entry.preferred_days),
        priority_factors: entry.priority_factors ? JSON.parse(entry.priority_factors) : {}
      }
    });
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
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      notes,
      status,
      priority_factors
    } = req.body;

    const stmt = db.prepare(`
      UPDATE waitlist_entries SET
        parent_name = COALESCE(?, parent_name),
        parent_email = COALESCE(?, parent_email),
        child_name = COALESCE(?, child_name),
        child_birthdate = COALESCE(?, child_birthdate),
        preferred_days = COALESCE(?, preferred_days),
        desired_start_date = COALESCE(?, desired_start_date),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        priority_factors = COALESCE(?, priority_factors),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      parent_name || null,
      parent_email || null,
      child_name || null,
      child_birthdate || null,
      preferred_days ? JSON.stringify(preferred_days) : null,
      desired_start_date || null,
      notes || null,
      status || null,
      priority_factors ? JSON.stringify(priority_factors) : null,
      req.params.id
    );

    logDecision(req.orgId, 'entry_updated', `Inschrijving bijgewerkt: ${child_name || entry.child_name}`, { entryId: entry.id });

    const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(req.params.id);

    res.json({
      entry: {
        ...updated,
        preferred_days: JSON.parse(updated.preferred_days),
        priority_factors: updated.priority_factors ? JSON.parse(updated.priority_factors) : {}
      }
    });
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

  logDecision(req.orgId, 'entry_removed', `Inschrijving verwijderd: ${entry.child_name}`, { entryId: entry.id });

  res.json({ success: true });
});

// ============ PRIORITY RULES ROUTES ============

// Get rules for organization
app.get('/api/rules', authMiddleware, (req, res) => {
  const rules = db.prepare('SELECT * FROM priority_rules WHERE org_id = ? ORDER BY weight_percentage DESC')
    .all(req.orgId);
  res.json({ rules });
});

// Update rules (replace all)
app.put('/api/rules', authMiddleware, (req, res) => {
  try {
    const { rules } = req.body;

    // Delete existing rules
    db.prepare('DELETE FROM priority_rules WHERE org_id = ?').run(req.orgId);

    // Insert new rules
    const stmt = db.prepare(`
      INSERT INTO priority_rules (org_id, rule_name, rule_type, weight_percentage, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const rule of rules) {
      stmt.run(req.orgId, rule.rule_name, rule.rule_type, rule.weight_percentage, rule.description || '');
    }

    logDecision(req.orgId, 'rule_updated', `Prioriteitsregels bijgewerkt: ${rules.length} regels`);

    const updated = db.prepare('SELECT * FROM priority_rules WHERE org_id = ? ORDER BY weight_percentage DESC')
      .all(req.orgId);

    res.json({ rules: updated });
  } catch (error) {
    console.error('Update rules error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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

    logDecision(req.orgId, 'spot_created', `Nieuwe plek beschikbaar: ${days.join('/')} vanaf ${start_date}`, { spotId: result.lastInsertRowid });

    // Get top candidates
    const candidates = findTopCandidates(result.lastInsertRowid, 5);

    const spot = db.prepare('SELECT * FROM available_spots WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      spot: {
        ...spot,
        days: JSON.parse(spot.days)
      },
      candidates: candidates.map(c => ({
        entry: {
          ...c.entry,
          preferred_days: JSON.parse(c.entry.preferred_days),
          priority_factors: c.entry.priority_factors ? JSON.parse(c.entry.priority_factors) : {}
        },
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
        entry: {
          ...c.entry,
          preferred_days: JSON.parse(c.entry.preferred_days),
          priority_factors: c.entry.priority_factors ? JSON.parse(c.entry.priority_factors) : {}
        },
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
    const { spot_id, entry_id } = req.body;

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
      { score: scoreData.totalScore, breakdown: scoreData.breakdown }
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

// Get entry by access code
app.get('/api/portal/:accessCode', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM waitlist_entries WHERE access_code = ?')
      .get(req.params.accessCode.toUpperCase());

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    // Get organization name
    const org = db.prepare('SELECT name FROM organizations WHERE id = ?').get(entry.org_id);

    // Calculate position
    const position = calculateWaitlistPosition(entry.id);

    // Get pending matches
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

    res.json({
      entry: {
        ...entry,
        preferred_days: JSON.parse(entry.preferred_days),
        priority_factors: entry.priority_factors ? JSON.parse(entry.priority_factors) : {}
      },
      organization: org.name,
      position,
      pendingMatches: matches.map(m => ({
        ...m,
        days: JSON.parse(m.days),
        score_breakdown: m.score_breakdown ? JSON.parse(m.score_breakdown) : {}
      })),
      timeline: events
    });
  } catch (error) {
    console.error('Portal error:', error);
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

    const { preferred_days, desired_start_date, notes } = req.body;

    const stmt = db.prepare(`
      UPDATE waitlist_entries SET
        preferred_days = COALESCE(?, preferred_days),
        desired_start_date = COALESCE(?, desired_start_date),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      preferred_days ? JSON.stringify(preferred_days) : null,
      desired_start_date || null,
      notes || null,
      entry.id
    );

    logDecision(entry.org_id, 'entry_updated', `Voorkeuren aangepast door ouder: ${entry.child_name}`, { entryId: entry.id });

    // Get updated entry
    const updated = db.prepare('SELECT * FROM waitlist_entries WHERE id = ?').get(entry.id);
    const position = calculateWaitlistPosition(entry.id);

    res.json({
      entry: {
        ...updated,
        preferred_days: JSON.parse(updated.preferred_days),
        priority_factors: updated.priority_factors ? JSON.parse(updated.priority_factors) : {}
      },
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
        { entryId: entry.id, spotId: match.spot_id, matchId: match.id }
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
        { reason: rejection_reason }
      );
    }

    res.json({ success: true, accepted: accept });
  } catch (error) {
    console.error('Match respond error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ DECISION LOG ROUTES ============

// Get decision log
app.get('/api/log', authMiddleware, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM decision_log
    WHERE org_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.orgId);

  const parsed = logs.map(l => ({
    ...l,
    metadata: l.metadata ? JSON.parse(l.metadata) : {}
  }));

  res.json({ logs: parsed });
});

// Export log as CSV
app.get('/api/log/export', authMiddleware, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM decision_log
    WHERE org_id = ?
    ORDER BY created_at DESC
  `).all(req.orgId);

  const csv = [
    'Datum,Type,Beschrijving',
    ...logs.map(l => `"${l.created_at}","${l.action_type}","${l.description.replace(/"/g, '""')}"`)
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=beslissingslog.csv');
  res.send(csv);
});

// ============ ANALYTICS ROUTES ============

// Get analytics
app.get('/api/analytics', authMiddleware, (req, res) => {
  // Total waiting
  const totalWaiting = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ? AND status = 'waiting'
  `).get(req.orgId).count;

  // Total entries
  const totalEntries = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist_entries
    WHERE org_id = ?
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
    WHERE org_id = ? AND status = 'waiting'
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

  res.json({
    totalWaiting,
    totalEntries,
    acceptedCount,
    avgWaitTimeDays: Math.round(avgWaitTime),
    dayDemand,
    recentActivity
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WachtlijstHelderheid API running on http://localhost:${PORT}`);
});
