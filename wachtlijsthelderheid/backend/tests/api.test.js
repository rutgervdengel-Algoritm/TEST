/**
 * Backend API Regression Tests
 * Run with: npm test
 */

const http = require('http');
const assert = require('assert');

const API_BASE = process.env.API_URL || 'http://localhost:3001';

// Test state
let authToken = null;
let testOrgId = null;
let testEntryId = null;
let testAccessCode = null;

// Parent standalone test state
let parentToken = null;
let testParentId = null;
let testStandaloneRegId = null;

// Helper function for API calls
async function apiCall(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test definitions
const tests = [
  {
    name: 'Health check - API is running',
    run: async () => {
      const res = await apiCall('GET', '/api/health');
      // Even if no health endpoint, server should respond
      assert.ok(res.status < 500, 'Server should be running');
    },
  },
  {
    name: 'Register - Create new organization',
    run: async () => {
      const uniqueEmail = `test-${Date.now()}@test.nl`;
      const res = await apiCall('POST', '/api/auth/register', {
        name: 'Test Kinderdagverblijf',
        email: uniqueEmail,
        password: 'test123',
        type: 'KDV',
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.token, 'Should return auth token');
      assert.ok(res.body.organization, 'Should return organization');
      authToken = res.body.token;
      testOrgId = res.body.organization.id;
    },
  },
  {
    name: 'Auth - Get current user (me)',
    run: async () => {
      const res = await apiCall('GET', '/api/auth/me', null, authToken);
      assert.strictEqual(res.status, 200, 'Should return current user');
      assert.ok(res.body.organization, 'Should have organization');
    },
  },
  {
    name: 'Rules - Get priority rules',
    run: async () => {
      const res = await apiCall('GET', '/api/rules', null, authToken);
      assert.strictEqual(res.status, 200, 'Should return rules');
      assert.ok(Array.isArray(res.body.rules), 'Should return rules array');
    },
  },
  {
    name: 'Entries - Create waitlist entry',
    run: async () => {
      const res = await apiCall('POST', '/api/entries', {
        parent_name: 'Test Ouder',
        parent_email: 'ouder@test.nl',
        child_name: 'Test Kind',
        child_birthdate: '2023-01-15',
        preferred_days: ['MA', 'WO', 'VR'],
        desired_start_date: '2026-09-01',
        notes: 'Test inschrijving',
        priority_factors: { has_sibling: false, single_parent: false },
      }, authToken);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.entry, 'Should return entry');
      assert.ok(res.body.entry.access_code, 'Should have access code');
      testEntryId = res.body.entry.id;
      testAccessCode = res.body.entry.access_code;
    },
  },
  {
    name: 'Entries - Get all entries',
    run: async () => {
      const res = await apiCall('GET', '/api/entries', null, authToken);
      assert.strictEqual(res.status, 200, 'Should return entries');
      assert.ok(Array.isArray(res.body.entries), 'Should return entries array');
      assert.ok(res.body.entries.length > 0, 'Should have at least one entry');
    },
  },
  {
    name: 'Entries - Get single entry',
    run: async () => {
      const res = await apiCall('GET', `/api/entries/${testEntryId}`, null, authToken);
      assert.strictEqual(res.status, 200, 'Should return entry');
      assert.strictEqual(res.body.entry.id, testEntryId, 'Should return correct entry');
    },
  },
  {
    name: 'Portal - Access with code (no auth)',
    run: async () => {
      const res = await apiCall('GET', `/api/portal/${testAccessCode}`);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.entry, 'Should return entry');
      assert.ok(res.body.position, 'Should return position info');
    },
  },
  {
    name: 'Analytics - Get statistics',
    run: async () => {
      const res = await apiCall('GET', '/api/analytics', null, authToken);
      assert.strictEqual(res.status, 200, 'Should return analytics');
      assert.ok(typeof res.body.totalWaiting === 'number', 'Should have totalWaiting');
    },
  },
  {
    name: 'Spots - Create available spot',
    run: async () => {
      const res = await apiCall('POST', '/api/spots', {
        days: ['MA', 'WO'],
        start_date: '2026-09-01',
        num_spots: 1,
      }, authToken);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.spot, 'Should return spot');
      assert.ok(res.body.candidates, 'Should return candidates');
    },
  },
  {
    name: 'Log - Get decision log',
    run: async () => {
      const res = await apiCall('GET', '/api/log', null, authToken);
      assert.strictEqual(res.status, 200, 'Should return log');
      assert.ok(Array.isArray(res.body.logs), 'Should return logs array');
    },
  },
  {
    name: 'Entries - Update entry',
    run: async () => {
      const res = await apiCall('PUT', `/api/entries/${testEntryId}`, {
        notes: 'Bijgewerkte notitie',
      }, authToken);
      assert.strictEqual(res.status, 200, 'Should update entry');
      assert.strictEqual(res.body.entry.notes, 'Bijgewerkte notitie', 'Notes should be updated');
    },
  },
  {
    name: 'Entries - Delete entry',
    run: async () => {
      const res = await apiCall('DELETE', `/api/entries/${testEntryId}`, null, authToken);
      assert.strictEqual(res.status, 200, 'Should delete entry');
    },
  },
  {
    name: 'Auth - Reject without token',
    run: async () => {
      const res = await apiCall('GET', '/api/entries');
      assert.strictEqual(res.status, 401, 'Should reject without token');
    },
  },
  // ===== PARENT STANDALONE TESTS =====
  {
    name: 'Parent - Register new parent account',
    run: async () => {
      const uniqueEmail = `parent-${Date.now()}@test.nl`;
      const res = await apiCall('POST', '/api/parent/register', {
        email: uniqueEmail,
        password: 'ouder123',
        name: 'Test Ouder',
        phone: '06-12345678',
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.token, 'Should return auth token');
      assert.ok(res.body.user, 'Should return user');
      assert.strictEqual(res.body.user.name, 'Test Ouder', 'Name should match');
      parentToken = res.body.token;
      testParentId = res.body.user.id;
    },
  },
  {
    name: 'Parent - Login with credentials',
    run: async () => {
      // First register a new user to test login
      const uniqueEmail = `parent-login-${Date.now()}@test.nl`;
      await apiCall('POST', '/api/parent/register', {
        email: uniqueEmail,
        password: 'login123',
        name: 'Login Test',
      });

      const res = await apiCall('POST', '/api/parent/login', {
        email: uniqueEmail,
        password: 'login123',
      });
      assert.strictEqual(res.status, 200, 'Should login successfully');
      assert.ok(res.body.token, 'Should return token');
    },
  },
  {
    name: 'Parent - Get current user (me)',
    run: async () => {
      const res = await apiCall('GET', '/api/parent/me', null, parentToken);
      assert.strictEqual(res.status, 200, 'Should return current user');
      assert.ok(res.body.user, 'Should have user');
      assert.strictEqual(res.body.user.id, testParentId, 'Should return correct user');
    },
  },
  {
    name: 'Parent - Create standalone registration',
    run: async () => {
      const res = await apiCall('POST', '/api/parent/registrations', {
        organization_name: 'Test Kinderdagverblijf De Zonnetjes',
        organization_email: 'info@dezonnetjes.nl',
        organization_phone: '020-1234567',
        organization_address: 'Teststraat 123, Amsterdam',
        child_name: 'Emma',
        child_birthdate: '2024-03-15',
        preferred_days: ['MA', 'DI', 'DO'],
        desired_start_date: '2026-09-01',
        registration_date: '2025-01-15',
        notes: 'Test inschrijving via regressietest',
        status: 'waiting',
      }, parentToken);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.registration, 'Should return registration');
      assert.strictEqual(res.body.registration.child_name, 'Emma', 'Child name should match');
      testStandaloneRegId = res.body.registration.id;
    },
  },
  {
    name: 'Parent - Get all registrations',
    run: async () => {
      const res = await apiCall('GET', '/api/parent/registrations', null, parentToken);
      assert.strictEqual(res.status, 200, 'Should return registrations');
      assert.ok(Array.isArray(res.body.registrations), 'Should return array');
      assert.ok(res.body.registrations.length > 0, 'Should have at least one registration');
    },
  },
  {
    name: 'Parent - Get single registration',
    run: async () => {
      const res = await apiCall('GET', `/api/parent/registrations/${testStandaloneRegId}`, null, parentToken);
      assert.strictEqual(res.status, 200, 'Should return registration');
      assert.strictEqual(res.body.registration.id, testStandaloneRegId, 'Should return correct registration');
      assert.ok(Array.isArray(res.body.emails), 'Should include emails array');
    },
  },
  {
    name: 'Parent - Update registration',
    run: async () => {
      const res = await apiCall('PUT', `/api/parent/registrations/${testStandaloneRegId}`, {
        notes: 'Bijgewerkte notities',
        preferred_days: ['MA', 'WO', 'VR'],
      }, parentToken);
      assert.strictEqual(res.status, 200, 'Should update registration');
      assert.strictEqual(res.body.registration.notes, 'Bijgewerkte notities', 'Notes should be updated');
    },
  },
  {
    name: 'Parent - Get email preview',
    run: async () => {
      const res = await apiCall('GET', `/api/parent/registrations/${testStandaloneRegId}/email-preview`, null, parentToken);
      assert.strictEqual(res.status, 200, `Should return email preview, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.to, 'Should have recipient');
      assert.ok(res.body.subject, 'Should have subject');
      assert.ok(res.body.body, 'Should have body');
    },
  },
  {
    name: 'Parent - Send confirmation (preview mode)',
    run: async () => {
      const res = await apiCall('POST', `/api/parent/registrations/${testStandaloneRegId}/confirm`, null, parentToken);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.ok(res.body.message, 'Should return message');
      assert.ok(res.body.email, 'Should return email info');
    },
  },
  {
    name: 'Parent - Update email template',
    run: async () => {
      const customTemplate = 'Beste {organisatie},\n\nHierbij bevestig ik mijn inschrijving voor {kind_naam}.\n\nMet vriendelijke groet';
      const res = await apiCall('PUT', `/api/parent/registrations/${testStandaloneRegId}/template`, {
        template: customTemplate,
      }, parentToken);
      assert.strictEqual(res.status, 200, `Should update template, got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.template, customTemplate, 'Template should match');
    },
  },
  {
    name: 'Parent - Get dashboard stats',
    run: async () => {
      const res = await apiCall('GET', '/api/parent/dashboard', null, parentToken);
      assert.strictEqual(res.status, 200, 'Should return dashboard');
      assert.ok(res.body.registrations, 'Should have registrations stats');
      assert.ok(typeof res.body.registrations.total === 'number', 'Should have total count');
      assert.ok(typeof res.body.needsConfirmation === 'number', 'Should have needsConfirmation count');
    },
  },
  {
    name: 'Parent - Link access code (invalid code)',
    run: async () => {
      const res = await apiCall('POST', `/api/parent/registrations/${testStandaloneRegId}/link`, {
        accessCode: 'WL-INVALID',
      }, parentToken);
      // Should fail with invalid code
      assert.strictEqual(res.status, 404, 'Should reject invalid access code');
    },
  },
  {
    name: 'Parent - Get email history',
    run: async () => {
      const res = await apiCall('GET', `/api/parent/registrations/${testStandaloneRegId}/emails`, null, parentToken);
      assert.strictEqual(res.status, 200, 'Should return email history');
      assert.ok(Array.isArray(res.body.emails), 'Should return array');
      // Should have at least one email from earlier confirmation test
      assert.ok(res.body.emails.length > 0, 'Should have at least one email');
    },
  },
  {
    name: 'Parent - Delete registration',
    run: async () => {
      // Create a new registration to delete
      const createRes = await apiCall('POST', '/api/parent/registrations', {
        organization_name: 'Te Verwijderen KDV',
        child_name: 'Test Kind',
      }, parentToken);
      const deleteId = createRes.body.registration.id;

      const res = await apiCall('DELETE', `/api/parent/registrations/${deleteId}`, null, parentToken);
      assert.strictEqual(res.status, 200, 'Should delete registration');

      // Verify it's gone
      const verifyRes = await apiCall('GET', `/api/parent/registrations/${deleteId}`, null, parentToken);
      assert.strictEqual(verifyRes.status, 404, 'Should not find deleted registration');
    },
  },
  {
    name: 'Parent - Reject without token',
    run: async () => {
      const res = await apiCall('GET', '/api/parent/registrations');
      assert.strictEqual(res.status, 401, 'Should reject without token');
    },
  },
  {
    name: 'Parent - Reject with org token',
    run: async () => {
      // Try to access parent routes with organization token
      const res = await apiCall('GET', '/api/parent/registrations', null, authToken);
      assert.strictEqual(res.status, 401, 'Should reject organization token');
    },
  },
];

// Run tests
async function runTests() {
  console.log('\n🧪 Running Backend API Tests\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    try {
      await test.run();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
      failures.push({ name: test.name, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failures.length > 0) {
    console.log('Failed tests:');
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
    process.exit(1);
  }

  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
