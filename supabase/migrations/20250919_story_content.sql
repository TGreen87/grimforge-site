-- Story timeline entries
create table if not exists public.story_timeline (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_story_timeline_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists story_timeline_updated_at on public.story_timeline;
create trigger story_timeline_updated_at
before update on public.story_timeline
for each row execute function public.touch_story_timeline_updated_at();

alter table public.story_timeline enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_timeline'
      and policyname = 'Story timeline public read'
  ) then
    create policy "Story timeline public read" on public.story_timeline
    for select
    using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_timeline'
      and policyname = 'Admins manage story timeline'
  ) then
    create policy "Admins manage story timeline" on public.story_timeline
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

-- Story testimonials entries
create table if not exists public.story_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_story_testimonials_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists story_testimonials_updated_at on public.story_testimonials;
create trigger story_testimonials_updated_at
before update on public.story_testimonials
for each row execute function public.touch_story_testimonials_updated_at();

alter table public.story_testimonials enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_testimonials'
      and policyname = 'Story testimonials public read'
  ) then
    create policy "Story testimonials public read" on public.story_testimonials
    for select
    using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_testimonials'
      and policyname = 'Admins manage story testimonials'
  ) then
    create policy "Admins manage story testimonials" on public.story_testimonials
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

-- Newsletter CTA settings (single row)
create table if not exists public.story_newsletter_settings (
  id uuid primary key default gen_random_uuid(),
  heading text not null default 'Join the midnight mailing list',
  subheading text not null default 'Monthly rituals, early access to limited pressings, and subscriber-only codes.',
  cta_label text not null default 'Subscribe',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_story_newsletter_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists story_newsletter_updated_at on public.story_newsletter_settings;
create trigger story_newsletter_updated_at
before update on public.story_newsletter_settings
for each row execute function public.touch_story_newsletter_updated_at();

alter table public.story_newsletter_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_newsletter_settings'
      and policyname = 'Story newsletter public read'
  ) then
    create policy "Story newsletter public read" on public.story_newsletter_settings
    for select
    using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'story_newsletter_settings'
      and policyname = 'Admins manage story newsletter'
  ) then
    create policy "Admins manage story newsletter" on public.story_newsletter_settings
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

insert into public.story_newsletter_settings (heading, subheading, cta_label)
select 'Join the midnight mailing list', 'Monthly rituals, early access to limited pressings, and subscriber-only discount codes delivered straight from the furnace.', 'Subscribe'
where not exists (select 1 from public.story_newsletter_settings);

insert into public.story_timeline (year, title, description, sort_order)
values
  ('2015', 'Ritual Beginnings', 'Obsidian Rite Records forms in a Hobart basement, pressing 50 copies of a demo on recycled wax.', 0),
  ('2017', 'Into the Underground', 'Partnerships across AUS/NZ bring in exclusive cassettes and first press vinyl runs for touring acts.', 1),
  ('2020', 'Global Distribution', 'Warehouse upgrade + Supabase storefront launch enables worldwide fulfilment during lockdowns.', 2),
  ('2024', 'Campaign Era', 'Dynamic campaign hero + analytics stack give artists a spotlight ahead of each ritual release.', 3)
on conflict do nothing;

insert into public.story_testimonials (quote, author, sort_order)
values
  ('The only label that ships faster than the blast beats they promote.', 'Serpent\'s Wake Zine', 0),
  ('Packaging is immaculate, pressings are pristine, and every parcel smells like bonfire smoke.', 'Nocturnal Frequencies', 1),
  ('Obsidian Rite championed our debut when bigger labels wouldn’t return email.', 'Thy Ossuary (NZ)', 2)
on conflict do nothing;
