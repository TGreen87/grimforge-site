# Next Steps (Dev Branch)

Last modified: 2025-09-20

This backlog captures the active workstreams after the storefront storytelling cleanup and Journal integration. Ship everything on `dev`; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-09-20
- Storytelling surfaces (timeline, testimonials, newsletter CTA) now ship empty by default; storefront hides them until genuine content is added.
- Journal section pulls the latest published Supabase articles (no placeholder cards) with featured + secondary layout.
- Heading typography switched to Marcellus for better legibility while retaining gothic styling tokens.
- Preorder email capture is disabled until the marketing stack is ready (input + button rendered read-only).
- Puppeteer smoke remains green; lint still carries historic `any`/hook warnings (no regressions introduced).

## Immediate Execution Queue (Priority A)
1. **Storytelling content population**
   - Seed real entries for `story_timeline` and `story_testimonials` (owner supplied copy).
   - Draft public-safe newsletter heading/subheading once ESP is chosen.
   - Update `/admin/story` guidance once content is live (screenshots + doc snippets).
2. **Newsletter/ESP integration spike**
   - Evaluate Buttondown vs. Mailchimp for double opt-in + API support.
   - Prototype collection endpoint + Supabase storage (or direct ESP subscribe) without exposing API keys client-side.
   - Extend QA checklist once sign-up flow is wired.
3. **Admin dashboard 2.0 follow-ups**
   - Needs fulfilment panel quick-export/filter links.
   - Alert threshold + Slack webhook wiring (blocked on secrets).
   - Dashboard motion tokens + aXe review after visual polish lands.

## Short-Term Enhancements (Priority B)
- Storefront
  - Populate campaign hero presets with real release copy once assets approved.
  - Add owner-configurable highlight articles to the Journal grid (fallback to automatic order when none chosen).
  - Introduce optional newsletter footnote once ESP integration is settled.
- Orders Workflow
  - AusPost label hook (pending credentials).
  - Branded PDF packing slips (follow-up to HTML export) for bulk actions.
- Analytics & Observability
  - Select analytics stack (Plausible vs. Vercel Analytics) and document rollout plan.
  - Add structured logging for `/api/client-logs` and dashboard RPCs.

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
- [ ] Add Vitest coverage for story content RPCs once API endpoints are finalized.
- [ ] Schedule Lighthouse/aXe runs post visual refresh (hero + Journal) to baseline performance/accessibility.

## Documentation & Ops
- [x] Update `docs/AGENTS.md`, `docs/README.md`, and `docs/QA-CHECKLIST.md` for storytelling cleanup + Journal behaviour.
- [ ] Capture screenshots of the new Journal layout once real articles are published.
- [ ] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` after ESP integration lands.

Keep this doc updated as tasks complete (`[x]`) or plans shift.
