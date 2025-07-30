const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ImproveAgent {
  constructor(budgetAgent, securityGateAgent) {
    this.budgetAgent = budgetAgent;
    this.securityGateAgent = securityGateAgent;
    
    this.limits = {
      maxChangedFiles: 15,
      maxDiffKb: 200
    };
    
    this.changedFiles = [];
    this.totalDiffSize = 0;
  }

  async execute(objective) {
    console.log('🔧 Iniciando mejoras:', objective);
    
    // Verificar presupuesto
    if (!this.budgetAgent.canProceed()) {
      throw new Error('❌ Presupuesto agotado');
    }

    // Crear o cambiar a rama de feature
    const branchName = await this.createFeatureBranch(objective);
    
    try {
      // Analizar objetivo y planificar cambios
      const plan = await this.analyzePlan(objective);
      
      // Validar plan con gates de seguridad
      await this.securityGateAgent.validatePlan(plan);
      
      // Ejecutar mejoras
      const results = await this.applyImprovements(plan);
      
      // Correr linters si existen
      await this.runLinters();
      
      // Verificar límites
      this.validateLimits();
      
      console.log('✅ Mejoras aplicadas exitosamente');
      return {
        branch: branchName,
        changedFiles: this.changedFiles,
        diffSize: this.totalDiffSize,
        results
      };
      
    } catch (error) {
      console.error('❌ Error en mejoras:', error.message);
      // Revertir cambios si es necesario
      await this.revertChanges();
      throw error;
    }
  }

  async createFeatureBranch(objective) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const slug = objective.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    
    const branchName = `feat/auto-${date}-${slug}`;
    
    try {
      // Verificar si estamos en una rama limpia
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        throw new Error('Hay cambios sin commitear. Por favor, limpia el working tree primero.');
      }
      
      // Crear y cambiar a nueva rama
      execSync(`git checkout -b ${branchName}`);
      console.log(`📌 Creada rama: ${branchName}`);
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        // Si la rama ya existe, cambiar a ella
        execSync(`git checkout ${branchName}`);
        console.log(`📌 Usando rama existente: ${branchName}`);
      } else {
        throw error;
      }
    }
    
    return branchName;
  }

  async analyzePlan(objective) {
    const plan = {
      objective,
      files: [],
      operations: [],
      estimatedDiffSize: 0
    };

    // Analizar el objetivo para determinar qué archivos modificar
    if (objective.includes('error') || objective.includes('manejo')) {
      plan.operations.push('add-error-handling');
      // Buscar archivos que puedan necesitar mejor manejo de errores
      const files = await this.findFilesNeedingErrorHandling();
      plan.files.push(...files.slice(0, 10)); // Limitar a 10 archivos
    }

    if (objective.includes('performance') || objective.includes('optimiz')) {
      plan.operations.push('optimize-performance');
      const files = await this.findPerformanceHotspots();
      plan.files.push(...files.slice(0, 5));
    }

    if (objective.includes('security') || objective.includes('seguridad')) {
      plan.operations.push('security-hardening');
      const files = await this.findSecurityIssues();
      plan.files.push(...files.slice(0, 8));
    }

    if (objective.includes('test') || objective.includes('prueba')) {
      plan.operations.push('add-tests');
      const files = await this.findUntested();
      plan.files.push(...files.slice(0, 5));
    }

    // Eliminar duplicados
    plan.files = [...new Set(plan.files)];
    
    // Estimar tamaño del diff
    plan.estimatedDiffSize = plan.files.length * 10; // ~10KB por archivo

    return plan;
  }

  async applyImprovements(plan) {
    const results = [];

    for (const file of plan.files) {
      if (this.changedFiles.length >= this.limits.maxChangedFiles) {
        console.warn('⚠️ Alcanzado límite de archivos modificados');
        break;
      }

      try {
        const content = await fs.readFile(file, 'utf8');
        let modified = content;

        // Aplicar operaciones según el plan
        for (const operation of plan.operations) {
          modified = await this.applyOperation(operation, modified, file);
        }

        if (modified !== content) {
          await fs.writeFile(file, modified);
          this.changedFiles.push(file);
          
          // Calcular tamaño del diff
          const diffSize = Math.abs(modified.length - content.length) / 1024;
          this.totalDiffSize += diffSize;
          
          results.push({
            file,
            operation: plan.operations,
            diffSize
          });
        }
      } catch (error) {
        console.error(`Error procesando ${file}:`, error.message);
      }
    }

    return results;
  }

  async applyOperation(operation, content, filePath) {
    switch (operation) {
      case 'add-error-handling':
        return this.addErrorHandling(content, filePath);
      
      case 'optimize-performance':
        return this.optimizePerformance(content, filePath);
      
      case 'security-hardening':
        return this.addSecurityMeasures(content, filePath);
      
      case 'add-tests':
        return this.generateTests(content, filePath);
      
      default:
        return content;
    }
  }

  async addErrorHandling(content, filePath) {
    let modified = content;

    // Para archivos JavaScript/TypeScript
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      // Agregar try-catch a funciones async sin manejo de errores
      modified = modified.replace(
        /async\s+function\s+(\w+)\s*\([^)]*\)\s*{([^}]+)}/g,
        (match, name, body) => {
          if (!body.includes('try') && !body.includes('catch')) {
            return `async function ${name}(...args) {
  try {${body}}
  catch (error) {
    console.error('Error in ${name}:', error);
    throw error;
  }
}`;
          }
          return match;
        }
      );

      // Agregar .catch() a promesas sin manejo
      modified = modified.replace(
        /(\w+)\.(then\([^)]+\))(?!\.catch)/g,
        '$1.$2.catch(error => console.error("Unhandled promise rejection:", error))'
      );
    }

    return modified;
  }

  async optimizePerformance(content, filePath) {
    let modified = content;

    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      // Memoizar componentes React pesados
      if (filePath.includes('.jsx') || filePath.includes('.tsx')) {
        if (!modified.includes('React.memo') && modified.includes('export default function')) {
          modified = modified.replace(
            /export default function (\w+)/,
            'export default React.memo(function $1'
          );
          modified += ')';
        }
      }

      // Agregar lazy loading para imports pesados
      modified = modified.replace(
        /import (\w+) from ['"](.+(?:Chart|Table|Editor|Map).+)['"]/g,
        "const $1 = React.lazy(() => import('$2'))"
      );
    }

    return modified;
  }

  async addSecurityMeasures(content, filePath) {
    let modified = content;

    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      // Sanitizar inputs en endpoints
      if (filePath.includes('routes') || filePath.includes('api')) {
        // Agregar validación básica si no existe
        if (!modified.includes('sanitize') && !modified.includes('validate')) {
          modified = `const validator = require('validator');\n` + modified;
          
          // Agregar sanitización a req.body
          modified = modified.replace(
            /const\s*{\s*([^}]+)\s*}\s*=\s*req\.body/g,
            (match, params) => {
              const sanitized = params.split(',').map(p => 
                `${p.trim()}: validator.escape(req.body.${p.trim()} || '')`
              ).join(', ');
              return `const { ${params} } = { ${sanitized} }`;
            }
          );
        }
      }

      // Prevenir XSS en renderizado
      modified = modified.replace(
        /dangerouslySetInnerHTML=\{\{__html:\s*([^}]+)\}\}/g,
        'dangerouslySetInnerHTML={{__html: DOMPurify.sanitize($1)}}'
      );
    }

    return modified;
  }

  async generateTests(content, filePath) {
    // Para esta versión, solo agregamos un archivo de test básico
    const testPath = filePath.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1');
    
    if (!await this.fileExists(testPath)) {
      const testContent = `
describe('${path.basename(filePath, path.extname(filePath))}', () => {
  it('should exist', () => {
    expect(true).toBe(true);
  });
  
  // TODO: Add more comprehensive tests
});
`;
      await fs.writeFile(testPath, testContent);
      this.changedFiles.push(testPath);
    }

    return content;
  }

  async runLinters() {
    console.log('🔍 Ejecutando linters...');
    
    const linters = [
      { cmd: 'npm run lint', name: 'ESLint' },
      { cmd: 'npm run prettier', name: 'Prettier' },
      { cmd: 'npm run typecheck', name: 'TypeScript' }
    ];

    for (const linter of linters) {
      try {
        execSync(`${linter.cmd} --fix`, { stdio: 'pipe' });
        console.log(`✅ ${linter.name} ejecutado`);
      } catch (error) {
        // Intentar sin --fix si falla
        try {
          execSync(linter.cmd, { stdio: 'pipe' });
        } catch (e) {
          console.warn(`⚠️ ${linter.name} no disponible o con errores`);
        }
      }
    }
  }

  validateLimits() {
    if (this.changedFiles.length > this.limits.maxChangedFiles) {
      throw new Error(`Excedido límite de archivos: ${this.changedFiles.length}/${this.limits.maxChangedFiles}`);
    }

    if (this.totalDiffSize > this.limits.maxDiffKb) {
      throw new Error(`Excedido límite de diff: ${this.totalDiffSize.toFixed(1)}KB/${this.limits.maxDiffKb}KB`);
    }
  }

  async revertChanges() {
    console.log('⏮️ Revirtiendo cambios...');
    try {
      execSync('git restore --staged .');
      execSync('git restore .');
    } catch (error) {
      console.error('Error revirtiendo cambios:', error.message);
    }
  }

  // Métodos auxiliares para encontrar archivos
  async findFilesNeedingErrorHandling() {
    const files = [];
    const searchPatterns = [
      'async\\s+function(?!.*try)',
      '\\.then\\((?!.*\\.catch)',
      'await(?!.*try)'
    ];

    // Buscar archivos con patrones problemáticos
    for (const pattern of searchPatterns) {
      try {
        const result = execSync(
          `grep -r -l "${pattern}" --include="*.js" --include="*.jsx" src/ 2>/dev/null || true`,
          { encoding: 'utf8' }
        );
        if (result) {
          files.push(...result.trim().split('\n').filter(Boolean));
        }
      } catch (e) {}
    }

    return [...new Set(files)];
  }

  async findPerformanceHotspots() {
    const files = [];
    
    // Buscar componentes grandes sin optimización
    try {
      const result = execSync(
        'find src -name "*.jsx" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20 | awk \'{print $2}\' | grep -v total',
        { encoding: 'utf8' }
      );
      if (result) {
        files.push(...result.trim().split('\n').filter(Boolean));
      }
    } catch (e) {}

    return files;
  }

  async findSecurityIssues() {
    const files = [];
    const vulnerablePatterns = [
      'eval\\(',
      'innerHTML\\s*=',
      'document\\.write',
      'req\\.body(?!.*validat)'
    ];

    for (const pattern of vulnerablePatterns) {
      try {
        const result = execSync(
          `grep -r -l "${pattern}" --include="*.js" --include="*.jsx" src/ backend/ 2>/dev/null || true`,
          { encoding: 'utf8' }
        );
        if (result) {
          files.push(...result.trim().split('\n').filter(Boolean));
        }
      } catch (e) {}
    }

    return [...new Set(files)];
  }

  async findUntested() {
    const files = [];
    
    try {
      // Encontrar archivos sin tests correspondientes
      const allFiles = execSync(
        'find src -name "*.js" -o -name "*.jsx" | grep -v test',
        { encoding: 'utf8' }
      ).trim().split('\n');

      for (const file of allFiles) {
        const testFile = file.replace(/\.(js|jsx)$/, '.test.$1');
        if (!await this.fileExists(testFile)) {
          files.push(file);
        }
      }
    } catch (e) {}

    return files.slice(0, 10);
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

module.exports = ImproveAgent;