const fs = require('fs').promises;
const path = require('path');

class StateAgent {
  constructor() {
    this.statePath = path.join(process.cwd(), 'STATE.md');
    this.stateJsonPath = path.join(process.cwd(), 'report', 'state.json');
    
    this.currentState = 'IDLE';
    this.context = {};
    this.history = [];
    this.transitions = [];
  }

  async loadState() {
    // Cargar estado desde JSON si existe
    try {
      const data = await fs.readFile(this.stateJsonPath, 'utf8');
      const savedState = JSON.parse(data);
      
      this.currentState = savedState.currentState || 'IDLE';
      this.context = savedState.context || {};
      this.history = savedState.history || [];
      this.transitions = savedState.transitions || [];
      
      console.log('📂 Estado cargado desde sesión anterior');
      return true;
    } catch (e) {
      // No hay estado previo
      console.log('🆕 Iniciando con estado limpio');
      return false;
    }
  }

  async saveState() {
    const stateData = {
      timestamp: new Date().toISOString(),
      currentState: this.currentState,
      context: this.context,
      history: this.history.slice(-100), // Últimas 100 entradas
      transitions: this.transitions.slice(-50) // Últimas 50 transiciones
    };

    // Guardar JSON
    await fs.mkdir(path.dirname(this.stateJsonPath), { recursive: true });
    await fs.writeFile(this.stateJsonPath, JSON.stringify(stateData, null, 2));

    // Actualizar STATE.md
    await this.updateStateMarkdown();
  }

  async updateState(newState, newContext = {}) {
    const oldState = this.currentState;
    
    // Registrar transición
    this.transitions.push({
      timestamp: new Date().toISOString(),
      from: oldState,
      to: newState,
      trigger: newContext.trigger || 'manual'
    });

    // Actualizar estado
    this.currentState = newState;
    
    // Merge contexto
    this.context = {
      ...this.context,
      ...newContext,
      lastUpdate: new Date().toISOString()
    };

    // Agregar a historial
    this.history.push({
      timestamp: new Date().toISOString(),
      state: newState,
      event: `Transición: ${oldState} → ${newState}`,
      context: newContext
    });

    // Guardar
    await this.saveState();
    
    console.log(`📊 Estado actualizado: ${oldState} → ${newState}`);
  }

