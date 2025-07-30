const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createOnlineOrdersTable() {
  try {
    // Crear tabla de órdenes online si no existe
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS online_orders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(50) NOT NULL,
          delivery_address TEXT,
          delivery_type VARCHAR(20) NOT NULL DEFAULT 'pickup',
          payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
          items JSONB NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          delivery_fee DECIMAL(10,2) DEFAULT 0,
          total DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          notes TEXT,
          estimated_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status);
        CREATE INDEX IF NOT EXISTS idx_online_orders_created ON online_orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_online_orders_customer_email ON online_orders(customer_email);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('✅ Tabla online_orders creada exitosamente');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createOnlineOrdersTable();
}

module.exports = { createOnlineOrdersTable };