-- Extend admin_settings defaults with last_sent tracking
insert into public.admin_settings (key, value)
values
  (
    'dashboard_alerts',
    jsonb_build_object(
      'awaiting_fulfilment_threshold', 3,
      'low_stock_threshold', 5,
      'enable_dashboard_alerts', true,
      'last_sent', jsonb_build_object('awaiting_fulfilment', null, 'low_stock', null)
    )
  )
on conflict (key) do update
set value = public.admin_settings.value || excluded.value;

insert into public.admin_settings (key, value)
values
  (
    'slack_webhooks',
    jsonb_build_object(
      'ops_alert_webhook', null,
      'enable_ops_alerts', false,
      'last_sent', jsonb_build_object('ops_alert', null)
    )
  )
on conflict (key) do update
set value = public.admin_settings.value || excluded.value;
