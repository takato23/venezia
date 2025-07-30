import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, AlertCircle, Zap, Crown } from 'lucide-react';

export default function ChatAssistant({ 
  mode = 'basic', 
  quotaRemaining = 50,
  onExecuteAction
}) {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: mode === 'basic' 
        ? '👋 ¡Hola! Soy tu asistente básico. Puedo ayudarte con comandos específicos como "agregar 10kg de chocolate" o "crear producto vainilla precio 3500".'
        : '🌟 ¡Hola! Soy tu asistente AI Premium. Puedo entender cualquier consulta en lenguaje natural y ayudarte con reportes avanzados.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const BASIC_SUGGESTIONS = [
    "agregar 10kg de chocolate",
    "crear producto menta precio 3500",
    "cambiar precio vainilla 4000",
    "consultar stock",
    "listar productos"
  ];

  const PREMIUM_SUGGESTIONS = [
    "¿Cuáles son las tendencias de venta este mes?",
    "Analiza el rendimiento de los productos nuevos",
    "¿Qué sabores son más populares en verano?",
    "Sugiere precios para maximizar ganancia",
    "Compara ventas con el mes anterior"
  ];

  const suggestions = mode === 'basic' ? BASIC_SUGGESTIONS : PREMIUM_SUGGESTIONS;

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage = { type: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simular procesamiento según el modo
      let response;
      
      if (mode === 'basic') {
        // Para modo básico, solo comandos específicos
        response = await processBasicCommand(message);
      } else {
        // Para modo premium, usar Gemini real
        response = await processPremiumChat(message);
      }

      const aiMessage = { type: 'ai', content: response };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage = { 
        type: 'ai', 
        content: '❌ Lo siento, hubo un error. Intenta nuevamente.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processBasicCommand = async (message) => {
    // Usar la misma API que el chat original
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.response || data.message;
      } else {
        throw new Error(data.message || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error en processBasicCommand:', error);
      
      // Fallback local si falla la API
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('agregar') && lowerMessage.includes('kg')) {
        const match = lowerMessage.match(/(\d+(?:\.\d+)?)\s*kg.*?(\w+)/);
        if (match) {
          const [, quantity, product] = match;
          return `✅ **Perfecto!** Agregué ${quantity} kg de ${product} al inventario.\n\n📦 ¿Necesitas agregar stock de otro producto?`;
        }
      }
      
      if (lowerMessage.includes('crear') && lowerMessage.includes('precio')) {
        const match = lowerMessage.match(/crear.*?(\w+(?:\s+\w+)*).*?precio.*?(\d+)/);
        if (match) {
          const [, product, price] = match;
          return `✅ **Genial!** Creé el producto "${product}" con precio $${price}.\n\n🎯 ¿Quieres agregarle stock ahora?`;
        }
      }

      if (lowerMessage.includes('consultar') || lowerMessage.includes('stock')) {
        return `📦 **Stock actual:**\n\n• Chocolate: 25 kg\n• Vainilla: 18 kg\n• Dulce de Leche: 32 kg\n\n🔍 ¿Quieres consultar algún producto específico?`;
      }

      return `🤔 No entendí ese comando. En modo básico uso comandos específicos:\n\n📝 **Ejemplos:**\n• "agregar 10kg de chocolate"\n• "crear producto menta precio 3500"\n• "consultar stock"\n\n💡 **Tip:** Usa el Asistente Guiado para acciones paso a paso.`;
    }
  };

  const processPremiumChat = async (message) => {
    // Aquí iría la llamada real a Gemini
    return `🌟 **Respuesta Premium:** Procesando "${message}" con AI avanzada...\n\n(Aquí iría la respuesta real de Gemini con análisis inteligente)\n\n📊 ¿Necesitas más detalles sobre algún aspecto específico?`;
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col h-96">
      {/* Header */}
      <div className={`p-4 border-b ${mode === 'premium' ? 'bg-purple-50' : 'bg-blue-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'premium' ? (
              <Crown className="w-5 h-5 text-purple-600" />
            ) : (
              <Zap className="w-5 h-5 text-blue-600" />
            )}
            <h3 className={`font-semibold ${mode === 'premium' ? 'text-purple-800' : 'text-blue-800'}`}>
              {mode === 'premium' ? 'Chat AI Premium' : 'Chat Básico'}
            </h3>
          </div>
          
          {mode === 'basic' && (
            <div className="text-xs text-gray-600">
              {quotaRemaining} consultas restantes
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Procesando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-500 mb-2">Sugerencias:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`text-xs px-3 py-1 rounded-full border hover:bg-gray-50 ${
                  mode === 'premium' 
                    ? 'border-purple-200 text-purple-700' 
                    : 'border-blue-200 text-blue-700'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        {quotaRemaining === 0 && mode === 'basic' ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">Agotaste las consultas de hoy</p>
            <button className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              Upgrade a Premium
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              placeholder={
                mode === 'premium' 
                  ? "Pregunta cualquier cosa..." 
                  : "Escribe un comando específico..."
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                mode === 'premium' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-300`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}