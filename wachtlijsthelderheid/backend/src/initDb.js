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
  child_name TEXT NOT NULL,
  child_birthdate DATE,
  preferred_days TEXT NOT NULL, -- JSON array like ["MA","WO","VR"]
  desired_start_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, matched, accepted, removed
  access_code TEXT UNIQUE NOT NULL,
  priority_factors JSON, -- {"has_sibling": true, "single_parent": false, "custom": ""}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

-- Decision log for audit trail
CREATE TABLE IF NOT EXISTS decision_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'entry_added', 'entry_updated', 'entry_removed', 'spot_created', 'proposal_sent', 'proposal_accepted', 'proposal_rejected', 'rule_updated'
  description TEXT NOT NULL,
  related_entry_id INTEGER,
  related_spot_id INTEGER,
  related_match_id INTEGER,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_org ON waitlist_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_access_code ON waitlist_entries(access_code);
CREATE INDEX IF NOT EXISTS idx_spots_org ON available_spots(org_id);
CREATE INDEX IF NOT EXISTS idx_matches_spot ON matches(spot_id);
CREATE INDEX IF NOT EXISTS idx_matches_entry ON matches(entry_id);
CREATE INDEX IF NOT EXISTS idx_log_org ON decision_log(org_id);
`;

// Execute schema
db.exec(schema);

console.log('✅ Database initialized successfully at:', dbPath);

db.close();
