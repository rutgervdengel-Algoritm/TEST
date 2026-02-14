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
