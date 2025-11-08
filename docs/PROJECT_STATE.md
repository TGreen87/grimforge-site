# ORR Project State and Architecture Overview

**As at:** 8 Nov 2025 AEST  
**Owner brand:** Obsidian Rite Records (ORR)

## 1. North Star
ORR is a Next.js storefront that uses Shopify as the source of truth for commerce. Shoppers browse and buy on the ORR site. Products, inventory, pricing and orders are powered by Shopify via the Storefront API. ORR’s Admin Panel manages content and operational workflows, while product lifecycle and inventory are synchronized to Shopify so the site always reflects canonical stock and product data.

## 2. Current Code Footprint
- Framework: Next.js 15.x (App Router), TypeScript.
- Hosting: Netlify with Next.js Runtime.
- Data: Supabase for auth and admin features.  
- Commerce: Migrating from custom Stripe cart/checkout to Shopify headless cart and checkout.
- E2E: Playwright planned for a shop checkout smoke.

Notable files detected in repo:
- `app/(site)/products/[slug]/page.tsx` exists and renders a product page in the legacy model. A migration to Shopify-by-handle page is planned. 
- `app/providers.tsx` composes providers. It still references historical Cart provider in some branches. Clean removal during Shopify migration is part of this plan. 

## 3. Target End State
- Product list page: `/products` queries Shopify and renders cards with image, title and price.
- Product detail page: `/products/[handle]` fetches a product by handle, lists images, variants, price and availability.
- Cart and checkout flow:
  - POST `/api/shopify/cart` with `{ variantId, quantity }` creates a Shopify Cart (if needed), adds a line, sets a secure cookie `sfy_cart_id`, and returns `{ cartId, checkoutUrl, totalQuantity }`.
  - POST `/api/shopify/cart` with `{}` and a valid cookie returns the checkout URL, for direct “Go to checkout”.
- Admin Panel remains the day-to-day UI for the business. Product and inventory are synchronized from Shopify, not stored as an independent truth in ORR.

## 4. Environments and Configuration
Set these only via Netlify or local `.env.local` for development. Never commit secrets.
- `SHOPIFY_STORE_DOMAIN` example `mystore.myshopify.com`
- `SHOPIFY_STOREFRONT_API_TOKEN` example `shpat_...` or partner Storefront token
- `SHOPIFY_API_VERSION` recommended `2025-10` as of now
- Supabase credentials for admin
- Existing Stripe keys are legacy and can be removed once Shopify is live for checkout

## 5. Endpoint Contract
- `POST /api/shopify/cart`
  - Body `{ variantId: string, quantity: number }` → creates cart if missing, adds line, sets `sfy_cart_id` cookie, returns `{ cartId, checkoutUrl, totalQuantity }`.
  - Body `{}` → if cookie exists, fetches cart and returns checkout URL. If no cart, respond 404 with `{ code: 'SHOPIFY_CART_NOT_FOUND' }`.

## 6. Frontend Components
- Product listing renders a grid of products from Shopify.
- Product detail renders images, variants and a checkout-ready button.
- Buttons:
  - AddToCartButton: adds a variant line.
  - CheckoutButton: requests checkout URL for redirect. Disabled if Shopify env not configured or no cart.

## 7. Testing
- A Playwright smoke test navigates to `/products`, enables a test override, mocks `/api/shopify/cart` and asserts redirect is called with a checkout URL.

## 8. Version Check
Validated as of 8 Nov 2025 AEST. Source links attached.

| Component | Version in use | Latest stable reminder | Source |
|---|---:|---:|---|
| Shopify Storefront API | 2025-10 recommended | 2025-10 stable window | Release notes confirm 2025-10 API window. :contentReference[oaicite:2]{index=2} |
| Shopify CLI | keep current | Docs for install and use | Official CLI docs.  |
| Next.js | 15.x | Follow Next 15 upgrade notes | Official guide for 15 and React 19 baseline.  |
| Netlify Next.js Runtime | v5.14.5 in logs | Runtime docs | Plugin docs, OpenNext runtime reference.  |
| Playwright | pin >=1.56 | Latest release series | 1.56 series overview.  |
| Supabase JS | pin in repo | v2.79.0 latest tag on 4 Nov 2025 | Releases page.  |
| Hydrogen | optional tooling only | Docs and release cadence | Hydrogen framework docs overview. :contentReference[oaicite:8]{index=8} |

## 9. Open Questions
- Confirm final wording for customer-facing messages on product cards and PDP once checkout is enabled.
- Confirm Shopify product handles and initial catalog taxonomy.
- Confirm whether any ORR-only product fields must be stored outside Shopify and mapped in the UI.