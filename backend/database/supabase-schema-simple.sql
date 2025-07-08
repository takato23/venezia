-- First, let's create the basic tables without RLS or complex features
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Product categories table (simple)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (simple)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'unidad',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (simple)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table (simple)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test data
INSERT INTO product_categories (name, description, display_order) VALUES
  ('Helados', 'Helados artesanales', 1),
  ('Postres', 'Postres y dulces', 2),
  ('Bebidas', 'Bebidas frías y calientes', 3);

INSERT INTO stores (name, address, phone, email) VALUES
  ('Venezia Ice Cream', 'Calle Principal 123', '555-0123', 'info@venezia.com');

-- Verify tables were created
SELECT 'product_categories' as table_name, COUNT(*) as row_count FROM product_categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'stores', COUNT(*) FROM stores;