const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const schema = `
-- Organizations (childcare locations)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'KDV', -- KDV or BSO
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Waitlist entries (children on the waitlist)
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  parent_name TEXT NOT NULL,
  parent_email TEXT,
  parent_phone TEXT,
  child_name TEXT NOT NULL,
  child_birthdate DATE,
  preferred_days TEXT NOT NULL, -- JSON array like ["MA","WO","VR"]
  desired_start_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, matched, accepted, removed, pending_confirmation, expired, archived
  access_code TEXT UNIQUE NOT NULL,
  priority_factors JSON, -- {"has_sibling": true, "single_parent": false, "custom": ""}
  -- Feature 9: Interest confirmation
  last_confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmation_status TEXT DEFAULT 'active', -- active, pending_confirmation, expired, archived
  -- Feature 9: Multi-waitlist detection
  other_registrations TEXT, -- JSON array of other daycare names
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived_at DATETIME,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Priority rules per organization
CREATE TABLE IF NOT EXISTS priority_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'registration_date', 'sibling', 'single_parent', 'custom'
  weight_percentage INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Available spots at organizations
CREATE TABLE IF NOT EXISTS available_spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  days TEXT NOT NULL, -- JSON array like ["MA","DI"]
  start_date DATE NOT NULL,
  num_spots INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'open', -- open, filled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Matches between spots and entries
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  entry_id INTEGER NOT NULL,
  match_score REAL NOT NULL,
  score_breakdown JSON, -- Detailed breakdown of how score was calculated
  status TEXT DEFAULT 'proposed', -- proposed, accepted, rejected, expired
  proposed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  response_date DATETIME,
  rejection_reason TEXT,
  FOREIGN KEY (spot_id) REFERENCES available_spots(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_id) REFERENCES waitlist_entries(id) ON DELETE CASCADE
);

-- Decision log for audit trail (Feature 5: Enhanced)
CREATE TABLE IF NOT EXISTS decision_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'entry_added', 'entry_updated', 'entry_removed', 'spot_created', 'proposal_sent', 'proposal_accepted', 'proposal_rejected', 'rule_updated', 'interest_confirmed', 'entry_expired', 'entry_archived', 'import', 'export'
  category TEXT DEFAULT 'general', -- inschrijving, matching, regelwijziging, archivering, import_export, system
  description TEXT NOT NULL,
  related_entry_id INTEGER,
  related_spot_id INTEGER,
  related_match_id INTEGER,
  employee_name TEXT, -- Feature 5: Who performed action
  reason TEXT, -- Feature 5: Optional reason for decision
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Parent users (ouder accounts - standalone)
CREATE TABLE IF NOT EXISTS parent_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Standalone registrations (niet-gekoppelde inschrijvingen)
CREATE TABLE IF NOT EXISTS standalone_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_user_id INTEGER NOT NULL,
  organization_name TEXT NOT NULL,
  organization_email TEXT,
  organization_address TEXT,
  organization_phone TEXT,
  child_name TEXT NOT NULL,
  child_birthdate DATE,
  preferred_days TEXT, -- JSON array like ["MA","WO","VR"]
  desired_start_date DATE,
  registration_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, offered, accepted, rejected
  email_template TEXT,
  last_confirmation_sent DATETIME,
  -- Koppeling met organisatie (NULL = standalone, gevuld = gekoppeld)
  linked_entry_id INTEGER,
  linked_org_id INTEGER,
  linked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_user_id) REFERENCES parent_users(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_entry_id) REFERENCES waitlist_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (linked_org_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Confirmation emails log
CREATE TABLE IF NOT EXISTS confirmation_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent', -- sent, failed, preview
  FOREIGN KEY (registration_id) REFERENCES standalone_registrations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_org ON waitlist_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_confirmation_status ON waitlist_entries(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_entries_access_code ON waitlist_entries(access_code);
CREATE INDEX IF NOT EXISTS idx_entries_last_confirmed ON waitlist_entries(last_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_spots_org ON available_spots(org_id);
CREATE INDEX IF NOT EXISTS idx_matches_spot ON matches(spot_id);
CREATE INDEX IF NOT EXISTS idx_matches_entry ON matches(entry_id);
CREATE INDEX IF NOT EXISTS idx_log_org ON decision_log(org_id);
CREATE INDEX IF NOT EXISTS idx_log_category ON decision_log(category);
CREATE INDEX IF NOT EXISTS idx_log_action_type ON decision_log(action_type);
CREATE INDEX IF NOT EXISTS idx_log_created_at ON decision_log(created_at);
CREATE INDEX IF NOT EXISTS idx_parent_users_email ON parent_users(email);
CREATE INDEX IF NOT EXISTS idx_standalone_reg_parent ON standalone_registrations(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_standalone_reg_linked ON standalone_registrations(linked_entry_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_emails_reg ON confirmation_emails(registration_id);
`;

// Execute schema
db.exec(schema);

// Add new columns if they don't exist (for existing databases)
const migrations = [
  // Feature 9: Interest confirmation columns
  `ALTER TABLE waitlist_entries ADD COLUMN last_confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE waitlist_entries ADD COLUMN confirmation_status TEXT DEFAULT 'active'`,
  `ALTER TABLE waitlist_entries ADD COLUMN other_registrations TEXT`,
  `ALTER TABLE waitlist_entries ADD COLUMN archived_at DATETIME`,
  `ALTER TABLE waitlist_entries ADD COLUMN parent_phone TEXT`,
  // Feature 5: Decision log enhancements
  `ALTER TABLE decision_log ADD COLUMN category TEXT DEFAULT 'general'`,
  `ALTER TABLE decision_log ADD COLUMN employee_name TEXT`,
  `ALTER TABLE decision_log ADD COLUMN reason TEXT`,
  // Organization type
  `ALTER TABLE organizations ADD COLUMN type TEXT DEFAULT 'KDV'`,
  // Priority rules active flag
  `ALTER TABLE priority_rules ADD COLUMN is_active INTEGER DEFAULT 1`,
  // Parent user linking
  `ALTER TABLE waitlist_entries ADD COLUMN parent_user_id INTEGER`,
];

for (const migration of migrations) {
  try {
    db.exec(migration);
  } catch (e) {
    // Column already exists, ignore
  }
}

// Update existing entries to have confirmation_status if null
db.exec(`UPDATE waitlist_entries SET confirmation_status = 'active' WHERE confirmation_status IS NULL`);
db.exec(`UPDATE waitlist_entries SET last_confirmed_at = created_at WHERE last_confirmed_at IS NULL`);

console.log('Database initialized successfully at:', dbPath);

db.close();
