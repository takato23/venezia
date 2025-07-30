const { authMiddleware } = require('./auth');
const authConfig = require('../config/auth');

// Flexible authentication middleware
const flexibleAuth = (req, res, next) => {
  // If auth is disabled globally and endpoint is not always protected
  if (!authConfig.REQUIRE_AUTH && !isAlwaysProtected(req.path)) {
    // Add a default user for development
    req.user = {
      id: 1,
      email: 'admin@venezia.com',
      name: 'Admin',
      role: 'admin'
    };
    return next();
  }
  
  // Otherwise, use normal auth middleware
  return authMiddleware(req, res, next);
};

// Check if endpoint is always protected
const isAlwaysProtected = (path) => {
  return authConfig.ALWAYS_PROTECTED.some(protectedPath => 
    path.startsWith(protectedPath)
  );
};

module.exports = { flexibleAuth };