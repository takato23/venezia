const fs = require('fs').promises;
const path = require('path');

class BudgetAgent {
  constructor() {
    this.budget = {
      iterations: 3,
      seconds: 1200, // 20 minutos
      maxChangedFiles: 15,
      maxDiffKb: 200
    };

    this.consumed = {
      iterations: 0,
      seconds: 0,
      changedFiles: 0,
      diffKb: 0
    };

    this.startTime = Date.now();
    this.history = [];
    this.stopConditions = {
      noImprovementCycles: 0,
      testFailureRate: 0
    };
  }

  async initialize() {
    // Cargar estado previo si existe
    await this.loadState();
    
    // Registrar inicio de nueva sesión
    this.addHistoryEntry('session_start', {
      timestamp: new Date().toISOString(),
      budget: this.budget
    });
  }

  canProceed() {
    // Verificar límites duros
    if (this.consumed.iterations >= this.budget.iterations) {
      console.log('❌ Límite de iteraciones alcanzado');
      return false;
    }

    if (this.getElapsedSeconds() >= this.budget.seconds) {
      console.log('❌ Límite de tiempo alcanzado');
      return false;
    }

    if (this.consumed.changedFiles >= this.budget.maxChangedFiles) {
      console.log('❌ Límite de archivos modificados alcanzado');
      return false;
    }

    if (this.consumed.diffKb >= this.budget.maxDiffKb) {
      console.log('❌ Límite de tamaño de diff alcanzado');
      return false;
    }

    // Verificar condiciones de parada
    if (this.stopConditions.noImprovementCycles >= 2) {
      console.log('❌ Sin mejoras en 2 ciclos consecutivos');
      return false;
    }

    if (this.stopConditions.testFailureRate > 0.5) {
      console.log('❌ Tasa de fallos de tests > 50%');
      return false;
    }

    return true;
  }

  consumeIteration() {
    this.consumed.iterations++;
    this.addHistoryEntry('iteration_consumed', {
      iteration: this.consumed.iterations,
      remaining: this.budget.iterations - this.consumed.iterations
    });
  }

  consumeFiles(count) {
    this.consumed.changedFiles += count;
    this.addHistoryEntry('files_consumed', {
      count,
      total: this.consumed.changedFiles,
      remaining: this.budget.maxChangedFiles - this.consumed.changedFiles
    });
  }

  consumeDiff(sizeKb) {
    this.consumed.diffKb += sizeKb;
    this.addHistoryEntry('diff_consumed', {
      sizeKb,
      total: this.consumed.diffKb,
      remaining: this.budget.maxDiffKb - this.consumed.diffKb
    });
  }

  recordTestResult(success, improvements = false) {
    if (!success) {
      this.stopConditions.testFailureRate = 
        (this.stopConditions.testFailureRate * this.consumed.iterations + 1) / 
        (this.consumed.iterations + 1);
    }

    if (!improvements) {
      this.stopConditions.noImprovementCycles++;
    } else {
      this.stopConditions.noImprovementCycles = 0;
    }

    this.addHistoryEntry('test_result', {
      success,
      improvements,
      failureRate: this.stopConditions.testFailureRate,
      noImprovementCycles: this.stopConditions.noImprovementCycles
    });
  }

  getElapsedSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getRemainingBudget() {
    return {
      iterations: Math.max(0, this.budget.iterations - this.consumed.iterations),
      seconds: Math.max(0, this.budget.seconds - this.getElapsedSeconds()),
      files: Math.max(0, this.budget.maxChangedFiles - this.consumed.changedFiles),
      diffKb: Math.max(0, this.budget.maxDiffKb - this.consumed.diffKb)
    };
  }

  getStatus() {
    const remaining = this.getRemainingBudget();
    const percentages = {
      iterations: (this.consumed.iterations / this.budget.iterations) * 100,
      time: (this.getElapsedSeconds() / this.budget.seconds) * 100,
      files: (this.consumed.changedFiles / this.budget.maxChangedFiles) * 100,
      diff: (this.consumed.diffKb / this.budget.maxDiffKb) * 100
    };

    return {
      consumed: this.consumed,
      remaining,
      percentages,
      elapsed: this.getElapsedSeconds(),
      stopConditions: this.stopConditions,
      canProceed: this.canProceed()
    };
  }

