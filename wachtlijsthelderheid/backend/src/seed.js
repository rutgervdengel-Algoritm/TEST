const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM decision_log;
    DELETE FROM matches;
    DELETE FROM available_spots;
    DELETE FROM priority_rules;
    DELETE FROM waitlist_entries;
    DELETE FROM organizations;
  `);

  // Create organizations
  const password1 = await bcrypt.hash('demo123', 10);
  const password2 = await bcrypt.hash('test456', 10);

  const org1 = db.prepare(`
    INSERT INTO organizations (name, email, password_hash)
    VALUES ('Kinderdagverblijf De Zonnestraal', 'admin@zonnestraal.nl', ?)
  `).run(password1);

  const org2 = db.prepare(`
    INSERT INTO organizations (name, email, password_hash)
    VALUES ('BSO Het Speelparadijs', 'beheer@speelparadijs.nl', ?)
  `).run(password2);

  console.log('✅ Created 2 organizations');

  // Create priority rules for org1
  const ruleStmt = db.prepare(`
    INSERT INTO priority_rules (org_id, rule_name, rule_type, weight_percentage, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  ruleStmt.run(org1.lastInsertRowid, 'Inschrijfdatum', 'registration_date', 50, 'Wie het eerst komt, het eerst maalt');
  ruleStmt.run(org1.lastInsertRowid, 'Broertje/zusje', 'sibling', 30, 'Voorrang voor kinderen met broertje/zusje op locatie');
  ruleStmt.run(org1.lastInsertRowid, 'Alleenstaand ouder', 'single_parent', 20, 'Voorrang voor alleenstaande ouders');

  // Create priority rules for org2
  ruleStmt.run(org2.lastInsertRowid, 'Inschrijfdatum', 'registration_date', 40, 'Wie het eerst komt, het eerst maalt');
  ruleStmt.run(org2.lastInsertRowid, 'Broertje/zusje', 'sibling', 40, 'Voorrang voor kinderen met broertje/zusje op locatie');
  ruleStmt.run(org2.lastInsertRowid, 'Alleenstaand ouder', 'single_parent', 15, 'Voorrang voor alleenstaande ouders');
  ruleStmt.run(org2.lastInsertRowid, 'Medische indicatie', 'custom', 5, 'Kinderen met medische indicatie');

  console.log('✅ Created priority rules');

  // Generate access codes
  function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WL-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create waitlist entries for org1 (Kinderdagverblijf)
  const entryStmt = db.prepare(`
    INSERT INTO waitlist_entries
    (org_id, parent_name, parent_email, child_name, child_birthdate, preferred_days, desired_start_date, notes, status, access_code, priority_factors, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const org1Entries = [
    {
      parent_name: 'Maria van den Berg',
      parent_email: 'maria.vdberg@email.nl',
      child_name: 'Sophie van den Berg',
      child_birthdate: '2023-06-15',
      preferred_days: ['MA', 'WO', 'VR'],
      desired_start_date: '2026-03-01',
      notes: 'Sophie is allergisch voor noten',
      priority_factors: { has_sibling: true, single_parent: false },
      created_at: '2025-09-01 10:30:00'
    },
    {
      parent_name: 'Jan de Vries',
      parent_email: 'j.devries@email.nl',
      child_name: 'Lucas de Vries',
      child_birthdate: '2024-01-20',
      preferred_days: ['MA', 'DI', 'DO'],
      desired_start_date: '2026-02-15',
      notes: '',
      priority_factors: { has_sibling: false, single_parent: true },
      created_at: '2025-09-15 14:00:00'
    },
    {
      parent_name: 'Anna Jansen',
      parent_email: 'anna.jansen@email.nl',
      child_name: 'Emma Jansen',
      child_birthdate: '2023-11-08',
      preferred_days: ['DI', 'WO', 'DO', 'VR'],
      desired_start_date: '2026-02-01',
      notes: 'Graag in dezelfde groep als neefje Tim',
      priority_factors: { has_sibling: false, single_parent: false },
      created_at: '2025-10-01 09:15:00'
    },
    {
      parent_name: 'Peter Bakker',
      parent_email: 'p.bakker@email.nl',
      child_name: 'Sem Bakker',
      child_birthdate: '2024-03-12',
      preferred_days: ['MA', 'WO'],
      desired_start_date: '2026-04-01',
      notes: '',
      priority_factors: { has_sibling: true, single_parent: false },
      created_at: '2025-10-20 11:45:00'
    },
    {
      parent_name: 'Lisa Mulder',
      parent_email: 'lisa.mulder@email.nl',
      child_name: 'Olivia Mulder',
      child_birthdate: '2023-09-25',
      preferred_days: ['MA', 'DI', 'WO', 'DO', 'VR'],
      desired_start_date: '2026-02-01',
      notes: 'Flexibel met dagen, maar voorkeur voor hele week',
      priority_factors: { has_sibling: false, single_parent: true },
      created_at: '2025-11-05 16:30:00'
    },
    {
      parent_name: 'Robert Visser',
      parent_email: 'r.visser@email.nl',
      child_name: 'Daan Visser',
      child_birthdate: '2024-02-28',
      preferred_days: ['DI', 'DO'],
      desired_start_date: '2026-05-01',
      notes: '',
      priority_factors: { has_sibling: false, single_parent: false },
      created_at: '2025-11-20 10:00:00'
    }
  ];

  for (const entry of org1Entries) {
    entryStmt.run(
      org1.lastInsertRowid,
      entry.parent_name,
      entry.parent_email,
      entry.child_name,
      entry.child_birthdate,
      JSON.stringify(entry.preferred_days),
      entry.desired_start_date,
      entry.notes,
      'waiting',
      generateAccessCode(),
      JSON.stringify(entry.priority_factors),
      entry.created_at
    );
  }

  console.log('✅ Created 6 entries for Kinderdagverblijf De Zonnestraal');

  // Create waitlist entries for org2 (BSO)
  const org2Entries = [
    {
      parent_name: 'Sandra Smit',
      parent_email: 's.smit@email.nl',
      child_name: 'Thomas Smit',
      child_birthdate: '2020-04-10',
      preferred_days: ['MA', 'WO', 'VR'],
      desired_start_date: '2026-09-01',
      notes: 'Start na zomervakantie groep 3',
      priority_factors: { has_sibling: true, single_parent: false, custom: '' },
      created_at: '2025-08-01 09:00:00'
    },
    {
      parent_name: 'Erik Kok',
      parent_email: 'erik.kok@email.nl',
      child_name: 'Fleur Kok',
      child_birthdate: '2019-07-22',
      preferred_days: ['DI', 'DO'],
      desired_start_date: '2026-09-01',
      notes: '',
      priority_factors: { has_sibling: false, single_parent: false, custom: '' },
      created_at: '2025-08-15 13:30:00'
    },
    {
      parent_name: 'Michelle de Groot',
      parent_email: 'm.degroot@email.nl',
      child_name: 'Noah de Groot',
      child_birthdate: '2020-01-05',
      preferred_days: ['MA', 'DI', 'WO', 'DO'],
      desired_start_date: '2026-09-01',
      notes: 'Noah heeft ADHD en gebruikt Ritalin',
      priority_factors: { has_sibling: false, single_parent: true, custom: 'ADHD begeleiding nodig' },
      created_at: '2025-09-01 15:00:00'
    },
    {
      parent_name: 'Kevin Bosman',
      parent_email: 'k.bosman@email.nl',
      child_name: 'Lieke Bosman',
      child_birthdate: '2019-11-30',
      preferred_days: ['WO', 'VR'],
      desired_start_date: '2026-09-01',
      notes: '',
      priority_factors: { has_sibling: true, single_parent: false, custom: '' },
      created_at: '2025-09-20 10:45:00'
    }
  ];

  for (const entry of org2Entries) {
    entryStmt.run(
      org2.lastInsertRowid,
      entry.parent_name,
      entry.parent_email,
      entry.child_name,
      entry.child_birthdate,
      JSON.stringify(entry.preferred_days),
      entry.desired_start_date,
      entry.notes,
      'waiting',
      generateAccessCode(),
      JSON.stringify(entry.priority_factors),
      entry.created_at
    );
  }

  console.log('✅ Created 4 entries for BSO Het Speelparadijs');

  // Create some available spots and matches for demo
  const spotStmt = db.prepare(`
    INSERT INTO available_spots (org_id, days, start_date, num_spots, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const spot1 = spotStmt.run(org1.lastInsertRowid, JSON.stringify(['MA', 'WO']), '2026-03-01', 1, 'open');

  console.log('✅ Created 1 available spot');

  // Create decision log entries
  const logStmt = db.prepare(`
    INSERT INTO decision_log (org_id, action_type, description, related_entry_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const entries = db.prepare('SELECT * FROM waitlist_entries WHERE org_id = ?').all(org1.lastInsertRowid);

  for (const entry of entries) {
    logStmt.run(
      org1.lastInsertRowid,
      'entry_added',
      `Nieuwe inschrijving: ${entry.child_name} (ouder: ${entry.parent_name})`,
      entry.id,
      entry.created_at
    );
  }

  logStmt.run(
    org1.lastInsertRowid,
    'spot_created',
    'Nieuwe plek beschikbaar: MA/WO vanaf 2026-03-01',
    null,
    '2026-01-10 09:00:00'
  );

  console.log('✅ Created decision log entries');

  // Print access codes for testing
  console.log('\n📋 Test Accounts:');
  console.log('================');
  console.log('\n🏢 Kinderdagverblijf De Zonnestraal');
  console.log('   Email: admin@zonnestraal.nl');
  console.log('   Password: demo123');

  console.log('\n🏢 BSO Het Speelparadijs');
  console.log('   Email: beheer@speelparadijs.nl');
  console.log('   Password: test456');

  const allEntries = db.prepare('SELECT child_name, access_code, org_id FROM waitlist_entries').all();

  console.log('\n🔑 Access Codes for Parent Portal:');
  console.log('===================================');

  console.log('\nKinderdagverblijf De Zonnestraal:');
  for (const entry of allEntries.filter(e => e.org_id === org1.lastInsertRowid)) {
    console.log(`   ${entry.child_name}: ${entry.access_code}`);
  }

  console.log('\nBSO Het Speelparadijs:');
  for (const entry of allEntries.filter(e => e.org_id === org2.lastInsertRowid)) {
    console.log(`   ${entry.child_name}: ${entry.access_code}`);
  }

  console.log('\n✅ Database seeded successfully!');
}

seed().catch(console.error);
