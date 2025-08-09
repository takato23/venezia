#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * Validador de sintaxis crítica - Detecta solo errores reales que rompen la compilación
 * Integrado con el servidor de desarrollo de Vite para verificación en tiempo real
 */
class CriticalSyntaxValidator {
  constructor() {
    this.results = [];
    this.totalFiles = 0;
    this.passedFiles = 0;
    this.failedFiles = 0;
    this.viteDev = 'http://localhost:5173';
  }

  /**
   * Valida archivos críticos y detecta errores reales de compilación
   */
  async validateProject() {
    console.log('🔍 VALIDANDO SINTAXIS CRÍTICA (Errores reales de compilación)\n');
    
    // Archivos críticos que deben funcionar
    const criticalFiles = [
      'src/pages/Products.jsx',
      'src/pages/Dashboard.jsx', 
      'src/pages/POS.jsx',
      'src/pages/Inventory.jsx',
      'src/pages/Production.jsx',
      'src/pages/Analytics.jsx',
      'src/pages/Settings.jsx',
      'src/pages/ModernWebShop.jsx',
      'src/App.jsx'
    ];

    console.log('📄 Validando archivos críticos...\n');

    for (const file of criticalFiles) {
      await this.validateCriticalFile(file);
    }

    // Buscar archivos con errores estructurales graves
    console.log('🔍 Buscando archivos con errores estructurales...\n');
    await this.findFilesWithStructuralErrors();

    this.generateReport();
    return this.failedFiles === 0;
  }

  /**
   * Valida un archivo crítico verificando que Vite pueda compilarlo
   */
  async validateCriticalFile(filePath) {
    this.totalFiles++;
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.failedFiles++;
      this.results.push({
        file: filePath,
        status: 'MISSING',
        errors: ['Archivo crítico no encontrado']
      });
      return;
    }

    // Verificar si Vite puede servir el archivo
    const viteUrl = `${this.viteDev}/${filePath}`;
    const canCompile = await this.testFileCompilation(viteUrl);
    
