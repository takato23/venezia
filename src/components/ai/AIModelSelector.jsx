import React from 'react';
import { Bot, Zap, Cpu, Cloud, AlertCircle } from 'lucide-react';

const AI_MODELS = {
  GEMINI: {
    id: 'gemini',
    name: 'Gemini 1.5',
    icon: Cloud,
    description: 'Modelo más inteligente (requiere internet)',
    color: 'blue',
    online: true,
    quotaLimit: 50
  },
  GEMMA: {
    id: 'gemma',
    name: 'Gemma 2B',
    icon: Cpu,
    description: 'Modelo local liviano (funciona offline)',
    color: 'green',
    online: false,
    quotaLimit: null
  },
  SMART_FALLBACK: {
    id: 'smart_fallback',
    name: 'Smart Assistant',
    icon: Zap,
    description: 'Sistema inteligente sin AI (siempre disponible)',
    color: 'yellow',
    online: false,
    quotaLimit: null
  }
};

export default function AIModelSelector({ currentModel, onModelChange, quotaUsed = 0 }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Bot className="w-4 h-4" />
        Modo AI
      </h3>
      
      <div className="space-y-2">
        {Object.values(AI_MODELS).map((model) => {
          const Icon = model.icon;
          const isActive = currentModel === model.id;
          const isQuotaExceeded = model.quotaLimit && quotaUsed >= model.quotaLimit;
          
          return (
            <button
              key={model.id}
              onClick={() => onModelChange(model.id)}
              disabled={isQuotaExceeded}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                ${isActive 
                  ? `border-${model.color}-500 bg-${model.color}-50` 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isQuotaExceeded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Icon className={`w-5 h-5 text-${model.color}-600`} />
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-gray-500">{model.description}</div>
                
                {model.quotaLimit && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-400">
                        Cuota: {quotaUsed}/{model.quotaLimit}
                      </div>
                      {isQuotaExceeded && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full bg-${model.color}-500`}
                        style={{ width: `${Math.min((quotaUsed / model.quotaLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className={`w-2 h-2 rounded-full bg-${model.color}-500 animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        {currentModel === 'gemini' && '💡 Respuestas más naturales e inteligentes'}
        {currentModel === 'gemma' && '⚡ Rápido y funciona sin internet'}
        {currentModel === 'smart_fallback' && '🎯 Comandos específicos y acciones rápidas'}
      </div>
    </div>
  );
}