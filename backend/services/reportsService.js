const { USE_SUPABASE } = require('../config/database');

// Import the appropriate service based on configuration
const reportService = USE_SUPABASE 
  ? require('./reportsService.supabase')
  : require('./reportsService.sqlite');

module.exports = reportService;