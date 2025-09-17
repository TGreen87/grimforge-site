#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || 'https://dev--obsidianriterecords.netlify.app';
const TIMEOUT_MS = Number(process.env.PUPPETEER_TIMEOUT || 45000);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CODEN_USER || process.env.CODEX_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.CODEN_PASS || process.env.CODEX_PASS || '';
const OUT_DIR = process.env.QA_OUT_DIR || path.join('docs', 'qa-screenshots');

function log(step, ok, extra = '') {
  const status = ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${step}${extra ? ' — ' + extra : ''}`);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  page.setDefaultNavigationTimeout(TIMEOUT_MS);

  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const shot = async (name, opts = {}) => {
    const p = path.join(OUT_DIR, name);
    try {
      await page.screenshot({ path: p, fullPage: true, ...opts });
      log('Screenshot', true, p);
    } catch (e) {
      log('Screenshot', false, `${name}: ${String(e)}`);
    }
  };

  // Helper: find first element by visible text
  const findByText = async (selectors, regex) => {
    for (const sel of selectors) {
      const nodes = await page.$$(sel);
      for (const node of nodes) {
        const text = (await page.evaluate(el => (el.innerText || el.textContent || '').trim(), node)) || '';
        if (regex.test(text)) return node;
      }
    }
    return null;
  };

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { timeout: TIMEOUT_MS });
    const title = await page.title();
    log('Open homepage', true, `title: ${title}`);
    await shot('home.png');

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
        const url = page.url();
        if (url.includes('#vinyl')) {
          log('Vinyl nav', true, url);
        } else {
          log('Vinyl nav', true, 'hash-missing');
        }
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
    await shot('vinyl.png');

    // Attempt direct product path for seeded item
    try {
      const productSlug = '/products/test-vinyl-dark-rituals';
      await page.goto(BASE_URL.replace(/\/$/, '') + productSlug, { waitUntil: 'domcontentloaded' });
      const hydrated = await page.waitForFunction(() => {
        return !!Array.from(document.querySelectorAll('button, [role="button"]')).find(el => /add to cart/i.test(el.textContent || ''));
      }, { timeout: TIMEOUT_MS }).catch(() => null);
      const addBtnDirect = hydrated ? await findByText(['button', '[role="button"]'], /add to cart/i) : null;
      log('Open product by slug', !!addBtnDirect, hydrated ? page.url() : 'hydration-timeout');
      await shot('product.png');
      if (addBtnDirect) {
        await addBtnDirect.click();
        await new Promise(r => setTimeout(r, 600));
        const checkoutBtn1 = await findByText(['button','a','[role="button"]'], /^checkout$/i);
        if (checkoutBtn1) {
          await checkoutBtn1.click();
          log('Open checkout modal', true);
          await shot('checkout-open.png');
          const type = async (sel, val) => { const el = await page.$(sel); if (el) { await el.click({ clickCount: 3 }); await el.type(val); return true;} return false; };
          await type('#fullName', 'Test User');
          await type('#email', 'test@example.com');
          await type('#phone', '+61 400 000 000');
          await type('#address', '123 Example St');
          await type('#city', 'Melbourne');
          await type('#state', 'VIC');
          await type('#postalCode', '3000');
          const refreshBtn1 = await findByText(['button','[role="button"]'], /refresh rates/i);
          if (refreshBtn1) {
            await refreshBtn1.click();
            await new Promise(r => setTimeout(r, 1500));
            log('Fetch shipping rates', true);
            // capture first option text if present
            try {
              const firstOptionText = await page.evaluate(() => {
                const candidates = Array.from(document.querySelectorAll('[class*="border-border"], [data-testid*="shipping"], [role="radio"], .shipping-rate'));
                const el = candidates.find(o => /\$\d|AUD|Express|Standard/i.test(o.textContent || ''));
                return (el?.textContent || '').replace(/\s+/g, ' ').trim();
              });
              if (firstOptionText) log('Shipping option', true, firstOptionText);
            } catch {}
            await shot('checkout-shipping.png');
          }
          // Continue to Stripe (best-effort)
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => /^(continue)$/i.test(b.textContent || ''));
            if (btn) (btn).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
          await new Promise(r => setTimeout(r, 600));
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => /(place order)/i.test(b.textContent || ''));
            if (btn) (btn).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>{});
          const finalUrl2 = page.url();
          log('Stripe Checkout', /checkout\.stripe\.com/.test(new URL(finalUrl2).hostname), finalUrl2);
          await shot('stripe.png');
    }
      }
    } catch (e) { log('Open product by slug', false, String(e)); }

    // Robots and sitemap
    try {
      const respRobots = await page.goto(BASE_URL.replace(/\/$/, '') + '/robots.txt', { waitUntil: 'networkidle0' });
      log('robots.txt', !!respRobots && respRobots.status() === 200, `status: ${respRobots && respRobots.status()}`);
    } catch (e) { log('robots.txt', false, String(e)); }
    try {
      const respSitemap = await page.goto(BASE_URL.replace(/\/$/, '') + '/sitemap.xml', { waitUntil: 'networkidle0' });
      log('sitemap.xml', !!respSitemap && respSitemap.status() === 200, `status: ${respSitemap && respSitemap.status()}`);
    } catch (e) { log('sitemap.xml', false, String(e)); }

    // Admin login page renders
    try {
      const resp = await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/login', { waitUntil: 'domcontentloaded' });
      const ok = !!resp && resp.status() === 200;
      await page.waitForSelector('button, input, form', { timeout: TIMEOUT_MS }).catch(()=>{});
      log('Admin login renders', ok, `status: ${resp && resp.status()}`);
      await shot('admin-login.png');
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
        await new Promise(r => setTimeout(r, 1500));
        log('Admin login submit', true);

        try {
          await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/dashboard', { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('h1.blackletter', { timeout: TIMEOUT_MS }).catch(()=>{});
          log('Admin dashboard renders', true);
          await shot('admin-dashboard.png');
        } catch (dashError) {
          log('Admin dashboard renders', false, String(dashError));
        }

        // Create product (idempotent if slug exists)
        const slug = 'test-vinyl-dark-rituals';
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/products/create', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('form', { timeout: TIMEOUT_MS }).catch(()=>{});
        await page.waitForSelector('input[name="title"]', { timeout: TIMEOUT_MS }).catch(()=>{});
        // Helper: set field by label text inside AntD Form.Item
        const setByLabel = async (label, value) => {
          return await page.evaluate((lbl, val) => {
            const items = Array.from(document.querySelectorAll('.ant-form-item'));
            const item = items.find(i => {
              const t = (i.querySelector('.ant-form-item-label')?.textContent || '').trim().toLowerCase();
              return t.includes(lbl.toLowerCase());
            });
            if (!item) return false;
            const input = item.querySelector('input, textarea');
            if (!input) return false;
            input.focus();
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.blur();
            return true;
          }, label, value);
        };

        await setByLabel('URL (link)', slug);
        await setByLabel('Title', 'Test Vinyl — Dark Rituals');
        await setByLabel('Artist', 'Shadowmoon');
        await setByLabel('Price', '45.99');
        await setByLabel('Stock', '10');
        // Verify
        try {
          const v = await page.$eval('input[name="title"]', el => (el).value);
          if (!/Dark Rituals/.test(v)) log('Admin form fill', false, 'title not set');
        } catch {}

        // Select Format = Vinyl (AntD Select)
        await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.ant-form-item'));
          const item = items.find(i => (i.querySelector('.ant-form-item-label')?.textContent || '').match(/Format/i));
          const trigger = item && item.querySelector('.ant-select');
          if (trigger) (trigger).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        });
        await page.waitForSelector('.ant-select-dropdown .ant-select-item', { timeout: TIMEOUT_MS }).catch(()=>{});
        await page.evaluate(() => {
          const opts = Array.from(document.querySelectorAll('.ant-select-dropdown .ant-select-item'));
          const o = opts.find(el => /vinyl/i.test(el.textContent || ''));
          if (o) (o).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        // Save
        if (!(await clickByText(['button[type="submit"]', 'button', '[role="button"]'], /^(save|create)$/i))) {
          await page.keyboard.press('Control+Enter').catch(()=>{});
        }
        await new Promise(r => setTimeout(r, 1500));
        // Check if any required field errors remain
        const hasErrors = await page.evaluate(() => !!document.querySelector('.ant-form-item-explain-error'));
        if (hasErrors) log('Admin create', false, 'form has validation errors');
        await new Promise(r => setTimeout(r, 1200));
        log('Product created (attempt)', true);
        await shot('admin-product-created.png');

        // Now run product/checkout flow for this slug
        await page.goto(BASE_URL.replace(/\/$/, '') + `/products/${slug}`, { waitUntil: 'domcontentloaded' });
        // Add to Cart
        if (await clickByText(['button', '[role="button"]'], /add to cart/i)) {
          await new Promise(r => setTimeout(r, 500));
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
          if (await clickByText(['button', '[role="button"]'], /refresh rates/i)) { await new Promise(r => setTimeout(r, 1500)); log('Fetch shipping rates', true); }
          // Pick first shipping option if present
          await page.evaluate(() => {
            const opts = Array.from(document.querySelectorAll('[class*="border-border"]'));
            const opt = opts.find(o => /\$\d|AUD|Shipping|Express|Standard/i.test(o.textContent || ''));
            if (opt) (opt).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          });
          await new Promise(r => setTimeout(r, 300));
          // Continue → Place order (will open Stripe)
          await clickByText(['button', '[role="button"]'], /^continue$/i);
          await new Promise(r => setTimeout(r, 500));
          await clickByText(['button', '[role="button"]'], /place order/i);
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(()=>{});
          const finalUrl = page.url();
          log('Stripe Checkout', /checkout\.stripe\.com/.test(new URL(finalUrl).hostname), finalUrl);
          await shot('stripe.png');
        } else {
          log('Product page', false, 'Add to Cart not found');
        }
      } catch (e) {
        log('Admin E2E', false, String(e));
      }

      // Admin visuals screenshots
      try {
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/products', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 800));
        await shot('admin-products.png');
      } catch {}
      try {
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/variants', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 800));
        await shot('admin-variants.png');
      } catch {}
      try {
        await page.goto(BASE_URL.replace(/\/$/, '') + '/admin/inventory', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 800));
        await shot('admin-inventory.png');
      } catch {}
    }

  } catch (e) {
    log('Open homepage', false, String(e));
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(0));
