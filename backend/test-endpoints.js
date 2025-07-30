const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function testEndpoint(name, method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    
    if (response.data.success !== false) {
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
      testResults.passed++;
      testResults.tests.push({ name, status: 'passed', endpoint });
    } else {
      console.log(`${colors.red}❌ ${name}: ${response.data.message}${colors.reset}`);
      testResults.failed++;
      testResults.tests.push({ name, status: 'failed', endpoint, error: response.data.message });
    }
    
    return response.data;
  } catch (error) {
    console.log(`${colors.red}❌ ${name}: ${error.message}${colors.reset}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', endpoint, error: error.message });
    return null;
  }
}

async function runTests() {
  console.log(`${colors.blue}🧪 Testing Venezia Backend Endpoints...${colors.reset}\n`);
  
  // Test Health
  await testEndpoint('Health Check', 'GET', '/api/health');
  
  // Test Customers
  console.log(`\n${colors.yellow}👥 Customer Endpoints:${colors.reset}`);
  await testEndpoint('Get All Customers', 'GET', '/api/customers');
  const newCustomer = await testEndpoint('Create Customer', 'POST', '/api/customers', {
    name: 'Test Customer',
    phone: '555-9999',
    email: 'test@testing.com'
  });
  
  if (newCustomer && newCustomer.data) {
    await testEndpoint('Get Customer by ID', 'GET', `/api/customers/${newCustomer.data.id}`);
    await testEndpoint('Update Customer', 'PUT', `/api/customers/${newCustomer.data.id}`, {
      name: 'Updated Customer',
      phone: '555-8888'
    });
    await testEndpoint('Delete Customer', 'DELETE', `/api/customers/${newCustomer.data.id}`);
  }
  
  // Test Products
  console.log(`\n${colors.yellow}📦 Product Endpoints:${colors.reset}`);
  await testEndpoint('Get All Products', 'GET', '/api/products');
  await testEndpoint('Get Product Categories', 'GET', '/api/product_categories');
  const newProduct = await testEndpoint('Create Product', 'POST', '/api/products', {
    name: 'Test Ice Cream',
    price: 2500,
    stock: 20,
    category_id: 1
  });
  
  if (newProduct && newProduct.product) {
    await testEndpoint('Update Product', 'PUT', `/api/products/${newProduct.product.id}`, {
      name: 'Updated Ice Cream',
      price: 2800
    });
    await testEndpoint('Delete Product', 'DELETE', `/api/products/${newProduct.product.id}`);
  }
  
  // Test Providers
  console.log(`\n${colors.yellow}🏭 Provider Endpoints:${colors.reset}`);
  await testEndpoint('Get All Providers', 'GET', '/api/providers');
  await testEndpoint('Get Provider Categories', 'GET', '/api/provider_categories');
  const newProvider = await testEndpoint('Create Provider', 'POST', '/api/providers/add', {
    name: 'Test Provider',
    contact_person: 'John Doe',
    phone: '555-7777'
  });
  
  if (newProvider && newProvider.provider) {
    await testEndpoint('Update Provider', 'POST', '/api/providers/edit', {
      id: newProvider.provider.id,
      name: 'Updated Provider',
      phone: '555-6666'
    });
  }
  
  // Test Cash Flow
  console.log(`\n${colors.yellow}💰 Cash Flow Endpoints:${colors.reset}`);
  await testEndpoint('Get Cash Status', 'GET', '/api/cashflow/status');
  await testEndpoint('Get Cash Movements', 'GET', '/api/cashflow');
  await testEndpoint('Add Cash Movement', 'POST', '/api/cashflow/movements', {
    type: 'income',
    amount: 1000,
    description: 'Test income'
  });
  
  // Test Sales
  console.log(`\n${colors.yellow}💳 Sales Endpoints:${colors.reset}`);
  await testEndpoint('Get Recent Sales', 'GET', '/api/sales/recent');
  await testEndpoint('Create Sale', 'POST', '/api/sales', {
    items: [{ product_id: 1, quantity: 2, price: 3500 }],
    customer: { name: 'Test Sale Customer' },
    payment_method: 'cash',
    total: 7000
  });
  
  // Test Analytics
  console.log(`\n${colors.yellow}📊 Analytics Endpoints:${colors.reset}`);
  await testEndpoint('Get Sales Analytics', 'GET', '/api/analytics/sales');
  await testEndpoint('Get Product Analytics', 'GET', '/api/analytics/products');
  await testEndpoint('Get Customer Analytics', 'GET', '/api/analytics/customers');
  
  // Test Other Endpoints
  console.log(`\n${colors.yellow}🏪 Other Endpoints:${colors.reset}`);
  await testEndpoint('Get Stores', 'GET', '/api/stores');
  await testEndpoint('Get Dashboard Overview', 'GET', '/api/dashboard/overview');
  
  // Print Summary
  console.log(`\n${colors.blue}📋 Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`- ${t.name}: ${t.error}`));
  }
}

// Run tests
runTests().catch(console.error);