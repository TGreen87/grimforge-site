# Branch Deploy QA Checklist (dev)

Last modified: 2025-09-13

Use this checklist to verify the dev Branch Deploy before promoting to main.

## Preflight
- Open `https://dev--obsidianriterecords.netlify.app` → 200 OK.
- No console errors on load; static assets under `/_next/static/` resolve.
- `orr_cid` cookie present after first navigation.

## Home
- Header/menu responsive; no horizontal overflow on mobile.
- “Browse catalog” or footer “Vinyl Records” scrolls to Catalog and updates URL to `/#vinyl`.
- Hero and images load without broken links or layout jitter.

## Catalog
- Product cards render (if data available); images not broken.
- Card link opens `/products/{slug}` when slug exists; legacy id fallback still works if present.
- Keyboard navigation: card actions reachable; focus rings visible.

## Product Detail
- `/products/{slug}` shows title/artist, primary image, price; variant selector updates price/availability.
- “Add to Cart” works; “Buy Now” redirects to Stripe Checkout.
- JSON‑LD script present in page source.
- Legacy `/product/{id}` redirects to slug route.

## Cart & Checkout (Shipping)
- Cart drawer opens; items reflect title/variant/qty; totals correct.
- Checkout modal collects shipping: valid AU address enables “Refresh rates”.
- Without AusPost env: Stripe static options appear; select one and totals update.
- With AusPost env: Domestic (Parcel Post/Express) and Intl (Standard/Express) appear; sorted by price; selection updates totals.
- “Continue” → “Place order” opens Stripe Checkout; selected shipping label/amount visible on Stripe.
- Multi‑item: 2+ items included in session; shipping option still applied.

## SEO & Sitemaps
- `/robots.txt` returns 200 and includes sitemap reference.
- `/sitemap.xml` returns 200; lists only active products and published articles; URLs resolve.
- Page titles are correct; canonical links present on product/article pages.

## Admin — Login & Shell
- `/admin/login` renders and allows login on preview (relaxed gating).
- Layout: header (actions + Kbar trigger), sider (Catalog/Commerce/Content/System groups; collapsed tooltips; selected left rail accent).
- Header shortcuts: Alt+1 Products, Alt+2 Inventory, Alt+3 Orders, Alt+4 Customers, Alt+5 Articles.
- Kbar opens via Cmd/Ctrl+K.

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

## Puppeteer MCP (prompts)
- See `docs/MCP-PUPPETEER.md` for ready‑to‑run prompts covering homepage → catalog → product → checkout and admin visuals.

## Go‑Live Checklist
- Dev branch deploy passes all checks above.
- `npm run type-check`, `npm run lint`, `npm test` are green.
- Sitemap and robots verified; shipping works (fallback without AusPost; live with AusPost).
- Merge `dev` → `main` fast‑forward; monitor for 10–15 minutes; revert fast if regression.

