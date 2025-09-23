# Next Steps (Dev Branch)

Last modified: 2025-09-23

This backlog captures the active workstreams after the storefront storytelling cleanup and Journal integration. Ship everything on `dev`; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-09-23
- Storytelling surfaces still hide until Supabase tables contain real content; ready for owner copy drop.
- Journal section continues to pull live Supabase articles with featured + secondary layout and friendly fallback messaging.
- Campaign hero feature flag remains opt-in—Classic/Split/Minimal layouts, badges, and motion controls verified.
- Admin copilot now collects structured context, supports direct media uploads, and prepares for full product/article pipelines.
- `npm run audit:a11y` covers home + dashboard (home 1.00, dashboard pending contrast fixes); lint debt persists in admin code.
- Puppeteer smoke remains green; assistant upload endpoint audited, ready for pipeline orchestration.

## Immediate Execution Queue (Priority A)
1. **Storytelling content population**
   - Seed real entries for `story_timeline` and `story_testimonials` (owner supplied copy).
   - Draft public-safe newsletter heading/subheading once ESP is chosen.
   - Update `/admin/story` guidance once content is live (screenshots + doc snippets).
2. **Newsletter/ESP integration spike**
   - Finalise ESP vs. Buttondown vs. n8n automation bridge; document pros/cons for AI-driven workflows.
   - Prototype collection endpoint + Supabase storage (or direct ESP subscribe) without exposing API keys client-side.
   - Extend QA checklist once sign-up flow is wired.
3. **Admin assistive tooling**
  - [x] Phase 0 — retrieval copilot with doc citations.
  - [x] Phase 1A — product draft creation runs via confirmed assistant actions (audit logged, drafts inactive by default).
  - [x] Phase 1B — copilot “Receive stock” action live with confirmation modal + audit logging.
  - [x] Phase 1C — analytics summary + order lookup actions live (`assistant.analytics.summarize`, `assistant.order.lookup`).
  - [x] Phase 2 — end-to-end pipelines (no n8n) so the assistant can launch releases solo.
    - [x] Implement `create_product_full` pipeline (media upload → enrichment → publish + optional hero update).
    - [x] Implement `draft_article` / `publish_article` pipeline with AI copy + optional imagery.
    - [x] Ship assistant session logging (sessions, events, upload audit) wired into all assistant endpoints.
    - [x] Build lightweight `/admin/assistant/logs` viewer on top of the new tables.
    - [x] Extend responses with multi-step plan previews + undo hooks for high-impact actions.
4. **Admin dashboard 2.0 follow-ups**
   - [x] Needs fulfilment panel quick-export/filter links (CSV download + animated task list).
   - Alert threshold + Slack webhook wiring (blocked on secrets).
   - Dashboard motion tokens + aXe review after visual polish lands (motion presets partially applied; accessibility audit pending).
   - [ ] Address Lighthouse dashboard findings (progressbar naming, breadcrumb hit-area, contrast, unlabeled fields) and confirm ≥0.95 score via `npm run audit:a11y` post-deploy.

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

## QA & Automation To-Dos
- [ ] Extend Puppeteer smoke to cover Journal feature card + fallback when no articles exist.
- [x] Add baseline Vitest coverage for dashboard RPC mappers (`mapRevenueSeries`, `mapLowStockTrend`).
- [ ] Schedule Lighthouse/aXe runs post visual refresh (hero + Journal) to baseline performance/accessibility.
- [ ] Evaluate Playwright + axe integration to complement Lighthouse in automated QA.
- [x] Automate accessibility scan via `npm run audit:a11y` (homepage + admin dashboard Lighthouse JSON reports).
- [ ] Reduce ESLint `no-explicit-any` debt — storefront product detail & article metadata now typed (2025-09-22); bring admin dashboards/contexts in line next.
- [ ] Add Vitest coverage for assistant upload endpoint & future pipeline orchestrators.
- [ ] Add Playwright/puppeteer smoke covering “upload media → publish product” once pipeline lands.
- [ ] Re-enable assistant undo Vitest suites (currently skipped) once checkout/Stripe mocks are restored; add assertions for plan preview copy + undo expiry.

## Documentation & Ops
- [x] Capture assistant pipeline specs (`docs/AGENT-PIPELINES.md`) and update workflows to mention structured context panel.
- [x] Keep `docs/AGENT-PIPELINES.md` in sync as `create_product_full` / `draft_article` ship (note model prompts, fallbacks).
- [ ] Capture screenshots of the new Journal layout once real articles are published.
- [ ] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` after ESP integration lands.
- [ ] Log assistant pipeline milestones in the next session log + QA checklist once orchestration lands.

Keep this doc updated as tasks complete (`[x]`) or plans shift.
