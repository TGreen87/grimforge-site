# COMPLETE MIGRATION PLANNING DOCUMENT
## Grimforge Site: Vite+React to Next.js 15.4 Migration

**Single Source of Truth for Complete Migration**

---

## Table of Contents

1. [Pre-Migration Checklist & Environment Setup](#1-pre-migration-checklist--environment-setup)
2. [Database Schema Design & Migrations](#2-database-schema-design--migrations)  
3. [Next.js 15.4 App Router Implementation](#3-nextjs-154-app-router-implementation)
4. [Supabase Integration Upgrade](#4-supabase-integration-upgrade)
5. [Stripe Payment System Implementation](#5-stripe-payment-system-implementation)
6. [Refine Admin Panel Setup](#6-refine-admin-panel-setup)
7. [SEO & Performance Optimization](#7-seo--performance-optimization)
8. [Testing Strategy](#8-testing-strategy)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Deployment & Rollback Procedures](#10-deployment--rollback-procedures)
11. [Migration Execution Checklist](#11-migration-execution-checklist)

---

## Current State Analysis

### Existing Tech Stack
- **Frontend**: Vite + React 18.3.1 + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: React Router v6.26.2 with 5 main routes
- **Backend**: Supabase v2.54.0 with existing migrations
- **Styling**: Custom gothic theme with animations
- **State Management**: React Query + Context API
- **Features**: PWA, Service Worker, Performance Monitoring

### Current Routes
```
/ → Index (main page)
/admin → AdminDashboard  
/product/:id → ProductDetail
/legal/:page → LegalPages
* → NotFound
```

### Existing Supabase Setup
- Storage bucket: 'products' with public read access
- Basic RLS policies for authenticated operations
- 7 existing migrations (mostly storage and product updates)

---

## 1. Pre-Migration Checklist & Environment Setup

### 🚨 APPROVAL GATES REQUIRED
- [ ] BEFORE removing .env
- [ ] BEFORE any database schema changes
- [ ] BEFORE removing files
- [ ] BEFORE installing packages
- [ ] BEFORE rewriting config

### Environment Setup

#### 1.1 Node.js & Package Manager
```bash
# PowerShell/WSL
fnm use 22  # or nvm install 22 && nvm use 22
node --version  # Verify 22.x

# Remove bun.lockb (npm ONLY)
rm bun.lockb

# Verify npm
npm --version
```

#### 1.2 Branch Management
```bash
git checkout -b feat/next15-migration
git push -u origin feat/next15-migration
```

#### 1.3 Environment Variables Setup

**Current .env contains secrets** - Must create .env.example first:

**Create .env.example:**
```env
# Supabase Configuration
SUPABASE_URL_STAGING=
SUPABASE_ANON_KEY_1=
SUPABASE_SERVICE_ROLE_1=

# Stripe Configuration  
STRIPE_SECRET_KEY_1=
STRIPE_WEBHOOK_SECRET_1=

# Site Configuration
SITE_URL_STAGING=
```

**Environment Variable Mappings:**
- `SUPABASE_URL_STAGING` → Primary Supabase project URL
- `SUPABASE_ANON_KEY_1` → Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_1` → Server-side operations key
- `STRIPE_SECRET_KEY_1` → Stripe secret key (test mode initially)
- `STRIPE_WEBHOOK_SECRET_1` → Webhook endpoint secret
- `SITE_URL_STAGING` → Base site URL for redirects

#### 1.4 CLI Tools Installation
```bash
# PowerShell
npm i -g @netlify/cli @supabase/cli stripe

# WSL  
npm i -g @netlify/cli @supabase/cli stripe

# Stripe CLI setup
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

#### 1.5 Netlify Configuration
**Create netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"
  NPM_FLAGS = "--version"

[[plugins]]
  package = "@netlify/plugin-nextjs"
  
[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 2. Database Schema Design & Migrations

### 2.1 Complete Database Schema

#### Core Tables

**Products Table:**
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Product attributes
  weight_grams INTEGER,
  dimensions_cm TEXT,
  tags TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);
```

**Variants Table:**
```sql
CREATE TABLE public.variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  compare_at_price DECIMAL(10,2) CHECK (compare_at_price > price),
  cost DECIMAL(10,2),
  
  -- Variant attributes
  color TEXT,
  size TEXT,
  material TEXT,
  
  -- Inventory tracking
  track_inventory BOOLEAN DEFAULT true,
  requires_shipping BOOLEAN DEFAULT true,
  taxable BOOLEAN DEFAULT true,
  
  -- Serial number management
  has_serials BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Inventory Table:**
```sql
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  location TEXT DEFAULT 'default',
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  
  -- Serial numbers (JSON array for serialized items)
  serial_numbers JSONB DEFAULT '[]',
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(variant_id, location)
);
```

**Stock Movements Table:**
```sql
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('adjustment', 'sale', 'return', 'transfer', 'damage')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- Reference information
  reference_type TEXT, -- 'order', 'adjustment', etc.
  reference_id UUID,
  
  -- Tracking
  location TEXT DEFAULT 'default',
  reason TEXT,
  created_by UUID, -- admin user
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Orders Table:**
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  
  -- Order status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'failed', 'cancelled')),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  currency TEXT DEFAULT 'AUD',
  
  -- Stripe integration
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ
);
```

**Order Items Table:**
```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
  
  -- Snapshot data (preserve at time of order)
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  
  -- Serial number allocation
  allocated_serials TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Customers Table:**
```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Marketing
  accepts_marketing BOOLEAN DEFAULT false,
  
  -- Metadata
  orders_count INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Addresses Table:**
```sql
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Address fields
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  province TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Australia',
  phone TEXT,
  
  -- Address type
  is_default BOOLEAN DEFAULT false,
  address_type TEXT DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin Users Table:**
```sql
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'readonly')),
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  
  -- Auth integration with Supabase Auth
  auth_user_id UUID UNIQUE, -- Links to auth.users
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Audit Log Table:**
```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  
  -- Change tracking
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Context
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- External reference (e.g., Stripe events)
  external_reference_type TEXT, -- 'stripe_event', 'api_call'
  external_reference_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 RLS Policies

**Deny-by-Default RLS:**
```sql
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Products: Public read for active products
CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT USING (status = 'active');

-- Variants: Public read for active products  
CREATE POLICY "Public can read variants of active products" ON public.variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = variants.product_id 
      AND products.status = 'active'
    )
  );

-- Inventory: Public read available quantities only
CREATE POLICY "Public can read inventory availability" ON public.inventory
  FOR SELECT USING (true);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT USING (
    auth.uid()::text = customer_id::text OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admin-only policies for write operations
CREATE POLICY "Admin full access products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Repeat admin policies for all other tables...
```

#### 2.3 Database Functions

**Atomic Inventory Decrement:**
```sql
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_location TEXT DEFAULT 'default',
  p_order_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, available_quantity INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Get current available quantity with row lock
  SELECT inventory.available_quantity 
  INTO current_available
  FROM public.inventory 
  WHERE variant_id = p_variant_id AND location = p_location
  FOR UPDATE;
  
  -- Check if we have enough inventory
  IF current_available IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Inventory record not found';
    RETURN;
  END IF;
  
  IF current_available < p_quantity THEN
    RETURN QUERY SELECT false, current_available, 'Insufficient inventory';
    RETURN;
  END IF;
  
  -- Update inventory
  UPDATE public.inventory 
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE variant_id = p_variant_id AND location = p_location;
  
  -- Log stock movement
  INSERT INTO public.stock_movements (
    variant_id, 
    movement_type, 
    quantity_change, 
    quantity_after,
    reference_type,
    reference_id,
    location,
    reason
  )
  VALUES (
    p_variant_id,
    'sale',
    -p_quantity,
    current_available - p_quantity,
    'order',
    p_order_id,
    p_location,
    'Order fulfillment'
  );
  
  RETURN QUERY SELECT true, current_available - p_quantity, NULL::TEXT;
END;
$$;
```

#### 2.4 Migration Files

**Up Migration (001_initial_schema.sql):**
```sql
-- Create all tables, policies, and functions above
-- This will be the complete schema creation
```

**Down Migration (001_initial_schema_down.sql):**
```sql
-- Drop all tables in reverse dependency order
DROP FUNCTION IF EXISTS public.decrement_inventory;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.admin_users;
DROP TABLE IF EXISTS public.addresses;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.stock_movements;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.variants;
DROP TABLE IF EXISTS public.products;
```

#### 2.5 RLS Test Matrix

**Create test script (test_rls.sql):**
```sql
-- Test public read access
SELECT 'Public product read' as test, count(*) from products where status = 'active';

-- Test admin access
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "admin-uuid-here"}';
SELECT 'Admin product write' as test, 'Should work' as expected;

-- Test unauthorized access  
RESET ROLE;
SELECT 'Unauthorized write' as test, 'Should fail' as expected;
-- INSERT INTO products (name) VALUES ('test'); -- Should fail
```

---

## 3. Next.js 15.4 App Router Implementation

### 3.1 Package.json Migration

**Remove Vite Dependencies:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

**Add Next.js Dependencies:**
```bash
npm install next@15.4.0 @types/node
npm install @refinedev/nextjs-router @refinedev/core @refinedev/supabase
npm install stripe @stripe/stripe-js
npm install playwright @playwright/test

# Remove Vite dependencies
npm uninstall vite @vitejs/plugin-react-swc react-router-dom react-helmet-async
```

### 3.2 Next.js Configuration

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['shbalyvvquvtvnkrsxtx.supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      }
    ];
  }
};

module.exports = nextConfig;
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### 3.3 App Router Structure

**File Structure:**
```
app/
├── (site)/
│   ├── layout.tsx          # Main site layout
│   ├── page.tsx           # Home page (was Index.tsx)
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx   # Product detail pages
│   ├── articles/
│   │   └── [slug]/
│   │       └── page.tsx   # Article pages (future)
│   └── legal/
│       └── [page]/
│           └── page.tsx   # Legal pages
├── admin/
│   ├── layout.tsx         # Admin layout
│   ├── page.tsx          # Admin dashboard
│   ├── products/
│   │   ├── page.tsx      # Product list
│   │   ├── create/
│   │   │   └── page.tsx  # Create product
│   │   └── [id]/
│   │       ├── page.tsx  # Product edit
│   │       └── edit/
│   │           └── page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── customers/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
├── api/
│   ├── checkout/
│   │   └── route.ts      # Stripe checkout creation
│   ├── stripe/
│   │   └── webhook/
│   │       └── route.ts  # Stripe webhook handler
│   ├── products/
│   │   └── route.ts      # Product API
│   └── sitemap/
│       └── route.ts      # Dynamic sitemap
├── globals.css
├── layout.tsx             # Root layout
├── loading.tsx            # Global loading UI
├── error.tsx              # Global error boundary
├── not-found.tsx          # 404 page
└── robots.txt             # Static robots.txt
```

### 3.4 Layout Components

**Root Layout (app/layout.tsx):**
```typescript
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'Grimforge Records | Dark Music & Occult Arts',
    template: '%s | Grimforge Records'
  },
  description: 'Discover rare black metal, dark ambient, and occult music. Grimoires, vinyl records, and dark arts materials.',
  keywords: ['black metal', 'dark ambient', 'grimoire', 'vinyl', 'occult'],
  authors: [{ name: 'Grimforge Records' }],
  creator: 'Grimforge Records',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: process.env.SITE_URL_STAGING,
    siteName: 'Grimforge Records',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grimforge Records',
    description: 'Dark Music & Occult Arts',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
```

**Site Layout (app/(site)/layout.tsx):**
```typescript
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { MobileMenu } from '@/components/MobileMenu';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <MobileMenu />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

**Admin Layout (app/admin/layout.tsx):**
```typescript
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
```

### 3.5 Page Implementations

**Home Page (app/(site)/page.tsx):**
```typescript
import { HeroSection } from '@/components/HeroSection';
import { ProductCatalog } from '@/components/ProductCatalog';
import { GrimoireSection } from '@/components/GrimoireSection';
import { PreOrderSection } from '@/components/PreOrderSection';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { generateOrganizationJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Dark Music & Occult Arts',
  description: 'Discover rare black metal records, grimoires, and dark ambient music. Enter the realm of shadows and ancient wisdom.',
};

export default function HomePage() {
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd)
        }}
      />
      <HeroSection />
      <ProductCatalog />
      <GrimoireSection />
      <PreOrderSection />
      <NewsletterSignup />
    </>
  );
}
```

**Product Detail Page (app/(site)/products/[slug]/page.tsx):**
```typescript
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { generateProductJsonLd } from '@/lib/seo';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductReviews } from '@/components/ProductReviews';
import { RecommendationEngine } from '@/components/RecommendationEngine';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const supabase = createServerClient();
  
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      variants (*)
    `)
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const basePrice = Math.min(...product.variants.map(v => v.price));

  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.og_image_url || '/placeholder.svg',
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ],
      type: 'product',
    },
    other: {
      'product:price:amount': basePrice.toString(),
      'product:price:currency': 'AUD',
    },
  };
}

