#!/usr/bin/env node

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5002';

// Lista de endpoints críticos para probar
const ENDPOINTS = [
  // Core APIs
  '/api/health',
  '/api/products',
  '/api/customers',
  '/api/cashflow',
  
  // Production APIs
  '/api/production_batches',
  '/api/recipes',
  '/api/ingredients',
  '/api/users',
  
  // Dashboard APIs
  '/api/sales',
  '/api/sales/today',
  '/api/stock_data',
  '/api/categories',
  '/api/alerts',
  '/api/deliveries',
  '/api/payments/config'
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint}`;
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            success: res.statusCode === 200,
            hasData: !!parsed.data || !!parsed.products || !!parsed.customers || !!parsed.batches,
            error: null
          });
        } catch (e) {
          resolve({
            endpoint,
            status: res.statusCode,
            success: false,
            hasData: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 'ERROR',
        success: false,
        hasData: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        success: false,
        hasData: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('🔍 Probando endpoints de la API...\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Probando ${endpoint}... `);
    
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ OK (${result.status})`);
      passed++;
    } else {
      console.log(`❌ FALLO (${result.status}) - ${result.error || 'Unknown error'}`);
      failed++;
    }
  }
  
  console.log('\n📊 RESUMEN:');
  console.log(`✅ Exitosos: ${passed}`);
  console.log(`❌ Fallaron: ${failed}`);
  console.log(`🔢 Total: ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n🚨 ENDPOINTS CON PROBLEMAS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.endpoint} - ${r.error || 'Status: ' + r.status}`);
    });
  }
  
  console.log('\n📝 Próximos pasos:');
  if (failed === 0) {
    console.log('🎉 ¡Todos los endpoints funcionan! Proceder a probar navegación frontend.');
  } else {
    console.log('🔧 Arreglar los endpoints que fallan antes de probar frontend.');
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint };