-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  category TEXT,
  tags TEXT[],
  images TEXT[],
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  inventory_quantity INTEGER DEFAULT 0,
  options JSONB,
  images TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  location TEXT,
  last_restock_date TIMESTAMPTZ,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  addresses JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT,
  payment_method TEXT,
  stripe_payment_intent_id TEXT UNIQUE,
  shipping_address JSONB,
  billing_address JSONB,
  items JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  user_id UUID,
  user_email TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create inventory management functions
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_quantity INTEGER;
BEGIN
  -- Get current quantity
  SELECT quantity INTO v_current_quantity
  FROM inventory
  WHERE variant_id = p_variant_id
  FOR UPDATE;

  -- Check if sufficient inventory
  IF v_current_quantity IS NULL OR v_current_quantity < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Update inventory
  UPDATE inventory
  SET quantity = quantity - p_quantity,
      reserved_quantity = reserved_quantity + p_quantity
  WHERE variant_id = p_variant_id;

  -- Also update the product_variants table
  UPDATE product_variants
  SET inventory_quantity = inventory_quantity - p_quantity
  WHERE id = p_variant_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION receive_stock(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_location TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update inventory
  UPDATE inventory
  SET quantity = quantity + p_quantity,
      last_restock_date = NOW(),
      location = COALESCE(p_location, location)
  WHERE variant_id = p_variant_id;

  -- Also update the product_variants table
  UPDATE product_variants
  SET inventory_quantity = inventory_quantity + p_quantity
  WHERE id = p_variant_id;

  -- Create audit log
  INSERT INTO audit_logs (action, resource_type, resource_id, metadata)
  VALUES ('inventory.restocked', 'product_variant', p_variant_id::TEXT, 
    jsonb_build_object('quantity', p_quantity, 'location', p_location));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for products and variants
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active product variants" ON product_variants
  FOR SELECT USING (active = true);

-- Public can view inventory (read-only)
CREATE POLICY "Public can view inventory" ON inventory
  FOR SELECT USING (true);

-- Customers can view their own data
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid()::TEXT = customer_id::TEXT);

CREATE POLICY "Customers can view own profile" ON customers
  FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

-- Admin policies (requires auth setup)
-- These will need to be updated once auth is configured
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (true);

CREATE POLICY "Admins can manage product variants" ON product_variants
  FOR ALL USING (true);

CREATE POLICY "Admins can manage inventory" ON inventory
  FOR ALL USING (true);

CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (true);

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (true);

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (true);