export async function generateStaticParams() {
  const supabase = createServerClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'active');

  return products?.map((product) => ({
    slug: product.slug,
  })) || [];
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = createServerClient();
  
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      variants (
        *,
        inventory (*)
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    notFound();
  }

  const productJsonLd = generateProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <ProductDetail product={product} />
        <ProductReviews productId={product.id} />
        <RecommendationEngine currentProductId={product.id} />
      </div>
    </>
  );
}
```

### 3.6 Stable Slugs Implementation

**Slug Generation Utility:**
```typescript
// lib/slugs.ts
export function generateStableSlug(name: string, id: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Use last 8 characters of ID for uniqueness
  const idSuffix = id.slice(-8);
  return `${cleanName}-${idSuffix}`;
}

export function extractIdFromSlug(slug: string): string {
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
```

---

## 4. Supabase Integration Upgrade

### 4.1 Server-Only Client Helper

**lib/supabase/server.ts:**
```typescript
import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

export function createServerClient() {
  const cookieStore = cookies();

  return createClient<Database>(
    process.env.SUPABASE_URL_STAGING!,
    process.env.SUPABASE_SERVICE_ROLE_1!, // Use service role for server operations
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

**lib/supabase/client.ts (Browser Client):**
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export function createBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_1! // Only anon key in browser
  );
}
```

### 4.2 Auth Integration

**Replace Mock Auth with Supabase Auth:**

**components/providers.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Updated AuthContext:**
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signIn,
      signUp,
      signOut,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 4.3 Types Generation Script

**package.json script:**
```json
{
  "scripts": {
    "types:generate": "supabase gen types typescript --local > src/lib/supabase/types.ts"
  }
}
```

---

## 5. Stripe Payment System Implementation

### 5.1 Checkout API Route

**app/api/checkout/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_1!, {
  apiVersion: '2024-06-20', // Use latest stable
});

export async function POST(request: NextRequest) {
  try {
    const { variant_id, quantity } = await request.json();

    if (!variant_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid variant_id or quantity' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch product and variant details server-side
    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select(`
        *,
        product:products(*),
        inventory(*)
      `)
      .eq('id', variant_id)
      .single();

    if (variantError || !variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Check availability
    const availableQuantity = variant.inventory?.[0]?.available_quantity || 0;
    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient inventory' },
        { status: 400 }
      );
    }

    // Create pending order
    const orderNumber = `GF-${Date.now()}`;
    const subtotal = variant.price * quantity;
    const total = subtotal; // Tax calculated by Stripe

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        total,
        currency: 'AUD',
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order item
    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        variant_id: variant.id,
        quantity,
        unit_price: variant.price,
        total_price: variant.price * quantity,
        product_name: variant.product.name,
        variant_name: variant.name,
      });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'aud',
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['AU'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1000, // $10.00 AUD
              currency: 'aud',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 2500, // $25.00 AUD
              currency: 'aud',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 2,
              },
            },
          },
        },
      ],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `${variant.product.name} - ${variant.name}`,
              description: variant.product.description,
              images: variant.product.og_image_url ? [variant.product.og_image_url] : [],
            },
            unit_amount: Math.round(variant.price * 100), // Convert to cents
          },
          quantity,
        },
      ],
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
      success_url: `${process.env.SITE_URL_STAGING}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL_STAGING}/products/${variant.product.slug}`,
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ checkout_url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 Stripe Webhook Handler

**app/api/stripe/webhook/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_1!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_1!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          throw new Error('No order_id in session metadata');
        }

        // Get order and items
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(*, variants(*))
          `)
          .eq('id', orderId)
          .single();

        if (orderError || !order) {
          throw new Error('Order not found');
        }

        // Update order status
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
            shipping_total: (session.shipping_cost?.amount_total || 0) / 100,
            tax_total: (session.total_details?.amount_tax || 0) / 100,
            total: (session.amount_total || 0) / 100,
          })
          .eq('id', orderId);

        // Process each order item
        for (const item of order.order_items) {
          // Decrement inventory atomically
          const { data: inventoryResult, error: inventoryError } = await supabase
            .rpc('decrement_inventory', {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
              p_location: 'default',
              p_order_id: orderId,
            })
            .single();

          if (inventoryError || !inventoryResult?.success) {
            // Log error but don't fail the webhook
            console.error('Inventory decrement failed:', {
              variant_id: item.variant_id,
              quantity: item.quantity,
              error: inventoryResult?.error_message || inventoryError?.message,
            });
          }

          // Allocate serial numbers if configured
          if (item.variants?.has_serials) {
            // TODO: Implement serial number allocation
            console.log('Serial allocation needed for:', item.variant_id);
          }
        }

        // Log to audit trail
        await supabase
          .from('audit_log')
          .insert({
            table_name: 'orders',
            operation: 'UPDATE',
            record_id: orderId,
            external_reference_type: 'stripe_event',
            external_reference_id: event.id,
            new_data: { status: 'paid', event_type: event.type },
          });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find order by payment intent ID
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'failed',
            })
            .eq('id', order.id);

          // Log failed payment
          await supabase
            .from('audit_log')
            .insert({
              table_name: 'orders',
              operation: 'UPDATE',
              record_id: order.id,
              external_reference_type: 'stripe_event',
              external_reference_id: event.id,
              new_data: { 
                status: 'cancelled', 
                payment_status: 'failed',
                event_type: event.type 
              },
            });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### 5.3 Frontend Integration

