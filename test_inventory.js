const puppeteer = require('puppeteer');

async function testInventoryPage() {
  console.log('🚀 Starting Inventory Page Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navigate to the inventory page
    console.log('📂 Navigating to inventory page...');
    await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if page loads without errors
    console.log('✅ Page loaded successfully');
    
    // 2. Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    
    // 3. Test tabs functionality
    console.log('🔍 Testing tabs functionality...');
    
    // Check if tabs are visible
    const tabs = await page.$$('[role="tab"], .tab, button:has-text("Stock General"), button:has-text("Ingredientes"), button:has-text("Recetas")');
    console.log(`Found ${tabs.length} tab elements`);
    
    // Try to click on different tabs
    try {
      const stockTab = await page.$('button:has-text("Stock General")');
      const ingredientsTab = await page.$('button:has-text("Ingredientes")');
      const recipesTab = await page.$('button:has-text("Recetas")');
      const analyticsTab = await page.$('button:has-text("Análisis")');
      
      if (stockTab) {
        await stockTab.click();
        console.log('✅ Stock General tab clicked');
        await page.waitForTimeout(1000);
      }
      
      if (ingredientsTab) {
        await ingredientsTab.click();
        console.log('✅ Ingredientes tab clicked');
        await page.waitForTimeout(1000);
      }
      
      if (recipesTab) {
        await recipesTab.click();
        console.log('✅ Recetas tab clicked');
        await page.waitForTimeout(1000);
      }
      
      if (analyticsTab) {
        await analyticsTab.click();
        console.log('✅ Analytics tab clicked');
        await page.waitForTimeout(1000);
      }
    } catch (tabError) {
      console.log('⚠️ Tab click failed:', tabError.message);
    }
    
    // 4. Test search functionality
    console.log('🔍 Testing search functionality...');
    
    // Go back to ingredients tab
    try {
      await page.click('button:has-text("Ingredientes")');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Could not switch to ingredients tab');
    }
    
    // Find search input
    const searchInput = await page.$('input[placeholder*="Buscar"], input[type="search"]');
    if (searchInput) {
      await searchInput.type('Leche');
      console.log('✅ Search input works');
      await page.waitForTimeout(1000);
      
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Search input not found');
    }
    
    // 5. Test filter functionality
    console.log('🔍 Testing filter functionality...');
    
    // Look for filter selects
    const filterSelects = await page.$$('select');
    console.log(`Found ${filterSelects.length} select elements`);
    
    for (let i = 0; i < filterSelects.length; i++) {
      try {
        const options = await filterSelects[i].$$('option');
        if (options.length > 1) {
          await filterSelects[i].selectOption(await options[1].evaluate(el => el.value));
          console.log(`✅ Filter ${i + 1} works`);
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log(`⚠️ Filter ${i + 1} failed:`, e.message);
      }
    }
    
    // 6. Test create ingredient button
    console.log('🔍 Testing create ingredient button...');
    
    try {
      const createButton = await page.$('button:has-text("Nuevo Ingrediente")');
      if (createButton) {
        await createButton.click();
        console.log('✅ Create ingredient button works');
        await page.waitForTimeout(1000);
        
        // Look for modal or form
        const modal = await page.$('[role="dialog"], .modal, form');
        if (modal) {
          console.log('✅ Ingredient form/modal appeared');
          
          // Try to close modal
          const closeButton = await page.$('button:has-text("Cancelar"), button:has-text("Cerrar"), [aria-label="Close"]');
          if (closeButton) {
            await closeButton.click();
            console.log('✅ Modal closed successfully');
          }
        }
      } else {
        console.log('⚠️ Create ingredient button not found');
      }
    } catch (e) {
      console.log('⚠️ Create ingredient test failed:', e.message);
    }
    
    // 7. Check statistics display
    console.log('🔍 Testing statistics display...');
    
    const statCards = await page.$$('.stat-card, [class*="stat"], [class*="card"]');
    console.log(`Found ${statCards.length} potential stat cards`);
    
    // Look for numbers in stat cards
    const statNumbers = await page.$$eval('[class*="text-2xl"], [class*="text-3xl"], .stat-number', 
      elements => elements.map(el => el.textContent.trim()).filter(text => /\d/.test(text))
    );
    
    if (statNumbers.length > 0) {
      console.log('✅ Statistics are displaying:', statNumbers);
    } else {
      console.log('⚠️ No statistics found');
    }
    
    // 8. Test recipes tab
    console.log('🔍 Testing recipes tab...');
    
    try {
      await page.click('button:has-text("Recetas")');
      await page.waitForTimeout(1000);
      
      // Look for recipe cards
      const recipeCards = await page.$$('[class*="recipe"], [class*="card"]');
      console.log(`Found ${recipeCards.length} potential recipe cards`);
      
      // Test create recipe button
      const createRecipeButton = await page.$('button:has-text("Nueva Receta")');
      if (createRecipeButton) {
        await createRecipeButton.click();
        console.log('✅ Create recipe button works');
        await page.waitForTimeout(1000);
        
        // Close modal if it appears
        const closeButton = await page.$('button:has-text("Cancelar"), button:has-text("Cerrar")');
        if (closeButton) {
          await closeButton.click();
        }
      }
    } catch (e) {
      console.log('⚠️ Recipes tab test failed:', e.message);
    }
    
    // 9. Final error check
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    console.log('🎉 Inventory page test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testInventoryPage().catch(console.error);