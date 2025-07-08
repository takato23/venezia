const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for backend operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
  console.log('📝 To get these values:');
  console.log('1. Create a project at https://supabase.com');
  console.log('2. Go to Settings > API');
  console.log('3. Copy the Project URL and service_role key (secret)');
  process.exit(1);
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 is "table does not exist"
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection
};