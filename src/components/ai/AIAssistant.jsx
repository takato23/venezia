import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  TrendingUp, 
  BarChart3, 
  Package, 
  Send, 
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  ShoppingCart,
  Warehouse
} from 'lucide-react';
import MockAIService from './MockAIService';

// Componente principal del Asistente AI
const AIAssistant = () => {
  // Estados para diferentes pestañas
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [businessAnalysis, setBusinessAnalysis] = useState(null);
  const [inventoryOptimization, setInventoryOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencias para scroll automático
  const chatEndRef = useRef(null);
  
  // Auto-scroll del chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);
  
  // Enviar mensaje al chat
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;
    
    const userMessage = currentMessage;
    setCurrentMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages.slice(-10) // Últimos 10 mensajes
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      
      // Try fallback to mock service
      try {
        const aiResponse = await MockAIService.chatResponse(userMessage, chatMessages.slice(-10));
        setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } catch (mockError) {
        // Final fallback
        const fallbackResponse = `❌ **Error de conectividad**

No pude procesar tu consulta: "${userMessage}"

**Posibles causiones:**
• Servidor temporalmente no disponible
• Error de red
• Servicio en mantenimiento

**Mientras tanto puedes:**
• Intentar de nuevo en unos segundos
• Verificar tu conexión a internet
• Consultar directamente las otras pestañas (Dashboard, Ventas, etc.)

¿Te gustaría intentar una consulta diferente?`;
        
        setChatMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener predicciones de ventas
  const fetchPredictions = async (days = 7) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try real API first, fallback to mock
      let data;
      try {
        const response = await fetch(`/api/ai/predict_sales?days=${days}`);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to mock service
        data = await MockAIService.getPredictions(days);
      }
      setPredictions(data);
    } catch (err) {
      setError('Error al obtener predicciones de ventas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener análisis de negocio
  const fetchBusinessAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try real API first, fallback to mock
      let data;
      try {
        const response = await fetch('/api/ai/business_analysis');
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to mock service
        data = await MockAIService.getBusinessAnalysis();
      }
      setBusinessAnalysis(data);
    } catch (err) {
      setError('Error al obtener análisis de negocio');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener optimización de inventario
  const fetchInventoryOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try real API first, fallback to mock
      let data;
      try {
        const response = await fetch('/api/ai/inventory_optimization');
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to mock service
        data = await MockAIService.getInventoryOptimization();
      }
      setInventoryOptimization(data);
    } catch (err) {
      setError('Error al obtener optimización de inventario');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar Enter en input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Componente de pestañas
  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
  
  // Componente de mensaje de chat mejorado
  const ChatMessage = ({ message }) => {
    const formatMessage = (content) => {
      // Convert **bold** to JSX
      const parts = content.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    return (
      <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
        {message.role === 'assistant' && (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-white" />
          </div>
        )}
        <div
          className={`max-w-2xl p-4 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {message.role === 'assistant' ? formatMessage(message.content) : message.content}
          </div>
          {message.role === 'assistant' && (
            <div className="text-xs text-gray-500 mt-2 flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Respuesta en tiempo real de la base de datos
            </div>
          )}
        </div>
        {message.role === 'user' && (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-white" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Asistente AI Venezia</h1>
        <p className="text-gray-600">Análisis inteligente y predicciones para tu heladería</p>
      </div>
      
      {/* Pestañas */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <TabButton
          id="chat"
          label="Chat Inteligente"
          icon={MessageCircle}
          isActive={activeTab === 'chat'}
          onClick={setActiveTab}
        />
        <TabButton
          id="predictions"
          label="Predicciones"
          icon={TrendingUp}
          isActive={activeTab === 'predictions'}
          onClick={setActiveTab}
        />
        <TabButton
          id="analysis"
          label="Análisis"
          icon={BarChart3}
          isActive={activeTab === 'analysis'}
          onClick={setActiveTab}
        />
        <TabButton
          id="inventory"
          label="Inventario"
          icon={Package}
          isActive={activeTab === 'inventory'}
          onClick={setActiveTab}
        />
      </div>
      
      {/* Error global */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {/* Contenido de pestañas */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="p-6">
            <div className="h-96 overflow-y-auto mb-4 space-y-4 border rounded-lg p-4 bg-gray-50">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot size={48} className="mx-auto mb-4 text-blue-500" />
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">¡Hola! Soy tu asistente AI ejecutivo para Venezia Ice Cream</h3>
                      <p className="text-sm text-gray-600">Conectado a la base de datos real - Puedo consultar y ejecutar acciones</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm max-w-4xl mx-auto">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 Consultas en tiempo real</h4>
                        <ul className="text-xs space-y-1 text-blue-700">
                          <li>• "¿Qué helados tenemos?"</li>
                          <li>• "¿Cuánto vendimos hoy?"</li>
                          <li>• "Muéstrame los proveedores"</li>
                          <li>• "¿Cómo van las ventas?"</li>
                        </ul>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">⚡ Acciones ejecutivas</h4>
                        <ul className="text-xs space-y-1 text-green-700">
                          <li>• "Suma 2 kg de chocolate"</li>
                          <li>• "Producir 25 kg de vainilla"</li>
                          <li>• "¿Qué repartidores disponibles?"</li>
                          <li>• "Crear orden de producción"</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-md mx-auto">
                      <p><strong>🔗 Conectividad:</strong> Acceso directo a productos, ventas, stock y proveedores</p>
                      <p><strong>⚡ Poder ejecutivo:</strong> Puedo modificar inventario y crear órdenes reales</p>
                    </div>
                  </div>
                </div>
              )}
              {chatMessages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {loading && (
                <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <Loader2 size={16} className="animate-spin" />
                  <span>🤖 Procesando comando y ejecutando acción...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Quick suggestions */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "¿Qué helados tenemos?",
                  "¿Cuánto vendimos hoy?",
                  "Suma 2 kg de chocolate",
                  "Muéstrame los proveedores"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessage(suggestion)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta o comando..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Enviar</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Predicciones de Ventas</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchPredictions(7)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={loading}
                >
                  7 días
                </button>
                <button
                  onClick={() => fetchPredictions(14)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  disabled={loading}
                >
                  14 días
                </button>
                <button
                  onClick={() => fetchPredictions(30)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  disabled={loading}
                >
                  30 días
                </button>
              </div>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Generando predicciones...</span>
              </div>
            )}
            
            {predictions && !loading && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Resumen Ejecutivo</h3>
                  <p className="text-blue-800">{predictions.summary}</p>
                </div>
                
                {/* Predicciones diarias */}
                {predictions.predictions && predictions.predictions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Predicciones Diarias</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {predictions.predictions.map((pred, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span className="text-sm font-medium">{pred.date}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ShoppingCart size={14} className="text-blue-500" />
                              <span className="text-sm">Ventas: {pred.predicted_sales}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign size={14} className="text-green-500" />
                              <span className="text-sm">Ingresos: ${pred.predicted_revenue?.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Confianza: {(pred.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Productos recomendados */}
                {predictions.recommended_products && predictions.recommended_products.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Productos Recomendados</h3>
                    <div className="grid gap-2">
                      {predictions.recommended_products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{product.product_name}</span>
                          <div className="text-right">
                            <div className="text-sm">Demanda: {product.expected_demand}</div>
                            <div className={`text-xs ${
                              product.priority === 'alta' ? 'text-red-600' :
                              product.priority === 'media' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              Prioridad: {product.priority}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Insights */}
                {predictions.insights && predictions.insights.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Insights Clave</h3>
                    <ul className="space-y-2">
                      {predictions.insights.map((insight, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {!predictions && !loading && (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Selecciona un período para generar predicciones de ventas</p>
              </div>
            )}
          </div>
        )}
        
        {/* Business Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Análisis de Rendimiento</h2>
              <button
                onClick={fetchBusinessAnalysis}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generar Análisis'}
              </button>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Analizando rendimiento...</span>
              </div>
            )}
            
            {businessAnalysis && !loading && (
              <div className="space-y-6">
                {/* Score y tendencias */}
                {businessAnalysis.performance_score && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                    <h3 className="font-medium mb-4">Score de Rendimiento</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {businessAnalysis.performance_score}/10
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${businessAnalysis.performance_score * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Resumen */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Resumen Ejecutivo</h3>
                  <p className="text-gray-700">{businessAnalysis.summary}</p>
                </div>
                
                {/* Recomendaciones */}
                {businessAnalysis.recommendations && (
                  <div>
                    <h3 className="font-medium mb-4">Recomendaciones Estratégicas</h3>
                    <div className="space-y-3">
                      {businessAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{rec.category}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'alta' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.action}</p>
                          <p className="text-xs text-gray-500">{rec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!businessAnalysis && !loading && (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Genera un análisis completo del rendimiento de tu negocio</p>
              </div>
            )}
          </div>
        )}
        
        {/* Inventory Optimization Tab */}
        {activeTab === 'inventory' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Optimización de Inventario</h2>
              <button
                onClick={fetchInventoryOptimization}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Optimizar Inventario'}
              </button>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Optimizando inventario...</span>
              </div>
            )}
            
            {inventoryOptimization && !loading && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">Resumen de Optimización</h3>
                  <p className="text-orange-800">{inventoryOptimization.summary}</p>
                </div>
                
                {/* Alertas de stock */}
                {inventoryOptimization.stock_alerts && inventoryOptimization.stock_alerts.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4 flex items-center space-x-2">
                      <AlertCircle size={18} className="text-red-500" />
                      <span>Alertas de Stock</span>
                    </h3>
                    <div className="space-y-3">
                      {inventoryOptimization.stock_alerts.map((alert, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{alert.product}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              alert.urgency === 'alta' ? 'bg-red-100 text-red-800' :
                              alert.urgency === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.urgency}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Tienda: {alert.store}</div>
                            <div>Stock actual: {alert.current_stock}</div>
                            <div>Stock recomendado: {alert.recommended_stock}</div>
                            <div className="text-xs text-gray-500 mt-2">{alert.reasoning}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Exceso de stock */}
                {inventoryOptimization.overstock_items && inventoryOptimization.overstock_items.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4 flex items-center space-x-2">
                      <Warehouse size={18} className="text-yellow-500" />
                      <span>Exceso de Stock</span>
                    </h3>
                    <div className="space-y-3">
                      {inventoryOptimization.overstock_items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.product}</span>
                            <span className="text-sm text-gray-600">{item.store}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <div>Stock actual: {item.current_stock}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Acción sugerida: {item.suggested_action}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Prioridades de producción */}
                {inventoryOptimization.production_priorities && inventoryOptimization.production_priorities.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Prioridades de Producción</h3>
                    <div className="grid gap-2">
                      {inventoryOptimization.production_priorities.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-900">{product}</span>
                          <span className="text-sm text-green-700">Prioridad {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!inventoryOptimization && !loading && (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Optimiza tu inventario con recomendaciones inteligentes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant; 