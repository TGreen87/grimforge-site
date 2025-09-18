create or replace function public.order_timeline(order_uuid uuid)
returns table(
  event_type text,
  title text,
  occurred_at timestamptz,
  details jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    al.event_type,
    case
      when al.event_type = 'order.status_changed' then concat('Status updated: ', coalesce(al.changes->>'from', '—'), ' → ', coalesce(al.changes->>'to', '—'))
      when al.event_type = 'order.payment_status_changed' then concat('Payment status: ', coalesce(al.changes->>'from', '—'), ' → ', coalesce(al.changes->>'to', '—'))
      when al.event_type = 'order.notes_updated' then 'Notes updated'
      when al.event_type = 'order.created' then 'Order created'
      else coalesce(al.event_type, 'event')
    end as title,
    al.created_at as occurred_at,
    jsonb_build_object(
      'changes', al.changes,
      'metadata', al.metadata,
      'user_id', al.user_id
    ) as details
  from public.audit_logs al
  where al.resource_type = 'order'
    and al.resource_id = order_uuid
  order by al.created_at desc;
$$;
