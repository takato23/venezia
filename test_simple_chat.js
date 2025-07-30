const puppeteer = require('puppeteer');

async function testSimpleChat() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔄 Navegando a Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });
    
    console.log('⏱️ Esperando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Buscar y hacer click en el botón del cerebro
    console.log('🔍 Buscando botón del cerebro...');
    const brainButton = await page.$('.lucide-brain');
    
    if (brainButton) {
      console.log('🧠 Encontré el botón, haciendo click...');
      await brainButton.click();
      console.log('✅ Click realizado');
    }
    
    console.log('⏱️ Esperando modal...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Buscar texto específico del nuevo asistente
    const hasGuidedText = await page.evaluate(() => {
      return document.body.innerText.includes('Asistente Guiado') ||
             document.body.innerText.includes('paso a paso') ||
             document.body.innerText.includes('Guiado');
    });
    
    if (hasGuidedText) {
      console.log('✅ ¡Encontré el nuevo asistente guiado!');
    } else {
      console.log('❌ No veo el asistente guiado nuevo');
    }
    
    // Screenshot
    console.log('📸 Tomando screenshot...');
    await page.screenshot({ 
      path: '/tmp/chat_simple_test.png', 
      fullPage: true 
    });
    
    console.log('✅ Test completado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleChat().catch(console.error);