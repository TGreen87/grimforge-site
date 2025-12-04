# Obsidian Rite Records

E-commerce platform for **Obsidian Rite Records**, an Australian independent record label specializing in underground metal music.

Built with Next.js 15, Supabase, Stripe, and featuring an AI-powered admin Copilot (GPT-5.1).

## Quick Links
- **Production:** https://obsidianriterecords.com
- **Admin Panel:** https://obsidianriterecords.com/admin
- **Dev Branch:** https://dev-claude--obsidianriterecords.netlify.app

## Development Workflow
- **Working branch:** `dev_claude` - pushes auto-deploy to Netlify branch preview
- **Production:** `main` - only merge after owner approval
- **No PRs** - merge directly when approved
- See [CLAUDE.md](CLAUDE.md) for complete development guidelines

## Tech Stack
- **Next.js 15** (App Router) with TypeScript
- **Supabase** (PostgreSQL + RLS + SSR auth)
- **Stripe** for payments
- **Refine + Ant Design** for admin panel
- **OpenAI GPT-5.1** + **ElevenLabs** for AI Copilot

## Project Structure
```
app/           # Next.js App Router
├── (site)/    # Public storefront (products, cart, checkout, articles)
├── admin/     # Admin panel (Refine framework)
└── api/       # API routes (checkout, stripe webhooks, admin APIs)
lib/           # Utilities, Supabase clients, AI assistant logic
src/           # Legacy components (being migrated)
docs/          # Historical documentation (see CLAUDE.md for current)
```

## Key Commands
```bash
npm run lint        # ESLint (run before pushing)
npm run type-check  # TypeScript check (some admin errors expected)
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright E2E tests
```

## Environment Variables
Required in Netlify (not in git):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY` / `ELEVENLABS_API_KEY`

## Documentation
**Primary documentation is in [CLAUDE.md](CLAUDE.md)** - this contains:
- Complete development guidelines
- AI Copilot configuration
- OpenAI API reference
- Current project status and next steps

Historical docs in `docs/` folder are kept for reference but may be outdated.
