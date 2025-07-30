import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Brain, 
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  MessageCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';
import axios from 'axios';
import usePersistentChat from '../../hooks/usePersistentChat';
import useChatInput from '../../hooks/useChatInput';
import ChatInput from './ChatInput';
import ExpandedChatInput from './ExpandedChatInput';

// Componente del botón flotante - diseño modesto y minimalista
const FloatingButton = memo(({ onClick, unreadCount }) => (
  <motion.div
    className="fixed bottom-4 right-4 z-50"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
      title="Asistente IA"
    >
      {/* Main button - simple and modest */}
      <div className="relative bg-gray-800 dark:bg-gray-700 p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200">
        <MessageCircle size={20} className="text-white" />
      </div>
      
      {/* Unread badge - minimal */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
          {unreadCount}
        </div>
      )}
    </motion.button>
  </motion.div>
));

FloatingButton.displayName = 'FloatingButton';

// Componente del chat minimizado - diseño mejorado
const MinimizedChat = memo(({ 
  messages, 
  inputMessage, 
  setInputMessage, 
  sendMessage, 
  startVoiceCommand, 
  isLoading, 
  isListening, 
  voiceSupported,
  updateChatState,
  handleQuickAction,
  clearHistory,
  quickActions,
  connectionStatus,
  messagesEndRef 
}) => (
  <motion.div
    initial={{ y: 100, opacity: 0, scale: 0.9 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: 100, opacity: 0, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="fixed bottom-20 right-6 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header - diseño modesto */}
    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <MessageCircle className="text-gray-600 dark:text-gray-400" size={16} />
        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Asistente</span>
      </div>
      <div className="flex items-center space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => updateChatState('expanded')}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
          title="Expandir"
        >
          <Maximize2 size={14} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => updateChatState('closed')}
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
          title="Cerrar"
        >
          <X size={14} />
        </motion.button>
      </div>
    </div>

    {/* Messages - Más altura */}
    <div className="h-60 overflow-y-auto p-2 space-y-1.5 scroll-smooth">
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-2 rounded-lg text-sm ${
              message.type === 'user'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div className="text-xs whitespace-pre-wrap">{message.content}</div>
            <div className={`text-xs mt-1 ${
              message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </motion.div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Quick Actions - Ultra compacto con toggle */}
    <AnimatePresence>
      {!isLoading && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {quickActions.slice(0, 4).map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction(action);
                  }}
                  className="text-xs p-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left flex items-center space-x-1"
                >
                  <span className="text-xs">{action.icon}</span>
                  <span className="truncate text-xs">{action.text.replace(/^[\p{Emoji}]\s*/u, '').substring(0, 15)}...</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Input - Más compacto */}
    <div 
      className="p-1.5 border-t border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
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
  </motion.div>
));

MinimizedChat.displayName = 'MinimizedChat';

// Componente del chat expandido - memoizado
const ExpandedChat = memo(({ 
  messages, 
  inputMessage, 
  setInputMessage, 
  sendMessage, 
  startVoiceCommand, 
  isLoading, 
  isListening, 
  voiceSupported,
  updateChatState,
  handleQuickAction,
  clearHistory,
  quickActions,
  getStats,
  connectionStatus,
  messagesEndRef 
}) => {
  const stats = getStats();
  
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
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modesto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-gray-600 dark:text-gray-400" size={20} />
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Asistente IA</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              title="Limpiar historial"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => updateChatState('minimized')}
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              title="Minimizar"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={() => updateChatState('closed')}
              className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar - Compacto */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-2 gap-1.5">
            {quickActions.slice(0, 4).map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleQuickAction(action)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center space-x-1.5 border border-gray-200 dark:border-gray-600"
              >
                <span className="text-sm">{action.icon}</span>
                <span className="truncate">{action.text.replace(/^[\p{Emoji}]\s*/u, '')}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('es-AR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow-md">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
      </motion.div>
    </motion.div>
  );
});

ExpandedChat.displayName = 'ExpandedChat';

// Componente principal
const ExpandableAIChat = () => {
  // Usar el hook persistente
  const { 
    messages, 
    chatState, 
    isLoading, 
    setIsLoading, 
    addMessage, 
    clearHistory, 
    updateChatState, 
    getStats 
  } = usePersistentChat();

  // Usar hook separado para el input
  const { inputMessage, setInputMessage, clearInput } = useChatInput();
  const [isListening, setIsListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Detectar soporte de voz
  const voiceSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Auto-scroll a los nuevos mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Escuchar eventos de control del chat desde shortcuts
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
      // Auto-enviar después de un pequeño delay
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
  }, [chatState, updateChatState, setInputMessage]);

  // Verificar conexión con el backend
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get('/api/ai/health');
        setConnectionStatus(response.data.status === 'ok' ? 'connected' : 'disconnected');
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para enviar mensaje
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = addMessage({
      type: 'user',
      content: message.trim()
    });

    clearInput();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: message.trim(),
        chatHistory: messages.slice(-10) // Enviar últimos 10 mensajes para contexto
      });

      addMessage({
        type: 'ai',
        content: response.data.response
      });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      addMessage({
        type: 'ai',
        content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, addMessage, clearInput, setIsLoading]);

  // Manejo de mensajes con tecla Enter
  const handleSendMessage = useCallback((e) => {
    e?.preventDefault();
    sendMessage(inputMessage);
  }, [inputMessage, sendMessage]);

  // Quick actions predefinidas
  const quickActions = [
    { icon: '📊', text: '📊 Ver ventas del día' },
    { icon: '📦', text: '📦 Consultar stock' },
    { icon: '🍨', text: '🍨 Productos más vendidos' },
    { icon: '💰', text: '💰 Estado de caja' },
    { icon: '📈', text: '📈 Análisis de tendencias' },
    { icon: '👥', text: '👥 Gestionar proveedores' }
  ];

  const handleQuickAction = useCallback((action) => {
    sendMessage(action.text);
  }, [sendMessage]);

  // Función para iniciar comando de voz
  const startVoiceCommand = useCallback(() => {
    if (!voiceSupported) {
      console.warn('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [voiceSupported, setInputMessage, setIsListening]);

  return (
    <>
      {/* Renderizar componentes según el estado */}
      <AnimatePresence>
        {chatState === 'closed' && (
          <FloatingButton 
            key="floating" 
            onClick={() => updateChatState('minimized')} 
            unreadCount={unreadCount} 
          />
        )}
        
        {chatState === 'minimized' && (
          <MinimizedChat 
            key="minimized"
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={sendMessage}
            startVoiceCommand={startVoiceCommand}
            isLoading={isLoading}
            isListening={isListening}
            voiceSupported={voiceSupported}
            updateChatState={updateChatState}
            handleQuickAction={handleQuickAction}
            clearHistory={clearHistory}
            quickActions={quickActions}
            connectionStatus={connectionStatus}
            messagesEndRef={messagesEndRef}
          />
        )}
        
        {chatState === 'expanded' && (
          <ExpandedChat 
            key="expanded"
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={sendMessage}
            startVoiceCommand={startVoiceCommand}
            isLoading={isLoading}
            isListening={isListening}
            voiceSupported={voiceSupported}
            updateChatState={updateChatState}
            handleQuickAction={handleQuickAction}
            clearHistory={clearHistory}
            quickActions={quickActions}
            getStats={getStats}
            connectionStatus={connectionStatus}
            messagesEndRef={messagesEndRef}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ExpandableAIChat);