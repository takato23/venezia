#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testSinglePage(url, name) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
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
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 URL: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    if (errors.length === 0) {
      console.log(`✅ ${name}: PASSED - No console errors`);
    } else {
      console.log(`❌ ${name}: FAILED - ${errors.length} error(s) found:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Show warnings (non-critical)
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warning(s):`);
      warnings.slice(0, 3).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.text}`);
      });
    }
    
  } catch (error) {
    console.log(`💥 ${name}: CRASHED - ${error.message}`);
  } finally {
    await page.close();
  }
  
  await browser.close();
}

// Test specific page passed as argument
const url = process.argv[2] || 'http://localhost:5173/deliveries';
const name = process.argv[3] || 'Test Page';

testSinglePage(url, name);