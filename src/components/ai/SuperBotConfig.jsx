// SuperBot Configuration Panel - Panel de configuración avanzada
import React, { useState, useEffect } from 'react';
import aiService from '../../services/AIService';
import superBotVenezia from '../../services/SuperBotVenezia';

const SuperBotConfig = ({ isOpen, onClose }) => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [testCommand, setTestCommand] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTestingCommand, setIsTestingCommand] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [config, setConfig] = useState({
    autoExecute: false,
    confirmationRequired: true,
    voiceEnabled: true,
    maxDailyRequests: 1000
  });

  useEffect(() => {
    if (isOpen) {
      loadCurrentStatus();
      loadCommandHistory();
    }
  }, [isOpen]);

  const loadCurrentStatus = () => {
    const service = aiService.getServiceStatus();
    const bot = superBotVenezia.getStatus();
    
    setServiceStatus(service);
    setBotStatus(bot);
    setConfig(bot.config);
  };

  const loadCommandHistory = () => {
    const stored = localStorage.getItem('superbot-command-history');
    if (stored) {
      setCommandHistory(JSON.parse(stored).slice(-10)); // Últimos 10 comandos
    }
  };

  const testCommand = async () => {
    if (!testCommand.trim()) return;
    
    setIsTestingCommand(true);
    
    try {
      // Simular contexto para testing
      const mockContext = {
        businessData: {
          sales: { today: { total: 50000, transactions: 25 } },
          inventory: { totalProducts: 15, totalStock: 200 },
          analytics: { 
            lowStockCount: 3,
            lowStockProducts: [
              { id: 1, name: 'Chocolate', stock: 2, minimum: 10 },
              { id: 2, name: 'Vainilla', stock: 1, minimum: 8 }
            ]
          }
        },
        executeAction: async (action, params) => {
          return {
            success: true,
            message: `✅ Acción simulada: ${action}`,
            data: params
          };
        }
      };

      const result = await superBotVenezia.processCommand(testCommand.trim(), mockContext);
      
      setTestResult(result);
      
      // Guardar en historial
      const newHistory = [
        { command: testCommand.trim(), result, timestamp: new Date() },
        ...commandHistory
      ].slice(0, 10);
      
      setCommandHistory(newHistory);
      localStorage.setItem('superbot-command-history', JSON.stringify(newHistory));
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error en test: ${error.message}`,
        suggestions: ['Verificar comando', 'Revisar sintaxis']
      });
    } finally {
      setIsTestingCommand(false);
    }
  };

  const updateConfiguration = (newConfig) => {
    superBotVenezia.updateConfiguration(newConfig);
    setConfig(newConfig);
    loadCurrentStatus(); // Recargar estado
  };

  const resetDailyQuota = () => {
    localStorage.removeItem('gemini-usage');
    loadCurrentStatus();
  };

  const clearCommandHistory = () => {
    localStorage.removeItem('superbot-command-history');
    setCommandHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">⚙️ SuperBot Configuration</h2>
              <p className="opacity-90">Panel de configuración y testing avanzado</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Panel izquierdo - Estado y Configuración */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="space-y-6">
              {/* Estado del Servicio */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  📊 Estado del Servicio
                </h3>
                {serviceStatus && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Gemini API:</span>
                      <span className={serviceStatus.geminiAvailable ? 'text-green-600' : 'text-red-600'}>
                        {serviceStatus.geminiAvailable ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests hoy:</span>
                      <span>{serviceStatus.dailyRequests}/{serviceStatus.dailyRequests + serviceStatus.remainingRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SuperBot:</span>
                      <span className={serviceStatus.superBotEnabled ? 'text-green-600' : 'text-orange-600'}>
                        {serviceStatus.superBotEnabled ? '✅ Habilitado' : '⚠️ Deshabilitado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nivel actual:</span>
                      <span className="font-semibold">Nivel {serviceStatus.currentLevel}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuración */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  ⚙️ Configuración
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Ejecución automática</label>
                    <button
                      onClick={() => updateConfiguration({ ...config, autoExecute: !config.autoExecute })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.autoExecute ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.autoExecute ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Confirmación requerida</label>
                    <button
                      onClick={() => updateConfiguration({ ...config, confirmationRequired: !config.confirmationRequired })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.confirmationRequired ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.confirmationRequired ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Comandos de voz</label>
                    <button
                      onClick={() => updateConfiguration({ ...config, voiceEnabled: !config.voiceEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.voiceEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div>
                <h3 className="text-lg font-semibold mb-3">🛠️ Acciones</h3>
                <div className="space-y-2">
                  <button
                    onClick={resetDailyQuota}
                    className="w-full text-left px-3 py-2 text-sm bg-yellow-50 text-yellow-800 rounded-md hover:bg-yellow-100 transition-colors"
                  >
                    🔄 Resetear quota diaria
                  </button>
                  <button
                    onClick={clearCommandHistory}
                    className="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-800 rounded-md hover:bg-red-100 transition-colors"
                  >
                    🗑️ Limpiar historial
                  </button>
                  <button
                    onClick={loadCurrentStatus}
                    className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-800 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    🔄 Recargar estado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Testing */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Test de Comandos */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  🧪 Test de Comandos
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Comando a probar:</label>
                    <input
                      type="text"
                      value={testCommand}
                      onChange={(e) => setTestCommand(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && testCommand()}
                      placeholder="Ej: Agregar 10 kg de chocolate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={testCommand}
                    disabled={isTestingCommand || !testCommand.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTestingCommand ? '🔄 Procesando...' : '🚀 Probar Comando'}
                  </button>
                </div>

                {/* Resultado del test */}
                {testResult && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Resultado:</h4>
                    <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="text-sm whitespace-pre-wrap">{testResult.message}</div>
                      {testResult.suggestions && testResult.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Sugerencias:</p>
                          <div className="flex flex-wrap gap-1">
                            {testResult.suggestions.map((suggestion, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {suggestion}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Comandos de ejemplo */}
              <div>
                <h4 className="font-medium mb-2">💡 Comandos de ejemplo:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Agregar 15 kg de chocolate',
                    '¿Stock crítico?',
                    'Salud del negocio',
                    'Top 5 más vendidos',
                    'Alerta de emergencia',
                    'KPIs del negocio'
                  ].map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => setTestCommand(cmd)}
                      className="text-left px-3 py-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Historial de comandos */}
              {commandHistory.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">📜 Historial reciente:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {commandHistory.map((item, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{item.command}</div>
                        <div className={`mt-1 ${item.result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {item.result.success ? '✅ Éxito' : '❌ Error'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(item.timestamp).toLocaleString('es-CO')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperBotConfig;