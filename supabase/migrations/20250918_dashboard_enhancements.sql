-- Dashboard enhancements schema additions

-- Dashboard announcements table stores owner-editable messaging surfaced on the admin dashboard.
create table if not exists public.dashboard_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default true,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_announcements enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'dashboard_announcements'
      and policyname = 'Admins manage dashboard announcements'
  ) then
    create policy "Admins manage dashboard announcements"
      on public.dashboard_announcements
      for all
      using (
        exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'dashboard_announcements'
      and policyname = 'Public read active dashboard announcements'
  ) then
    create policy "Public read active dashboard announcements"
      on public.dashboard_announcements
      for select
      using (is_active = true);
  end if;
end
$$;

insert into public.dashboard_announcements (message, is_active)
select 'Welcome back! Review paid orders and publish new releases when you''re ready.', true
where not exists (select 1 from public.dashboard_announcements);

-- Stock movements ledger (if an earlier migration has not already created it)
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id text not null references public.variants(id) on delete cascade,
  quantity integer not null,
  movement_type text not null check (movement_type in ('receipt', 'sale', 'adjustment', 'return', 'transfer')),
  reference_type text,
  reference_id text,
  notes text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'stock_movements'
      and policyname = 'Admin manage stock movements'
  ) then
    create policy "Admin manage stock movements"
      on public.stock_movements
      for all
      using (
        exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'stock_movements'
      and indexname = 'idx_stock_movements_variant_id'
  ) then
    create index idx_stock_movements_variant_id on public.stock_movements(variant_id);
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'stock_movements'
      and indexname = 'idx_stock_movements_created_at'
  ) then
    create index idx_stock_movements_created_at on public.stock_movements(created_at);
  end if;
end
$$;

-- Orders revenue series (paid vs pending) for dashboard sparklines
create or replace function public.orders_revenue_series(days integer default 30)
returns table(day date, paid_total numeric, pending_total numeric)
language sql
security definer
set search_path = public
as $$
  with params as (
    select greatest(days, 1) as days
  ),
  date_series as (
    select generate_series(
      current_date - ((select days from params) - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select
      date_trunc('day', created_at)::date as day,
      sum(case when payment_status = 'paid' then coalesce(total, 0) else 0 end) as paid_total,
      sum(case when payment_status <> 'paid' then coalesce(total, 0) else 0 end) as pending_total
    from public.orders
    where created_at >= (current_date - ((select days from params) - 1))
    group by 1
  )
  select
    ds.day,
    coalesce(d.paid_total, 0) as paid_total,
    coalesce(d.pending_total, 0) as pending_total
  from date_series ds
  left join daily d on d.day = ds.day
  order by ds.day;
$$;

comment on function public.orders_revenue_series is 'Returns per-day paid and pending revenue totals for the requested trailing window';

-- Inventory low-stock trend: counts variants under threshold across trailing window
create or replace function public.inventory_low_stock_trend(days integer default 14, threshold integer default 5)
returns table(day date, low_stock_count integer)
language sql
security definer
set search_path = public
as $$
  with params as (
    select
      greatest(days, 1) as days,
      greatest(threshold, 0) as threshold
  ),
  date_series as (
    select generate_series(
      current_date - ((select days from params) - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  movement_deltas as (
    select
      variant_id,
      date_trunc('day', created_at)::date as movement_day,
      sum(
        case
          when movement_type in ('receipt', 'return', 'adjustment', 'transfer') then quantity
          when movement_type = 'sale' then -quantity
          else 0
        end
      ) as delta
    from public.stock_movements
    group by 1, 2
  ),
  variant_base as (
    select variant_id, coalesce(available, 0) as current_available
    from public.inventory
  ),
  expanded as (
    select
      vb.variant_id,
      ds.day,
      coalesce(md.delta, 0) as delta
    from variant_base vb
    cross join date_series ds
    left join movement_deltas md
      on md.variant_id = vb.variant_id
     and md.movement_day = ds.day
  ),
  future_adjustments as (
    select
      variant_id,
      day,
      coalesce(
        sum(delta) over (
          partition by variant_id
          order by day desc
          rows between unbounded preceding and 1 preceding
        ),
        0
      ) as future_delta
    from expanded
  )
  select
    fa.day,
    sum(
      case
        when vb.current_available - fa.future_delta <= (select threshold from params) then 1
        else 0
      end
    ) as low_stock_count
  from future_adjustments fa
  join variant_base vb on vb.variant_id = fa.variant_id
  group by fa.day
  order by fa.day;
$$;

comment on function public.inventory_low_stock_trend is 'Returns per-day count of variants with available stock at or below the provided threshold.';

-- Audit logging for order lifecycle (status / payment changes)
create or replace function public.log_order_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_logs (event_type, resource_type, resource_id, changes, metadata, created_at)
    values (
      'order.created',
      'order',
      new.id,
      jsonb_build_object(
        'status', new.status,
        'payment_status', new.payment_status,
        'total', new.total
      ),
      jsonb_build_object('order_number', new.order_number, 'email', new.email),
      now()
    );
  else
    if (new.status is distinct from old.status) then
      insert into public.audit_logs (event_type, resource_type, resource_id, changes, created_at)
      values (
        'order.status_changed',
        'order',
        new.id,
        jsonb_build_object('from', old.status, 'to', new.status),
        now()
      );
    end if;

    if (new.payment_status is distinct from old.payment_status) then
      insert into public.audit_logs (event_type, resource_type, resource_id, changes, created_at)
      values (
        'order.payment_status_changed',
        'order',
        new.id,
        jsonb_build_object('from', old.payment_status, 'to', new.payment_status),
        now()
      );
    end if;

    if (new.notes is distinct from old.notes) then
      insert into public.audit_logs (event_type, resource_type, resource_id, changes, created_at)
      values (
        'order.notes_updated',
        'order',
        new.id,
        jsonb_build_object('notes', new.notes),
        now()
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists order_audit_trigger on public.orders;
create trigger order_audit_trigger
after insert or update on public.orders
for each row execute function public.log_order_audit();
