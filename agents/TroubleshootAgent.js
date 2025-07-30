const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class TroubleshootAgent {
  constructor() {
    this.reportPath = path.join(process.cwd(), 'report');
    this.troubleshootLog = path.join(this.reportPath, 'troubleshoot.log');
  }

  async execute(hint = '') {
    console.log('🔍 Iniciando diagnóstico de problemas...');
    if (hint) {
      console.log(`💡 Pista: ${hint}`);
    }

    // Crear directorio de reportes
    await fs.mkdir(this.reportPath, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      hint,
      system: await this.collectSystemInfo(),
      environment: await this.collectEnvironment(),
      logs: await this.collectLogs(),
      errors: await this.analyzeErrors(hint),
      dependencies: await this.checkDependencies(),
      processes: await this.checkProcesses(),
      diskSpace: await this.checkDiskSpace(),
      memory: await this.checkMemory(),
      recommendations: []
    };

    // Generar recomendaciones basadas en los hallazgos
    report.recommendations = this.generateRecommendations(report);

    // Guardar reporte
    await this.saveReport(report);

    console.log('✅ Diagnóstico completado');
    return report;
  }

  async collectSystemInfo() {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      npmVersion: null,
      osVersion: os.release(),
      cpus: os.cpus().length,
      hostname: os.hostname()
    };

    try {
      info.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch (e) {}

    return info;
  }

  async collectEnvironment() {
    const env = {
      nodeEnv: process.env.NODE_ENV || 'development',
      cwd: process.cwd(),
      path: process.env.PATH,
      relevantVars: {}
    };

    // Variables de entorno relevantes
    const relevantKeys = [
      'NODE_ENV', 'PORT', 'DATABASE_URL', 'API_KEY',
      'DEBUG', 'CI', 'GITHUB_ACTIONS', 'VERCEL'
    ];

    for (const key of relevantKeys) {
      if (process.env[key]) {
        // Ocultar valores sensibles
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
          env.relevantVars[key] = '***HIDDEN***';
        } else {
          env.relevantVars[key] = process.env[key];
        }
      }
    }

    return env;
  }

  async collectLogs() {
    const logs = {
      recent: [],
      errors: [],
      warnings: []
    };

    // Buscar archivos de log comunes
    const logPatterns = [
      '*.log',
      'logs/*.log',
      'npm-debug.log',
      'yarn-error.log',
      'lerna-debug.log'
    ];

    for (const pattern of logPatterns) {
      try {
        const files = await this.findFiles(pattern);
        for (const file of files) {
          const content = await this.readLastLines(file, 100);
          
          // Analizar contenido
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.toLowerCase().includes('error')) {
              logs.errors.push({ file, line: line.trim() });
            } else if (line.toLowerCase().includes('warn')) {
              logs.warnings.push({ file, line: line.trim() });
            }
          }
          
          logs.recent.push({
            file,
            lines: lines.slice(-10) // Últimas 10 líneas
          });
        }
      } catch (e) {}
    }

    // Obtener logs del sistema si es posible
    try {
      if (os.platform() === 'darwin') {
        // macOS system logs
        const syslog = execSync('log show --last 5m --predicate \'process == "node"\' 2>/dev/null || true', {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024
        });
        if (syslog) {
          logs.system = syslog.split('\n').slice(-50);
        }
      } else if (os.platform() === 'linux') {
        // Linux journalctl
        const journal = execSync('journalctl -u node -n 50 --no-pager 2>/dev/null || true', {
          encoding: 'utf8'
        });
        if (journal) {
          logs.system = journal.split('\n');
        }
      }
    } catch (e) {}

    return logs;
  }

  async analyzeErrors(hint) {
    const errors = {
      syntaxErrors: [],
      runtimeErrors: [],
      testFailures: [],
      buildErrors: [],
      lintErrors: []
    };

    // Buscar errores de sintaxis en archivos
    if (hint.includes('syntax') || hint.includes('parse')) {
      errors.syntaxErrors = await this.findSyntaxErrors();
    }

    // Analizar errores de tests recientes
    if (hint.includes('test') || hint === '') {
      const testReport = path.join(this.reportPath, 'test-results.json');
      try {
        const data = await fs.readFile(testReport, 'utf8');
        const results = JSON.parse(data);
        const recentFailures = results.filter(r => !r.success).slice(-5);
        errors.testFailures = recentFailures;
      } catch (e) {}
    }

    // Buscar errores de build
    if (hint.includes('build') || hint.includes('compile')) {
      errors.buildErrors = await this.findBuildErrors();
    }

    // Buscar errores de lint
    try {
      const lintOutput = execSync('npm run lint -- --format json 2>/dev/null || true', {
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024
      });
      if (lintOutput) {
        const lintResults = JSON.parse(lintOutput);
        errors.lintErrors = lintResults
          .filter(r => r.errorCount > 0)
          .map(r => ({
            file: r.filePath,
            errors: r.messages.filter(m => m.severity === 2)
          }));
      }
    } catch (e) {}

    return errors;
  }

  async checkDependencies() {
    const deps = {
      missing: [],
      outdated: [],
      vulnerabilities: [],
      conflicts: []
    };

    // Verificar dependencias faltantes
    try {
      execSync('npm ls --depth=0', { stdio: 'ignore' });
    } catch (e) {
      // npm ls falla si hay problemas
      const output = e.stdout?.toString() || '';
      const missing = output.match(/UNMET DEPENDENCY (.+)/g);
      if (missing) {
        deps.missing = missing.map(m => m.replace('UNMET DEPENDENCY ', ''));
      }
    }

    // Verificar vulnerabilidades
    try {
      const audit = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(audit);
      if (auditData.metadata.vulnerabilities) {
        const vulns = auditData.metadata.vulnerabilities;
        deps.vulnerabilities = {
          critical: vulns.critical || 0,
          high: vulns.high || 0,
          moderate: vulns.moderate || 0,
          low: vulns.low || 0
        };
      }
    } catch (e) {}

    // Verificar versiones de Node/npm
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      if (pkg.engines) {
        const currentNode = process.version;
        const requiredNode = pkg.engines.node;
        
        if (requiredNode && !this.satisfiesVersion(currentNode, requiredNode)) {
          deps.conflicts.push({
            type: 'node',
            current: currentNode,
            required: requiredNode
          });
        }
      }
    } catch (e) {}

    return deps;
  }

  async checkProcesses() {
    const processes = {
      node: [],
      ports: [],
      zombies: []
    };

    try {
      // Buscar procesos Node
      const psOutput = execSync('ps aux | grep node | grep -v grep', {
        encoding: 'utf8'
      });
      
      const lines = psOutput.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(/\s+/);
        processes.node.push({
          pid: parts[1],
          cpu: parts[2],
          mem: parts[3],
          command: parts.slice(10).join(' ')
        });
      }
    } catch (e) {}

    // Verificar puertos en uso
    const commonPorts = [3000, 3001, 4000, 5000, 8000, 8080];
    for (const port of commonPorts) {
      try {
        const lsof = execSync(`lsof -i :${port} | grep LISTEN`, {
          encoding: 'utf8'
        });
        if (lsof) {
          processes.ports.push({
            port,
            process: lsof.trim().split(/\s+/)[0]
          });
        }
      } catch (e) {}
    }

    return processes;
  }

  async checkDiskSpace() {
    const disk = {
      available: 0,
      used: 0,
      percentage: 0
    };

    try {
      const df = execSync('df -h . | tail -1', { encoding: 'utf8' });
      const parts = df.trim().split(/\s+/);
      
      disk.available = parts[3];
      disk.used = parts[2];
      disk.percentage = parseInt(parts[4]);
    } catch (e) {
      // Fallback para Windows
      try {
        const dir = execSync('dir /-c', { encoding: 'utf8' });
        const match = dir.match(/(\d+) bytes free/);
        if (match) {
          disk.available = `${Math.round(parseInt(match[1]) / 1024 / 1024 / 1024)}G`;
        }
      } catch (e2) {}
    }

    return disk;
  }

  async checkMemory() {
    const memory = {
      total: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'G',
      free: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'G',
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024) + 'G',
      percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
    };

    // Uso de memoria del proceso actual
    const usage = process.memoryUsage();
    memory.process = {
      rss: Math.round(usage.rss / 1024 / 1024) + 'M',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'M',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'M',
      external: Math.round(usage.external / 1024 / 1024) + 'M'
    };

    return memory;
  }

  async findSyntaxErrors() {
    const errors = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    
    try {
      // Usar ESLint si está disponible
      const files = execSync('find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -20', {
        encoding: 'utf8'
      }).trim().split('\n');

      for (const file of files) {
        try {
          // Intentar parsear con Node
          require(path.resolve(file));
        } catch (e) {
          if (e.message.includes('SyntaxError')) {
            errors.push({
              file,
              error: e.message,
              line: e.stack.split('\n')[0]
            });
          }
        }
      }
    } catch (e) {}

    return errors;
  }

  async findBuildErrors() {
    const errors = [];
    
    // Buscar logs de build recientes
    const buildLogs = ['build.log', 'dist/build.log', '.next/build-error.log'];
    
    for (const logFile of buildLogs) {
      try {
        const content = await fs.readFile(logFile, 'utf8');
        const errorLines = content.split('\n').filter(line => 
          line.includes('ERROR') || 
          line.includes('Failed') ||
          line.includes('Error:')
        );
        
        errors.push(...errorLines.map(line => ({
          source: logFile,
          error: line.trim()
        })));
      } catch (e) {}
    }

    return errors;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Recomendaciones basadas en sistema
    if (report.diskSpace.percentage > 90) {
      recommendations.push({
        severity: 'high',
        message: 'Espacio en disco bajo. Limpia archivos temporales y logs antiguos.',
        command: 'npm run clean && rm -rf node_modules && npm install'
      });
    }

    if (report.memory.percentage > 80) {
      recommendations.push({
        severity: 'medium',
        message: 'Uso de memoria alto. Considera cerrar aplicaciones no necesarias.',
        command: 'killall node && npm run dev'
      });
    }

    // Recomendaciones basadas en dependencias
    if (report.dependencies.missing.length > 0) {
      recommendations.push({
        severity: 'high',
        message: `Dependencias faltantes: ${report.dependencies.missing.join(', ')}`,
        command: 'npm install'
      });
    }

    if (report.dependencies.vulnerabilities.critical > 0) {
      recommendations.push({
        severity: 'critical',
        message: `${report.dependencies.vulnerabilities.critical} vulnerabilidades críticas detectadas`,
        command: 'npm audit fix'
      });
    }

    // Recomendaciones basadas en errores
    if (report.errors.syntaxErrors.length > 0) {
      recommendations.push({
        severity: 'high',
        message: 'Errores de sintaxis detectados en el código',
        command: 'npm run lint:fix'
      });
    }

    if (report.errors.testFailures.length > 0) {
      recommendations.push({
        severity: 'medium',
        message: 'Tests fallando. Revisa y corrige antes de continuar.',
        command: 'npm test -- --verbose'
      });
    }

    // Recomendaciones basadas en procesos
    const nodeProcesses = report.processes.node.filter(p => 
      parseFloat(p.cpu) > 80 || parseFloat(p.mem) > 10
    );
    
    if (nodeProcesses.length > 0) {
      recommendations.push({
        severity: 'medium',
        message: 'Procesos Node consumiendo muchos recursos',
        command: `kill ${nodeProcesses.map(p => p.pid).join(' ')}`
      });
    }

    // Recomendación general si no hay problemas específicos
    if (recommendations.length === 0) {
      recommendations.push({
        severity: 'info',
        message: 'No se detectaron problemas significativos',
        command: null
      });
    }

    return recommendations;
  }

  async saveReport(report) {
    // Guardar en JSON
    const jsonPath = path.join(this.reportPath, 'troubleshoot-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Guardar en log legible
    let logContent = `
TROUBLESHOOTING REPORT
=====================
Timestamp: ${report.timestamp}
Hint: ${report.hint || 'None'}

SYSTEM INFO
-----------
Platform: ${report.system.platform}
Node Version: ${report.system.nodeVersion}
NPM Version: ${report.system.npmVersion}
CPUs: ${report.system.cpus}

DISK SPACE
----------
Used: ${report.diskSpace.used}
Available: ${report.diskSpace.available}
Percentage: ${report.diskSpace.percentage}%

MEMORY
------
Total: ${report.memory.total}
Free: ${report.memory.free}
Used: ${report.memory.percentage}%

RECOMMENDATIONS
---------------
`;

    for (const rec of report.recommendations) {
      logContent += `\n[${rec.severity.toUpperCase()}] ${rec.message}`;
      if (rec.command) {
        logContent += `\n  → Run: ${rec.command}`;
      }
    }

    await fs.writeFile(this.troubleshootLog, logContent);
    console.log(`📄 Reporte guardado en: ${this.troubleshootLog}`);
  }

  // Utilidades
  async findFiles(pattern) {
    try {
      const output = execSync(`find . -name "${pattern}" -type f 2>/dev/null | head -20`, {
        encoding: 'utf8'
      });
      return output.trim().split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async readLastLines(filePath, lines = 100) {
    try {
      const output = execSync(`tail -n ${lines} "${filePath}"`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      });
      return output;
    } catch (e) {
      // Fallback: leer todo el archivo
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const allLines = content.split('\n');
        return allLines.slice(-lines).join('\n');
      } catch (e2) {
        return '';
      }
    }
  }

  satisfiesVersion(current, required) {
    // Simplificado: solo verifica versión mayor
    const currentMajor = parseInt(current.replace('v', '').split('.')[0]);
    const requiredMajor = parseInt(required.replace(/[^0-9]/g, ''));
    return currentMajor >= requiredMajor;
  }
}

module.exports = TroubleshootAgent;