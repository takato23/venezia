// Unified environment configuration
const path = require('path');
const fs = require('fs');

// Load environment variables based on NODE_ENV
const loadEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  
  // Load base .env file
  const envPath = path.resolve(__dirname, '../../.env');
  const envExamplePath = path.resolve(__dirname, '../../.env.example');
  
  // Check if .env exists, if not create from example
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('⚠️  No .env file found, creating from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
  }
  
  // Load environment-specific file if exists
  const envSpecificPath = path.resolve(__dirname, `../../.env.${env}`);
  if (fs.existsSync(envSpecificPath)) {
    require('dotenv').config({ path: envSpecificPath });
  } else {
    require('dotenv').config({ path: envPath });
  }
  
  // Backend-specific env file (for local overrides)
  const backendEnvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(backendEnvPath)) {
    require('dotenv').config({ path: backendEnvPath });
  }
};

// Load environment on module load
loadEnvironment();

// Configuration object with defaults and validation
const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Server
  PORT: parseInt(process.env.PORT || '5001', 10),
  HOST: process.env.HOST || 'localhost',
  
  // Database
  USE_SUPABASE: process.env.USE_SUPABASE === 'true',
  DATABASE_PATH: process.env.DATABASE_PATH || './database/venezia.db',
  
  // Supabase (only load if USE_SUPABASE is true)
  SUPABASE: {
    URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
  },
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'venezia-session-secret-development-only',
  ENABLE_AUTH: process.env.ENABLE_AUTH === 'true',
  
  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  
  // Email (Optional)
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS
  },
  
  // Payment (Optional)
  MERCADOPAGO: {
    PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,
    ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  
  // API Keys (Optional)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY
};

// Validation function
const validateConfig = () => {
  const errors = [];
  
  // Production validations
  if (config.isProduction) {
    if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (!config.ENABLE_AUTH) {
      console.warn('⚠️  WARNING: Authentication is disabled in production!');
    }
    
    if (config.USE_SUPABASE && (!config.SUPABASE.URL || !config.SUPABASE.ANON_KEY)) {
      errors.push('Supabase configuration is required when USE_SUPABASE is true');
    }
  }
  
  // Database validation
  if (!config.USE_SUPABASE && !fs.existsSync(path.dirname(config.DATABASE_PATH))) {
    console.log('📁 Creating database directory...');
    fs.mkdirSync(path.dirname(config.DATABASE_PATH), { recursive: true });
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    if (config.isProduction) {
      process.exit(1);
    }
  }
};

// Run validation
validateConfig();

// Export configuration
module.exports = config;