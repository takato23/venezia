-- Database optimization queries for SQLite
-- Run these to improve query performance

-- Create indexes for common queries

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Sale items table indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Ingredients table indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_provider_id ON ingredients(provider_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_expiry ON ingredients(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(quantity, minimum_stock);

-- Recipe ingredients table indexes
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Cash flow table indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_created_at ON cash_flow(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_store_id ON cash_flow(store_id);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Inventory transactions table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_ingredient_id ON inventory_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Create views for common queries

-- Daily sales summary view
CREATE VIEW IF NOT EXISTS v_daily_sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_transactions,
  SUM(total) as total_revenue,
  AVG(total) as average_sale,
  COUNT(DISTINCT customer_id) as unique_customers
FROM sales
WHERE status = 'completed'
GROUP BY DATE(created_at);

-- Low stock products view
CREATE VIEW IF NOT EXISTS v_low_stock_products AS
SELECT 
  p.*,
  CASE 
    WHEN p.current_stock = 0 THEN 'out_of_stock'
    WHEN p.current_stock <= p.minimum_stock THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
WHERE p.current_stock <= p.minimum_stock;

-- Product sales performance view
CREATE VIEW IF NOT EXISTS v_product_performance AS
SELECT 
  p.id,
  p.name,
  p.category,
  COUNT(si.id) as times_sold,
  COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
  COALESCE(SUM(si.subtotal), 0) as total_revenue
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id AND s.status = 'completed'
GROUP BY p.id;

-- Ingredient usage view
CREATE VIEW IF NOT EXISTS v_ingredient_usage AS
SELECT 
  i.id,
  i.name,
  i.current_stock,
  i.minimum_stock,
  COUNT(DISTINCT ri.recipe_id) as used_in_recipes,
  CASE 
    WHEN i.current_stock <= i.minimum_stock THEN 'reorder_needed'
    ELSE 'sufficient'
  END as status
FROM ingredients i
LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
GROUP BY i.id;

-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim space and optimize
VACUUM;