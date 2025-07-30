const fs = require('fs').promises;
const path = require('path');

// Importar todos los agentes
const AnalyzeAgent = require('./AnalyzeAgent');
const ImproveAgent = require('./ImproveAgent');
const TestAgent = require('./TestAgent');
const DocumentAgent = require('./DocumentAgent');
const GitAgent = require('./GitAgent');
const TroubleshootAgent = require('./TroubleshootAgent');
const SecurityGateAgent = require('./SecurityGateAgent');
const BudgetAgent = require('./BudgetAgent');
const StateAgent = require('./StateAgent');

class OrchestratorAgent {
  constructor() {
    // Inicializar agentes compartidos
    this.budgetAgent = new BudgetAgent();
    this.securityGateAgent = new SecurityGateAgent();
    this.stateAgent = new StateAgent();

    // Inicializar agentes operativos
    this.agents = {
      analyze: new AnalyzeAgent(),
      improve: new ImproveAgent(this.budgetAgent, this.securityGateAgent),
      test: new TestAgent(this.budgetAgent),
      document: new DocumentAgent(),
      git: new GitAgent(this.securityGateAgent),
      troubleshoot: new TroubleshootAgent(),
      state: this.stateAgent,
      budget: this.budgetAgent,
      security: this.securityGateAgent
    };

    // Estados de la máquina de estados
    this.states = {
      IDLE: 'IDLE',
      ANALYZE: 'ANALYZE',
      PLAN: 'PLAN',
      IMPROVE: 'IMPROVE',
      TEST: 'TEST',
      TROUBLESHOOT: 'TROUBLESHOOT',
      DOCUMENT: 'DOCUMENT',
      GIT: 'GIT',
      DONE: 'DONE',
      STOP: 'STOP'
    };

    this.currentState = this.states.IDLE;
    this.context = {};
  }

  async initialize() {
    console.log('🚀 Iniciando sistema autónomo...');
    
    // Inicializar presupuesto
    await this.budgetAgent.initialize();
    
    // Cargar estado previo si existe
    await this.stateAgent.loadState();
    
    // Verificar si hay una sesión en progreso
    const lastState = this.stateAgent.getLastState();
    if (lastState && lastState !== this.states.DONE) {
      console.log(`📌 Retomando desde estado: ${lastState}`);
      this.currentState = lastState;
      this.context = this.stateAgent.getContext();
    }

    return true;
  }

  async execute(command, args = []) {
    try {
      // Parsear comando
      const parsedCommand = this.parseCommand(command, args);
      
      // Validar comando
      if (!this.validateCommand(parsedCommand)) {
        throw new Error(`Comando inválido: ${command}`);
      }

      // Ejecutar comando según tipo
      switch (parsedCommand.type) {
        case 'analyze':
          return await this.executeAnalyze();
          
        case 'improve':
          return await this.executeImprove(parsedCommand.objective);
          
        case 'test':
          return await this.executeTest();
          
        case 'document':
          return await this.executeDocument();
          
        case 'git':
          return await this.executeGit(parsedCommand.gitCommand);
          
        case 'troubleshoot':
          return await this.executeTroubleshoot(parsedCommand.hint);
          
        default:
          throw new Error(`Comando no implementado: ${parsedCommand.type}`);
      }
    } catch (error) {
      console.error('❌ Error en orquestador:', error.message);
      await this.handleError(error);
      throw error;
    }
  }

  async executeAnalyze() {
    this.transitionTo(this.states.ANALYZE);
    
    const result = await this.agents.analyze.execute();
    
    // Actualizar contexto con resultados del análisis
    this.context.analysis = result;
    await this.stateAgent.updateState(this.currentState, this.context);
    
    this.transitionTo(this.states.IDLE);
    return result;
  }

