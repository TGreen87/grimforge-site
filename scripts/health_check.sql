-- Database Health Check Script
-- Run this to verify your Grimforge database is properly set up

-- 1. Check table counts
SELECT 'Database Table Counts' as check_type;
SELECT 
    'products' as table_name, 
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END as status
FROM products
UNION ALL
SELECT 'variants', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM variants
UNION ALL
SELECT 'inventory', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM inventory
UNION ALL
SELECT 'customers', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM customers
UNION ALL
SELECT 'orders', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM orders
UNION ALL
SELECT 'order_items', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM order_items
UNION ALL
SELECT 'user_roles', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '⚠' END FROM user_roles
UNION ALL
SELECT 'audit_log', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✓' ELSE 'ℹ' END FROM audit_log;

-- 2. Check admin users
SELECT 'Admin Users Check' as check_type;
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_granted_at,
    '✓' as status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;

-- 3. Check RLS policies are enabled
SELECT 'Row Level Security Status' as check_type;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✓' ELSE '⚠' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'variants', 'inventory', 'orders', 'customers', 'user_roles')
ORDER BY tablename;

-- 4. Check critical functions exist
SELECT 'Critical Functions Check' as check_type;
SELECT 
    proname as function_name,
    '✓' as status
FROM pg_proc 
WHERE proname IN ('decrement_inventory', 'receive_stock', 'is_admin')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Check for low stock items
SELECT 'Inventory Alerts' as check_type;
SELECT 
    p.name as product_name,
    v.name as variant_name,
    i.available,
    i.reorder_point,
    CASE 
        WHEN i.available <= 0 THEN '🔴 OUT OF STOCK'
        WHEN i.available <= i.reorder_point THEN '🟡 LOW STOCK'
        ELSE '✓ OK'
    END as status
FROM products p
JOIN variants v ON p.id = v.product_id
JOIN inventory i ON v.id = i.variant_id
WHERE i.available <= i.reorder_point
ORDER BY i.available ASC;

-- 6. Check recent orders
SELECT 'Recent Orders Check' as check_type;
SELECT 
    order_number,
    status,
    payment_status,
    total,
    created_at,
    CASE 
        WHEN status = 'pending' AND created_at < NOW() - INTERVAL '1 day' THEN '⚠ OLD PENDING'
        WHEN payment_status = 'failed' THEN '🔴 PAYMENT FAILED'
        ELSE '✓ OK'
    END as status
FROM orders 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check webhook events (if any)
SELECT 'Recent Webhook Events' as check_type;
SELECT 
    event_type,
    stripe_event_type,
    created_at,
    CASE 
        WHEN metadata->>'error' IS NOT NULL THEN '🔴 ERROR'
        ELSE '✓ OK'
    END as status
FROM audit_log 
WHERE event_type LIKE '%stripe%' 
OR stripe_event_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 8. Database integrity checks
SELECT 'Data Integrity Check' as check_type;

-- Check for orphaned variants
SELECT 
    'Orphaned Variants' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✓' ELSE '⚠' END as status
FROM variants v
LEFT JOIN products p ON v.product_id = p.id
WHERE p.id IS NULL;

-- Check for variants without inventory
SELECT 
    'Variants Missing Inventory' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✓' ELSE '⚠' END as status
FROM variants v
LEFT JOIN inventory i ON v.id = i.variant_id
WHERE i.variant_id IS NULL;

-- Check for orders without items
SELECT 
    'Orders Without Items' as check_name,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 0 THEN '✓' ELSE '🔴' END as status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.order_id IS NULL;

-- Summary
SELECT 'Health Check Complete' as summary;
SELECT 
    'Run this script regularly to monitor system health' as recommendation,
    'Check ⚠ and 🔴 items for issues that need attention' as note;
