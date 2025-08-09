-- Create public 'products' bucket and policies
-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Policies for 'products' bucket
-- Public read access
create policy if not exists "Public can view products"
  on storage.objects for select
  using (bucket_id = 'products');

-- Authenticated users can insert
create policy if not exists "Authenticated can upload products"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

-- Authenticated users can update
create policy if not exists "Authenticated can update products"
  on storage.objects for update
  using (bucket_id = 'products' and auth.role() = 'authenticated');

-- Authenticated users can delete
create policy if not exists "Authenticated can delete products"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.role() = 'authenticated');