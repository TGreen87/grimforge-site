# Owner Quick Start Handbook

_Last updated: 2025-09-19_

This guide walks through the core day-to-day tasks for running Obsidian Rite Records without touching code. Use `docs/README.md` for the full documentation index when onboarding new owners or assistants.

## 1. Signing in
1. Visit `https://dev--obsidianriterecords.netlify.app/admin/login` (or production `/admin/login` once live).
2. Enter the email/password provided to you. If you forget the password, use Supabase Auth to reset it.
3. After login you will land on the **Dashboard**.

## 2. Dashboard tour
- **Cards** show total revenue (paid orders), orders awaiting action, low-stock alerts, and Stripe payout status.
- **Recent orders** lists the last six sales with quick links to view details.
- **Low stock** cards link straight to the stock unit that needs attention.
- Header buttons let you jump to “Add product”, “View orders”, and “Receive stock”.

## 3. Adding a new release
1. Prepare cover art (square image) and description.
2. Navigate to **Products → New product**.
3. Fill out the form sections:
   - **Basics** – Title, Artist, URL link (lowercase words with dashes).
   - **Format & Pricing** – Choose format (Vinyl/CD/etc.), enter price.
   - **Inventory** – Enter initial stock or leave 0 and receive later.
   - **Media & Metadata** – Paste the image URL.
   - **Publishing** – Toggle **Active** on when ready for the public.
4. Click **Save**. The product now appears on the storefront.

### Adding different editions
- Go to **Stock Units (Variants)** and click **Create** to add limited/alternate editions.
- Each variant can have its own SKU, price, and stock.

## 4. Receiving stock
1. Go to **Inventory**.
2. Find the variant and click **Receive**.
3. Enter the quantity and optional notes (e.g., “Box 1 of 2 delivered 18 Sep”).
4. Submit. Available and on-hand counts update automatically.

## 5. Reviewing orders
- Go to **Orders**.
- Use the payment filter (All / Paid / Pending / Failed) to focus on actionable orders.
- Click **Stripe** to open the payment in the Stripe dashboard.
- Change the order status directly in the table (Pending → Processing → Shipped → Delivered).
- Drag cards in the board view if you prefer Kanban style.

## 6. Customer profiles
- Go to **Customers**.
- Each card/table row shows total spend, last order date, and addresses.
- Click **Notes** to jot down reminders (VIP, special shipping instructions, etc.).

## 7. Checkout & marketing opt-in
- Checkout modal collects customer shipping details and marketing preferences.
- Marketing opt-in is recorded automatically and visible on the customer profile.

## 8. Refunds or payment issues
1. Open the order in **Orders** and click **Stripe**.
2. Handle refund/void in Stripe.
3. Update the order status to “Cancelled” or “Refunded”.

## 9. Managing storefront campaigns
- Go to **Campaigns** in the admin menu.
- Use the layout selector to choose between **Classic** (full-bleed), **Split** (copy plus spotlight media), or **Minimal** (static banner).
- Add optional badge text to surface labels like “New pressing”.
- Enter highlight bullets (one per line) to show short selling points beneath the hero copy.
- Upload a background video for motion; visitors with reduced-motion preferences will see the hero image fallback automatically.

## 10. Weekly health checks
- Run through the dashboard to confirm revenue, low stock, and payouts look correct.
- Visit `/status` to ensure required environment variables are set.
- Optional: run `npm run test:puppeteer` locally or check the latest CI screenshots in `docs/qa-screenshots/`.

## 11. Troubleshooting
- Can’t see a product? Ensure the **Active** toggle is on and stock is above zero.
- Totals look wrong? Verify Stripe keys are set and check recent webhook events.
- Shipping only shows a generic rate? AusPost keys may be missing; static rates are expected until they’re provided.

Happy selling! Keep this handbook alongside `docs/ADMIN-WORKFLOWS.md` for deeper workflows. Reference `docs/README.md` whenever new guides are added.
