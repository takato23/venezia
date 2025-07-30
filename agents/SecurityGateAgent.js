const readline = require('readline');

class SecurityGateAgent {
  constructor() {
    this.gates = {
      dependencies: {
        level: 'high',
        patterns: ['npm install', 'yarn add', 'pip install', 'go get'],
        message: 'Instalación/actualización de dependencias'
      },
      database: {
        level: 'critical',
        patterns: ['migrate', 'seed', 'drop', 'truncate', 'alter table'],
        message: 'Operación de base de datos'
      },
      deletion: {
        level: 'high',
        patterns: ['rm -rf', 'del /f', 'shutil.rmtree'],
        message: 'Eliminación masiva de archivos'
      },
      secrets: {
        level: 'critical',
        patterns: ['.env', 'secrets', 'credentials', 'private key', 'password'],
        message: 'Acceso a información sensible'
      },
      cicd: {
        level: 'high',
        patterns: ['.github/workflows', '.gitlab-ci', 'Jenkinsfile', 'buildspec'],
        message: 'Modificación de CI/CD'
      },
      production: {
        level: 'critical',
        patterns: ['push origin main', 'push origin master', 'deploy prod'],
        message: 'Despliegue a producción'
      }
    };

    this.approvalCache = new Map(); // Cache de aprobaciones por sesión
  }

  async validateOperation(operation, context = {}) {
    const violations = this.detectViolations(operation, context);
    
    if (violations.length === 0) {
      return { approved: true };
    }

    // Verificar si ya fue aprobado en esta sesión
    const cacheKey = this.getCacheKey(violations);
    if (this.approvalCache.has(cacheKey)) {
      console.log('✅ Usando aprobación previa de la sesión');
      return { approved: true, cached: true };
    }

    // Solicitar aprobación
    const approval = await this.requestApproval(violations);
    
    if (approval.approved) {
      this.approvalCache.set(cacheKey, true);
    }

    return approval;
  }

  async validatePlan(plan) {
    const violations = [];

    // Verificar operaciones planeadas
    for (const operation of plan.operations || []) {
      const opViolations = this.detectViolations(operation);
      violations.push(...opViolations);
    }

    // Verificar archivos a modificar
    for (const file of plan.files || []) {
      const fileViolations = this.detectFileViolations(file);
      violations.push(...fileViolations);
    }

    if (violations.length === 0) {
      return { approved: true };
    }

    return await this.requestApproval(violations);
  }

  detectViolations(operation, context = {}) {
    const violations = [];
    const operationLower = operation.toLowerCase();

    for (const [gateName, gate] of Object.entries(this.gates)) {
      for (const pattern of gate.patterns) {
        if (operationLower.includes(pattern.toLowerCase())) {
          violations.push({
            gate: gateName,
            level: gate.level,
            message: gate.message,
            pattern: pattern,
            operation
          });
        }
      }
    }

    // Verificaciones adicionales basadas en contexto
    if (context.fileCount && context.fileCount > 5) {
      violations.push({
        gate: 'bulk_operation',
        level: 'medium',
        message: `Operación masiva: ${context.fileCount} archivos`,
        operation
      });
    }

    if (context.outsideSource && operation.includes('mv')) {
      violations.push({
        gate: 'file_movement',
        level: 'high',
        message: 'Movimiento de archivos fuera de src/',
        operation
      });
    }

    return violations;
  }

  detectFileViolations(filePath) {
    const violations = [];

    // Archivos sensibles
    const sensitiveFiles = [
      '.env', '.env.local', '.env.production',
      'secrets.json', 'credentials.json',
      '.ssh', '.gnupg',
      'id_rsa', 'id_ed25519'
    ];

    const fileName = filePath.split('/').pop();
    if (sensitiveFiles.some(sensitive => fileName.includes(sensitive))) {
      violations.push({
        gate: 'sensitive_file',
        level: 'critical',
        message: `Acceso a archivo sensible: ${fileName}`,
        file: filePath
      });
    }

    // Archivos de CI/CD
    if (filePath.includes('.github/workflows') || 
        filePath.includes('.gitlab-ci') ||
        filePath.includes('Jenkinsfile')) {
      violations.push({
        gate: 'cicd_file',
        level: 'high',
        message: `Modificación de CI/CD: ${filePath}`,
        file: filePath
      });
    }

    return violations;
  }

  async requestApproval(violations) {
    console.log('\n🚨 GATE DE SEGURIDAD ACTIVADO 🚨');
    console.log('Se requiere aprobación para las siguientes operaciones:');
    
    // Agrupar por nivel
    const criticalViolations = violations.filter(v => v.level === 'critical');
    const highViolations = violations.filter(v => v.level === 'high');
    const mediumViolations = violations.filter(v => v.level === 'medium');

    if (criticalViolations.length > 0) {
      console.log('\n❗ CRÍTICAS:');
      criticalViolations.forEach(v => {
        console.log(`  - ${v.message}`);
        if (v.operation) console.log(`    Operación: ${v.operation}`);
        if (v.file) console.log(`    Archivo: ${v.file}`);
      });
    }

    if (highViolations.length > 0) {
      console.log('\n⚠️  ALTAS:');
      highViolations.forEach(v => {
        console.log(`  - ${v.message}`);
        if (v.operation) console.log(`    Operación: ${v.operation}`);
        if (v.file) console.log(`    Archivo: ${v.file}`);
      });
    }

    if (mediumViolations.length > 0) {
      console.log('\n📋 MEDIAS:');
      mediumViolations.forEach(v => {
        console.log(`  - ${v.message}`);
      });
    }

    // Si hay violaciones críticas, requerir confirmación explícita
    if (criticalViolations.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Hay operaciones CRÍTICAS que requieren confirmación explícita.');
    }

    const response = await this.prompt('\n¿Aprobar estas operaciones? (s/n): ');
    const approved = response.toLowerCase() === 's' || response.toLowerCase() === 'si';

    if (!approved) {
      console.log('❌ Operación cancelada por el usuario');
    } else {
      console.log('✅ Operación aprobada');
    }

    return {
      approved,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  getCacheKey(violations) {
    // Crear una clave única basada en los gates violados
    const gates = violations.map(v => v.gate).sort().join('|');
    return `gates:${gates}`;
  }

  clearApprovalCache() {
    this.approvalCache.clear();
    console.log('🔄 Cache de aprobaciones limpiado');
  }

  // Método para verificar si una operación específica necesita aprobación
  needsApproval(operation) {
    const violations = this.detectViolations(operation);
    return violations.length > 0;
  }

  // Método para obtener el nivel de riesgo de una operación
  getRiskLevel(operation) {
    const violations = this.detectViolations(operation);
    if (violations.length === 0) return 'safe';
    
    const hasClitical = violations.some(v => v.level === 'critical');
    if (hasClitical) return 'critical';
    
    const hasHigh = violations.some(v => v.level === 'high');
    if (hasHigh) return 'high';
    
    return 'medium';
  }
}

module.exports = SecurityGateAgent;