  async updateStateMarkdown() {
    let content = '# STATE.md - Estado del Sistema Autónomo\n\n';
    
    content += `**Última actualización**: ${new Date().toISOString()}\n`;
    content += `**Estado actual**: ${this.currentState}\n\n`;

    // Sección de análisis (si existe)
    if (this.context.analysis) {
      content += '## ANALYZE\n';
      content += `- **Timestamp**: ${this.context.analysis.timestamp}\n`;
      content += `- **Stack**: ${this.context.analysis.stack?.primary || 'Unknown'}\n`;
      content += `- **Total Files**: ${this.context.analysis.structure?.totalFiles || 0}\n`;
      content += `- **Lines of Code**: ${this.context.analysis.metrics?.linesOfCode || 0}\n`;
      
      if (this.context.analysis.hotspots) {
        content += `- **TODOs**: ${this.context.analysis.hotspots.todos?.length || 0}\n`;
        content += `- **FIXMEs**: ${this.context.analysis.hotspots.fixmes?.length || 0}\n`;
      }
      content += '\n';
    }

    // Sección de mejoras
    if (this.context.lastImprovement) {
      content += '## IMPROVE\n';
      content += `- **Objetivo**: ${this.context.lastImprovement.objective || 'N/A'}\n`;
      content += `- **Rama**: ${this.context.lastImprovement.branch || 'N/A'}\n`;
      content += `- **Archivos modificados**: ${this.context.lastImprovement.changedFiles?.length || 0}\n`;
      content += `- **Tamaño del diff**: ${this.context.lastImprovement.diffSize?.toFixed(1) || 0} KB\n`;
      content += '\n';
    }

    // Sección de tests
    if (this.context.lastTest) {
      content += '## TEST\n';
      content += `- **Estado**: ${this.context.lastTest.success ? '✅ Exitoso' : '❌ Fallido'}\n`;
      content += `- **Duración**: ${this.context.lastTest.duration || 0}s\n`;
      
      if (this.context.lastTest.coverage) {
        const cov = this.context.lastTest.coverage;
        content += `- **Cobertura**: Lines ${cov.lines}%, Branches ${cov.branches}%, Functions ${cov.functions}%\n`;
      }
      
      if (this.context.lastTest.failedTests?.length > 0) {
        content += `- **Tests fallidos**: ${this.context.lastTest.failedTests.length}\n`;
      }
      content += '\n';
    }

    // Sección de git
    if (this.context.lastGit) {
      content += '## GIT\n';
      content += `- **Último comando**: ${this.context.lastGit.command || 'N/A'}\n`;
      content += `- **Estado**: ${this.context.lastGit.success ? '✅ Exitoso' : '❌ Fallido'}\n`;
      
      if (this.context.lastGit.changes) {
        content += `- **Cambios**: ${JSON.stringify(this.context.lastGit.changes)}\n`;
      }
      content += '\n';
    }

    // Sección de troubleshooting
    if (this.context.troubleshoot) {
      content += '## TROUBLESHOOT\n';
      content += `- **Timestamp**: ${this.context.troubleshoot.timestamp}\n`;
      
      if (this.context.troubleshoot.recommendations?.length > 0) {
        content += '- **Recomendaciones**:\n';
        for (const rec of this.context.troubleshoot.recommendations) {
          content += `  - [${rec.severity}] ${rec.message}\n`;
        }
      }
      content += '\n';
    }

    // Historial de transiciones
    content += '## TRANSICIONES RECIENTES\n\n';
    const recentTransitions = this.transitions.slice(-10).reverse();
    for (const trans of recentTransitions) {
      content += `- ${trans.timestamp}: ${trans.from} → ${trans.to} (${trans.trigger})\n`;
    }
    content += '\n';

    // Máquina de estados
    content += '## MÁQUINA DE ESTADOS\n\n';
    content += '```mermaid\n';
    content += 'stateDiagram-v2\n';
    content += '    [*] --> IDLE\n';
    content += '    IDLE --> ANALYZE: /sc:analyze\n';
    content += '    ANALYZE --> PLAN: analysis complete\n';
    content += '    PLAN --> IMPROVE: plan approved\n';
    content += '    IMPROVE --> TEST: changes applied\n';
    content += '    TEST --> IMPROVE: tests failed\n';
    content += '    TEST --> DOCUMENT: tests passed\n';
    content += '    IMPROVE --> TROUBLESHOOT: errors\n';
    content += '    TROUBLESHOOT --> IMPROVE: fixed\n';
    content += '    DOCUMENT --> GIT: docs updated\n';
    content += '    GIT --> DONE: committed\n';
    content += '    DONE --> IDLE: reset\n';
    content += '    \n';
    content += `    state "${this.currentState}" as current\n`;
    content += '    current --> [*]: stop\n';
    content += '```\n\n';

    // Presupuesto
    if (this.context.budget) {
      content += '## PRESUPUESTO\n\n';
      const budget = this.context.budget;
      content += `- **Iteraciones**: ${budget.consumed?.iterations || 0}/${budget.budget?.iterations || 3}\n`;
      content += `- **Tiempo**: ${budget.consumed?.seconds || 0}s/${budget.budget?.seconds || 1200}s\n`;
      content += `- **Archivos**: ${budget.consumed?.changedFiles || 0}/${budget.budget?.maxChangedFiles || 15}\n`;
      content += `- **Diff**: ${budget.consumed?.diffKb || 0}KB/${budget.budget?.maxDiffKb || 200}KB\n`;
      content += '\n';
    }

    // Métricas de sesión
    content += '## MÉTRICAS DE SESIÓN\n\n';
    content += `- **Estados visitados**: ${new Set(this.history.map(h => h.state)).size}\n`;
    content += `- **Transiciones totales**: ${this.transitions.length}\n`;
    content += `- **Eventos procesados**: ${this.history.length}\n`;
    
    // Calcular tiempo en cada estado
    const stateTime = this.calculateStateTime();
    if (Object.keys(stateTime).length > 0) {
      content += '- **Tiempo por estado**:\n';
      for (const [state, time] of Object.entries(stateTime)) {
        content += `  - ${state}: ${time.toFixed(1)}s\n`;
      }
    }
    content += '\n';

    // Guardar archivo
    await fs.writeFile(this.statePath, content);
  }

