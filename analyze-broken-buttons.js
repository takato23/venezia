#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Analizador específico para encontrar botones y elementos rotos
 * Enfocado en encontrar el botón "Ver" de /stores que no funciona
 */
class BrokenButtonAnalyzer {
  constructor() {
    this.issues = [];
    this.suspiciousPatterns = [
      // Botones con hover pero sin onClick
      /<button[^>]*hover:[^>]*(?!.*onClick)/gi,
      // Links con href="#" pero sin onClick
      /<a[^>]*href=["']#["'][^>]*(?!.*onClick)/gi,
      // Elementos con cursor-pointer pero sin funcionalidad
      /cursor-pointer[^>]*(?!.*onClick)(?!.*<a)/gi,
      // Botones con texto "Ver" específicamente
      /<button[^>]*>[^<]*Ver[^<]*<\/button>/gi
    ];
  }

  analyze() {
    console.log('🔍 ANALIZANDO BOTONES Y ELEMENTOS ROTOS\n');
    
    const srcPath = path.join(process.cwd(), 'src');
    const jsxFiles = this.findJSXFiles(srcPath);
    
    console.log(`📁 Encontrados ${jsxFiles.length} archivos JSX/TSX\n`);
    
    let totalIssues = 0;
    
    // Análisis específico para páginas problemáticas
    const criticalPages = [
      'src/pages/Dashboard.jsx',
      'src/pages/Products.jsx', 
      'src/pages/Stores.jsx',
      'src/pages/POS.jsx',
      'src/pages/Inventory.jsx'
    ];
    
    criticalPages.forEach(pagePath => {
      const fullPath = path.join(process.cwd(), pagePath);
      if (fs.existsSync(fullPath)) {
        const issues = this.analyzeFile(fullPath, true);
        if (issues.length > 0) {
          console.log(`🚨 ${pagePath}:`);
          issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
          });
          console.log('');
          totalIssues += issues.length;
        }
      } else {
        console.log(`⚠️  ${pagePath} no encontrado`);
      }
    });
    
    // Análisis de todos los otros archivos
    console.log('📄 OTROS ARCHIVOS CON PROBLEMAS:\n');
    
    jsxFiles.forEach(file => {
      if (!criticalPages.some(p => file.includes(p.replace('src/', '')))) {
        const issues = this.analyzeFile(file, false);
        if (issues.length > 0) {
          console.log(`📄 ${path.relative(process.cwd(), file)}:`);
          issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
          });
          console.log('');
          totalIssues += issues.length;
        }
      }
    });
    
    // Resumen
    console.log('📊 RESUMEN FINAL:');
    console.log(`   Total problemas encontrados: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('   ✅ No se encontraron problemas obvios en el código JSX');
    } else {
      console.log(`   ⚠️  Se encontraron ${totalIssues} posibles problemas`);
      console.log('   💡 Revisar especialmente botones "Ver" y elementos con hover');
    }
    
    console.log('\n🛠️  RECOMENDACIONES:');
    console.log('   1. Buscar botones "Ver" que no tengan onClick');
    console.log('   2. Revisar elementos con cursor-pointer sin funcionalidad');
    console.log('   3. Conectar handlers faltantes a funciones reales');
    console.log('   4. Probar manualmente los elementos sospechosos');
  }

  findJSXFiles(dir) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules')) {
          files = files.concat(this.findJSXFiles(fullPath));
        } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
    
    return files;
  }

  analyzeFile(filePath, detailed = false) {
    const issues = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        
        // Botón "Ver" específico - el problema reportado
        if (trimmedLine.includes('Ver') && trimmedLine.includes('<button')) {
          if (!trimmedLine.includes('onClick')) {
            issues.push(`Línea ${lineNum}: Botón "Ver" sin onClick - ${trimmedLine.substring(0, 80)}...`);
          }
        }
        
        // Botones con hover pero sin onClick
        if (trimmedLine.includes('<button') && 
            trimmedLine.includes('hover:') && 
            !trimmedLine.includes('onClick')) {
          issues.push(`Línea ${lineNum}: Botón con hover sin onClick - ${trimmedLine.substring(0, 60)}...`);
        }
        
        // Links con href="#" pero sin onClick
        if (trimmedLine.includes('<a') && 
            trimmedLine.includes('href="#"') && 
            !trimmedLine.includes('onClick')) {
          issues.push(`Línea ${lineNum}: Link href="#" sin onClick - ${trimmedLine.substring(0, 60)}...`);
        }
        
        // Elementos con cursor-pointer pero sin funcionalidad
        if (trimmedLine.includes('cursor-pointer') && 
            !trimmedLine.includes('onClick') && 
            !trimmedLine.includes('<a') &&
            !trimmedLine.includes('Link')) {
          issues.push(`Línea ${lineNum}: cursor-pointer sin onClick - ${trimmedLine.substring(0, 60)}...`);
        }
        
        // Divs o spans clickables sin funcionalidad
        if ((trimmedLine.includes('<div') || trimmedLine.includes('<span')) &&
            (trimmedLine.includes('cursor-pointer') || trimmedLine.includes('hover:')) &&
            !trimmedLine.includes('onClick')) {
          issues.push(`Línea ${lineNum}: Elemento clickeable sin onClick - ${trimmedLine.substring(0, 60)}...`);
        }
      });
      
    } catch (error) {
      issues.push(`Error leyendo archivo: ${error.message}`);
    }
    
    return issues;
  }
}

// Ejecutar análisis
if (require.main === module) {
  const analyzer = new BrokenButtonAnalyzer();
  analyzer.analyze();
}

module.exports = BrokenButtonAnalyzer;