import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  createTestProduct,
  waitForText,
} from '../utils/test-helpers';
import {
  setupTestData,
  cleanupTestData,
  TEST_ADMIN,
  TEST_VARIANTS,
  getInventory,
  resetInventory,
} from '../fixtures/test-data';

test.describe('Admin Panel Access', () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('admin login required for admin routes', async ({ page }) => {
    // Try to access admin panel without authentication
    await page.goto('/admin');
    
    // Should redirect to login page
    await page.waitForURL(/\/admin\/login|\/login/, { timeout: 10000 });
    
    // Login form should be visible
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Login"), button:has-text("Sign in")')).toBeVisible();
  });

  test('admin login with valid credentials', async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin/login');
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_ADMIN.password);
    
    // Submit login
    await page.click('button[type="submit"]:has-text("Login"), button:has-text("Sign in")');
    
    // Should redirect to admin dashboard
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
    
    // Admin dashboard elements should be visible
    const dashboardTitle = page.locator('h1:has-text("Admin"), h1:has-text("Dashboard"), [data-test="admin-title"]').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
  });

  test('admin login with invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Try invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    // Submit login
    await page.click('button[type="submit"]:has-text("Login"), button:has-text("Sign in")');
    
    // Should show error message
    const errorMessage = page.locator('[role="alert"], .error-message, text=/Invalid credentials|Login failed|Incorrect/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should remain on login page
    expect(page.url()).toContain('login');
  });

  test('admin can view products list', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to products management
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Products table/list should be visible
    const productsSection = page.locator('[data-test="products-list"], .products-table, table').first();
    await expect(productsSection).toBeVisible({ timeout: 10000 });
    
    // Should show test products
    await expect(page.locator('text="Test Vinyl"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="Test CD"')).toBeVisible({ timeout: 10000 });
  });

  test('admin can create new product', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to create product
    await page.goto('/admin/products/create');
    
    // Fill product form
    const timestamp = Date.now();
    const newProduct = {
      title: `Test Product ${timestamp}`,
      artist: 'Test Artist',
      description: 'Created via e2e test',
      price: 99.99,
      stock: 10,
    };
    
    await page.fill('input[name="title"]', newProduct.title);
    await page.fill('input[name="artist"]', newProduct.artist);
    await page.fill('textarea[name="description"], input[name="description"]', newProduct.description);
    await page.fill('input[name="price"], input[type="number"][name="price"]', newProduct.price.toString());
    await page.fill('input[name="stock"], input[type="number"][name="stock"]', newProduct.stock.toString());
    
    // Select category if required
    const categorySelect = page.locator('select[name="category"], input[name="category"]').first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categorySelect.selectOption('vinyl');
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add Product")');
    
    // Should redirect to products list or show success message
    const successMessage = page.locator('[role="alert"]:has-text("created"), .success-message, text=/Product created|Successfully added/i').first();
    const isRedirected = await page.waitForURL(/\/admin\/products(?!\/create)/, { timeout: 5000 }).catch(() => false);
    
    expect(await successMessage.isVisible({ timeout: 5000 }).catch(() => false) || isRedirected).toBeTruthy();
    
    // Verify product appears in list
    if (isRedirected) {
      await expect(page.locator(`text="${newProduct.title}"`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('admin can edit existing product', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to products list
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Find test product and click edit
    const productRow = page.locator('tr:has-text("Test Vinyl"), div:has-text("Test Vinyl")').first();
    const editButton = productRow.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label="Edit"]').first();
    
    if (!await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try clicking on the product itself
      await productRow.click();
      await page.waitForURL(/\/admin\/products\/(edit|show)/, { timeout: 10000 });
      
      // Look for edit button on detail page
      const detailEditBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      await detailEditBtn.click();
    } else {
      await editButton.click();
    }
    
    // Should be on edit page
    await page.waitForURL(/\/admin\/products\/edit/, { timeout: 10000 });
    
    // Update price
    const priceInput = page.locator('input[name="price"], input[type="number"][name="price"]').first();
    await priceInput.fill('49.99');
    
    // Save changes
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');
    
    // Should show success message
    const successMessage = page.locator('[role="alert"]:has-text("updated"), .success-message, text=/Product updated|Successfully saved/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('admin can manage inventory', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to inventory management
    await page.goto('/admin/inventory');
    await page.waitForLoadState('networkidle');
    
    // Inventory list should be visible
    const inventorySection = page.locator('[data-test="inventory-list"], .inventory-table, table').first();
    await expect(inventorySection).toBeVisible({ timeout: 10000 });
    
    // Find test product inventory
    const inventoryRow = page.locator('tr:has-text("Black Vinyl"), div:has-text("Black Vinyl")').first();
    await expect(inventoryRow).toBeVisible({ timeout: 10000 });
    
    // Look for receive stock button
    const receiveStockBtn = inventoryRow.locator('button:has-text("Receive"), button:has-text("Add Stock"), [aria-label*="Receive"]').first();
    
    if (await receiveStockBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await receiveStockBtn.click();
      
      // Fill receive stock form
      const quantityInput = page.locator('input[type="number"][name="quantity"], input[placeholder*="Quantity"]').first();
      await quantityInput.fill('20');
      
      // Submit
      const submitBtn = page.locator('button[type="submit"]:has-text("Receive"), button:has-text("Add"), button:has-text("Confirm")').first();
      await submitBtn.click();
      
      // Verify inventory updated
      await page.waitForTimeout(2000);
      const updatedInventory = await getInventory(TEST_VARIANTS.vinyl_black.id);
      expect(updatedInventory.available).toBeGreaterThanOrEqual(20);
    }
  });

  test('admin can view orders', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to orders
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    
    // Orders list should be visible
    const ordersSection = page.locator('[data-test="orders-list"], .orders-table, table').first();
    await expect(ordersSection).toBeVisible({ timeout: 10000 });
    
    // Should have order columns
    await expect(page.locator('text=/Order Number|Order ID/i')).toBeVisible();
    await expect(page.locator('text=/Status|Payment Status/i')).toBeVisible();
    await expect(page.locator('text=/Total|Amount/i')).toBeVisible();
  });

  test('admin can view order details', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to orders
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    
    // Click on first order if any exist
    const firstOrder = page.locator('tr:not(:has(th)), tbody tr').first();
    
    if (await firstOrder.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstOrder.click();
      
      // Should navigate to order detail
      await page.waitForURL(/\/admin\/orders\/(show|view)/, { timeout: 10000 });
      
      // Order details should be visible
      await expect(page.locator('text=/Order Details|Order Information/i')).toBeVisible();
      await expect(page.locator('text=/Customer|Billing/i')).toBeVisible();
      await expect(page.locator('text=/Items|Products/i')).toBeVisible();
    }
  });

  test('admin can view customers', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to customers
    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');
    
    // Customers list should be visible
    const customersSection = page.locator('[data-test="customers-list"], .customers-table, table').first();
    await expect(customersSection).toBeVisible({ timeout: 10000 });
    
    // Should have customer columns
    await expect(page.locator('text=/Email|Customer/i')).toBeVisible();
    await expect(page.locator('text=/Orders|Purchases/i')).toBeVisible();
  });

  test('admin can view audit logs', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    
    // Audit logs should be visible
    const auditSection = page.locator('[data-test="audit-logs"], .audit-table, table').first();
    await expect(auditSection).toBeVisible({ timeout: 10000 });
    
    // Should have audit log columns
    await expect(page.locator('text=/Event|Action/i')).toBeVisible();
    await expect(page.locator('text=/Timestamp|Date/i')).toBeVisible();
  });

  test('admin logout', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Find logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")').first();
    
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      
      // Confirm logout if dialog appears
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      
      // Should redirect to login or home page
      await page.waitForURL(/\/(login|admin\/login|$)/, { timeout: 10000 });
      
      // Try accessing admin again - should require login
      await page.goto('/admin');
      await page.waitForURL(/\/admin\/login|\/login/, { timeout: 10000 });
    }
  });

  test('admin session timeout handling', async ({ page }) => {
    await loginAsAdmin(page, TEST_ADMIN.email, TEST_ADMIN.password);
    
    // Clear session/cookies to simulate timeout
    await page.context().clearCookies();
    
    // Try to access admin page
    await page.goto('/admin/products');
    
    // Should redirect to login
    await page.waitForURL(/\/admin\/login|\/login/, { timeout: 10000 });
    
    // Should show session expired message (optional)
    const sessionMessage = page.locator('text=/Session expired|Please login again/i').first();
    // This is optional - not all apps show this message
    if (await sessionMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sessionMessage).toBeVisible();
    }
  });
});