// Migration to add missing columns to existing tables
const { db } = require('../db');

function runMigration() {
  console.log('🔄 Running migration: Add missing columns...');
  
  db.serialize(() => {
    // Add missing columns to ingredients table
    console.log('📝 Updating ingredients table...');
    
    // Add provider_id column
    db.run(`ALTER TABLE ingredients ADD COLUMN provider_id INTEGER REFERENCES providers(id)`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding provider_id:', err);
      }
    });
    
    // Add current_stock column
    db.run(`ALTER TABLE ingredients ADD COLUMN current_stock REAL DEFAULT 0`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding current_stock:', err);
      }
    });
    
    // Update current_stock with quantity values
    db.run(`UPDATE ingredients SET current_stock = quantity WHERE current_stock IS NULL OR current_stock = 0`);
    
    // Add missing columns to sale_items table
    console.log('📝 Updating sale_items table...');
    
    // Rename unit_price to price if needed
    db.all("PRAGMA table_info(sale_items)", (err, columns) => {
      if (!err) {
        const hasPrice = columns.some(col => col.name === 'price');
        const hasUnitPrice = columns.some(col => col.name === 'unit_price');
        
        if (hasUnitPrice && !hasPrice) {
          db.run(`ALTER TABLE sale_items ADD COLUMN price REAL`, (err) => {
            if (!err) {
              db.run(`UPDATE sale_items SET price = unit_price WHERE price IS NULL`);
            }
          });
        }
      }
    });
    
    // Create inventory_transactions table if not exists
    console.log('📝 Creating inventory_transactions table...');
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ingredient_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'purchase', 'usage', 'adjustment', 'production'
        quantity REAL NOT NULL, -- positive for increase, negative for decrease
        reason TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Create production_logs table if not exists
    console.log('📝 Creating production_logs table...');
    db.run(`
      CREATE TABLE IF NOT EXISTS production_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        yield_amount REAL NOT NULL,
        cost REAL NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Add some default provider categories if they don't exist
    console.log('📝 Adding default provider categories...');
    const categories = ['Dairy', 'Fruits', 'Packaging', 'Supplies', 'Other'];
    categories.forEach(cat => {
      db.run(`INSERT OR IGNORE INTO provider_categories (name) VALUES (?)`, [cat]);
    });
    
    // Add default store if none exists
    db.get('SELECT COUNT(*) as count FROM stores', (err, row) => {
      if (!err && row.count === 0) {
        console.log('📝 Adding default store...');
        db.run(`INSERT INTO stores (name, location) VALUES ('Main Store', 'Default Location')`);
      }
    });
    
    console.log('✅ Migration completed!');
  });
}

// Export for use in other scripts
module.exports = { runMigration };

// Run if called directly
if (require.main === module) {
  runMigration();
  
  // Close database after a delay to ensure all operations complete
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
      }
      process.exit(0);
    });
  }, 2000);
}