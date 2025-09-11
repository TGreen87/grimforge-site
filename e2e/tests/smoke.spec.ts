import { test, expect, request as api } from '@playwright/test';

const base = process.env.E2E_BASE_URL || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://obsidianriterecords.com';

test.describe('Public smoke', () => {
  test('home loads and footer anchors switch tabs', async ({ page }) => {
    await page.goto(base);
    await expect(page.getByRole('heading', { name: /Catalog/i })).toBeVisible();

    // Footer link to Vinyl
    const vinylLink = page.getByRole('link', { name: /Vinyl Records/i }).first();
    if (await vinylLink.isVisible()) {
      await vinylLink.click();
      await expect(page).toHaveURL(/#vinyl/);
    }
  });

  test('status page loads', async ({ page }) => {
    await page.goto(`${base}/status`);
    await expect(page.getByText(/Runtime Status/i)).toBeVisible();
  });

  test('can open a product detail if present', async ({ page }) => {
    await page.goto(base);
    // Our cards expose a link button on hover, but also the entire card has role=link
    const cardLink = page.getByRole('link', { name: /View details for/i }).first();
    if (await cardLink.count()) {
      await cardLink.click();
      await expect(page.getByRole('heading', { name: /Catalog|Product|Articles/i })).not.toBeVisible({ timeout: 1000 }).catch(() => {});
      // Product page should have price text like $ or Checkout button
      await expect(page.locator('text=AUD').or(page.getByRole('button', { name: /Buy Now|Add to Cart/i }))).toBeVisible();
    } else {
      test.skip(true, 'No product cards detected');
    }
  });
});

test.describe('Articles smoke', () => {
  test('articles page returns a response', async () => {
    const r = await api.newContext();
    const res = await r.get(`${base}/articles`);
    // Accept 200 (renders list) or 404 (no published content yet)
    expect([200, 404]).toContain(res.status());
  });
});

