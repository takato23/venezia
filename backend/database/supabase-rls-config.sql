-- Supabase Row Level Security (RLS) Configuration
-- This file contains all RLS policies for multi-store operation with role-based access control
-- 
-- User roles: admin (full access), manager (store-level full access), employee (limited store access)
-- Store isolation: Users can only access data from their assigned store(s)
-- Public access: Limited read-only access for public-facing data

-- Enable RLS on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_role',
    (SELECT role FROM profiles WHERE user_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to a store
CREATE OR REPLACE FUNCTION auth.has_store_access(store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins have access to all stores
  IF auth.user_role() = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check if user is assigned to the store
  RETURN EXISTS (
    SELECT 1 FROM user_stores 
    WHERE user_id = auth.uid() 
    AND store_id = has_store_access.store_id
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PROFILES TABLE POLICIES
-- ==========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM profiles WHERE user_id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth.user_role() = 'admin');

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (auth.user_role() = 'admin');

-- ==========================================
-- STORES TABLE POLICIES
-- ==========================================

-- Users can view stores they have access to
CREATE POLICY "Users can view accessible stores" ON stores
  FOR SELECT USING (
    auth.user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM user_stores 
      WHERE user_id = auth.uid() 
      AND store_id = stores.id 
      AND active = true
    )
  );

-- Only admins can create stores
CREATE POLICY "Admins can create stores" ON stores
  FOR INSERT WITH CHECK (auth.user_role() = 'admin');

-- Admins and managers can update their stores
CREATE POLICY "Admins and managers can update stores" ON stores
  FOR UPDATE USING (
    auth.user_role() = 'admin' OR
    (auth.user_role() = 'manager' AND auth.has_store_access(id))
  );

-- Only admins can delete stores
CREATE POLICY "Admins can delete stores" ON stores
  FOR DELETE USING (auth.user_role() = 'admin');

-- ==========================================
-- USER_STORES TABLE POLICIES
-- ==========================================

-- Users can view their own store assignments
CREATE POLICY "Users can view own store assignments" ON user_stores
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.user_role() = 'admin' OR
    (auth.user_role() = 'manager' AND auth.has_store_access(store_id))
  );

-- Only admins can manage store assignments
CREATE POLICY "Admins can manage store assignments" ON user_stores
  FOR ALL USING (auth.user_role() = 'admin');

-- ==========================================
-- PRODUCTS TABLE POLICIES
-- ==========================================

-- Public can view active products (for public catalog)
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true AND is_public = true);

-- Authenticated users can view all products from their stores
CREATE POLICY "Users can view store products" ON products
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (auth.user_role() = 'admin' OR auth.has_store_access(store_id))
  );

-- Managers and admins can create products
CREATE POLICY "Managers can create products" ON products
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- Managers and admins can update products
CREATE POLICY "Managers can update products" ON products
  FOR UPDATE USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- Only admins can delete products
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    auth.user_role() = 'admin' AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- CATEGORIES TABLE POLICIES
-- ==========================================

-- Public can view categories (for navigation)
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Managers and admins can manage categories
CREATE POLICY "Managers can manage categories" ON categories
  FOR ALL USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- CUSTOMERS TABLE POLICIES
-- ==========================================

-- Users can view customers from their stores
CREATE POLICY "Users can view store customers" ON customers
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- All authenticated users can create customers for their stores
CREATE POLICY "Users can create customers" ON customers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.has_store_access(store_id)
  );

-- Users can update customers from their stores
CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE USING (
    auth.has_store_access(store_id)
  );

-- Only managers and admins can delete customers
CREATE POLICY "Managers can delete customers" ON customers
  FOR DELETE USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- SALES TABLE POLICIES
-- ==========================================

-- Users can view sales from their stores
CREATE POLICY "Users can view store sales" ON sales
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- All authenticated users can create sales for their stores
CREATE POLICY "Users can create sales" ON sales
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.has_store_access(store_id) AND
    user_id = auth.uid()
  );

