// Enhanced security configuration for Venezia
const crypto = require('crypto');

// Secure JWT configuration
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('🔴 CRITICAL: JWT_SECRET environment variable is required in production');
  }
  
  if (!secret) {
    console.warn('⚠️  JWT_SECRET not set. Using temporary development secret.');
    console.warn('⚠️  NEVER use this in production!');
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Validate secret strength
  if (secret.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than recommended 32 characters');
  }
  
  return secret;
};

module.exports = {
  // JWT Configuration
  JWT_SECRET: getJWTSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Rate limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Login specific rate limiting
  LOGIN_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later.'
  },
  
  // Password requirements
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialCharacters: false // Ice cream shop - keep it simple but secure
  },
  
  // Session configuration
  SESSION_CONFIG: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 15 // 15 minutes
    }
  },
  
  // CORS configuration
  CORS_CONFIG: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
        : [
            'http://localhost:3000',
            'http://localhost:5173', 
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173'
          ];
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked CORS request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    maxAge: 86400 // 24 hours preflight cache
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': process.env.NODE_ENV === 'production' 
      ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      : "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
  }
};