# COMPREHENSIVE MIGRATION PLAN: Vite+React to Next.js 15.4
## Single Source of Truth Document

### PROJECT METADATA
- **Repository**: https://github.com/TGreen87/grimforge-site
- **Branch**: feat/next15-migration  
- **Node Version**: 22.x
- **Package Manager**: npm ONLY (delete bun.lockb)
- **Deployment**: Netlify with Next Runtime v5

### ENVIRONMENT VARIABLES

#### Required Variables (use aliases provided)
```
SUPABASE_URL_STAGING
SUPABASE_ANON_KEY_1
SUPABASE_SERVICE_ROLE_1
STRIPE_SECRET_KEY_1
STRIPE_WEBHOOK_SECRET_1
SITE_URL_STAGING
```

#### .env.example Template
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Configuration
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Site Configuration
NEXT_PUBLIC_SITE_URL=

# Staging Aliases
SUPABASE_URL_STAGING=
SUPABASE_ANON_KEY_1=
SUPABASE_SERVICE_ROLE_1=
STRIPE_SECRET_KEY_1=
STRIPE_WEBHOOK_SECRET_1=
SITE_URL_STAGING=
```

### CONSTRAINTS & GUARDRAILS
- **NEVER** write secrets into git
- **NEVER** run destructive Supabase migrations without dry-run
- **NO** production service touches (staging aliases only)
- **ZERO** PCI scope (Stripe hosted checkout only)
- **SINGLE-LEVEL** lists in README
- **APPROVAL GATES** required before:
  - Removing .env
  - Database schema changes
  - File removals
  - Package installations
  - Config rewrites

---

## PHASE 1: BASELINE & SECURITY

### Step 1.1: Environment Security
```bash
# Remove tracked .env (DO NOT remove from history yet)
rm .env

# Create .env.example with names only
cat > .env.example << 'EOF'
[content from template above]
EOF

# Update .gitignore
echo -e "\n# Environment variables\n.env\n.env.local\n.env.*.local" >> .gitignore
```
**PAUSE FOR APPROVAL** - User must rotate keys before continuing

### Step 1.2: Branch Setup
```bash
# Create migration branch
git checkout -b feat/next15-migration

# Commit environment changes
git add .env.example .gitignore
git rm --cached .env
git commit -m "chore: remove tracked .env, add .env.example

BREAKING: Exposed credentials removed
- Requires key rotation before deployment"
```

### Step 1.3: Package Manager Cleanup
```bash
# Remove bun artifacts
rm bun.lockb
git add -u
git commit -m "chore: standardize on npm package manager"
```

---

## PHASE 2: NEXT.JS 15.4 SCAFFOLDING

### Step 2.1: In-Place Migration Setup
```bash
# Install Next.js 15.4 dependencies
npm install next@15.1.4 react@18.3.1 react-dom@18.3.1
npm install -D @types/node@22.5.5 @types/react@18.3.3 @types/react-dom@18.3.0

# Remove Vite dependencies
npm uninstall vite @vitejs/plugin-react-swc

# Remove React Router
npm uninstall react-router-dom
```

### Step 2.2: Core Configuration Files

#### next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['shbalyvvquvtvnkrsxtx.supabase.co'],
  },
}

export default nextConfig
```

#### tsconfig.json (with strict: true)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 2.3: App Router Structure
```
app/
├── (site)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── articles/
│       └── [slug]/
│           └── page.tsx
├── admin/
│   ├── layout.tsx
│   └── [[...segments]]/
│       └── page.tsx
├── api/
│   ├── checkout/
│   │   └── route.ts
│   └── stripe/
│       └── webhook/
│           └── route.ts
├── layout.tsx
└── globals.css
```

---

## PHASE 3: NETLIFY CONFIGURATION

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"
  NEXT_RUNTIME = "v5"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
  
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## PHASE 4: DATABASE SCHEMA & MIGRATIONS

### Step 4.1: Required Tables
- products
- variants  
- inventory
- stock_movements
- orders
- order_items
- customers
- addresses
- admin_users
- audit_log

### Step 4.2: Up Migration
```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create atomic inventory decrement function
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_variant_id UUID,
  p_quantity INT,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE inventory 
  SET on_hand = on_hand - p_quantity,
      allocated = allocated + p_quantity,
      updated_at = NOW()
  WHERE variant_id = p_variant_id
    AND on_hand >= p_quantity;
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO stock_movements (
    variant_id,
    quantity,
    movement_type,
    reference_id,
    reference_type
  ) VALUES (
    p_variant_id,
    -p_quantity,
    'sale',
    p_order_id,
    'order'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Step 4.3: Down Migration
```sql
DROP FUNCTION IF EXISTS decrement_inventory;
-- Drop RLS policies
-- Drop tables in reverse order
```

### Step 4.4: RLS Policies (Deny-by-Default)
```sql
-- Public read-only views
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admin write products" ON products
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Block all unauthenticated writes
CREATE POLICY "Block unauthenticated writes" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Step 4.5: RLS Test Matrix
```sql
-- Test unauthenticated writes are blocked
-- Test public reads work
-- Test admin operations work
```