-- Only the sale creator, managers, and admins can update sales
CREATE POLICY "Users can update own sales" ON sales
  FOR UPDATE USING (
    auth.has_store_access(store_id) AND
    (user_id = auth.uid() OR auth.user_role() IN ('admin', 'manager'))
  );

-- Only managers and admins can delete sales
CREATE POLICY "Managers can delete sales" ON sales
  FOR DELETE USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- SALE_ITEMS TABLE POLICIES
-- ==========================================

-- Users can view sale items from their store's sales
CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND auth.has_store_access(sales.store_id)
    )
  );

-- Users can manage sale items for sales they have access to
CREATE POLICY "Users can manage sale items" ON sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND auth.has_store_access(sales.store_id)
      AND (sales.user_id = auth.uid() OR auth.user_role() IN ('admin', 'manager'))
    )
  );

-- ==========================================
-- INGREDIENTS TABLE POLICIES
-- ==========================================

-- Users can view ingredients from their stores
CREATE POLICY "Users can view store ingredients" ON ingredients
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- Managers and admins can manage ingredients
CREATE POLICY "Managers can manage ingredients" ON ingredients
  FOR ALL USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- RECIPES TABLE POLICIES
-- ==========================================

-- Users can view recipes from their stores
CREATE POLICY "Users can view store recipes" ON recipes
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- Managers and admins can manage recipes
CREATE POLICY "Managers can manage recipes" ON recipes
  FOR ALL USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- RECIPE_INGREDIENTS TABLE POLICIES
-- ==========================================

-- Users can view recipe ingredients for recipes they have access to
CREATE POLICY "Users can view recipe ingredients" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND auth.has_store_access(recipes.store_id)
    )
  );

-- Managers and admins can manage recipe ingredients
CREATE POLICY "Managers can manage recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND auth.has_store_access(recipes.store_id)
      AND auth.user_role() IN ('admin', 'manager')
    )
  );

-- ==========================================
-- INVENTORY TABLE POLICIES
-- ==========================================

-- Users can view inventory from their stores
CREATE POLICY "Users can view store inventory" ON inventory
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- All authenticated users can update inventory counts for their stores
CREATE POLICY "Users can update inventory" ON inventory
  FOR UPDATE USING (
    auth.has_store_access(store_id)
  );

-- Managers and admins can fully manage inventory
CREATE POLICY "Managers can manage inventory" ON inventory
  FOR ALL USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- INVENTORY_MOVEMENTS TABLE POLICIES
-- ==========================================

-- Users can view inventory movements from their stores
CREATE POLICY "Users can view inventory movements" ON inventory_movements
  FOR SELECT USING (
    auth.has_store_access(store_id)
  );

-- All authenticated users can create inventory movements for their stores
CREATE POLICY "Users can create inventory movements" ON inventory_movements
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.has_store_access(store_id) AND
    user_id = auth.uid()
  );

-- Only managers and admins can update/delete inventory movements
CREATE POLICY "Managers can manage inventory movements" ON inventory_movements
  FOR UPDATE USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

CREATE POLICY "Managers can delete inventory movements" ON inventory_movements
  FOR DELETE USING (
    auth.user_role() IN ('admin', 'manager') AND
    auth.has_store_access(store_id)
  );

-- ==========================================
-- ADDITIONAL SECURITY MEASURES
-- ==========================================

-- Create indexes for performance on RLS checks
CREATE INDEX IF NOT EXISTS idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);

-- Function to clean up old inactive user-store assignments
CREATE OR REPLACE FUNCTION cleanup_inactive_assignments()
RETURNS void AS $$
BEGIN
  DELETE FROM user_stores 
  WHERE active = false 
  AND updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for clarity
COMMENT ON FUNCTION auth.user_role() IS 'Returns the role of the current user';
COMMENT ON FUNCTION auth.has_store_access(UUID) IS 'Checks if current user has access to specified store';
COMMENT ON FUNCTION cleanup_inactive_assignments() IS 'Removes old inactive user-store assignments';