  async saveState() {
    const statePath = path.join(process.cwd(), 'report', 'budget-state.json');
    const state = {
      timestamp: new Date().toISOString(),
      budget: this.budget,
      consumed: this.consumed,
      elapsed: this.getElapsedSeconds(),
      stopConditions: this.stopConditions,
      history: this.history.slice(-100) // Últimas 100 entradas
    };

    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  }

  async loadState() {
    try {
      const statePath = path.join(process.cwd(), 'report', 'budget-state.json');
      const data = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(data);

      // Solo cargar si es de la misma sesión (menos de 30 minutos)
      const stateAge = Date.now() - new Date(state.timestamp).getTime();
      if (stateAge < 30 * 60 * 1000) {
        this.consumed = state.consumed;
        this.stopConditions = state.stopConditions;
        this.history = state.history || [];
        console.log('📊 Estado de presupuesto restaurado');
      }
    } catch (e) {
      // No hay estado previo o es inválido
    }
  }

  addHistoryEntry(type, data) {
    this.history.push({
      timestamp: new Date().toISOString(),
      type,
      data
    });
  }

  generateReport() {
    const status = this.getStatus();
    const report = {
      summary: {
        totalIterations: this.consumed.iterations,
        totalTime: `${Math.floor(this.getElapsedSeconds() / 60)}m ${this.getElapsedSeconds() % 60}s`,
        totalFiles: this.consumed.changedFiles,
        totalDiff: `${this.consumed.diffKb.toFixed(1)} KB`,
        completed: !this.canProceed()
      },
      budgetUsage: {
        iterations: `${status.percentages.iterations.toFixed(1)}%`,
        time: `${status.percentages.time.toFixed(1)}%`,
        files: `${status.percentages.files.toFixed(1)}%`,
        diff: `${status.percentages.diff.toFixed(1)}%`
      },
      stopReason: this.getStopReason(),
      timeline: this.generateTimeline()
    };

    return report;
  }

  getStopReason() {
    if (this.consumed.iterations >= this.budget.iterations) {
      return 'Límite de iteraciones alcanzado';
    }
    if (this.getElapsedSeconds() >= this.budget.seconds) {
      return 'Límite de tiempo alcanzado';
    }
    if (this.consumed.changedFiles >= this.budget.maxChangedFiles) {
      return 'Límite de archivos alcanzado';
    }
    if (this.consumed.diffKb >= this.budget.maxDiffKb) {
      return 'Límite de diff alcanzado';
    }
    if (this.stopConditions.noImprovementCycles >= 2) {
      return 'Sin mejoras en ciclos consecutivos';
    }
    if (this.stopConditions.testFailureRate > 0.5) {
      return 'Alta tasa de fallos en tests';
    }
    return 'En progreso';
  }

  generateTimeline() {
    const timeline = [];
    let currentIteration = 0;

    for (const entry of this.history) {
      if (entry.type === 'iteration_consumed') {
        currentIteration = entry.data.iteration;
        timeline.push({
          iteration: currentIteration,
          timestamp: entry.timestamp,
          events: []
        });
      } else if (timeline.length > 0) {
        timeline[timeline.length - 1].events.push({
          type: entry.type,
          data: entry.data
        });
      }
    }

    return timeline;
  }

  // Métodos de configuración dinámica
  adjustBudget(changes) {
    const oldBudget = { ...this.budget };
    Object.assign(this.budget, changes);
    
    this.addHistoryEntry('budget_adjusted', {
      old: oldBudget,
      new: this.budget,
      changes
    });

    console.log('📊 Presupuesto ajustado:', changes);
  }

  reset() {
    this.consumed = {
      iterations: 0,
      seconds: 0,
      changedFiles: 0,
      diffKb: 0
    };
    this.stopConditions = {
      noImprovementCycles: 0,
      testFailureRate: 0
    };
    this.startTime = Date.now();
    this.history = [];
    
    console.log('🔄 Presupuesto reiniciado');
  }
}

module.exports = BudgetAgent;