import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore.supabase';
import { supabase } from '../config/supabase';

const STORAGE_KEY = 'venezia-ai-chat-history';
const MAX_MESSAGES = 100;

export const usePersistentChat = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Cargar conversación activa al iniciar
  useEffect(() => {
    if (user?.id) {
      loadActiveConversation();
    }
    
    return () => {
      // Limpiar suscripción al desmontar
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.id]);

  // Cargar conversación activa
  const loadActiveConversation = async () => {
    try {
      setIsLoading(true);
      
      // Obtener o crear conversación activa
      const response = await fetch('/api/ai/conversations/active', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const conversation = await response.json();
        setConversationId(conversation.id);
        
        // Cargar mensajes de la conversación
        await loadConversationMessages(conversation.id);
        
        // Suscribirse a nuevos mensajes en tiempo real
        subscribeToMessages(conversation.id);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Fallback a localStorage si hay error
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar mensajes de una conversación
  const loadConversationMessages = async (convId) => {
    try {
      const response = await fetch(`/api/ai/conversations/${convId}/messages`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Suscribirse a mensajes en tiempo real
  const subscribeToMessages = (convId) => {
    const channel = supabase
      .channel(`conversation:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${convId}`
        },
        (payload) => {
          // Agregar nuevo mensaje al estado local
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    setSubscription(channel);
  };

  // Obtener token de autenticación
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Guardar mensaje
  const saveMessage = useCallback(async (message) => {
    if (!conversationId || !user?.id) {
      // Si no hay conversación, guardar en localStorage
      saveToLocalStorage(message);
      return;
    }

    try {
      const response = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          conversationId,
          role: message.role,
          content: message.text,
          source: message.source || 'user',
          metadata: {
            timestamp: message.timestamp,
            ...(message.metadata || {})
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      const savedMessage = await response.json();
      
      // Actualizar mensaje local con ID del servidor
      setMessages(prev => 
        prev.map(msg => 
          msg.timestamp === message.timestamp 
            ? { ...msg, id: savedMessage.id }
            : msg
        )
      );
      
      // También guardar en localStorage como backup
      saveToLocalStorage(message);
    } catch (error) {
      console.error('Error saving message to server:', error);
      // Guardar en localStorage si falla
      saveToLocalStorage(message);
    }
  }, [conversationId, user?.id]);

  // Guardar acción ejecutada
  const saveAction = useCallback(async (action, messageId) => {
    if (!conversationId || !user?.id) return;

    try {
      await fetch('/api/ai/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          actionType: action.type,
          actionData: action.data,
          result: action.result,
          success: action.success
        })
      });
    } catch (error) {
      console.error('Error saving action:', error);
    }
  }, [conversationId, user?.id]);

  // Agregar mensaje
  const addMessage = useCallback((message) => {
    const newMessage = {
      ...message,
      timestamp: message.timestamp || Date.now()
    };
    
    setMessages(prev => {
      const updated = [...prev, newMessage];
      // Limitar a MAX_MESSAGES
      if (updated.length > MAX_MESSAGES) {
        return updated.slice(-MAX_MESSAGES);
      }
      return updated;
    });
    
    // Guardar en backend
    saveMessage(newMessage);
  }, [saveMessage]);

  // Limpiar historial
  const clearHistory = useCallback(async () => {
    setMessages([]);
    
    // Desactivar conversación actual si existe
    if (conversationId) {
      try {
        await fetch(`/api/ai/conversations/${conversationId}/deactivate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        });
      } catch (error) {
        console.error('Error deactivating conversation:', error);
      }
    }
    
    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Crear nueva conversación
    await loadActiveConversation();
  }, [conversationId]);

  // Actualizar título de conversación
  const updateConversationTitle = useCallback(async (title) => {
    if (!conversationId) return;

    try {
      await fetch(`/api/ai/conversations/${conversationId}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ title })
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  }, [conversationId]);

  // Métodos de localStorage como fallback
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        setMessages(parsedMessages.slice(-MAX_MESSAGES));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const saveToLocalStorage = (message) => {
    try {
      const allMessages = [...messages, message].slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMessages));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return {
    messages,
    addMessage,
    clearHistory,
    saveAction,
    updateConversationTitle,
    isLoading,
    conversationId
  };
};