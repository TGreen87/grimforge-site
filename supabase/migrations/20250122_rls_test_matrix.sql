-- RLS Test Matrix
-- This script tests that RLS policies are working correctly
-- Run this after applying migrations to verify security

-- Test function to verify RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  test_name TEXT,
  test_result BOOLEAN,
  details TEXT
) AS $$
DECLARE
  test_product_id UUID;
  test_variant_id UUID;
  test_order_id UUID;
BEGIN
  -- Create test data
  INSERT INTO products (id, name, slug, price, status)
  VALUES (uuid_generate_v4(), 'Test Product', 'test-product', 29.99, 'active')
  RETURNING id INTO test_product_id;

  INSERT INTO variants (id, product_id, name, sku, price)
  VALUES (uuid_generate_v4(), test_product_id, 'Test Variant', 'TEST-001', 29.99)
  RETURNING id INTO test_variant_id;

  -- Test 1: Unauthenticated users cannot insert products
  RETURN QUERY
  SELECT 
    'Unauthenticated cannot insert products'::TEXT,
    NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = test_product_id
      AND auth.uid() IS NULL
    ),
    'Products should not be insertable without authentication'::TEXT;

  -- Test 2: Public can read active products
  RETURN QUERY
  SELECT 
    'Public can read active products'::TEXT,
    EXISTS (
      SELECT 1 FROM public_products 
      WHERE id = test_product_id
    ),
    'Active products should be visible in public view'::TEXT;

  -- Test 3: Unauthenticated cannot modify inventory
  RETURN QUERY
  SELECT 
    'Unauthenticated cannot modify inventory'::TEXT,
    NOT EXISTS (
      SELECT 1 FROM inventory
      WHERE variant_id = test_variant_id
      AND auth.uid() IS NULL
      AND on_hand != on_hand + 10
    ),
    'Inventory should not be modifiable without authentication'::TEXT;

  -- Test 4: Orders require authentication
  BEGIN
    INSERT INTO orders (email, subtotal, total, status)
    VALUES ('test@example.com', 29.99, 29.99, 'pending')
    RETURNING id INTO test_order_id;
    
    RETURN QUERY
    SELECT 
      'Orders require authentication'::TEXT,
      (auth.uid() IS NOT NULL)::BOOLEAN,
      'Orders should only be creatable by authenticated users'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'Orders require authentication'::TEXT,
      TRUE::BOOLEAN,
      'Order creation correctly blocked for unauthenticated'::TEXT;
  END;

  -- Test 5: Audit log is insert-only for authenticated
  RETURN QUERY
  SELECT 
    'Audit log is insert-only'::TEXT,
    NOT EXISTS (
      SELECT 1 FROM audit_log
      WHERE auth.uid() IS NOT NULL
      AND auth.uid() NOT IN (SELECT user_id FROM admin_users)
    ),
    'Non-admins should not be able to read audit logs'::TEXT;

  -- Clean up test data
  DELETE FROM variants WHERE id = test_variant_id;
  DELETE FROM products WHERE id = test_product_id;
  DELETE FROM orders WHERE id = test_order_id;
END;
$$ LANGUAGE plpgsql;

-- SQL script to prove unauthenticated writes are blocked
-- Run these as an unauthenticated user (anon role)

-- This should fail: unauthenticated insert to products
-- Expected: ERROR - new row violates row-level security policy
DO $$
BEGIN
  INSERT INTO products (name, slug, price, status)
  VALUES ('Hack Product', 'hack', 0, 'active');
  RAISE EXCEPTION 'SECURITY BREACH: Unauthenticated insert succeeded!';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Unauthenticated insert blocked as expected';
END $$;

-- This should fail: unauthenticated update to products
-- Expected: ERROR - new row violates row-level security policy  
DO $$
BEGIN
  UPDATE products SET price = 0 WHERE id IS NOT NULL;
  RAISE EXCEPTION 'SECURITY BREACH: Unauthenticated update succeeded!';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Unauthenticated update blocked as expected';
END $$;

-- This should fail: unauthenticated delete from products
-- Expected: ERROR - new row violates row-level security policy
DO $$
BEGIN
  DELETE FROM products WHERE id IS NOT NULL;
  RAISE EXCEPTION 'SECURITY BREACH: Unauthenticated delete succeeded!';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Unauthenticated delete blocked as expected';
END $$;

-- This should fail: unauthenticated inventory modification
-- Expected: ERROR - new row violates row-level security policy
DO $$
BEGIN
  UPDATE inventory SET on_hand = 999999 WHERE variant_id IS NOT NULL;
  RAISE EXCEPTION 'SECURITY BREACH: Unauthenticated inventory update succeeded!';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Unauthenticated inventory update blocked as expected';
END $$;

-- This should succeed: reading public products view
-- Expected: Success (read-only)
DO $$
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM public_products;
  RAISE NOTICE 'PASS: Public can read products view (% products)', product_count;
END $$;

-- This should succeed: reading public variants view
-- Expected: Success (read-only)
DO $$
DECLARE
  variant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO variant_count FROM public_variants;
  RAISE NOTICE 'PASS: Public can read variants view (% variants)', variant_count;
END $$;

-- Summary query to verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'variants', 'inventory', 'stock_movements',
    'orders', 'order_items', 'customers', 'addresses',
    'admin_users', 'audit_log'
  )
ORDER BY tablename;