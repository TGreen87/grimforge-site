# Obsidian Rite Records

A Next.js 15 e-commerce application for Obsidian Rite Records - Australian Black Metal Label.

## Quick Start

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
npm start
```

## Architecture

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Netlify
- **Authentication**: Supabase Auth

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/contexts/` - React context providers
- `src/lib/` - Utility functions and configurations
- `public/` - Static assets (images, icons, etc.)
- `docs/` - Documentation and archived files

## Environment Variables

For full details see `docs/ENV-QUICKSTART.md`.

Minimum required to run (runtime):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`)
- `STRIPE_SECRET_KEY`

Recommended for Branch Deploys:
- `NEXT_PUBLIC_SITE_URL` and `SITE_URL_STAGING` set to your Branch URL

Optional:
- `AUSPOST_API_KEY`, `AUSPOST_ORIGIN_POSTCODE` (live quotes)
- `STRIPE_WEBHOOK_SECRET` (webhook route)

## Deployment

The site automatically deploys to Netlify when changes are pushed to the `main` branch.
