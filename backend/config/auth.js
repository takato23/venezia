// Authentication configuration
module.exports = {
  // Set to true to require authentication for protected endpoints
  // Set to false during development/testing
  REQUIRE_AUTH: false,
  
  // Endpoints that always require authentication regardless of REQUIRE_AUTH setting
  ALWAYS_PROTECTED: [
    '/api/users',
    '/api/auth/change-password',
    '/api/auth/profile'
  ],
  
  // Endpoints that are always public
  ALWAYS_PUBLIC: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/verify'
  ]
};