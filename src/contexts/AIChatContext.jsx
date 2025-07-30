import React, { createContext, useContext, useCallback, useMemo } from 'react';
// Por ahora usar solo la versión local hasta que configuremos Supabase completamente
import usePersistentChat from '../hooks/usePersistentChat';
import useChatInput from '../hooks/useChatInput';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import useConnectionStatus from '../hooks/useConnectionStatus';
import { getCachedResponse, setCachedResponse } from '../utils/chatCache';
import eventBus, { EVENTS } from '../utils/eventBus';
import aiService from '../services/AIService';

// Función para obtener datos REALES de la heladería desde el backend
const getBusinessData = async () => {
  try {
    console.log('🔄 Obteniendo datos reales del backend...');
    
    // Obtener contexto completo desde SuperBot endpoint
    const superBotResponse = await fetch('/api/superbot/business-context', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).catch(e => ({ ok: false, error: e }));
    
    if (superBotResponse.ok) {
      const contextData = await superBotResponse.json();
      if (contextData.success) {
        console.log('✅ Contexto completo obtenido desde SuperBot:', contextData.data);
        return contextData.data;
      }
    }
    
    // Fallback a endpoints individuales si SuperBot no está disponible
    const [dashboardResponse, productsResponse, lowStockResponse] = await Promise.all([
      fetch('/api/dashboard/overview').catch(e => ({ ok: false, error: e })),
      fetch('/api/products').catch(e => ({ ok: false, error: e })),
      fetch('/api/stock/low?threshold=10').catch(e => ({ ok: false, error: e }))
    ]);

    let dashboard = null, products = [], lowStock = [];

    // Procesar respuesta del dashboard
    if (dashboardResponse.ok) {
      const dashData = await dashboardResponse.json();
      dashboard = dashData.success ? dashData.data : null;
    }

    // Procesar respuesta de productos
    if (productsResponse.ok) {
      const prodData = await productsResponse.json();
      products = Array.isArray(prodData) ? prodData : [];
    }

    // Procesar respuesta de stock bajo
    if (lowStockResponse.ok) {
      const stockData = await lowStockResponse.json();
      lowStock = Array.isArray(stockData) ? stockData : [];
    }

    // Construir estructura de datos para la AI
    const businessData = {
      sales: {
        today: {
          total: dashboard?.ventas_hoy || 0,
          transactions: dashboard?.ordenes_pendientes || 0,
          monthlyRevenue: dashboard?.ingresos_mes || 0
        }
      },
      inventory: {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock || 0,
          price: p.price || 0,
          category: p.category || 'Helado',
          context: p.context || 'general'
        })),
        totalProducts: dashboard?.total_products || products.length,
        totalStock: dashboard?.total_stock || products.reduce((sum, p) => sum + (p.stock || 0), 0)
      },
      analytics: {
        lowStockCount: dashboard?.stock_bajo || lowStock.length,
        lowStockProducts: lowStock.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock || 0,
          minimum: p.minimum_stock || 10,
          needed: Math.max(0, (p.minimum_stock || 10) - (p.stock || 0))
        }))
      },
      lastUpdated: new Date().toISOString(),
      source: 'real_backend'
    };

    console.log('✅ Datos reales obtenidos:', businessData);
    return businessData;

  } catch (error) {
    console.error('❌ Error obteniendo datos reales:', error);
    
    // Fallback con mensaje claro
    return {
      sales: { today: { total: 0 } },
      inventory: { products: [], totalProducts: 0, totalStock: 0 },
      analytics: { lowStockCount: 0, lowStockProducts: [] },
      error: "No se pudo conectar con el backend. Verifica que el servidor esté ejecutándose en puerto 5002.",
      source: 'error',
      lastUpdated: new Date().toISOString()
    };
  }
};

// Funciones para ejecutar acciones REALES en el backend usando SuperBot
const executeBusinessAction = async (action, params, messageId = null) => {
  try {
    console.log('🚀 SuperBot ejecutando acción real:', action, params);
    
    // Usar el endpoint unificado del SuperBot
    const response = await fetch('/api/superbot/execute-action', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        action,
        params,
        messageId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Acción SuperBot completada:', result);
      return result;
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      return {
        success: false,
        message: `❌ Error del servidor: ${errorData.message || 'No se pudo completar la acción'}`
      };
    }

  } catch (error) {
    console.error('❌ Error ejecutando acción SuperBot:', error);
    
    // Fallback a endpoints individuales para compatibilidad
    return await executeBusinessActionFallback(action, params);
  }
};

