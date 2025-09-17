# Admin Workflows & Terminology

This guide explains the key concepts in the admin and the typical flows.

## Concepts
- **Product**: The main page for a release (title, artist, description, hero image, etc.).
- **Stock Unit** (formerly “Variant”): A purchasable unit of stock for a product (e.g., a specific pressing/format/edition). Each has its own SKU, price, and inventory.
- **Inventory**: Quantities for each Stock Unit (on hand, allocated, available). Receiving stock increases on hand.
- **SKU**: Stock Keeping Unit (unique code you use to track stock). Auto‑generated for convenience (SLUG‑STD) but you can edit.
- **URL (link)** (aka “slug”): The URL‑friendly path for a product/article page. Lowercase words joined by hyphens (e.g., `dark-ritual`).

## Quick Publish (Recommended)
1) Go to Upload New Release (admin Upload tool) or Products → Create.
2) Enter Title, Artist, Price, and (optionally) upload an image.
3) On publish, the system:
   - Creates the Product with URL (link).
   - Creates a default Stock Unit (Standard) with SKU and price.
   - Creates Inventory (if you entered initial stock).
4) The item appears on the public Catalog and can be bought.

## Dashboard Overview
- Visiting `/admin` now lands on the Dashboard. It surfaces:
  - KPI cards for total revenue (paid orders), count of paid orders, orders awaiting action, and low-stock variants (≤5 available).
  - Recent orders list with quick status snapshots and links into Orders.
  - Low stock list with direct links to edit Stock Units.
  - A “Next steps” checklist tailored to the owner.
- Quick actions (Add product, View orders, Receive stock) are pinned to the header for fast access.
- Tables remain available via the navigation, but the dashboard is the preferred entry point for non-technical operators.

## Full Control (Products / Stock Units / Inventory)
- Use when you need multiple Stock Units (e.g., different pressings, bundles):
  1) Products → Create: set core details and URL link.
  2) Stock Units → Create: add each purchasable unit with its SKU/price/format.
  3) Inventory → Receive: add quantities for the Stock Unit (with notes). Inventory updates atomically.

## Receiving Stock
- Admin → Inventory: Find the row → Receive → enter Quantity and (optional) Notes → Receive.
- This writes a stock movement and updates on hand/available counts.

## Articles
- Admin → Articles: Create an article with Title, URL (link), content (markdown ok), and Publish.
- Public pages will appear at `/articles` and `/articles/{url-link}` once published.

## Checkout & Cart
- Customers add items from product pages (this captures the Stock Unit for checkout).
- The cart supports multi‑item Stripe Checkout.
- Shipping address and phone are required in the checkout modal; wallets (Apple/Google Pay) appear when enabled in Stripe.
- Shipping: when Australia Post is configured, customers will see AusPost rate options at checkout; otherwise, static Stripe rates are offered. See `docs/SHIPPING-AUSPOST.md`.

## Tips
- Use lowercase URL links with hyphens; keep them short and descriptive.
- Keep SKUs consistent (auto‑generated, but edit if you have a store‑wide scheme).
- Prefer “Stock Units” to refer to purchasable items (we’ve renamed UI labels accordingly).

## Users & Roles (Grant Admin)
- Path: `/admin/users` (preview environments only; requires an existing authenticated session).
- Grant admin:
  1) Enter the user’s email (must exist in Supabase Auth).
  2) Click “Grant Admin”. The server upserts `{ user_id, role: 'admin' }` into `user_roles`.
- Remove admin: Click “Remove Admin” in the table row.
- API (equivalent):
  - POST `/api/admin/users/roles` `{ email: "user@example.com", role: "admin" }`
  - DELETE `/api/admin/users/roles` `{ email: "user@example.com" }`

## Troubleshooting: Product Save appears to do nothing
- Symptom: Clicking “Save” on `/admin/products/create` doesn’t navigate or show a success toast, and the slug URL 404s.
- Likely cause: Supabase RLS rejection. Some older policies check `admin_users` while the app grants roles in `user_roles`. If your session isn’t recognized by that policy, inserts fail.
- How to confirm: DevTools → Network → inspect `POST /rest/v1/products` response for RLS/constraint errors.
- Fix fast: run the idempotent seed in `docs/SUPABASE-SEED.md` (via Supabase MCP/Studio). It grants admin in both tables and upserts a test Product + Stock Unit + Inventory used by QA checkout.

## Admin UI — Views & Shortcuts
- Views:
  - Products: switch between Table and Cards (toolbar toggle). Cards support inline price and active toggles.
  - Orders: switch between Table and Board. In Board, drag cards between status columns to update status.
  - Inventory: Table or Cards. Cards show Available/On hand/Allocated chips and a Receive button. Quick filters for All/Out.
  - Customers and Articles: Table or Cards for quick scanning and actions.
- Search & Shortcuts:
  - Header search opens the command palette (Kbar). Keyboard: Cmd/Ctrl+K.
  - Actions: Create Product (n,p), Create Article (n,a), Create Stock Unit (n,s), Orders Board (o,b), Products Cards (p,c), Inventory Cards (i,c), Customers Cards (c,c), Articles Cards (a,c).

## Form Grouping (Admin UI)
- Products: Basics → Format & Pricing → Inventory → Media & Metadata → Publishing.
- Stock Units: Basics → Identification → Pricing & Attributes → Publishing.
- Inline helpers: URL link pattern; SKU auto‑suggest; shipping weight/dimensions usage.

## Empty States
- When a list has no items, a warm EmptyState appears with a clear call to action:
  - Products: “Create your first product or import a CSV.”
  - Stock Units: “Add stock units to start tracking inventory and pricing.”
  - Inventory: “Add stock units or receive stock.”
  - Orders: “When customers buy, orders appear here.”
  - Customers: “Customers who check out will appear here.”
  - Articles: “Write your first post.”

## CSV Export
- Products: toolbar → Export CSV (products.csv) honoring visible rows.
- Inventory: toolbar → Export CSV (inventory.csv).
- Checkout captures customer profiles (shipping address, marketing opt-in); review them in `/admin/customers` alongside total spend and notes.
