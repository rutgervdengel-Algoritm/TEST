/**
 * Frontend Build Tests
 * Run with: npm test
 *
 * Tests that the frontend can:
 * 1. Pass TypeScript type checking
 * 2. Build successfully for production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'TypeScript - Type check passes',
    run: () => {
      execSync('npx tsc --noEmit', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
    },
  },
  {
    name: 'Vite - Production build succeeds',
    run: () => {
      execSync('npx vite build', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
    },
  },
  {
    name: 'Build output - dist/index.html exists',
    run: () => {
      const distPath = path.join(__dirname, '..', 'dist', 'index.html');
      if (!fs.existsSync(distPath)) {
        throw new Error('dist/index.html not found');
      }
    },
  },
  {
    name: 'Build output - JS bundle exists',
    run: () => {
      const assetsPath = path.join(__dirname, '..', 'dist', 'assets');
      if (!fs.existsSync(assetsPath)) {
        throw new Error('dist/assets directory not found');
      }
      const files = fs.readdirSync(assetsPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      if (jsFiles.length === 0) {
        throw new Error('No JS bundle found in dist/assets');
      }
    },
  },
  {
    name: 'Build output - CSS bundle exists',
    run: () => {
      const assetsPath = path.join(__dirname, '..', 'dist', 'assets');
      const files = fs.readdirSync(assetsPath);
      const cssFiles = files.filter(f => f.endsWith('.css'));
      if (cssFiles.length === 0) {
        throw new Error('No CSS bundle found in dist/assets');
      }
    },
  },
  {
    name: 'API config - API_BASE is set',
    run: () => {
      const apiPath = path.join(__dirname, '..', 'src', 'utils', 'api.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      if (!content.includes('API_BASE')) {
        throw new Error('API_BASE not found in api.ts');
      }
    },
  },
  // ===== PARENT STANDALONE PAGE TESTS =====
  {
    name: 'Parent pages - ParentLogin.tsx exists',
    run: () => {
      const pagePath = path.join(__dirname, '..', 'src', 'pages', 'ParentLogin.tsx');
      if (!fs.existsSync(pagePath)) {
        throw new Error('ParentLogin.tsx not found');
      }
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (!content.includes('parentApi')) {
        throw new Error('ParentLogin.tsx should use parentApi');
      }
    },
  },
  {
    name: 'Parent pages - ParentDashboardPage.tsx exists',
    run: () => {
      const pagePath = path.join(__dirname, '..', 'src', 'pages', 'ParentDashboardPage.tsx');
      if (!fs.existsSync(pagePath)) {
        throw new Error('ParentDashboardPage.tsx not found');
      }
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (!content.includes('StandaloneRegistration')) {
        throw new Error('ParentDashboardPage.tsx should use StandaloneRegistration type');
      }
    },
  },
  {
    name: 'Parent pages - ParentRegistrationForm.tsx exists',
    run: () => {
      const pagePath = path.join(__dirname, '..', 'src', 'pages', 'ParentRegistrationForm.tsx');
      if (!fs.existsSync(pagePath)) {
        throw new Error('ParentRegistrationForm.tsx not found');
      }
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (!content.includes('parentApi')) {
        throw new Error('ParentRegistrationForm.tsx should use parentApi');
      }
    },
  },
  {
    name: 'Parent pages - ParentRegistrationDetail.tsx exists',
    run: () => {
      const pagePath = path.join(__dirname, '..', 'src', 'pages', 'ParentRegistrationDetail.tsx');
      if (!fs.existsSync(pagePath)) {
        throw new Error('ParentRegistrationDetail.tsx not found');
      }
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (!content.includes('ConfirmationEmail')) {
        throw new Error('ParentRegistrationDetail.tsx should use ConfirmationEmail type');
      }
    },
  },
  {
    name: 'API config - parentApi is exported',
    run: () => {
      const apiPath = path.join(__dirname, '..', 'src', 'utils', 'api.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      if (!content.includes('export const parentApi')) {
        throw new Error('parentApi not exported from api.ts');
      }
    },
  },
  {
    name: 'Routes - Parent routes in App.tsx',
    run: () => {
      const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      const requiredRoutes = [
        '/ouder/login',
        '/ouder/dashboard',
        '/ouder/inschrijving/nieuw',
        '/ouder/inschrijving/:id',
      ];
      for (const route of requiredRoutes) {
        if (!content.includes(route)) {
          throw new Error(`Route ${route} not found in App.tsx`);
        }
      }
    },
  },
  {
    name: 'Types - StandaloneRegistration interface exists',
    run: () => {
      const apiPath = path.join(__dirname, '..', 'src', 'utils', 'api.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      if (!content.includes('export interface StandaloneRegistration')) {
        throw new Error('StandaloneRegistration interface not exported from api.ts');
      }
    },
  },
  {
    name: 'Types - ParentUser interface exists',
    run: () => {
      const apiPath = path.join(__dirname, '..', 'src', 'utils', 'api.ts');
      const content = fs.readFileSync(apiPath, 'utf-8');
      if (!content.includes('export interface ParentUser')) {
        throw new Error('ParentUser interface not exported from api.ts');
      }
    },
  },
];

// Run tests
async function runTests() {
  console.log('\n🧪 Running Frontend Build Tests\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    try {
      test.run();
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

runTests();
