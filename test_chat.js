const puppeteer = require('puppeteer');

async function testChat() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar para capturar errores de consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Error de consola:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Error de página:', error.message);
    });
    
    console.log('🔄 Navegando a la aplicación React...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️ Esperando a que cargue la página...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Buscar el botón del cerebro
    console.log('🔍 Buscando el botón del cerebro...');
    const brainButton = await page.$('button[title*="VenezIA"]');
    
    if (!brainButton) {
      console.log('❌ No se encontró el botón del cerebro');
      // Buscar cualquier botón con brain
      const anyBrainButton = await page.$('.lucide-brain');
      if (anyBrainButton) {
        console.log('✅ Encontré el ícono del cerebro, buscando el botón padre...');
        const parentButton = await anyBrainButton.evaluateHandle(el => {
          let parent = el.parentElement;
          while (parent && parent.tagName !== 'BUTTON') {
            parent = parent.parentElement;
          }
          return parent;
        });
        
        if (parentButton) {
          console.log('🧠 Haciendo clic en el botón del cerebro...');
          await parentButton.click();
        }
      }
    } else {
      console.log('🧠 Haciendo clic en el botón del cerebro...');
      await brainButton.click();
    }
    
    console.log('⏱️ Esperando a que se abra el chat...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Buscar el contenido del modal expandido
    console.log('🔍 Buscando el modal del chat...');
    const modal = await page.$('.fixed.inset-0');
    
    if (modal) {
      console.log('✅ Modal encontrado');
      
      // Capturar el HTML del modal
      const modalHTML = await modal.evaluate(el => el.innerHTML);
      console.log('📄 Contenido del modal (primeros 500 chars):');
      console.log(modalHTML.substring(0, 500) + '...');
      
      // Buscar específicamente el texto que debería aparecer
      const hasWizardText = await page.$eval('body', body => 
        body.innerText.includes('🧙‍♂️ VenezIA') || 
        body.innerText.includes('nuevo asistente wizard') ||
        body.innerText.includes('Guiado')
      );
      
      if (hasWizardText) {
        console.log('✅ ¡Encontré el nuevo contenido del wizard!');
      } else {
        console.log('❌ No se encontró el nuevo contenido del wizard');
        
        // Verificar qué título se está mostrando
        const titleElement = await page.$('h3');
        if (titleElement) {
          const titleText = await titleElement.evaluate(el => el.textContent);
          console.log('📋 Título actual:', titleText);
        }
      }
      
      // Buscar botones de toggle usando texto
      const allButtons = await page.$$('button');
      let foundToggleButtons = false;
      
      for (let button of allButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Guiado') || text.includes('Chat')) {
          console.log('✅ Encontré botón de toggle:', text);
          foundToggleButtons = true;
        }
      }
      
      if (!foundToggleButtons) {
        console.log('❌ No se encontraron los botones de toggle');
      }
      
    } else {
      console.log('❌ No se encontró el modal del chat');
    }
    
    // Tomar screenshot
    console.log('📸 Tomando screenshot...');
    await page.screenshot({ 
      path: '/tmp/chat_test.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshot guardado en /tmp/chat_test.png');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await browser.close();
  }
}

testChat().catch(console.error);