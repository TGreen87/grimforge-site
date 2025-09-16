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
1. Run MCP Puppeteer smoke against the dev branch deploy.
2. Create/verify the seeded product via admin, then walk an end-to-end checkout with selectable shipping.
3. Capture brief pass/fail notes + screenshots; flag regressions for follow-up.

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
4. Product + checkout:
   - Open `/products/test-vinyl-dark-rituals`; confirm “Add to Cart”; screenshot `product.png`.
   - Add to cart → open checkout modal; fill AU address; click “Refresh rates”; select first option; report label/price; screenshot `checkout-shipping.png`.
   - Continue → Place order; confirm redirect to `checkout.stripe.com`; screenshot `stripe.png`.
5. Optional admin visuals: capture sticky header/zebra on Products/Variants/Inventory, CSV export confirmation, etc.

**Constraints**
- Never capture or echo credentials. Ask the user to log in or provide temporary creds if needed.
- Keep work scoped to QA validation (no code edits unless explicitly requested).
- If AusPost env vars are absent, note `configured:false` from `/api/shipping/quote` and confirm Stripe static rates appear.

**Deliverables**
- Short pass/fail summary with screenshot names/links.
- Note any regressions, flaky selectors, or missing shipping options for follow-up.

---
