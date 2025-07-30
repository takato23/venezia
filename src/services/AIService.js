// Sistema de fallbacks inteligente para AI con SuperBot Venezia
// Nivel 1: Sistema guiado (siempre funciona)
// Nivel 2: Respuestas predefinidas (MockAI)  
// Nivel 3: Gemini API + SuperBot (cuando esté disponible)
// Nivel 4: SuperBot standalone para comandos específicos

class AIService {
  constructor() {
    this.dailyRequestCount = this.getDailyRequestCount();
    this.maxDailyRequests = 1500; // Límite real de Gemini 1.5 Flash
    
    // En React, las variables de entorno deben empezar con REACT_APP_
    // y estar disponibles en window o process.env solo si webpack las incluye
    this.geminiApiKey = this.getGeminiApiKey();
    this.isGeminiAvailable = false;
    this.lastGeminiCheck = null;
    this.geminiModel = 'gemini-1.5-flash-latest'; // Modelo más reciente
    
    // SuperBot integration
    this.superBotEnabled = true;
    this.superBotEndpoint = '/api/superbot';
    
    // Cache de respuestas para optimizar
    this.responseCache = new Map();
    this.cacheMaxSize = 100;
    this.cacheMaxAge = 60 * 60 * 1000; // 1 hora
    
    // Verificar disponibilidad de Gemini al inicializar solo si hay API key
    if (this.geminiApiKey) {
      console.log('🚀 Iniciando AIService con Gemini API');
      this.checkGeminiAvailability();
    } else {
      console.log('⚠️ AIService iniciando sin Gemini API - usando fallbacks');
    }
  }

  // Obtener API key de diferentes fuentes posibles
  getGeminiApiKey() {
    // Primero intentar con la variable de entorno directa (webpack define)
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
      console.log('🔑 API Key encontrada en process.env');
      return process.env.REACT_APP_GEMINI_API_KEY;
    }
    
    // Nota: import.meta no es compatible con Webpack, usando solo process.env
    
    // Fallback: buscar en localStorage para configuración manual
    const stored = localStorage.getItem('gemini-api-key');
    if (stored) {
      console.log('🔑 API Key encontrada en localStorage');
      return stored;
    }
    