---

## PHASE 5: SUPABASE INTEGRATION

### Step 5.1: Install Dependencies
```bash
npm install @supabase/supabase-js@2.56.x
npm install @supabase/auth-helpers-nextjs
```

### Step 5.2: Server-Only Client Helper
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.SUPABASE_URL_STAGING!,
    process.env.SUPABASE_ANON_KEY_1!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

// NEVER expose service role key to browser
export function createServiceClient() {
  return createServerClient(
    process.env.SUPABASE_URL_STAGING!,
    process.env.SUPABASE_SERVICE_ROLE_1!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

---

## PHASE 6: STRIPE PAYMENT INTEGRATION

### Step 6.1: Dependencies
```bash
npm install stripe
```

### Step 6.2: /api/checkout/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_1!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: NextRequest) {
  const { variant_id, quantity } = await req.json()
  const supabase = createServiceClient()
  
  // 1. Resolve price and availability from Supabase
  const { data: variant } = await supabase
    .from('variants')
    .select('*, inventory(*)')
    .eq('id', variant_id)
    .single()
    
  if (!variant || variant.inventory.on_hand < quantity) {
    return NextResponse.json({ error: 'Out of stock' }, { status: 400 })
  }
  
  // 2. Create pending order in Supabase
  const { data: order } = await supabase
    .from('orders')
    .insert({
      status: 'pending',
      total: variant.price * quantity,
      currency: 'AUD'
    })
    .select()
    .single()
  
  // 3. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'AUD',
        product_data: {
          name: variant.name,
        },
        unit_amount: variant.price * 100,
      },
      quantity,
    }],
    mode: 'payment',
    automatic_tax: { enabled: true },
    shipping_address_collection: {
      allowed_countries: ['AU'],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 1000, currency: 'AUD' },
          display_name: 'Standard Shipping',
        },
      },
    ],
    success_url: `${process.env.SITE_URL_STAGING}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL_STAGING}/cart`,
    metadata: {
      order_id: order.id,
      variant_id,
      quantity: quantity.toString(),
    },
  })
  
  return NextResponse.json({ url: session.url })
}
```

### Step 6.3: /api/stripe/webhook/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_1!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!
  
  // Verify webhook signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_1!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = createServiceClient()
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { order_id, variant_id, quantity } = session.metadata!
    
    // 1. Mark order as paid
    await supabase
      .from('orders')
      .update({ status: 'paid', stripe_session_id: session.id })
      .eq('id', order_id)
    
    // 2. Allocate serials if configured
    // [Implementation based on product configuration]
    
    // 3. Atomic inventory decrement
    const { data: success } = await supabase.rpc('decrement_inventory', {
      p_variant_id: variant_id,
      p_quantity: parseInt(quantity),
      p_order_id: order_id
    })
    
    // 4. Write to audit_log
    await supabase
      .from('audit_log')
      .insert({
        event_type: 'order.paid',
        event_id: event.id,
        stripe_event_type: event.type,
        metadata: session,
        order_id
      })
  }
  
  if (event.type === 'payment_intent.payment_failed') {
    // Handle payment failure
  }
  
  return NextResponse.json({ received: true })
}
```

---

## PHASE 7: REFINE ADMIN PANEL

### Step 7.1: Dependencies
```bash
npm install @refinedev/core @refinedev/nextjs-router
npm install @refinedev/supabase @refinedev/antd
```

### Step 7.2: Admin Layout & Page
```typescript
// app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RefineProvider
      dataProvider={dataProvider(supabaseClient)}
      authProvider={authProvider}
      routerProvider={routerProvider}
      resources={[
        { name: "products", list: "/admin/products" },
        { name: "variants", list: "/admin/variants" },
        { name: "inventory", list: "/admin/inventory" },
        { name: "orders", list: "/admin/orders" },
        { name: "customers", list: "/admin/customers" },
        { name: "audit_logs", list: "/admin/audit-logs" },
      ]}
    >
      {children}
    </RefineProvider>
  )
}
```

### Step 7.3: Receive Stock Action
```typescript
// Custom action for inventory management
const receiveStock = async (variantId: string, quantity: number) => {
  const { error } = await supabase
    .from('stock_movements')
    .insert({
      variant_id: variantId,
      quantity: quantity,
      movement_type: 'receipt',
      notes: 'Stock received'
    })
    
  if (!error) {
    await supabase
      .from('inventory')
      .update({ on_hand: on_hand + quantity })
      .eq('variant_id', variantId)
  }
}
```

---

## PHASE 8: SEO & PERFORMANCE

