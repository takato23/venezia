const { runAsync } = require('./database/db');

async function testAlerts() {
  console.log('🧪 Testing alert system...\n');

  try {
    // 1. Create a low stock product
    console.log('1. Creating low stock product...');
    await runAsync(`
      UPDATE products 
      SET current_stock = 8 
      WHERE id = 1
    `);
    console.log('✅ Product stock reduced to 8 units (below threshold of 10)\n');

    // 2. Create an expiring ingredient
    console.log('2. Creating expiring ingredient...');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 5); // 5 days from now
    
    await runAsync(`
      UPDATE ingredients 
      SET expiry_date = ? 
      WHERE id = 1
    `, [expiryDate.toISOString()]);
    console.log('✅ Ingredient set to expire in 5 days\n');

    // 3. Create low cash balance
    console.log('3. Creating low cash balance...');
    await runAsync(`
      INSERT INTO cash_flow (user_id, store_id, type, amount, balance, description)
      VALUES (1, 1, 'expense', 100, 400, 'Test expense to reduce balance')
    `);
    console.log('✅ Cash balance reduced to $400 (below threshold of $500)\n');

    console.log('🎉 Alert test data created successfully!');
    console.log('The alert service should detect these conditions and emit alerts.');
    console.log('\n📊 Expected alerts:');
    console.log('- Stock warning for product with 8 units');
    console.log('- Expiry warning for ingredient expiring in 5 days');
    console.log('- Cash warning for balance of $400');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

testAlerts();