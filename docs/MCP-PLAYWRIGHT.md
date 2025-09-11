# Playwright MCP (Model Context Protocol) Setup

This repo can be exercised via Playwright MCP for quick smoke checks.

## MCP Server Config

Add to your MCP client configuration:

```
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]
```

This starts the Playwright MCP server via `npx`.

## Useful MCP Prompts

- "Open https://obsidianriterecords.com and click Vinyl in the footer, confirm the URL has #vinyl, then return the current URL."
- "Navigate to the homepage, click the first product card details, and report if a Buy Now or Add to Cart button is visible."
- "Go to /status and extract the Runtime Status values."

Provide the domain under test (production or branch) in your prompt.

## Local Playwright (non‑MCP) Commands

- Install browsers (first run):
  - `npx playwright install --with-deps`
- Run e2e:
  - `npm run test:e2e`
  - or `npx playwright test e2e/tests/smoke.spec.ts`
- Headed mode:
  - `npx playwright test --ui`

The smoke spec uses `E2E_BASE_URL`, `SITE_URL`, or `NEXT_PUBLIC_SITE_URL` to determine the base URL (defaults to production).

## Notes
- Public product tests are feature‑dependent (they skip gracefully if no items exist).
- Admin flows require auth and are not included by default. If you want admin tests, provide preview credentials and we will add idempotent specs gated by env vars.

