const { supabase } = require('../config/supabase');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const sqlitePath = path.join(__dirname, '..', 'database', 'venezia.db');

async function migrateToSupabase() {
  console.log('🚀 Starting migration from SQLite to Supabase...\n');

  const db = new sqlite3.Database(sqlitePath);
  
  try {
    // 1. Migrate Product Categories
    console.log('📦 Migrating product categories...');
    const categories = await getFromSQLite(db, 'SELECT * FROM product_categories');
    if (categories.length > 0) {
      await migrateTable('product_categories', categories, (row) => ({
        name: row.name,
        description: row.description,
        display_order: row.display_order || 0
      }));
    }

    // 2. Migrate Products
    console.log('🍦 Migrating products...');
    const products = await getFromSQLite(db, 'SELECT * FROM products');
    if (products.length > 0) {
      // First get category mapping
      const categoryMap = await getCategoryMapping();
      
      await migrateTable('products', products, (row) => ({
        name: row.name,
        description: row.description,
        category_id: categoryMap[row.category_id] || null,
        price: parseFloat(row.price),
        cost: row.cost ? parseFloat(row.cost) : null,
        current_stock: row.current_stock || 0,
        min_stock: row.min_stock || 10,
        unit: row.unit || 'unidad',
        active: row.active === 1
      }));
    }

    // 3. Migrate Customers
    console.log('👥 Migrating customers...');
    const customers = await getFromSQLite(db, 'SELECT * FROM customers');
    if (customers.length > 0) {
      await migrateTable('customers', customers, (row) => ({
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        loyalty_points: row.loyalty_points || 0
      }));
    }

    // 4. Migrate Providers
    console.log('🚚 Migrating providers...');
    const providers = await getFromSQLite(db, 'SELECT * FROM providers');
    if (providers.length > 0) {
      await migrateTable('providers', providers, (row) => ({
        name: row.name,
        contact_name: row.contact_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        notes: row.notes,
        active: row.active === 1
      }));
    }

    // 5. Migrate Ingredients
    console.log('🥛 Migrating ingredients...');
    const ingredients = await getFromSQLite(db, 'SELECT * FROM ingredients');
    if (ingredients.length > 0) {
      const providerMap = await getProviderMapping();
      
      await migrateTable('ingredients', ingredients, (row) => ({
        name: row.name,
        unit: row.unit,
        current_stock: parseFloat(row.current_stock || 0),
        min_stock: parseFloat(row.min_stock || 0),
        cost_per_unit: row.cost_per_unit ? parseFloat(row.cost_per_unit) : null,
        provider_id: providerMap[row.provider_id] || null,
        expiry_date: row.expiry_date
      }));
    }

    // 6. Migrate Cash Flow
    console.log('💰 Migrating cash flow...');
    const cashFlow = await getFromSQLite(db, 'SELECT * FROM cash_flow');
    if (cashFlow.length > 0) {
      // Get store ID from Supabase
      const { data: stores } = await supabase.from('stores').select('id').limit(1);
      const storeId = stores?.[0]?.id;
      
      await migrateTable('cash_flow', cashFlow, (row) => ({
        store_id: storeId,
        type: row.type,
        amount: parseFloat(row.amount),
        balance: parseFloat(row.balance),
        description: row.description,
        reference_id: null // Will need to map sales later
      }));
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 Note: User authentication data needs to be migrated separately through Supabase Auth.');
    console.log('📝 Sales data migration requires user mapping and should be done after auth migration.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Helper function to get data from SQLite
function getFromSQLite(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Helper function to migrate a table
async function migrateTable(tableName, data, transformer) {
  try {
    const transformedData = data.map(transformer);
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`Error migrating ${tableName}:`, error);
        throw error;
      }
      
      console.log(`  ✓ Migrated ${Math.min(i + batchSize, transformedData.length)}/${transformedData.length} ${tableName}`);
    }
    
    console.log(`  ✅ ${tableName} migration complete`);
  } catch (error) {
    console.error(`  ❌ Failed to migrate ${tableName}:`, error);
    throw error;
  }
}

// Get category mapping between SQLite IDs and Supabase UUIDs
async function getCategoryMapping() {
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name');
  
  const mapping = {};
  // This is a simple mapping by name - adjust based on your needs
  categories?.forEach(cat => {
    mapping[cat.name] = cat.id;
  });
  
  return mapping;
}

// Get provider mapping
async function getProviderMapping() {
  const { data: providers } = await supabase
    .from('providers')
    .select('id, name');
  
  const mapping = {};
  providers?.forEach(prov => {
    mapping[prov.name] = prov.id;
  });
  
  return mapping;
}

// Run migration if called directly
if (require.main === module) {
  migrateToSupabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateToSupabase };