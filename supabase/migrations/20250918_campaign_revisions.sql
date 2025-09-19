create table if not exists public.campaign_revisions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.campaign_revisions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_revisions'
      and policyname = 'Admins read campaign revisions'
  ) then
    create policy "Admins read campaign revisions" on public.campaign_revisions
    for select
    using (
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
      and tablename = 'campaign_revisions'
      and policyname = 'Admins manage campaign revisions'
  ) then
    create policy "Admins manage campaign revisions" on public.campaign_revisions
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

create or replace function public.log_campaign_revision()
returns trigger
language plpgsql
as $$
begin
  insert into public.campaign_revisions (campaign_id, snapshot, created_by)
  values (old.id, to_jsonb(old), auth.uid());
  return new;
end;
$$;

drop trigger if exists campaign_revision_logging on public.campaigns;
create trigger campaign_revision_logging
before update on public.campaigns
for each row execute function public.log_campaign_revision();
