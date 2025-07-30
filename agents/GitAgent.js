const { execSync } = require('child_process');

class GitAgent {
  constructor(securityGateAgent) {
    this.securityGateAgent = securityGateAgent;
    
    // Comandos permitidos sin aprobación
    this.allowedCommands = [
      'status',
      'add -A',
      'commit -m',
      'push --set-upstream origin feat/',
      'restore --staged .',
      'diff',
      'log',
      'branch',
      'checkout -b'
    ];
    
    // Comandos prohibidos (requieren aprobación especial)
    this.prohibitedCommands = [
      'push origin main',
      'push origin master',
      'reset --hard',
      'rebase -i',
      'force-push',
      'push --force'
    ];
  }

  async execute(gitCommand) {
    console.log(`🔀 Ejecutando comando git: ${gitCommand}`);
    
    // Validar comando
    const validation = await this.validateCommand(gitCommand);
    if (!validation.allowed) {
      throw new Error(`❌ Comando git no permitido: ${validation.reason}`);
    }

    // Solicitar aprobación si es necesario
    if (validation.needsApproval) {
      const approval = await this.securityGateAgent.validateOperation(
        `git ${gitCommand}`,
        { gitCommand: true }
      );
      
      if (!approval.approved) {
        throw new Error('❌ Comando git rechazado por gate de seguridad');
      }
    }

    try {
      // Ejecutar comando
      const result = await this.executeGitCommand(gitCommand);
      
      // Post-procesamiento según comando
      if (gitCommand.startsWith('commit')) {
        await this.validateCommitMessage(gitCommand);
      }
      
      console.log('✅ Comando git ejecutado exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error ejecutando git:', error.message);
      throw error;
    }
  }

  async validateCommand(gitCommand) {
    // Verificar si es comando prohibido
    for (const prohibited of this.prohibitedCommands) {
      if (gitCommand.includes(prohibited)) {
        return {
          allowed: true, // Permitido con aprobación
          needsApproval: true,
          reason: `Comando peligroso: ${prohibited}`
        };
      }
    }

    // Verificar si es comando permitido
    const isAllowed = this.allowedCommands.some(allowed => 
      gitCommand.startsWith(allowed) || gitCommand === allowed
    );

    if (!isAllowed) {
      // Comando no está en lista blanca, requiere aprobación
      return {
        allowed: true,
        needsApproval: true,
        reason: 'Comando no está en lista de permitidos'
      };
    }

    // Validaciones específicas
    if (gitCommand.startsWith('push')) {
      // Solo permitir push a ramas feat/*
      if (!gitCommand.includes('feat/')) {
        return {
          allowed: true,
          needsApproval: true,
          reason: 'Push a rama que no es feat/*'
        };
      }
    }

    return {
      allowed: true,
      needsApproval: false
    };
  }

