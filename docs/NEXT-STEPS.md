# Next Steps (Dev Branch)

Last modified: 2025-09-21

This backlog captures the active workstreams after the storefront storytelling cleanup and Journal integration. Ship everything on `dev`; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-09-21
- Storytelling surfaces (timeline, testimonials, newsletter CTA) now ship empty by default; storefront hides them until genuine content is added.
- Journal section pulls the latest published Supabase articles (no placeholder cards) with featured + secondary layout.
- Heading typography switched to Marcellus for better legibility while retaining gothic styling tokens.
- Preorder email capture is disabled until the marketing stack is ready (input + button rendered read-only).
- Puppeteer smoke remains green; lint still carries historic `any`/hook warnings (no regressions introduced).
- Lighthouse accessibility audit now automated via `npm run audit:a11y`; homepage scores 1.00, admin dashboard currently at 0.82 pending UI contrast/label tweaks.
- First-party analytics beacon (`/api/analytics/ingest`) now logs page views + metadata into Supabase; `/admin/analytics` visualises the last ~7 days without third-party trackers.
- Admin Copilot drawer (⌘⇧C) answers workflow questions using embedded project docs; responses cite sources for quick verification.

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
   - [ ] Phase 2 — publish n8n webhook catalogue and wire long-running automations (campaign refresh, content ingest) with audit logging.
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

## Documentation & Ops
- [x] Update `docs/AGENTS.md`, `docs/README.md`, and `docs/QA-CHECKLIST.md` for storytelling cleanup + Journal behaviour.
- [ ] Capture screenshots of the new Journal layout once real articles are published.
- [ ] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` after ESP integration lands.

Keep this doc updated as tasks complete (`[x]`) or plans shift.