  calculateStateTime() {
    const stateTime = {};
    
    for (let i = 0; i < this.transitions.length; i++) {
      const current = this.transitions[i];
      const next = this.transitions[i + 1];
      
      if (next) {
        const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000;
        stateTime[current.to] = (stateTime[current.to] || 0) + duration;
      }
    }
    
    // Tiempo en estado actual
    if (this.transitions.length > 0) {
      const lastTransition = this.transitions[this.transitions.length - 1];
      const currentDuration = (Date.now() - new Date(lastTransition.timestamp)) / 1000;
      stateTime[this.currentState] = (stateTime[this.currentState] || 0) + currentDuration;
    }
    
    return stateTime;
  }

  // Métodos de consulta
  getLastState() {
    return this.currentState;
  }

  getContext() {
    return { ...this.context };
  }

  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  getTransitions(limit = 20) {
    return this.transitions.slice(-limit);
  }

  // Análisis de patrones
  analyzePatterns() {
    const patterns = {
      commonTransitions: {},
      stateFrequency: {},
      errorStates: [],
      successRate: 0
    };

    // Analizar transiciones comunes
    for (const trans of this.transitions) {
      const key = `${trans.from}->${trans.to}`;
      patterns.commonTransitions[key] = (patterns.commonTransitions[key] || 0) + 1;
    }

    // Frecuencia de estados
    for (const item of this.history) {
      patterns.stateFrequency[item.state] = (patterns.stateFrequency[item.state] || 0) + 1;
    }

    // Estados de error
    patterns.errorStates = this.history.filter(h => 
      h.state === 'STOP' || 
      h.state === 'TROUBLESHOOT' ||
      h.context?.error
    );

    // Tasa de éxito
    const doneCount = this.history.filter(h => h.state === 'DONE').length;
    const stopCount = this.history.filter(h => h.state === 'STOP').length;
    const total = doneCount + stopCount;
    
    if (total > 0) {
      patterns.successRate = (doneCount / total) * 100;
    }

    return patterns;
  }

  // Predicción del siguiente estado
  predictNextState() {
    const currentState = this.currentState;
    const predictions = {};

    // Buscar transiciones históricas desde el estado actual
    const relevantTransitions = this.transitions.filter(t => t.from === currentState);
    
    for (const trans of relevantTransitions) {
      predictions[trans.to] = (predictions[trans.to] || 0) + 1;
    }

    // Convertir a probabilidades
    const total = Object.values(predictions).reduce((sum, count) => sum + count, 0);
    
    if (total > 0) {
      for (const state in predictions) {
        predictions[state] = (predictions[state] / total) * 100;
      }
    }

    return predictions;
  }

  // Método para limpiar estado
  async reset() {
    this.currentState = 'IDLE';
    this.context = {};
    this.history = [];
    this.transitions = [];
    
    await this.saveState();
    console.log('🔄 Estado reiniciado');
  }

  // Método para exportar estado completo
  async exportState() {
    const exportData = {
      timestamp: new Date().toISOString(),
      currentState: this.currentState,
      context: this.context,
      history: this.history,
      transitions: this.transitions,
      patterns: this.analyzePatterns(),
      predictions: this.predictNextState()
    };

    const exportPath = path.join(process.cwd(), 'report', `state-export-${Date.now()}.json`);
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`📤 Estado exportado a: ${exportPath}`);
    return exportPath;
  }
}

module.exports = StateAgent;