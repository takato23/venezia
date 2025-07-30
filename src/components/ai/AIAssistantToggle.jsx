import React, { useState } from 'react';
import { MessageSquare, Wand2, Zap, Crown } from 'lucide-react';
import GuidedAssistant from './GuidedAssistant';
import ChatAssistant from './ChatAssistant';

const ASSISTANT_MODES = {
  GUIDED: {
    id: 'guided',
    name: 'Asistente Guiado',
    icon: Wand2,
    description: 'Te guío paso a paso con botones',
    color: 'green',
    plan: 'Básico',
    free: true
  },
  CHAT_BASIC: {
    id: 'chat_basic',
    name: 'Chat Básico',
    icon: MessageSquare,
    description: 'Chat con comandos limitados',
    color: 'blue',
    plan: 'Básico',
    free: true,
    quota: 50
  },
  CHAT_PREMIUM: {
    id: 'chat_premium',
    name: 'Chat AI Premium',
    icon: Crown,
    description: 'Chat inteligente ilimitado',
    color: 'purple',
    plan: 'Premium',
    free: false,
    price: 7.50
  }
};

export default function AIAssistantToggle({ 
  userPlan = 'basic',
  quotaUsed = 0,
  onUpgrade,
  onExecuteAction
}) {
  const [currentMode, setCurrentMode] = useState('guided');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleModeChange = (mode) => {
    const modeConfig = ASSISTANT_MODES[mode.toUpperCase()];
    
    // Si es un modo premium y no tiene el plan
    if (!modeConfig.free && userPlan === 'basic') {
      setShowUpgradeModal(true);
      return;
    }
    
    // Si es chat básico y se agotó la cuota
    if (mode === 'chat_basic' && quotaUsed >= 50) {
      setShowUpgradeModal(true);
      return;
    }
    
    setCurrentMode(mode);
  };

  const renderSimpleModeSelector = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          🧙‍♂️ Asistente para Heladerías
        </h3>
        {userPlan === 'basic' && currentMode === 'guided' && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            ✨ Prueba AI Premium
          </button>
        )}
      </div>

      {userPlan === 'basic' ? (
        // Vista simplificada para usuarios básicos
        <div className="text-center">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <Wand2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-green-800 mb-1">Asistente Paso a Paso</h4>
            <p className="text-sm text-green-600">Te guío con botones para hacer todo fácil</p>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Plan Básico • Acceso gratuito completo
          </div>
        </div>
      ) : (
        // Vista completa para usuarios premium  
        <div className="space-y-2">
          {Object.values(ASSISTANT_MODES).map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                  ${isActive 
                    ? `border-${mode.color}-500 bg-${mode.color}-50` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 text-${mode.color}-600`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{mode.name}</span>
                    {!mode.free && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{mode.description}</div>
                </div>
                {isActive && (
                  <div className={`w-2 h-2 rounded-full bg-${mode.color}-500 animate-pulse`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderUpgradeModal = () => {
    if (!showUpgradeModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <Crown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upgrade a Premium</h3>
            <p className="text-gray-600 mb-4">
              Desbloquea el chat AI inteligente sin límites
            </p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-purple-800 mb-2">AI Premium incluye:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✅ Chat natural ilimitado</li>
                <li>✅ Respuestas más inteligentes</li>
                <li>✅ Reportes y análisis</li>
                <li>✅ Soporte multi-idioma</li>
                <li>✅ Sin cuotas diarias</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  onUpgrade?.();
                }}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Upgrade por $7.50/mes
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentAssistant = () => {
    switch (currentMode) {
      case 'guided':
        return <GuidedAssistant onExecuteAction={onExecuteAction} />;
      
      case 'chat_basic':
        return (
          <ChatAssistant 
            mode="basic"
            quotaRemaining={50 - quotaUsed}
            onExecuteAction={onExecuteAction}
          />
        );
      
      case 'chat_premium':
        return (
          <ChatAssistant 
            mode="premium"
            quotaRemaining={-1} // unlimited
            onExecuteAction={onExecuteAction}
          />
        );
      
      default:
        return <GuidedAssistant onExecuteAction={onExecuteAction} />;
    }
  };

  return (
    <div className="space-y-4">
      {renderSimpleModeSelector()}
      {renderCurrentAssistant()}
      {renderUpgradeModal()}
    </div>
  );
}