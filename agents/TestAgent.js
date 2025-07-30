const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class TestAgent {
  constructor(budgetAgent) {
    this.budgetAgent = budgetAgent;
    this.timeout = 600; // 600 segundos = 10 minutos
    this.maxRetries = 1; // Reintento para tests flakey
    this.baselineCoverage = null;
  }

  async execute() {
    console.log('🧪 Ejecutando suite de tests...');
    
    // Verificar presupuesto
    if (!this.budgetAgent.canProceed()) {
      throw new Error('❌ Presupuesto agotado');
    }

    // Detectar stack y comando de test
    const testCommand = await this.detectTestCommand();
    if (!testCommand) {
      console.warn('⚠️ No se detectó comando de test');
      return {
        success: true,
        message: 'No test suite detected',
        coverage: null
      };
    }

    // Obtener baseline de cobertura si existe
    await this.loadBaselineCoverage();

    // Ejecutar tests
    const results = await this.runTests(testCommand);
    
    // Verificar resultados
    if (!results.success && this.maxRetries > 0) {
      console.log('🔄 Reintentando tests flakey...');
      const retryResults = await this.runTests(testCommand);
      if (retryResults.success) {
        results.success = true;
        results.flakeyTests = true;
      }
    }

    // Verificar cobertura
    if (results.coverage && this.baselineCoverage) {
      const coverageDrop = this.calculateCoverageDrop(results.coverage);
      if (coverageDrop > 2) {
        results.success = false;
        results.error = `Cobertura bajó ${coverageDrop.toFixed(1)}% (máximo permitido: 2%)`;
      }
    }

    // Guardar nueva baseline si los tests pasaron
    if (results.success && results.coverage) {
      await this.saveBaselineCoverage(results.coverage);
    }

    console.log(results.success ? '✅ Tests completados exitosamente' : '❌ Tests fallaron');
    return results;
  }

  async detectTestCommand() {
    // Intentar detectar desde package.json
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const scripts = pkg.scripts || {};
      
      // Buscar scripts de test comunes
      const testScripts = ['test', 'test:unit', 'test:all', 'test:ci'];
      for (const script of testScripts) {
        if (scripts[script] && !scripts[script].includes('--watch')) {
          return `npm run ${script}`;
        }
      }
    } catch (e) {}

    // Intentar detectar herramientas de test directamente
    const testRunners = [
      { cmd: 'jest', check: 'jest --version' },
      { cmd: 'mocha', check: 'mocha --version' },
      { cmd: 'vitest', check: 'vitest --version' },
      { cmd: 'pytest', check: 'pytest --version' },
      { cmd: 'go test', check: 'go version' }
    ];

    for (const runner of testRunners) {
      try {
        execSync(runner.check, { stdio: 'ignore' });
        return runner.cmd;
      } catch (e) {}
    }

    return null;
  }

  async runTests(command) {
    const results = {
      success: false,
      exitCode: null,
      duration: 0,
      coverage: null,
      failedTests: [],
      output: ''
    };

    const startTime = Date.now();

    try {
      // Configurar variables de entorno para CI
      const env = {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'test',
        FORCE_COLOR: '0'
      };

      // Ejecutar tests con timeout
      const output = await this.executeWithTimeout(command, this.timeout, env);
      
      results.success = true;
      results.exitCode = 0;
      results.output = output;

      // Extraer información de cobertura si está disponible
      results.coverage = this.extractCoverage(output);

      // Extraer tests fallados si hay
      results.failedTests = this.extractFailedTests(output);

    } catch (error) {
      results.success = false;
      results.exitCode = error.code || 1;
      results.error = error.message;
      results.output = error.output || '';
      
      // Intentar extraer información útil del error
      results.failedTests = this.extractFailedTests(results.output);
    }

    results.duration = Math.round((Date.now() - startTime) / 1000);
    
    // Guardar log de tests
    await this.saveTestLog(results);

    return results;
  }

  async executeWithTimeout(command, timeoutSeconds, env) {
    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      let timedOut = false;

      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        env,
        shell: true
      });

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 5000);
      }, timeoutSeconds * 1000);

      child.stdout.on('data', (data) => {
        output += data.toString();
        // Mostrar progreso en tiempo real
        process.stdout.write('.');
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        console.log(''); // Nueva línea después de los puntos

        if (timedOut) {
          reject({
            code: 124,
            message: `Tests excedieron timeout de ${timeoutSeconds}s`,
            output: output + errorOutput
          });
        } else if (code !== 0) {
          reject({
            code,
            message: `Tests fallaron con código ${code}`,
            output: output + errorOutput
          });
        } else {
          resolve(output);
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject({
          code: 1,
          message: error.message,
          output: output + errorOutput
        });
      });
    });
  }

  extractCoverage(output) {
    const coverage = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    };

    // Patrones para diferentes herramientas de cobertura
    const patterns = {
      // Jest/Vitest
      jest: /All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/,
      // NYC/Istanbul
      nyc: /Statements\s*:\s*([\d.]+)%.*Branches\s*:\s*([\d.]+)%.*Functions\s*:\s*([\d.]+)%.*Lines\s*:\s*([\d.]+)%/,
      // Go
      go: /coverage:\s*([\d.]+)%/,
      // Python coverage.py
      python: /TOTAL\s+\d+\s+\d+\s+([\d.]+)%/
    };

    for (const [tool, pattern] of Object.entries(patterns)) {
      const match = output.match(pattern);
      if (match) {
        if (tool === 'jest' || tool === 'nyc') {
          coverage.statements = parseFloat(match[1]);
          coverage.branches = parseFloat(match[2]);
          coverage.functions = parseFloat(match[3]);
          coverage.lines = parseFloat(match[4]);
        } else {
          // Para herramientas con cobertura simple
          coverage.lines = parseFloat(match[1]);
          coverage.statements = coverage.lines;
          coverage.branches = coverage.lines;
          coverage.functions = coverage.lines;
        }
        return coverage;
      }
    }

    return null;
  }

  extractFailedTests(output) {
    const failed = [];
    
    // Patrones para diferentes formatos de error
    const patterns = [
      // Jest/Vitest
      /FAIL\s+(.+\.(?:js|jsx|ts|tsx|test|spec))\s*\n\s*●\s*(.+)/g,
      // Mocha
      /\d+\)\s+(.+)\n\s+(.+Error:.+)/g,
      // Go
      /--- FAIL:\s+(\w+)\s+\([\d.]+s\)\s*\n\s*(.+)/g,
      // Python pytest
      /FAILED\s+(.+)::\s*(.+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(output))) {
        failed.push({
          file: match[1],
          test: match[2].trim()
        });
      }
    }

    return failed;
  }

  async loadBaselineCoverage() {
    try {
      const coverageFile = path.join(process.cwd(), 'report', 'baseline-coverage.json');
      const data = await fs.readFile(coverageFile, 'utf8');
      this.baselineCoverage = JSON.parse(data);
    } catch (e) {
      // No hay baseline, es la primera vez
      this.baselineCoverage = null;
    }
  }

  async saveBaselineCoverage(coverage) {
    const reportDir = path.join(process.cwd(), 'report');
    await fs.mkdir(reportDir, { recursive: true });
    
    const coverageFile = path.join(reportDir, 'baseline-coverage.json');
    await fs.writeFile(coverageFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      coverage
    }, null, 2));
  }

  calculateCoverageDrop(currentCoverage) {
    if (!this.baselineCoverage || !this.baselineCoverage.coverage) {
      return 0;
    }

    const baseline = this.baselineCoverage.coverage;
    const current = currentCoverage;

    // Calcular promedio de caída en todas las métricas
    const drops = [
      baseline.statements - current.statements,
      baseline.branches - current.branches,
      baseline.functions - current.functions,
      baseline.lines - current.lines
    ].filter(d => !isNaN(d));

    if (drops.length === 0) return 0;
    
    return drops.reduce((sum, d) => sum + d, 0) / drops.length;
  }

  async saveTestLog(results) {
    const reportDir = path.join(process.cwd(), 'report');
    await fs.mkdir(reportDir, { recursive: true });
    
    const logFile = path.join(reportDir, 'test-results.json');
    
    // Cargar resultados anteriores si existen
    let history = [];
    try {
      const data = await fs.readFile(logFile, 'utf8');
      history = JSON.parse(data);
    } catch (e) {}

    // Agregar nuevo resultado
    history.push({
      timestamp: new Date().toISOString(),
      success: results.success,
      duration: results.duration,
      coverage: results.coverage,
      failedTests: results.failedTests.length,
      exitCode: results.exitCode
    });

    // Mantener solo los últimos 50 resultados
    if (history.length > 50) {
      history = history.slice(-50);
    }

    await fs.writeFile(logFile, JSON.stringify(history, null, 2));
  }
}

module.exports = TestAgent;