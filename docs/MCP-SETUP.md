# MCP Setup (Supabase + Browser)

Use this alongside `mcp.config.json` at repo root. Adjust paths if your runner expects a different config location.

## Servers/Clients
- **Supabase MCP**
  - Config path: `supabase/config.toml` (already in repo). Ensure it contains the service role key and URL for branch deploy testing.
- **Browser/Puppeteer MCP**
  - No extra config required; defaults to headless Chromium. Update `launchOptions` in `mcp.config.json` if you need visible browser or devtools.

## Quick Steps
1. Install MCP tooling (per your runner): `npm i -g @modelcontextprotocol/cli @modelcontextprotocol/puppeteer-server @modelcontextprotocol/supabase-server` (adjust to your environment).
2. Place `mcp.config.json` where your MCP runner reads config (using the repo root copy if supported).
3. Start servers as required by your CLI/harness (example: `mcp puppeteer --config mcp.config.json`).
4. From the assistant, select the `browser` client for remote page checks/screenshots and `supabase` for DB/RLS inspection.

## Notes
- Never commit real secrets outside `supabase/config.toml`; that file should already be env-injected by Netlify for deploys.
- If you run the Supabase MCP locally, ensure the service role key is available in your environment or in the config file.
- If your runner uses a different config format, mirror the same entries there.
