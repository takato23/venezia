#!/usr/bin/env node

/**
 * Detector de Elementos Interactivos Rotos
 * Encuentra botones, links y elementos que no hacen nada cuando se clickan
 */

class BrokenInteractionDetector {
  constructor() {
    this.puppeteer = null;
    this.browser = null;
    this.results = {
      brokenButtons: [],
      brokenLinks: [],
      nonFunctionalElements: [],
      totalChecked: 0,
      totalBroken: 0
    };
  }

  async detectBrokenInteractions() {
    console.log('🔍 DETECTANDO ELEMENTOS INTERACTIVOS ROTOS\n');
    
    try {
      // Intentar usar Puppeteer si está disponible
      try {
        this.puppeteer = require('puppeteer');
      } catch (e) {
        console.log('📝 Puppeteer no encontrado. Instalando...');
        console.log('💡 Ejecuta: npm install puppeteer --save-dev\n');
        
        // Crear script alternativo que funcione sin Puppeteer
        this.createStaticAnalyzer();
        return false;
      }

      this.browser = await this.puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Páginas a verificar
      const pages = [
        { url: 'http://localhost:5173/', name: 'Dashboard' },
        { url: 'http://localhost:5173/products', name: 'Products' },
        { url: 'http://localhost:5173/stores', name: 'Stores' },
        { url: 'http://localhost:5173/pos', name: 'POS' },
        { url: 'http://localhost:5173/webshop', name: 'WebShop' }
      ];

      for (const pageInfo of pages) {
        await this.analyzePage(pageInfo);
      }

      this.generateReport();
      return this.results.totalBroken === 0;

    } catch (error) {
      console.error('Error:', error.message);
      return false;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async analyzePage(pageInfo) {
    console.log(`🔍 Analizando ${pageInfo.name}...`);
    
    const page = await this.browser.newPage();
    
    try {
      // Configurar timeouts
      await page.setDefaultTimeout(10000);
      
      // Ir a la página
      await page.goto(pageInfo.url, { waitUntil: 'networkidle0' });
      
      // Esperar un poco para que la página se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Analizar elementos interactivos
      const interactiveElements = await page.evaluate(() => {
        const elements = [];
        
        // Encontrar todos los botones
        const buttons = document.querySelectorAll('button');
        buttons.forEach((btn, index) => {
          const hasOnClick = btn.onclick !== null;
          const hasEventListener = btn.getAttribute('data-has-listener') === 'true' || 
                                  btn.hasAttribute('data-testid') ||
                                  btn.closest('[data-testid]') !== null;
          
          // Verificar si el botón tiene handlers React
          const hasReactHandler = btn._reactInternalFiber || 
                                 btn._reactInternalInstance ||
                                 Object.keys(btn).some(key => key.startsWith('__reactInternalInstance'));
          
          const text = btn.textContent?.trim() || '';
          const classes = btn.className || '';
          
          // Detectar botones probablemente rotos
          const looksClickable = classes.includes('hover:') || 
                                classes.includes('cursor-pointer') ||
                                classes.includes('button') ||
                                btn.type === 'button' ||
                                btn.type === 'submit';
          
          const probablyBroken = looksClickable && 
                               !hasOnClick && 
                               !hasEventListener && 
                               !hasReactHandler &&
                               text.length > 0 &&
                               !btn.disabled;

          elements.push({
            type: 'button',
            text: text.substring(0, 50),
            classes: classes.substring(0, 100),
            hasOnClick,
            hasEventListener,
            hasReactHandler,
            probablyBroken,
            selector: `button:nth-child(${index + 1})`,
            outerHTML: btn.outerHTML.substring(0, 200)
          });
        });

        // Encontrar links que no van a ningún lado
        const links = document.querySelectorAll('a');
        links.forEach((link, index) => {
          const href = link.getAttribute('href');
          const hasOnClick = link.onclick !== null;
          const text = link.textContent?.trim() || '';
          
          const probablyBroken = (!href || href === '#' || href === '') && 
                               !hasOnClick && 
                               text.length > 0;

          if (probablyBroken) {
            elements.push({
              type: 'link',
              text: text.substring(0, 50),
              href: href || 'sin href',
              probablyBroken: true,
              selector: `a:nth-child(${index + 1})`,
              outerHTML: link.outerHTML.substring(0, 200)
            });
          }
        });

        // Encontrar elementos con clases de hover pero sin funcionalidad
        const hoverElements = document.querySelectorAll('[class*="hover:"], [class*="cursor-pointer"]');
        hoverElements.forEach((el, index) => {
          if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
            const hasOnClick = el.onclick !== null;
            const hasEventListener = el.getAttribute('data-has-listener') === 'true';
            const text = el.textContent?.trim().substring(0, 30) || '';
            
            if (!hasOnClick && !hasEventListener && text.length > 0) {
              elements.push({
                type: 'hover-element',
                tagName: el.tagName,
                text: text,
                classes: el.className.substring(0, 100),
                probablyBroken: true,
                selector: `${el.tagName.toLowerCase()}:nth-child(${index + 1})`,
                outerHTML: el.outerHTML.substring(0, 200)
              });
            }
          }
        });

        return elements;
      });

      // Filtrar y categorizar elementos rotos
      const brokenElements = interactiveElements.filter(el => el.probablyBroken);
      
      this.results.totalChecked += interactiveElements.length;
      this.results.totalBroken += brokenElements.length;

      if (brokenElements.length > 0) {
        this.results.brokenButtons.push({
          page: pageInfo.name,
          url: pageInfo.url,
          brokenElements: brokenElements
        });
      }

      console.log(`   ✅ ${interactiveElements.length} elementos verificados, ${brokenElements.length} probablemente rotos`);

    } catch (error) {
      console.log(`   ❌ Error analizando ${pageInfo.name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  generateReport() {
    console.log('\n📊 REPORTE DE ELEMENTOS INTERACTIVOS ROTOS');
    console.log('='.repeat(60));
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Total elementos verificados: ${this.results.totalChecked}`);
    console.log(`   Elementos probablemente rotos: ${this.results.totalBroken}`);
    
    if (this.results.totalBroken > 0) {
      console.log(`\n🚨 ELEMENTOS ROTOS ENCONTRADOS:\n`);
      
      this.results.brokenButtons.forEach(pageResult => {
        console.log(`📄 ${pageResult.page} (${pageResult.url}):`);
        
        pageResult.brokenElements.forEach((element, index) => {
          console.log(`\n   ${index + 1}. ${element.type.toUpperCase()}: "${element.text}"`);
          console.log(`      Problema: No tiene onClick, handlers React, ni event listeners`);
          console.log(`      Selector: ${element.selector}`);
          
          if (element.href) {
            console.log(`      Href: ${element.href}`);
          }
          
          if (element.classes) {
            console.log(`      Clases: ${element.classes}`);
          }
          
          console.log(`      HTML: ${element.outerHTML}...`);
        });
        
        console.log('');
      });
    }
    
    console.log(`\n💡 RECOMENDACIONES:`);
    if (this.results.totalBroken === 0) {
      console.log('   🎉 ¡Todos los elementos interactivos parecen funcionar!');
      console.log('   ✅ No se encontraron botones o links obviamente rotos');
    } else {
      console.log('   🔧 Revisar los elementos listados arriba');
      console.log('   ⚠️  Muchos botones parecen no tener funcionalidad');
      console.log('   💻 Verificar que tengan onClick handlers o event listeners');
      console.log('   🧪 Probar manualmente los elementos sospechosos');
    }
    
    console.log('\n🛠️  CÓMO ARREGLAR:');
    console.log('   1. Agregar onClick handlers a los botones');
    console.log('   2. Conectar los botones a funciones reales');  
    console.log('   3. Quitar clases hover: de elementos no clickeables');
    console.log('   4. Agregar href válidos a los links');
    
    console.log('\n' + '='.repeat(60));
  }

  // Crear analizador estático como alternativa
  createStaticAnalyzer() {
    const staticAnalyzer = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Analizador estático de archivos JSX para encontrar elementos rotos
class StaticInteractionAnalyzer {
  analyze() {
    console.log('🔍 ANÁLISIS ESTÁTICO DE ELEMENTOS INTERACTIVOS\\n');
    console.log('📝 (Para análisis completo instala: npm install puppeteer --save-dev)\\n');
    
    const srcPath = path.join(process.cwd(), 'src');
    const jsxFiles = this.findJSXFiles(srcPath);
    
    let totalIssues = 0;
    
    jsxFiles.forEach(file => {
      const issues = this.analyzeFile(file);
      if (issues.length > 0) {
        console.log(\`📄 \${path.relative(process.cwd(), file)}:\`);
        issues.forEach((issue, index) => {
          console.log(\`   \${index + 1}. \${issue}\`);
        });
        console.log('');
        totalIssues += issues.length;
      }
    });
    
    if (totalIssues === 0) {
      console.log('✅ No se encontraron problemas obvios en el código JSX');
    } else {
      console.log(\`⚠️  Se encontraron \${totalIssues} posibles problemas\`);
    }
  }
  
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
  
  analyzeFile(filePath) {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Detectar botones con hover pero sin onClick
      if (line.includes('<button') && line.includes('hover:') && !line.includes('onClick')) {
        issues.push(\`Línea \${lineNum}: Botón con hover pero sin onClick\`);
      }
      
      // Detectar links vacíos
      if (line.includes('<a') && (line.includes('href="#"') || !line.includes('href='))) {
        issues.push(\`Línea \${lineNum}: Link sin href válido\`);
      }
      
      // Detectar elementos con cursor-pointer pero sin click handler
      if (line.includes('cursor-pointer') && !line.includes('onClick') && !line.includes('<a')) {
        issues.push(\`Línea \${lineNum}: cursor-pointer sin onClick\`);
      }
    });
    
    return issues;
  }
}

const analyzer = new StaticInteractionAnalyzer();
analyzer.analyze();
`;

    fs.writeFileSync('static-interaction-analyzer.js', staticAnalyzer);
    console.log('📝 Creado static-interaction-analyzer.js como alternativa');
    console.log('💡 Ejecuta: node static-interaction-analyzer.js');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const detector = new BrokenInteractionDetector();
  detector.detectBrokenInteractions().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = BrokenInteractionDetector;