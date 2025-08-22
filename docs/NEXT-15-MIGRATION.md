# Next.js 15.4 Migration Documentation

## Overview
This document details the migration from Vite + React to Next.js 15.4 with App Router, including all setup requirements, environment variables, and rollback procedures.

## Migration Summary

### What Changed
- **Framework**: Vite → Next.js 15.4
- **Routing**: React Router → Next.js App Router
- **Authentication**: Mock localStorage → Supabase Auth
- **Payments**: None → Stripe Checkout with webhooks
- **Admin**: None → Refine admin panel
- **SEO**: Basic → Full JSON-LD and metadata

### What Was Preserved
- All UI components (shadcn/ui)
- Tailwind CSS configuration and theme
- Gothic design system
- Business logic and contexts
- Public assets and images

## Environment Setup

### Required Node Version
```bash
# Windows PowerShell
fnm use 22
# or
nvm install 22
nvm use 22

# WSL/Linux
nvm install 22
nvm use 22
```

### Environment Variables
Create `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Staging Aliases (for production)
SUPABASE_URL_STAGING=https://your-staging.supabase.co
SUPABASE_ANON_KEY_1=your_staging_anon_key
SUPABASE_SERVICE_ROLE_1=your_staging_service_key
STRIPE_SECRET_KEY_1=sk_test_staging_...
STRIPE_WEBHOOK_SECRET_1=whsec_staging_...
SITE_URL_STAGING=https://your-staging-site.netlify.app
```

## Development Setup

### Install Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Install global tools
npm i -g @netlify/cli @supabase/cli stripe
```

### Database Setup

1. **Run migrations**:
```bash
# Apply all migrations
supabase migration up

# Or manually in Supabase SQL editor:
# Run migrations in order:
# - 20250122_create_ecommerce_schema.sql
# - 20250122_rls_policies.sql
# - 20240101000000_create_admin_tables.sql
```

2. **Create admin user**:
```sql
-- After creating a user in Supabase Auth
INSERT INTO admin_users (user_id, role) 
VALUES ('your-user-id-from-auth', 'super_admin');
```

3. **Verify RLS policies**:
```sql
-- Run the test matrix
SELECT * FROM test_rls_policies();
```

### Stripe Setup

1. **Login to Stripe CLI**:
```bash
stripe login
```

2. **Forward webhooks locally**:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. **Copy webhook secret** from the output and add to `.env.local`

### Run Development Server

```bash
# Standard Next.js dev
npm run dev

# With Netlify runtime
netlify dev
```

Access:
- Main site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Testing

### Unit Tests
```bash
npm test
npm run test:coverage
```

### E2E Tests
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium
```

### Test Stripe Checkout
Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Build & Deployment

### Local Build
```bash
npm run build
npm run start
```

### Netlify Deployment

1. **Configure Netlify**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 22

2. **Set Environment Variables** in Netlify dashboard:
   - All variables from `.env.local`
   - Use production values

3. **Deploy**:
```bash
# Manual deploy
netlify deploy --prod

# Or push to GitHub for auto-deploy
git push origin feat/next15-migration
```

## Database Management

### Apply Migrations
```bash
# Up migration
supabase migration up

# Create new migration
supabase migration new migration_name
```

### Rollback Migrations
```sql
-- Reverse order rollback
DROP FUNCTION IF EXISTS decrement_inventory CASCADE;
DROP FUNCTION IF EXISTS receive_stock CASCADE;
DROP FUNCTION IF EXISTS test_rls_policies CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
-- Continue for all policies...

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
```

## API Endpoints

### Checkout
```typescript
POST /api/checkout
Body: {
  variant_id: string,
  quantity: number
}
Response: {
  url: string // Stripe Checkout URL
}
```

### Stripe Webhook
```typescript
POST /api/stripe/webhook
Headers: {
  'stripe-signature': string
}
// Handles checkout.session.completed and payment_intent.payment_failed
```

## Admin Panel

### Access
Navigate to `/admin` and login with Supabase Auth credentials.

### Features
- Products management (CRUD)
- Variants management
- Inventory with receive stock action
- Orders viewing and status updates
- Customer management
- Audit log viewing

### Receive Stock
1. Go to Inventory section
2. Click "Receive Stock" on any variant
3. Enter quantity and notes
4. Submit to update inventory and create movement record

## Troubleshooting

### Common Issues

1. **"Module not found" errors**:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. **Supabase connection issues**:
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are correct

3. **Stripe webhook failures**:
- Verify webhook secret
- Check stripe CLI is running
- Ensure correct API version

4. **Build failures**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

5. **TypeScript errors**:
```bash
# Generate fresh types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Performance Optimization

### Code Splitting
- Routes are automatically code-split
- Use dynamic imports for heavy components:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

### Image Optimization
- Use Next.js Image component
- Configure domains in next.config.mjs

### Caching
- API routes use appropriate cache headers
- Static pages are automatically cached by Next.js

## Security Considerations

### Environment Variables
- Never commit `.env` files
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only

### RLS Policies
- All tables have RLS enabled
- Deny-by-default approach
- Admin operations require authentication

### Stripe Security
- Webhook signature verification required
- Server-side price calculation
- PCI compliance via hosted checkout

## Monitoring

### Error Tracking
Consider adding:
- Sentry for error monitoring
- Vercel Analytics for performance
- Google Analytics for user behavior

### Logs
- Check Netlify function logs
- Supabase logs in dashboard
- Stripe webhook logs in dashboard

## Rollback Procedure

### Quick Rollback
```bash
# 1. Revert code
git checkout main
git branch -D feat/next15-migration

# 2. Restore environment
# Copy back original .env if needed

# 3. Reinstall original dependencies
npm install

# 4. Run original dev server
npm run dev
```

### Full Rollback
1. Revert code changes
2. Rollback database migrations
3. Restore environment variables
4. Clear CDN/build caches
5. Redeploy previous version

## Support

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Refine Documentation](https://refine.dev/docs)

### Contact
For issues specific to this migration:
- Create an issue in the GitHub repository
- Contact the development team

## Migration Checklist

- [ ] Node 22.x installed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Stripe webhooks configured
- [ ] Tests passing
- [ ] Build successful
- [ ] Deployment configured
- [ ] Rollback plan documented
- [ ] Team trained on new system