    console.log('⚠️ No se encontró API Key de Gemini');
    // Si no hay API key, retornar null
    return null;
  }

  // Gestión de conteo diario
  getDailyRequestCount() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('gemini-usage');
    
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        return count;
      }
    }
    
    // Nuevo día, resetear contador
    return 0;
  }

  incrementRequestCount() {
    const today = new Date().toDateString();
    this.dailyRequestCount++;
    
    localStorage.setItem('gemini-usage', JSON.stringify({
      date: today,
      count: this.dailyRequestCount
    }));
  }

  canUseGemini() {
    return (
      this.geminiApiKey &&
      this.isGeminiAvailable &&
      this.dailyRequestCount < this.maxDailyRequests
    );
  }

  // Verificar si Gemini está disponible
  async checkGeminiAvailability() {
    // No verificar más de una vez por hora
    if (this.lastGeminiCheck && 
        Date.now() - this.lastGeminiCheck < 3600000) {
      return this.isGeminiAvailable;
    }

    if (!this.geminiApiKey) {
      this.isGeminiAvailable = false;
      return false;
    }

    try {
      // Hacer una consulta muy simple para verificar
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "test" }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      });

      this.isGeminiAvailable = response.status !== 401 && response.status !== 403;
      this.lastGeminiCheck = Date.now();
      
      return this.isGeminiAvailable;
    } catch (error) {
      console.log('Gemini no disponible:', error.message);
      this.isGeminiAvailable = false;
      this.lastGeminiCheck = Date.now();
      return false;
    }
  }

  // Método principal para procesar mensajes
  async processMessage(message, context = {}) {
    const response = {
      message: '',
      source: '',
      canExecuteActions: false,
      suggestions: [],
      fallbackLevel: 0
    };

    try {
      // Nivel 4: Intentar SuperBot primero para comandos específicos
      if (this.superBotEnabled && this.isCommandMessage(message)) {
        const superBotResponse = await this.trySuperBot(message, context);
        if (superBotResponse.success) {
          console.log('🤖 Usando SuperBot Venezia para comando específico');
          return {
            ...response,
            message: superBotResponse.message,
            source: 'superbot',
            canExecuteActions: true,
            suggestions: superBotResponse.suggestions || [],
            fallbackLevel: 4,
            actionExecuted: superBotResponse.actionExecuted || false,
            data: superBotResponse.data
          };
        }
      }

      // Nivel 3: Intentar Gemini API con SuperBot integration
      if (this.canUseGemini()) {
        const geminiResponse = await this.tryGeminiAPI(message, context);
        if (geminiResponse.success) {
          console.log('🎉 Usando Gemini AI para respuesta inteligente');
          this.incrementRequestCount();
          return {
            ...response,
            message: geminiResponse.message,
            source: 'gemini',
            canExecuteActions: true,
            suggestions: geminiResponse.suggestions || [],
            fallbackLevel: 3,
            remainingRequests: this.maxDailyRequests - this.dailyRequestCount,
            actionExecuted: geminiResponse.actionExecuted || false
          };
        }
      }

      // Nivel 2: MockAI con respuestas inteligentes
      const mockResponse = await this.tryMockAI(message, context);
      
      if (mockResponse.success) {
        return {
          ...response,
          message: mockResponse.message,
          source: 'mock',
          canExecuteActions: mockResponse.canExecuteActions || false,
          suggestions: mockResponse.suggestions || [],
          fallbackLevel: 2
        };
      }

      // Nivel 1: Respuesta de fallback final
      return {
        ...response,
        message: this.getFallbackResponse(message),
        source: 'fallback',
        canExecuteActions: false,
        suggestions: this.getFallbackSuggestions(),
        fallbackLevel: 1
      };

    } catch (error) {
      console.error('Error en AIService:', error);
      return {
        ...response,
        message: this.getFallbackResponse(message),
        source: 'error',
        canExecuteActions: false,
        suggestions: this.getFallbackSuggestions(),
        fallbackLevel: 0
      };
    }
  }

  // Intentar usar Gemini API
  async tryGeminiAPI(message, context) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUsuario: ${message}`;

      // Verificar cache primero
      const cacheKey = this.generateCacheKey(message, context);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log('💾 Usando respuesta cacheada de Gemini');
        return cachedResponse;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800, // Aumentado para respuestas más completas
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiMessage) {
        // Intentar detectar y ejecutar acciones automáticamente
        let finalMessage = aiMessage;
        let actionExecuted = false;

        // Detectar patrones de acciones en la respuesta de Gemini
        const actionResult = await this.detectAndExecuteActions(aiMessage, context);
        if (actionResult.executed) {
          finalMessage = actionResult.message;
          actionExecuted = true;
        }

        const result = {
          success: true,
          message: finalMessage,
          suggestions: this.extractSuggestions(finalMessage),
          actionExecuted: actionExecuted
        };
        
        // Cachear respuesta exitosa
        this.setCachedResponse(cacheKey, result);
        
        return result;
      }

      throw new Error('No response from Gemini');
    } catch (error) {
      console.error('Error con Gemini API:', error);
      return { success: false, error: error.message };
    }
  }

  // Detectar y ejecutar acciones desde la respuesta de Gemini
  async detectAndExecuteActions(aiMessage, context) {
    if (!context.executeAction) {
      return { executed: false, message: aiMessage };
    }

    const lowerMessage = aiMessage.toLowerCase();
    
    try {
      // Detectar patrón: "agregar X unidades al stock de Y"
      const addStockPattern = /agregar (\d+) (?:unidades|kg|litros)?\s*(?:al\s*stock\s*de\s*|a\s*)?(.+)/i;
      const addStockMatch = lowerMessage.match(addStockPattern);
      
      if (addStockMatch) {
        const quantity = parseInt(addStockMatch[1]);
        const productName = addStockMatch[2].trim();
        
        // Buscar el producto en los datos del contexto
        const product = context.businessData?.inventory?.products?.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        
        if (product) {
          const actionResult = await context.executeAction('add_stock', {
            productId: product.id,
            quantity: quantity,
            unit: 'unidades'
          });
          
          if (actionResult.success) {
            return {
              executed: true,
              message: `${aiMessage}\n\n🚀 **ACCIÓN EJECUTADA:**\n${actionResult.message}`
            };
          }
        }
      }

      // Detectar patrón: "crear helado de X a $Y"
      const createProductPattern = /crear (?:helado (?:de )?)?(.+?)\s+(?:a\s*)?\$(\d+)/i;
      const createMatch = lowerMessage.match(createProductPattern);
      
      if (createMatch) {
        const flavor = createMatch[1].trim();
        const price = parseInt(createMatch[2]);
        
        const actionResult = await context.executeAction('create_product', {
          name: `Helado ${flavor.charAt(0).toUpperCase() + flavor.slice(1)}`,
          price: price,
          category: 'Helado',
          context: 'general',
          initialStock: 0
        });
        
        if (actionResult.success) {
          return {
            executed: true,
            message: `${aiMessage}\n\n🚀 **ACCIÓN EJECUTADA:**\n${actionResult.message}`
          };
        }
      }

      // Detectar patrón: "cambiar precio de X a $Y"
      const updatePricePattern = /cambiar (?:el )?precio (?:de )?(.+?)\s+(?:a\s*)?\$(\d+)/i;
      const priceMatch = lowerMessage.match(updatePricePattern);
      
      if (priceMatch) {
        const productName = priceMatch[1].trim();
        const newPrice = parseInt(priceMatch[2]);
        
        const product = context.businessData?.inventory?.products?.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        
        if (product) {
          const actionResult = await context.executeAction('update_price', {
            productId: product.id,
            newPrice: newPrice
          });
          
          if (actionResult.success) {
            return {
              executed: true,
              message: `${aiMessage}\n\n🚀 **ACCIÓN EJECUTADA:**\n${actionResult.message}`
            };
          }
        }
      }

    } catch (error) {
      console.error('Error ejecutando acción:', error);
    }

    return { executed: false, message: aiMessage };
  }

  // Detectar si es un mensaje de comando específico
  isCommandMessage(message) {
    const commandPatterns = [
      /(?:agregar|añadir|suma|sumar)\s+\d+\s*(?:kg|unidades|litros)?\s+(?:de\s+)?/i,
      /(?:crear|agregar|añadir)\s+(?:helado\s+(?:de\s+)?)?.*?\s+(?:a\s+)?\$\d+/i,
      /(?:cambiar|actualizar|modificar)\s+(?:el\s+)?precio\s+(?:de\s+|del\s+)?.*?\s+(?:a\s+)?\$\d+/i,
      /¿?(?:cuánto|cuanto)\s+.*\s+(?:queda|tengo|hay)/i,
      /(?:productos|stock)\s+(?:con\s+)?(?:poco|bajo)\s+(?:stock)?/i,
      /(?:registrar|anotar)\s+venta\s+(?:de\s+)?\d+\s+/i,
      /(?:hacer|producir|preparar)\s+\d+\s+(?:helados?\s+(?:de\s+)?)?/i
    ];
    
    return commandPatterns.some(pattern => pattern.test(message));
  }

  // Intentar usar SuperBot Venezia
  async trySuperBot(message, context) {
    try {
      // Dinámicamente importar SuperBot
      const SuperBotVenezia = (await import('./SuperBotVenezia.js')).default;
      
      // Procesar comando con SuperBot
      const result = await SuperBotVenezia.processCommand(message, {
        ...context,
        executeAction: async (action, params) => {
          // Ejecutar acción a través del endpoint del backend
          if (context.executeAction) {
            return await context.executeAction(action, params);
          } else {
            // Fallback: usar endpoint directo
            try {
              const response = await fetch('/api/superbot/execute-action', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action, params })
              });
              
              return await response.json();
            } catch (error) {
              return {
                success: false,
                message: `Error ejecutando acción: ${error.message}`
              };
            }
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error con SuperBot:', error);
      return { success: false, error: error.message };
    }
  }

  // Construir prompt del sistema para Gemini
  buildSystemPrompt(context) {
    const businessData = context.businessData || {};
    
    return `Eres VenezIA, el asistente inteligente para la heladería Venezia Ice Cream con capacidades SuperBot.