// Fallback a endpoints individuales para compatibilidad
const executeBusinessActionFallback = async (action, params) => {
  try {
    console.log('🔄 Usando fallback para acción:', action, params);
    
    switch (action) {
      case 'add_stock':
        const stockResponse = await fetch('/api/executive/add-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: params.productId,
            quantity: params.quantity,
            unit: params.unit || 'unidades'
          })
        });
        
        if (stockResponse.ok) {
          const result = await stockResponse.json();
          return {
            success: true,
            message: `✅ Stock actualizado: ${params.quantity} ${params.unit || 'unidades'} agregadas`,
            data: result
          };
        }
        break;

      case 'create_product':
        const productResponse = await fetch('/api/executive/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: params.name,
            price: params.price,
            context: params.context || 'general',
            category: params.category || 'Helado',
            initial_stock: params.initialStock || 0
          })
        });
        
        if (productResponse.ok) {
          const result = await productResponse.json();
          return {
            success: true,
            message: `✅ Producto creado: ${params.name} - $${params.price}`,
            data: result
          };
        }
        break;

      case 'update_price':
        const priceResponse = await fetch('/api/executive/update-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: params.productId,
            new_price: params.newPrice
          })
        });
        
        if (priceResponse.ok) {
          const result = await priceResponse.json();
          return {
            success: true,
            message: `✅ Precio actualizado a $${params.newPrice}`,
            data: result
          };
        }
        break;

      default:
        return {
          success: false,
          message: `❌ Acción no reconocida: ${action}`
        };
    }

    return {
      success: false,
      message: `❌ Error ejecutando acción: ${action}`
    };

  } catch (error) {
    console.error('❌ Error en fallback:', error);
    return {
      success: false,
      message: `❌ Error de conexión: ${error.message}`
    };
  }
};

// Crear el contexto
const AIChatContext = createContext(null);

