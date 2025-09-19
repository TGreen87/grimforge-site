-- Add layout and badge/highlight metadata to campaigns for hero variants
alter table public.campaigns
  add column if not exists layout text not null default 'classic';

alter table public.campaigns
  add column if not exists badge_text text;

alter table public.campaigns
  add column if not exists highlight_items text[] default array[]::text[];

-- Backfill existing rows with defaults
update public.campaigns
set layout = coalesce(nullif(layout, ''), 'classic')
where layout is null or layout = '';

update public.campaigns
set highlight_items = coalesce(highlight_items, array[]::text[])
where highlight_items is null;

comment on column public.campaigns.layout is 'Determines storefront hero layout: classic, split, minimal';
comment on column public.campaigns.badge_text is 'Optional badge rendered above the hero title';
comment on column public.campaigns.highlight_items is 'Optional bullet points rendered in hero supporting section';
