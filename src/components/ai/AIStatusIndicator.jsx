import React from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const AIStatusIndicator = ({ compact = false }) => {
  const { currentAISource, modelStatus, getServiceStatus } = useAIChat();
  const [status, setStatus] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    const updateStatus = () => {
      const serviceStatus = getServiceStatus();
      setStatus(serviceStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, [getServiceStatus]);

  const getSourceInfo = () => {
    switch (currentAISource) {
      case 'gemini':
        return {
          name: 'Gemini AI',
          icon: <Sparkles className="w-4 h-4" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          description: 'IA avanzada con respuestas inteligentes'
        };
      case 'superbot':
        return {
          name: 'SuperBot Venezia',
          icon: <Zap className="w-4 h-4" />,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          description: 'Comandos especializados para tu heladería'
        };
      case 'mock':
        return {
          name: 'Asistente Local',
          icon: <Cpu className="w-4 h-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Respuestas predefinidas sin conexión'
        };
      case 'fallback':
      case 'error':
        return {
          name: 'Modo Básico',
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          description: 'Sistema guiado disponible'
        };
      default:
        return {
          name: 'Preparando...',
          icon: <Cpu className="w-4 h-4 animate-pulse" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Inicializando sistema de IA'
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const remainingRequests = status?.remainingRequests || 0;
  const hasApiKey = status?.hasApiKey || false;
  const isGeminiAvailable = status?.geminiAvailable || false;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${sourceInfo.bgColor} ${sourceInfo.color} ${sourceInfo.borderColor} border cursor-pointer`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {sourceInfo.icon}
        <span>{sourceInfo.name}</span>
        {currentAISource === 'gemini' && remainingRequests > 0 && (
          <span className="text-xs opacity-70">({remainingRequests} restantes)</span>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div
          className={`p-3 rounded-lg ${sourceInfo.bgColor} ${sourceInfo.borderColor} border cursor-pointer transition-all hover:shadow-md`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${sourceInfo.color}`}>
                {sourceInfo.icon}
              </div>
              <div>
                <h4 className={`font-medium text-sm ${sourceInfo.color}`}>
                  {sourceInfo.name}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {sourceInfo.description}
                </p>
              </div>
            </div>
            
            {/* Indicadores de estado */}
            <div className="flex items-center gap-2">
              {hasApiKey && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">API Key</span>
                </div>
              )}
              
              {currentAISource === 'gemini' && (
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-700">
                    {remainingRequests} / {status?.maxDailyRequests || 1500}
                  </div>
                  <div className="text-xs text-gray-500">
                    solicitudes
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Barra de progreso para Gemini */}
          {currentAISource === 'gemini' && status && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(remainingRequests / (status.maxDailyRequests || 1500)) * 100}%` 
                  }}
                  className={`h-1.5 rounded-full ${
                    remainingRequests > 1000 ? 'bg-green-500' :
                    remainingRequests > 500 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Panel de detalles expandible */}
      <AnimatePresence>
        {showDetails && status && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h5 className="font-medium text-sm mb-3">Detalles del Sistema AI</h5>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Modelo Gemini:</span>
                  <span className="font-medium">{status.geminiModel || 'gemini-1.5-flash'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Origen API Key:</span>
                  <span className="font-medium">
                    {status.apiKeySource === 'configured' ? 'Configurada (.env)' :
                     status.apiKeySource === 'manual' ? 'Manual (localStorage)' :
                     'No configurada'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Cache activo:</span>
                  <span className="font-medium">{status.cacheSize || 0} respuestas</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">SuperBot:</span>
                  <span className="font-medium">
                    {status.superBotEnabled ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Nivel de servicio:</span>
                  <span className="font-medium">Nivel {status.currentLevel}</span>
                </div>
              </div>

              {!hasApiKey && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    Para activar Gemini AI, configura tu API Key en el archivo .env
                  </p>
                </div>
              )}

              {hasApiKey && !isGeminiAvailable && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-800">
                    Gemini no está disponible. Verifica tu API Key o conexión.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIStatusIndicator;