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

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Deployment

The site automatically deploys to Netlify when changes are pushed to the `main` branch.