create table if not exists public.dashboard_announcement_history (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid references public.dashboard_announcements(id) on delete cascade,
  message text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.dashboard_announcement_history enable row level security;

insert into public.dashboard_announcement_history (announcement_id, message, created_by)
select id, message, updated_by from public.dashboard_announcements
where is_active = true
on conflict do nothing;