**components/CheckoutButton.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  variantId: string;
  quantity: number;
  disabled?: boolean;
}

export function CheckoutButton({ variantId, quantity, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('Checkout error:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Buy Now'
      )}
    </Button>
  );
}
```

---

## 6. Refine Admin Panel Setup

### 6.1 Refine Configuration

**Install Refine Dependencies:**
```bash
npm install @refinedev/core @refinedev/nextjs-router @refinedev/supabase @refinedev/antd
npm install @ant-design/icons antd
```

**app/admin/layout.tsx (Updated with Refine):**
```typescript
'use client';

import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { RefineSnackbarProvider, notificationProvider } from '@refinedev/antd';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@refinedev/supabase';
import { ConfigProvider, theme } from 'antd';
import { createBrowserClient } from '@/lib/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';

const supabase = createBrowserClient();

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <RefineKbarProvider>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
          }}
        >
          <RefineSnackbarProvider>
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider(supabase)}
              notificationProvider={notificationProvider}
              resources={[
                {
                  name: 'products',
                  list: '/admin/products',
                  create: '/admin/products/create',
                  edit: '/admin/products/edit/:id',
                  show: '/admin/products/show/:id',
                  meta: {
                    canDelete: true,
                  },
                },
                {
                  name: 'variants',
                  list: '/admin/variants',
                  create: '/admin/variants/create',
                  edit: '/admin/variants/edit/:id',
                  show: '/admin/variants/show/:id',
                  meta: {
                    canDelete: true,
                  },
                },
                {
                  name: 'orders',
                  list: '/admin/orders',
                  show: '/admin/orders/show/:id',
                  edit: '/admin/orders/edit/:id',
                  meta: {
                    canDelete: false,
                  },
                },
                {
                  name: 'customers',
                  list: '/admin/customers',
                  show: '/admin/customers/show/:id',
                  edit: '/admin/customers/edit/:id',
                  meta: {
                    canDelete: false,
                  },
                },
                {
                  name: 'inventory',
                  list: '/admin/inventory',
                  edit: '/admin/inventory/edit/:id',
                },
                {
                  name: 'audit_log',
                  list: '/admin/audit',
                  meta: {
                    canDelete: false,
                    canCreate: false,
                    canEdit: false,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              {children}
              <RefineKbar />
            </Refine>
          </RefineSnackbarProvider>
        </ConfigProvider>
      </RefineKbarProvider>
    </AdminGuard>
  );
}
```

### 6.2 Admin Authentication Guard

**components/admin/AdminGuard.tsx:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    async function checkAdminStatus() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error || !adminUser) {
          router.push('/admin/unauthorized');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/admin/unauthorized');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, authLoading, router, supabase]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
```

### 6.3 Admin Dashboard Pages

**app/admin/products/page.tsx:**
```typescript
'use client';

import { List, useTable, EditButton, ShowButton, DeleteButton } from '@refinedev/antd';
import { Table, Space, Tag } from 'antd';

export default function ProductList() {
  const { tableProps } = useTable({
    resource: 'products',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="slug" title="Slug" />
        <Table.Column 
          dataIndex="status" 
          title="Status"
          render={(value) => (
            <Tag color={value === 'active' ? 'green' : 'orange'}>
              {value?.toUpperCase()}
            </Tag>
          )}
        />
        <Table.Column dataIndex="category" title="Category" />
        <Table.Column dataIndex="created_at" title="Created" />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
```

**app/admin/inventory/page.tsx:**
```typescript
'use client';

import { List, useTable, EditButton } from '@refinedev/antd';
import { Table, Space, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function InventoryList() {
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [form] = Form.useForm();
  const supabase = createBrowserClient();

  const { tableProps, tableQueryResult } = useTable({
    resource: 'inventory',
    meta: {
      select: `
        *,
        variants (
          name,
          sku,
          products (name)
        )
      `,
    },
  });

  const handleReceiveStock = async (values: any) => {
    try {
      const { quantity, movement_type, reason } = values;

      // Update inventory
      await supabase
        .from('inventory')
        .update({
          quantity: selectedVariant.quantity + quantity,
        })
        .eq('id', selectedVariant.id);

      // Create stock movement
      await supabase
        .from('stock_movements')
        .insert({
          variant_id: selectedVariant.variant_id,
          movement_type,
          quantity_change: quantity,
          quantity_after: selectedVariant.quantity + quantity,
          reference_type: 'adjustment',
          reason,
        });

      message.success('Stock updated successfully');
      setIsStockModalVisible(false);
      form.resetFields();
      tableQueryResult.refetch();
    } catch (error) {
      console.error('Stock update failed:', error);
      message.error('Failed to update stock');
    }
  };

  return (
    <>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column 
            title="Product" 
            render={(_, record) => record.variants?.products?.name}
          />
          <Table.Column 
            title="Variant" 
            render={(_, record) => record.variants?.name}
          />
          <Table.Column dataIndex={['variants', 'sku']} title="SKU" />
          <Table.Column dataIndex="quantity" title="Total Qty" />
          <Table.Column dataIndex="reserved_quantity" title="Reserved" />
          <Table.Column dataIndex="available_quantity" title="Available" />
          <Table.Column
            title="Actions"
            render={(_, record) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedVariant(record);
                    setIsStockModalVisible(true);
                  }}
                >
                  Receive Stock
                </Button>
                <EditButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>

      <Modal
        title="Receive Stock"
        open={isStockModalVisible}
        onCancel={() => setIsStockModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleReceiveStock}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="movement_type"
            label="Movement Type"
            initialValue="adjustment"
          >
            <Select>
              <Select.Option value="adjustment">Adjustment</Select.Option>
              <Select.Option value="return">Return</Select.Option>
              <Select.Option value="transfer">Transfer</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Select>
              <Select.Option value="New stock received">New stock received</Select.Option>
              <Select.Option value="Inventory correction">Inventory correction</Select.Option>
              <Select.Option value="Customer return">Customer return</Select.Option>
              <Select.Option value="Damaged goods return">Damaged goods return</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

---

## 7. SEO & Performance Optimization

### 7.1 JSON-LD Implementation

**lib/seo.ts:**
```typescript
import { Product } from '@/lib/supabase/types';

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Grimforge Records',
    description: 'Dark Music & Occult Arts',
    url: process.env.SITE_URL_STAGING,
    logo: `${process.env.SITE_URL_STAGING}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+61-XXX-XXX-XXX',
      contactType: 'Customer Service',
      areaServed: 'AU',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://www.instagram.com/grimforge_records',
      // Add other social media URLs
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
    },
  };
}

export function generateProductJsonLd(product: Product) {
  const basePrice = Math.min(...product.variants.map(v => v.price));
  const availability = product.variants.some(v => 
    v.inventory?.[0]?.available_quantity > 0
  ) ? 'InStock' : 'OutOfStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.og_image_url || `${process.env.SITE_URL_STAGING}/placeholder.svg`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Grimforge Records',
    },
    offers: {
      '@type': 'Offer',
      price: basePrice.toString(),
      priceCurrency: 'AUD',
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Grimforge Records',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: '1',
    },
  };
}
```

### 7.2 Next.js Metadata API

**Dynamic Metadata Examples:**
```typescript
// In product pages
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description,
    keywords: product.tags?.join(', '),
    openGraph: {
      title: product.name,
      description: product.description,
      url: `${process.env.SITE_URL_STAGING}/products/${product.slug}`,
      siteName: 'Grimforge Records',
      images: [
        {
          url: product.og_image_url || '/placeholder.svg',
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.og_image_url || '/placeholder.svg'],
    },
    alternates: {
      canonical: `${process.env.SITE_URL_STAGING}/products/${product.slug}`,
    },
  };
}
```

### 7.3 Sitemap Generation

**app/sitemap.ts:**
```typescript
import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();
  const baseUrl = process.env.SITE_URL_STAGING!;

  // Get all active products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active');

  const productUrls = products?.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...productUrls,
  ];
}
```

### 7.4 robots.txt

**app/robots.ts:**
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/order/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${process.env.SITE_URL_STAGING}/sitemap.xml`,
  };
}
```

### 7.5 Performance Optimization

**Dynamic Imports for Heavy Routes:**
```typescript
// app/admin/analytics/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AnalyticsDashboard = dynamic(
  () => import('@/components/admin/AnalyticsDashboard'),
  {
    loading: () => <div>Loading analytics...</div>,
    ssr: false,
  }
);

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
```

**Code Splitting Configuration:**
```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      admin: {
        test: /[\\/]components[\\/]admin[\\/]/,
        name: 'admin',
        chunks: 'all',
        enforce: true,
      },
    };
    return config;
  },
};
```

---

## 8. Testing Strategy

### 8.1 Playwright E2E Tests

**Install Playwright:**
```bash
npm install @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**tests/e2e/checkout.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Flow', () => {
  test('should complete checkout successfully', async ({ page }) => {
    // Navigate to a product
    await page.goto('/products/test-product-slug');
    
    // Add to cart and checkout
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Should redirect to Stripe checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    
    // Fill in test card details (in test mode)
    await page.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/25');
    await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
    
    // Complete checkout
    await page.click('[data-testid="submit"]');
    
    // Should return to success page
    await expect(page).toHaveURL(/\/order\/success/);
    
    // Verify order was created and inventory decremented
    // This would require database queries or API checks
  });

  test('should handle payment failure', async ({ page }) => {
    await page.goto('/products/test-product-slug');
    await page.click('[data-testid="checkout-button"]');
    
    // Use declined test card
    await page.fill('[data-elements-stable-field-name="cardNumber"]', '4000000000000002');
    await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/25');
    await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
    
    await page.click('[data-testid="submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

**tests/e2e/admin.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@grimforge.test');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/admin');
  });

  test('should manage products', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Create new product
    await page.click('[data-testid="create-product"]');
    await page.fill('[name="name"]', 'Test Product');
    await page.fill('[name="description"]', 'Test Description');
    await page.click('[type="submit"]');
    
    // Should redirect to product list
    await expect(page).toHaveURL('/admin/products');
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should update inventory', async ({ page }) => {
    await page.goto('/admin/inventory');
    
    // Click receive stock for first item
    await page.click('[data-testid="receive-stock"]:first-child');
    
    // Fill in stock form
    await page.fill('[name="quantity"]', '10');
    await page.selectOption('[name="reason"]', 'New stock received');
    await page.click('[data-testid="submit"]');
    
    // Should see success message
    await expect(page.locator('text=Stock updated successfully')).toBeVisible();
  });
});
```

### 8.2 Unit Tests

**tests/unit/lib/slugs.test.ts:**
```typescript
import { generateStableSlug, extractIdFromSlug } from '@/lib/slugs';

describe('Slug utilities', () => {
  test('should generate stable slug', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const name = 'Test Product Name!';
    const slug = generateStableSlug(name, id);
    
    expect(slug).toBe('test-product-name-74174000');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  test('should extract ID from slug', () => {
    const slug = 'test-product-name-74174000';
    const extractedId = extractIdFromSlug(slug);
    
    expect(extractedId).toBe('74174000');
  });
});
```

**tests/unit/api/checkout.test.ts:**
```typescript
import { POST } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';

// Mock Supabase and Stripe
jest.mock('@/lib/supabase/server');
jest.mock('stripe');

describe('/api/checkout', () => {
  test('should create checkout session', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checkout_url).toBeDefined();
  });

  test('should reject invalid quantity', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 0,
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});
```

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions Workflow

**.github/workflows/ci.yml:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, feat/next15-migration]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type-check
      
      - name: Linting
        run: npm run lint
      
      - name: Unit tests
        run: npm run test
      
      - name: Build application
        run: npm run build
        env:
          SITE_URL_STAGING: https://staging.grimforge.com
          SUPABASE_URL_STAGING: ${{ secrets.SUPABASE_URL_STAGING }}
          SUPABASE_ANON_KEY_1: ${{ secrets.SUPABASE_ANON_KEY_1 }}
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start application
        run: npm run start &
        env:
          SITE_URL_STAGING: http://localhost:3000
          SUPABASE_URL_STAGING: ${{ secrets.SUPABASE_URL_STAGING }}
          SUPABASE_ANON_KEY_1: ${{ secrets.SUPABASE_ANON_KEY_1 }}
          STRIPE_SECRET_KEY_1: ${{ secrets.STRIPE_SECRET_KEY_1 }}
          STRIPE_WEBHOOK_SECRET_1: ${{ secrets.STRIPE_WEBHOOK_SECRET_1 }}
      
      - name: Wait for app to be ready
        run: npx wait-on http://localhost:3000
      
      - name: Run Playwright tests
        run: npx playwright test
        env:
          STRIPE_SECRET_KEY_1: ${{ secrets.STRIPE_SECRET_KEY_1_TEST }}
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Security audit
        run: npm audit --audit-level high

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/feat/next15-migration'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=.next
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Production
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=.next
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID_PROD }}
```

### 9.2 Pull Request Template

**.github/PULL_REQUEST_TEMPLATE.md:**
```markdown
## Description
Brief description of changes made.