  async executeImprove(objective) {
    // Verificar que tengamos un análisis previo
    if (!this.context.analysis) {
      console.log('📊 Ejecutando análisis previo...');
      await this.executeAnalyze();
    }

    // Ciclo de mejora
    let iteration = 0;
    let continueImproving = true;

    while (continueImproving && this.budgetAgent.canProceed()) {
      iteration++;
      console.log(`\n🔄 Iteración ${iteration}`);

      // PLAN
      this.transitionTo(this.states.PLAN);
      const plan = await this.createPlan(objective);
      
      // IMPROVE
      this.transitionTo(this.states.IMPROVE);
      this.budgetAgent.consumeIteration();
      
      try {
        const improveResult = await this.agents.improve.execute(objective);
        this.context.lastImprovement = improveResult;
        
        // TEST
        this.transitionTo(this.states.TEST);
        const testResult = await this.agents.test.execute();
        
        if (!testResult.success) {
          // TROUBLESHOOT si fallan los tests
          this.transitionTo(this.states.TROUBLESHOOT);
          const troubleshootResult = await this.agents.troubleshoot.execute('test failures');
          this.context.troubleshoot = troubleshootResult;
          
          // Registrar fallo
          this.budgetAgent.recordTestResult(false, false);
        } else {
          // Tests pasaron
          this.budgetAgent.recordTestResult(true, true);
          
          // Verificar si debemos continuar
          continueImproving = await this.shouldContinueImproving();
        }
        
      } catch (error) {
        console.error('Error en ciclo de mejora:', error.message);
        continueImproving = false;
      }

      // Guardar estado
      await this.stateAgent.updateState(this.currentState, this.context);
    }

    // DOCUMENT
    if (this.context.lastImprovement) {
      this.transitionTo(this.states.DOCUMENT);
      await this.agents.document.execute();
    }

    this.transitionTo(this.states.IDLE);
    return this.generateImprovementReport();
  }

  async executeTest() {
    this.transitionTo(this.states.TEST);
    
    const result = await this.agents.test.execute();
    
    this.context.lastTest = result;
    await this.stateAgent.updateState(this.currentState, this.context);
    
    this.transitionTo(this.states.IDLE);
    return result;
  }

  async executeDocument() {
    this.transitionTo(this.states.DOCUMENT);
    
    const result = await this.agents.document.execute();
    
    this.context.documentation = result;
    await this.stateAgent.updateState(this.currentState, this.context);
    
    this.transitionTo(this.states.IDLE);
    return result;
  }

  async executeGit(gitCommand) {
    this.transitionTo(this.states.GIT);
    
    const result = await this.agents.git.execute(gitCommand);
    
    this.context.lastGit = result;
    await this.stateAgent.updateState(this.currentState, this.context);
    
    this.transitionTo(this.states.IDLE);
    return result;
  }

  async executeTroubleshoot(hint) {
    this.transitionTo(this.states.TROUBLESHOOT);
    
    const result = await this.agents.troubleshoot.execute(hint);
    
    this.context.troubleshoot = result;
    await this.stateAgent.updateState(this.currentState, this.context);
    
    this.transitionTo(this.states.IDLE);
    return result;
  }

  parseCommand(command, args) {
    // Remover prefijo /sc: si existe
    const cleanCommand = command.replace(/^\/sc:/, '');
    
    if (cleanCommand === 'analyze') {
      return { type: 'analyze' };
    }
    
    if (cleanCommand === 'improve') {
      return {
        type: 'improve',
        objective: args.join(' ') || 'general improvements'
      };
    }
    
    if (cleanCommand === 'test') {
      return { type: 'test' };
    }
    
    if (cleanCommand === 'document') {
      return { type: 'document' };
    }
    
    if (cleanCommand === 'git') {
      return {
        type: 'git',
        gitCommand: args.join(' ')
      };
    }
    
    if (cleanCommand === 'troubleshoot') {
      return {
        type: 'troubleshoot',
        hint: args.join(' ') || ''
      };
    }
    
    return { type: cleanCommand, args };
  }

  validateCommand(parsedCommand) {
    const validCommands = ['analyze', 'improve', 'test', 'document', 'git', 'troubleshoot'];
    return validCommands.includes(parsedCommand.type);
  }

  transitionTo(newState) {
    console.log(`📍 ${this.currentState} → ${newState}`);
    this.currentState = newState;
  }

