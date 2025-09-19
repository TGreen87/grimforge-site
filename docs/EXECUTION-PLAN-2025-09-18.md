# Execution Plan — September 18, 2025

_Last updated: 2025-09-19_

This snapshot complements `docs/IMPLEMENTATION-PLAN.md`; see `docs/README.md` for the full documentation map.

This working plan translates the refreshed roadmap into concrete delivery slices for the next 2–3 development sprints. Each section lists context, deliverables, acceptance criteria, dependencies, and observability hooks. All work lands on `dev`; every slice ends with automation + doc updates and a Netlify branch deploy verification.

---

## 1. Admin Operations & Alerting

**Objective:** Give the owner proactive fulfilment controls, reliable notifications, and actionable dashboards.

| Milestone | Deliverables | Acceptance | Dependencies | Notes |
|-----------|--------------|------------|--------------|-------|
| A1 – Bulk Fulfilment Completion | • Extend bulk action dropdown with _Cancel_ and _Refund_ flows.<br>• Confirmation modals with reason capture.<br>• Update `/api/admin/orders/bulk/status` to attach optional memo + notify customers (email stub).<br>• Log events (`order.cancelled`, `order.refunded`) with metadata (reason, actor). | • Bulk cancel/refund writes audit logs + timeline entries.<br>• Optional memo stored on order metadata.<br>• Customer notification toggled via future integration flag. | • `audit_logs` table (complete).<br>• Email infra (plan stub). | Reuse existing dropdown; add disabled state when selection empty.
| A2 – Packing Slip Upgrade | • Replace HTML response with branded PDF (e.g., `@react-pdf/renderer` or serverless headless Chromium).<br>• Include barcode/QR (order id), band logo, shipping notes.<br>• Option to attach slip to order email. | • PDF renders within 2s for 20-line orders.<br>• Download link prompts PDF; fallback HTML when PDF generation fails. | • Evaluate PDF library (headless chrome vs. react-pdf). | Provide feature flag to fall back to HTML.
| A3 – AusPost Label Hook (blocked on creds) | • Prepare `/api/admin/orders/[id]/shipping-label` calling AusPost once credentials arrive.<br>• Store label URL/status in Supabase.<br>• Update UI with “Generate label” button. | • When creds specified, generating label writes timeline entry + stores label metadata. | • AusPost API credentials (blocked). | Document manual fallback until keys provided.

**Alerting & Settings**
- Expand `/admin/settings` to include revenue goals, daily digest opt-in, and toggles for Slack vs. email.
- Add dashboard banners when thresholds exceeded (awaiting fulfilment, low stock) and link to settings.
- Send Slack message (via stored webhook) when:
  - Paid-but-unshipped orders exceed threshold.
  - Low-stock list changes state.
  - Stripe payout error occurs (from webhook).

**Observability**
- Add log line + audit entry whenever settings change (existing `updated_by` will help).
- Capture Slack delivery success/failure in `audit_logs` (`alert.sent_slack`).

---

## 2. Storefront Hero & Campaign System

**Objective:** Replace static hero with campaign-driven, motion-aware module that respects accessibility and marketing needs.

| Phase | Deliverables | Acceptance | Dependencies |
|-------|--------------|------------|--------------|
| H1 – Hero MVP | • Consume active campaign (already wired) with optional audio preview (play/pause, mute).<br>• Reduced-motion fallback (skip video, fade image).<br>• Dark overlay tuning for readability.<br>• Owner-editable CTA copy via admin campaign forms. | • When feature flag on, hero renders campaign data; otherwise legacy hero.<br>• `prefers-reduced-motion` returns static variant. | • Campaign CRUD (done). |
| H2 – Campaign Scheduler & Preview | • Add start/end scheduling enforcement on server/client.<br>• Preview mode in admin (“View on site”).<br>• Version history (keep last 5 revisions). | • Staged campaign can be previewed without activating.<br>• Admin sees revision list; revert sets previous payload active. | • `campaigns` table (extend with revision log or history table). |
| H3 – Advanced Blocks | • Support hero layouts (video, static, split layout).<br>• Introduce “spotlight card” component for secondary campaigns.<br>• Add optional tracklist snippet. | • Owner selects layout from dropdown; preview updates instantly. | • Additional design assets. |

