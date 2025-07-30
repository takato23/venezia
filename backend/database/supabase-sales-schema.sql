-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash',
  sale_type VARCHAR(50) DEFAULT 'regular', -- regular, delivery, online
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries table (for delivery orders)
CREATE TABLE IF NOT EXISTS deliveries (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, in_transit, delivered, cancelled
  estimated_time VARCHAR(100),
  actual_delivery_time TIMESTAMPTZ,
  delivery_person_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_sale_type ON sales(sale_type);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX idx_deliveries_sale_id ON deliveries(sale_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for sales
CREATE POLICY "Users can view all sales" ON sales
  FOR SELECT USING (true);

CREATE POLICY "Users can create sales" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own sales" ON sales
  FOR UPDATE USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Policies for sale_items
CREATE POLICY "Users can view all sale items" ON sale_items
  FOR SELECT USING (true);

CREATE POLICY "Users can create sale items" ON sale_items
  FOR INSERT WITH CHECK (true);

-- Policies for deliveries
CREATE POLICY "Users can view all deliveries" ON deliveries
  FOR SELECT USING (true);

CREATE POLICY "Users can create deliveries" ON deliveries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update deliveries" ON deliveries
  FOR UPDATE USING (true);

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_sales_stats(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  total_sales DECIMAL,
  total_orders BIGINT,
  avg_ticket DECIMAL,
  total_items_sold BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s.total), 0) as total_sales,
    COUNT(DISTINCT s.id) as total_orders,
    CASE 
      WHEN COUNT(DISTINCT s.id) > 0 THEN COALESCE(SUM(s.total), 0) / COUNT(DISTINCT s.id)
      ELSE 0
    END as avg_ticket,
    COALESCE(SUM(si.quantity), 0) as total_items_sold
  FROM sales s
  LEFT JOIN sale_items si ON s.id = si.sale_id
  WHERE s.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND s.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_products(p_days INTEGER DEFAULT 30, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id BIGINT,
  product_name VARCHAR,
  units_sold BIGINT,
  revenue DECIMAL,
  orders_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(si.quantity)::BIGINT as units_sold,
    SUM(si.subtotal) as revenue,
    COUNT(DISTINCT si.sale_id)::BIGINT as orders_count
  FROM sale_items si
  INNER JOIN products p ON si.product_id = p.id
  INNER JOIN sales s ON si.sale_id = s.id
  WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    AND s.status = 'completed'
  GROUP BY p.id, p.name
  ORDER BY units_sold DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;