create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_id text,
  user_id uuid,
  resource_type text,
  resource_id uuid,
  changes jsonb,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create index if not exists idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'Admins manage audit_logs'
  ) then
    create policy "Admins manage audit_logs" on public.audit_logs
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

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'Users view own audit logs'
  ) then
    create policy "Users view own audit logs" on public.audit_logs
    for select
    using (user_id is null or user_id = auth.uid());
  end if;
end
$$;
