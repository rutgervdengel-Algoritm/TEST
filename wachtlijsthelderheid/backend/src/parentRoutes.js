/**
 * Parent Routes - Ouder Standalone Mode
 * Endpoints for parent users who manage their own registrations
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'wachtlijst-helderheid-secret-key-change-in-production';

// Default email template
const DEFAULT_EMAIL_TEMPLATE = `Onderwerp: Bevestiging inschrijving {kind_naam}

Geachte heer/mevrouw,

Graag bevestig ik dat wij nog steeds interesse hebben in een plek voor {kind_naam} bij uw organisatie.

Inschrijfgegevens:
- Kind: {kind_naam}
- Inschrijfdatum: {inschrijfdatum}
- Gewenste dagen: {gewenste_dagen}
- Gewenste startdatum: {gewenste_startdatum}

Mocht er een plek vrijkomen, dan horen wij dit graag.

Met vriendelijke groet,
{ouder_naam}`;

// Auth middleware for parent users
function parentAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'parent') {
      return res.status(401).json({ error: 'Ongeldig token type' });
    }
    req.parentId = decoded.parentId;
    req.parentEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

// Register parent user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, wachtwoord en naam zijn verplicht' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM parent_users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Dit emailadres is al geregistreerd' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO parent_users (email, password_hash, name, phone)
      VALUES (?, ?, ?, ?)
    `).run(email, passwordHash, name, phone || null);

    const token = jwt.sign(
      { parentId: result.lastInsertRowid, email, type: 'parent' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
        phone: phone || null
      }
    });
  } catch (error) {
    console.error('Parent register error:', error);
    res.status(500).json({ error: 'Registratie mislukt' });
  }
});

// Login parent user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
    }

    const user = db.prepare('SELECT * FROM parent_users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    const token = jwt.sign(
      { parentId: user.id, email: user.email, type: 'parent' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({ error: 'Inloggen mislukt' });
  }
});

// Get current parent user
router.get('/me', parentAuthMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, phone, created_at FROM parent_users WHERE id = ?').get(req.parentId);
    if (!user) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Parent me error:', error);
    res.status(500).json({ error: 'Kon gebruiker niet ophalen' });
  }
});

// Update parent profile
router.put('/me', parentAuthMiddleware, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    const user = db.prepare('SELECT * FROM parent_users WHERE id = ?').get(req.parentId);
    if (!user) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Huidig wachtwoord is verplicht om wachtwoord te wijzigen' });
      }
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Huidig wachtwoord is onjuist' });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      db.prepare('UPDATE parent_users SET password_hash = ? WHERE id = ?').run(newHash, req.parentId);
    }

    // Update profile fields
    if (name || phone !== undefined) {
      db.prepare('UPDATE parent_users SET name = COALESCE(?, name), phone = ? WHERE id = ?')
        .run(name || user.name, phone !== undefined ? phone : user.phone, req.parentId);
    }

    const updatedUser = db.prepare('SELECT id, email, name, phone, created_at FROM parent_users WHERE id = ?').get(req.parentId);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Parent update error:', error);
    res.status(500).json({ error: 'Profiel bijwerken mislukt' });
  }
});

// ============================================
// REGISTRATIONS ENDPOINTS
// ============================================

// Get all registrations for parent
router.get('/registrations', parentAuthMiddleware, (req, res) => {
  try {
    const registrations = db.prepare(`
      SELECT
        sr.*,
        ce.last_sent,
        ce.send_count
      FROM standalone_registrations sr
      LEFT JOIN (
        SELECT
          registration_id,
          MAX(sent_at) as last_sent,
          COUNT(*) as send_count
        FROM confirmation_emails
        WHERE status = 'sent'
        GROUP BY registration_id
      ) ce ON ce.registration_id = sr.id
      WHERE sr.parent_user_id = ?
      ORDER BY sr.created_at DESC
    `).all(req.parentId);

    // Parse JSON fields
    const parsed = registrations.map(r => ({
      ...r,
      preferred_days: r.preferred_days ? JSON.parse(r.preferred_days) : [],
      isLinked: r.linked_entry_id !== null,
      confirmationNeeded: r.last_confirmation_sent
        ? (Date.now() - new Date(r.last_confirmation_sent).getTime()) > 30 * 24 * 60 * 60 * 1000
        : true
    }));

    res.json({ registrations: parsed });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Kon inschrijvingen niet ophalen' });
  }
});

// Get single registration
router.get('/registrations/:id', parentAuthMiddleware, (req, res) => {
  try {
    const registration = db.prepare(`
      SELECT * FROM standalone_registrations
      WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!registration) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    // Get email history
    const emails = db.prepare(`
      SELECT * FROM confirmation_emails
      WHERE registration_id = ?
      ORDER BY sent_at DESC
    `).all(req.params.id);

    res.json({
      registration: {
        ...registration,
        preferred_days: registration.preferred_days ? JSON.parse(registration.preferred_days) : [],
        isLinked: registration.linked_entry_id !== null
      },
      emails
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ error: 'Kon inschrijving niet ophalen' });
  }
});

// Create new registration
router.post('/registrations', parentAuthMiddleware, (req, res) => {
  try {
    const {
      organization_name,
      organization_email,
      organization_address,
      organization_phone,
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      registration_date,
      notes,
      status
    } = req.body;

    if (!organization_name || !child_name) {
      return res.status(400).json({ error: 'Organisatienaam en kindnaam zijn verplicht' });
    }

    const result = db.prepare(`
      INSERT INTO standalone_registrations (
        parent_user_id, organization_name, organization_email, organization_address,
        organization_phone, child_name, child_birthdate, preferred_days,
        desired_start_date, registration_date, notes, status, email_template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.parentId,
      organization_name,
      organization_email || null,
      organization_address || null,
      organization_phone || null,
      child_name,
      child_birthdate || null,
      JSON.stringify(preferred_days || []),
      desired_start_date || null,
      registration_date || new Date().toISOString().split('T')[0],
      notes || null,
      status || 'waiting',
      DEFAULT_EMAIL_TEMPLATE
    );

    const registration = db.prepare('SELECT * FROM standalone_registrations WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      registration: {
        ...registration,
        preferred_days: registration.preferred_days ? JSON.parse(registration.preferred_days) : []
      }
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ error: 'Inschrijving aanmaken mislukt' });
  }
});

// Update registration
router.put('/registrations/:id', parentAuthMiddleware, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!existing) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    const {
      organization_name,
      organization_email,
      organization_address,
      organization_phone,
      child_name,
      child_birthdate,
      preferred_days,
      desired_start_date,
      registration_date,
      notes,
      status
    } = req.body;

    db.prepare(`
      UPDATE standalone_registrations SET
        organization_name = COALESCE(?, organization_name),
        organization_email = ?,
        organization_address = ?,
        organization_phone = ?,
        child_name = COALESCE(?, child_name),
        child_birthdate = ?,
        preferred_days = ?,
        desired_start_date = ?,
        registration_date = ?,
        notes = ?,
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      organization_name,
      organization_email !== undefined ? organization_email : existing.organization_email,
      organization_address !== undefined ? organization_address : existing.organization_address,
      organization_phone !== undefined ? organization_phone : existing.organization_phone,
      child_name,
      child_birthdate !== undefined ? child_birthdate : existing.child_birthdate,
      preferred_days ? JSON.stringify(preferred_days) : existing.preferred_days,
      desired_start_date !== undefined ? desired_start_date : existing.desired_start_date,
      registration_date !== undefined ? registration_date : existing.registration_date,
      notes !== undefined ? notes : existing.notes,
      status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM standalone_registrations WHERE id = ?').get(req.params.id);

    res.json({
      registration: {
        ...updated,
        preferred_days: updated.preferred_days ? JSON.parse(updated.preferred_days) : []
      }
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ error: 'Inschrijving bijwerken mislukt' });
  }
});

// Delete registration
router.delete('/registrations/:id', parentAuthMiddleware, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!existing) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    db.prepare('DELETE FROM standalone_registrations WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ error: 'Inschrijving verwijderen mislukt' });
  }
});

// ============================================
// EMAIL TEMPLATE & PREVIEW
// ============================================

// Update email template
router.put('/registrations/:id/template', parentAuthMiddleware, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!existing) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ error: 'Template is verplicht' });
    }

    db.prepare('UPDATE standalone_registrations SET email_template = ? WHERE id = ?')
      .run(template, req.params.id);

    res.json({ success: true, template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Template opslaan mislukt' });
  }
});

// Reset template to default
router.post('/registrations/:id/template/reset', parentAuthMiddleware, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!existing) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    db.prepare('UPDATE standalone_registrations SET email_template = ? WHERE id = ?')
      .run(DEFAULT_EMAIL_TEMPLATE, req.params.id);

    res.json({ success: true, template: DEFAULT_EMAIL_TEMPLATE });
  } catch (error) {
    console.error('Reset template error:', error);
    res.status(500).json({ error: 'Template resetten mislukt' });
  }
});

// Get email preview (fill in variables)
router.get('/registrations/:id/email-preview', parentAuthMiddleware, (req, res) => {
  try {
    const registration = db.prepare(`
      SELECT sr.*, pu.name as parent_name
      FROM standalone_registrations sr
      JOIN parent_users pu ON pu.id = sr.parent_user_id
      WHERE sr.id = ? AND sr.parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!registration) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    const template = registration.email_template || DEFAULT_EMAIL_TEMPLATE;
    const days = registration.preferred_days ? JSON.parse(registration.preferred_days) : [];

    // Replace variables
    const filledTemplate = template
      .replace(/{kind_naam}/g, registration.child_name || '')
      .replace(/{ouder_naam}/g, registration.parent_name || '')
      .replace(/{inschrijfdatum}/g, registration.registration_date || '')
      .replace(/{gewenste_dagen}/g, days.join(', ') || 'Niet opgegeven')
      .replace(/{gewenste_startdatum}/g, registration.desired_start_date || 'Niet opgegeven');

    // Split subject and body
    const lines = filledTemplate.split('\n');
    const subjectLine = lines[0].replace('Onderwerp: ', '');
    const body = lines.slice(2).join('\n');

    res.json({
      to: registration.organization_email || 'Geen email bekend',
      subject: subjectLine,
      body: body,
      template: template
    });
  } catch (error) {
    console.error('Email preview error:', error);
    res.status(500).json({ error: 'Email preview mislukt' });
  }
});

// Send confirmation (currently just logs/saves - no actual sending)
router.post('/registrations/:id/confirm', parentAuthMiddleware, (req, res) => {
  try {
    const { customBody } = req.body || {};

    const registration = db.prepare(`
      SELECT sr.*, pu.name as parent_name
      FROM standalone_registrations sr
      JOIN parent_users pu ON pu.id = sr.parent_user_id
      WHERE sr.id = ? AND sr.parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!registration) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    if (!registration.organization_email) {
      return res.status(400).json({ error: 'Geen email van organisatie bekend' });
    }

    const template = registration.email_template || DEFAULT_EMAIL_TEMPLATE;
    const days = registration.preferred_days ? JSON.parse(registration.preferred_days) : [];

    // Replace variables
    const filledTemplate = template
      .replace(/{kind_naam}/g, registration.child_name || '')
      .replace(/{ouder_naam}/g, registration.parent_name || '')
      .replace(/{inschrijfdatum}/g, registration.registration_date || '')
      .replace(/{gewenste_dagen}/g, days.join(', ') || 'Niet opgegeven')
      .replace(/{gewenste_startdatum}/g, registration.desired_start_date || 'Niet opgegeven');

    const lines = filledTemplate.split('\n');
    const subject = lines[0].replace('Onderwerp: ', '');
    // Use customBody if provided, otherwise use the generated body from template
    const body = customBody || lines.slice(2).join('\n');

    // Log the email (Phase 1: preview only, no actual sending)
    db.prepare(`
      INSERT INTO confirmation_emails (registration_id, recipient_email, subject, body, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, registration.organization_email, subject, body, 'preview');

    // Update last confirmation sent
    db.prepare(`
      UPDATE standalone_registrations SET last_confirmation_sent = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true,
      message: 'Bevestiging opgeslagen (email verzending komt in volgende versie)',
      email: {
        to: registration.organization_email,
        subject,
        body
      }
    });
  } catch (error) {
    console.error('Confirm error:', error);
    res.status(500).json({ error: 'Bevestiging opslaan mislukt' });
  }
});

// Get email history
router.get('/registrations/:id/emails', parentAuthMiddleware, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!existing) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    const emails = db.prepare(`
      SELECT * FROM confirmation_emails
      WHERE registration_id = ?
      ORDER BY sent_at DESC
    `).all(req.params.id);

    res.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Email geschiedenis ophalen mislukt' });
  }
});

// ============================================
// LINK ACCESS CODE (for later)
// ============================================

// Link registration to organization via access code
router.post('/registrations/:id/link', parentAuthMiddleware, (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ error: 'Toegangscode is verplicht' });
    }

    const registration = db.prepare(`
      SELECT * FROM standalone_registrations WHERE id = ? AND parent_user_id = ?
    `).get(req.params.id, req.parentId);

    if (!registration) {
      return res.status(404).json({ error: 'Inschrijving niet gevonden' });
    }

    if (registration.linked_entry_id) {
      return res.status(400).json({ error: 'Inschrijving is al gekoppeld' });
    }

    // Find the waitlist entry with this access code
    const entry = db.prepare(`
      SELECT we.*, o.name as org_name
      FROM waitlist_entries we
      JOIN organizations o ON o.id = we.org_id
      WHERE we.access_code = ?
    `).get(accessCode);

    if (!entry) {
      return res.status(404).json({ error: 'Ongeldige toegangscode' });
    }

    // Link the registration
    db.prepare(`
      UPDATE standalone_registrations
      SET linked_entry_id = ?, linked_org_id = ?, linked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(entry.id, entry.org_id, req.params.id);

    // Also link the parent user to the waitlist entry
    db.prepare(`
      UPDATE waitlist_entries SET parent_user_id = ? WHERE id = ?
    `).run(req.parentId, entry.id);

    res.json({
      success: true,
      message: `Gekoppeld aan ${entry.org_name}`,
      linkedEntry: {
        id: entry.id,
        organization: entry.org_name,
        accessCode: entry.access_code
      }
    });
  } catch (error) {
    console.error('Link error:', error);
    res.status(500).json({ error: 'Koppelen mislukt' });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/dashboard', parentAuthMiddleware, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'offered' THEN 1 ELSE 0 END) as offered,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN linked_entry_id IS NOT NULL THEN 1 ELSE 0 END) as linked
      FROM standalone_registrations
      WHERE parent_user_id = ?
    `).get(req.parentId);

    const emailStats = db.prepare(`
      SELECT COUNT(*) as total_emails
      FROM confirmation_emails ce
      JOIN standalone_registrations sr ON sr.id = ce.registration_id
      WHERE sr.parent_user_id = ?
    `).get(req.parentId);

    const needsConfirmation = db.prepare(`
      SELECT COUNT(*) as count
      FROM standalone_registrations
      WHERE parent_user_id = ?
      AND (last_confirmation_sent IS NULL
           OR last_confirmation_sent < datetime('now', '-30 days'))
      AND status = 'waiting'
    `).get(req.parentId);

    res.json({
      registrations: stats,
      emails: emailStats,
      needsConfirmation: needsConfirmation.count
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Dashboard laden mislukt' });
  }
});

module.exports = router;
