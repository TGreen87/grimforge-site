-- Campaign config table for storefront hero/callouts
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  hero_image_url text,
  background_video_url text,
  cta_primary_label text,
  cta_primary_href text,
  cta_secondary_label text,
  cta_secondary_href text,
  audio_preview_url text,
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create index if not exists idx_campaigns_active_sort on public.campaigns(active desc, sort_order asc, starts_at asc nulls last);

-- Updated timestamp trigger
create or replace function public.touch_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
before update on public.campaigns
for each row execute function public.touch_campaigns_updated_at();

-- RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'Campaigns public read active'
  ) then
    create policy "Campaigns public read active" on public.campaigns
    for select
    using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaigns'
      and policyname = 'Admins manage campaigns'
  ) then
    create policy "Admins manage campaigns" on public.campaigns
    for all
    using (
      exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    )
    with check (
      exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    );
  end if;
end
$$;

-- Ensure at least one placeholder campaign exists
insert into public.campaigns (slug, title, subtitle, description, hero_image_url, active)
select 'dark-rituals-feature', 'Dark Rituals Returns', 'New pressing available now', 'Limited blood-red variant now in stock. Listen and secure your copy before it sells out.', null, true
where not exists (select 1 from public.campaigns);
