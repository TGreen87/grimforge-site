-- Assistant session logging, events, and upload audit tables
create table if not exists public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  status text not null default 'active',
  title text,
  metadata jsonb not null default '{}'::jsonb,
  last_event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  occurred_at timestamptz not null default now()
);

create index if not exists idx_assistant_session_events_session
  on public.assistant_session_events (session_id, occurred_at desc);

create table if not exists public.assistant_uploads (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name text not null,
  size_bytes bigint not null,
  mime_type text,
  session_id uuid references public.assistant_sessions(id) on delete set null,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

alter table public.assistant_sessions enable row level security;
alter table public.assistant_session_events enable row level security;
alter table public.assistant_uploads enable row level security;

-- updated_at + last_event_at maintenance
create or replace function public.touch_assistant_session()
returns trigger
language plpgsql
as $$
begin
  update public.assistant_sessions
  set
    updated_at = now(),
    last_event_at = now()
  where id = new.session_id;
  return new;
end;$$;

drop trigger if exists assistant_session_events_touch on public.assistant_session_events;
create trigger assistant_session_events_touch
after insert on public.assistant_session_events
for each row execute function public.touch_assistant_session();

-- Maintain updated_at on direct session updates
create or replace function public.touch_assistant_session_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists assistant_sessions_touch on public.assistant_sessions;
create trigger assistant_sessions_touch
before update on public.assistant_sessions
for each row execute function public.touch_assistant_session_updated_at();

-- RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_sessions'
      and policyname = 'Assistant sessions admin read'
  ) then
    create policy "Assistant sessions admin read" on public.assistant_sessions
    for select
    using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_sessions'
      and policyname = 'Assistant sessions admin update'
  ) then
    create policy "Assistant sessions admin update" on public.assistant_sessions
    for update
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_session_events'
      and policyname = 'Assistant session events admin read'
  ) then
    create policy "Assistant session events admin read" on public.assistant_session_events
    for select
    using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assistant_uploads'
      and policyname = 'Assistant uploads admin read'
  ) then
    create policy "Assistant uploads admin read" on public.assistant_uploads
    for select
    using (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

comment on table public.assistant_sessions is 'Conversation sessions for the admin copilot, including metadata and status.';
comment on table public.assistant_session_events is 'Per-session audit events capturing questions, responses, actions, and errors.';
comment on table public.assistant_uploads is 'Audit log of files uploaded through the admin copilot drawer.';
