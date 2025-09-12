# MCP Configuration (Puppeteer & Playwright)

Last modified: 2025-09-13

This project supports Model Context Protocol (MCP) servers for browser checks via Puppeteer and Playwright.

## Repo‑local configuration (.mcp.json)

The repo includes a `.mcp.json` that registers both servers and points them at the dev Branch Deploy:

```
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["@smithery/cli@latest", "run", "@smithery-ai/puppeteer"],
      "env": {
        "BASE_URL": "https://dev--obsidianriterecords.netlify.app",
        "E2E_BASE_URL": "https://dev--obsidianriterecords.netlify.app",
        "PLAYWRIGHT_BASE_URL": "https://dev--obsidianriterecords.netlify.app"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "BASE_URL": "https://dev--obsidianriterecords.netlify.app",
        "E2E_BASE_URL": "https://dev--obsidianriterecords.netlify.app",
        "PLAYWRIGHT_BASE_URL": "https://dev--obsidianriterecords.netlify.app"
      }
    }
  }
}
```

Restart Codex/IDE so the servers are detected.

## Global configuration (~/.codex/config.toml)

Alternatively, register servers globally:

```
[mcp_servers.puppeteer]
command = "npx"
args = [ "-y", "@smithery/cli@latest", "run", "@smithery-ai/puppeteer" ]

[mcp_servers.puppeteer.env]
BASE_URL = "https://dev--obsidianriterecords.netlify.app"
E2E_BASE_URL = "https://dev--obsidianriterecords.netlify.app"
PLAYWRIGHT_BASE_URL = "https://dev--obsidianriterecords.netlify.app"

[mcp_servers.playwright]
command = "npx"
args = [ "-y", "@playwright/mcp@latest" ]

[mcp_servers.playwright.env]
BASE_URL = "https://dev--obsidianriterecords.netlify.app"
E2E_BASE_URL = "https://dev--obsidianriterecords.netlify.app"
PLAYWRIGHT_BASE_URL = "https://dev--obsidianriterecords.netlify.app"
```

If trust is enforced per path, ensure the project folder is trusted (case sensitive):

```
[projects."/mnt/a/Dev/grimforge-site"]
trust_level = "trusted"
```

## Running checks

- Puppeteer MCP: run the prompts in `docs/MCP-PUPPETEER.md` (homepage, footer anchor, product → checkout, admin visuals).
- Local fallback (no MCP): `npm run test:puppeteer` uses `scripts/puppeteer-smoke.mjs` with `BASE_URL` env.