**Testing**
- Add Playwright snapshot capturing hero (flag on/off).
- Lighthouse audit to ensure Largest Contentful Paint stays <2.5s with hero flag enabled.

---

## 3. Catalog & Product Detail Refresh

**Objective:** Align browse experience with brand while keeping performance + accessibility high.

| Sprint Block | Highlights |
|--------------|------------|
| C1 – Catalog Interactions | • Quick add-to-cart & wishlist buttons (keyboard accessible).<br>• Skeleton loaders + focus outlines.<br>• Filter chips (format, availability, limited). |
| C2 – Product Gallery | • Lightbox with zoom + keyboard nav.<br>• Sticky buy module with shipping estimator (reuse alerts thresholds). |
| C3 – Story & Trust | • “About the Label” timeline block.<br>• Testimonials carousel (Embla).<br>• Newsletter opt-in tied to provider TBD. |

Each block finishes with updated QA checklist entries + new puppeteer shots.

---

## 4. Checkout & Fulfilment Automation

1. **Checkout Sheet Upgrade** (blocked on publishable key)
   - Convert modal to multi-step sheet.
   - Display wallet buttons (Apple/Google) when key present.
   - Persist shipping selection and show timeline icons.

2. **Webhook Hardening**
   - Confirm Stripe webhook idempotency (store event ids).
   - Retry handling with dead-letter queue (Supabase function or log table).

3. **Recurring Ops Scripts**
   - Scheduled script to email weekly fulfilment digest using alert thresholds.
   - CLI script to export Slack-friendly summary.

---

## 5. Integrations & Analytics

- **Slack Ops Alerts**: Fire via stored webhook; add test button in settings page.
- **Image Hosting Decision**: Evaluate Supabase Storage vs. Cloudinary for campaign hero + catalog; document in `docs/SITE-VISUALS-RFC.md`.
- **Analytics Stack**: Compare Plausible vs. Vercel; choose one for campaign conversion tracking.
- **Newsletter Provider**: Select Mailchimp/Buttondown, integrate with new footer block.

Deliverables include documentation updates (`ENV-QUICKSTART.md`, provider setup guide).

---

## 6. QA, Automation & Docs

- Extend Puppeteer smoke to:
  - Edit campaign, toggle feature flag, verify hero variant.
  - Run bulk order actions, confirm timeline entries, download packing slip.
- Add Vitest/Playwright coverage for:
  - Campaign hero rendering (flag on/off).
  - `/api/admin/settings` GET/POST returning expected payloads.
  - Bulk status API verifying audit log insert.
- Refresh `docs/QA-CHECKLIST.md` with new flows (settings, hero flag, Slack test).
- Record major pushes in `docs/SESSION-YYYY-MM-DD.md`; ensure `NEXT-STEPS.md` stays live.

---

## 7. Risks & Mitigations

- **Lint backlog**: Prioritize targeted cleanup sprint before enabling CI lint (track in separate task list).
- **Feature flags**: Keep `NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN` defaulted off until QA complete; add fallback routes to avoid hydration mismatch.
- **Slack webhook**: Guard outgoing requests; log failures; avoid blocking dashboard load.
- **PDF generation**: Headless Chromium may slow builds; consider serverless function/Lambda if necessary.

---

## 8. Suggested Sprint Order

1. Bulk fulfilment completion + alert wiring (A1, A2 partial, Alerts Slack hooks).
2. Hero MVP polish + scheduling (H1 + pieces of H2).
3. Catalog interaction upgrades (C1) and packing slip PDF (remaining A2).
4. Checkout sheet groundwork + analytics provider decision.
5. Storefront storytelling + newsletter integration (C3) once hero stable.

Each sprint ends with:
- Automation runs (`type-check`, `lint`, `test:puppeteer`).
- Docs refresh (NEXT-STEPS, SESSION log, plan doc).
- Netlify deploy verification (`dev` branch).

---

## 9. Owner Communication

- Once Slack alerts ready, provide settings walkthrough (screenshots + doc update).
- Share hero feature flag instructions (how to preview campaign before go-live).
- Keep `docs/ADMIN-WORKFLOWS.md` synced after each UI/flow addition.

---

**Tracking:** Document progress in `docs/SESSION-2025-09-18.md` (or new dated session file) and update `docs/NEXT-STEPS.md` as tasks land. The plan will evolve; append new entries with timestamps when scope changes.

