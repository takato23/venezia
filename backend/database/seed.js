const bcrypt = require('bcryptjs');
const { runAsync } = require('./db');

const seedDatabase = async () => {
  console.log('🌱 Seeding database...');

  try {
    // Seed users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await runAsync(`
      INSERT OR IGNORE INTO users (name, email, password, role) 
      VALUES 
        ('Admin', 'admin@venezia.com', ?, 'admin'),
        ('Juan Perez', 'juan@venezia.com', ?, 'cashier'),
        ('Maria Garcia', 'maria@venezia.com', ?, 'cashier')
    `, [hashedPassword, hashedPassword, hashedPassword]);

    // Seed product categories
    await runAsync(`
      INSERT OR IGNORE INTO product_categories (name, description) 
      VALUES 
        ('Helados', 'Helados tradicionales'),
        ('Paletas', 'Paletas de agua y crema'),
        ('Postres', 'Postres helados'),
        ('Bebidas', 'Bebidas frías'),
        ('Accesorios', 'Conos, cucharitas, servilletas')
    `);

    // Seed products
    await runAsync(`
      INSERT OR IGNORE INTO products (name, description, price, stock, current_stock, category_id, context) 
      VALUES 
        ('Chocolate Amargo', 'Helado premium de chocolate 70% cacao', 3500, 25, 25, 1, 'general'),
        ('Vainilla', 'Helado clásico de vainilla con vainilla de Madagascar', 3200, 18, 18, 1, 'general'),
        ('Dulce de Leche', 'Helado artesanal de dulce de leche', 3800, 12, 12, 1, 'general'),
        ('Frutilla', 'Helado de frutilla con trozos de fruta', 3600, 20, 20, 1, 'web'),
        ('Menta Granizada', 'Helado refrescante de menta con chips de chocolate', 3700, 15, 15, 1, 'stock'),
        ('Paleta de Limón', 'Paleta de agua sabor limón', 1800, 50, 50, 2, 'general'),
        ('Paleta de Chocolate', 'Paleta de crema sabor chocolate', 2200, 30, 30, 2, 'general'),
        ('Sundae Especial', 'Copa helada con toppings', 4800, 0, 0, 3, 'pos'),
        ('Milkshake', 'Batido de helado', 4200, 0, 0, 4, 'pos'),
        ('Cono Simple', 'Cono para helado', 200, 100, 100, 5, 'general')
    `);

    // Seed provider categories
    await runAsync(`
      INSERT OR IGNORE INTO provider_categories (name, description) 
      VALUES 
        ('Lácteos', 'Proveedores de productos lácteos'),
        ('Frutas', 'Proveedores de frutas frescas'),
        ('Chocolates', 'Proveedores de chocolates y coberturas'),
        ('Envases', 'Proveedores de envases y empaques'),
        ('Insumos', 'Proveedores de otros insumos')
    `);

    // Seed providers
    await runAsync(`
      INSERT OR IGNORE INTO providers (name, contact_person, phone, email, category_id) 
      VALUES 
        ('Lácteos del Valle', 'Carlos Rodriguez', '555-0101', 'ventas@lacteosdelv.com', 1),
        ('Frutas Frescas SA', 'Ana Martinez', '555-0102', 'pedidos@frutasfrescas.com', 2),
        ('ChocoPremium', 'Luis Garcia', '555-0103', 'contacto@chocopremium.com', 3),
        ('Envases del Sur', 'Maria Lopez', '555-0104', 'ventas@envasesdelsur.com', 4)
    `);

    // Seed stores
    await runAsync(`
      INSERT OR IGNORE INTO stores (name, location, phone, email) 
      VALUES 
        ('Venezia Ice Cream - Centro', 'Av. Principal 123, Centro', '555-1000', 'centro@venezia.com'),
        ('Venezia Ice Cream - Norte', 'Calle Norte 456', '555-2000', 'norte@venezia.com')
    `);

    // Seed customers
    await runAsync(`
      INSERT OR IGNORE INTO customers (name, phone, email, address) 
      VALUES 
        ('Cliente Regular', '555-9001', 'cliente1@email.com', 'Calle 123'),
        ('Maria Cliente', '555-9002', 'maria@email.com', 'Avenida 456'),
        ('Jose Comprador', '555-9003', 'jose@email.com', 'Plaza 789'),
        ('Ana Frecuente', '555-9004', 'ana@email.com', 'Boulevard 321')
    `);

    // Seed ingredients
    await runAsync(`
      INSERT OR IGNORE INTO ingredients (name, quantity, unit, minimum_stock, cost_per_unit, supplier, category) 
      VALUES 
        ('Leche', 45, 'litros', 20, 150, 'Lácteos del Valle', 'Lácteos'),
        ('Crema de leche', 12, 'litros', 8, 450, 'Lácteos del Valle', 'Lácteos'),
        ('Azúcar', 25, 'kg', 10, 80, 'Distribuidora Central', 'Ingredientes básicos'),
        ('Chocolate Negro', 8, 'kg', 5, 1200, 'ChocoPremium', 'Chocolates'),
        ('Vainilla', 0.5, 'litros', 0.2, 3500, 'Especias Gourmet', 'Saborizantes'),
        ('Frutillas', 15, 'kg', 10, 600, 'Frutas Frescas SA', 'Frutas'),
        ('Dulce de Leche', 10, 'kg', 5, 800, 'Dulces Artesanales', 'Dulces')
    `);

    // Initialize cash flow with opening balance
    await runAsync(`
      INSERT OR IGNORE INTO cash_flow (user_id, store_id, type, amount, balance, description) 
      VALUES 
        (1, 1, 'opening', 5000, 5000, 'Apertura de caja inicial')
    `);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedDatabase };