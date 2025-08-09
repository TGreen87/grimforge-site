-- Create public 'products' bucket and policies (idempotent)
-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Public read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view products'
  ) THEN
    CREATE POLICY "Public can view products"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');
  END IF;
END $$;

-- Authenticated insert policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can upload products'
  ) THEN
    CREATE POLICY "Authenticated can upload products"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated update policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can update products'
  ) THEN
    CREATE POLICY "Authenticated can update products"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'products' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated delete policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can delete products'
  ) THEN
    CREATE POLICY "Authenticated can delete products"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'products' AND auth.role() = 'authenticated');
  END IF;
END $$;