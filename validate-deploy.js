#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

const CONFIG = {
  BACKEND_URL: 'http://localhost:5002',
  FRONTEND_URL: 'http://localhost:5173',
  TIMEOUT: 10000,
  CRITICAL_FILES: [
    'package.json',
    'src/App.jsx',
    'backend/server.js',
    'backend/server-new.js',
    'backend/routes/missing-endpoints.js'
  ],
  CRITICAL_ENDPOINTS: [
    '/api/health',
    '/api/products',
    '/api/customers',
    '/api/production_batches',
    '/api/cashflow'
  ],
  CRITICAL_PAGES: [
    '/',
    '/products', 
    '/inventory',
    '/production',
    '/pos'
  ]
};

class DeployValidator {
  constructor() {
    this.results = {
      fileSystem: [],
      backend: [],
      frontend: [],
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  async validate() {
    console.log('🔍 INICIANDO VALIDACIÓN PRE-DEPLOY\n');
    
    await this.validateFileSystem();
    await this.validateBackend();
    await this.validateFrontend();
    
    this.generateReport();
    return this.results.overall.failed === 0;
  }

  // ==================== VALIDACIÓN DE ARCHIVOS ====================
  async validateFileSystem() {
    console.log('📁 Validando sistema de archivos...');
    
    for (const file of CONFIG.CRITICAL_FILES) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      
      this.addResult('fileSystem', {
        test: `Archivo crítico: ${file}`,
        status: exists ? 'PASS' : 'FAIL',
        details: exists ? 'Archivo encontrado' : 'Archivo no encontrado',
        critical: true
      });
    }

    // Verificar estructura de directorios
    const criticalDirs = ['src', 'backend', 'public'];
    for (const dir of criticalDirs) {
      const dirPath = path.join(process.cwd(), dir);
      const exists = fs.existsSync(dirPath);
      
      this.addResult('fileSystem', {
        test: `Directorio: ${dir}`,
        status: exists ? 'PASS' : 'FAIL',
        details: exists ? 'Directorio encontrado' : 'Directorio no encontrado',
        critical: true
      });
    }

    // Verificar package.json y dependencias
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
      
      this.addResult('fileSystem', {
        test: 'Configuración de package.json',
        status: 'PASS',
        details: `Frontend: ${packageJson.name}, Backend: ${backendPackageJson.name}`,
        critical: false
      });
    } catch (error) {
      this.addResult('fileSystem', {
        test: 'Configuración de package.json',
        status: 'FAIL',
        details: `Error leyendo package.json: ${error.message}`,
        critical: true
      });
    }

    console.log('✅ Validación de archivos completada\n');
  }

  // ==================== VALIDACIÓN DE BACKEND ====================
  async validateBackend() {
    console.log('🖥️  Validando backend...');

    // Verificar si el servidor está corriendo
    const backendRunning = await this.testConnection(CONFIG.BACKEND_URL);
    this.addResult('backend', {
      test: 'Servidor backend activo',
      status: backendRunning ? 'PASS' : 'FAIL',
      details: backendRunning ? 'Servidor respondiendo' : 'Servidor no responde',
      critical: true
    });

    if (!backendRunning) {
      this.addResult('backend', {
        test: 'Endpoints críticos',
        status: 'SKIP',
        details: 'Servidor backend no disponible',
        critical: true
      });
      return;
    }

    // Probar endpoints críticos
    for (const endpoint of CONFIG.CRITICAL_ENDPOINTS) {
      const result = await this.testEndpoint(CONFIG.BACKEND_URL + endpoint);
      this.addResult('backend', {
        test: `Endpoint: ${endpoint}`,
        status: result.success ? 'PASS' : 'FAIL',
        details: result.success ? 
          `Status: ${result.status}` : 
          `Error: ${result.error}`,
        critical: true
      });
    }

    // Verificar estructura de respuestas
    const healthCheck = await this.testEndpoint(CONFIG.BACKEND_URL + '/api/health');
    if (healthCheck.success && healthCheck.data) {
      const hasRequiredFields = healthCheck.data.status && healthCheck.data.service;
      this.addResult('backend', {
        test: 'Formato de respuesta estándar',
        status: hasRequiredFields ? 'PASS' : 'WARN',
        details: hasRequiredFields ? 
          'Respuestas siguen formato estándar' : 
          'Formato de respuesta inconsistente',
        critical: false
      });
    }

    console.log('✅ Validación de backend completada\n');
  }