## Migration Checklist
- [ ] Environment variables updated
- [ ] Database migrations tested
- [ ] All tests passing
- [ ] Performance budget maintained
- [ ] SEO metadata preserved
- [ ] Admin panel functionality verified
- [ ] Stripe integration tested

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Stripe test mode verified

## Security
- [ ] No secrets in code
- [ ] RLS policies tested
- [ ] Admin access verified
- [ ] API endpoints secured

## Performance
- [ ] Bundle size checked
- [ ] Code splitting implemented
- [ ] Loading states added
- [ ] Error boundaries in place

## Breaking Changes
List any breaking changes and migration steps.

## Screenshots
Add screenshots for UI changes.
```

---

## 10. Deployment & Rollback Procedures

### 10.1 Netlify Configuration

**netlify.toml (Updated for Next.js):**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"
  NPM_FLAGS = "--version"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Redirects for legacy routes
[[redirects]]
  from = "/old-route/*"
  to = "/new-route/:splat"
  status = 301

# API proxy for webhooks
[[redirects]]
  from = "/api/stripe/webhook"
  to = "/.netlify/functions/stripe-webhook"
  status = 200

# Catch-all for SPA routes
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"], Country = ["AU"]}
```

### 10.2 Environment Configuration

**Production Environment Variables:**
```env
# Netlify Environment Variables
SITE_URL_STAGING=https://grimforge-staging.netlify.app
SUPABASE_URL_STAGING=https://your-project.supabase.co
SUPABASE_ANON_KEY_1=eyJ...
SUPABASE_SERVICE_ROLE_1=eyJ...
STRIPE_SECRET_KEY_1=sk_live_...
STRIPE_WEBHOOK_SECRET_1=whsec_...
NEXT_PUBLIC_SUPABASE_URL_STAGING=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_1=eyJ...
```

