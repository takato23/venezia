const { supabase } = require('./config/supabase');

async function checkSupabaseData() {
  console.log('📊 Checking Supabase data...\n');

  try {
    // Check all main tables
    const tables = [
      'product_categories',
      'products', 
      'customers',
      'stores',
      'providers',
      'ingredients',
      'sales',
      'cash_flow'
    ];

    for (const table of tables) {
      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        console.log(`❌ Error reading ${table}:`, error.message);
        continue;
      }

      console.log(`\n📋 ${table} (${count} total records):`);
      
      if (data && data.length > 0) {
        data.forEach((record, index) => {
          const preview = Object.entries(record)
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          console.log(`   ${index + 1}. ${preview}...`);
        });
        if (count > 5) {
          console.log(`   ... and ${count - 5} more`);
        }
      } else {
        console.log('   (empty)');
      }
    }

    // Special check for low stock products
    console.log('\n⚠️  Low Stock Products:');
    const { data: lowStock } = await supabase
      .from('products')
      .select('name, current_stock, min_stock')
      .lt('current_stock', 'min_stock')
      .eq('active', true);

    if (lowStock && lowStock.length > 0) {
      lowStock.forEach(product => {
        console.log(`   - ${product.name}: ${product.current_stock}/${product.min_stock} units`);
      });
    } else {
      console.log('   None');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSupabaseData();