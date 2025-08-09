#!/usr/bin/env node
// Master test runner
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Venezia Ice Cream - Test Suite\n');
console.log('================================\n');

// Check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://localhost:5001/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
};

// Run individual test
const runTest = (testFile, testName) => {
  return new Promise((resolve) => {
    console.log(`\n🏃 Running ${testName}...\n`);
    
    const test = spawn('node', [testFile], {
      cwd: path.dirname(testFile),
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

// Main test runner
async function runAllTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Check if backend is running
  console.log('🔍 Checking backend server...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('⚠️  Backend server not running. Starting server...');
    
    // Start server in background
    const server = spawn('npm', ['run', 'backend:start'], {
      detached: true,
      stdio: 'ignore'
    });
    server.unref();
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const serverReady = await checkServer();
    if (!serverReady) {
      console.error('❌ Failed to start backend server');
      console.log('\nPlease start the backend manually: npm run backend:start');
      process.exit(1);
    }
  } else {
    console.log('✅ Backend server is running\n');
  }
  
  // Define tests
  const tests = [
    {
      file: path.join(__dirname, 'auth.test.js'),
      name: 'Authentication Tests',
      critical: true
    },
    {
      file: path.join(__dirname, 'models.test.js'),
      name: 'Database Model Tests',
      critical: true
    },
    {
      file: path.join(__dirname, 'api.test.js'),
      name: 'API Endpoint Tests',
      critical: false
    },
    {
      file: path.join(__dirname, 'admin_codes.list.test.js'),
      name: 'Admin Codes List & Disable',
      critical: false
    },
    {
      file: path.join(__dirname, 'sales.admin_code.test.js'),
      name: 'Sales + Admin Code',
      critical: false
    }
    ,
    {
      file: path.join(__dirname, 'pos.flow.test.js'),
      name: 'POS Flow (lite)',
      critical: false
    }
  ];
  
  // Run each test
  for (const test of tests) {
    results.total++;
    
    if (!fs.existsSync(test.file)) {
      console.log(`⚠️  Skipping ${test.name} - test file not found`);
      results.skipped++;
      continue;
    }
    
    try {
      const passed = await runTest(test.file, test.name);
      
      if (passed) {
        results.passed++;
        console.log(`\n✅ ${test.name} PASSED\n`);
      } else {
        results.failed++;
        console.log(`\n❌ ${test.name} FAILED\n`);
        
        if (test.critical) {
          console.log('🛑 Critical test failed. Stopping test run.');
          break;
        }
      }
    } catch (error) {
      results.failed++;
      console.error(`\n❌ ${test.name} ERROR: ${error.message}\n`);
    }
  }
  
  // Final summary
  console.log('\n================================');
  console.log('📊 FINAL TEST SUMMARY\n');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log('\n================================\n');
  
  // Configuration summary
  console.log('⚙️  Configuration Status:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Auth Enabled: ${process.env.ENABLE_AUTH === 'true' ? 'YES' : 'NO'}`);
  console.log(`   Database: ${process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'SQLite'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'CONFIGURED' : 'USING DEFAULT'}`);
  
  // Recommendations
  if (results.failed > 0) {
    console.log('\n💡 Recommendations:');
    console.log('   - Check error messages above');
    console.log('   - Ensure database migrations are complete');
    console.log('   - Verify environment variables are set');
    console.log('   - Check if all dependencies are installed');
  } else {
    console.log('\n🎉 All tests passed! System is ready for deployment.');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});