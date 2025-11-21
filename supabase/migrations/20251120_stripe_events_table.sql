-- Create a lightweight log of Stripe webhook events for admin health view
create table if not exists stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  type text not null,
  status text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stripe_events_created_at_idx on stripe_events (created_at desc);

-- Minimal RLS: allow service role only (webhook handler uses service client)
alter table stripe_events enable row level security;

create policy "service can log stripe events" on stripe_events
  for insert
  to service_role
  using (true);

create policy "service can read stripe events" on stripe_events
  for select
  to service_role
  using (true);
