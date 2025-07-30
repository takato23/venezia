const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AnalyzeAgent {
  constructor() {
    this.reportPath = path.join(process.cwd(), 'report');
    this.ignoredDirs = ['.git', 'node_modules', 'dist', 'build', '.venv', 'venv', '.next', '.cache'];
    this.ignoredExtensions = ['.log', '.lock', '.db', '.sqlite'];
  }

  async execute() {
    console.log('🔍 Iniciando análisis del repositorio...');
    
    // Crear directorio de reportes
    await fs.mkdir(this.reportPath, { recursive: true });
    
    const analysis = {
      timestamp: new Date().toISOString(),
      structure: await this.analyzeStructure(),
      stack: await this.detectStack(),
      scripts: await this.detectScripts(),
      hotspots: await this.findHotspots(),
      largeFiles: await this.findLargeFiles(),
      dependencies: await this.analyzeDependencies(),
      metrics: await this.calculateMetrics()
    };

    // Guardar reporte
    const reportFile = path.join(this.reportPath, 'analyze.json');
    await fs.writeFile(reportFile, JSON.stringify(analysis, null, 2));
    
    // Actualizar STATE.md
    await this.updateStateFile(analysis);
    
    console.log('✅ Análisis completado:', reportFile);
    return analysis;
  }

  async analyzeStructure() {
    const structure = {
      directories: [],
      filesByExtension: {},
      totalFiles: 0
    };

    async function walk(dir, relativePath = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.ignoredDirs.includes(entry.name)) {
            structure.directories.push(relPath);
            await walk.call(this, fullPath, relPath);
          }
        } else {
          const ext = path.extname(entry.name);
          if (!this.ignoredExtensions.includes(ext)) {
            structure.filesByExtension[ext] = (structure.filesByExtension[ext] || 0) + 1;
            structure.totalFiles++;
          }
        }
      }
    }

    await walk.call(this, process.cwd());
    return structure;
  }

  async detectStack() {
    const stack = {
      primary: null,
      frameworks: [],
      packageManager: null,
      databases: [],
      devTools: []
    };

    // Detectar por archivos de configuración
    const files = await fs.readdir(process.cwd());
    
    if (files.includes('package.json')) {
      stack.primary = 'Node.js';
      stack.packageManager = files.includes('yarn.lock') ? 'yarn' : 
                            files.includes('pnpm-lock.yaml') ? 'pnpm' : 'npm';
      
      try {
        const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
        
        // Detectar frameworks
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.react) stack.frameworks.push('React');
        if (deps.vue) stack.frameworks.push('Vue');
        if (deps.express) stack.frameworks.push('Express');
        if (deps.next) stack.frameworks.push('Next.js');
        if (deps.vite) stack.devTools.push('Vite');
        if (deps.webpack) stack.devTools.push('Webpack');
        
        // Detectar bases de datos
        if (deps.sqlite3 || deps['better-sqlite3']) stack.databases.push('SQLite');
        if (deps.pg) stack.databases.push('PostgreSQL');
        if (deps.mysql || deps.mysql2) stack.databases.push('MySQL');
        if (deps.mongodb) stack.databases.push('MongoDB');
        if (deps['@supabase/supabase-js']) stack.databases.push('Supabase');
      } catch (e) {
        console.warn('⚠️ No se pudo leer package.json');
      }
    }
    
    if (files.includes('requirements.txt') || files.includes('Pipfile')) {
      stack.primary = stack.primary ? 'Polyglot' : 'Python';
    }
    
    if (files.includes('go.mod')) {
      stack.primary = stack.primary ? 'Polyglot' : 'Go';
    }

    return stack;
  }

  async detectScripts() {
    const scripts = {
      npm: {},
      make: [],
      custom: []
    };

    // Scripts de npm
    if (await this.fileExists('package.json')) {
      try {
        const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
        scripts.npm = pkg.scripts || {};
      } catch (e) {}
    }

    // Makefile
    if (await this.fileExists('Makefile')) {
      try {
        const makefile = await fs.readFile('Makefile', 'utf8');
        const targets = makefile.match(/^([a-zA-Z0-9_-]+):/gm);
        scripts.make = targets ? targets.map(t => t.replace(':', '')) : [];
      } catch (e) {}
    }

    // Scripts personalizados
    const scriptDirs = ['scripts', 'bin', '.github/scripts'];
    for (const dir of scriptDirs) {
      if (await this.fileExists(dir)) {
        try {
          const files = await fs.readdir(dir);
          scripts.custom.push(...files.filter(f => 
            f.endsWith('.sh') || f.endsWith('.js') || f.endsWith('.py')
          ).map(f => path.join(dir, f)));
        } catch (e) {}
      }
    }

    return scripts;
  }

  async findHotspots() {
    const hotspots = {
      todos: [],
      fixmes: [],
      deprecated: [],
      security: []
    };

    const patterns = {
      todos: /TODO[:\s]+(.+)/gi,
      fixmes: /FIXME[:\s]+(.+)/gi,
      deprecated: /@deprecated[:\s]+(.+)/gi,
      security: /(SECURITY|VULNERABLE|UNSAFE)[:\s]+(.+)/gi
    };

    async function searchFile(filePath) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          for (const [type, pattern] of Object.entries(patterns)) {
            const matches = line.match(pattern);
            if (matches) {
              hotspots[type].push({
                file: filePath,
                line: index + 1,
                text: matches[1] || matches[2] || line.trim()
              });
            }
          }
        });
      } catch (e) {}
    }

    async function walkForHotspots(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.ignoredDirs.includes(entry.name)) {
          await walkForHotspots.call(this, fullPath);
        } else if (entry.isFile() && !this.ignoredExtensions.includes(path.extname(entry.name))) {
          await searchFile(fullPath);
        }
      }
    }

    await walkForHotspots.call(this, process.cwd());
    return hotspots;
  }

  async findLargeFiles() {
    const largeFiles = [];
    const threshold = 100 * 1024; // 100KB

    async function checkFile(filePath) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.size > threshold) {
          largeFiles.push({
            path: filePath,
            size: stats.size,
            sizeHuman: `${(stats.size / 1024).toFixed(1)}KB`
          });
        }
      } catch (e) {}
    }

    async function walkForLargeFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.ignoredDirs.includes(entry.name)) {
          await walkForLargeFiles.call(this, fullPath);
        } else if (entry.isFile()) {
          await checkFile(fullPath);
        }
      }
    }

    await walkForLargeFiles.call(this, process.cwd());
    return largeFiles.sort((a, b) => b.size - a.size).slice(0, 20);
  }

  async analyzeDependencies() {
    const deps = {
      production: {},
      development: {},
      outdated: [],
      vulnerabilities: []
    };

    if (await this.fileExists('package.json')) {
      try {
        const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
        deps.production = pkg.dependencies || {};
        deps.development = pkg.devDependencies || {};

        // Intentar detectar dependencias desactualizadas
        try {
          const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
          if (outdated) {
            deps.outdated = Object.keys(JSON.parse(outdated));
          }
        } catch (e) {}

        // Intentar auditoría de seguridad
        try {
          const audit = execSync('npm audit --json', { encoding: 'utf8' });
          const auditData = JSON.parse(audit);
          if (auditData.vulnerabilities) {
            deps.vulnerabilities = Object.entries(auditData.vulnerabilities)
              .map(([name, data]) => ({
                name,
                severity: data.severity,
                via: data.via
              }));
          }
        } catch (e) {}
      } catch (e) {}
    }

    return deps;
  }

  async calculateMetrics() {
    const metrics = {
      linesOfCode: 0,
      fileCount: 0,
      avgFileSize: 0,
      codeComplexity: 'medium' // Simplificado para esta versión
    };

    let totalSize = 0;

    async function countLines(filePath) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n').length;
        metrics.linesOfCode += lines;
        metrics.fileCount++;
        totalSize += content.length;
      } catch (e) {}
    }

    async function walkForMetrics(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.ignoredDirs.includes(entry.name)) {
          await walkForMetrics.call(this, fullPath);
        } else if (entry.isFile() && this.isCodeFile(entry.name)) {
          await countLines(fullPath);
        }
      }
    }

    await walkForMetrics.call(this, process.cwd());
    
    if (metrics.fileCount > 0) {
      metrics.avgFileSize = Math.round(totalSize / metrics.fileCount);
    }

    return metrics;
  }

  async updateStateFile(analysis) {
    const statePath = path.join(process.cwd(), 'STATE.md');
    let content = '';

    if (await this.fileExists(statePath)) {
      content = await fs.readFile(statePath, 'utf8');
    }

    const analyzeSection = `
## ANALYZE
- **Timestamp**: ${analysis.timestamp}
- **Stack**: ${analysis.stack.primary} (${analysis.stack.frameworks.join(', ')})
- **Total Files**: ${analysis.structure.totalFiles}
- **Lines of Code**: ${analysis.metrics.linesOfCode}
- **TODOs**: ${analysis.hotspots.todos.length}
- **FIXMEs**: ${analysis.hotspots.fixmes.length}
- **Large Files**: ${analysis.largeFiles.length}
- **Dependencies**: ${Object.keys(analysis.dependencies.production).length} prod, ${Object.keys(analysis.dependencies.development).length} dev
${analysis.dependencies.vulnerabilities.length > 0 ? `- **Security Issues**: ${analysis.dependencies.vulnerabilities.length} vulnerabilities found` : ''}
`;

    // Reemplazar o agregar sección ANALYZE
    if (content.includes('## ANALYZE')) {
      content = content.replace(/## ANALYZE[\s\S]*?(?=##|$)/, analyzeSection + '\n');
    } else {
      content += '\n' + analyzeSection;
    }

    await fs.writeFile(statePath, content);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  isCodeFile(filename) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.java', '.c', '.cpp', '.cs', '.rb', '.php', '.swift', '.kt', '.rs', '.vue', '.svelte'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }
}

module.exports = AnalyzeAgent;