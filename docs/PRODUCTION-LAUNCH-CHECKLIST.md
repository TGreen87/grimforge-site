# Production Launch Checklist

_Last updated: 2025-09-19_

This document tracks every action required to ship grimforge-site to production once Stripe/AusPost keys are available. Update the status column and add notes as you complete tasks. Reference `docs/README.md` for related ops guides.

| Status | Area | Task | Owner Notes |
|--------|------|------|-------------|
| ☐ | Keys | Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` to Netlify + `.env.local`; redeploy `dev`. |  |
| ☐ | Keys | Add AusPost credentials (`AUSPOST_API_KEY`, `AUSPOST_ACCOUNT_NUMBER`, etc.) to Netlify + `.env.local`. | Waiting on owner |
| ☐ | Checkout | Run `/api/checkout` manual test with real publishable key; confirm Stripe session, verify totals and shipping. |  |
| ☐ | Checkout | Capture Stripe landing page screenshot for owner documentation. |  |
| ☐ | Webhooks | Stripe dashboard → Events: verify webhook delivery success (`checkout.session.completed`, `payment_intent.*`). |  |
| ☐ | Shipping | Test AusPost quote with domestic (VIC → NSW) and international (AU → NZ) addresses; note rates. |  |
| ☐ | Content | Replace `public/og-image.jpg` with final hero artwork; re-run `npx linkinator`. |  |
| ☐ | Content | Final proofread of `/legal/*` pages (tone, links). |  |
| ☐ | Documentation | Produce owner-facing “Admin quick start” (adding product, stock, checkout flow). |  |
| ☐ | QA | `npm run test:puppeteer` w/ admin creds (after keys). Attach screenshots in `docs/qa-screenshots/`. |  |
| ☐ | QA | With hero flag on, smoke Classic/Split/Minimal layouts, verify badge/highlights, reduced-motion fallback, and media controls. |  |
| ☐ | QA | Dashboard revenue goal card shows correct progress and saving a new target/period persists across refresh. |  |
| ☐ | QA | Story content (timeline/testimonials/newsletter) reflects Supabase entries and `/admin/story` updates publish instantly. |  |
| ☐ | QA | Manual smoke on production preview (`/`, `/products/<slug>`, `/admin/dashboard`) post-deploy. |  |
| ☐ | Release | Merge `dev → main`; monitor Netlify deploy; announce go-live. |  |

## Additional Notes
- Keep Stripe dashboard open while testing to monitor payments, payouts, and webhook events.
- After launch, schedule routine tasks (weekly link crawl, Stripe payout check, inventory audit).
