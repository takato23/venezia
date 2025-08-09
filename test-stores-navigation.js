#!/usr/bin/env node

/**
 * Prueba específica del botón "Ver" en la página de Stores
 * Verifica que la navegación funcione correctamente
 */

const puppeteer = require('puppeteer');

class StoresNavigationTest {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async testStoresNavigation() {
    console.log('🧪 PROBANDO NAVEGACIÓN DEL BOTÓN "VER" EN STORES\n');
    
    try {
      // Lanzar navegador
      this.browser = await puppeteer.launch({ 
        headless: false, // Modo visible para ver la navegación
        slowMo: 500,     // Ralentizar para ver mejor
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });

      console.log('🔍 Navegando a la página de Stores...');
      await this.page.goto('http://localhost:5173/stores', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      // Esperar a que la página cargue
      await this.page.waitForTimeout(3000);

      console.log('📸 Tomando screenshot de la página de Stores...');
      await this.page.screenshot({ 
        path: 'stores-page-before.png',
        fullPage: true 
      });

      // Buscar botones "Ver"
      console.log('🔍 Buscando botones "Ver"...');
      const verButtons = await this.page.$$('button');
      
      let verButtonFound = false;
      for (const button of verButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Ver')) {
          console.log(`✅ Encontrado botón "Ver": ${text.trim()}`);
          
          console.log('🖱️  Haciendo click en el botón "Ver"...');
          await button.click();
          verButtonFound = true;
          
          // Esperar navegación
          await this.page.waitForTimeout(2000);
          
          const currentURL = this.page.url();
          console.log(`📍 URL actual después del click: ${currentURL}`);
          
          if (currentURL.includes('/stores/') && currentURL !== 'http://localhost:5173/stores') {
            console.log('✅ ¡NAVEGACIÓN EXITOSA! El botón "Ver" funciona correctamente');
            console.log(`   Navegó a: ${currentURL}`);
            
            // Tomar screenshot de la página de detalles
            console.log('📸 Tomando screenshot de la página de detalles...');
            await this.page.screenshot({ 
              path: 'store-details-after.png',
              fullPage: true 
            });
            
          } else {
            console.log('❌ ERROR: El botón no navegó correctamente');
            console.log(`   Se esperaba URL como /stores/{id}, pero se obtuvo: ${currentURL}`);
          }
          
          break;
        }
      }

      if (!verButtonFound) {
        console.log('⚠️  No se encontraron botones "Ver" en la página');
        console.log('   Esto puede indicar que no hay tiendas cargadas o problemas de autenticación');
      }

      return verButtonFound;

    } catch (error) {
      console.error('❌ Error durante la prueba:', error.message);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar la prueba
async function runTest() {
  const tester = new StoresNavigationTest();
  
  try {
    const success = await tester.testStoresNavigation();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DE LA PRUEBA:');
    
    if (success) {
      console.log('   🎉 ¡ÉXITO! El botón "Ver" funciona correctamente');
      console.log('   ✅ La navegación a detalles de tienda está operativa');
      console.log('   📸 Screenshots guardados: stores-page-before.png, store-details-after.png');
    } else {
      console.log('   ❌ FALLO: El botón "Ver" no funciona como esperado');
      console.log('   🔧 Revisar la implementación de navegación');
    }
    
    console.log('='.repeat(60));
    
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  runTest();
}

module.exports = StoresNavigationTest;