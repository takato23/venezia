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
      Provider: require('../models/Provider.supabase'),
      Sale: require('../models/Sale.supabase'),
      Ingredient: require('../models/Ingredient.supabase'),
      Recipe: require('../models/Recipe.supabase'),
      User: require('../models/User.supabase')
    };
  } else {
    console.log('📊 Using SQLite as database');
    return {
      Customer: require('../models/Customer'),
      Product: require('../models/Product'),
      CashFlow: require('../models/CashFlow'),
      Provider: require('../models/Provider'),
      Sale: require('../models/Sale'),
      Ingredient: require('../models/Ingredient'),
      Recipe: require('../models/Recipe'),
      User: require('../models/User')
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