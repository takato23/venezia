// Database configuration
// This file allows switching between SQLite and Supabase

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
console.log('🔍 DEBUG: USE_SUPABASE =', USE_SUPABASE, 'process.env.USE_SUPABASE =', process.env.USE_SUPABASE);

// Export the appropriate models based on configuration
const getModels = () => {
  if (USE_SUPABASE) {
    console.log('📊 Using Supabase as database');
    return {
      Customer: require('../models/Customer.supabase'),
      Product: require('../models/Product.supabase'),
      CashFlow: require('../models/CashFlow.supabase'),
      // These models need to be created for Supabase
      // For now, we'll use empty placeholders
      Provider: { 
        getAll: async () => [], 
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({})
      },
      Sale: { 
        create: async () => ({}),
        getAll: async () => []
      },
    };
  } else {
    console.log('📊 Using SQLite as database');
    return {
      Customer: require('../models/Customer'),
      Product: require('../models/Product'),
      CashFlow: require('../models/CashFlow'),
      // Provider: require('../models/Provider'),
      // Sale: require('../models/Sale'),
    };
  }
};

// Lazy load models to avoid importing Supabase when not needed
let _models = null;
const getModelsLazy = () => {
  if (!_models) {
    _models = getModels();
  }
  return _models;
};

// Export database initialization based on configuration
const initializeDatabase = async () => {
  if (USE_SUPABASE) {
    const supabaseConfig = await import('../config/supabase.js');
    const connected = await supabaseConfig.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Supabase');
    }
  } else {
    const { initializeDatabase: initSQLite } = require('../database/schema');
    initSQLite();
  }
};

module.exports = {
  USE_SUPABASE,
  models: getModelsLazy(),
  initializeDatabase
};