## Continuation Prompt (New Chat)

_Last updated: 2025-09-20_

Paste the following into a fresh Codex session whenever you need to resume work on grimforge-site with MCP tools enabled.

---

**Context Snapshot**
- Documentation map lives in `docs/README.md`; start there to orient before coding.
- Repo: `grimforge-site` — Next.js 15 App Router storefront with Refine/AntD admin.
- Working branch: `dev` (single-branch workflow, see `AGENTS.md`).
- Branch deploy: https://dev--obsidianriterecords.netlify.app (treat as QA surface).
- Core docs: `AGENTS.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`, `docs/QA-CHECKLIST.md`, `docs/PRODUCTION-LAUNCH-CHECKLIST.md`.
- MCP setup: Supabase MCP reads `supabase/config.toml` (service-role token `sbp_*`); Puppeteer MCP runs via Docker `docker run --rm --init -e DOCKER_CONTAINER=true mcp/puppeteer`.
- Seed & policies: `docs/SUPABASE-SEED.md`. Shipping/AusPost behaviour documented in `docs/SHIPPING-AUSPOST.md`.
- Feature flags: campaign hero (`NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN`), admin bulk tools, Slack alerts; defaults noted in `docs/NEXT-STEPS.md`.
- Before coding, skim `docs/IMPLEMENTATION-PLAN.md` to understand phased priorities; keep `docs/NEXT-STEPS.md` in sync with any new decisions.

**Goals When Restarting**
1. Confirm branch deploy health: homepage 200, `/status` env flags, seeded product slug reachable.
2. Run the Puppeteer smoke (`npm run test:puppeteer`) per `docs/QA-CHECKLIST.md`; capture and review screenshots in `docs/qa-screenshots/`.
3. Validate catalog quick actions (hover/focus add-to-cart + wishlist) and admin critical flows (product create/save, dashboard alerts, Slack test button where creds allow).
4. Cycle campaign hero layouts (Classic/Split/Minimal) and ensure badges, highlights, and media controls behave; note reduced-motion fallback.
5. Confirm product detail gallery (thumbnails + lightbox) and sticky buy module behaviour across breakpoints.
6. Confirm dashboard revenue goal card progress + settings save behaviour.
7. Validate checkout sheet: multi-step flow, wallet row remains disabled without a Stripe publishable key, and totals recalc correctly.
8. Verify storytelling surfaces: `/admin/story` CRUD works, storefront hides timeline/testimonials/newsletter when tables are empty, and shows real content when populated.
9. Confirm homepage Journal renders featured + secondary articles when Supabase has published entries (fallback copy otherwise).
10. Download scoped CSVs from the needs fulfilment panel exports when counts >0 (awaiting fulfilment, low stock, pending payments).
11. Update task trackers (`docs/NEXT-STEPS.md`, latest `docs/SESSION-YYYY-MM-DD.md`) with findings.

**Playbook**
1. **Tool readiness** — Ensure Supabase + Puppeteer MCP servers are running; request restart if unavailable.
2. **Public checks**
   - Load homepage; record status + `<title>`; screenshot `home.png`.
   - Trigger vinyl anchor (header/foot link) and verify URL `/#vinyl`; screenshot `vinyl.png`.
   - Fetch `/robots.txt`, `/sitemap.xml`; confirm 200.
   - Optional: toggle campaign hero flag via query (`/?previewCampaign=slug`) if testing visuals.
   - Confirm Journal section: capture `journal.png` when articles exist or note fallback copy if empty.
   - Note preorder module shows disabled email input/button (“Email list opens soon”).
3. **Admin checks**
   - Visit `/admin/login`; pause for manual auth if needed.
   - Create or verify `test-vinyl-dark-rituals` via `/admin/products/create` (fields: slug, title, artist, format, price 45.99, stock 10, Active).
   - Confirm order dashboard alerts respect thresholds; run Slack “Send test alert” if webhook configured.
   - Screenshot key confirmations (`admin-product-created.png`, `dashboard-alert.png`).
   - Visit `/admin/story`; add/remove timeline/testimonial rows as needed and ensure the storefront reflects changes after refresh.
   - Use the needs fulfilment export icons to download scoped CSV snapshots when counts are non-zero; note filenames.
4. **Product slug** — Load `/products/test-vinyl-dark-rituals`; ensure hydration (price + CTA); screenshot `product.png`.
5. **Optional flows**
   - Checkout smoke: capture shipping modal (`checkout-shipping.png`) and Stripe redirect (`stripe.png`).
   - Toggle campaign layout + badge/highlight fields to align with storefront variants; record screenshots if visuals changed.
   - Adjust revenue goal target/period in `/admin/settings`, confirm dashboard reflects updates after refresh.
   - Walk through product gallery thumbnails/lightbox and capture `product-gallery.png` if visuals changed.
   - Run bulk order action or packing slip download if relevant to current sprint.
6. **Wrap-up** — Update docs/notes, file issues, and refresh `docs/NEXT-STEPS.md` and session log with outcomes.
   - Cross-check `docs/IMPLEMENTATION-PLAN.md` milestones; adjust status if scope changed.

**Constraints & Tips**
- Never log secrets or credentials. Use owner-provided accounts for admin flows.
- Keep work scoped to QA unless explicitly tasked with code changes.
- AusPost creds optional; if absent, `/api/shipping/quote` should report `configured:false` and fallback to Stripe static rates.
- Respect automation defaults: run lint/type-check/build when touching code (see `AGENTS.md`).

**Deliverables**
- Pass/fail summary referencing screenshot filenames.
- Noted regressions, missing copy, or env issues with links to supporting evidence.
- Updated backlog/session notes capturing decisions and outstanding follow-ups.

---
