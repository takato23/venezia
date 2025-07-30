import React, { useState } from 'react';
import { Bot, MessageCircle, Zap, HelpCircle, TrendingUp, Package } from 'lucide-react';
import { useAIChat } from '../../contexts/AIChatContext';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const POSAIAssistant = ({ cart = [], className = "" }) => {
  // Validación de contexto con fallback
  let sendMessage, isLoading;
  try {
    const chatContext = useAIChat();
    sendMessage = chatContext.sendMessage;
    isLoading = chatContext.isLoading;
  } catch (error) {
    // Fallback si no hay AIChatProvider
    console.warn('POSAIAssistant: AIChatProvider no disponible, usando fallback');
    sendMessage = async () => console.log('AI Chat no disponible');
    isLoading = false;
  }
  const [isExpanded, setIsExpanded] = useState(false);

  // Preguntas contextuales basadas en el estado del carrito
  const getContextualQuestions = () => {
    const baseQuestions = [
      "¿Cuál es el helado más vendido hoy?",
      "¿Cómo van las ventas vs ayer?",
      "¿Qué sabores están por agotarse?",
      "¿Cuál es mi mejor horario de ventas?"
    ];

    const cartBasedQuestions = [];
    
    if (cart.length > 0) {
      cartBasedQuestions.push("¿Qué puedo sugerir para aumentar esta venta?");
      
      const hasIceCream = cart.some(item => 
        item.name?.toLowerCase().includes('helado') || 
        item.category?.toLowerCase().includes('helado')
      );
      
      if (hasIceCream) {
        cartBasedQuestions.push("¿Qué complementos van bien con estos helados?");
      }
      
      if (cart.length >= 3) {
        cartBasedQuestions.push("¿Puedo ofrecer algún descuento por volumen?");
      }
    } else {
      cartBasedQuestions.push("¿Qué promociones puedo ofrecer hoy?");
    }

    return [...cartBasedQuestions, ...baseQuestions].slice(0, 6);
  };

  const quickQuestions = getContextualQuestions();

  const handleQuickQuestion = async (question) => {
    // Agregar contexto del carrito si existe
    let contextualQuestion = question;
    if (cart.length > 0 && question.includes('esta venta')) {
      const cartContext = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
      contextualQuestion = `${question} Mi carrito actual tiene: ${cartContext}`;
    }
    
    await sendMessage(contextualQuestion);
    setIsExpanded(false); // Colapsar después de enviar
  };

  if (!isExpanded) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">🤖 Asistente IA</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Preguntas rápidas sobre ventas</p>
            </div>
          </div>
          <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          🤖 Asistente IA
        </h4>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Estado del carrito si hay items */}
      {cart.length > 0 && (
        <div className="mb-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carrito actual:</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {cart.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(', ')}
            {cart.length > 2 && ` +${cart.length - 2} más`}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          💡 Preguntas sugeridas:
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          {quickQuestions.map((question, index) => {
            const icons = [Zap, TrendingUp, Package, HelpCircle, MessageCircle, Bot];
            const IconComponent = icons[index % icons.length];
            
            return (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading}
                className="text-left p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">{question}</span>
                </div>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Consultando...
            </span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💬 Para preguntas más detalladas, usa el chat principal
          </p>
        </div>
      </div>
    </div>
  );
};

export default POSAIAssistant;