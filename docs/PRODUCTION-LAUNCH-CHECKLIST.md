# Production Launch Checklist

_Last updated: 2025-11-20_

This document tracks every action required to ship grimforge-site to production once Stripe/AusPost keys are available. Update the status column and add notes as you complete tasks. Reference `docs/README.md` for related ops guides.

| Status | Area | Task | Owner Notes |
|--------|------|------|-------------|
| ☐ | Keys | Add **live** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` to Netlify for `main` (and optionally `dev_stripe` for rehearsal). |  |
| ☑ | Auth | Confirm owner login succeeds on `https://obsidianriterecords.com/admin/login`; compare against `dev_stripe` if needed. | Verified previously; re-check after final deploy |
| — | Shipping | AusPost credentials not required for launch; default to Stripe Standard/Express shipping options. | Decision: Stripe static shipping for launch (2025-11-20) |
| ☐ | Checkout | With live keys, run a $1 (or minimum-price) live payment: add product → /cart → Stripe → ensure order row + inventory decrement + webhook success. |  |
| ☐ | Checkout | Update success/cancel URLs in checkout handler to `https://obsidianriterecords.com/order/success` and `/cart` once live. |  |
| ☐ | Webhooks | In Stripe Dashboard, create live endpoint for `/api/stripe/webhook`; subscribe to `checkout.session.completed`, `payment_intent.payment_failed`; confirm at least one successful delivery. |  |
| ☐ | Catalog | All launch products have active variants with price and on_hand > 0; test vinyl retired/hidden. |  |
| ☐ | Content | Hero/campaign points to real product slug; OG/social images swapped to final art. |  |
| ☐ | Legal | Final proofread of `/legal/*`; confirm footer links work. |  |
| ☐ | Documentation | Owner handbook + quickstart updated for live Stripe steps, product/variant creation, and shipping info visibility. |  |
| ☐ | Notifications | Decide on owner notifications: Stripe receipts enabled and/or Supabase trigger/email for new paid orders. |  |
| ☐ | QA | Manual smoke on production deploy: `/`, `/products/<slug>`, add-to-cart + checkout, `/order/success`, `/admin/dashboard`. |  |
| ☐ | QA | Success page CTAs navigate without right-click; nav/logo/cart links work. |  |
| ☐ | QA | Optional: remote smoke (`BASE_URL=https://obsidianriterecords.com npm run test:puppeteer`) if time allows. |  |
| ☐ | Release | Announce go-live after production smoke passes; set reminder for post-launch monitoring (webhooks, payouts, inventory). |  |

## Additional Notes
- Treat Netlify branch deploys as the canonical verification surface; document remote checks in session notes before attempting local reproductions.
- Keep Stripe dashboard open while testing to monitor payments, payouts, and webhook events.
- After launch, schedule routine tasks (weekly link crawl, Stripe payout check, inventory audit).
