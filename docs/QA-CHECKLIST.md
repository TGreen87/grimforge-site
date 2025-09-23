# Branch Deploy QA Checklist (dev)

Last modified: 2025-09-23

Use this checklist to verify the dev Branch Deploy before promoting to main. Reference `docs/README.md` for related launch docs.

## Preflight
- Open `https://dev--obsidianriterecords.netlify.app` → 200 OK.
- No console errors on load; static assets under `/_next/static/` resolve.
- `orr_cid` cookie present after first navigation.
- Environment (Netlify UI; do not echo values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`), `STRIPE_SECRET_KEY`. Recommended: `NEXT_PUBLIC_SITE_URL` (branch URL). Optional: `AUSPOST_API_KEY`, `AUSPOST_ORIGIN_POSTCODE`.

## Home
- Header/menu responsive; no horizontal overflow on mobile.
- “Browse catalog” or footer “Vinyl Records” scrolls to Catalog and updates URL to `/#vinyl`.
- Hero and images load without broken links or layout jitter.
- When feature flag is on, verify campaign hero layouts (Classic, Split, Minimal): badge renders, reduced-motion falls back, video/audio controls operate.
- Storytelling blocks: timeline/testimonials render only when Supabase tables contain content; when empty, the entire section is hidden.
- Newsletter CTA appears only when all copy fields are populated; otherwise it should be absent.
- Journal section (homepage) shows featured + secondary articles when Supabase has published entries; fallback message appears when none exist.
- Preorder section shows “Email list opens soon” with disabled inputs/buttons (no placeholder alerts).

## Catalog
- Product cards render (if data available); images not broken.
- Card link opens `/products/{slug}` when slug exists; legacy id fallback still works if present.
- Keyboard navigation: card actions reachable; focus rings visible.
- Quick actions (Add to cart, Wishlist, Quick view) available on hover/focus and functional without navigation side-effects.

## Product Detail
- `/products/{slug}` shows title/artist, primary image, price; variant selector updates price/availability.
- “Add to Cart” works; “Buy Now” redirects to Stripe Checkout.
- JSON‑LD script present in page source.
- Legacy `/product/{id}` redirects to slug route.
- If no products exist or admin Save fails, seed via `docs/SUPABASE-SEED.md` (Supabase MCP/Studio) and retry with slug `test-vinyl-dark-rituals`.
- If the product route returns 500 with data present, verify envs above and redeploy dev (SSR/runtime).
- Gallery supports thumbnail selection, keyboard focus, and lightbox open/close; sticky buy module remains visible on desktop.

## Cart & Checkout (Shipping)
- Cart drawer opens; items reflect title/variant/qty; totals correct.
- Checkout modal collects shipping: valid AU address enables “Refresh rates”.
- Without AusPost env: Stripe static options appear; select one and totals update.
- With AusPost env: Domestic (Parcel Post/Express) and Intl (Standard/Express) appear; sorted by price; selection updates totals.
- “Continue” → “Place order” opens Stripe Checkout; selected shipping label/amount visible on Stripe.
- Checkout sheet stepper shows Shipping → Payment → Review; wallet row disabled message appears when no publishable key.
- If `/api/checkout` returns 500, confirm `STRIPE_SECRET_KEY` exists; redeploy dev and retry.
- Multi‑item: 2+ items included in session; shipping option still applied.

## SEO & Sitemaps
- `/robots.txt` returns 200 and includes sitemap reference.
- `/sitemap.xml` returns 200; lists only active products and published articles; URLs resolve.
- Page titles are correct; canonical links present on product/article pages.
- Legal footer links resolve (Shipping, Returns, Size Guide, Care, Contact, Privacy, Terms).

## Admin — Login & Shell
- `/admin/login` renders and allows login on preview (relaxed gating).
- Layout: header (actions + Kbar trigger), sider (Catalog/Commerce/Content/System groups; collapsed tooltips; selected left rail accent).
- Header shortcuts: Alt+1 Products, Alt+2 Inventory, Alt+3 Orders, Alt+4 Customers, Alt+5 Articles.
- Kbar opens via Cmd/Ctrl+K.

## Admin — Dashboard
- Revenue goal card displays current progress, allows editing target/period, and persists changes.
- Needs fulfilment panel reflects awaiting fulfilment, low stock, and pending payment counts with thresholds.
- Needs fulfilment panel export icons trigger filtered CSV downloads (awaiting fulfilment, low stock, pending payments) when counts are >0.
- Announcement history lists previous messages and “Revert” restores copy without errors.

## Admin — Story Content
- `/admin/story` loads timeline and testimonials tables with no seeded rows by default.
- Creating, editing, and deleting story points/testimonials update the storefront on refresh (verify section hides when all rows removed).
- Newsletter CTA form saves heading/subheading/CTA label successfully; leaving fields blank should hide the storefront CTA.

Tip: Use a temporary QA admin account (email/password) for branch testing, or log in with an existing admin and keep the session open while running MCP.

## Admin — Products
- Table view: sticky header; zebra rows; density toggle works; column settings persist.
- Cards view: image/title; Featured/Inactive chips; inline price edit + active toggle refresh list.
- Toolbar: search (Enter) filters Cards; count visible; Export CSV downloads `products.csv`; New navigates to create.
- EmptyState appears when zero products.

## Admin — Stock Units & Inventory
- Stock Units table: name, product, SKU, price, on hand/allocated/available, active.
- Inventory table: sticky header; density toggle; Export CSV downloads `inventory.csv`.
- Inventory Cards: chips for Available/On hand/Allocated; Receive opens modal (shows SKU and calculation note) and updates counts.
- Filters: All / Out only (no low‑stock threshold); EmptyState when zero items.

## Admin — Orders
- Table: ID (short), Customer, Status (editable), Items count, Total, Date.
- Board: columns Pending/Paid/Processing/Shipped/Delivered; drag updates status; toast confirms; list refreshes.
- ARIA: drag announces “picked up”, “over column”, “moved to {column}”.

## Admin — Customers & Articles
- Customers: table/cards; orders/addresses counts; EmptyState when zero.
- Articles: table/cards; Published/Draft chip; create/edit/show render; EmptyState when zero.

## Admin — Assistant
- Copilot drawer opens (`⌘⇧C`/`Ctrl+Shift+C`), renders structured context panel, and can reset context without errors.
- File uploads succeed (toast + attachment listed); confirm asset appears in Supabase Storage `assistant-media` bucket.
- Assistant replies cite sources and offer the latest suggested actions (analytics summary, order lookup) without server errors.
- Run “Create & publish product” against a throwaway slug: product/variant/inventory rows appear, optional hero update toggles, and audit logs (`assistant.product.full_create`) plus session events exist. Remove the product afterwards.
- Run “Draft article” with a short brief: article saved (draft by default), slug returned, and audit log `assistant.article.create` present. Optionally run “Publish article” to confirm publish toggle.
- Campaign update action rewrites hero data (title/subtitle/highlights) and sets active flag when requested.
- Session logs present in `assistant_sessions`/`assistant_session_events` for the runs above; each upload recorded in `assistant_uploads`.
- Audit logs for assistant actions present (`assistant.analytics.summarize`, `assistant.order.lookup`, `assistant.inventory.receive`, etc.).

## Admin — Forms & Copy
- Products create/edit grouped: Basics; Format & Pricing; Inventory; Media & Metadata; Publishing. Helpers for URL (link) and SKU.
- Stock Units grouped: Basics; Identification; Pricing & Attributes; Publishing. Helpers for weight/dimensions.
- Validation and buttons are accessible and consistent.

## Accessibility & Motion
- Focus rings visible on links, buttons, inputs, segmented controls; skip‑to‑content works.
- Status uses more than color (e.g., Inactive text label exists).
- Subtle motion only; respects reduced motion; card hover lift is light.

## Observability
- Trigger a harmless client error; `/api/client-logs` accepts report; correlation id included.
- `/status` shows Supabase env presence and site URL.

## Local Smoke (Puppeteer)
- `BASE_URL=https://dev--obsidianriterecords.netlify.app npm run test:puppeteer` runs a quick homepage → vinyl anchor → product (if present) → checkout attempt and admin visuals; screenshots land in `docs/qa-screenshots/`.

## Go‑Live Checklist
- Dev branch deploy passes all checks above.
- `npm run type-check`, `npm run lint`, `npm test` are green.
- Sitemap and robots verified; shipping works (fallback without AusPost; live with AusPost).
- Merge `dev` → `main` fast‑forward; monitor for 10–15 minutes; revert fast if regression.
- Run `npm run audit:a11y` to refresh Lighthouse accessibility reports for home and admin (`docs/qa-screenshots/lighthouse-*.json`).
