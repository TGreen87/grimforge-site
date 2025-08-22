# Pull Request: Next.js 15.4 Migration

## Description
Migration from Vite + React to Next.js 15.4 with App Router, complete e-commerce functionality, and production-ready deployment.

## Type of Change
- [x] Major refactor (migration to new framework)
- [x] New feature (Stripe payments, Refine admin, SEO)
- [x] Security improvement (RLS policies, auth integration)
- [x] Performance improvement (SSR, code splitting)
- [x] Documentation update

## Acceptance Criteria
### Core Requirements
- [ ] Stripe test order completes successfully
- [ ] Order status changes to 'paid' after checkout
- [ ] Inventory decrements atomically
- [ ] Admin receive-stock action increases inventory
- [ ] Product JSON-LD validates
- [ ] Sitemap and robots.txt exist
- [ ] RLS blocks unauthenticated writes
- [ ] No secrets in git
- [ ] .env.example lists names only

### Technical Requirements
- [ ] Next.js 15.4 with App Router working
- [ ] TypeScript strict mode enabled
- [ ] All npm vulnerabilities resolved
- [ ] Netlify deployment configured with Node 22
- [ ] Supabase 2.56.x integrated with server client
- [ ] Stripe API version 2025-07-30.basil

## Testing Checklist
- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Manual checkout flow tested with Stripe test card (4242424242424242)
- [ ] Admin panel functional at /admin
- [ ] Mobile responsive testing completed
- [ ] SEO meta tags and JSON-LD rendering correctly
- [ ] Performance metrics acceptable (Lighthouse score > 90)

## Deployment Checklist
- [ ] Environment variables configured in Netlify
- [ ] Database migrations applied to staging
- [ ] Stripe webhooks configured for staging URL
- [ ] Preview deployment working on Netlify
- [ ] No console errors in production build

## Security Checklist
- [ ] All Supabase keys rotated after .env removal
- [ ] RLS policies tested and verified
- [ ] Service role key not exposed to client
- [ ] Stripe webhook signature verification working
- [ ] Admin routes protected with authentication

## Documentation
- [ ] README updated with new setup instructions
- [ ] Migration guide created at /docs/NEXT-15-MIGRATION.md
- [ ] API documentation updated
- [ ] Environment variables documented

## Rollback Steps
If issues arise after deployment:

1. **Immediate Rollback**:
   ```bash
   git checkout main
   git revert <merge-commit-hash>
   git push origin main
   ```

2. **Database Rollback** (if migrations were applied):
   ```sql
   -- Run down migrations in reverse order
   DROP FUNCTION IF EXISTS decrement_inventory CASCADE;
   DROP FUNCTION IF EXISTS receive_stock CASCADE;
   -- Continue with table drops as needed
   ```

3. **Environment Rollback**:
   - Restore previous environment variables in Netlify
   - Disable Stripe webhooks for new endpoints
   - Revert to previous Supabase configuration

4. **DNS/CDN**:
   - Clear CDN cache if applicable
   - Verify DNS settings remain unchanged

## Breaking Changes
- **Framework**: Complete migration from Vite to Next.js
- **Routing**: React Router replaced with Next.js App Router
- **Authentication**: Mock auth replaced with Supabase Auth
- **Environment Variables**: All prefixed with `NEXT_PUBLIC_` for client-side

## Dependencies Added
- next@15.5.0
- @supabase/ssr
- stripe
- @refinedev/core
- @refinedev/nextjs-router
- @refinedev/antd
- playwright

## Dependencies Removed
- vite
- @vitejs/plugin-react-swc
- react-router-dom
- lovable-tagger

## Performance Impact
- **Improved**: Server-side rendering for SEO
- **Improved**: Code splitting and lazy loading
- **Improved**: Image optimization with Next.js Image
- **Monitor**: Initial bundle size increase

## Screenshots
_Add screenshots of key features:_
- [ ] Homepage
- [ ] Product page with JSON-LD
- [ ] Checkout flow
- [ ] Admin dashboard
- [ ] Mobile view

## Related Issues
Closes #[issue-number]

## Additional Notes
- Stripe is configured for Australian GST (10%)
- Admin panel uses Refine framework with Ant Design
- All components from original Vite app preserved
- PWA functionality maintained

---

## Reviewer Checklist
- [ ] Code follows project style guidelines
- [ ] No hardcoded secrets or API keys
- [ ] Database migrations are reversible
- [ ] Error handling is comprehensive
- [ ] Tests provide adequate coverage
- [ ] Documentation is complete and accurate