#!/usr/bin/env node
// Script to run database optimizations
const fs = require('fs');
const path = require('path');
const { db } = require('../database/db');

console.log('🚀 Running database optimizations...\n');

// Read optimization SQL
const optimizationSQL = fs.readFileSync(
  path.join(__dirname, '../database/optimizations.sql'),
  'utf8'
);

// Split into individual statements
const statements = optimizationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let completed = 0;
let failed = 0;

// Execute each statement
async function runOptimizations() {
  for (const statement of statements) {
    try {
      if (statement.toUpperCase().includes('ANALYZE') || 
          statement.toUpperCase().includes('VACUUM')) {
        // These need special handling
        console.log(`⚙️  Running: ${statement.substring(0, 50)}...`);
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // Regular statements
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      completed++;
      console.log(`✅ Executed: ${statement.substring(0, 80)}...`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed: ${statement.substring(0, 80)}...`);
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Optimization Results:`);
  console.log(`   ✅ Successful: ${completed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${statements.length}`);
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(failed > 0 ? 1 : 0);
  });
}

// Run optimizations
runOptimizations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});