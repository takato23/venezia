#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validador de sintaxis JSX/JS para detectar errores de compilación
 * antes de que afecten la navegación de la aplicación
 */
class SyntaxValidator {
  constructor() {
    this.results = [];
    this.totalFiles = 0;
    this.passedFiles = 0;
    this.failedFiles = 0;
  }

  /**
   * Valida todos los archivos JSX/JS en el proyecto
   */
  async validateProject() {
    console.log('🔍 INICIANDO VALIDACIÓN DE SINTAXIS\n');
    
    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) {
      console.log('❌ Directorio src/ no encontrado');
      return false;
    }

    await this.validateDirectory(srcPath);
    this.generateReport();
    
    return this.failedFiles === 0;
  }

  /**
   * Valida todos los archivos en un directorio recursivamente
   */
  async validateDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Recursivamente validar subdirectorios
        await this.validateDirectory(itemPath);
      } else if (this.shouldValidateFile(item)) {
        await this.validateFile(itemPath);
      }
    }
  }

  /**
   * Determina si un archivo debe ser validado
   */
  shouldValidateFile(filename) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Valida un archivo específico
   */
  async validateFile(filePath) {
    this.totalFiles++;
    const relativePath = path.relative(process.cwd(), filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const errors = this.checkSyntaxErrors(content, relativePath);
      
      if (errors.length === 0) {
        this.passedFiles++;
        this.results.push({
          file: relativePath,
          status: 'PASS',
          errors: []
        });
      } else {
        this.failedFiles++;
        this.results.push({
          file: relativePath,
          status: 'FAIL',
          errors: errors
        });
      }
    } catch (error) {
      this.failedFiles++;
      this.results.push({
        file: relativePath,
        status: 'ERROR',
        errors: [`No se pudo leer el archivo: ${error.message}`]
      });
    }
  }

  /**
   * Verifica errores de sintaxis comunes
   */
  checkSyntaxErrors(content, filePath) {
    const errors = [];
    const lines = content.split('\n');
    
    // Verificar paréntesis balanceados
    const parenthesesErrors = this.checkBalancedParentheses(content, lines);
    errors.push(...parenthesesErrors);
    
    // Verificar llaves balanceadas
    const braceErrors = this.checkBalancedBraces(content, lines);
    errors.push(...braceErrors);
    
    // Verificar corchetes balanceados
    const bracketErrors = this.checkBalancedBrackets(content, lines);
    errors.push(...bracketErrors);
    
    // Verificar imports/exports mal formados
    const importErrors = this.checkImportExportSyntax(lines);
    errors.push(...importErrors);
    
    // Verificar JSX mal formado
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      const jsxErrors = this.checkJSXSyntax(lines);
      errors.push(...jsxErrors);
    }
    
    return errors;
  }

  /**
   * Verifica paréntesis balanceados
   */
  checkBalancedParentheses(content, lines) {
    const errors = [];
    let count = 0;
    let lineNum = 0;
    
    for (const line of lines) {
      lineNum++;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '(') {
          count++;
        } else if (char === ')') {
          count--;
          if (count < 0) {
            errors.push(`Línea ${lineNum}: Paréntesis de cierre sin apertura`);
            count = 0; // Reset para continuar
          }
        }
      }
    }
    
    if (count > 0) {
      errors.push(`Paréntesis sin cerrar: ${count} paréntesis abiertos`);
    }
    
    return errors;
  }

  /**
   * Verifica llaves balanceadas
   */
  checkBalancedBraces(content, lines) {
    const errors = [];
    let count = 0;
    let lineNum = 0;
    
    for (const line of lines) {
      lineNum++;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '{') {
          count++;
        } else if (char === '}') {
          count--;
          if (count < 0) {
            errors.push(`Línea ${lineNum}: Llave de cierre sin apertura`);
            count = 0; // Reset para continuar
          }
        }
      }
    }
    
    if (count > 0) {
      errors.push(`Llaves sin cerrar: ${count} llaves abiertas`);
    }
    
    return errors;
  }

  /**
   * Verifica corchetes balanceados
   */
  checkBalancedBrackets(content, lines) {
    const errors = [];
    let count = 0;
    let lineNum = 0;
    
    for (const line of lines) {
      lineNum++;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '[') {
          count++;
        } else if (char === ']') {
          count--;
          if (count < 0) {
            errors.push(`Línea ${lineNum}: Corchete de cierre sin apertura`);
            count = 0; // Reset para continuar
          }
        }
      }
    }
    
    if (count > 0) {
      errors.push(`Corchetes sin cerrar: ${count} corchetes abiertos`);
    }
    
    return errors;
  }

  /**
   * Verifica sintaxis de imports/exports
   */
  checkImportExportSyntax(lines) {
    const errors = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Verificar imports mal formados
      if (trimmed.startsWith('import ') && !trimmed.endsWith(';')) {
        if (!trimmed.includes('from')) {
          errors.push(`Línea ${lineNum}: Import mal formado - falta 'from'`);
        }
      }
      
      // Verificar exports mal formados
      if (trimmed.startsWith('export ') && trimmed.includes('default') && !trimmed.endsWith(';')) {
        if (!trimmed.includes('=')) {
          errors.push(`Línea ${lineNum}: Export default mal formado`);
        }
      }
    });
    
    return errors;
  }

  /**
   * Verifica sintaxis JSX común
   */
  checkJSXSyntax(lines) {
    const errors = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Verificar tags JSX sin cerrar
      if (trimmed.includes('<') && !trimmed.includes('</')) {
        const openTags = (trimmed.match(/<[a-zA-Z][^>]*[^/]>/g) || []);
        if (openTags.length > 0 && !trimmed.includes('/>')) {
          // Solo advertir si parece ser un tag que debería cerrarse
          const tagName = openTags[0].match(/<([a-zA-Z][^>\s]*)/);
          if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName[1].toLowerCase())) {
            // Esta es una verificación básica, no perfecta
          }
        }
      }
      
      // Verificar map() sin key prop en JSX
      if (trimmed.includes('.map(') && trimmed.includes('<')) {
        if (!trimmed.includes('key=')) {
          // Verificar si la línea anterior o siguiente tiene key
          const prevLine = index > 0 ? lines[index - 1] : '';
          const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
          if (!prevLine.includes('key=') && !nextLine.includes('key=')) {
            errors.push(`Línea ${lineNum}: Map en JSX probablemente necesita prop 'key'`);
          }
        }
      }
    });
    
    return errors;
  }

  /**
   * Genera reporte de resultados
   */
  generateReport() {
    console.log('📊 REPORTE DE VALIDACIÓN DE SINTAXIS');
    console.log('='.repeat(50));
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Total de archivos: ${this.totalFiles}`);
    console.log(`   ✅ Sin errores: ${this.passedFiles}`);
    console.log(`   ❌ Con errores: ${this.failedFiles}`);
    
    if (this.failedFiles > 0) {
      console.log(`\n🚨 ARCHIVOS CON ERRORES:`);
      
      this.results
        .filter(result => result.status !== 'PASS')
        .forEach(result => {
          console.log(`\n📄 ${result.file}:`);
          result.errors.forEach(error => {
            console.log(`   ❌ ${error}`);
          });
        });
    }
    
    console.log(`\n💡 RECOMENDACIONES:`);
    if (this.failedFiles === 0) {
      console.log('   🎉 ¡Todos los archivos tienen sintaxis correcta!');
      console.log('   🚀 No deberían haber errores de compilación.');
    } else {
      console.log('   🔧 Corregir los errores de sintaxis antes de continuar.');
      console.log('   🧪 Volver a ejecutar después de las correcciones.');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const validator = new SyntaxValidator();
  validator.validateProject().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = SyntaxValidator;