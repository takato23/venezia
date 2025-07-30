// Enhanced Authentication configuration for Venezia
module.exports = {
  // 🔄 GRADUAL SECURITY ACTIVATION
  // Set ENABLE_AUTH=true in environment to activate authentication
  // This allows for safe testing and gradual deployment
  REQUIRE_AUTH: process.env.ENABLE_AUTH === 'true' || false,
  
  // 🔍 TRANSITION MODE - Enhanced logging during development
  TRANSITION_MODE: process.env.NODE_ENV === 'development',
  
  // 🛡️ ALWAYS PROTECTED - Critical endpoints that require authentication regardless
  ALWAYS_PROTECTED: [
    '/api/users',
    '/api/auth/change-password',
    '/api/auth/profile',
    '/api/sales', // ✅ Added: Sales data is sensitive
    '/api/inventory', // ✅ Added: Inventory management critical
    '/api/reports', // ✅ Added: Financial reports sensitive
    '/api/settings', // ✅ Added: System settings critical
    '/api/superbot/config' // ✅ Added: AI configuration sensitive
  ],
  
  // 🌐 ALWAYS PUBLIC - Endpoints that remain accessible
  ALWAYS_PUBLIC: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/verify',
    '/api/auth/refresh',
    '/api/public', // ✅ Web shop public endpoints
    '/api/public/products',
    '/api/public/orders',
    '/api/public/config'
  ],
  
  // 📊 OPTIONAL AUTH - Endpoints that benefit from auth but work without
  OPTIONAL_AUTH: [
    '/api/products', // Better experience when authenticated
    '/api/customers' // Can view public info, edit when authenticated
  ],
  
  // 🔄 FALLBACK USER - Safe default during development
  DEVELOPMENT_USER: {
    id: 1,
    email: 'admin@venezia.com',
    name: 'Admin Development',
    role: 'admin',
    branch_access: [1], // Default branch
    permissions: ['read', 'write', 'admin']
  }
};