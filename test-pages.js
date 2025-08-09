#!/usr/bin/env node

const puppeteer = require('puppeteer');

// Test configuration
const testPages = [
  { url: 'http://localhost:5173/pos', name: 'POS System', timeout: 10000 },
  { url: 'http://localhost:5173/deliveries', name: 'Deliveries', timeout: 8000 },
  { url: 'http://localhost:5173/inventory', name: 'Inventory/Stock', timeout: 8000 },
  { url: 'http://localhost:5173/transactions', name: 'Transactions', timeout: 8000 },
  { url: 'http://localhost:5173/production', name: 'Production', timeout: 8000 },
  { url: 'http://localhost:5173/customers', name: 'Customers', timeout: 8000 },
  { url: 'http://localhost:5173/providers', name: 'Providers', timeout: 8000 },
  { url: 'http://localhost:5173/web-users', name: 'Web Users', timeout: 8000 }
];

async function testPage(browser, pageConfig) {
  const page = await browser.newPage();
  
  // Collect console messages and errors
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (type === 'error') {
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log(`\n🧪 Testing: ${pageConfig.name}`);
    console.log(`📍 URL: ${pageConfig.url}`);
    
    // Navigate to page
    await page.goto(pageConfig.url, { 
      waitUntil: 'networkidle0', 
      timeout: pageConfig.timeout 
    });
    
    // Wait longer for React and API calls to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // Check for critical elements
    const hasMainContent = await page.$('main, .main, [role="main"], .app-content') !== null;
    const hasErrorBoundary = await page.$('.error-boundary, .error-page') !== null;
    
    // Report results
    if (errors.length === 0) {
      console.log(`✅ ${pageConfig.name}: PASSED - No console errors`);
    } else {
      console.log(`❌ ${pageConfig.name}: FAILED - ${errors.length} error(s) found:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (!hasMainContent && !hasErrorBoundary) {
      console.log(`⚠️  Warning: Page may not have loaded properly (no main content found)`);
    }
    
    // Show warning messages (non-critical)
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warning(s):`);
      warnings.slice(0, 3).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.text}`);
      });
      if (warnings.length > 3) {
        console.log(`   ... and ${warnings.length - 3} more warnings`);
      }
    }
    
    return {
      name: pageConfig.name,
      url: pageConfig.url,
      success: errors.length === 0,
      errors: errors,
      warnings: warnings.length,
      hasMainContent,
      title
    };
    
  } catch (error) {
    console.log(`💥 ${pageConfig.name}: CRASHED - ${error.message}`);
    return {
      name: pageConfig.name,
      url: pageConfig.url,
      success: false,
      errors: [error.message],
      warnings: 0,
      hasMainContent: false,
      title: 'Failed to load'
    };
  } finally {
    await page.close();
  }
}

async function runTests() {
  console.log('🚀 Starting Venezia Ice Cream App Tests');
  console.log('=' .repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    // Test each page
    for (const pageConfig of testPages) {
      const result = await testPage(browser, pageConfig);
      results.push(result);
      
      // Longer delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Summary Report
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
    
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log(`⚠️  Total Warnings: ${totalWarnings}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED PAGES:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.name}: ${result.errors.length} error(s)`);
      });
    }
    
    if (passed === results.length) {
      console.log('\n🎉 ALL TESTS PASSED! No console errors found.');
    } else {
      console.log(`\n⚠️  ${failed} page(s) need attention.`);
    }
    
    // Detailed error report
    if (failed > 0) {
      console.log('\n' + '='.repeat(50));
      console.log('🔍 DETAILED ERROR REPORT');
      console.log('='.repeat(50));
      
      results.filter(r => !r.success).forEach(result => {
        console.log(`\n📍 ${result.name} (${result.url}):`);
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      });
    }
    
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
  } finally {
    await browser.close();
  }
  
  // Exit with proper code
  const exitCode = results.some(r => !r.success) ? 1 : 0;
  process.exit(exitCode);
}

// Check if Puppeteer is available
(async () => {
  try {
    await runTests();
  } catch (error) {
    if (error.message.includes('puppeteer')) {
      console.log('❌ Puppeteer not found. Installing...');
      console.log('Run: npm install puppeteer');
      process.exit(1);
    } else {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    }
  }
})();