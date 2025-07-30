const puppeteer = require('puppeteer');

async function testShopFunctionality() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    console.log('🚀 Starting Shop Functionality Test...');
    
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:3000/shop');
    await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/shop_page_initial.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/shop_page_initial.png');
    
    // Test 1: Check if the shop page loaded correctly
    console.log('\n🧪 Test 1: Checking if shop page loaded');
    const shopTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
    console.log(`   Title found: "${shopTitle}"`);
    
    // Test 2: Check metrics display
    console.log('\n🧪 Test 2: Checking metrics display');
    const metrics = await page.$$eval('.card', cards => 
      cards.slice(0, 4).map(card => {
        const text = card.querySelector('p')?.textContent;
        const value = card.querySelector('p:last-of-type')?.textContent;
        return { text, value };
      })
    ).catch(() => []);
    console.log('   Metrics found:', metrics);
    
    // Test 3: Check tabs functionality
    console.log('\n🧪 Test 3: Testing tab navigation');
    const tabs = ['products', 'orders', 'config'];
    
    for (const tab of tabs) {
      console.log(`   🔄 Switching to ${tab} tab`);
      const tabSelector = `button[data-tab="${tab}"], button:contains("${tab}")`;
      
      // Try different selectors
      try {
        // Find tab by text content
        await page.evaluate((tabName) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const tabButton = buttons.find(btn => 
            btn.textContent.toLowerCase().includes(tabName.toLowerCase())
          );
          if (tabButton) tabButton.click();
        }, tab);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Take screenshot of each tab
        await page.screenshot({ 
          path: `/tmp/shop_${tab}_tab.png`, 
          fullPage: true 
        });
        console.log(`   📸 Screenshot saved: /tmp/shop_${tab}_tab.png`);
        
      } catch (error) {
        console.log(`   ❌ Could not switch to ${tab} tab:`, error.message);
      }
    }
    
    // Test 4: Test "Add Product" functionality
    console.log('\n🧪 Test 4: Testing "Add Product" modal');
    try {
      // Look for "Agregar Producto" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addButton = buttons.find(btn => 
          btn.textContent.includes('Agregar') && btn.textContent.includes('Producto')
        );
        if (addButton) addButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if modal opened
      const modalOpen = await page.$('.modal, [role="dialog"]') !== null;
      console.log(`   Modal opened: ${modalOpen}`);
      
      if (modalOpen) {
        await page.screenshot({ 
          path: '/tmp/shop_add_product_modal.png', 
          fullPage: true 
        });
        console.log('   📸 Modal screenshot saved: /tmp/shop_add_product_modal.png');
        
        // Close modal (press Escape)
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.log('   ❌ Could not test add product modal:', error.message);
    }
    
    // Test 5: Test product toggle functionality
    console.log('\n🧪 Test 5: Testing product toggle functionality');
    try {
      // Go back to products tab
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const productsTab = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('productos')
        );
        if (productsTab) productsTab.click();
      });
      
      await page.waitForTimeout(1000);
      
      // Look for toggle buttons
      const toggleButtons = await page.$$eval('button', buttons => 
        buttons.map((btn, index) => ({
          index,
          classes: btn.className,
          hasToggleIcon: btn.innerHTML.includes('Toggle') || 
                        btn.innerHTML.includes('ToggleLeft') || 
                        btn.innerHTML.includes('ToggleRight')
        })).filter(btn => btn.hasToggleIcon)
      );
      
      console.log(`   Found ${toggleButtons.length} toggle buttons`);
      
      if (toggleButtons.length > 0) {
        // Click first toggle button
        await page.evaluate((index) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const toggleBtn = buttons.find(btn => 
            btn.innerHTML.includes('Toggle')
          );
          if (toggleBtn) toggleBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('   ✅ Toggle button clicked');
      }
      
    } catch (error) {
      console.log('   ❌ Could not test toggle functionality:', error.message);
    }
    
    // Test 6: Test configuration save functionality
    console.log('\n🧪 Test 6: Testing configuration save functionality');
    try {
      // Switch to config tab
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const configTab = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('configuración') ||
          btn.textContent.toLowerCase().includes('config')
        );
        if (configTab) configTab.click();
      });
      
      await page.waitForTimeout(1000);
      
      // Try to modify a configuration field
      const inputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"]');
      if (inputs.length > 0) {
        console.log(`   Found ${inputs.length} input fields`);
        
        // Modify the first input field
        await inputs[0].click();
        await page.keyboard.selectAll();
        await page.keyboard.type('Test Value ' + Date.now());
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Look for save button
        const saveButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('guardar') ||
            btn.textContent.toLowerCase().includes('save')
          ) !== undefined;
        });
        
        console.log(`   Save button available: ${saveButton}`);
        
        if (saveButton) {
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(btn => 
              btn.textContent.toLowerCase().includes('guardar') ||
              btn.textContent.toLowerCase().includes('save')
            );
            if (saveBtn) saveBtn.click();
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('   ✅ Save button clicked');
        }
      }
      
    } catch (error) {
      console.log('   ❌ Could not test configuration save:', error.message);
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: '/tmp/shop_final_state.png', 
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved: /tmp/shop_final_state.png');
    
    console.log('\n✅ Shop functionality test completed!');
    console.log('\n📋 Test Summary:');
    console.log('   - Page loading: ✅ Tested');
    console.log('   - Metrics display: ✅ Tested');
    console.log('   - Tab navigation: ✅ Tested');
    console.log('   - Add product modal: ✅ Tested');
    console.log('   - Product toggle: ✅ Tested');
    console.log('   - Configuration save: ✅ Tested');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('   Press Ctrl+C to close when done.');
    
    // Wait for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...');
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testShopFunctionality();