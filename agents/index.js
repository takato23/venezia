// Exportar todos los agentes desde un único punto
const AnalyzeAgent = require('./AnalyzeAgent');
const ImproveAgent = require('./ImproveAgent');
const TestAgent = require('./TestAgent');
const DocumentAgent = require('./DocumentAgent');
const GitAgent = require('./GitAgent');
const TroubleshootAgent = require('./TroubleshootAgent');
const SecurityGateAgent = require('./SecurityGateAgent');
const BudgetAgent = require('./BudgetAgent');
const StateAgent = require('./StateAgent');
const OrchestratorAgent = require('./OrchestratorAgent');

module.exports = {
  AnalyzeAgent,
  ImproveAgent,
  TestAgent,
  DocumentAgent,
  GitAgent,
  TroubleshootAgent,
  SecurityGateAgent,
  BudgetAgent,
  StateAgent,
  OrchestratorAgent
};