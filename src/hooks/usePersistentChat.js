import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'venezia_ai_chat';
const MAX_MESSAGES = 50; // Límite para no saturar localStorage

const usePersistentChat = () => {
  const [messages, setMessages] = useState([]);
  const [chatState, setChatState] = useState('closed'); // 'closed', 'minimized', 'expanded'
  const [isLoading, setIsLoading] = useState(false);
  
  // Usar refs para valores que no deben causar re-renders
  const messagesRef = useRef(messages);
  const chatStateRef = useRef(chatState);
  
  // Actualizar refs cuando cambien los estados
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);

  // Mensaje inicial por defecto
  const initialMessage = {
    id: 'welcome_' + Date.now(),
    type: 'ai',
    content: `👋 ¡Hola! Soy **VenezIA**, tu asistente inteligente.

**¿Cómo puedo ayudarte?**
• 📊 Consultar ventas y reportes
• 📦 Gestionar inventario y stock
• 🍨 Crear productos y sabores
• 👥 Administrar proveedores
• 💰 Análisis financieros

**Ejemplos rápidos:**
\`"Stock de vainilla"\`
\`"Ventas de esta semana"\`
\`"Crear helado chocolate $450"\``,
    timestamp: new Date(),
    persistent: true // Marcar como mensaje que siempre debe estar
  };

  // Cargar mensajes del localStorage al inicializar
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { messages: savedMessages, chatState: savedChatState } = JSON.parse(savedData);
        
        // Convertir timestamps de string a Date
        const messagesWithDates = savedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        // Si no hay mensajes o no está el mensaje inicial, agregarlo
        const hasWelcomeMessage = messagesWithDates.some(msg => msg.persistent);
        if (!hasWelcomeMessage || messagesWithDates.length === 0) {
          setMessages([initialMessage, ...messagesWithDates]);
        } else {
          setMessages(messagesWithDates);
        }

        // Siempre iniciar cerrado, no restaurar estado anterior
        setChatState('closed');
      } else {
        // Primera vez, solo mostrar mensaje inicial
        setMessages([initialMessage]);
      }
    } catch (error) {
      console.error('Error cargando chat desde localStorage:', error);
      setMessages([initialMessage]);
    }
  }, []);

  // Función para guardar en localStorage con throttling
  const saveToLocalStorage = useCallback(() => {
    const currentMessages = messagesRef.current;
    const currentChatState = chatStateRef.current;
    
    if (currentMessages.length === 0) return;
    
    try {
      const messagesToSave = currentMessages.slice(-MAX_MESSAGES);
      const dataToSave = {
        messages: messagesToSave,
        chatState: currentChatState,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error guardando chat en localStorage:', error);
      try {
        const essentialMessages = currentMessages.filter(msg => msg.persistent).slice(-5);
        const dataToSave = {
          messages: essentialMessages,
          chatState: currentChatState,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (secondError) {
        console.error('Error en cleanup de localStorage:', secondError);
      }
    }
  }, []); // Sin dependencias para evitar recreación

  // Usar throttling para evitar guardar constantemente
  useEffect(() => {
    // Solo guardar si hay cambios reales en mensajes
    if (messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage();
      }, 2000); // Aumentar el tiempo a 2 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, saveToLocalStorage]); // Solo reaccionar a cambios en cantidad de mensajes

  // Agregar mensaje nuevo
  const addMessage = useCallback((message) => {
    const messageWithId = {
      ...message,
      id: message.id || Date.now() + Math.random(),
      timestamp: message.timestamp || new Date()
    };
    
    setMessages(prev => [...prev, messageWithId]);
    return messageWithId;
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    // Confirmar antes de limpiar
    if (messages.length > 1) {
      const confirmClear = window.confirm('¿Estás seguro de que quieres limpiar todo el historial del chat?');
      if (!confirmClear) return;
    }
    
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
  }, [messages.length]);

  // Cambiar estado del chat
  const updateChatState = useCallback((newState) => {
    // Solo actualizar si el estado realmente cambia
    if (chatStateRef.current !== newState) {
      setChatState(newState);
    }
  }, []);

  // Obtener estadísticas del chat
  const getStats = useCallback(() => {
    const userMessages = messages.filter(msg => msg.type === 'user').length;
    const aiMessages = messages.filter(msg => msg.type === 'ai' && !msg.persistent).length;
    const totalMessages = messages.length;
    
    return {
      userMessages,
      aiMessages,
      totalMessages,
      hasHistory: totalMessages > 1
    };
  }, [messages]);

  return {
    messages,
    chatState,
    isLoading,
    setIsLoading,
    addMessage,
    clearHistory,
    updateChatState,
    getStats
  };
};

export default usePersistentChat;