import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for e2e tests
 */

export const TEST_CREDIT_CARD = {
  number: '4242424242424242',
  expiry: '12/34',
  cvc: '123',
  postalCode: '42424',
};

export const TEST_CUSTOMER = {
  email: `test-${Date.now()}@grimforge.test`,
  firstName: 'Test',
  lastName: 'Customer',
  phone: '+61412345678',
  address: {
    line1: '123 Test Street',
    line2: 'Suite 100',
    city: 'Sydney',
    state: 'NSW',
    postalCode: '2000',
    country: 'AU',
  },
};

/**
 * Wait for Stripe iframe to load
 */
export async function waitForStripeFrame(page: Page) {
  const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();
  await expect(stripeFrame.locator('body')).toBeVisible({ timeout: 30000 });
  return stripeFrame;
}

/**
 * Fill Stripe checkout form
 */
export async function fillStripeCheckout(page: Page, options = {}) {
  const { 
    email = TEST_CUSTOMER.email,
    cardNumber = TEST_CREDIT_CARD.number,
    expiry = TEST_CREDIT_CARD.expiry,
    cvc = TEST_CREDIT_CARD.cvc,
    name = `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`,
    postalCode = TEST_CREDIT_CARD.postalCode,
    ...address
  } = options;

  // Wait for Stripe checkout page to load
  await page.waitForLoadState('networkidle');
  
  // Fill email if present
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(email);
  }

  // Fill card details in iframe
  const cardFrame = page.frameLocator('iframe[title*="card"], iframe[name*="card-element"]').first();
  
  // Card number
  const cardNumberInput = cardFrame.locator('input[name="cardnumber"], input[placeholder*="Card number"]');
  await cardNumberInput.fill(cardNumber);
  
  // Expiry
  const expiryInput = cardFrame.locator('input[name="exp-date"], input[placeholder*="MM / YY"]');
  await expiryInput.fill(expiry);
  
  // CVC
  const cvcInput = cardFrame.locator('input[name="cvc"], input[placeholder*="CVC"]');
  await cvcInput.fill(cvc);
  
  // Postal code
  const postalInput = cardFrame.locator('input[name="postal"], input[placeholder*="Postal"]');
  if (await postalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await postalInput.fill(postalCode);
  }

  // Fill name if present
  const nameInput = page.locator('input[name="name"], input[placeholder*="Name on card"]');
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill(name);
  }

  // Fill billing address if required
  if (await page.locator('[data-testid="billing-address"]').isVisible({ timeout: 2000 }).catch(() => false)) {
    await fillBillingAddress(page, address);
  }

  // Fill shipping address if required
  if (await page.locator('[data-testid="shipping-address"]').isVisible({ timeout: 2000 }).catch(() => false)) {
    await fillShippingAddress(page, address);
  }
}

/**
 * Fill billing address
 */
export async function fillBillingAddress(page: Page, address = TEST_CUSTOMER.address) {
  const addressSection = page.locator('[data-testid="billing-address"], form').first();
  
  await addressSection.locator('input[name*="line1"], input[placeholder*="Address"]').fill(address.line1);
  
  if (address.line2) {
    const line2Input = addressSection.locator('input[name*="line2"], input[placeholder*="Apartment"]');
    if (await line2Input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await line2Input.fill(address.line2);
    }
  }
  
  await addressSection.locator('input[name*="city"], input[placeholder*="City"]').fill(address.city);
  await addressSection.locator('input[name*="state"], input[placeholder*="State"]').fill(address.state);
  await addressSection.locator('input[name*="postal"], input[placeholder*="Postal"]').fill(address.postalCode);
  
  // Select country if dropdown exists
  const countrySelect = addressSection.locator('select[name*="country"]');
  if (await countrySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await countrySelect.selectOption(address.country);
  }
}

/**
 * Fill shipping address
 */
export async function fillShippingAddress(page: Page, address = TEST_CUSTOMER.address) {
  const addressSection = page.locator('[data-testid="shipping-address"], [aria-label*="Shipping"]').first();
  
  await addressSection.locator('input[name*="line1"], input[placeholder*="Address"]').fill(address.line1);
  
  if (address.line2) {
    const line2Input = addressSection.locator('input[name*="line2"], input[placeholder*="Apartment"]');
    if (await line2Input.isVisible({ timeout: 1000 }).catch(() => false)) {
      await line2Input.fill(address.line2);
    }
  }
  
  await addressSection.locator('input[name*="city"], input[placeholder*="City"]').fill(address.city);
  await addressSection.locator('input[name*="state"], input[placeholder*="State"]').fill(address.state);
  await addressSection.locator('input[name*="postal"], input[placeholder*="Postal"]').fill(address.postalCode);
  
  // Select country if dropdown exists
  const countrySelect = addressSection.locator('select[name*="country"]');
  if (await countrySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await countrySelect.selectOption(address.country);
  }
}

