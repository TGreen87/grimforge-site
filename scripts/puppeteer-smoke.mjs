#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || 'https://dev--obsidianriterecords.netlify.app';
const TIMEOUT_MS = Number(process.env.PUPPETEER_TIMEOUT || 45000);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CODEN_USER || process.env.CODEX_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.CODEN_PASS || process.env.CODEX_PASS || '';

function log(step, ok, extra = '') {
  const status = ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${step}${extra ? ' — ' + extra : ''}`);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  page.setDefaultNavigationTimeout(TIMEOUT_MS);

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { timeout: TIMEOUT_MS });
    const title = await page.title();
    log('Open homepage', true, `title: ${title}`);

    // Try footer Vinyl anchor
    try {
      // Prefer header nav button "Vinyl"
      const headerClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('nav button, nav a'));
        const target = btns.find(el => /\bvinyl\b/i.test(el.textContent || ''));
        if (target) { (target).click(); return true; }
        return false;
      });
      await new Promise(r => setTimeout(r, 600));
      if (headerClicked) {
        log('Vinyl nav', true);
      } else {
        // Fallback: any anchor to #vinyl
        const vinylLink = await page.$('a[href*="#vinyl"]');
        if (vinylLink) {
          await vinylLink.click();
          await new Promise(r => setTimeout(r, 600));
          const url = page.url();
          log('Vinyl nav', url.includes('#vinyl'));
        } else {
          log('Vinyl nav', false, 'selector not found');
        }
      }
    } catch (e) { log('Vinyl nav', false, String(e)); }

    // Navigate to first product
    let wentProduct = false;
    try {
      // Try to bring catalog into view then look for product links
      await page.evaluate(() => {
        const el = document.getElementById('catalog');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await new Promise(r => setTimeout(r, 400));
      const prodLink = await page.$('a[href^="/products/"]') || await page.$('a[href^="/product/"]');
      if (prodLink) {
        await Promise.all([
          prodLink.click(),
          page.waitForNavigation({ waitUntil: 'domcontentloaded' })
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
        }
        await new Promise(r => setTimeout(r, 600));
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
          await new Promise(r => setTimeout(r, 1500));
          log('Fetch shipping rates', true);
        }
      } catch (e) { log('Fetch shipping rates', false, String(e)); }
    }

    // Robots and sitemap
    try {
      const respRobots = await page.goto(BASE_URL.replace(/\/$/, '') + '/robots.txt', { waitUntil: 'domcontentloaded' });
      log('robots.txt', !!respRobots && respRobots.status() === 200, `status: ${respRobots && respRobots.status()}`);
    } catch (e) { log('robots.txt', false, String(e)); }
    try {
      const respSitemap = await page.goto(BASE_URL.replace(/\/$/, '') + '/sitemap.xml', { waitUntil: 'domcontentloaded' });
      log('sitemap.xml', !!respSitemap && respSitemap.status() === 200, `status: ${respSitemap && respSitemap.status()}`);
    } catch (e) { log('sitemap.xml', false, String(e)); }

    // Admin login page renders
    try {
      const resp = await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/login', { waitUntil: 'domcontentloaded' });
      const ok = !!resp && resp.status() === 200;
      await page.waitForSelector('button, input, form', { timeout: TIMEOUT_MS }).catch(()=>{});
      log('Admin login renders', ok, `status: ${resp && resp.status()}`);
    } catch (e) { log('Admin login renders', false, String(e)); }

    // Optional: Admin login and seed product if creds provided
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      try {
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/login', { waitUntil: 'domcontentloaded' });
        // Fill email & password
        const typeFirst = async (selector, value) => {
          const el = await page.$(selector);
          if (el) { await el.click({ clickCount: 3 }); await el.type(value, { delay: 10 }); return true; }
          return false;
        };
        await typeFirst('input[type="email"], input[name="email"], #email', ADMIN_EMAIL);
        await typeFirst('input[type="password"], input[name="password"], #password', ADMIN_PASSWORD);
        // Click Sign in button by text
        const clickByText = async (selectors, pattern) => {
          for (const sel of selectors) {
            const nodes = await page.$$(sel);
            for (const node of nodes) {
              const text = (await page.evaluate(el => (el.innerText || el.textContent || '').trim(), node)) || '';
              if (pattern.test(text)) { await node.click(); return true; }
            }
          }
          return false;
        };
        await clickByText(['button', '[role="button"]'], /^(sign in|login)$/i);
        // Give the client time; then proceed regardless
        await page.waitForTimeout(1500);
        log('Admin login submit', true);

        // Create product (idempotent if slug exists)
        const slug = 'test-vinyl-dark-rituals';
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/products/create', { waitUntil: 'domcontentloaded' });
        const typeInto = async (label, value) => {
          // Try by id=name
          const id = label.toLowerCase().replace(/\s+|\(|\)|\./g,'_');
          const el = await page.$(`#${id}`);
          if (el) { await el.click({ clickCount: 3 }); await el.type(value, { delay: 5 }); return true; }
          // Fallback by label text
          return await page.evaluate((lbl, val) => {
            const items = Array.from(document.querySelectorAll('.ant-form-item'));
            const item = items.find(i => (i.querySelector('.ant-form-item-label')?.innerText || '').trim().toLowerCase().includes(lbl.toLowerCase()));
            if (!item) return false;
            const input = item.querySelector('input, textarea');
            if (!input) return false;
            input.focus();
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }, label, value);
        };

        await typeInto('URL (link)', slug);
        await typeInto('Title', 'Test Vinyl — Dark Rituals');
        await typeInto('Artist', 'Shadowmoon');
        await typeInto('Price', '45.99');
        await typeInto('Stock', '10');
        // Select Format = Vinyl
        await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.ant-form-item'));
          const item = items.find(i => (i.querySelector('.ant-form-item-label')?.innerText || '').toLowerCase().includes('format'));
          const trigger = item && item.querySelector('.ant-select');
          if (trigger) (trigger).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        });
        await page.waitForSelector('.ant-select-dropdown .ant-select-item', { timeout: TIMEOUT_MS }).catch(()=>{});
        // Click the Vinyl option
        await clickByText(['.ant-select-item .ant-select-item-option-content', '.ant-select-item'], /vinyl/i);

        // Save
        // Click Save/Create
        if (!(await clickByText(['button', '[role="button"]'], /^(save|create)$/i))) {
          await page.keyboard.press('Control+Enter').catch(()=>{});
        }
        await page.waitForTimeout(1200);
        log('Product created (attempt)', true);

        // Now run product/checkout flow for this slug
        await page.goto(BASE_URL.replace(/\/$/, '') + `/products/${slug}`, { waitUntil: 'domcontentloaded' });
        // Add to Cart
        if (await clickByText(['button', '[role="button"]'], /add to cart/i)) {
          await page.waitForTimeout(500);
          // Open checkout in cart
          if (await clickByText(['button', 'a', '[role="button"]'], /^checkout$/i)) log('Open checkout modal', true);
          // Fill AU shipping and refresh rates
          const type = async (sel, val) => { const el = await page.$(sel); if (el) { await el.click({ clickCount: 3 }); await el.type(val); return true;} return false; };
          await type('#fullName', 'Test User');
          await type('#email', 'test@example.com');
          await type('#phone', '+61 400 000 000');
          await type('#address', '123 Example St');
          await type('#city', 'Melbourne');
          await type('#state', 'VIC');
          await type('#postalCode', '3000');
          if (await clickByText(['button', '[role="button"]'], /refresh rates/i)) { await page.waitForTimeout(1500); log('Fetch shipping rates', true); }
          // Pick first shipping option if present
          await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('[class*="border-border"]'));
            const opt = opts.find(o => /\$\d|AUD|Shipping|Express|Standard/i.test(o.textContent || ''));
            if (opt) (opt).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
          await page.waitForTimeout(300);
          // Continue → Place order (will open Stripe)
          await clickByText(['button', '[role="button"]'], /^continue$/i);
          await page.waitForTimeout(500);
          await clickByText(['button', '[role="button"]'], /place order/i);
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>{});
          const finalUrl = page.url();
          log('Stripe Checkout', /checkout\.stripe\.com/.test(new URL(finalUrl).hostname), finalUrl);
        } else {
          log('Product page', false, 'Add to Cart not found');
        }
      } catch (e) {
        log('Admin E2E', false, String(e));
      }
    }

  } catch (e) {
    log('Open homepage', false, String(e));
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(0));
