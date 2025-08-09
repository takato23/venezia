-- Agregar campos de tienda web a productos existentes
-- Ejecutar en SQLite o adaptar para Supabase

-- Para SQLite:
ALTER TABLE products ADD COLUMN web_enabled BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN web_price REAL;
ALTER TABLE products ADD COLUMN web_description TEXT;
ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN web_image_url TEXT;
ALTER TABLE products ADD COLUMN web_category TEXT;

-- Opcional: Tabla para tracking de pedidos web
CREATE TABLE IF NOT EXISTS online_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_type TEXT DEFAULT 'pickup',
  payment_method TEXT DEFAULT 'cash',
  items TEXT NOT NULL, -- JSON string
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  estimated_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activar algunos productos para la web (ejemplo)
UPDATE products 
SET web_enabled = 1,
    web_price = price,
    web_description = description,
    is_featured = 1
WHERE id IN (1, 2, 3, 4, 5)
LIMIT 5;