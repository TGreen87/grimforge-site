-- Seed dashboard revenue goal defaults
insert into public.admin_settings (key, value)
values ('dashboard_revenue_goal', jsonb_build_object('target', 5000, 'period', '30d'))
on conflict (key) do nothing;
