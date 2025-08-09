#!/usr/bin/env node

const http = require('http');

/**
 * Health Check completo de la aplicación
 * Verifica solo los problemas que realmente rompen la navegación
 */
class HealthChecker {
  constructor() {
    this.backend = 'http://localhost:5002';
    this.frontend = 'http://localhost:5173';
    this.results = {
      backend: [],
      frontend: [],
      critical: []
    };
  }

  async checkApplication() {
    console.log('🏥 HEALTH CHECK COMPLETO DE LA APLICACIÓN\n');
    
    await this.checkBackend();
    await this.checkFrontendPages();
    await this.checkCriticalFiles();
    
    this.generateReport();
    
    const totalErrors = this.results.backend.filter(r => !r.success).length +
                       this.results.frontend.filter(r => !r.success).length +
                       this.results.critical.filter(r => !r.success).length;
    
    return totalErrors === 0;
  }

  async checkBackend() {
    console.log('🖥️  Verificando backend...');
    
    const endpoints = [
      '/api/health',
      '/api/products', 
      '/api/customers',
      '/api/production_batches',
      '/api/cashflow'
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(this.backend + endpoint);
      this.results.backend.push({
        name: endpoint,
        success: result.success,
        error: result.error
      });
    }
    
    console.log('✅ Backend verificado\n');
  }

  async checkFrontendPages() {
    console.log('🌐 Verificando páginas críticas...');
    
    const pages = [
      { path: '/', name: 'Dashboard' },
      { path: '/products', name: 'Products' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/production', name: 'Production' },
      { path: '/pos', name: 'POS' }
    ];

    for (const page of pages) {
      const result = await this.testPage(this.frontend + page.path);
      this.results.frontend.push({
        name: `${page.name} (${page.path})`,
        success: result.success,
        error: result.error
      });
    }
    
    console.log('✅ Páginas verificadas\n');
  }

  async checkCriticalFiles() {
    console.log('📄 Verificando archivos críticos...');
    
    const criticalFiles = [
      'src/pages/Products.jsx',
      'src/pages/Dashboard.jsx',
      'src/App.jsx'
    ];

    for (const file of criticalFiles) {
      const result = await this.testFileCompilation(this.frontend + '/' + file);
      this.results.critical.push({
        name: file,
        success: result.success,
        error: result.error
      });
    }
    
    console.log('✅ Archivos críticos verificados\n');
  }

  async testEndpoint(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 5000);

      http.get(url, (res) => {
        clearTimeout(timeout);
        const success = res.statusCode === 200;
        resolve({
          success,
          error: success ? null : `HTTP ${res.statusCode}`
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
    });
  }

  async testPage(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 10000);

      http.get(url, (res) => {
        clearTimeout(timeout);
        const isHtml = res.headers['content-type']?.includes('text/html');
        const success = res.statusCode === 200 && isHtml;
        resolve({
          success,
          error: success ? null : 
            res.statusCode !== 200 ? `HTTP ${res.statusCode}` : 
            'No es HTML'
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
    });
  }

  async testFileCompilation(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 5000);

      http.get(url, (res) => {
        clearTimeout(timeout);
        
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else if (res.statusCode === 500) {
          // Error de compilación
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const errorMatch = data.match(/"message":"([^"]+)"/);
              const errorMsg = errorMatch ? 
                errorMatch[1].replace(/\\n/g, ' ').substring(0, 100) + '...' : 
                'Error de compilación';
              resolve({ success: false, error: errorMsg });
            } catch (e) {
              resolve({ success: false, error: 'Error de compilación' });
            }
          });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
        }
      }).on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
    });
  }

  generateReport() {
    console.log('📊 REPORTE COMPLETO DE SALUD');
    console.log('='.repeat(50));
    
    // Resumen
    const backendOk = this.results.backend.filter(r => r.success).length;
    const backendTotal = this.results.backend.length;
    const frontendOk = this.results.frontend.filter(r => r.success).length;
    const frontendTotal = this.results.frontend.length;
    const criticalOk = this.results.critical.filter(r => r.success).length;
    const criticalTotal = this.results.critical.length;
    
    console.log(`\n📈 RESUMEN GENERAL:`);
    console.log(`   🖥️  Backend: ${backendOk}/${backendTotal} endpoints funcionando`);
    console.log(`   🌐 Frontend: ${frontendOk}/${frontendTotal} páginas funcionando`);
    console.log(`   📄 Archivos: ${criticalOk}/${criticalTotal} archivos compilando`);
    
    // Detalles de errores
    const allResults = [
      ...this.results.backend.map(r => ({...r, category: 'Backend'})),
      ...this.results.frontend.map(r => ({...r, category: 'Frontend'})),
      ...this.results.critical.map(r => ({...r, category: 'Archivo'}))
    ];
    
    const failures = allResults.filter(r => !r.success);
    
    if (failures.length > 0) {
      console.log(`\n🚨 PROBLEMAS ENCONTRADOS:`);
      failures.forEach(failure => {
        console.log(`   ❌ ${failure.category}: ${failure.name}`);
        console.log(`      Error: ${failure.error}`);
      });
    }
    
    // Recomendaciones
    console.log(`\n💡 ESTADO DE LA APLICACIÓN:`);
    if (failures.length === 0) {
      console.log('   🎉 ¡La aplicación está completamente funcional!');
      console.log('   ✅ Todas las páginas cargan correctamente');
      console.log('   ✅ Todos los endpoints responden');
      console.log('   ✅ Todos los archivos compilan sin errores');
      console.log('   🚀 Navegación libre de problemas');
    } else {
      console.log('   ⚠️  Hay problemas que afectan la navegación');
      console.log('   🔧 Corregir los errores mostrados arriba');
      
      if (this.results.backend.some(r => !r.success)) {
        console.log('   🖥️  Verificar que el servidor backend esté corriendo');
      }
      if (this.results.frontend.some(r => !r.success)) {
        console.log('   🌐 Verificar que el servidor de desarrollo esté corriendo');
      }
      if (this.results.critical.some(r => !r.success)) {
        console.log('   📄 Corregir errores de sintaxis en archivos críticos');
      }
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const checker = new HealthChecker();
  checker.checkApplication().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = HealthChecker;