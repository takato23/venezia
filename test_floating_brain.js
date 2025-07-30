const puppeteer = require('puppeteer');

async function testFloatingBrain() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  
  try {
    const page = await browser.newPage();
    
    // Escuchar logs de consola
    page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('🚀')) {
        console.log('📝 Console:', msg.text());
      }
    });
    
    console.log('🔄 Navegando a home...');
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    console.log('⏱️ Esperando carga...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar si hay botón flotante en la esquina (tanto desktop como mobile)
    const floatingButton = await page.$('.fixed.right-6[class*="bottom-"]') || 
                           await page.$('.fixed.bottom-6.right-6') ||
                           await page.$('.fixed.bottom-24.right-6');
    
    if (floatingButton) {
      console.log('✅ Encontré botón flotante!');
      
      // Hacer click para abrir minimizado
      await floatingButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click en el botón expandir para abrir modal completo
      const expandButton = await page.$('[title="Expandir (Ctrl+Shift+E)"]');
      if (expandButton) {
        console.log('✅ Encontré botón expandir');
        await expandButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('❌ No encontré botón expandir');
        // Buscar cualquier botón con Maximize2
        const maxButton = await page.$('.lucide-maximize2');
        if (maxButton) {
          console.log('✅ Encontré botón maximize2');
          await maxButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Verificar modal expandido
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        console.log('✅ Modal abierto!');
        
        // Buscar texto del modo guiado y botones toggle
        const guidedText = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            hasGuided: bodyText.includes('Asistente Guiado') || bodyText.includes('paso a paso') || bodyText.includes('GUIADO'),
            hasToggle: bodyText.includes('🧙‍♂️ GUIADO') && bodyText.includes('💬 CHAT'),
            hasModeIndicator: bodyText.includes('MODO: GUIADO ACTIVO'),
            fullText: bodyText.substring(0, 1000) // Primer 1000 caracteres para debug
          };
        });
        
        console.log('🔍 Análisis del contenido:');
        console.log(`✅ Asistente guiado: ${guidedText.hasGuided ? 'SÍ' : 'NO'}`);
        console.log(`✅ Botones toggle: ${guidedText.hasToggle ? 'SÍ' : 'NO'}`);
        console.log(`✅ Indicador modo: ${guidedText.hasModeIndicator ? 'SÍ' : 'NO'}`);
        console.log(`📝 Texto inicial: ${guidedText.fullText.substring(0, 200)}...`);
      } else {
        console.log('❌ No se abrió modal');
      }
    } else {
      console.log('❌ No encontré botón flotante');
      
      // Buscar cualquier botón con brain
      const brainElements = await page.$$('.lucide-brain, [title*="VenezIA"], [alt*="brain"]');
      console.log(`🔍 Encontré ${brainElements.length} elementos con cerebro`);
    }
    
    // Screenshot
    await page.screenshot({ path: '/tmp/floating_test.png' });
    console.log('📸 Screenshot guardado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    setTimeout(() => {
      browser.close();
      process.exit(0);
    }, 1000);
  }
}

testFloatingBrain().catch(console.error);