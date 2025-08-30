-- Sample Data Setup Script
-- This script creates sample products, variants, and inventory for testing
-- Run this after your database migrations are complete

-- Insert sample products
INSERT INTO products (id, name, slug, description, price, images, tags, format, release_date, artist, label, genre, status, featured) VALUES
(
    gen_random_uuid(),
    'Dark Ritual - Limited Edition Vinyl',
    'dark-ritual-limited-vinyl',
    'Limited edition black vinyl pressing of the acclaimed dark ambient album. Only 500 copies pressed.',
    45.99,
    ARRAY['https://f4.bcbits.com/img/a0023259190_16.jpg', 'https://i.ytimg.com/vi/RM08r73R_iY/maxresdefault.jpg'],
    ARRAY['dark ambient', 'limited edition', 'vinyl'],
    'vinyl',
    '2024-10-31',
    'Obsidian Rite',
    'Grimforge Records',
    'Dark Ambient',
    'active',
    true
),
(
    gen_random_uuid(),
    'Shadows of the Past - CD',
    'shadows-past-cd',
    'Haunting melodies and atmospheric soundscapes in pristine CD quality.',
    19.99,
    ARRAY['https://i.ytimg.com/vi/htb3wzBdbr8/maxresdefault.jpg
    ARRAY['atmospheric', 'cd', 'ambient'],
    'cd',
    '2024-09-15',
    'Midnight Echo',
    'Grimforge Records',
    'Atmospheric',
    'active',
    false
),
(
    gen_random_uuid(),
    'Ethereal Visions - Cassette',
    'ethereal-visions-cassette',
    'Nostalgic cassette release with handmade artwork and premium chrome tape.',
    15.99,
    ARRAY['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiyiO-zwuYxfgcJWLcsGT9DJgs2PHCBG-AOYiH1Jhf4bROSB4OCu5Rl7Kh4qbmebVNgrtcG2zIYNW4Q_yipXM5II-By_97QHGonF_j6Y0tus1XDnZP0PO5WftYM1NzBmlfhBsSffSrwARo/s1600/untitled.bmp
    ARRAY['cassette', 'handmade', 'chrome tape'],
    'cassette',
    '2024-11-20',
    'Spectral Winds',
    'Grimforge Records',
    'Experimental',
    'active',
    false
)
ON CONFLICT (slug) DO NOTHING;

-- Get product IDs for variants
DO $$
DECLARE
    dark_ritual_id UUID;
    shadows_id UUID;
    ethereal_id UUID;
    variant_id UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO dark_ritual_id FROM products WHERE slug = 'dark-ritual-limited-vinyl';
    SELECT id INTO shadows_id FROM products WHERE slug = 'shadows-past-cd';
    SELECT id INTO ethereal_id FROM products WHERE slug = 'ethereal-visions-cassette';
    
    -- Insert variants for Dark Ritual Vinyl
    INSERT INTO variants (id, product_id, name, sku, price, format, attributes) VALUES
    (gen_random_uuid(), dark_ritual_id, 'Black Vinyl', 'DR-VINYL-BLACK', 45.99, 'vinyl', '{"color": "black", "weight": "180g"}'),
    (gen_random_uuid(), dark_ritual_id, 'Red Vinyl (Limited)', 'DR-VINYL-RED', 55.99, 'vinyl', '{"color": "red", "weight": "180g", "limited": true}')
    ON CONFLICT (sku) DO NOTHING;
    
    -- Insert variants for Shadows CD
    INSERT INTO variants (id, product_id, name, sku, price, format, attributes) VALUES
    (gen_random_uuid(), shadows_id, 'Standard CD', 'SP-CD-STD', 19.99, 'cd', '{"packaging": "jewel_case"}'),
    (gen_random_uuid(), shadows_id, 'Digipak CD', 'SP-CD-DIGI', 24.99, 'cd', '{"packaging": "digipak"}')
    ON CONFLICT (sku) DO NOTHING;
    
    -- Insert variants for Ethereal Cassette
    INSERT INTO variants (id, product_id, name, sku, price, format, attributes) VALUES
    (gen_random_uuid(), ethereal_id, 'Chrome Cassette', 'EV-CASS-CHROME', 15.99, 'cassette', '{"tape_type": "chrome", "handmade": true}')
    ON CONFLICT (sku) DO NOTHING;
    
    -- Insert inventory for all variants
    INSERT INTO inventory (variant_id, on_hand, allocated, reorder_point, reorder_quantity)
    SELECT 
        v.id,
        CASE 
            WHEN v.attributes->>'limited' = 'true' THEN 25  -- Limited editions have less stock
            WHEN v.format = 'vinyl' THEN 100
            WHEN v.format = 'cd' THEN 200
            WHEN v.format = 'cassette' THEN 50
            ELSE 100
        END as on_hand,
        0 as allocated,
        CASE 
            WHEN v.attributes->>'limited' = 'true' THEN 5
            WHEN v.format = 'vinyl' THEN 20
            WHEN v.format = 'cd' THEN 30
            WHEN v.format = 'cassette' THEN 10
            ELSE 20
        END as reorder_point,
        CASE 
            WHEN v.attributes->>'limited' = 'true' THEN 10
            WHEN v.format = 'vinyl' THEN 50
            WHEN v.format = 'cd' THEN 100
            WHEN v.format = 'cassette' THEN 25
            ELSE 50
        END as reorder_quantity
    FROM variants v
    WHERE NOT EXISTS (
        SELECT 1 FROM inventory i WHERE i.variant_id = v.id
    );
    
    RAISE NOTICE 'Sample products, variants, and inventory created successfully!';
END $$;

-- Create a sample customer
INSERT INTO customers (id, email, first_name, last_name, stripe_customer_id) VALUES
(gen_random_uuid(), 'test.customer@example.com', 'Test', 'Customer', 'cus_test123')
ON CONFLICT (email) DO NOTHING;

-- Create sample addresses
DO $$
DECLARE
    customer_id UUID;
BEGIN
    SELECT id INTO customer_id FROM customers WHERE email = 'test.customer@example.com';
    
    INSERT INTO addresses (customer_id, line1, city, state, postal_code, country, is_default) VALUES
    (customer_id, '123 Test Street', 'Melbourne', 'VIC', '3000', 'AU', true),
    (customer_id, '456 Work Avenue', 'Sydney', 'NSW', '2000', 'AU', false)
    ON CONFLICT DO NOTHING;
END $$;

-- Create a sample order
DO $$
DECLARE
    customer_id UUID;
    order_id UUID;
    variant_id UUID;
    shipping_addr_id UUID;
BEGIN
    SELECT id INTO customer_id FROM customers WHERE email = 'test.customer@example.com';
    SELECT id INTO shipping_addr_id FROM addresses WHERE customer_id = customer_id AND is_default = true;
    SELECT v.id INTO variant_id FROM variants v JOIN products p ON v.product_id = p.id WHERE p.slug = 'dark-ritual-limited-vinyl' LIMIT 1;
    
    -- Create order
    INSERT INTO orders (id, customer_id, email, status, payment_status, subtotal, tax, shipping, total, currency, shipping_address_id)
    VALUES (
        gen_random_uuid(),
        customer_id,
        'test.customer@example.com',
        'paid',
        'paid',
        45.99,
        4.60,
        9.99,
        60.58,
        'AUD',
        shipping_addr_id
    ) RETURNING id INTO order_id;
    
    -- Create order item
    INSERT INTO order_items (order_id, variant_id, product_name, variant_name, quantity, price, total)
    SELECT 
        order_id,
        v.id,
        p.name,
        v.name,
        1,
        v.price,
        v.price
    FROM variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.id = variant_id;
    
    -- Update inventory (simulate sale)
    UPDATE inventory 
    SET allocated = allocated + 1
    WHERE variant_id = variant_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (variant_id, quantity, movement_type, reference_id, reference_type, notes)
    VALUES (variant_id, -1, 'sale', order_id, 'order', 'Sample order - inventory allocated');
    
    RAISE NOTICE 'Sample order created successfully!';
END $$;

-- Create audit log entries
INSERT INTO audit_log (event_type, resource_type, resource_id, metadata) VALUES
('system.setup', 'database', null, '{"action": "sample_data_created", "timestamp": "' || NOW() || '"}'),
('inventory.initialized', 'system', null, '{"products_created": 3, "variants_created": 5, "inventory_records": 5}');

-- Display summary
SELECT 'Sample Data Setup Complete!' as status;

SELECT 'Products Created:' as summary, COUNT(*) as count FROM products WHERE slug IN ('dark-ritual-limited-vinyl', 'shadows-past-cd', 'ethereal-visions-cassette')
UNION ALL
SELECT 'Variants Created:', COUNT(*) FROM variants v JOIN products p ON v.product_id = p.id WHERE p.slug IN ('dark-ritual-limited-vinyl', 'shadows-past-cd', 'ethereal-visions-cassette')
UNION ALL
SELECT 'Inventory Records:', COUNT(*) FROM inventory i JOIN variants v ON i.variant_id = v.id JOIN products p ON v.product_id = p.id WHERE p.slug IN ('dark-ritual-limited-vinyl', 'shadows-past-cd', 'ethereal-visions-cassette')
UNION ALL
SELECT 'Sample Orders:', COUNT(*) FROM orders WHERE email = 'test.customer@example.com';

-- Show what was created
SELECT 
    p.name as product,
    v.name as variant,
    v.sku,
    v.price,
    i.on_hand as stock,
    i.available
FROM products p
JOIN variants v ON p.id = v.product_id
JOIN inventory i ON v.id = i.variant_id
WHERE p.slug IN ('dark-ritual-limited-vinyl', 'shadows-past-cd', 'ethereal-visions-cassette')
ORDER BY p.name, v.name;