CONTEXTO DE LA HELADERÍA:
- Productos: Helados artesanales, sabores premium
- Sistema: Gestión completa (inventario, ventas, producción, entregas)
- Usuario: Dueño/administrador de la heladería

DATOS EN TIEMPO REAL ACTUALES:
${businessData.sales ? `
VENTAS DE HOY:
- Total vendido: $${businessData.sales.today.total}
- Número de transacciones: ${businessData.sales.today.transactions}
- Ticket promedio: $${businessData.sales.today.avgTicket}
- Productos más vendidos hoy: ${businessData.sales.today.topProducts?.map(p => `${p.name} (${p.units} unidades, $${p.revenue})`).join(', ')}
` : ''}

${businessData.inventory ? `
INVENTARIO ACTUAL:
Ingredientes disponibles:
${businessData.inventory.ingredients?.map(i => `- ${i.name}: ${i.quantity} ${i.unit} ${i.quantity <= i.minimum ? '⚠️ BAJO' : '✅'}`).join('\n')}

Productos terminados:
${businessData.inventory.products?.map(p => `- ${p.name}: ${p.stock} unidades (precio: $${p.price}) ${p.stock <= p.minimum ? '⚠️ BAJO' : '✅'}`).join('\n')}
` : ''}

${businessData.analytics ? `
ANÁLISIS:
Sabores más vendidos este mes:
${businessData.analytics.bestSellers?.map((s, i) => `${i+1}. ${s.name}: ${s.salesThisMonth} unidades`).join('\n')}

Stock bajo que requiere atención:
${businessData.analytics.lowStock?.map(l => `- ${l.name}: ${l.quantity || l.stock} ${l.unit || 'unidades'} (necesitas ${l.needed} más)`).join('\n')}
` : ''}

