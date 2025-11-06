# Production Launch Checklist

_Last updated: 2025-10-24_

This document tracks every action required to ship grimforge-site to production once Stripe/AusPost keys are available. Update the status column and add notes as you complete tasks. Reference `docs/README.md` for related ops guides.

| Status | Area | Task | Owner Notes |
|--------|------|------|-------------|
| ☐ | Keys | Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` to Netlify (mirror in `.env.local` only if you need a local run); redeploy `dev`. |  |
| ☑ | Auth | Confirm owner login succeeds on `https://obsidianriterecords.com/admin/login`; compare against `dev` if it loops. | Resolved 2025-10-24 |
| — | Shipping (legacy) | AusPost credentials not required; confirm Stripe static rates cover Standard/Express tiers. | Retired 2025-11-06 (Shopify shipping) |
| — | Checkout (legacy) | Legacy `/api/checkout` manual test superseded by Shopify storefront checkout. | Retired 2025-11-06 |
| ☐ | Checkout | Capture Stripe landing page screenshot for owner documentation. |  |
| ☐ | Webhooks | Stripe dashboard → Events: verify webhook delivery success (`checkout.session.completed`, `payment_intent.*`). |  |
| — | Shipping (legacy) | AusPost quote testing removed with Shopify migration. | Retired 2025-11-06 |
| ☐ | Content | Replace `public/og-image.jpg` with final hero artwork; re-run `npx linkinator`. |  |
| ☐ | Content | Final proofread of `/legal/*` pages (tone, links). |  |
| ☐ | Documentation | Produce owner-facing “Admin quick start” (adding product, stock, checkout flow). |  |
| ☐ | Assistant | On the `dev` deploy, run copilot smoke (upload asset, analytics summary, undo token) and log results in the session file. |  |
| ☐ | QA | Remote smoke via `BASE_URL=https://dev--obsidianriterecords.netlify.app npm run test:puppeteer` (after keys). Attach screenshots in `docs/qa-screenshots/`. |  |
| ☐ | QA | With hero flag on, smoke Classic/Split/Minimal layouts, verify badge/highlights, reduced-motion fallback, and media controls. |  |
| ☐ | QA | Dashboard revenue goal card shows correct progress and saving a new target/period persists across refresh. |  |
| ☐ | QA | Story content (timeline/testimonials/newsletter) reflects Supabase entries and `/admin/story` updates publish instantly; verify sections stay hidden when tables are empty. |  |
| ☐ | QA | Homepage Journal shows featured + secondary articles (or “Editorial features return soon” fallback when none published). |  |
| ☐ | QA | Manual smoke on production preview (`/`, `/products/<slug>`, `/admin/dashboard`) post-deploy. |  |
| ☐ | Release | Merge `dev → main`; monitor Netlify deploy; announce go-live. |  |

## Additional Notes
- Treat Netlify branch deploys as the canonical verification surface; document remote checks in session notes before attempting local reproductions.
- Keep Stripe dashboard open while testing to monitor payments, payouts, and webhook events.
- After launch, schedule routine tasks (weekly link crawl, Stripe payout check, inventory audit).
