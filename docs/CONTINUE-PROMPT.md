# Continuation Prompt (New Chat)

DO NOT WRITE CODE YET 

---

Context:
- Repo: grimforge-site (Next.js 15 App Router; Refine + AntD admin), working on the dev branchg and pushing to main when the user asks for it.
- Branch deploy (dev): https://dev--obsidianriterecords.netlify.app
- Planning docs: `docs/AGENTS.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`
- QA guide: `docs/QA-CHECKLIST.md`
- Seed/setup: `docs/SUPABASE-SEED.md` (No‑DO Seed) and `docs/SESSION-2025-09-14.md`
- MCP: Use your MCP function. Supabase configured and available, Context7 available for docs / api reference etc. Puppeteer/Playwright soon available; set BASE_URL to the dev Branch Deploy
- Shipping: customer‑pays; AusPost when configured; Stripe static fallback otherwise
- Admin visuals: modern shell, sticky headers, density toggle, Cards/Board views, Kbar actions
- EmptyStates + CSV export: Products/Inventory enabled

Current status (dev branch):
- Supabase data verified via MCP: product `test-vinyl-dark-rituals` active; variant SKU present; inventory available=10; RLS `products_select_active` present.
- Product detail route hardened (normalized `inventory` join; try/catch in metadata/page). Still seeing 500 on branch deploy — likely runtime/env, not DB.
- Checkout API returns 500 “Failed to create order” on branch deploy — likely missing `STRIPE_SECRET_KEY` at runtime. Server Supabase client now falls back to `SUPABASE_URL/ANON/SERVICE_ROLE` envs.

Goals:
1) Smoke‑check public pages with screenshots and error capture.
2) Prepare data via seed (preferred) or admin create; ensure RLS allows public product read.
3) Verify product → checkout flow (shipping selection → Stripe redirect).
4) Return pass/fail notes and artifact paths.

Codex admin credentials (temporary):
User: Codex@greenaiautomation.ai
PW: Codex1@3

Instructions for the assistant:
1) Confirm MCP tools are available. If not, ask to restart with MCP.
2) Confirm env prerequisites on the branch deploy (via Netlify UI; do not echo values):
   - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`), `STRIPE_SECRET_KEY`.
   - Recommended: `NEXT_PUBLIC_SITE_URL` (set to Branch URL), `SITE_URL_STAGING` (same URL).
   - Optional: `AUSPOST_API_KEY`, `AUSPOST_ORIGIN_POSTCODE` (if live AusPost quoting desired).
Preflight
1) `/status`:
   - Open `/status`; extract Node version, NEXT_PUBLIC_SITE_URL, Supabase presence flags.
   - Screenshot status-<timestamp>.png; record any console errors and 4xx/5xx responses.

2) Public checks:
   - Open the homepage; report status and title; screenshot home.png.
   - Click the header “Vinyl” control; confirm hash/tab sync; screenshot vinyl.png.
   - Check `/robots.txt` and `/sitemap.xml` return 200.
3) Data prep (prefer this over manual create):
   - Run `docs/SUPABASE-SEED.md` → “No‑DO Seed”. This grants admin and upserts:
     - Product slug: `test-vinyl-dark-rituals` (active: true; format: `vinyl`).
     - Variant SKU: `SHADOWMOON-DARK-RITUALS-STD`, price: 45.99.
     - Inventory: on_hand 10, allocated 0, available 10.
   - Ensure policy `products_select_active` exists for public read of active rows.
   - If you still use the Admin form, note the DB enforces lowercase `format`; prefer seeding for reliability in previews.
4) Product + checkout (shipping):
   - Open `/products/test-vinyl-dark-rituals`; verify “Add to Cart”; screenshot product.png.
   - Add to cart → open checkout modal; fill AU address; click “Refresh rates”; select first option; report label/price; screenshot checkout-shipping.png.
   - Click Continue → Place order; verify `checkout.stripe.com`; screenshot stripe.png.
   - If `/api/checkout` returns 500, verify `STRIPE_SECRET_KEY` is present and the service role env exists; redeploy dev and retry.
5) Admin visuals (optional): sticky headers/zebra on Products/Variants/Inventory; Inventory CSV export; screenshots.

Constraints:
- Security/credentials: never echo secrets; rely on existing session or prompt user to log in. Do not persist credentials in code or logs.
- Branch discipline: use the `dev` branch only; no PRs; never push to `main` unless explicitly instructed.
- Scope: keep changes to QA/seeding only (preview‑safe); do not alter production RLS beyond `products_select_active`.
- Logging: for each step, capture console errors and any 4xx/5xx network responses; include in the summary.
- Shipping: if AusPost is not configured, confirm Stripe static rates appear (configured:false in `/api/shipping/quote`).
- Product 404/500: re‑run No‑DO Seed and ensure `products_select_active` exists and the product row has `active = true`.
 - If product URL returns 500 even with data present, treat as SSR/runtime; proceed after envs are verified and the branch redeploys.

Deliverables:
- Pass/fail summary (home, vinyl, robots/sitemap, product Add to Cart, shipping label/amount, Stripe redirect).
- Screenshot paths (suffix with a timestamp to avoid overwrite when possible).
- Notable console/network errors and any flaky selectors.

Artifacts:
- Screenshots from local smoke land in `docs/qa-screenshots/` (append timestamps where possible).
- Latest session notes: `docs/SESSION-2025-09-14.md` (seed steps, RLS, and current state).

Fallbacks
- If MCP is unavailable: `BASE_URL=https://dev--obsidianriterecords.netlify.app npm run test:puppeteer`
- If seeded product still fails after retry: check RLS policies and product.active; re‑seed and retry.

Restart notes
- These notes reflect the latest state on `dev`. If restarting the chat, follow “Current status”, confirm envs, then run the Preflight and Product + checkout steps. Save screenshots under `docs/qa-screenshots/`.

---
