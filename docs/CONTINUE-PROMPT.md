## Continuation Prompt (New Chat)

_Last updated: 2025-11-20_

Paste this at the top of a fresh Codex session to resume work on **grimforge-site**.

---

### Project Snapshot
- **Stack**: Next.js 15 App Router, Supabase (Auth/DB/RLS), Stripe Checkout, Netlify branch deploys, Refine/AntD admin.
- **Branches**: `dev_stripe` = active feature branch; `main` = production. No PRs—push directly.
- **Deploys**: https://dev-stripe--obsidianriterecords.netlify.app (QA) and https://obsidianriterecords.com (prod).
- **Data**: Products/inventory live in Supabase; Stripe is payments-only.

### Current Health (truthful)
- **Netlify build**: Last `dev_stripe` deploy succeeded after navigation fixes.
- **Lint / Type-check**: Admin typings still known to fail locally; run if changing TS and note any blockers.
- **Tests**: `npm test` still red due to mocks/admin types—document failures, don’t rely on green.
- **Browser tool**: Should work; if not, note the error and proceed via Netlify manual checks.

### Key Rules
1. Work on `dev_stripe`; promote to `main` after QA. No PRs.
2. Prefer remote verification on branch deploys; avoid local `npm run dev` unless debugging.
3. Keep sensitive keys out of commits. Use existing env vars on Netlify.
4. When touching payments: Checkout creation under `app/api/checkout/route.ts`; webhook in `app/api/stripe/webhook/route.ts`; never expose service keys client-side.

### Recent Decisions
- Navigation reliability issue on Netlify was mitigated by falling back to native anchors. All CTAs now use `<a>` or `window.location.assign()`.
- Cart flow: client cart in context/localStorage; server re-validates inventory on POST `/api/checkout` before creating Stripe session and `orders`/`order_items` snapshots.
- Webhook updates order status and decrements inventory via existing schema (`orders`, `order_items`, `decrement_inventory`).
- Legacy Vite/SPA files under `src/__legacy_pages` were removed; they were not used by App Router.

### Quick Re-start Checklist
- `git status` (ensure on `dev_stripe`).
- Visit the dev deploy; run: add item → `/cart` → Checkout → Stripe test card 4242.
- Verify `/order/success` CTAs navigate normally (anchors, no right-click needed).
- If changing migrations, keep files under `supabase/migrations/` (not `tests/sql`).
- Update `docs/SESSION-YYYY-MM-DD.md` with outcomes and note any failing commands.

