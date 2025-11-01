# Deploy Notes – 2025-11-01

- Grimness slider UI temporarily removed from layout/mobile; keep feature flag off until feature resumes.
- Lighthouse performance checks pending: local run blocked by npm script failures (admin typings debt). Validate via Netlify branch deploy using Chrome Lighthouse — target Desktop ≥ 90, Mobile ≥ 85 on /catalog.
- Stripe checkout redirects land on `/order/success` / `/order/cancel`; verify `/api/stripe/health` succeeds post-deploy and run `/test/checkout` when env vars updated.
