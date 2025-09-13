# Continuation Prompt (New Chat)

Use this prompt to spin up a fresh chat with MCP tools loaded and continue QA on the dev Branch Deploy.

---

Context:
- Repo: grimforge-site (Next.js 15 App Router; Refine + AntD admin)
- Branch deploy (dev): https://dev--obsidianriterecords.netlify.app
- Planning docs: `docs/AGENTS.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`
- QA guide: `docs/QA-CHECKLIST.md`
- MCP setup: `docs/MCP-CONFIG.md`; prompts: `docs/MCP-PUPPETEER.md`
- Shipping: customer‑pays; AusPost when configured; Stripe static fallback otherwise
- Admin visuals: modern shell, sticky headers, density toggle, Cards/Board views, Kbar actions
- EmptyStates + CSV export: Products/Inventory enabled

Goals:
1) Run Puppeteer MCP smoke against the dev branch URL.
2) Create a test product via admin (active + slug), then verify end‑to‑end checkout with selectable shipping.
3) Capture brief pass/fail notes and screenshots, and update docs if anything regresses.

Instructions for the assistant:
1) Confirm MCP tools are available (Puppeteer or Playwright). If not, ask to restart with MCP.
2) Public checks:
   - Open the homepage; report status and title; screenshot home.png.
   - Click the header “Vinyl” control; confirm hash/tab sync; screenshot vinyl.png.
   - Check `/robots.txt` and `/sitemap.xml` return 200.
3) Admin (pause for manual login if needed):
   - Open `/admin/login`; wait for user to log in.
   - Navigate to `/admin/products/create`; create:
     - URL (link): `test-vinyl-dark-rituals`
     - Title: `Test Vinyl — Dark Rituals`
     - Artist: `Shadowmoon`
     - Format: `Vinyl`
     - Price: `45.99`
     - Stock: `10`
     - Active: `On`
     - Save; screenshot admin-product-created.png.
4) Product + checkout (shipping):
   - Open `/products/test-vinyl-dark-rituals`; verify “Add to Cart”; screenshot product.png.
   - Add to cart → open checkout modal; fill AU address; click “Refresh rates”; select first option; report label/price; screenshot checkout-shipping.png.
   - Click Continue → Place order; verify `checkout.stripe.com`; screenshot stripe.png.
5) Admin visuals (optional): sticky headers/zebra on Products/Variants/Inventory; Inventory CSV export; screenshots.

Constraints:
- Do not store or echo credentials. Use existing session or ask the user to provide/log in during the run.
- Keep changes scoped to QA (no code edits unless requested).
- If AusPost is not configured, confirm Stripe static rates appear (configured:false in `/api/shipping/quote`).

Deliverables:
- Short pass/fail summary with any screenshot links/attachments.
- Note any regressions or flaky selectors for follow‑up.

---

