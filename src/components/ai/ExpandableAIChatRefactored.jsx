import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Wand2, MessageSquare, Settings, Trash2, X, Minimize2, BarChart3, Bot, Zap } from 'lucide-react';
import { useAIChat } from '../../contexts/AIChatContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import QuickActionsBar from './QuickActionsBar';
import ChatInput from './ChatInput';
import ExpandedChatInput from './ExpandedChatInput';
import GuidedAssistant from './GuidedAssistant';
import AIStatusIndicator from './AIStatusIndicator';

// Botón flotante
const FloatingButton = memo(({ onClick, unreadCount, isMobile = false }) => (
  <motion.div
    className={`fixed ${isMobile ? 'bottom-24' : 'bottom-6'} right-6 z-50`}
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    exit={{ scale: 0, rotate: -180 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
      title="🧠 VenezIA - Tu Asistente Inteligente"
    >
      <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-all duration-300" />
      
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 rounded-full shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-300">
        <Brain size={28} className="text-white" />
      </div>
      
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {unreadCount}
        </motion.div>
      )}
      
      <motion.div
        className="absolute -top-1 -left-1"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="text-yellow-400" size={16} />
      </motion.div>
    </motion.button>
  </motion.div>
));

FloatingButton.displayName = 'FloatingButton';

// Chat minimizado
const MinimizedChat = memo(({ isMobile = false }) => {
  const {
    messages,
    isLoading,
    inputMessage,
    setInputMessage,
    isListening,
    connectionStatus,
    voiceSupported,
    sendMessage,
    updateChatState,
    handleQuickAction,
    clearHistory,
    startVoiceCommand,
    quickActions,
    currentAISource
  } = useAIChat();

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`fixed ${isMobile ? 'bottom-24' : 'bottom-6'} right-6 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700`}
      onClick={(e) => e.stopPropagation()}
    >
      <ChatHeader
        connectionStatus={connectionStatus}
        onClose={() => updateChatState('closed')}
        onExpand={() => updateChatState('expanded')}
        onClear={clearHistory}
        aiSource={currentAISource}
      />
      
      <MessageList
        messages={messages}
        isLoading={isLoading}
        compact={true}
        height="h-80"
      />
      
      {/* Quick Actions - Solo mostrar si no está cargando */}
      {!isLoading && (
        <QuickActionsBar
          actions={quickActions.slice(0, 4)}
          onActionClick={handleQuickAction}
          compact={true}
          className="p-1"
        />
      )}
      
      <div 
        className="border-t border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indicador del sistema AI activo */}
        {currentAISource && (
          <div className="px-2 py-1 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500 dark:text-gray-400">Sistema activo:</span>
              <span className={`
                px-1.5 py-0.5 rounded-full font-medium
                ${currentAISource === 'gemini' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                  currentAISource === 'mock' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                  'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}
              `}>
                {currentAISource === 'gemini' ? '✨ Gemini AI' : 
                 currentAISource === 'mock' ? '🤖 Asistente Local' : 
                 '📦 Modo Básico'}
              </span>
            </div>
          </div>
        )}
        <div className="p-2">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={sendMessage}
          onVoiceCommand={startVoiceCommand}
          isLoading={isLoading}
          isListening={isListening}
          voiceSupported={voiceSupported}
          placeholder="Pregúntame algo..."
        />
        </div>
      </div>
    </motion.div>
  );
});

MinimizedChat.displayName = 'MinimizedChat';