    if (canCompile.success) {
      this.passedFiles++;
      this.results.push({
        file: filePath,
        status: 'PASS',
        errors: []
      });
    } else {
      this.failedFiles++;
      this.results.push({
        file: filePath,
        status: 'COMPILE_ERROR',
        errors: [canCompile.error]
      });
    }
  }

  /**
   * Busca archivos con errores estructurales graves (paréntesis desbalanceados, etc.)
   */
  async findFilesWithStructuralErrors() {
    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) return;

    const jsxFiles = this.findJSXFiles(srcPath);
    
    for (const file of jsxFiles) {
      const relativePath = path.relative(process.cwd(), file);
      
      // Saltar archivos ya validados
      if (this.results.find(r => r.file === relativePath)) continue;
      
      const errors = await this.checkForStructuralErrors(file);
      if (errors.length > 0) {
        this.totalFiles++;
        this.failedFiles++;
        this.results.push({
          file: relativePath,
          status: 'STRUCTURAL_ERROR',
          errors: errors
        });
      }
    }
  }

  /**
   * Encuentra archivos JSX recursivamente
   */
  findJSXFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.findJSXFiles(fullPath));
      } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Verifica errores estructurales graves
   */
  async checkForStructuralErrors(filePath) {
    const errors = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Verificar archivo truncado/incompleto
      if (this.isFileTruncated(content, lines)) {
        errors.push('Archivo parece estar truncado o incompleto');
      }
      
      // Verificar paréntesis/llaves/corchetes gravemente desbalanceados
      const balanceErrors = this.checkCriticalBalance(content, lines);
      errors.push(...balanceErrors);
      
      // Verificar exports/imports críticos
      const importExportErrors = this.checkCriticalImportExport(lines);
      errors.push(...importExportErrors);
      
    } catch (error) {
      errors.push(`Error leyendo archivo: ${error.message}`);
    }
    
    return errors;
  }

  /**
   * Detecta si un archivo está truncado
   */
  isFileTruncated(content, lines) {
    // Buscar señales de archivo truncado
    const lastLine = lines[lines.length - 1];
    
    // Archivo termina abruptamente sin export
    if (!content.includes('export default') && !content.includes('module.exports')) {
      return true;
    }
    
    // Archivo termina con línea incompleta de código
    if (lastLine && lastLine.trim() && !lastLine.trim().endsWith(';') && 
        !lastLine.trim().endsWith('}') && !lastLine.trim().endsWith(';') &&
        (lastLine.includes('import') || lastLine.includes('const') || lastLine.includes('function'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica desbalance crítico que rompe la compilación
   */
  checkCriticalBalance(content, lines) {
    const errors = [];
    
    // Contar paréntesis, llaves y corchetes
    let parens = 0, braces = 0, brackets = 0;
    let inString = false, inComment = false;
    let stringChar = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const prev = content[i - 1];
      const next = content[i + 1];
      
      // Manejar strings
      if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        continue;
      }
      
      if (inString) continue;
      
      // Manejar comentarios
      if (char === '/' && next === '/') {
        inComment = 'line';
        continue;
      }
      if (char === '/' && next === '*') {
        inComment = 'block';
        continue;
      }
      if (inComment === 'line' && char === '\n') {
        inComment = false;
        continue;
      }
      if (inComment === 'block' && char === '*' && next === '/') {
        inComment = false;
        i++; // skip next char
        continue;
      }
      
      if (inComment) continue;
      
      // Contar balances
      switch (char) {
        case '(': parens++; break;
        case ')': parens--; break;
        case '{': braces++; break;
        case '}': braces--; break;
        case '[': brackets++; break;
        case ']': brackets--; break;
      }
      
      // Detectar desbalance negativo (más cierres que aperturas)
      if (parens < 0) {
        errors.push('Paréntesis de cierre sin apertura correspondiente');
        parens = 0; // Reset para continuar
      }
      if (braces < 0) {
        errors.push('Llave de cierre sin apertura correspondiente');
        braces = 0;
      }
      if (brackets < 0) {
        errors.push('Corchete de cierre sin apertura correspondiente');
        brackets = 0;
      }
    }
    
    // Verificar desbalance final
    if (parens > 0) errors.push(`${parens} paréntesis sin cerrar`);
    if (braces > 0) errors.push(`${braces} llaves sin cerrar`);
    if (brackets > 0) errors.push(`${brackets} corchetes sin cerrar`);
    
    return errors;
  }

  /**
   * Verifica imports/exports críticos mal formados
   */
  checkCriticalImportExport(lines) {
    const errors = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Solo verificar líneas obviamente problemáticas
      if (trimmed.startsWith('import ') && trimmed.includes('from') && !trimmed.endsWith(';')) {
        // Verificar si la siguiente línea completa el import
        const nextLine = lines[index + 1];
        if (!nextLine || !nextLine.trim().startsWith('}')) {
          errors.push(`Línea ${lineNum}: Import incompleto o mal formado`);
        }
      }
      
      // Export default sin valor
      if (trimmed === 'export default' || trimmed === 'export default;') {
        errors.push(`Línea ${lineNum}: Export default sin valor`);
      }
    });
    
    return errors;
  }

  /**
   * Prueba si Vite puede compilar un archivo
   */
  async testFileCompilation(url) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout - no se pudo verificar compilación' });
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
              const errorMsg = errorMatch ? errorMatch[1] : 'Error de compilación desconocido';
              resolve({ success: false, error: errorMsg });
            } catch (e) {
              resolve({ success: false, error: 'Error de compilación (no se pudo parsear)' });
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

  /**
   * Genera reporte de errores críticos
   */
  generateReport() {
    console.log('📊 REPORTE DE VALIDACIÓN CRÍTICA');
    console.log('='.repeat(50));
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Archivos verificados: ${this.totalFiles}`);
    console.log(`   ✅ Sin errores críticos: ${this.passedFiles}`);
    console.log(`   ❌ Con errores críticos: ${this.failedFiles}`);
    
    if (this.failedFiles > 0) {
      console.log(`\n🚨 ERRORES CRÍTICOS ENCONTRADOS:`);
      
      this.results
        .filter(result => result.status !== 'PASS')
        .forEach(result => {
          const statusIcon = result.status === 'MISSING' ? '📁' : 
                           result.status === 'COMPILE_ERROR' ? '💥' : '🔧';
          console.log(`\n${statusIcon} ${result.file}:`);
          result.errors.forEach(error => {
            console.log(`   ❌ ${error}`);
          });
        });
    }
    
    console.log(`\n💡 RECOMENDACIONES:`);
    if (this.failedFiles === 0) {
      console.log('   🎉 ¡No hay errores críticos de sintaxis!');
      console.log('   🚀 Todos los archivos críticos compilan correctamente.');
    } else {
      console.log('   🔧 Corregir INMEDIATAMENTE los errores críticos.');
      console.log('   ⚠️  Estos errores rompen la navegación de la aplicación.');
      console.log('   🧪 Volver a ejecutar después de las correcciones.');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const validator = new CriticalSyntaxValidator();
  validator.validateProject().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = CriticalSyntaxValidator;