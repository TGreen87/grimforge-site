# Site Flow and User Management

## Customer Journey
1. Home and discovery pages show editorial content and featured products.
2. Products index `/products` lists products from Shopify with image, title, price.
3. Product detail `/products/[handle]` shows gallery, variant choices and availability. Customers can add to cart or go directly to checkout when a cart exists.
4. Checkout opens on Shopify’s hosted checkout via `checkoutUrl`.

## Admin Journey
- ORR Admin Panel manages editorial content, announcements and back-office workflows.
- Products, inventory, prices and orders live in Shopify.  
- Admin Panel can present a synced view by calling Shopify Storefront or Admin APIs. Storefront API suffices for read paths for the site. Admin API is used for operations like product creation, media uploads and inventory changes when needed. This project aims to minimize Admin API writes and keep core catalog management in Shopify Admin to reduce complexity.
- `/api/admin/products` calls Shopify `productCreate` behind the scenes (requires `SHOPIFY_ADMIN_API_TOKEN`), so owner workflows stay inside the ORR Admin Panel even though Shopify remains the canonical catalog.

## Auth and Roles
- Supabase Auth provides login for internal users.
- Roles: owner, staff and viewer. Only owner and staff can trigger sensitive actions such as publishing content changes or initiating catalog sync jobs.
---8<---

3) File: docs/ENV-QUICKSTART.md
---8<---
# Environment Quickstart

**Do not commit secrets. Use Netlify env for deploys and `.env.local` only for local dev.**

## Required variables
- `SHOPIFY_STORE_DOMAIN` example `mystore.myshopify.com`
- `SHOPIFY_STOREFRONT_API_TOKEN` Storefront access token
- `SHOPIFY_API_VERSION` recommended `2025-10`  
- `NEXT_PUBLIC_SITE_URL`  
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server keys for admin actions

## Local development
1. Node 20+ or 22 is fine. Install deps: `npm ci`.
2. Create `.env.local` with the variables above.
3. Run: `npm run dev`.

## Netlify
- The build uses the Next.js Runtime. Ensure env vars are set at Site settings.
- Publish directory `.next`, build command `npm run build`.