### Step 8.1: JSON-LD Components
```typescript
// components/JsonLd.tsx
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Obsidian Rite Records',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductJsonLd({ product }: { product: Product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'AUD',
      availability: product.in_stock ? 'InStock' : 'OutOfStock',
    },
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Step 8.2: Metadata API
```typescript
// app/products/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image_url],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image_url],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${params.slug}`,
    },
  }
}
```

### Step 8.3: Sitemap & Robots
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts()
  
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL!,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...products.map((product) => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

### Step 8.4: Dynamic Imports
```typescript
// Lazy load heavy components
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'))
const Analytics = dynamic(() => import('@/components/Analytics'))
```

---

## PHASE 9: TESTING

### Step 9.1: Playwright Setup
```bash
npm install -D @playwright/test
npx playwright install
```

### Step 9.2: E2E Test for Checkout
```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test'

test('complete stripe checkout flow', async ({ page }) => {
  // 1. Add product to cart
  await page.goto('/products/test-product')
  await page.click('button:has-text("Add to Cart")')
  
  // 2. Proceed to checkout
  await page.goto('/cart')
  await page.click('button:has-text("Checkout")')
  
  // 3. Complete Stripe payment (test mode)
  await page.fill('[name="cardNumber"]', '4242424242424242')
  await page.fill('[name="cardExpiry"]', '12/34')
  await page.fill('[name="cardCvc"]', '123')
  await page.click('button:has-text("Pay")')
  
  // 4. Assert order status
  await expect(page).toHaveURL(/\/success/)
  const orderStatus = await page.locator('[data-test="order-status"]').textContent()
  expect(orderStatus).toBe('paid')
  
  // 5. Verify inventory decrement
  const inventory = await page.locator('[data-test="inventory-count"]').textContent()
  expect(parseInt(inventory)).toBeLessThan(initialInventory)
})
```

---

## PHASE 10: CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [feat/next15-migration]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [22.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Run unit tests
        run: npm test
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
```

### PR Template
```markdown
# Pull Request: Next.js 15.4 Migration

## Acceptance Criteria
- [ ] Stripe test order completes successfully
- [ ] Order status changes to 'paid' after checkout
- [ ] Inventory decrements atomically
- [ ] Admin receive-stock action increases inventory
- [ ] Product JSON-LD validates
- [ ] Sitemap and robots.txt exist
- [ ] RLS blocks unauthenticated writes
- [ ] No secrets in git
- [ ] .env.example lists names only

## Rollback Steps
1. `git checkout main`
2. `git branch -D feat/next15-migration`
3. Restore environment variables from backup
4. Revert database migrations if applied

## Testing
- [ ] All unit tests pass
- [ ] Playwright E2E tests pass
- [ ] Manual checkout flow tested
- [ ] Admin panel functional
```

---

## PHASE 11: DOCUMENTATION

### /docs/NEXT-15-MIGRATION.md
```markdown
# Next.js 15.4 Migration Documentation

## Environment Variables
See .env.example for required variables

## Development Setup
1. Install Node 22.x: `fnm use 22` or `nvm install 22`
2. Install global tools: `npm i -g @netlify/cli @supabase/cli stripe`
3. Run locally: `npm run dev` or `netlify dev`
4. Test Stripe webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Database Migrations
- Up: `supabase migration up`
- Down: `supabase migration down`

## Rollback Procedure
1. Checkout main branch
2. Delete migration branch
3. Restore .env from backup
4. Revert database changes
```

---

## WINDOWS 11 & WSL COMMANDS

### PowerShell
```powershell
fnm use 22  # or nvm install 22
npm i -g @netlify/cli @supabase/cli stripe
```

### WSL
```bash
npm i -g @netlify/cli @supabase/cli stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
netlify dev
npx playwright install
```

---

## IMPLEMENTATION CHECKLIST

### Pre-Migration
- [ ] Backup current project
- [ ] Document current environment variables
- [ ] Ensure Node 22.x installed

### Phase 1: Security & Setup
- [ ] Remove .env from tracking
- [ ] Create .env.example
- [ ] PAUSE - Rotate keys
- [ ] Create migration branch
- [ ] Delete bun.lockb

### Phase 2: Next.js Setup  
- [ ] Scaffold Next.js 15.4
- [ ] Port components
- [ ] Convert routing

### Phase 3: Integrations
- [ ] Supabase Auth
- [ ] Stripe Checkout
- [ ] Refine Admin

### Phase 4: Production Ready
- [ ] SEO & JSON-LD
- [ ] Tests
- [ ] CI/CD
- [ ] Documentation

### Acceptance Testing
- [ ] Complete test purchase
- [ ] Verify inventory management
- [ ] Validate SEO markup
- [ ] Security audit

---

## CRITICAL NOTES
1. **NEVER** commit secrets
2. **ALWAYS** use staging aliases
3. **ATOMIC** inventory operations only
4. **DENY-BY-DEFAULT** RLS policies
5. **SERVER-ONLY** Supabase service client
6. **STRIPE API**: 2025-07-30.basil
7. **NODE**: 22.x everywhere
8. **PACKAGE MANAGER**: npm only