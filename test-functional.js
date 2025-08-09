#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function testFunctionality() {
  console.log('🧪 PRUEBAS FUNCIONALES - VENEZIA ICE CREAM');
  console.log('='.repeat(60));

  try {
    // 1. Test Products API
    console.log('\n📦 1. Verificando productos...');
    const products = await axios.get(`${API_URL}/products`);
    console.log(`   ✅ ${products.data.products.length} productos encontrados`);
    console.log(`   • Ejemplo: ${products.data.products[0].name} - $${products.data.products[0].price}`);

    // 2. Test Categories API  
    console.log('\n🏷️  2. Verificando categorías...');
    const categories = await axios.get(`${API_URL}/categories`);
    console.log(`   ✅ ${categories.data.data.length} categorías encontradas`);
    categories.data.data.forEach(cat => {
      console.log(`   • ${cat.name}: ${cat.description}`);
    });

    // 3. Test Customers API
    console.log('\n👥 3. Verificando clientes...');
    const customers = await axios.get(`${API_URL}/customers`);
    console.log(`   ✅ ${customers.data.data.length} clientes registrados`);
    console.log(`   • Ejemplo: ${customers.data.data[0].name} - ${customers.data.data[0].phone}`);

    // 4. Test Sales API
    console.log('\n💰 4. Verificando ventas recientes...');
    const sales = await axios.get(`${API_URL}/sales/recent?limit=5`);
    console.log(`   ✅ ${sales.data.data.length} ventas recientes`);
    if (sales.data.data.length > 0) {
      console.log(`   • Última venta: $${sales.data.data[0].total} - ${sales.data.data[0].customer_name}`);
    }

    // 5. Test Inventory API
    console.log('\n📊 5. Verificando inventario...');
    const inventory = await axios.get(`${API_URL}/inventory`);
    console.log(`   ✅ ${inventory.data.data.length} ingredientes en inventario`);
    if (inventory.data.data.length > 0) {
      console.log(`   • Ejemplo: ${inventory.data.data[0].name} - ${inventory.data.data[0].current_stock} ${inventory.data.data[0].unit}`);
    }

    // 6. Test Cash Flow Status
    console.log('\n💵 6. Verificando estado de caja...');
    const cashflow = await axios.get(`${API_URL}/cashflow/status`);
    console.log(`   ✅ Caja ${cashflow.data.data.isOpen ? 'ABIERTA' : 'CERRADA'}`);
    console.log(`   • Balance: $${cashflow.data.data.balance}`);

    // 7. Test Web Users API
    console.log('\n🌐 7. Verificando usuarios web...');
    const webUsers = await axios.get(`${API_URL}/web_users`);
    console.log(`   ✅ ${webUsers.data.data.length} usuarios web registrados`);

    // 8. Test Providers API
    console.log('\n🚚 8. Verificando proveedores...');
    const providers = await axios.get(`${API_URL}/providers`);
    console.log(`   ✅ ${providers.data.data.length} proveedores registrados`);
    if (providers.data.data.length > 0) {
      console.log(`   • Ejemplo: ${providers.data.data[0].name} - ${providers.data.data[0].phone}`);
    }

    // 9. Test Deliveries API
    console.log('\n📦 9. Verificando entregas...');
    const deliveries = await axios.get(`${API_URL}/deliveries`);
    console.log(`   ✅ ${deliveries.data.data.length} entregas registradas`);

    // 10. Test Transactions API
    console.log('\n📝 10. Verificando transacciones...');
    const transactions = await axios.get(`${API_URL}/transactions`);
    console.log(`   ✅ ${transactions.data.data.length} transacciones registradas`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODAS LAS PRUEBAS PASARON CORRECTAMENTE!');
    console.log('✅ El sistema está funcionando correctamente');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Test creating a sale
async function testCreateSale() {
  console.log('\n\n🛒 PRUEBA DE CREACIÓN DE VENTA');
  console.log('='.repeat(60));

  try {
    // Get products for the sale
    const products = await axios.get(`${API_URL}/products`);
    const product1 = products.data.products[0];
    const product2 = products.data.products[1];

    console.log('\n📝 Creando nueva venta...');
    console.log(`   • Cliente: Cliente de Prueba`);
    console.log(`   • Productos:`);
    console.log(`     - ${product1.name} x2 = $${product1.price * 2}`);
    console.log(`     - ${product2.name} x1 = $${product2.price}`);
    
    const total = (product1.price * 2) + product2.price;
    console.log(`   • Total: $${total}`);

    const saleData = {
      customer_id: 1,
      items: [
        {
          product_id: product1.id,
          quantity: 2,
          price: product1.price,
          subtotal: product1.price * 2
        },
        {
          product_id: product2.id,
          quantity: 1,
          price: product2.price,
          subtotal: product2.price
        }
      ],
      total: total,
      payment_method: 'cash',
      cash_received: total + 1000,
      change: 1000
    };

    const response = await axios.post(`${API_URL}/sales`, saleData);
    
    if (response.data.success) {
      console.log('\n✅ Venta creada exitosamente!');
      console.log(`   • ID de venta: ${response.data.sale.id}`);
      console.log(`   • Total: $${response.data.sale.total}`);
      console.log(`   • Estado: ${response.data.sale.status}`);
    }

  } catch (error) {
    console.error('\n❌ Error creando venta:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run all tests
async function runAllTests() {
  await testFunctionality();
  await testCreateSale();
}

runAllTests();