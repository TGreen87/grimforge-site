create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_settings'
      and policyname = 'Admins manage settings'
  ) then
    create policy "Admins manage settings" on public.admin_settings
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

create or replace function public.touch_admin_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists admin_settings_updated_at on public.admin_settings;
create trigger admin_settings_updated_at
before update on public.admin_settings
for each row execute function public.touch_admin_settings_updated_at();

insert into public.admin_settings (key, value)
values
  ('dashboard_alerts', jsonb_build_object('awaiting_fulfilment_threshold', 3, 'low_stock_threshold', 5)),
  ('slack_webhooks', jsonb_build_object('ops_alert_webhook', null))
on conflict (key) do nothing;