// Chat expandido
const ExpandedChat = memo(() => {
  const {
    messages,
    isLoading,
    inputMessage,
    setInputMessage,
    isListening,
    connectionStatus,
    voiceSupported,
    sendMessage,
    updateChatState,
    handleQuickAction,
    clearHistory,
    startVoiceCommand,
    quickActions,
    getStats,
    currentAISource,
    modelStatus
  } = useAIChat();

  const [assistantMode, setAssistantMode] = useState(
    localStorage.getItem('ai-default-mode') || 'chat'
  ); // 'guided' or 'chat'
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAISystem, setSelectedAISystem] = useState(
    localStorage.getItem('ai-system-preference') || 'auto'
  );
  const [voiceEnabled, setVoiceEnabled] = useState(
    localStorage.getItem('ai-voice-enabled') !== 'false'
  );
  const [showSuggestions, setShowSuggestions] = useState(
    localStorage.getItem('ai-show-suggestions') !== 'false'
  );
  const [soundNotifications, setSoundNotifications] = useState(
    localStorage.getItem('ai-sound-notifications') === 'true'
  );
  const stats = getStats();

  const handleExecuteAction = async (action) => {
    console.log('Ejecutando acción desde wizard:', action);
    // Aquí podríamos integrar con el contexto si fuera necesario
    return { success: true };
  };

  const handleSaveSettings = () => {
    try {
      // Guardar todas las configuraciones
      localStorage.setItem('ai-default-mode', assistantMode);
      localStorage.setItem('ai-system-preference', selectedAISystem);
      localStorage.setItem('ai-voice-enabled', voiceEnabled.toString());
      localStorage.setItem('ai-show-suggestions', showSuggestions.toString());
      localStorage.setItem('ai-sound-notifications', soundNotifications.toString());
      
      // Mostrar confirmación
      alert('✅ Configuración guardada correctamente');
      
      // Cerrar panel de configuración
      setShowSettings(false);
      
      console.log('Configuración guardada:', {
        assistantMode,
        selectedAISystem,
        voiceEnabled,
        showSuggestions,
        soundNotifications
      });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('❌ Error guardando la configuración');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && updateChatState('minimized')}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header mejorado con gradiente */}
        <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 bg-black/10 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.05%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  VenezIA 
                  <span className="text-sm px-2 py-1 bg-white/20 rounded-full">
                    Tu asistente inteligente
                  </span>
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  {/* Indicador de sistema AI */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm text-white/80">
                      {currentAISource === 'gemini' ? '✨ Gemini 1.5 Flash' : 
                       currentAISource === 'mock' ? '🤖 Asistente Local' : 
                       '📦 Modo Básico'}
                    </span>
                  </div>
                  {/* Estadísticas */}
                  <span className="text-sm text-white/60">
                    {stats.totalMessages} mensajes • {stats.userMessages} consultas
                  </span>
                </div>
              </div>
            </div>
          
            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              {/* Botón de configuración */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
                title="Configuración del chat"
              >
                <Settings size={20} />
              </motion.button>
              
              {/* Botón de limpiar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearHistory}
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
                title="Limpiar conversación"
              >
                <Trash2 size={20} />
              </motion.button>
              
              {/* Botón de estadísticas */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
                title="Ver estadísticas"
              >
                <BarChart3 size={20} />
              </motion.button>
              
              {/* Separador */}
              <div className="w-px h-8 bg-white/30 mx-2"></div>
              
              {/* Botones de ventana */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateChatState('minimized')}
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
                title="Minimizar"
              >
                <Minimize2 size={20} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateChatState('closed')}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-white transition-all"
                title="Cerrar"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Barra de modo de asistente */}
        <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Modo de asistente:</span>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setAssistantMode('guided')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    assistantMode === 'guided'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Wand2 size={16} />
                  <span>Guiado</span>
                </button>
                <button
                  onClick={() => setAssistantMode('chat')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    assistantMode === 'chat'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>Chat AI</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateChatState('minimized')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="text-sm">−</span>
              </button>
              <button
                onClick={() => updateChatState('closed')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Panel de configuración deslizable */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración del Chat
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Selección de modelo AI */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Sistema de IA preferido
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ai-system"
                          value="auto"
                          checked={selectedAISystem === 'auto'}
                          onChange={(e) => setSelectedAISystem(e.target.value)}
                          className="text-blue-500"
                        />
                        <div>
                          <div className="font-medium">🎯 Automático</div>
                          <div className="text-sm text-gray-500">El sistema elige la mejor opción disponible</div>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recomendado</span>
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ai-system"
                          value="gemini"
                          checked={selectedAISystem === 'gemini'}
                          onChange={(e) => setSelectedAISystem(e.target.value)}
                          className="text-blue-500"
                        />
                        <div>
                          <div className="font-medium">✨ Solo Gemini AI</div>
                          <div className="text-sm text-gray-500">Forzar uso de Gemini (requiere API key)</div>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Premium</span>
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ai-system"
                          value="local"
                          checked={selectedAISystem === 'local'}
                          onChange={(e) => setSelectedAISystem(e.target.value)}
                          className="text-yellow-500"
                        />
                        <div>
                          <div className="font-medium">🤖 Solo Local</div>
                          <div className="text-sm text-gray-500">Usar solo el asistente local</div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Sin conexión</span>
                    </label>
                  </div>
                </div>
                
                {/* Preferencias de interacción */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Preferencias de interacción</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Activar comandos de voz</span>
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500" 
                        checked={voiceEnabled}
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Mostrar sugerencias de comandos</span>
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500" 
                        checked={showSuggestions}
                        onChange={(e) => setShowSuggestions(e.target.checked)}
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Sonidos de notificación</span>
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500" 
                        checked={soundNotifications}
                        onChange={(e) => setSoundNotifications(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Información de uso */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Uso del sistema</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mensajes totales:</span>
                      <span className="font-medium">{stats.totalMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consultas realizadas:</span>
                      <span className="font-medium">{stats.userMessages}</span>
                    </div>
                    {modelStatus.gemini.available && (
                      <div className="flex justify-between">
                        <span>Créditos Gemini restantes:</span>
                        <span className="font-medium">{modelStatus.gemini.quota_limit - modelStatus.gemini.quota_used}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Estado detallado del sistema AI */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Estado del Sistema AI
                  </h4>
                  <AIStatusIndicator />
                </div>
                
                {/* Botón de guardar */}
                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Contenido según el modo */}
        <div className="flex-1 overflow-hidden relative">
          {assistantMode === 'guided' ? (
            <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <div className="p-4">
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">🚀 Modo Asistente Guiado</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Te ayudo paso a paso con botones interactivos para gestionar tu heladería
                      </p>
                    </div>
                  </div>
                </div>
                <GuidedAssistant onExecuteAction={handleExecuteAction} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
              {/* Área de mensajes mejorada */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  className="h-full"
                  height="h-full"
                />
              </div>
              
              {/* Barra de acciones rápidas mejorada */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <QuickActionsBar
                  actions={quickActions}
                  onActionClick={handleQuickAction}
                  className="px-4 py-2"
                />
              </div>
              
              {/* Input mejorado con indicador de sistema */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                      currentAISource === 'gemini' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      currentAISource === 'mock' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                      <span className="font-medium">
                        {currentAISource === 'gemini' ? '✨ Gemini AI' :
                         currentAISource === 'mock' ? '🤖 Asistente Local' :
                         '📦 Modo Básico'}
                      </span>
                    </div>
                    {isLoading && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </span>
                    )}
                  </div>
                  <ExpandedChatInput
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    onSendMessage={sendMessage}
                    onVoiceCommand={startVoiceCommand}
                    isLoading={isLoading}
                    isListening={isListening}
                    voiceSupported={voiceSupported}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

ExpandedChat.displayName = 'ExpandedChat';

// Componente principal refactorizado
const ExpandableAIChatRefactored = () => {
  const { chatState, updateChatState, sendMessage, setInputMessage } = useAIChat();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('ai-assistant-enabled') !== 'false'
  );
  
  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleToggle = (event) => {
      setIsEnabled(event.detail.enabled);
    };
    
    window.addEventListener('ai-assistant-toggle', handleToggle);
    return () => window.removeEventListener('ai-assistant-toggle', handleToggle);
  }, []);
  
  // Escuchar eventos globales
  useEffect(() => {
    const handleChatControl = (event) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'toggle':
          updateChatState(chatState === 'closed' ? 'minimized' : 'closed');
          break;
        case 'open':
          updateChatState('minimized');
          break;
        case 'close':
          updateChatState('closed');
          break;
        case 'expand':
          updateChatState('expanded');
          break;
        case 'minimize':
          updateChatState('minimized');
          break;
      }
    };
    
    const handleChatQuery = (event) => {
      const { text } = event.detail;
      if (chatState === 'closed') {
        updateChatState('minimized');
      }
      setInputMessage(text);
      setTimeout(() => {
        if (text.trim()) {
          sendMessage(text);
        }
      }, 100);
    };
    
    window.addEventListener('chatControl', handleChatControl);
    window.addEventListener('chatQuery', handleChatQuery);
    
    return () => {
      window.removeEventListener('chatControl', handleChatControl);
      window.removeEventListener('chatQuery', handleChatQuery);
    };
  }, [chatState, updateChatState, setInputMessage, sendMessage]);

  // No renderizar nada si está deshabilitado
  if (!isEnabled) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {chatState === 'closed' && (
        <FloatingButton 
          key="floating" 
          onClick={() => updateChatState('minimized')} 
          unreadCount={0}
          isMobile={isMobile}
        />
      )}
      
      {chatState === 'minimized' && (
        <MinimizedChat key="minimized" isMobile={isMobile} />
      )}
      
      {chatState === 'expanded' && (
        <ExpandedChat key="expanded" />
      )}
    </AnimatePresence>
  );
};

export default memo(ExpandableAIChatRefactored);