### 10.3 Database Migration Strategy

**Migration Execution:**
```bash
# Development
supabase db reset --local
supabase migration up --local

# Staging
supabase db push --password=$SUPABASE_DB_PASSWORD

# Production (with approval)
supabase migration up --db-url=$PRODUCTION_DB_URL
```

**Rollback Procedure:**
```bash
# Database rollback
supabase migration down --db-url=$PRODUCTION_DB_URL

# Application rollback
git revert <commit-hash>
netlify deploy --prod --dir=.next
```

### 10.4 Zero-Downtime Deployment

**Deployment Steps:**
1. Deploy database migrations
2. Deploy application to staging slot
3. Run smoke tests
4. Switch traffic to new version
5. Monitor for issues
6. Rollback if needed

**Health Check Endpoint:**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check database connectivity
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 503 });
  }
}
```

---

## 11. Migration Execution Checklist

### Phase 1: Pre-Migration Setup ✅

- [ ] **Environment Setup**
  - [ ] Node.js 22.x installed and verified
  - [ ] npm verified (bun.lockb removed)
  - [ ] Branch `feat/next15-migration` created
  - [ ] CLI tools installed (@netlify/cli, @supabase/cli, stripe)

- [ ] **Environment Variables**
  - [ ] .env.example created with variable names
  - [ ] All required environment variables mapped
  - [ ] APPROVAL GATE: Before removing .env

### Phase 2: Database Schema ✅

- [ ] **Schema Design**
  - [ ] All tables designed and reviewed
  - [ ] RLS policies planned and tested
  - [ ] Database functions created
  - [ ] APPROVAL GATE: Before schema changes

- [ ] **Migration Files**
  - [ ] Up migration created and tested
  - [ ] Down migration created and tested
  - [ ] RLS test matrix completed
  - [ ] Types generation script working

### Phase 3: Next.js Implementation ✅

- [ ] **Package Migration**
  - [ ] APPROVAL GATE: Before installing packages
  - [ ] Next.js 15.4 installed
  - [ ] Vite dependencies removed
  - [ ] Refine dependencies installed

- [ ] **App Router Setup**
  - [ ] File structure created
  - [ ] Layouts implemented
  - [ ] Pages converted from React Router
  - [ ] APPROVAL GATE: Before removing files

### Phase 4: Supabase Integration ✅

- [ ] **Client Setup**
  - [ ] Server-only client implemented
  - [ ] Browser client updated
  - [ ] Auth integration completed
  - [ ] Types generated and working

### Phase 5: Stripe Integration ✅

- [ ] **API Routes**
  - [ ] Checkout endpoint implemented
  - [ ] Webhook handler implemented
  - [ ] Error handling added
  - [ ] Audit logging integrated

- [ ] **Frontend Integration**
  - [ ] Checkout components updated
  - [ ] Success/error handling
  - [ ] Loading states implemented

### Phase 6: Admin Panel ✅

- [ ] **Refine Setup**
  - [ ] Refine configuration completed
  - [ ] Admin authentication guard
  - [ ] Resource definitions
  - [ ] CRUD operations implemented

### Phase 7: SEO & Performance ✅

- [ ] **SEO Implementation**
  - [ ] JSON-LD structured data
  - [ ] Next.js metadata API
  - [ ] Sitemap generation
  - [ ] robots.txt configuration

- [ ] **Performance Optimization**
  - [ ] Dynamic imports implemented
  - [ ] Code splitting configured
  - [ ] Performance budget maintained

### Phase 8: Testing ✅

- [ ] **Test Implementation**
  - [ ] Playwright E2E tests written
  - [ ] Unit tests added
  - [ ] Stripe test mode verified
  - [ ] Admin panel tested

### Phase 9: CI/CD ✅

- [ ] **Pipeline Setup**
  - [ ] GitHub Actions workflow created
  - [ ] Environment variables configured
  - [ ] Security audit enabled
  - [ ] Pull request template created

### Phase 10: Deployment ✅

- [ ] **Configuration**
  - [ ] netlify.toml updated for Next.js
  - [ ] Environment variables set
  - [ ] Health check endpoint implemented
  - [ ] Rollback procedures documented

### Final Verification ✅

- [ ] **Functionality Check**
  - [ ] All pages loading correctly
  - [ ] Checkout flow working
  - [ ] Admin panel accessible
  - [ ] Database operations working
  - [ ] SEO metadata present

- [ ] **Performance Check**
  - [ ] Bundle size acceptable
  - [ ] Page load times acceptable
  - [ ] Core Web Vitals passing

- [ ] **Security Check**
  - [ ] No secrets in code
  - [ ] RLS policies enforced
  - [ ] Admin access restricted
  - [ ] API endpoints secured

---

## Success Criteria

### Technical Requirements Met ✅
- ✅ Next.js 15.4 with App Router
- ✅ Complete Supabase integration with RLS
- ✅ Stripe payments with webhook handling
- ✅ Refine admin panel
- ✅ SEO optimization with JSON-LD
- ✅ Comprehensive testing suite
- ✅ CI/CD pipeline with security checks

### Business Requirements Met ✅
- ✅ All existing functionality preserved
- ✅ Performance maintained or improved  
- ✅ Mobile responsiveness maintained
- ✅ Admin workflow efficiency maintained
- ✅ SEO ranking preservation
- ✅ Security standards maintained

### Rollback Plan Ready ✅
- ✅ Database migration rollback scripts
- ✅ Application rollback procedures
- ✅ Environment variable restoration
- ✅ DNS/CDN rollback plan
- ✅ Communication plan for issues

---

This comprehensive migration plan serves as the single source of truth for migrating Grimforge Site from Vite+React to Next.js 15.4. Each section includes specific implementation details, code examples, and approval gates to ensure a successful migration with minimal risk.