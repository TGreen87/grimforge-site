# Repository Guidelines

> **Current status (Dec 2025):** Active development on `dev_claude` branch. Admin panel and AI Copilot fully operational. Storefront needs real product data before launch.

**For complete documentation, see [CLAUDE.md](CLAUDE.md).**

## Quick Reference

### Branches
- `dev_claude` - Active development branch
- `main` - Production (merge only after owner approval)
- **No PRs** - merge directly when approved

### Deploys
- Dev: https://dev-claude--obsidianriterecords.netlify.app
- Prod: https://obsidianriterecords.com
- Admin: Append `/admin` to any URL

### Commands
```bash
npm run lint        # Run before pushing
npm run type-check  # Some admin errors expected
git push origin dev_claude  # Auto-deploys to Netlify
```

### Key Rules
1. Work on `dev_claude`; promote to `main` after QA
2. Test on Netlify branch deploys, not localhost
3. Keep secrets out of commits - use Netlify env vars
4. Update CLAUDE.md when making significant changes

### AI Copilot
The admin panel includes a GPT-5.1 powered Copilot that can:
- Create products with AI-generated descriptions
- Draft and publish Journal articles
- Look up orders and analytics
- Manage inventory and campaigns

See CLAUDE.md for technical details on the Responses API integration.
