import { chromium, FullConfig } from '@playwright/test';
import { setupTestData, createTestAdmin } from './fixtures/test-data';

/**
 * Global setup for all e2e tests
 * This runs once before all test files
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting global test setup...');
  
  // Setup test data in database
  try {
    console.log('Setting up test data in database...');
    await setupTestData();
    console.log('Test data setup completed');
  } catch (error) {
    console.error('Failed to setup test data:', error);
    throw error;
  }
  
  // Create test admin user if needed
  try {
    console.log('Ensuring test admin user exists...');
    await createTestAdmin();
    console.log('Test admin user ready');
  } catch (error) {
    console.error('Failed to create test admin:', error);
    // Non-fatal - admin tests will be skipped
  }
  
  // Optionally, warm up the application
  if (process.env.PLAYWRIGHT_BASE_URL || config.projects[0]?.use?.baseURL) {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || config.projects[0].use.baseURL;
    console.log(`Warming up application at ${baseURL}...`);
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto(baseURL as string, { timeout: 60000 });
      console.log('Application is ready');
    } catch (error) {
      console.warn('Failed to warm up application:', error);
      // Non-fatal - tests will retry
    } finally {
      await browser.close();
    }
  }
  
  console.log('Global setup completed');
}

export default globalSetup;