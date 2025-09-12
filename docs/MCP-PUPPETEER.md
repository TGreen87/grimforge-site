# Puppeteer MCP — Smoke Test Prompts

This guide provides ready‑to‑run prompts for your Puppeteer MCP server to validate the dev Branch Deploy and key admin UX without changing code.

## MCP Server

Configured in your client:

```
[mcp_servers.puppeteer]
command = "npx"
args = ["-y", "@smithery/cli@latest", "run", "@smithery-ai/puppeteer", "--key", "<redacted>"]
```

## How to use

Tell your MCP client to target the dev Branch Deploy:
- Base URL: https://dev--obsidianriterecords.netlify.app

Then run the prompts below in order. If a step fails, capture the screenshot and returned logs.

## Public Site — Core Flow

1) Homepage health
- "Open https://dev--obsidianriterecords.netlify.app and wait until network idle. Return the HTTP status, document title, and whether a heading matching /Catalog/i is visible. Take a full‑page screenshot named home.png."

2) Footer anchor → Catalog tab
- "Click the footer link with text 'Vinyl Records'. Wait for navigation. Confirm the URL contains '#vinyl'. Report whether the 'Catalog' section is in view (y‑position near top) and take a screenshot named footer-vinyl.png."

3) Product detail
- "Find the first link or button that indicates viewing product details (aria‑label contains 'View details for' OR link under a product card). Click it. Report the new URL, and confirm a button with text /Buy Now|Add to Cart/i is visible. Screenshot product.png."

4) Add to cart → Checkout → Shipping rates
- "Click a button with text /Add to Cart/i. Open the cart drawer (button with aria‑label or text 'Cart'). Click 'Checkout' to open the modal. Fill shipping: Full Name=Test User; Email=test@example.com; Phone=+61 400 000 000; Address=123 Example St; City=Melbourne; State=VIC; Postal Code=3000; Country=Australia. Click the 'Refresh rates' button. Wait for at least one delivery method to appear. Select the first option. Return the delivery label and price text, and take a screenshot named checkout-shipping.png."

5) Proceed to Stripe (no purchase)
- "Click 'Continue' to move to Payment. Then click 'Place order'. Wait for navigation. Verify the URL hostname is 'checkout.stripe.com'. Extract the displayed shipping line amount if present. Screenshot stripe.png."

## Admin — Visuals (after manual login)

6) Login page available
- "Open https://dev--obsidianriterecords.netlify.app/admin/login. Confirm the page renders an email/password form. Screenshot admin-login.png."

7) Sticky headers + zebra rows
- "Navigate to /admin/products. After you are logged in, scroll the table body by 600px. Verify the table header row remains pinned at the top of the table viewport. Also confirm alternating rows have a slightly darker background. Screenshot admin-products-sticky.png."
- Repeat for /admin/variants and /admin/inventory (filenames: admin-variants-sticky.png, admin-inventory-sticky.png).

8) Form grouping and helpers
- "Open /admin/products/create. Verify grouped section headers in order: Basics; Format & Pricing; Inventory; Media & Metadata; Publishing. Confirm helper text under 'URL (link)' and 'SKU'. Screenshot admin-product-create.png."
- "Open /admin/variants/create. Verify grouped section headers: Basics; Identification; Pricing & Attributes; Publishing. Confirm helper text for Weight and Dimensions. Screenshot admin-variant-create.png."

## Tips
- If hash anchors don’t scroll immediately, wait for the page’s intersection observer to sync the tab and then capture.
- For element selection, prefer role/name queries where available (e.g., buttons with accessible names) and fallback to textContent matches with regex.
- If a step fails due to rate fetching, rerun the 'Refresh rates' action after a short delay.

## Success Criteria
- Homepage loads and catalog heading is visible.
- Footer vinyl link updates URL to '#vinyl' and scrolls to catalog with Vinyl tab active.
- Product detail renders with Add to Cart or Buy Now.
- Checkout modal shows shipping options (AusPost when configured; fallback Stripe static otherwise), selection updates the order summary.
- Stripe Checkout opens on 'Place order' (no purchase required).
- Admin tables show sticky headers and zebra rows; create pages show grouped sections and helper text.

