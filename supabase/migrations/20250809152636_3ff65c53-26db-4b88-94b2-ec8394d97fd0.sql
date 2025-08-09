-- Create products table for catalog persistence
create table if not exists public.products (
  id text primary key,
  title text not null,
  artist text not null,
  format text not null check (format in ('vinyl','cassette','cd')),
  price numeric(10,2) not null default 0,
  sku text,
  stock integer not null default 0,
  active boolean not null default true,
  image text,
  description text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  limited boolean not null default false,
  pre_order boolean not null default false,
  release_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timestamp update function and trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();

-- Enable Row Level Security
alter table public.products enable row level security;

-- Policies (temporary permissive for write until auth is wired)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can view active products'
  ) THEN
    CREATE POLICY "Public can view active products"
    ON public.products
    FOR SELECT
    USING (active);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can insert products (temporary)'
  ) THEN
    CREATE POLICY "Public can insert products (temporary)"
    ON public.products
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can update products (temporary)'
  ) THEN
    CREATE POLICY "Public can update products (temporary)"
    ON public.products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public can delete products (temporary)'
  ) THEN
    CREATE POLICY "Public can delete products (temporary)"
    ON public.products
    FOR DELETE
    USING (true);
  END IF;
END
$$;

-- Realtime configuration
alter table public.products replica identity full;
DO $$
BEGIN
  -- Add table to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END
$$;

-- Storage policies for 'products' bucket (public read + public upload)
-- Note: bucket must already exist and be public for CDN reads; policies still needed for API access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read product images'
  ) THEN
    CREATE POLICY "Public can read product images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can upload product images (temporary)'
  ) THEN
    CREATE POLICY "Public can upload product images (temporary)"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'products');
  END IF;
END
$$;