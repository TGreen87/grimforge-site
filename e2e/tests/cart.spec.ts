import { test, expect } from '@playwright/test';
import {
  addProductToCart,
  waitForText,
} from '../utils/test-helpers';
import {
  setupTestData,
  cleanupTestData,
  TEST_PRODUCTS,
  TEST_VARIANTS,
} from '../fixtures/test-data';

test.describe('Cart Management', () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');
      sessionStorage.clear();
    });
  });

  test('add product to cart', async ({ page }) => {
    // Navigate to product
    await page.goto('/products/test-vinyl-dark-rituals');
    await page.waitForLoadState('networkidle');
    
    // Add to cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button[data-test="add-to-cart"]').first();
    await addToCartBtn.click();
    
    // Check for success message or cart update
    const successMessage = page.locator('[role="alert"]:has-text("Added"), .toast:has-text("Added"), text=/Added to cart/i').first();
    const cartCount = page.locator('[data-test="cart-count"], .cart-count, .cart-badge').first();
    
    // Either success message or cart count should update
    const hasSuccessMessage = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
    const hasCartCount = await cartCount.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasSuccessMessage || hasCartCount).toBeTruthy();
    
    if (hasCartCount) {
      await expect(cartCount).toContainText('1');
    }
    
    // Navigate to cart
    await page.goto('/cart');
    
    // Verify product is in cart
    await expect(page.locator('text="Test Vinyl"')).toBeVisible();
    await expect(page.locator('text="45"')).toBeVisible(); // Price
  });

  test('update quantity in cart', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products/test-cd-ancient-spells');
    await addProductToCart(page, 1);
    
    // Go to cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Find quantity input
    const quantityInput = page.locator('input[type="number"][name*="quantity"], input[data-test="quantity"]').first();
    
    if (await quantityInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Update quantity to 3
      await quantityInput.fill('3');
      
      // Trigger update (might need to blur or click update button)
      await quantityInput.press('Enter');
      
      // Or look for update button
      const updateBtn = page.locator('button:has-text("Update"), button[aria-label="Update quantity"]').first();
      if (await updateBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await updateBtn.click();
      }
      
      // Wait for cart to update
      await page.waitForTimeout(1000);
      
      // Verify total price updated (25 * 3 = 75)
      const totalPrice = page.locator('[data-test="cart-total"], .cart-total, .total-price').first();
      await expect(totalPrice).toContainText('75');
    } else {
      // Alternative: increment/decrement buttons
      const incrementBtn = page.locator('button[aria-label="Increase quantity"], button:has-text("+")').first();
      if (await incrementBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click twice to get to 3
        await incrementBtn.click();
        await page.waitForTimeout(500);
        await incrementBtn.click();
        await page.waitForTimeout(500);
        
        // Verify quantity is 3
        const quantityDisplay = page.locator('[data-test="item-quantity"], .quantity').first();
        await expect(quantityDisplay).toContainText('3');
      }
    }
  });

  test('remove item from cart', async ({ page }) => {
    // Add product to cart
    await page.goto('/products/test-vinyl-dark-rituals');
    await addProductToCart(page, 1);
    
    // Go to cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Verify item is in cart
    await expect(page.locator('text="Test Vinyl"')).toBeVisible();
    
    // Remove item
    const removeBtn = page.locator('button:has-text("Remove"), button[aria-label*="Remove"], button:has-text("Delete"), .remove-button').first();
    await removeBtn.click();
    
    // Confirm removal if dialog appears
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Cart should be empty
    const emptyCartMessage = page.locator('text=/Your cart is empty|No items in cart/i').first();
    await expect(emptyCartMessage).toBeVisible({ timeout: 5000 });
  });

  test('cart persists across page refreshes', async ({ page }) => {
    // Add product to cart
    await page.goto('/products/test-cd-ancient-spells');
    await addProductToCart(page, 2);
    
    // Refresh page
    await page.reload();
    
    // Go to cart
    await page.goto('/cart');
    
    // Item should still be in cart
    await expect(page.locator('text="Test CD"')).toBeVisible();
    
    // Quantity should be preserved
    const quantityElement = page.locator('[data-test="item-quantity"], input[type="number"][value="2"], .quantity:has-text("2")').first();
    await expect(quantityElement).toBeVisible();
  });

  test('cart shows correct subtotal and total', async ({ page }) => {
    // Add multiple products
    await page.goto('/products/test-vinyl-dark-rituals');
    await addProductToCart(page, 2); // 2 * $45 = $90
    
    await page.goto('/products/test-cd-ancient-spells');
    await addProductToCart(page, 1); // 1 * $25 = $25
    
    // Go to cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Check subtotal (should be $115)
    const subtotal = page.locator('[data-test="cart-subtotal"], .subtotal').first();
    await expect(subtotal).toContainText('115');
    
    // Check if shipping is shown
    const shipping = page.locator('[data-test="shipping-cost"], .shipping').first();
    if (await shipping.isVisible({ timeout: 2000 }).catch(() => false)) {
      const shippingText = await shipping.textContent();
      const shippingCost = parseFloat(shippingText?.replace(/[^\d.]/g, '') || '0');
      
      // Total should include shipping
      const total = page.locator('[data-test="cart-total"], .total, .grand-total').first();
      await expect(total).toContainText((115 + shippingCost).toString());
    } else {
      // If no shipping shown yet, total equals subtotal
      const total = page.locator('[data-test="cart-total"], .total').first();
      await expect(total).toContainText('115');
    }
  });

  test('apply discount code', async ({ page }) => {
    // Add product to cart
    await page.goto('/products/test-vinyl-dark-rituals');
    await addProductToCart(page, 1);
    
    // Go to cart
    await page.goto('/cart');
    
    // Look for discount code input
    const discountInput = page.locator('input[placeholder*="discount"], input[placeholder*="promo"], input[name*="coupon"]').first();
    
    if (await discountInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try common test discount codes
      await discountInput.fill('TEST10');
      
      // Apply discount
      const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Add")').first();
      await applyBtn.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check for discount applied or error message
      const discountApplied = page.locator('text=/Discount applied|10% off/i').first();
      const invalidCode = page.locator('text=/Invalid code|not valid/i').first();
      
      // Either message should appear
      const hasMessage = await discountApplied.isVisible({ timeout: 2000 }).catch(() => false) ||
                        await invalidCode.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasMessage).toBeTruthy();
    }
  });

  test('cart mini preview', async ({ page }) => {
    // Add product to cart
    await page.goto('/products/test-vinyl-dark-rituals');
    await addProductToCart(page, 1);
    
    // Look for cart icon in header
    const cartIcon = page.locator('[data-test="cart-icon"], .cart-icon, a[href="/cart"], button[aria-label*="Cart"]').first();
    
    if (await cartIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Hover or click to show mini cart
      await cartIcon.hover();
      await page.waitForTimeout(500);
      
      // Check if mini cart appears
      const miniCart = page.locator('[data-test="mini-cart"], .cart-preview, .cart-dropdown').first();
      
      if (await miniCart.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Should show product in mini cart
        await expect(miniCart).toContainText('Test Vinyl');
        await expect(miniCart).toContainText('45');
        
        // Should have view cart button
        const viewCartBtn = miniCart.locator('a[href="/cart"], button:has-text("View Cart")').first();
        await expect(viewCartBtn).toBeVisible();
      } else {
        // If no mini cart, clicking should go to cart page
        await cartIcon.click();
        await page.waitForURL('/cart', { timeout: 10000 });
      }
    }
  });

  test('cart with variant selection', async ({ page }) => {
    // Navigate to product with variants
    await page.goto('/products/test-vinyl-dark-rituals');
    
    // Select red vinyl variant
    const variantSelector = page.locator('[data-test="variant-selector"], select[name="variant"], input[type="radio"][value*="red"]').first();
    
    if (await variantSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Select red variant
      if (variantSelector.type === 'select') {
        await variantSelector.selectOption({ label: 'Red Vinyl' });
      } else {
        await variantSelector.click();
      }
      
      // Price should update to $55
      const price = page.locator('[data-test="product-price"], .price').first();
      await expect(price).toContainText('55');
      
      // Add to cart
      await addProductToCart(page, 1);
      
      // Go to cart
      await page.goto('/cart');
      
      // Should show red vinyl variant
      await expect(page.locator('text="Red Vinyl"')).toBeVisible();
      await expect(page.locator('text="55"')).toBeVisible();
    }
  });

  test('clear entire cart', async ({ page }) => {
    // Add multiple products
    await page.goto('/products/test-vinyl-dark-rituals');
    await addProductToCart(page, 1);
    
    await page.goto('/products/test-cd-ancient-spells');
    await addProductToCart(page, 2);
    
    // Go to cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Look for clear cart button
    const clearCartBtn = page.locator('button:has-text("Clear Cart"), button:has-text("Empty Cart"), button[aria-label="Clear all items"]').first();
    
    if (await clearCartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clearCartBtn.click();
      
      // Confirm if dialog appears
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      
      // Cart should be empty
      await expect(page.locator('text=/Your cart is empty|No items in cart/i')).toBeVisible({ timeout: 5000 });
    } else {
      // Remove items individually
      const removeButtons = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]');
      const count = await removeButtons.count();
      
      for (let i = count - 1; i >= 0; i--) {
        await removeButtons.nth(i).click();
        await page.waitForTimeout(500);
      }
      
      // Cart should be empty
      await expect(page.locator('text=/Your cart is empty|No items in cart/i')).toBeVisible({ timeout: 5000 });
    }
  });
});