# Next Steps (Dev Branch)

Last modified: 2025-10-24

This backlog captures the active workstreams after the storefront storytelling cleanup and Journal integration. Ship everything on `dev`; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-10-24
- Netlify Branch Deploys (`dev`, `main`) respond 200; `/status` on `dev` shows Supabase URL/anon/service keys present under Node 22. Keep relying on deploys for QA instead of local builds.
- Admin login loop on production is resolved (2025-10-24); both `dev` and `main` allow owner sign-in. Leave the QA checklist preflight in place for regression detection.
- Copilot infrastructure is live, but OpenAI credentials/actions still need a full smoke on `dev` before giving the owner the green light.
- Checkout migration: bespoke Stripe + AusPost shipping flow retired 2025-11-06; align new tasks with Shopify storefront APIs once available.
- Local `npm run build`, `npm run lint`, and `npm test` continue to fail (SWC crash, admin `no-explicit-any`, Stripe/AusPost mocks). Document outcomes when you touch them, but default to remote validation.
- Storytelling surfaces and Journal behave as expected with Supabase data; continue hiding sections when tables are empty.

## Immediate Execution Queue (Priority A)
1. **Assistant smoke on deploy**
   - Confirm OpenAI env vars (`OPENAI_API_KEY`, `ASSISTANT_CHAT_MODEL`, `ASSISTANT_PIPELINE_MODEL`) exist in Netlify; redeploy `dev` if they were recently updated.
   - On the live branch deploy, open the copilot drawer, upload a sample asset, run a low-risk action (analytics summary), and verify undo tokens/write logs succeed.
   - Log outcomes and any blockers in the latest session file.
2. **Launch readiness sweep**
   - Populate storytelling content in Supabase (timeline/testimonials/newsletter) and capture updated storefront/admin screenshots directly from the branch deploy.
    - Choose ESP approach for newsletter CTA; hide the CTA until ready.
   - Run remote smoke via Puppeteer (`BASE_URL=` branch URL) or manual checks and archive results in `docs/qa-screenshots/`.
3. **Test & lint stabilisation**
   - Plan targeted fixes for admin `no-explicit-any` debt and Stripe/AusPost mocks so that `npm run lint` / `npm test` can pass when we bring them back online.
   - Document each attempt (command + failure summary) in the session log until suites are green.
   - Once mocks are stable, re-enable the assistant undo specs.
4. **UI polish for launch**
   - Dashboard: surface automation status (lint/test/env badges) and recent changes panel.
   - Campaign editor: add live preview/diff to help owners verify hero copy before publishing.
   - Storytelling admin: add drag-and-drop ordering and richer empty states.

## Short-Term Enhancements (Priority B)
- Storefront
  - Populate campaign hero presets with real release copy once assets approved.
  - Add owner-configurable highlight articles to the Journal grid (fallback to automatic order when none chosen).
  - Introduce optional newsletter footnote once ESP integration is settled.
- Orders Workflow
  - AusPost label hook (pending credentials).
  - Branded PDF packing slips (follow-up to HTML export) for bulk actions.
- Analytics & Observability
  - [x] Ship first-party analytics logger + admin overview.
  - [ ] Add structured logging for `/api/client-logs` and admin RPCs (tie into audit/event stream).
  - [ ] Revisit Plausible/Umami once traffic warrants advanced reporting (can ingest the beacon feed).

## Research / Decisions (Priority C)
- Pick lightweight animation helper for list transitions (`auto-animate` vs `motion.dev`).
- Confirm image hosting plan (Supabase Storage hardening vs. Cloudinary) for campaign hero/media.
- Determine marketing automation cadence once ESP selected (welcome drips vs. monthly digest).

## Dependencies & Blockers
- Stripe publishable key: required to enable wallet buttons in checkout.
- AusPost API credentials: optional—Stripe static rates are the default until we opt back into AusPost.
- ESP/API keys: required to enable newsletter opt-in and remove read-only inputs.
- Slack webhook + alert thresholds: required to finish dashboard automation slice.

- [ ] Extend Puppeteer smoke to cover Journal feature card + fallback when no articles exist.
- [x] Add baseline Vitest coverage for dashboard RPC mappers (`mapRevenueSeries`, `mapLowStockTrend`).
- [ ] Schedule Lighthouse/aXe runs post visual refresh (hero + Journal) to baseline performance/accessibility.
- [ ] Evaluate Playwright + axe integration to complement Lighthouse in automated QA.
- [ ] Reduce ESLint `no-explicit-any` debt — storefront product detail & article metadata now typed (2025-09-22); bring admin dashboards/contexts in line next.
- [ ] Add Vitest coverage for assistant upload endpoint & future pipeline orchestrators.
- [ ] Add Playwright/Puppeteer smoke covering “upload media → publish product” once pipeline lands (after env fixes).
- [ ] Document lint/test results in session log once suites pass.
- [ ] Re-enable assistant undo Vitest suites (currently skipped) once checkout/Stripe mocks are restored; add assertions for plan preview copy + undo expiry.

## Documentation & Ops
- [x] Capture assistant pipeline specs (`docs/AGENT-PIPELINES.md`) and update workflows to mention structured context panel.
- [x] Keep `docs/AGENT-PIPELINES.md` in sync as `create_product_full` / `draft_article` ship (note model prompts, fallbacks).
- [ ] Capture screenshots of the new Journal layout once real articles are published.
- [ ] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` after ESP integration lands.
- [ ] Log assistant pipeline milestones in the next session log + QA checklist once orchestration lands.

Keep this doc updated as tasks complete (`[x]`) or plans shift.
