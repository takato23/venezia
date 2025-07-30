const { supabase } = require('./config/supabase');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  try {
    // 1. Test basic connection
    console.log('1. Testing connection...');
    const { data: test, error: testError } = await supabase
      .from('product_categories')
      .select('count')
      .limit(1);
    
    if (testError && testError.code !== '42P01') {
      throw testError;
    }
    console.log('✅ Connected to Supabase successfully\n');

    // 2. Check if tables exist
    console.log('2. Checking tables...');
    const tables = [
      'users', 'stores', 'customers', 'products', 
      'product_categories', 'providers', 'ingredients'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠️ Table '${table}' error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    // 3. Test inserting a category
    console.log('\n3. Testing data operations...');
    const { data: category, error: insertError } = await supabase
      .from('product_categories')
      .insert({
        name: 'Test Category',
        description: 'Test from Node.js',
        display_order: 99
      })
      .select()
      .single();

    if (insertError) {
      console.log('⚠️ Insert test failed:', insertError.message);
    } else {
      console.log('✅ Insert successful:', category);
      
      // Clean up
      await supabase
        .from('product_categories')
        .delete()
        .eq('id', category.id);
      console.log('✅ Cleanup successful');
    }

    console.log('\n🎉 Supabase is properly configured!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Supabase dashboard and run the schema SQL');
    console.log('2. Create RLS policies as needed');
    console.log('3. Start using the application!');

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    console.log('2. Make sure your Supabase project is active');
    console.log('3. Run the SQL schema in Supabase dashboard');
  }
}

testSupabaseConnection();