-- Assistant action undo tokens and rollback metadata
create table if not exists public.assistant_action_undos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.assistant_sessions(id) on delete set null,
  action_type text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  undone_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_action_undos_expires
  on public.assistant_action_undos (expires_at);

alter table public.assistant_action_undos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_action_undos'
      and policyname = 'Assistant undo admin read'
  ) then
    create policy "Assistant undo admin read" on public.assistant_action_undos
    for select using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_action_undos'
      and policyname = 'Assistant undo admin manage'
  ) then
    create policy "Assistant undo admin manage" on public.assistant_action_undos
    for all
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

comment on table public.assistant_action_undos is 'Undo tokens for high-impact assistant actions, including rollback payloads and expiry.';