  // ==================== VALIDACIÓN DE FRONTEND ====================
  async validateFrontend() {
    console.log('🌐 Validando frontend...');

    // Verificar si el servidor de desarrollo está corriendo
    const frontendRunning = await this.testConnection(CONFIG.FRONTEND_URL);
    this.addResult('frontend', {
      test: 'Servidor frontend activo',
      status: frontendRunning ? 'PASS' : 'FAIL',
      details: frontendRunning ? 'Servidor de desarrollo respondiendo' : 'Servidor no responde',
      critical: true
    });

    if (!frontendRunning) {
      this.addResult('frontend', {
        test: 'Páginas críticas',
        status: 'SKIP',
        details: 'Servidor frontend no disponible',
        critical: true
      });
      return;
    }

    // Probar páginas críticas
    for (const page of CONFIG.CRITICAL_PAGES) {
      const result = await this.testPage(CONFIG.FRONTEND_URL + page);
      this.addResult('frontend', {
        test: `Página: ${page}`,
        status: result.success ? 'PASS' : 'FAIL',
        details: result.success ? 
          `Carga exitosa` : 
          `Error: ${result.error}`,
        critical: true
      });
    }

    // Verificar build assets
    const distPath = path.join(process.cwd(), 'dist');
    const buildExists = fs.existsSync(distPath);
    this.addResult('frontend', {
      test: 'Build assets',
      status: buildExists ? 'PASS' : 'WARN',
      details: buildExists ? 
        'Directorio dist existe' : 
        'No se encontró build de producción',
      critical: false
    });

    console.log('✅ Validación de frontend completada\n');
  }

  // ==================== UTILIDADES ====================
  async testConnection(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      http.get(url, (res) => {
        clearTimeout(timeout);
        resolve(res.statusCode === 200);
      }).on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async testEndpoint(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, CONFIG.TIMEOUT);

      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            const parsed = JSON.parse(data);
            resolve({
              success: res.statusCode === 200,
              status: res.statusCode,
              data: parsed,
              error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
            });
          } catch (e) {
            resolve({
              success: false,
              error: 'Invalid JSON response'
            });
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  async testPage(url) {
    // Para páginas, solo verificamos que respondan con HTML
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, CONFIG.TIMEOUT);

      http.get(url, (res) => {
        clearTimeout(timeout);
        const isHtml = res.headers['content-type']?.includes('text/html');
        resolve({
          success: res.statusCode === 200 && isHtml,
          error: res.statusCode !== 200 ? 
            `HTTP ${res.statusCode}` : 
            !isHtml ? 'No es HTML' : null
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  addResult(category, result) {
    this.results[category].push(result);
    
    if (result.status === 'PASS') {
      this.results.overall.passed++;
    } else if (result.status === 'FAIL') {
      this.results.overall.failed++;
    } else if (result.status === 'WARN') {
      this.results.overall.warnings++;
    }
  }

  // ==================== REPORTE ====================
  generateReport() {
    console.log('📊 REPORTE DE VALIDACIÓN PRE-DEPLOY');
    console.log('='.repeat(50));
    
    // Resumen general
    const total = this.results.overall.passed + this.results.overall.failed + this.results.overall.warnings;
    console.log(`\n📈 RESUMEN GENERAL:`);
    console.log(`   Total de pruebas: ${total}`);
    console.log(`   ✅ Pasaron: ${this.results.overall.passed}`);
    console.log(`   ❌ Fallaron: ${this.results.overall.failed}`);
    console.log(`   ⚠️  Advertencias: ${this.results.overall.warnings}`);
    
    // Detalles por categoría
    ['fileSystem', 'backend', 'frontend'].forEach(category => {
      if (this.results[category].length === 0) return;
      
      console.log(`\n📋 ${category.toUpperCase()}:`);
      this.results[category].forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : 
                    result.status === 'WARN' ? '⚠️' : '⏩';
        console.log(`   ${icon} ${result.test}`);
        if (result.details) {
          console.log(`      ${result.details}`);
        }
      });
    });

    // Recomendaciones
    console.log(`\n💡 RECOMENDACIONES:`);
    
    const criticalFailures = [
      ...this.results.fileSystem,
      ...this.results.backend,
      ...this.results.frontend
    ].filter(r => r.status === 'FAIL' && r.critical);

    if (criticalFailures.length === 0) {
      console.log('   🎉 ¡Todo listo para deploy!');
      console.log('   🚀 Se puede proceder con confianza.');
    } else {
      console.log('   🚨 HAY PROBLEMAS CRÍTICOS QUE RESOLVER:');
      criticalFailures.forEach(failure => {
        console.log(`      • ${failure.test}: ${failure.details}`);
      });
      console.log('   🔧 Resolver estos problemas antes del deploy.');
    }

    console.log('\n' + '='.repeat(50));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const validator = new DeployValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = DeployValidator;