  async executeGitCommand(command) {
    const result = {
      command: `git ${command}`,
      output: '',
      success: false,
      changes: null
    };

    try {
      // Comandos especiales que necesitan manejo diferente
      if (command.startsWith('commit -m')) {
        result.output = await this.handleCommit(command);
      } else if (command === 'status') {
        result.output = await this.handleStatus();
      } else if (command === 'diff') {
        result.output = await this.handleDiff();
      } else {
        // Comando genérico
        result.output = execSync(`git ${command}`, { 
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
      }
      
      result.success = true;
      
      // Obtener información adicional según comando
      if (command.startsWith('add')) {
        result.changes = await this.getStagedFiles();
      } else if (command.startsWith('commit')) {
        result.changes = await this.getLastCommit();
      } else if (command.startsWith('push')) {
        result.changes = await this.getPushInfo();
      }
      
    } catch (error) {
      result.output = error.stdout || error.message;
      result.success = false;
      throw new Error(`Git command failed: ${error.message}`);
    }

    return result;
  }

  async handleCommit(command) {
    // Extraer mensaje del commit
    const messageMatch = command.match(/-m\s+["'](.+)["']/);
    if (!messageMatch) {
      throw new Error('Mensaje de commit inválido');
    }

    const message = messageMatch[1];
    
    // Validar formato de mensaje
    this.validateCommitMessageFormat(message);
    
    // Ejecutar commit
    return execSync(`git ${command}`, { encoding: 'utf8' });
  }

  validateCommitMessageFormat(message) {
    // Validar conventional commits
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+$/;
    
    if (!conventionalPattern.test(message)) {
      console.warn('⚠️ Mensaje de commit no sigue formato conventional commits');
      console.log('Formato esperado: tipo(scope): descripción');
      console.log('Tipos válidos: feat, fix, docs, style, refactor, perf, test, chore');
    }

    // Validar longitud
    const firstLine = message.split('\n')[0];
    if (firstLine.length > 72) {
      console.warn('⚠️ Primera línea del commit muy larga (>72 caracteres)');
    }

    // Detectar posibles problemas
    if (message.toLowerCase().includes('wip') || 
        message.toLowerCase().includes('todo')) {
      console.warn('⚠️ Commit contiene trabajo en progreso (WIP/TODO)');
    }
  }

  async handleStatus() {
    const status = execSync('git status', { encoding: 'utf8' });
    
    // Parsear status para información estructurada
    const parsed = {
      branch: '',
      ahead: 0,
      behind: 0,
      staged: [],
      modified: [],
      untracked: []
    };

    const lines = status.split('\n');
    let section = '';
    
    for (const line of lines) {
      if (line.includes('On branch')) {
        parsed.branch = line.match(/On branch (.+)/)[1];
      } else if (line.includes('ahead of')) {
        const match = line.match(/by (\d+) commit/);
        if (match) parsed.ahead = parseInt(match[1]);
      } else if (line.includes('behind')) {
        const match = line.match(/by (\d+) commit/);
        if (match) parsed.behind = parseInt(match[1]);
      } else if (line.includes('Changes to be committed:')) {
        section = 'staged';
      } else if (line.includes('Changes not staged for commit:')) {
        section = 'modified';
      } else if (line.includes('Untracked files:')) {
        section = 'untracked';
      } else if (line.trim() && section && line.startsWith('\t')) {
        parsed[section].push(line.trim());
      }
    }

    // Generar resumen
    let summary = status + '\n\n📊 Resumen:\n';
    summary += `- Rama: ${parsed.branch}\n`;
    if (parsed.ahead > 0) summary += `- Adelante por ${parsed.ahead} commits\n`;
    if (parsed.behind > 0) summary += `- Atrás por ${parsed.behind} commits\n`;
    summary += `- Archivos staged: ${parsed.staged.length}\n`;
    summary += `- Archivos modificados: ${parsed.modified.length}\n`;
    summary += `- Archivos sin trackear: ${parsed.untracked.length}\n`;

    return summary;
  }

  async handleDiff() {
    try {
      // Primero intentar diff de archivos staged
      const stagedDiff = execSync('git diff --cached --stat', { encoding: 'utf8' });
      
      // Luego diff de archivos no staged
      const unstagedDiff = execSync('git diff --stat', { encoding: 'utf8' });
      
      let result = '';
      
      if (stagedDiff.trim()) {
        result += '📌 Cambios staged:\n' + stagedDiff + '\n';
      }
      
      if (unstagedDiff.trim()) {
        result += '📝 Cambios no staged:\n' + unstagedDiff + '\n';
      }
      
      if (!result) {
        result = 'No hay cambios para mostrar';
      }
      
      // Agregar resumen
      const stats = await this.getDiffStats();
      result += `\n📊 Total: +${stats.additions} -${stats.deletions} en ${stats.files} archivos`;
      
      return result;
    } catch (error) {
      return 'No hay cambios para mostrar';
    }
  }

  async getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async getLastCommit() {
    try {
      const output = execSync('git log -1 --oneline', { encoding: 'utf8' });
      return output.trim();
    } catch (e) {
      return null;
    }
  }

  async getPushInfo() {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const remote = execSync(`git config branch.${branch}.remote`, { encoding: 'utf8' }).trim();
      const commits = execSync(`git log origin/${branch}..HEAD --oneline`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);
      
      return {
        branch,
        remote,
        commits: commits.length,
        commitList: commits
      };
    } catch (e) {
      return null;
    }
  }

  async getDiffStats() {
    try {
      const output = execSync('git diff --shortstat', { encoding: 'utf8' });
      const match = output.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
      
      return {
        files: parseInt(match[1]) || 0,
        additions: parseInt(match[2]) || 0,
        deletions: parseInt(match[3]) || 0
      };
    } catch (e) {
      return { files: 0, additions: 0, deletions: 0 };
    }
  }

  // Métodos de utilidad para comandos comunes
  async status() {
    return this.execute('status');
  }

  async add(files = '-A') {
    return this.execute(`add ${files}`);
  }

  async commit(message) {
    return this.execute(`commit -m "${message}"`);
  }

  async push(branch) {
    if (!branch) {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      branch = currentBranch;
    }
    
    return this.execute(`push --set-upstream origin ${branch}`);
  }

  async createBranch(branchName) {
    return this.execute(`checkout -b ${branchName}`);
  }

  async restore() {
    return this.execute('restore --staged .');
  }

  // Método para flujo completo de commit
  async commitFlow(message, files = '-A') {
    console.log('🔄 Iniciando flujo de commit...');
    
    try {
      // 1. Agregar archivos
      await this.add(files);
      
      // 2. Mostrar status
      const status = await this.status();
      console.log(status.output);
      
      // 3. Commit
      await this.commit(message);
      
      // 4. Obtener información del commit
      const lastCommit = await this.getLastCommit();
      console.log(`✅ Commit creado: ${lastCommit}`);
      
      return {
        success: true,
        commit: lastCommit
      };
      
    } catch (error) {
      console.error('❌ Error en flujo de commit:', error.message);
      // Intentar restaurar
      await this.restore();
      throw error;
    }
  }
}

module.exports = GitAgent;