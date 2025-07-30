const { supabase } = require('./config/supabase');

async function seedSupabase() {
  console.log('🌱 Seeding Supabase with initial data...\n');

  try {
    // 1. Check if data already exists
    const { count: categoryCount } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true });

    if (categoryCount > 0) {
      console.log('ℹ️  Database already has data. Skipping seed.');
      return;
    }

    // 2. Insert product categories
    console.log('📦 Creating product categories...');
    const { data: categories, error: catError } = await supabase
      .from('product_categories')
      .insert([
        { name: 'Helados', description: 'Helados artesanales', display_order: 1 },
        { name: 'Postres', description: 'Postres y dulces', display_order: 2 },
        { name: 'Bebidas', description: 'Bebidas frías y calientes', display_order: 3 },
        { name: 'Accesorios', description: 'Conos, vasos y otros', display_order: 4 }
      ])
      .select();

    if (catError) throw catError;
    console.log(`✅ Created ${categories.length} categories`);

    // 3. Insert some products
    console.log('\n🍦 Creating products...');
    const heladosCategory = categories.find(c => c.name === 'Helados');
    
    const { data: products, error: prodError } = await supabase
      .from('products')
      .insert([
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
          current_stock: 8,  // Low stock for testing alerts
          min_stock: 10,
          unit: 'porción'
        }
      ])
      .select();

    if (prodError) throw prodError;
    console.log(`✅ Created ${products.length} products`);

    // 4. Insert some customers
    console.log('\n👥 Creating customers...');
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
    console.log(`✅ Created ${customers.length} customers`);

    // 5. Check if store exists, if not create one
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .limit(1);

    if (!stores || stores.length === 0) {
      console.log('\n🏪 Creating store...');
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: 'Venezia Ice Cream',
          address: 'Calle Principal 123',
          phone: '555-0100',
          email: 'info@venezia.com'
        })
        .select()
        .single();

      if (storeError) throw storeError;
      console.log('✅ Created store:', store.name);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Database summary:');
    
    // Show summary
    const tables = ['product_categories', 'products', 'customers', 'stores'];
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`   ${table}: ${count} records`);
    }

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSupabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedSupabase };