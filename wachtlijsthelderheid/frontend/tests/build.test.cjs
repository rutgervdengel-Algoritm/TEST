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
