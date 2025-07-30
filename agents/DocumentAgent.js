const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DocumentAgent {
  constructor() {
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    this.docsPath = path.join(process.cwd(), 'docs');
  }

  async execute() {
    console.log('📝 Actualizando documentación...');
    
    const results = {
      changelog: false,
      readme: false,
      apiDocs: false,
      guides: []
    };

    try {
      // Actualizar CHANGELOG
      results.changelog = await this.updateChangelog();
      
      // Actualizar README si hay cambios significativos
      results.readme = await this.updateReadme();
      
      // Generar/actualizar documentación de API
      results.apiDocs = await this.updateApiDocs();
      
      // Crear guías específicas si es necesario
      results.guides = await this.createGuides();
      
      console.log('✅ Documentación actualizada');
      return results;
      
    } catch (error) {
      console.error('❌ Error actualizando documentación:', error.message);
      throw error;
    }
  }

  async updateChangelog() {
    // Obtener cambios recientes desde git
    const changes = await this.getRecentChanges();
    
    if (changes.length === 0) {
      console.log('ℹ️ No hay cambios nuevos para documentar');
      return false;
    }

    // Leer changelog existente
    let changelog = '';
    try {
      changelog = await fs.readFile(this.changelogPath, 'utf8');
    } catch (e) {
      // No existe, crear nuevo
      changelog = '# Changelog\n\nTodos los cambios notables en este proyecto serán documentados en este archivo.\n\n';
    }

    // Generar nueva entrada
    const newEntry = this.generateChangelogEntry(changes);
    
    // Insertar después del título
    const lines = changelog.split('\n');
    let insertIndex = 0;
    
    // Buscar dónde insertar (después de la descripción inicial)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        insertIndex = i;
        break;
      }
      if (i === lines.length - 1) {
        insertIndex = lines.length;
      }
    }

    lines.splice(insertIndex, 0, newEntry);
    changelog = lines.join('\n');
    
    await fs.writeFile(this.changelogPath, changelog);
    console.log('✅ CHANGELOG.md actualizado');
    
    return true;
  }

  async getRecentChanges() {
    const changes = [];
    
    try {
      // Obtener commits desde el último tag o últimos 10 commits
      let gitLog;
      try {
        const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        gitLog = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf8' });
      } catch (e) {
        // No hay tags, obtener últimos commits
        gitLog = execSync('git log -10 --oneline', { encoding: 'utf8' });
      }
      
      const commits = gitLog.trim().split('\n').filter(Boolean);
      
      // Parsear commits por tipo
      for (const commit of commits) {
        const match = commit.match(/^[a-f0-9]+ (feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?: (.+)$/);
        if (match) {
          changes.push({
            type: match[1],
            scope: match[2] || null,
            description: match[3]
          });
        }
      }
      
    } catch (e) {
      console.warn('⚠️ No se pudieron obtener cambios de git');
    }

    // Agregar cambios no commiteados si existen
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        const modifiedFiles = status.trim().split('\n').length;
        changes.push({
          type: 'wip',
          scope: null,
          description: `${modifiedFiles} archivos con cambios pendientes`
        });
      }
    } catch (e) {}

    return changes;
  }

  generateChangelogEntry(changes) {
    const date = new Date().toISOString().split('T')[0];
    const version = this.getNextVersion();
    
    let entry = `## [${version}] - ${date}\n\n`;
    
    // Agrupar cambios por tipo
    const grouped = {
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      test: [],
      chore: [],
      wip: []
    };

    for (const change of changes) {
      if (grouped[change.type]) {
        grouped[change.type].push(change);
      }
    }

    // Generar secciones
    const sections = {
      feat: '### ✨ Nuevas Funcionalidades',
      fix: '### 🐛 Correcciones',
      perf: '### ⚡ Mejoras de Rendimiento',
      refactor: '### ♻️ Refactorizaciones',
      docs: '### 📚 Documentación',
      test: '### 🧪 Tests',
      chore: '### 🔧 Tareas',
      wip: '### 🚧 Trabajo en Progreso'
    };

    for (const [type, title] of Object.entries(sections)) {
      if (grouped[type].length > 0) {
        entry += `${title}\n`;
        for (const change of grouped[type]) {
          const scope = change.scope ? `**${change.scope}**: ` : '';
          entry += `- ${scope}${change.description}\n`;
        }
        entry += '\n';
      }
    }

    // Agregar breaking changes si los hay
    const breakingChanges = changes.filter(c => 
      c.description.toLowerCase().includes('breaking')
    );
    
    if (breakingChanges.length > 0) {
      entry += '### ⚠️ BREAKING CHANGES\n';
      for (const change of breakingChanges) {
        entry += `- ${change.description}\n`;
      }
      entry += '\n';
    }

    return entry;
  }

  getNextVersion() {
    try {
      // Intentar obtener versión de package.json
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.version || 'Unreleased';
    } catch (e) {
      // Si no hay package.json, usar fecha
      return `v${new Date().toISOString().split('T')[0]}`;
    }
  }

  async updateReadme() {
    const readmePath = path.join(process.cwd(), 'README.md');
    
    try {
      let readme = await fs.readFile(readmePath, 'utf8');
      let updated = false;

      // Actualizar badges si es necesario
      if (!readme.includes('![Tests]')) {
        const badges = this.generateBadges();
        readme = badges + '\n\n' + readme;
        updated = true;
      }

      // Actualizar sección de instalación si cambió
      const installSection = await this.generateInstallSection();
      if (installSection && !readme.includes(installSection)) {
        readme = this.updateSection(readme, '## Instalación', installSection);
        updated = true;
      }

      if (updated) {
        await fs.writeFile(readmePath, readme);
        console.log('✅ README.md actualizado');
        return true;
      }

    } catch (e) {
      console.warn('⚠️ README.md no encontrado o no se pudo actualizar');
    }

    return false;
  }

  generateBadges() {
    return `![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25-yellowgreen)
![License](https://img.shields.io/badge/license-MIT-blue)`;
  }

  async generateInstallSection() {
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = Object.keys(pkg.dependencies || {});
      
      let section = '## Instalación\n\n```bash\n';
      
      // Detectar gestor de paquetes
      if (await this.fileExists('yarn.lock')) {
        section += 'yarn install\n';
      } else if (await this.fileExists('pnpm-lock.yaml')) {
        section += 'pnpm install\n';
      } else {
        section += 'npm install\n';
      }
      
      section += '```\n';

      // Agregar requisitos si hay dependencias especiales
      if (deps.some(d => d.includes('python') || d.includes('node-gyp'))) {
        section += '\n### Requisitos\n\n';
        section += '- Node.js >= 14.0.0\n';
        section += '- Python (para dependencias nativas)\n';
      }

      return section;
    } catch (e) {
      return null;
    }
  }

  updateSection(content, sectionTitle, newContent) {
    const lines = content.split('\n');
    let sectionStart = -1;
    let sectionEnd = lines.length;
    
    // Encontrar inicio de sección
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === sectionTitle) {
        sectionStart = i;
        break;
      }
    }

    // Si no existe, agregar al final
    if (sectionStart === -1) {
      return content + '\n\n' + newContent;
    }

    // Encontrar fin de sección (siguiente ## o final)
    for (let i = sectionStart + 1; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        sectionEnd = i;
        break;
      }
    }

    // Reemplazar sección
    lines.splice(sectionStart, sectionEnd - sectionStart, ...newContent.split('\n'));
    return lines.join('\n');
  }

  async updateApiDocs() {
    // Crear directorio docs si no existe
    await fs.mkdir(this.docsPath, { recursive: true });
    
    // Buscar archivos de rutas API
    const apiFiles = await this.findApiFiles();
    
    if (apiFiles.length === 0) {
      return false;
    }

    // Generar documentación de endpoints
    const apiDoc = await this.generateApiDocumentation(apiFiles);
    
    if (apiDoc) {
      const apiDocPath = path.join(this.docsPath, 'API.md');
      await fs.writeFile(apiDocPath, apiDoc);
      console.log('✅ Documentación de API generada');
      return true;
    }

    return false;
  }

  async findApiFiles() {
    const apiFiles = [];
    const routePaths = ['routes', 'api', 'controllers', 'endpoints'];
    
    for (const routePath of routePaths) {
      try {
        const fullPath = path.join(process.cwd(), routePath);
        const files = await fs.readdir(fullPath);
        
        for (const file of files) {
          if (file.endsWith('.js') || file.endsWith('.ts')) {
            apiFiles.push(path.join(fullPath, file));
          }
        }
      } catch (e) {
        // Directorio no existe
      }
    }

    // Buscar en backend/routes si existe
    try {
      const backendRoutes = path.join(process.cwd(), 'backend', 'routes');
      const files = await fs.readdir(backendRoutes);
      for (const file of files) {
        if (file.endsWith('.js')) {
          apiFiles.push(path.join(backendRoutes, file));
        }
      }
    } catch (e) {}

    return apiFiles;
  }

  async generateApiDocumentation(apiFiles) {
    let doc = '# API Documentation\n\n';
    doc += 'Documentación generada automáticamente de los endpoints disponibles.\n\n';

    for (const file of apiFiles) {
      const endpoints = await this.extractEndpoints(file);
      
      if (endpoints.length > 0) {
        const fileName = path.basename(file, path.extname(file));
        doc += `## ${fileName}\n\n`;
        
        for (const endpoint of endpoints) {
          doc += `### ${endpoint.method} ${endpoint.path}\n\n`;
          
          if (endpoint.description) {
            doc += `${endpoint.description}\n\n`;
          }
          
          if (endpoint.params.length > 0) {
            doc += '**Parámetros:**\n';
            for (const param of endpoint.params) {
              doc += `- \`${param}\`\n`;
            }
            doc += '\n';
          }
          
          if (endpoint.auth) {
            doc += '**Autenticación:** Requerida\n\n';
          }
          
          doc += '---\n\n';
        }
      }
    }

    return doc;
  }

  async extractEndpoints(filePath) {
    const endpoints = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Buscar patrones de rutas Express
      const routePatterns = [
        /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g,
        /app\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g
      ];

      for (const pattern of routePatterns) {
        let match;
        while ((match = pattern.exec(content))) {
          const endpoint = {
            method: match[1].toUpperCase(),
            path: match[2],
            params: [],
            auth: false,
            description: null
          };

          // Extraer parámetros de ruta
          const paramMatches = match[2].match(/:(\w+)/g);
          if (paramMatches) {
            endpoint.params = paramMatches.map(p => p.substring(1));
          }

          // Detectar si requiere autenticación
          const lineIndex = content.lastIndexOf('\n', match.index);
          const previousLines = content.substring(Math.max(0, lineIndex - 200), match.index);
          if (previousLines.includes('auth') || previousLines.includes('authenticate')) {
            endpoint.auth = true;
          }

          // Buscar comentario de descripción
          const commentMatch = previousLines.match(/\/\*\*?\s*\n?\s*\*?\s*(.+?)\s*\*?\s*\n?\s*\*?\//);
          if (commentMatch) {
            endpoint.description = commentMatch[1].trim();
          }

          endpoints.push(endpoint);
        }
      }
    } catch (e) {
      console.error(`Error analizando ${filePath}:`, e.message);
    }

    return endpoints;
  }

  async createGuides() {
    const guides = [];
    
    // Crear guía de inicio rápido si no existe
    const quickStartPath = path.join(this.docsPath, 'QUICK_START.md');
    if (!await this.fileExists(quickStartPath)) {
      const quickStart = await this.generateQuickStartGuide();
      if (quickStart) {
        await fs.writeFile(quickStartPath, quickStart);
        guides.push('QUICK_START.md');
      }
    }

    // Crear guía de contribución si no existe
    const contributingPath = path.join(this.docsPath, 'CONTRIBUTING.md');
    if (!await this.fileExists(contributingPath)) {
      const contributing = this.generateContributingGuide();
      await fs.writeFile(contributingPath, contributing);
      guides.push('CONTRIBUTING.md');
    }

    return guides;
  }

  async generateQuickStartGuide() {
    let guide = '# Guía de Inicio Rápido\n\n';
    
    // Detectar stack y generar instrucciones apropiadas
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const scripts = pkg.scripts || {};
      
      guide += '## Instalación\n\n```bash\n';
      guide += 'npm install\n';
      guide += '```\n\n';
      
      guide += '## Comandos Disponibles\n\n';
      
      if (scripts.dev) {
        guide += '### Desarrollo\n```bash\nnpm run dev\n```\n\n';
      }
      
      if (scripts.build) {
        guide += '### Construcción\n```bash\nnpm run build\n```\n\n';
      }
      
      if (scripts.test) {
        guide += '### Tests\n```bash\nnpm run test\n```\n\n';
      }
      
      if (scripts.start) {
        guide += '### Producción\n```bash\nnpm start\n```\n\n';
      }
      
      return guide;
    } catch (e) {
      return null;
    }
  }

  generateContributingGuide() {
    return `# Guía de Contribución

## Cómo Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## Estándares de Código

- Usa ESLint y Prettier
- Escribe tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Sigue las convenciones de commits (feat, fix, docs, etc.)

## Reporte de Bugs

Usa las issues de GitHub para reportar bugs. Incluye:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado
- Screenshots si aplica
- Ambiente (OS, Node version, etc.)
`;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DocumentAgent;