CAPACIDADES QUE TIENES:
- Usar los datos REALES mostrados arriba (no inventes números)
- Analizar tendencias de ventas y stock
- Hacer recomendaciones basadas en datos reales
- Ayudar con decisiones de negocio

CAPACIDADES DE EJECUCIÓN SUPERBOT:
- Puedes ejecutar acciones reales en el sistema automáticamente
- Acciones disponibles: agregar stock, crear productos, cambiar precios, registrar ventas, crear órdenes de producción
- Integración con SuperBot Venezia para comandos de voz y texto natural
- Detección automática de comandos específicos y ejecución inteligente
- Sistema de confirmación configurable por el usuario

INSTRUCCIONES IMPORTANTES:
1. SIEMPRE usa los datos reales proporcionados arriba
2. NO inventes números o datos que no están en el contexto
3. Responde en español de manera natural y amigable
4. Sé específico con los números reales del negocio
5. Menciona alertas de stock bajo cuando sea relevante
6. Proporciona análisis útiles basados en los datos reales
7. Cuando detectes una solicitud de acción, pregunta confirmación antes de ejecutar

EJEMPLOS DE ACCIONES EJECUTABLES SUPERBOT:
- "Agregar 10 kg de chocolate" → Detectar y ejecutar add_stock automáticamente
- "Crear helado de pistacho $5000" → Detectar y ejecutar create_product
- "Cambiar precio del helado de vainilla a $4800" → Detectar y ejecutar update_price
- "Registrar venta de 3 helados de fresa" → Detectar y ejecutar register_sale
- "Hacer 20 helados de chocolate" → Detectar y ejecutar create_production_order
- "¿Cuánto chocolate queda?" → Consultar stock automáticamente
- "Productos con stock bajo" → Mostrar alertas automáticamente

Responde al usuario de manera útil y práctica usando SOLO los datos reales proporcionados:`;
  }

  // Usar el sistema MockAI mejorado
  async tryMockAI(message, context) {
    try {
      // Importar dinámicamente el MockAIService
      const MockAIService = (await import('../components/ai/MockAIService.js')).default;
      const response = await MockAIService.chatResponse(message, context.history || []);
      
      // Verificar si la respuesta indica una acción ejecutable
      const canExecuteActions = this.detectExecutableActions(message);
      
      return {
        success: true,
        message: response,
        canExecuteActions,
        suggestions: this.extractSuggestionsFromMock(response)
      };
    } catch (error) {
      console.error('Error con MockAI:', error);
      return { success: false, error: error.message };
    }
  }

  // Detectar si el mensaje requiere acciones ejecutables
  detectExecutableActions(message) {
    const actionKeywords = [
      'suma', 'agrega', 'agregar', 'añadir', 'incrementar',
      'crea', 'crear', 'nuevo', 'nueva',
      'cambia', 'cambiar', 'actualizar', 'modificar',
      'precio', 'precios', 'stock', 'inventario'
    ];
    
    const lowerMessage = message.toLowerCase();
    return actionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Extraer sugerencias inteligentes de respuestas de Gemini
  extractSuggestions(text, businessData = null) {
    return this.extractIntelligentSuggestions(text, businessData);
  }

  // Extraer sugerencias de respuestas del Mock
  extractSuggestionsFromMock(text) {
    if (text.includes('stock') || text.includes('inventario')) {
      return [
        "Ver stock completo",
        "Agregar stock",
        "Productos con stock bajo"
      ];
    }
    
    if (text.includes('precio') || text.includes('ventas')) {
      return [
        "Cambiar precios",
        "Ver ventas del día",
        "Productos más vendidos"
      ];
    }
    
    return [
      "Gestionar stock",
      "Crear producto",
      "Ver reportes"
    ];
  }

  // Respuesta de fallback final - Más guiado
  getFallbackResponse(message) {
    // Analizar el mensaje para dar una respuesta más guiada
    const lowerMessage = message.toLowerCase();
    
    // Si pregunta por stock
    if (lowerMessage.includes('stock') || lowerMessage.includes('inventario')) {
      return `📦 **Para gestionar tu stock:**

