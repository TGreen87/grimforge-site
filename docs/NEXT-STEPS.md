# Next Steps (Dev Branch)

Last modified: 2025-09-24

This backlog captures the active workstreams after the storefront storytelling cleanup and Journal integration. Ship everything on `dev`; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-09-24
- Storefront storytelling blocks remain data-driven; timelines/testimonials/newsletter stay hidden until real copy lands.
- Journal grid renders published Supabase articles with friendly fallback messaging when empty.
- Campaign hero system (Classic/Split/Minimal) is stable but still feature-flagged; motion/reduced-motion behaviour verified.
- Admin copilot infrastructure (sessions, undo tokens, plan previews) is in place, but OpenAI/Supabase credentials must be restored before the assistant can run. Copilot work is paused while we focus on launch readiness.
- Branch deploy currently lacks `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` and fresh OPENAI credentials; `/admin/assistant` fails until the envs are set and `dev` is redeployed.
- Lint (`npm run lint`) and test (`npm test`) remain red due to long-standing admin typings and Stripe/checkout mocks; we must stabilise these before launch.
- Latest UI/doc updates (Sept 24) are pending a branch deploy; ensure Netlify rebuilds after env fixes.

## Immediate Execution Queue (Priority A)
1. **Environment + Deploy Fix (blocker)**
   - Set `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ASSISTANT_CHAT_MODEL`, `ASSISTANT_PIPELINE_MODEL`, and prompt overrides in Netlify (match `.env.local`).
   - Redeploy the `dev` branch once envs are present; confirm `/status` and `/admin/assistant` respond without 401/500.
   - Optional: add `ASSISTANT_ALLOW_PREVIEW=1` for branch deploys.
2. **Launch Readiness Sweep**
   - Populate production-ready storytelling content (timeline/testimonials/newsletter) and capture fresh storefront/admin screenshots.
   - Finalise ESP selection and wire newsletter signup (if decision made); otherwise hide CTA copy.
   - Run `npm run audit:a11y` + Puppeteer smoke and attach results to docs.
3. **Test & Lint Stabilisation**
   - Restore Stripe/checkout/webhook Vitest mocks so `npm test` passes.
   - Address admin `no-explicit-any` lint debt or add targeted typing fixes; goal is a clean `npm run lint` before launch.
   - Re-enable assistant undo specs once mocks are stable.
4. **UI Polish for Launch**
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
- AusPost API credentials: required for live label generation + accurate shipping ETA copy.
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
