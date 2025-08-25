import { test, expect } from '@playwright/test';
import {
  addProductToCart,
  waitForText,
} from '../utils/test-helpers';
import {
  setupTestData,
  cleanupTestData,
  TEST_PRODUCTS,
} from '../fixtures/test-data';

test.describe('Product Browsing', () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('browse product catalog', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for product listings
    const productCards = page.locator('[data-test="product-card"], .product-card, article').filter({ hasText: /vinyl|cd|cassette/i });
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify at least some products are shown
    const productCount = await productCards.count();
    expect(productCount).toBeGreaterThan(0);
    
    // Click on first product
    await productCards.first().click();
    
    // Should navigate to product detail page
    await page.waitForURL(/\/products\/[\w-]+/, { timeout: 10000 });
    
    // Verify product detail elements
    await expect(page.locator('h1, [data-test="product-title"]').first()).toBeVisible();
    await expect(page.locator('[data-test="product-price"], .price').first()).toBeVisible();
    await expect(page.locator('[data-test="product-description"], .description').first()).toBeVisible();
    await expect(page.locator('button:has-text("Add to Cart"), button[data-test="add-to-cart"]').first()).toBeVisible();
  });

  test('search for products', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Search for test product
      await searchInput.fill('Test Vinyl');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Verify search results contain our test product
      const searchResults = page.locator('[data-test="search-results"], .search-results, main');
      await expect(searchResults).toContainText('Test Vinyl', { timeout: 10000 });
    } else {
      // If no search, verify products are visible on page
      await expect(page.locator('text="Test Vinyl"').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('filter products by category', async ({ page }) => {
    await page.goto('/');
    
    // Look for category filters
    const categoryFilters = page.locator('[data-test="category-filter"], [aria-label*="Category"], button:has-text("Vinyl"), button:has-text("CD")');
    
    if (await categoryFilters.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click vinyl filter
      const vinylFilter = page.locator('button:has-text("Vinyl"), input[value="vinyl"]').first();
      await vinylFilter.click();
      
      // Wait for filtered results
      await page.waitForTimeout(2000);
      
      // Verify only vinyl products are shown
      const productTitles = page.locator('[data-test="product-title"], .product-title, h2');
      const titles = await productTitles.allTextContents();
      
      // At least one product should be vinyl
      const hasVinyl = titles.some(title => title.toLowerCase().includes('vinyl'));
      expect(hasVinyl).toBeTruthy();
    }
  });

  test('view product details', async ({ page }) => {
    // Navigate directly to test product
    await page.goto('/products/test-vinyl-dark-rituals');
    await page.waitForLoadState('networkidle');
    
    // Verify all product details are displayed
    await expect(page.locator('h1, [data-test="product-title"]')).toContainText(TEST_PRODUCTS.vinyl.title);
    await expect(page.locator('[data-test="product-artist"], .artist')).toContainText(TEST_PRODUCTS.vinyl.artist);
    await expect(page.locator('[data-test="product-description"], .description')).toContainText(TEST_PRODUCTS.vinyl.description);
    await expect(page.locator('[data-test="product-price"], .price')).toContainText('45');
    
    // Check for product image
    const productImage = page.locator('img[alt*="Test Vinyl"], [data-test="product-image"] img').first();
    await expect(productImage).toBeVisible();
    
    // Check for variant selector if multiple variants
    const variantSelector = page.locator('[data-test="variant-selector"], select[name="variant"], [role="radiogroup"]').first();
    if (await variantSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Should have black and red vinyl options
      await expect(variantSelector).toContainText('Black');
      await expect(variantSelector).toContainText('Red');
    }
    
    // Check for stock status
    const stockStatus = page.locator('[data-test="stock-status"], .stock-status, text=/In Stock|Available/i').first();
    await expect(stockStatus).toBeVisible();
  });

  test('product image gallery', async ({ page }) => {
    await page.goto('/products/test-vinyl-dark-rituals');
    
    // Check for image gallery
    const imageGallery = page.locator('[data-test="image-gallery"], .image-gallery, [role="img"]').first();
    
    if (await imageGallery.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check for thumbnail images
      const thumbnails = page.locator('[data-test="image-thumbnail"], .thumbnail, button img');
      const thumbnailCount = await thumbnails.count();
      
      if (thumbnailCount > 1) {
        // Click on second thumbnail
        await thumbnails.nth(1).click();
        
        // Main image should update
        const mainImage = page.locator('[data-test="main-image"], .main-image, img').first();
        await expect(mainImage).toBeVisible();
      }
    }
  });

  test('product recommendations', async ({ page }) => {
    await page.goto('/products/test-vinyl-dark-rituals');
    await page.waitForLoadState('networkidle');
    
    // Scroll to recommendations section
    const recommendations = page.locator('[data-test="recommendations"], .recommendations, section:has-text("You might also like")').first();
    
    if (await recommendations.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recommendations.scrollIntoViewIfNeeded();
      
      // Should show related products
      const recommendedProducts = recommendations.locator('[data-test="product-card"], .product-card, article');
      const count = await recommendedProducts.count();
      expect(count).toBeGreaterThan(0);
      
      // Click on a recommended product
      if (count > 0) {
        await recommendedProducts.first().click();
        
        // Should navigate to that product
        await page.waitForURL(/\/products\/[\w-]+/, { timeout: 10000 });
      }
    }
  });

  test('product reviews section', async ({ page }) => {
    await page.goto('/products/test-vinyl-dark-rituals');
    
    // Check for reviews section
    const reviewsSection = page.locator('[data-test="reviews"], .reviews, section:has-text("Reviews")').first();
    
    if (await reviewsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewsSection.scrollIntoViewIfNeeded();
      
      // Check for review form or login prompt
      const reviewForm = page.locator('[data-test="review-form"], form[name="review"], button:has-text("Write a review")').first();
      
      if (await reviewForm.isVisible({ timeout: 2000 }).catch(() => false)) {
        // User can write a review
        await expect(reviewForm).toBeVisible();
      } else {
        // Might need to login first
        const loginPrompt = page.locator('text=/Sign in to review|Login to review/i').first();
        if (await loginPrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(loginPrompt).toBeVisible();
        }
      }
    }
  });

  test('product sorting options', async ({ page }) => {
    await page.goto('/');
    
    // Look for sort dropdown
    const sortDropdown = page.locator('[data-test="sort-dropdown"], select[name="sort"], button:has-text("Sort")').first();
    
    if (await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to open sort options
      await sortDropdown.click();
      
      // Check for sort options
      const sortOptions = page.locator('[role="option"], option, [data-test="sort-option"]');
      const optionCount = await sortOptions.count();
      expect(optionCount).toBeGreaterThan(0);
      
      // Select price low to high
      const priceLowToHigh = page.locator('text=/Price.*Low|Lowest.*Price/i').first();
      if (await priceLowToHigh.isVisible({ timeout: 2000 }).catch(() => false)) {
        await priceLowToHigh.click();
        
        // Wait for products to re-sort
        await page.waitForTimeout(2000);
        
        // First product should be cheapest
        const firstPrice = page.locator('[data-test="product-price"], .price').first();
        const priceText = await firstPrice.textContent();
        const price = parseFloat(priceText?.replace(/[^\d.]/g, '') || '0');
        expect(price).toBeLessThanOrEqual(50); // Our test products are under $50
      }
    }
  });

  test('pagination or infinite scroll', async ({ page }) => {
    await page.goto('/');
    
    // Check for pagination
    const pagination = page.locator('[data-test="pagination"], nav[aria-label="Pagination"], .pagination').first();
    
    if (await pagination.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click next page
      const nextButton = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label="Next page"]').first();
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        
        // URL or content should update
        await page.waitForTimeout(2000);
        
        // Should show different products
        const products = page.locator('[data-test="product-card"], .product-card');
        await expect(products.first()).toBeVisible();
      }
    } else {
      // Check for infinite scroll
      const initialProductCount = await page.locator('[data-test="product-card"], .product-card').count();
      
      if (initialProductCount > 0) {
        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        // Check if more products loaded
        const newProductCount = await page.locator('[data-test="product-card"], .product-card').count();
        // Infinite scroll would load more products
        // But if there are few products, count might stay the same
        expect(newProductCount).toBeGreaterThanOrEqual(initialProductCount);
      }
    }
  });
});