  async createPlan(objective) {
    // Plan básico basado en el objetivo
    const plan = {
      objective,
      steps: [],
      estimatedTime: 0,
      estimatedChanges: 0
    };

    // Analizar objetivo para crear pasos
    if (objective.includes('error') || objective.includes('manejo')) {
      plan.steps.push('Identificar archivos sin manejo de errores');
      plan.steps.push('Agregar try-catch y validaciones');
      plan.steps.push('Ejecutar tests');
      plan.estimatedChanges = 10;
    }

    if (objective.includes('performance')) {
      plan.steps.push('Identificar hotspots de performance');
      plan.steps.push('Aplicar optimizaciones');
      plan.steps.push('Medir mejoras');
      plan.estimatedChanges = 5;
    }

    plan.estimatedTime = plan.steps.length * 2; // 2 minutos por paso

    return plan;
  }

  async shouldContinueImproving() {
    // Verificar si hay más trabajo por hacer
    const budget = this.budgetAgent.getStatus();
    
    if (!budget.canProceed) {
      return false;
    }

    // Si quedan iteraciones y no hemos alcanzado límites
    if (budget.remaining.iterations > 0 && budget.percentages.files < 80) {
      return true;
    }

    return false;
  }

  async handleError(error) {
    // Guardar error en contexto
    this.context.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
      state: this.currentState
    };

    // Transición a STOP si es error crítico
    if (error.message.includes('Presupuesto agotado') ||
        error.message.includes('Gate de seguridad')) {
      this.transitionTo(this.states.STOP);
    }

    // Guardar estado
    await this.stateAgent.updateState(this.currentState, this.context);
  }

  generateImprovementReport() {
    const budgetReport = this.budgetAgent.generateReport();
    
    return {
      summary: {
        objective: this.context.lastImprovement?.objective || 'N/A',
        success: this.context.lastTest?.success || false,
        iterations: budgetReport.summary.totalIterations,
        filesChanged: budgetReport.summary.totalFiles,
        timeElapsed: budgetReport.summary.totalTime
      },
      improvements: this.context.lastImprovement || {},
      testResults: this.context.lastTest || {},
      budget: budgetReport,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.context.lastTest && !this.context.lastTest.success) {
      recommendations.push('Revisar y corregir tests fallidos antes de continuar');
    }

    if (this.budgetAgent.getStatus().percentages.files > 80) {
      recommendations.push('Considerar dividir cambios en PRs más pequeños');
    }

    if (this.context.troubleshoot) {
      recommendations.push('Revisar logs de troubleshooting para más detalles');
    }

    return recommendations;
  }

  // Método para ejecutar workflow completo
  async runWorkflow(objective) {
    console.log('🚀 Iniciando workflow autónomo completo...');
    
    try {
      // 1. Análisis inicial
      await this.executeAnalyze();
      
      // 2. Mejoras iterativas
      await this.executeImprove(objective);
      
      // 3. Documentación
      await this.executeDocument();
      
      // 4. Commit y push (requiere aprobación)
      const commitMessage = `feat(auto): ${objective}`;
      await this.executeGit(`commit -m "${commitMessage}"`);
      
      const branch = this.context.lastImprovement?.branch;
      if (branch) {
        await this.executeGit(`push --set-upstream origin ${branch}`);
      }
      
      console.log('✅ Workflow completado exitosamente');
      this.transitionTo(this.states.DONE);
      
    } catch (error) {
      console.error('❌ Workflow interrumpido:', error.message);
      this.transitionTo(this.states.STOP);
    }
    
    // Generar reporte final
    return this.generateFinalReport();
  }

  generateFinalReport() {
    return {
      state: this.currentState,
      success: this.currentState === this.states.DONE,
      analysis: this.context.analysis || {},
      improvements: this.context.lastImprovement || {},
      tests: this.context.lastTest || {},
      documentation: this.context.documentation || {},
      git: this.context.lastGit || {},
      budget: this.budgetAgent.generateReport(),
      errors: this.context.lastError || null
    };
  }
}

module.exports = OrchestratorAgent;