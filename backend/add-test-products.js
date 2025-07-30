const { supabase } = require('./config/supabase');

async function addTestProducts() {
  console.log('🍦 Adding test products to Supabase...\n');

  try {
    // Get categories
    const { data: categories } = await supabase
      .from('product_categories')
      .select('*');

    const heladosCategory = categories.find(c => c.name === 'Helados');
    const postresCategory = categories.find(c => c.name === 'Postres');
    const bebidasCategory = categories.find(c => c.name === 'Bebidas');

    // Insert products
    const { data: products, error } = await supabase
      .from('products')
      .insert([
        // Helados
        {
          name: 'Helado de Vainilla',
          description: 'Clásico helado de vainilla con vainilla natural',
          category_id: heladosCategory.id,
          price: 5.50,
          cost: 2.00,
          current_stock: 50,
          min_stock: 10,
          unit: 'porción'
        },
        {
          name: 'Helado de Chocolate',
          description: 'Helado de chocolate belga premium',
          category_id: heladosCategory.id,
          price: 6.00,
          cost: 2.50,
          current_stock: 45,
          min_stock: 10,
          unit: 'porción'
        },
        {
          name: 'Helado de Fresa',
          description: 'Helado de fresa con trozos de fruta natural',
          category_id: heladosCategory.id,
          price: 5.75,
          cost: 2.25,
          current_stock: 8,  // Low stock!
          min_stock: 10,
          unit: 'porción'
        },
        {
          name: 'Helado de Dulce de Leche',
          description: 'Cremoso helado con auténtico dulce de leche argentino',
          category_id: heladosCategory.id,
          price: 6.50,
          cost: 3.00,
          current_stock: 30,
          min_stock: 15,
          unit: 'porción'
        },
        // Postres
        {
          name: 'Tiramisú',
          description: 'Clásico postre italiano con mascarpone y café',
          category_id: postresCategory.id,
          price: 8.00,
          cost: 3.50,
          current_stock: 12,
          min_stock: 5,
          unit: 'porción'
        },
        {
          name: 'Brownie con Helado',
          description: 'Brownie tibio con helado de vainilla y salsa de chocolate',
          category_id: postresCategory.id,
          price: 9.50,
          cost: 4.00,
          current_stock: 20,
          min_stock: 8,
          unit: 'porción'
        },
        // Bebidas
        {
          name: 'Café Espresso',
          description: 'Café espresso italiano',
          category_id: bebidasCategory.id,
          price: 3.00,
          cost: 1.00,
          current_stock: 100,
          min_stock: 20,
          unit: 'taza'
        },
        {
          name: 'Milkshake de Vainilla',
          description: 'Batido cremoso con helado de vainilla',
          category_id: bebidasCategory.id,
          price: 7.00,
          cost: 3.00,
          current_stock: 5,  // Low stock!
          min_stock: 10,
          unit: 'vaso'
        }
      ])
      .select();

    if (error) throw error;

    console.log(`✅ Created ${products.length} products successfully!\n`);

    // Show products with low stock
    const lowStockProducts = products.filter(p => p.current_stock < p.min_stock);
    if (lowStockProducts.length > 0) {
      console.log('⚠️  Products with LOW STOCK:');
      lowStockProducts.forEach(p => {
        console.log(`   - ${p.name}: ${p.current_stock}/${p.min_stock} units`);
      });
    }

    // Add some test customers
    console.log('\n👥 Adding test customers...');
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .insert([
        {
          name: 'María García',
          phone: '555-0101',
          email: 'maria@example.com',
          address: 'Calle Principal 123',
          loyalty_points: 100
        },
        {
          name: 'Juan Pérez',
          phone: '555-0102',
          email: 'juan@example.com',
          address: 'Avenida Central 456',
          loyalty_points: 50
        },
        {
          name: 'Ana López',
          phone: '555-0103',
          email: 'ana@example.com',
          address: 'Plaza Mayor 789',
          loyalty_points: 200
        }
      ])
      .select();

    if (custError) throw custError;
    console.log(`✅ Created ${customers.length} customers successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestProducts();