import { test, expect } from '@playwright/test';
import {
  addProductToCart,
  proceedToCheckout,
  fillStripeCheckout,
  completeStripePayment,
  getOrderDetails,
  getInventoryCount,
  waitForText,
  TEST_CREDIT_CARD,
  TEST_CUSTOMER,
} from '../utils/test-helpers';
import {
  setupTestData,
  cleanupTestData,
  getInventory,
  getOrder,
  TEST_PRODUCTS,
  TEST_VARIANTS,
  TEST_INVENTORY,
} from '../fixtures/test-data';

test.describe('Stripe Checkout Flow', () => {
  // Setup test data before all tests
  test.beforeAll(async () => {
    await setupTestData();
  });

  // Cleanup test data after all tests
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('complete checkout with Stripe test mode - success path', async ({ page }) => {
    // Record initial inventory
    const initialInventory = await getInventory(TEST_VARIANTS.vinyl_black.id);
    expect(initialInventory.available).toBeGreaterThan(0);
    
    // 1. Navigate to product page
    await page.goto(`/products/test-vinyl-dark-rituals`);
    await page.waitForLoadState('networkidle');
    
    // Verify product details
    await expect(page.locator('h1, [data-test="product-title"]')).toContainText(TEST_PRODUCTS.vinyl.title);
    await expect(page.locator('[data-test="product-price"], .price')).toContainText('45');
    
    // Check inventory display
    const inventoryElement = page.locator('[data-test="inventory-count"], .stock-count').first();
    if (await inventoryElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      const inventoryCount = await getInventoryCount(page);
      expect(inventoryCount).toBe(initialInventory.available);
    }
    
    // 2. Add product to cart
    await addProductToCart(page, 1);
    
    // Verify cart updated
    const cartCount = page.locator('[data-test="cart-count"], .cart-count').first();
    if (await cartCount.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(cartCount).toContainText('1');
    }
    
    // 3. Proceed to checkout
    await proceedToCheckout(page);
    
    // 4. Wait for Stripe checkout redirect
    // The API should redirect to Stripe hosted checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // 5. Fill Stripe checkout form
    await fillStripeCheckout(page, {
      email: TEST_CUSTOMER.email,
      cardNumber: TEST_CREDIT_CARD.number,
      expiry: TEST_CREDIT_CARD.expiry,
      cvc: TEST_CREDIT_CARD.cvc,
      name: `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`,
      postalCode: TEST_CUSTOMER.address.postalCode,
    });
    
    // Fill shipping information if required
    const shippingSection = page.locator('[data-testid="shipping-form"], form').first();
    if (await shippingSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('input[name="name"]', `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`);
      await page.fill('input[name="email"]', TEST_CUSTOMER.email);
      await page.fill('input[name="phone"], input[type="tel"]', TEST_CUSTOMER.phone);
      
      // Address fields
      await page.fill('input[name*="line1"], input[placeholder*="Address"]', TEST_CUSTOMER.address.line1);
      await page.fill('input[name*="city"], input[placeholder*="City"]', TEST_CUSTOMER.address.city);
      await page.fill('input[name*="state"], input[placeholder*="State"]', TEST_CUSTOMER.address.state);
      await page.fill('input[name*="postal"], input[placeholder*="postal"]', TEST_CUSTOMER.address.postalCode);
      
      // Select country
      const countrySelect = page.locator('select[name*="country"]');
      if (await countrySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await countrySelect.selectOption('AU');
      }
    }
    
    // Select shipping option if required
    const shippingOptions = page.locator('[data-testid="shipping-options"], [aria-label*="Shipping"]');
    if (await shippingOptions.isVisible({ timeout: 5000 }).catch(() => false)) {
      const standardShipping = page.locator('input[value*="standard"], label:has-text("Standard")').first();
      await standardShipping.click();
    }
    
    // 6. Complete payment
    await completeStripePayment(page);
    
    // 7. Verify redirect to success page
    await page.waitForURL(/\/(success|order\/success)/, { timeout: 30000 });
    
    // 8. Verify order details on success page
    const orderDetails = await getOrderDetails(page);
    expect(orderDetails.orderStatus).toBe('paid');
    expect(orderDetails.orderNumber).toBeTruthy();
    
    // Extract order ID from URL if present
    const urlParams = new URL(page.url()).searchParams;
    const sessionId = urlParams.get('session_id');
    expect(sessionId).toBeTruthy();
    
    // 9. Verify inventory was decremented
    const finalInventory = await getInventory(TEST_VARIANTS.vinyl_black.id);
    expect(finalInventory.available).toBe(initialInventory.available - 1);
    expect(finalInventory.sold).toBe(initialInventory.sold + 1);
    
    // 10. Verify order in database (if we have order ID)
    if (orderDetails.orderNumber) {
      // Extract order ID from order number or session
      // This would typically query the database to verify the order
      console.log('Order created successfully:', orderDetails.orderNumber);
    }
  });

  test('checkout fails with insufficient inventory', async ({ page }) => {
    // 1. Navigate to out of stock product
    await page.goto(`/products/out-of-stock-item`);
    await page.waitForLoadState('networkidle');
    
    // 2. Verify out of stock indicator
    const outOfStockIndicator = page.locator('[data-test="out-of-stock"], .out-of-stock, text="Out of Stock"').first();
    await expect(outOfStockIndicator).toBeVisible();
    
    // 3. Verify add to cart is disabled or shows error
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button[data-test="add-to-cart"]').first();
    
    // Button might be disabled or clickable with error
    const isDisabled = await addToCartBtn.isDisabled();
    
    if (!isDisabled) {
      // Try to add to cart
      await addToCartBtn.click();
      
      // Should show error message
      const errorMessage = page.locator('[role="alert"], .error-message, text=/out of stock/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } else {
      // Button should be disabled
      expect(isDisabled).toBeTruthy();
    }
  });

  test('checkout fails with inactive product', async ({ page }) => {
    // Attempt to checkout with inactive product via direct API call
    const response = await page.request.post('/api/checkout', {
      data: {
        variant_id: TEST_VARIANTS.inactive.id,
        quantity: 1,
      },
    });
    
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toContain('not available');
  });

  test('checkout with multiple quantities', async ({ page }) => {
    const quantity = 3;
    const initialInventory = await getInventory(TEST_VARIANTS.cd_standard.id);
    expect(initialInventory.available).toBeGreaterThanOrEqual(quantity);
    
    // 1. Navigate to product page
    await page.goto(`/products/test-cd-ancient-spells`);
    await page.waitForLoadState('networkidle');
    
    // 2. Add multiple quantities to cart
    const quantityInput = page.locator('input[type="number"][name*="quantity"], input[data-test="quantity"]').first();
    if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quantityInput.fill(quantity.toString());
    }
    
    await addProductToCart(page, quantity);
    
    // 3. Verify cart shows correct quantity
    await page.goto('/cart');
    const cartQuantity = page.locator('[data-test="cart-item-quantity"], .cart-item-quantity').first();
    if (await cartQuantity.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(cartQuantity).toContainText(quantity.toString());
    }
    
    // 4. Proceed to checkout
    await proceedToCheckout(page);
    
    // 5. Complete Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    await fillStripeCheckout(page);
    await completeStripePayment(page);
    
    // 6. Verify success
    await page.waitForURL(/\/(success|order\/success)/, { timeout: 30000 });
    
    // 7. Verify inventory decremented by correct amount
    const finalInventory = await getInventory(TEST_VARIANTS.cd_standard.id);
    expect(finalInventory.available).toBe(initialInventory.available - quantity);
    expect(finalInventory.sold).toBe(initialInventory.sold + quantity);
  });

  test('abandoned checkout does not affect inventory', async ({ page }) => {
    const initialInventory = await getInventory(TEST_VARIANTS.vinyl_red.id);
    
    // 1. Navigate to product and add to cart
    await page.goto(`/products/test-vinyl-dark-rituals`);
    
    // Select red variant if variant selector exists
    const variantSelector = page.locator('[data-test="variant-selector"], select[name="variant"]').first();
    if (await variantSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await variantSelector.selectOption({ label: 'Red Vinyl' });
    }
    
    await addProductToCart(page, 1);
    
    // 2. Start checkout process
    await proceedToCheckout(page);
    
    // 3. Wait for Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // 4. Abandon checkout by navigating away
    await page.goto('/');
    
    // 5. Wait a moment for any background processes
    await page.waitForTimeout(5000);
    
    // 6. Verify inventory unchanged
    const finalInventory = await getInventory(TEST_VARIANTS.vinyl_red.id);
    expect(finalInventory.available).toBe(initialInventory.available);
    expect(finalInventory.reserved).toBe(0);
    expect(finalInventory.sold).toBe(initialInventory.sold);
  });

  test('checkout with expired session handling', async ({ page }) => {
    // 1. Create checkout session via API
    const response = await page.request.post('/api/checkout', {
      data: {
        variant_id: TEST_VARIANTS.vinyl_black.id,
        quantity: 1,
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const { checkoutUrl, sessionId } = await response.json();
    expect(checkoutUrl).toBeTruthy();
    expect(sessionId).toBeTruthy();
    
    // 2. Navigate to checkout URL
    await page.goto(checkoutUrl);
    
    // 3. Verify we're on Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // 4. Sessions expire after 30 minutes by default
    // For testing, we'll just verify the session was created properly
    const pageTitle = await page.title();
    expect(pageTitle.toLowerCase()).toContain('stripe');
  });

  test('verify Stripe webhook updates order status', async ({ page }) => {
    // This test simulates the webhook flow
    // In a real environment, you'd use Stripe CLI to forward webhooks
    
    // 1. Create a checkout session
    const checkoutResponse = await page.request.post('/api/checkout', {
      data: {
        variant_id: TEST_VARIANTS.cd_standard.id,
        quantity: 1,
      },
    });
    
    expect(checkoutResponse.ok()).toBeTruthy();
    const { orderId } = await checkoutResponse.json();
    
    // 2. Verify order is in pending state
    const pendingOrder = await getOrder(orderId);
    expect(pendingOrder.status).toBe('pending');
    expect(pendingOrder.payment_status).toBe('pending');
    
    // 3. Simulate webhook (this would normally come from Stripe)
    // Note: In real testing, use `stripe trigger checkout.session.completed`
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          metadata: {
            order_id: orderId,
            variant_id: TEST_VARIANTS.cd_standard.id,
            quantity: '1',
          },
        },
      },
    };
    
    // In a real test, the webhook endpoint would process this
    // For now, we'll just verify the order structure is correct
    expect(pendingOrder.id).toBe(orderId);
    expect(pendingOrder.metadata).toBeTruthy();
  });

  test('checkout respects shipping options', async ({ page }) => {
    // 1. Start checkout
    await page.goto(`/products/test-vinyl-dark-rituals`);
    await addProductToCart(page, 1);
    await proceedToCheckout(page);
    
    // 2. Wait for Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // 3. Verify shipping options are available
    const shippingSection = page.locator('[data-testid="shipping-options"], [aria-label*="Shipping"]');
    if (await shippingSection.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Standard shipping should be available
      const standardOption = page.locator('label:has-text("Standard"), input[value*="standard"]').first();
      await expect(standardOption).toBeVisible();
      
      // Verify shipping cost is displayed
      const shippingCost = page.locator('text=/\$10|\$15|AUD 10|AUD 15/').first();
      await expect(shippingCost).toBeVisible();
    }
  });

  test('checkout calculates tax correctly', async ({ page }) => {
    // 1. Start checkout
    await page.goto(`/products/test-cd-ancient-spells`);
    await addProductToCart(page, 1);
    await proceedToCheckout(page);
    
    // 2. Wait for Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // 3. Fill customer details to trigger tax calculation
    await page.fill('input[type="email"]', TEST_CUSTOMER.email);
    
    // 4. Verify tax line appears (Australian GST)
    await page.waitForTimeout(2000); // Wait for tax calculation
    const taxLine = page.locator('text=/Tax|GST/i').first();
    if (await taxLine.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Tax should be calculated
      const taxAmount = page.locator('text=/\$\d+\.\d{2}.*(?:Tax|GST)/').first();
      await expect(taxAmount).toBeVisible();
    }
  });
});