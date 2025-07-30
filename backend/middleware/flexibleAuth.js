const { authMiddleware, optionalAuth } = require('./auth');
const authConfig = require('../config/auth');

// Enhanced flexible authentication middleware
const flexibleAuth = (req, res, next) => {
  const path = req.path;
  
  // Check if endpoint is always protected (critical security)
  if (isAlwaysProtected(path)) {
    if (authConfig.TRANSITION_MODE) {
      console.log(`🛡️  Always protected endpoint: ${path}`);
    }
    return authMiddleware(req, res, next);
  }
  
  // Check if endpoint is always public
  if (isAlwaysPublic(path)) {
    if (authConfig.TRANSITION_MODE) {
      console.log(`🌐 Public endpoint: ${path}`);
    }
    return next();
  }
  
  // Check if endpoint uses optional auth
  if (isOptionalAuth(path)) {
    if (authConfig.TRANSITION_MODE) {
      console.log(`📊 Optional auth endpoint: ${path}`);
    }
    return optionalAuth(req, res, next);
  }
  
  // Apply general auth policy
  if (authConfig.REQUIRE_AUTH) {
    if (authConfig.TRANSITION_MODE) {
      console.log(`🔒 Auth required for: ${path}`);
    }
    return authMiddleware(req, res, next);
  } else {
    // Development mode - add development user with clear indication
    if (authConfig.TRANSITION_MODE) {
      console.log(`🔄 Development mode - bypass auth for: ${path}`);
    }
    
    req.user = {
      ...authConfig.DEVELOPMENT_USER,
      authenticated: false,
      authMethod: 'development-bypass'
    };
    return next();
  }
};

// Check if endpoint is always protected
const isAlwaysProtected = (path) => {
  return authConfig.ALWAYS_PROTECTED.some(protectedPath => 
    path.startsWith(protectedPath)
  );
};

// Check if endpoint is always public
const isAlwaysPublic = (path) => {
  return authConfig.ALWAYS_PUBLIC.some(publicPath => 
    path.startsWith(publicPath)
  );
};

// Check if endpoint uses optional authentication
const isOptionalAuth = (path) => {
  return authConfig.OPTIONAL_AUTH?.some(optionalPath => 
    path.startsWith(optionalPath)
  ) || false;
};

module.exports = { flexibleAuth };