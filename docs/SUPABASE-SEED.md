# Supabase Bootstrap & No-DO Seed

Last updated: 2025-09-16

This guide walks through verifying the minimum schema, bootstrapping any missing tables/policies, and seeding the preview product + admin role for branch deploys. The statements are idempotent; a short `DO $$` wrapper is only used when checking for existing policies.

> ⚠️ Never paste service role keys into client-side code. Run these statements from Serverless SQL (Studio) or via the Supabase MCP with service-role auth.

## 1. Prerequisites

- Supabase project connected to the Netlify site (`NEXT_PUBLIC_SUPABASE_URL`).
- Service role key available via MCP or Supabase SQL editor.
- `gen_random_uuid()` extension enabled (default in Supabase projects).

## 2. Inspect Current Schema

```sql
-- Check core tables exist
select to_regclass('public.products')   as products,
       to_regclass('public.variants')   as variants,
       to_regclass('public.inventory')  as inventory,
       to_regclass('public.user_roles') as user_roles;

-- Confirm the product slug column
select column_name, data_type
from information_schema.columns
where table_name = 'products' and column_name = 'slug';

-- Policy sanity check (products should expose active rows publicly)
select policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public' and tablename = 'products';
```

If any result is `NULL`, continue to the bootstrap steps below.

## 3. Bootstrap Missing Tables & Columns

```sql
-- Ensure slug exists (unique for friendly URLs)
alter table public.products
  add column if not exists slug text unique;

-- Variants (Stock Units)
create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  sku text unique not null,
  price numeric(10,2) not null,
  format text,
  attributes jsonb default '{}',
  weight_grams integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory (1:1 with variants)
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid unique references public.variants(id) on delete cascade,
  on_hand integer default 0 check (on_hand >= 0),
  allocated integer default 0 check (allocated >= 0),
  available integer generated always as (on_hand - allocated) stored,
  reorder_point integer default 5,
  reorder_quantity integer default 20,
  updated_at timestamptz default now()
);

-- Admin roles table (if missing)
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Policies: admins manage; users can view own roles
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'Admins manage user roles'
  ) then
    create policy "Admins manage user roles"
    on public.user_roles
    as restrictive
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'Users can view own roles'
  ) then
    create policy "Users can view own roles"
    on public.user_roles
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

-- Products policy for public storefront access
alter table public.products enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'Public can view active products'
  ) then
    create policy "Public can view active products"
    on public.products
    for select
    to public
    using (active = true);
  end if;
end $$;
```

> The `DO $$` blocks above only wrap policy creation to avoid duplicates. Supabase Studio and the MCP server both allow `DO` statements—run once and you are done.

## 4. No-DO Seed (Admin + Demo Product)

This seed creates the QA admin role and the `test-vinyl-dark-rituals` product, variant, and inventory that the smoke tests expect. Replace the admin email if needed.

```sql
-- 4.1 Grant admin role (updates both user_roles & legacy admin_users when present)
with target_user as (
  select id
  from auth.users
  where email = 'arg@obsidianriterecords.com'
  limit 1
)
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from target_user
on conflict (user_id, role) do nothing;

-- 4.2 Seed product, variant, and inventory
with product_upsert as (
  insert into public.products (slug, title, artist, format, description, price, active)
  values (
    'test-vinyl-dark-rituals',
    'Test Vinyl — Dark Rituals',
    'Shadowmoon',
    'vinyl',
    'Seed product used for branch deploy QA and smoke tests.',
    45.99,
    true
  )
  on conflict (slug) do update
    set title = excluded.title,
        artist = excluded.artist,
        format = excluded.format,
        description = excluded.description,
        price = excluded.price,
        active = true,
        updated_at = now()
  returning id
),
variant_upsert as (
  insert into public.variants (product_id, name, sku, price, format, attributes, weight_grams)
  select id,
         'Standard Edition',
         'SHADOWMOON-DARK-RITUALS-STD',
         45.99,
         'vinyl',
         jsonb_build_object('limited', false),
         350
  from product_upsert
  on conflict (sku) do update
    set product_id = excluded.product_id,
        price = excluded.price,
        format = excluded.format,
        attributes = excluded.attributes,
        updated_at = now()
  returning id
)
insert into public.inventory (variant_id, on_hand, allocated, reorder_point, reorder_quantity)
select id, 25, 0, 5, 10
from variant_upsert
on conflict (variant_id) do update
  set on_hand = excluded.on_hand,
      allocated = excluded.allocated,
      updated_at = now();
```

## 5. Verification Checklist

1. `select slug, active from products where slug = 'test-vinyl-dark-rituals';`
2. `select sku, price from variants where sku = 'SHADOWMOON-DARK-RITUALS-STD';`
3. `select variant_id, on_hand, available from inventory where variant_id in (select id from variants where sku = 'SHADOWMOON-DARK-RITUALS-STD');`
4. `select role from user_roles where user_id = (select id from auth.users where email = 'arg@obsidianriterecords.com');`

If all four queries return rows, the storefront and admin flows should pass the branch deploy smoke tests.

## 6. Troubleshooting

- **`products_select_active` missing** → rerun the policy block above, then redeploy the branch.
- **`/products/{slug}` returns 500** → confirm `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist on the deploy, then double-check the seed.
- **Admin Save fails silently** → RLS is rejecting the insert. Ensure the admin has a role in `user_roles` (and legacy `admin_users` if your policies still reference it).
- **Shipping quotes empty** → expected without AusPost envs. Stripe static rates still allow checkout; note `configured:false` in logs.

Keep this document updated whenever the schema or QA seed expectations change.
