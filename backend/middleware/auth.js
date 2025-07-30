const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado - Token no proporcionado',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify token using secure configuration
    const decoded = jwt.verify(token, securityConfig.JWT_SECRET);
    
    // Enhanced user data validation
    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token payload');
    }
    
    // Add user to request with additional security context
    req.user = {
      ...decoded,
      authenticated: true,
      authMethod: 'jwt'
    };
    
    next();
  } catch (error) {
    console.warn(`🔒 Auth failed: ${error.message} for IP: ${req.ip}`);
    
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
};

// Middleware to check specific roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token, but adds user if valid token
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, securityConfig.JWT_SECRET);
      
      // Validate token payload
      if (decoded.id && decoded.email) {
        req.user = {
          ...decoded,
          authenticated: true,
          authMethod: 'jwt-optional'
        };
      }
    } catch (error) {
      // Invalid token, but continue without user
      console.warn(`🔒 Optional auth failed: ${error.message} for IP: ${req.ip}`);
    }
  }

  next();
};

module.exports = { authMiddleware, requireRole, optionalAuth };