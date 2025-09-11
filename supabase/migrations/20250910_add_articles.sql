-- Create articles table for blog/journal content
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  image_url text,
  author text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_published on public.articles(published);
create index if not exists idx_articles_updated_at on public.articles(updated_at desc);

-- Minimal RLS setup: allow read of published articles, admins can manage via service role
alter table public.articles enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'articles' and policyname = 'read_published_articles'
  ) then
    create policy read_published_articles on public.articles for select using (published = true);
  end if;
end $$;

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

