-- Row Level Security Policies
-- Deny-by-default approach: explicitly grant permissions

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products policies (public read, admin write)
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Products insertable by admins" 
  ON products FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Products updatable by admins" 
  ON products FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "Products deletable by admins" 
  ON products FOR DELETE 
  USING (is_admin(auth.uid()));

-- Variants policies (public read, admin write)
CREATE POLICY "Variants viewable by everyone" 
  ON variants FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = variants.product_id 
    AND products.status = 'active'
  ));

CREATE POLICY "Variants manageable by admins" 
  ON variants FOR ALL 
  USING (is_admin(auth.uid()));

-- Inventory policies (public read for availability, admin write)
CREATE POLICY "Inventory viewable by everyone" 
  ON inventory FOR SELECT 
  USING (true);

CREATE POLICY "Inventory manageable by admins" 
  ON inventory FOR ALL 
  USING (is_admin(auth.uid()));

-- Stock movements policies (admin only)
CREATE POLICY "Stock movements viewable by admins" 
  ON stock_movements FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Stock movements manageable by admins" 
  ON stock_movements FOR ALL 
  USING (is_admin(auth.uid()));

-- Customers policies (users see own data, admins see all)
CREATE POLICY "Customers view own data" 
  ON customers FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      id IN (SELECT customer_id FROM orders WHERE email = auth.email()) 
      OR is_admin(auth.uid())
    )
  );

CREATE POLICY "Customers update own data" 
  ON customers FOR UPDATE 
  USING (
    id IN (SELECT customer_id FROM orders WHERE email = auth.email())
  );

CREATE POLICY "Customers manageable by admins" 
  ON customers FOR ALL 
  USING (is_admin(auth.uid()));

-- Addresses policies (users manage own, admins see all)
CREATE POLICY "Addresses viewable by owner or admin" 
  ON addresses FOR SELECT 
  USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE id IN (SELECT customer_id FROM orders WHERE email = auth.email())
    ) OR is_admin(auth.uid())
  );

CREATE POLICY "Addresses manageable by owner" 
  ON addresses FOR INSERT 
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers 
      WHERE id IN (SELECT customer_id FROM orders WHERE email = auth.email())
    )
  );

CREATE POLICY "Addresses updatable by owner" 
  ON addresses FOR UPDATE 
  USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE id IN (SELECT customer_id FROM orders WHERE email = auth.email())
    )
  );

CREATE POLICY "Addresses manageable by admins" 
  ON addresses FOR ALL 
  USING (is_admin(auth.uid()));

-- Orders policies (users see own orders, admins see all)
CREATE POLICY "Orders viewable by customer or admin" 
  ON orders FOR SELECT 
  USING (
    email = auth.email() OR is_admin(auth.uid())
  );

CREATE POLICY "Orders insertable by authenticated users" 
  ON orders FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Orders updatable by system or admin" 
  ON orders FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "Orders manageable by admins" 
  ON orders FOR ALL 
  USING (is_admin(auth.uid()));

-- Order items policies (tied to order access)
CREATE POLICY "Order items viewable with order access" 
  ON order_items FOR SELECT 
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE email = auth.email() OR is_admin(auth.uid())
    )
  );

CREATE POLICY "Order items manageable by admins" 
  ON order_items FOR ALL 
  USING (is_admin(auth.uid()));

-- Admin users policies (admins only)
CREATE POLICY "Admin users viewable by admins" 
  ON admin_users FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admin users manageable by super admins" 
  ON admin_users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Audit log policies (admins only, insert allowed by system)
CREATE POLICY "Audit log viewable by admins" 
  ON audit_log FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Audit log insertable by authenticated" 
  ON audit_log FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create public views for unauthenticated read access
CREATE OR REPLACE VIEW public_products AS
SELECT 
  id, name, slug, description, price, images, tags, 
  format, release_date, artist, label, genre, tracklist,
  limited_edition, limited_edition_details, pre_order,
  pre_order_release_date, featured, created_at, updated_at
FROM products
WHERE status = 'active';

CREATE OR REPLACE VIEW public_variants AS
SELECT 
  v.id, v.product_id, v.name, v.sku, v.price, 
  v.compare_at_price, v.format, v.attributes,
  i.available
FROM variants v
LEFT JOIN inventory i ON i.variant_id = v.id
WHERE EXISTS (
  SELECT 1 FROM products p 
  WHERE p.id = v.product_id 
  AND p.status = 'active'
);

-- Grant access to public views
GRANT SELECT ON public_products TO anon;
GRANT SELECT ON public_variants TO anon;