1️⃣ **Ver stock**: Haz clic en "Inventario" en el menú lateral
2️⃣ **Agregar stock**: Usa el botón "+ Agregar Stock" en la página de inventario
3️⃣ **Stock bajo**: Los productos con poco stock aparecen marcados en rojo

💡 *Tip: Para comandos rápidos, escribe exactamente "suma 5 kg de chocolate"*`;
    }
    
    // Si pregunta por ventas
    if (lowerMessage.includes('venta') || lowerMessage.includes('vendi')) {
      return `📈 **Para ver tus ventas:**

1️⃣ **Ventas del día**: Ve a "Ventas" en el menú lateral
2️⃣ **Reportes**: Usa el botón "Generar Reporte" para estadísticas
3️⃣ **Productos más vendidos**: Aparecen destacados en el dashboard

💡 *Tip: El dashboard muestra un resumen rápido de todo*`;
    }
    
    // Si pregunta por productos
    if (lowerMessage.includes('producto') || lowerMessage.includes('crear') || lowerMessage.includes('agregar')) {
      return `🍨 **Para gestionar productos:**

1️⃣ **Crear producto**: Ve a "Productos" → "+ Nuevo Producto"
2️⃣ **Editar precios**: Haz clic en el producto → "Editar"
3️⃣ **Activar/Desactivar**: Usa el switch junto a cada producto

💡 *Tip: Para crear rápido, escribe "crear helado de menta $4500"*`;
    }
    
    // Respuesta genérica pero útil
    return `🤖 **Sistema en Modo Asistido**

🎯 **Acciones rápidas disponibles:**
• 📦 Ver inventario → Menú "Inventario"
• 📈 Revisar ventas → Menú "Ventas" 
• 🍨 Crear productos → Menú "Productos"
• 🚚 Gestionar entregas → Menú "Entregas"

💡 **Comandos que puedes usar:**
• "suma 10 kg de [producto]"
• "crear helado de [sabor] $[precio]"
• "ventas de hoy"

