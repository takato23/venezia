const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar conexión
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact' }).limit(1);
    if (error) {
      console.warn('⚠️  Supabase connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.warn('⚠️  Supabase connection error:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection
};