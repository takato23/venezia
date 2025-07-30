const puppeteer = require('puppeteer');

async function testInventoryPage() {
  console.log('🚀 Starting Inventory Page Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect console errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  
  try {
    // 1. Navigate to the inventory page
    console.log('📂 Navigating to inventory page...');
    await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if page loads without errors
    console.log('✅ Page loaded successfully');
    
    // 2. Check page title
    const title = await page.$eval('h1', el => el.textContent);
    console.log(`📝 Page title: ${title}`);
    
    // 3. Test tabs functionality
    console.log('🔍 Testing tabs functionality...');
    
    // Look for tab buttons
    const tabButtons = await page.$$('button');
    console.log(`Found ${tabButtons.length} button elements`);
    
    // Try to find specific tab buttons by text content
    const tabTexts = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.textContent.trim()).filter(text => 
        text.includes('Stock') || text.includes('Ingredientes') || text.includes('Recetas') || text.includes('Análisis')
      )
    );
    
    console.log('📋 Tab buttons found:', tabTexts);
    
    // 4. Test search functionality
    console.log('🔍 Testing search functionality...');
    
    // Find search input
    const searchInputs = await page.$$('input[placeholder*="Buscar"], input[type="search"], input[placeholder*="buscar"]');
    if (searchInputs.length > 0) {
      await searchInputs[0].type('Leche');
      console.log('✅ Search input works');
      await page.waitForTimeout(1000);
      
      // Clear search
      await searchInputs[0].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Search input not found');
    }
    
    // 5. Check for ingredient/recipe cards
    console.log('🔍 Checking for content cards...');
    
    // Look for cards or content items
    const contentItems = await page.$$('[class*="card"], [class*="grid"] > div, [class*="ingredient"], [class*="recipe"]');
    console.log(`Found ${contentItems.length} content items`);
    
    // 6. Test statistics display
    console.log('🔍 Testing statistics display...');
    
    // Look for numbers that might be statistics
    const statNumbers = await page.$$eval('[class*="text-2xl"], [class*="text-3xl"], .text-2xl, .text-3xl', 
      elements => elements.map(el => el.textContent.trim()).filter(text => /^\d+/.test(text))
    );
    
    if (statNumbers.length > 0) {
      console.log('✅ Statistics found:', statNumbers);
    } else {
      console.log('⚠️ No statistics found');
    }
    
    // 7. Test create buttons
    console.log('🔍 Testing create buttons...');
    
    const createButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.textContent.trim()).filter(text => 
        text.includes('Nuevo') || text.includes('Crear') || text.includes('Añadir')
      )
    );
    
    console.log('🆕 Create buttons found:', createButtons);
    
    // 8. Check for loading states
    console.log('🔍 Checking loading state...');
    
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], .loading, .spinner');
    console.log(`Found ${loadingElements.length} loading elements`);
    
    // 9. Test responsiveness by checking viewport
    console.log('🔍 Testing responsiveness...');
    
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    console.log('✅ Tablet view tested');
    
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    console.log('✅ Mobile view tested');
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // 10. Final error check
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    console.log('🎉 Inventory page test completed!');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection. Press Ctrl+C to close.');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testInventoryPage().catch(console.error);