#!/usr/bin/env node

const puppeteer = require('puppeteer');

// Test configuration for key pages
const testPages = [
  { url: 'http://localhost:5173/pos', name: 'POS System', timeout: 15000 },
  { url: 'http://localhost:5173/web-users', name: 'Web Users', timeout: 12000 },
  { url: 'http://localhost:5173/deliveries', name: 'Deliveries', timeout: 12000 }
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
    await new Promise(resolve => setTimeout(resolve, 8000));
    
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
      warnings.slice(0, 2).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.text}`);
      });
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
  console.log('🚀 Starting Key Pages Test (with Rate Limiting Protection)');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    // Test each page with longer delays
    for (const pageConfig of testPages) {
      const result = await testPage(browser, pageConfig);
      results.push(result);
      
      // Long delay between tests to avoid rate limiting
      console.log(`⏳ Waiting 5 seconds before next test to avoid rate limiting...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    
    if (passed === results.length) {
      console.log('\n🎉 ALL KEY PAGES PASSED! No critical console errors found.');
    } else {
      console.log(`\n⚠️  ${failed} page(s) need attention.`);
      
      results.filter(r => !r.success).forEach(result => {
        console.log(`\n📍 ${result.name} ERRORS:`);
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
}

runTests();