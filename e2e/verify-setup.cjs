#!/usr/bin/env node

/**
 * Verify E2E test setup
 */

const fs = require('fs');
const path = require('path');

console.log('Verifying E2E Test Setup...\n');

// Check required files exist
const requiredFiles = [
  'playwright.config.ts',
  'e2e/global-setup.ts',
  'e2e/fixtures/test-data.ts',
  'e2e/utils/test-helpers.ts',
  'e2e/tests/checkout.spec.ts',
  'e2e/tests/products.spec.ts',
  'e2e/tests/cart.spec.ts',
  'e2e/tests/admin.spec.ts',
  '.github/workflows/e2e-tests.yml',
];

let allFilesExist = true;

console.log('Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\nChecking environment variables:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

let allEnvVarsSet = true;
envVars.forEach(envVar => {
  const isSet = !!process.env[envVar];
  console.log(`  ${isSet ? '✓' : '✗'} ${envVar}`);
  if (!isSet) allEnvVarsSet = false;
});

// Check package.json scripts
console.log('\nChecking package.json scripts:');
const packageJson = require(path.join(process.cwd(), 'package.json'));
const requiredScripts = [
  'test:e2e',
  'test:e2e:ui',
  'test:e2e:debug',
  'test:e2e:headed',
  'test:e2e:install',
  'test:e2e:report',
];

let allScriptsExist = true;
requiredScripts.forEach(script => {
  const exists = !!packageJson.scripts[script];
  console.log(`  ${exists ? '✓' : '✗'} npm run ${script}`);
  if (!exists) allScriptsExist = false;
});

// Check Playwright installation
console.log('\nChecking Playwright installation:');
try {
  const { chromium } = require('playwright');
  console.log('  ✓ Playwright is installed');
} catch (error) {
  console.log('  ✗ Playwright is not installed');
  console.log('    Run: npm install @playwright/test');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY:');
console.log('='.repeat(50));

if (allFilesExist && allScriptsExist) {
  console.log('✓ All test files and scripts are in place');
} else {
  console.log('✗ Some test files or scripts are missing');
}

if (allEnvVarsSet) {
  console.log('✓ All required environment variables are set');
} else {
  console.log('✗ Some environment variables are missing');
  console.log('  Create a .env.local file with the required variables');
}

console.log('\nTo run tests:');
console.log('  1. Install Playwright browsers: npm run test:e2e:install');
console.log('  2. Run tests: npm run test:e2e');
console.log('  3. View test UI: npm run test:e2e:ui');
console.log('  4. View test report: npm run test:e2e:report');

process.exit(allFilesExist && allScriptsExist ? 0 : 1);