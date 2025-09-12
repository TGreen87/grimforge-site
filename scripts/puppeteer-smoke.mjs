#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || 'https://dev--obsidianriterecords.netlify.app';

function log(step, ok, extra = '') {
  const status = ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${step}${extra ? ' — ' + extra : ''}`);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    const title = await page.title();
    log('Open homepage', true, `title: ${title}`);

    // Try footer Vinyl anchor
    try {
      await page.evaluate(() => {
        const a = document.querySelector('a[href*="#vinyl"]');
        if (a) (a).scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      const vinylLink = await page.$('a[href*="#vinyl"]');
      if (vinylLink) {
        await vinylLink.click();
        await page.waitForTimeout(500);
        const url = page.url();
        log('Footer Vinyl anchor', url.includes('#vinyl'));
      } else {
        log('Footer Vinyl anchor', false, 'link not found');
      }
    } catch (e) { log('Footer Vinyl anchor', false, String(e)); }

    // Navigate to first product
    let wentProduct = false;
    try {
      const prodLink = await page.$('a[href^="/products/"]') || await page.$('a[href^="/product/"]');
      if (prodLink) {
        await Promise.all([
          prodLink.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        wentProduct = true;
        log('Open product detail', true, page.url());
      } else {
        log('Open product detail', false, 'no product link found');
      }
    } catch (e) { log('Open product detail', false, String(e)); }

    // Add to cart and open checkout modal
    if (wentProduct) {
      try {
        const addBtn = await page.$x("//button[contains(., 'Add to Cart') or contains(., 'Add to cart')]");
        if (addBtn[0]) {
          await addBtn[0].click();
        } else {
          // try Buy Now (will redirect) — skip to avoid navigation
        }
        await page.waitForTimeout(500);
        // Try open cart and click Checkout button
        const checkoutBtns = await page.$x("//button[contains(., 'Checkout')] | //a[contains(., 'Checkout')]");
        if (checkoutBtns[0]) {
          await checkoutBtns[0].click();
          log('Open checkout modal', true);
        } else {
          log('Open checkout modal', false, 'Checkout button not found');
        }
      } catch (e) { log('Open checkout modal', false, String(e)); }

      // Try fill shipping and refresh rates in modal (best-effort)
      try {
        const type = async (sel, val) => { const el = await page.$(sel); if (el) { await el.click({ clickCount: 3 }); await el.type(val); } };
        await type('#fullName', 'Test User');
        await type('#email', 'test@example.com');
        await type('#phone', '+61 400 000 000');
        await type('#address', '123 Example St');
        await type('#city', 'Melbourne');
        await type('#state', 'VIC');
        await type('#postalCode', '3000');
        const refresh = await page.$x("//button[contains(., 'Refresh rates')] | //button[contains(., 'Fetching…')]");
        if (refresh[0]) {
          await refresh[0].click();
          await page.waitForTimeout(1500);
          log('Fetch shipping rates', true);
        }
      } catch (e) { log('Fetch shipping rates', false, String(e)); }
    }

  } catch (e) {
    log('Open homepage', false, String(e));
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(0));