/**
 * Wait for navigation with improved error handling
 */
export async function waitForNavigation(page: Page, url: string | RegExp, timeout = 30000) {
  await Promise.race([
    page.waitForURL(url, { timeout }),
    page.waitForLoadState('networkidle', { timeout }),
  ]);
}

/**
 * Get product inventory from page
 */
export async function getInventoryCount(page: Page, selector = '[data-test="inventory-count"]'): Promise<number> {
  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible', timeout: 5000 });
  const text = await element.textContent();
  return parseInt(text?.replace(/\D/g, '') || '0', 10);
}

/**
 * Add product to cart
 */
export async function addProductToCart(page: Page, quantity = 1) {
  // Click add to cart button
  const addToCartBtn = page.locator('button:has-text("Add to Cart"), button[data-test="add-to-cart"]').first();
  await addToCartBtn.click();
  
  // Handle quantity if quantity selector exists
  if (quantity > 1) {
    const quantityInput = page.locator('input[type="number"][name*="quantity"], input[data-test="quantity"]');
    if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quantityInput.fill(quantity.toString());
    }
  }
  
  // Confirm if modal appears
  const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Add")').first();
  if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  
  // Wait for cart update
  await page.waitForTimeout(1000);
}

/**
 * Navigate to checkout from cart
 */
export async function proceedToCheckout(page: Page) {
  // Go to cart if not already there
  if (!page.url().includes('/cart')) {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
  }
  
  // Click checkout button
  const checkoutBtn = page.locator('button:has-text("Checkout"), button:has-text("Proceed to Checkout"), a[href*="checkout"]').first();
  await checkoutBtn.click();
  
  // Wait for Stripe redirect or checkout modal
  await page.waitForTimeout(2000);
}

/**
 * Complete Stripe payment
 */
export async function completeStripePayment(page: Page) {
  // Click pay button
  const payButton = page.locator('button[type="submit"]:has-text("Pay"), button:has-text("Complete order")').first();
  await payButton.click();
  
  // Wait for redirect to success page
  await page.waitForURL(/\/(success|order\/success)/, { timeout: 30000 });
}

/**
 * Admin login helper
 */
export async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]:has-text("Login"), button:has-text("Sign in")');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
}

/**
 * Create test product via admin
 */
export async function createTestProduct(page: Page, productData: any) {
  await page.goto('/admin/products/create');
  
  // Fill product form
  await page.fill('input[name="title"]', productData.title);
  await page.fill('input[name="artist"]', productData.artist);
  await page.fill('textarea[name="description"]', productData.description || 'Test product description');
  await page.fill('input[name="price"]', productData.price.toString());
  await page.fill('input[name="stock"]', productData.stock.toString());
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
  
  // Wait for success
  await page.waitForURL(/\/admin\/products(?!\/create)/, { timeout: 10000 });
}

/**
 * Cleanup test data helper
 */
export async function cleanupTestData(page: Page, orderId?: string) {
  if (orderId) {
    // This would typically call an API endpoint to clean up test data
    // For now, we'll just log it
    console.log(`Would cleanup order: ${orderId}`);
  }
}

/**
 * Wait for element with text
 */
export async function waitForText(page: Page, text: string, options = {}) {
  const element = page.locator(`text="${text}"`).first();
  await element.waitFor({ state: 'visible', timeout: 10000, ...options });
  return element;
}

/**
 * Get order details from success page
 */
export async function getOrderDetails(page: Page) {
  const orderNumber = await page.locator('[data-test="order-number"], .order-number').textContent();
  const orderStatus = await page.locator('[data-test="order-status"], .order-status').textContent();
  const orderTotal = await page.locator('[data-test="order-total"], .order-total').textContent();
  
  return {
    orderNumber: orderNumber?.trim(),
    orderStatus: orderStatus?.trim().toLowerCase(),
    orderTotal: orderTotal?.trim(),
  };
}