// Provider del contexto
export const AIChatProvider = ({ children }) => {
  // Estados principales usando hooks personalizados
  const { 
    messages, 
    chatState, 
    isLoading, 
    setIsLoading, 
    addMessage, 
    clearHistory, 
    updateChatState, 
    getStats,
    saveAction 
  } = usePersistentChat();

  const { inputMessage, setInputMessage, clearInput } = useChatInput();
  const { isListening, startVoiceCommand, voiceSupported } = useVoiceRecognition(setInputMessage);
  const { connectionStatus } = useConnectionStatus();
  
  // Estado para modelo AI - ahora basado en AIService
  const [selectedModel, setSelectedModel] = React.useState(() => {
    return localStorage.getItem('ai_model') || 'smart_fallback';
  });
  
  const [modelStatus, setModelStatus] = React.useState(() => {
    const serviceStatus = aiService.getServiceStatus();
    return {
      gemini: { 
        quota_used: serviceStatus.dailyRequests, 
        quota_limit: serviceStatus.remainingRequests + serviceStatus.dailyRequests,
        available: serviceStatus.geminiAvailable 
      },
      mock_ai: { quota_used: 0, quota_limit: null, available: true },
      smart_fallback: { quota_used: 0, quota_limit: null, available: true }
    };
  });
  
  // Estado para rastrear qué sistema AI está activo
  const [currentAISource, setCurrentAISource] = React.useState(null);

  // Función para enviar mensaje usando AIService
  const sendMessage = useCallback(async (message) => {
    if (!message?.trim()) return;

    const userMessage = message.trim();
    
    // Agregar mensaje del usuario
    addMessage({
      type: 'user',
      content: userMessage
    });

    clearInput();
    setIsLoading(true);

    try {
      // Verificar caché primero
      const cachedResponse = getCachedResponse(userMessage, messages);
      
      if (cachedResponse) {
        // Usar respuesta del caché
        addMessage({
          type: 'ai',
          content: cachedResponse,
          fromCache: true,
          source: 'cache'
        });
        setIsLoading(false);
        return;
      }

      // Obtener datos reales de la heladería
      const businessData = await getBusinessData();
      
      // Preparar contexto para AIService
      const context = {
        history: messages.slice(-10).map(msg => ({
          type: msg.type,
          content: msg.content
        })),
        currentModel: selectedModel,
        userPreferences: {
          mode: localStorage.getItem('ai-default-mode') || 'guided'
        },
        businessData: businessData,
        executeAction: async (action, params) => {
          // Wrapper para guardar acciones en Supabase
          const result = await executeBusinessAction(action, params);
          
          // Si tenemos saveAction y la acción fue exitosa, guardarla
          if (saveAction && result.success) {
            await saveAction({
              type: action,
              data: params,
              result: result.data,
              success: result.success
            });
          }
          
          return result;
        }
      };

      // Usar AIService con sistema de fallbacks
      const aiResponse = await aiService.processMessage(userMessage, context);
      
      // Guardar en caché solo si es exitoso
      if (aiResponse.message) {
        setCachedResponse(userMessage, messages, aiResponse.message);
      }

      // Actualizar estado de quotas si es Gemini
      if (aiResponse.source === 'gemini') {
        setModelStatus(prev => ({
          ...prev,
          gemini: {
            ...prev.gemini,
            quota_used: prev.gemini.quota_limit - (aiResponse.remainingRequests || 0)
          }
        }));
      }

      // Detectar si se completó una acción
      const actionPatterns = {
        provider_created: /✅.*(?:agregué|creé).*proveedor/i,
        product_created: /✅.*(?:agregué|creé).*producto/i,
        stock_updated: /✅.*(?:agregué|actualicé).*(?:stock|kg)/i
      };

      for (const [action, pattern] of Object.entries(actionPatterns)) {
        if (pattern.test(aiResponse.message)) {
          // Emitir evento de acción completada
          eventBus.emit(EVENTS.AI_ACTION_COMPLETED, { 
            action, 
            response: aiResponse.message,
            canExecute: aiResponse.canExecuteActions 
          });
          break;
        }
      }

      // Agregar mensaje con metadatos adicionales
      addMessage({
        type: 'ai',
        content: aiResponse.message,
        source: aiResponse.source,
        fallbackLevel: aiResponse.fallbackLevel,
        canExecuteActions: aiResponse.canExecuteActions,
        suggestions: aiResponse.suggestions
      });
      
      // Actualizar el indicador del sistema AI activo
      setCurrentAISource(aiResponse.source);

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Fallback final en caso de error completo
      addMessage({
        type: 'ai',
        content: '🤖 **Sistema en Modo Básico**\n\nHubo un problema técnico. Mientras tanto, usa el **Modo Guiado** (botón arriba) donde puedo ayudarte paso a paso.',
        source: 'error',
        fallbackLevel: 0
      });
      
      // Indicar error en el sistema
      setCurrentAISource('fallback');
    } finally {
      setIsLoading(false);
    }
  }, [messages, addMessage, clearInput, setIsLoading, selectedModel]);

  // Quick actions para heladería con comandos SuperBot
  const quickActions = useMemo(() => [
    { id: 'sales', icon: '📊', text: '📊 ¿Cómo van las ventas hoy?' },
    { id: 'stock', icon: '📦', text: '📦 ¿Qué productos necesito reponer?' },
    { id: 'flavors', icon: '🍦', text: '🍦 ¿Cuáles son mis sabores más vendidos?' },
    { id: 'add_stock', icon: '➕', text: '➕ Agregar 10 kg de chocolate' },
    { id: 'new_flavor', icon: '🆕', text: '🆕 Crear helado de pistacho $5000' },
    { id: 'change_prices', icon: '💰', text: '💰 Cambiar precio del helado de vainilla $4800' },
    { id: 'low_stock', icon: '⚠️', text: '⚠️ Productos con stock bajo' },
    { id: 'register_sale', icon: '🛒', text: '🛒 Registrar venta de 3 helados de fresa' },
    { id: 'production', icon: '🏭', text: '🏭 Hacer 20 helados de chocolate' },
    { id: 'help', icon: '❓', text: '❓ ¿Qué comandos puedo usar?' }
  ], []);

  // Manejar quick action
  const handleQuickAction = useCallback((action) => {
    sendMessage(action.text);
  }, [sendMessage]);

  // Función para obtener estado del servicio AI
  const getServiceStatus = useCallback(() => {
    return aiService.getServiceStatus();
  }, []);

  // Función para cambiar modelo (ahora integrada con AIService)
  const changeModel = useCallback((newModel) => {
    const serviceStatus = aiService.getServiceStatus();
    
    // Verificar disponibilidad del modelo
    if (newModel === 'gemini' && (!serviceStatus.geminiAvailable || serviceStatus.remainingRequests <= 0)) {
      // Si Gemini no está disponible o agotado, usar fallback
      setSelectedModel('smart_fallback');
      localStorage.setItem('ai_model', 'smart_fallback');
      return false;
    }
    
    setSelectedModel(newModel);
    localStorage.setItem('ai_model', newModel);
    
    // Actualizar estado del modelo
    setModelStatus({
      gemini: { 
        quota_used: serviceStatus.dailyRequests, 
        quota_limit: serviceStatus.remainingRequests + serviceStatus.dailyRequests,
        available: serviceStatus.geminiAvailable 
      },
      mock_ai: { quota_used: 0, quota_limit: null, available: true },
      smart_fallback: { quota_used: 0, quota_limit: null, available: true }
    });
    
    return true;
  }, []);

  // Valor del contexto memoizado
  const contextValue = useMemo(() => ({
    // Estados
    messages,
    chatState,
    isLoading,
    inputMessage,
    isListening,
    connectionStatus,
    voiceSupported,
    selectedModel,
    modelStatus,
    currentAISource,
    
    // Acciones
    sendMessage,
    setInputMessage,
    updateChatState,
    clearHistory,
    handleQuickAction,
    startVoiceCommand,
    changeModel,
    getServiceStatus,
    
    // Datos
    quickActions,
    getStats
  }), [
    messages,
    chatState,
    isLoading,
    inputMessage,
    isListening,
    connectionStatus,
    voiceSupported,
    selectedModel,
    modelStatus,
    currentAISource,
    sendMessage,
    setInputMessage,
    updateChatState,
    clearHistory,
    handleQuickAction,
    startVoiceCommand,
    changeModel,
    getServiceStatus,
    quickActions,
    getStats
  ]);

  return (
    <AIChatContext.Provider value={contextValue}>
      {children}
    </AIChatContext.Provider>
  );
};

// Hook para usar el contexto
export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat debe ser usado dentro de un AIChatProvider');
  }
  return context;
};

export default AIChatContext;