ℹ️ *Para activar el asistente inteligente, contacta al administrador*`;
  }

  // Sugerencias de fallback
  getFallbackSuggestions() {
    return [
      "🧙‍♂️ Usar Modo Guiado",
      "📦 Gestionar Stock",
      "🍦 Crear Producto",
      "💰 Cambiar Precios"
    ];
  }

  // Configurar API key manualmente
  setGeminiApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      this.geminiApiKey = apiKey.trim();
      localStorage.setItem('gemini-api-key', this.geminiApiKey);
      // Verificar disponibilidad con la nueva key
      this.checkGeminiAvailability();
      return true;
    } else {
      this.geminiApiKey = null;
      localStorage.removeItem('gemini-api-key');
      this.isGeminiAvailable = false;
      return false;
    }
  }

  // Configurar SuperBot
  configureSuperBot(enabled = true, config = {}) {
    this.superBotEnabled = enabled;
    if (config.endpoint) {
      this.superBotEndpoint = config.endpoint;
    }
    return {
      enabled: this.superBotEnabled,
      endpoint: this.superBotEndpoint
    };
  }

  // Función auxiliar para determinar momento del día
  getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'Mañana';
    if (hour >= 12 && hour < 17) return 'Tarde';
    if (hour >= 17 && hour < 21) return 'Noche';
    return 'Madrugada';
  }
  
  // Mejorar extracción de sugerencias con IA
  extractIntelligentSuggestions(text, businessData) {
    const suggestions = [];
    const lowerText = text.toLowerCase();
    
    // Sugerencias basadas en stock bajo
    if (businessData?.analytics?.lowStockProducts?.length > 0) {
      const criticalProducts = businessData.analytics.lowStockProducts.slice(0, 2);
      criticalProducts.forEach(product => {
        suggestions.push(`Reponer ${product.name}`);
      });
    }
    
    // Sugerencias basadas en ventas
    if (businessData?.sales?.today?.total > 0) {
      suggestions.push('Ver productos más vendidos hoy');
      suggestions.push('Analizar tendencias de venta');
    }
    
    // Sugerencias contextuales
    if (lowerText.includes('stock') || lowerText.includes('inventario')) {
      suggestions.push('Configurar alertas automáticas');
      suggestions.push('Generar orden de compra');
    }
    
    if (lowerText.includes('precio') || lowerText.includes('venta')) {
      suggestions.push('Analizar márgenes de ganancia');
      suggestions.push('Optimizar precios por demanda');
    }
    
    // Sugerencias por defecto inteligentes
    if (suggestions.length < 3) {
      const timeBasedSuggestions = this.getTimeBasedSuggestions();
      suggestions.push(...timeBasedSuggestions.slice(0, 3 - suggestions.length));
    }
    
    return suggestions.slice(0, 4); // Máximo 4 sugerencias
  }
  
  // Sugerencias basadas en la hora del día
  getTimeBasedSuggestions() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 10) {
      return [
        'Preparar stock para el día',
        'Revisar productos frescos',
        'Verificar equipos de refrigeración'
      ];
    } else if (hour >= 10 && hour < 14) {
      return [
        'Monitorear ventas matutinas',
        'Ajustar producción para tarde',
        'Verificar sabores populares'
      ];
    } else if (hour >= 14 && hour < 18) {
      return [
        'Analizar pico de ventas',
        'Reponer stock de productos populares',
        'Preparar para cierre'
      ];
    } else {
      return [
        'Revisar ventas del día',
        'Planificar producción mañana',
        'Generar reporte diario'
      ];
    }
  }

  // Obtener información del estado del servicio
  getServiceStatus() {
    const status = {
      geminiAvailable: this.isGeminiAvailable,
      dailyRequests: this.dailyRequestCount,
      remainingRequests: this.maxDailyRequests - this.dailyRequestCount,
      hasApiKey: !!this.geminiApiKey,
      currentLevel: this.canUseGemini() ? (this.superBotEnabled ? 4 : 3) : (this.superBotEnabled ? 3 : 2),
      superBotEnabled: this.superBotEnabled,
      apiKeySource: this.geminiApiKey ? 
        (localStorage.getItem('gemini-api-key') ? 'manual' : 'configured') : 
        'none',
      geminiModel: this.geminiModel,
      cacheSize: this.responseCache.size,
      // Debugging info
      debug: {
        geminiApiKey: this.geminiApiKey ? `${this.geminiApiKey.substring(0, 10)}...` : 'none',
        processEnv: typeof process !== 'undefined' && process.env ? 'available' : 'not available',
        localStorage: typeof localStorage !== 'undefined' ? 'available' : 'not available',
        lastGeminiCheck: this.lastGeminiCheck,
        canUseGemini: this.canUseGemini(),
        superBotStatus: this.superBotEnabled ? 'enabled' : 'disabled'
      }
    };
    
    console.log('🔍 Estado actual del AIService:', status);
    return status;
  }

  // Métodos de caché para optimización
  generateCacheKey(message, context) {
    const contextKey = JSON.stringify({
      model: context.currentModel || 'default',
      hasBusinessData: !!context.businessData,
      lastMessages: context.history?.slice(-2).map(m => m.content) || []
    });
    return `${message.toLowerCase().trim()}_${contextKey}`;
  }

  getCachedResponse(key) {
    const cached = this.responseCache.get(key);
    if (!cached) return null;
    
    // Verificar edad del cache
    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.responseCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCachedResponse(key, data) {
    // Limpiar cache si está lleno
    if (this.responseCache.size >= this.cacheMaxSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.responseCache.clear();
    console.log('🧹 Cache de respuestas limpiado');
  }
}

// Instancia singleton
const aiService = new AIService();

export default aiService;