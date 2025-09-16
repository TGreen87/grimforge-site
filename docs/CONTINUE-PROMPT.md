## Continuation Prompt (New Chat)

Use this prompt when you need to spin up a fresh Codex chat with MCP tools (Supabase + Puppeteer) already configured and resume QA on the `dev` branch deploy.

---

**Context**
- Repo: `grimforge-site` (Next.js 15 App Router storefront + Refine/AntD admin shell).
- Working branch: `dev` (single active branch; see `docs/AGENTS.md`).
- Branch deploy: https://dev--obsidianriterecords.netlify.app (update if the Netlify URL changes).
- Planning docs: `docs/AGENTS.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`.
- QA guide: `docs/QA-CHECKLIST.md`.
- MCP setup: `docs/MCP-CONFIG.md`; Puppeteer hints: `docs/MCP-PUPPETEER.md`.
- Seed/Bootstrap reference: `docs/SUPABASE-SEED.md` (No-DO seed, admin bootstrap, policy checks).
- Shipping: customer pays; AusPost quotes when env present; Stripe static fallback otherwise.
- Admin visuals: modern shell, density toggle, Cards/Board views, Kbar actions, warm EmptyStates, Products/Inventory CSV export.

**Goals**
1. Run MCP Puppeteer smoke against the dev branch deploy (homepage → vinyl anchor → seeded product slug → robots/sitemap → admin login).
2. Seed/verify the `test-vinyl-dark-rituals` product if it is missing before smoke; confirm slug renders with price/CTA and legal footer links resolve.
3. Capture pass/fail notes + screenshots; flag regressions or missing copy for follow-up.

**Assistant Instructions**
1. Confirm MCP tools (Puppeteer / Supabase) are available. If not, request a restart with MCP enabled.
2. Public checks:
   - Load the homepage, report status + `<title>`, capture `home.png`.
   - Activate the header “Vinyl” control (or footer Vinyl link); confirm hash/tab sync to `/#vinyl`, capture `vinyl.png`.
   - Verify `/robots.txt` and `/sitemap.xml` return 200.
3. Admin flow (pause for manual login if session missing):
   - Visit `/admin/login`; wait for user login if required.
   - Navigate to `/admin/products/create`; create:
     - URL (link) `test-vinyl-dark-rituals`
     - Title `Test Vinyl — Dark Rituals`
     - Artist `Shadowmoon`
     - Format `Vinyl`
     - Price `45.99`
     - Stock `10`
     - Active toggle on
   - Save; screenshot `admin-product-created.png`.
4. Product slug:
   - Open `/products/test-vinyl-dark-rituals`; ensure hydration completes (price + CTA visible); screenshot `product.png`.
5. Optional follow-ups when data/env allow: run end-to-end checkout smoke, capture shipping modal (`checkout-shipping.png`) and Stripe redirect (`stripe.png`).
6. Optional admin visuals: capture sticky header/zebra on Products/Variants/Inventory, CSV export confirmation, etc.

**Constraints**
- Never capture or echo credentials. Ask the user to log in or provide temporary creds if needed.
- Keep work scoped to QA validation (no code edits unless explicitly requested).
- If AusPost env vars are absent, note `configured:false` from `/api/shipping/quote` and confirm Stripe static rates appear.

**Deliverables**
- Short pass/fail summary with screenshot names/links.
- Note any regressions, flaky selectors, or missing shipping options for follow-up.

---
