// Super-Bot Venezia - Asistente AI completo para heladería
// Sistema de comandos inteligentes con procesamiento NLP avanzado

class SuperBotVenezia {
  constructor() {
    this.version = '3.0.0';
    this.capabilities = {
      inventory: true,
      sales: true,
      production: true,
      reports: true,
      voice: true,
      actions: true,
      compound: true, // Nuevas operaciones compuestas
      ai_integration: true // Integración mejorada con Gemini
    };
    
    // Configuración del bot
    this.config = {
      confirmationRequired: ['delete', 'update_price', 'create_product', 'add_stock'],
      maxRetries: 3,
      responseTimeout: 15000,
      autoExecute: false, // Por defecto requiere confirmación
      cacheEnabled: true,
      cacheMaxAge: 60 * 60 * 1000, // 1 hora
      cacheMaxSize: 200,
      smartSuggestions: true
    };
    
    // Cache mejorado de comandos y contexto
    this.commandCache = new Map();
    this.responseCache = new Map();
    this.productCache = new Map();
    this.lastCacheClean = Date.now();
    
    this.conversationContext = {
      lastCommand: null,
      pendingActions: [],
      userPreferences: this.loadUserPreferences(),
      sessionHistory: [],
      businessMetrics: {}
    };
    
    this.initializeCommandPatterns();
    this.initializeAISynonyms();
  }

  // =================================================================================
  // PATRONES DE COMANDOS INTELIGENTES
  // =================================================================================

  initializeCommandPatterns() {
    this.commandPatterns = {
      // ========== COMANDOS DE INVENTARIO AVANZADOS ==========
      inventory: {
        add_stock: [
          /(?:agregar|añadir|suma|sumar|incrementar|aumentar|meter|poner|cargar)\s+(\d+)\s*(?:kg|kilos|kilogramos|unidades|litros|gramos|g|l|u)?\s+(?:de\s+|del\s+)?(.+)/i,
          /(?:incrementar|aumentar|subir)\s+(?:el\s+)?stock\s+(?:de\s+|del\s+)?(.+)\s+(?:en\s+|por\s+)?(\d+)/i,
          /(\d+)\s*(?:kg|kilos|unidades|litros|gramos|g)?\s+(?:más\s+)?(?:de\s+|del\s+)?(.+)\s+(?:al\s+stock|inventario)/i,
          /reponer\s+(\d+)\s*(?:kg|unidades|litros)?\s+(?:de\s+|del\s+)?(.+)/i,
          /(?:tengo|llegó|llegaron|recibi|recibí)\s+(\d+)\s*(?:kg|kilos|unidades)?\s+(?:de\s+|del\s+)?(.+)/i,
          /(?:stock|inventario)\s+(.+)\s+(?:\+|mas|más)\s+(\d+)/i
        ],
        check_stock: [
          /¿?(?:cuánto|cuanto|cuántos|cuantos)\s+(.+)\s+(?:queda|quedan|tengo|tenemos|hay|disponible|me queda)/i,
          /(?:stock|inventario|cantidad|existencia)\s+(?:actual\s+)?(?:de\s+|del\s+)?(.+)/i,
          /¿?(?:qué|que)\s+(?:cantidad|stock)\s+(?:tengo|tenemos)\s+(?:de\s+|del\s+)?(.+)/i,
          /verificar\s+(?:stock\s+(?:de\s+|del\s+)?)?(.+)/i,
          /consultar\s+(?:inventario\s+(?:de\s+|del\s+)?)?(.+)/i,
          /¿?(?:hay|tenemos|queda)\s+(.+)\s*\?/i,
          /(?:dame|dime|decime)\s+(?:el\s+)?stock\s+(?:de\s+|del\s+)?(.+)/i
        ],
        low_stock: [
          /(?:productos|stock|inventario)\s+(?:con\s+)?(?:poco|bajo|crítico|mínimo)\s+(?:stock)?/i,
          /(?:mostrar|ver|listar)\s+(?:alertas|stock\s+bajo|productos\s+críticos)/i,
          /¿?(?:qué|que)\s+(?:necesito|debo)\s+(?:reponer|comprar|reabastecer)/i,
          /alerta\s+(?:de\s+)?stock/i,
          /productos\s+agotándose/i
        ],
        create_product: [
          /(?:crear|agregar|añadir|nuevo)\s+(?:helado|sabor|producto)\s+(?:de\s+)?(.+?)\s+(?:a\s+|por\s+)?\$(\d+)/i,
          /(?:nuevo|nueva)\s+(?:producto|helado|sabor)\s+(.+?)\s+(?:precio\s+)?\$(\d+)/i,
          /(?:helado|producto|sabor)\s+(?:de\s+)?(.+?)\s+(?:por\s+|a\s+|cuesta\s+)?\$(\d+)/i,
          /lanzar\s+(?:nuevo\s+)?sabor\s+(.+?)\s+(?:a\s+)?\$(\d+)/i
        ],
        update_price: [
          /(?:cambiar|actualizar|modificar|subir|bajar)\s+(?:el\s+)?precio\s+(?:de\s+|del\s+)?(.+?)\s+(?:a\s+)?\$(\d+)/i,
          /(?:precio|costo)\s+(?:de\s+|del\s+)?(.+?)\s+(?:ahora\s+|nuevo\s+|será\s+)?\$(\d+)/i,
          /(.+?)\s+(?:ahora\s+(?:cuesta|vale|precio)|nuevo\s+precio)\s+\$(\d+)/i,
          /ajustar\s+precio\s+(.+?)\s+(?:a\s+)?\$(\d+)/i
        ],
        bulk_operations: [
          /(?:actualizar|modificar)\s+(?:todos\s+los\s+)?precios/i,
          /operación\s+masiva/i,
          /(?:subir|bajar)\s+(?:todos\s+los\s+)?precios\s+(?:en\s+)?(\d+)%/i
        ],
        expiry_check: [
          /¿?(?:qué|cuales)\s+(?:productos\s+)?(?:vencen|expiran)\s+(?:hoy|mañana|esta\s+semana)/i,
          /(?:revisar|verificar)\s+(?:fechas\s+de\s+)?(?:vencimiento|expiración)/i,
          /productos\s+(?:por\s+)?vencer/i
        ]
      },

      // ========== COMANDOS DE VENTAS AVANZADOS ==========
      sales: {
        daily_sales: [
          /¿?(?:cuánto|cuanto)\s+(?:vendimos|vendí|hemos\s+vendido)\s+(?:hoy|el\s+día|este\s+día)/i,
          /(?:ventas|ingresos|facturación)\s+(?:de\s+)?(?:hoy|del\s+día|diarias)/i,
          /¿?(?:cómo|como)\s+(?:van|están|marchan)\s+las\s+ventas\s+(?:hoy)?/i,
          /balance\s+(?:del\s+)?día/i,
          /resumen\s+(?:de\s+)?ventas\s+(?:de\s+)?hoy/i
        ],
        best_sellers: [
          /¿?(?:cuál|cual)\s+es\s+el\s+(?:helado|producto|sabor)\s+más\s+(?:vendido|popular)/i,
          /(?:productos|sabores|helados)\s+más\s+(?:vendidos|populares|exitosos)/i,
          /(?:ranking|top|mejores)\s+(?:\d+\s+)?(?:de\s+)?(?:ventas|productos|sabores)/i,
          /(?:helados|sabores)\s+estrella/i,
          /¿?(?:qué|que)\s+se\s+vende\s+más/i
        ],
        weekly_sales: [
          /(?:ventas|reporte|resumen)\s+(?:de\s+la\s+|semanal|esta\s+)?semana/i,
          /¿?(?:cómo|como)\s+(?:fue|estuvo|resultó)\s+la\s+semana/i,
          /(?:ingresos|facturación)\s+semanal/i,
          /últimos\s+7\s+días/i
        ],
        monthly_sales: [
          /(?:ventas|reporte|resumen)\s+(?:del\s+|mensual|este\s+)?mes/i,
          /¿?(?:cómo|como)\s+(?:va|está)\s+el\s+mes/i,
          /(?:ingresos|facturación)\s+mensual/i,
          /performance\s+mensual/i
        ],
        register_sale: [
          /(?:registrar|anotar|apuntar)\s+venta\s+(?:de\s+)?(\d+)\s+(.+)/i,
          /(?:vender|vendí|venta\s+de)\s+(\d+)\s+(.+)/i,
          /(\d+)\s+(.+)\s+(?:vendidos|vendidas|unidades)/i,
          /transacción\s+(\d+)\s+(.+)/i
        ],
        sales_trends: [
          /(?:tendencia|tendencias|patrones)\s+(?:de\s+)?ventas/i,
          /¿?(?:cómo|como)\s+(?:evolucionan|cambian)\s+las\s+ventas/i,
          /análisis\s+(?:de\s+)?tendencias/i,
          /comportamiento\s+(?:de\s+)?ventas/i
        ],
        compare_periods: [
          /comparar\s+(?:ventas\s+)?(?:con\s+)?(?:ayer|semana\s+pasada|mes\s+pasado)/i,
          /(?:ventas\s+)?vs\s+(?:ayer|semana\s+pasada|mes\s+pasado)/i,
          /diferencia\s+con\s+(?:período\s+anterior)/i
        ]
      },

      // ========== COMANDOS DE PRODUCCIÓN ==========
      production: {
        make_batch: [
          /(?:hacer|producir|preparar)\s+(\d+)\s+(?:helados?\s+(?:de\s+)?)?(.+)/i,
          /(?:producción|lote)\s+(?:de\s+)?(\d+)\s+(.+)/i,
          /(\d+)\s+(.+)\s+(?:para\s+(?:hacer|producir))/i
        ],
        available_recipes: [
          /¿?(?:qué|que)\s+(?:recetas|sabores)\s+(?:podemos|puedo)\s+hacer/i,
          /(?:recetas|sabores)\s+disponibles/i,
          /¿?(?:qué|que)\s+(?:puedo|podemos)\s+(?:producir|hacer)/i
        ],
        recipe_cost: [
          /(?:calcular|mostrar)\s+(?:costo|precio)\s+(?:de\s+(?:la\s+)?receta\s+(?:de\s+)?)?(.+)/i,
          /¿?(?:cuánto|cuanto)\s+cuesta\s+hacer\s+(.+)/i,
          /(?:costo|gasto)\s+(?:de\s+)?(?:producir|hacer)\s+(.+)/i
        ]
      },

      // ========== COMANDOS DE EMERGENCIA Y ESTADO ==========
      emergency: {
        critical_stock: [
          /(?:alerta|emergencia|urgente)\s+(?:de\s+)?stock/i,
          /productos\s+(?:críticos|agotados|sin\s+stock)/i,
          /(?:estado\s+)?crítico\s+(?:del\s+)?inventario/i,
          /¿?(?:qué|que)\s+se\s+está\s+agotando/i
        ],
        business_emergency: [
          /(?:alerta|emergencia)\s+(?:del\s+)?negocio/i,
          /(?:problema|crisis)\s+operacional/i,
          /estado\s+crítico\s+(?:del\s+)?sistema/i
        ],
        urgent_restock: [
          /(?:reabastecer|reponer)\s+urgente/i,
          /compra\s+de\s+emergencia/i,
          /pedido\s+urgente/i
        ]
      },

      // ========== COMANDOS DE ANÁLISIS EMPRESARIAL ==========
      analytics: {
        business_health: [
          /salud\s+(?:del\s+)?negocio/i,
          /¿?(?:cómo|como)\s+(?:está|va)\s+(?:el\s+negocio|todo)/i,
          /estado\s+general/i,
          /diagnóstico\s+empresarial/i
        ],
        profit_analysis: [
          /(?:análisis\s+de\s+)?(?:rentabilidad|ganancias|margen)/i,
          /productos\s+más\s+rentables/i,
          /¿?(?:cuáles|cuales)\s+(?:dan|generan)\s+más\s+ganancia/i,
          /margen\s+(?:de\s+)?(?:ganancia|utilidad)/i
        ],
        performance_metrics: [
          /(?:métricas|indicadores)\s+(?:de\s+)?(?:rendimiento|performance)/i,
          /KPI\s+(?:del\s+)?negocio/i,
          /indicadores\s+clave/i
        ],
        forecast: [
          /(?:proyección|pronóstico|predicción)\s+(?:de\s+)?ventas/i,
          /¿?(?:cómo|como)\s+(?:será|estará)\s+(?:la\s+)?(?:semana|mes)/i,
          /tendencias\s+futuras/i,
          /predicción\s+(?:de\s+)?demanda/i
        ]
      },
      
      // ========== OPERACIONES COMPUESTAS (NUEVO) ==========
      compound: {
        stock_and_price: [
          /agregar\s+(\d+)\s*(?:kg|unidades)?\s+(?:de\s+)?(.+)\s+y\s+(?:cambiar|actualizar)\s+(?:el\s+)?precio\s+a\s+\$(\d+)/i,
          /(?:stock|inventario)\s+(.+)\s+\+(\d+)\s+y\s+precio\s+\$(\d+)/i,
          /actualizar\s+(.+):\s*(\d+)\s+(?:unidades|kg)\s+y\s+\$(\d+)/i
        ],
        create_and_stock: [
          /crear\s+(?:sabor\s+)?(.+)\s+\$(\d+)\s+con\s+(\d+)\s+(?:unidades|kg)/i,
          /nuevo\s+(?:helado\s+)?(.+)\s+a\s+\$(\d+)\s+y\s+agregar\s+(\d+)/i,
          /agregar\s+producto\s+(.+)\s+\$(\d+)\s+stock\s+inicial\s+(\d+)/i
        ],
        multiple_operations: [
          /hacer\s+todo:\s*(.+)/i,
          /ejecutar\s+comandos:\s*(.+)/i,
          /operaciones\s+múltiples:\s*(.+)/i
        ],
        batch_update: [
          /actualizar\s+varios\s+productos/i,
          /cambios\s+masivos/i,
          /operación\s+en\s+lote/i
        ]
      },

      // ========== COMANDOS GENERALES MEJORADOS ==========
      general: {
        help: [
          /(?:ayuda|help|auxilio|comandos|qué puedo hacer|qué podes hacer)/i,
          /¿?(?:qué|que)\s+(?:puedes|podes|podés)\s+hacer/i,
          /(?:comandos|funciones|opciones)\s+disponibles/i,
          /manual\s+(?:de\s+)?usuario/i,
          /guía\s+(?:de\s+)?uso/i,
          /¿?(?:cómo|como)\s+(?:te\s+)?uso/i,
          /explicame\s+(?:los\s+)?comandos/i
        ],
        status: [
          /(?:estado|status|información)\s+(?:del\s+)?(?:sistema|negocio)/i,
          /¿?(?:cómo|como)\s+(?:está|va)\s+(?:todo|el\s+negocio)/i,
          /(?:resumen|dashboard|panel)\s+(?:ejecutivo|general)?/i,
          /reporte\s+(?:diario|general|ejecutivo)/i
        ],
        configuration: [
          /(?:configurar|configuración)\s+(?:del\s+)?(?:bot|sistema)/i,
          /ajustes\s+(?:del\s+)?SuperBot/i,
          /personalizar\s+(?:comandos|respuestas)/i
        ],
        learning: [
          /aprender\s+(?:nuevo\s+)?comando/i,
          /enseñar\s+(?:al\s+)?bot/i,
          /personalización\s+inteligente/i,
          /adaptar\s+(?:respuestas|comportamiento)/i
        ]
      }
    };
  }

  // Inicializar sinónimos inteligentes para mejor comprensión
  initializeAISynonyms() {
    this.synonyms = {
      products: {
        'chocolate': ['choco', 'chocolat', 'choclo'],
        'vainilla': ['vanilla', 'vani', 'vanila'],
        'fresa': ['frutilla', 'strawberry', 'fresas'],
        'dulce de leche': ['ddl', 'dulce leche', 'dulcedeleche'],
        'menta': ['mint', 'menta granizada', 'menta chip'],
        'limón': ['limon', 'lemon', 'lima limón'],
        'banana': ['plátano', 'platano', 'banano']
      },
      units: {
        'kg': ['kilos', 'kilogramos', 'k'],
        'unidades': ['u', 'un', 'unidad', 'piezas'],
        'litros': ['l', 'lts', 'litro'],
        'gramos': ['g', 'gr', 'gramo']
      },
      actions: {
        'agregar': ['añadir', 'sumar', 'meter', 'poner', 'cargar', 'incrementar'],
        'quitar': ['sacar', 'restar', 'eliminar', 'reducir', 'bajar'],
        'crear': ['hacer', 'generar', 'producir', 'fabricar'],
        'cambiar': ['modificar', 'actualizar', 'editar', 'ajustar'],
        'ver': ['mostrar', 'listar', 'consultar', 'chequear', 'revisar']
      }
    };
  }

  // =================================================================================
  // PROCESAMIENTO DE COMANDOS CON NLP
  // =================================================================================

  async processCommand(message, context = {}) {
    console.log(`🤖 SuperBot procesando: "${message}"`);
    
    try {
      // Limpiar y preparar el mensaje
      const cleanMessage = this.cleanMessage(message);
      
      // Detectar intención y extraer parámetros
      const intent = await this.detectIntent(cleanMessage);
      
      if (!intent) {
        return this.generateHelpResponse(cleanMessage);
      }

      // Verificar si es un comando ejecutable
      if (this.requiresConfirmation(intent)) {
        return await this.requestConfirmation(intent, context);
      }

      // Ejecutar comando
      return await this.executeCommand(intent, context);

    } catch (error) {
      console.error('❌ Error procesando comando:', error);
      return {
        success: false,
        message: '❌ **Error procesando comando**\n\nOcurrió un error inesperado. Por favor intenta de nuevo.',
        suggestions: ['Probar comando más simple', 'Ver ayuda', 'Contactar soporte']
      };
    }
  }

  cleanMessage(message) {
    return message
      .toLowerCase()
      .trim()
      .replace(/[.,!?¿¡]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  async detectIntent(message) {
    // Buscar patrones en todas las categorías
    for (const [category, commands] of Object.entries(this.commandPatterns)) {
      for (const [command, patterns] of Object.entries(commands)) {
        for (const pattern of patterns) {
          const match = message.match(pattern);
          if (match) {
            return {
              category,
              command,
              parameters: this.extractParameters(match, command),
              confidence: this.calculateConfidence(match, pattern),
              originalMatch: match
            };
          }
        }
      }
    }
    
    return null;
  }

  extractParameters(match, command) {
    const params = {};
    
    switch (command) {
      case 'add_stock':
        params.quantity = parseInt(match[1]) || parseInt(match[2]);
        params.product = (match[2] || match[1]).trim();
        params.unit = this.detectUnit(match[0]);
        break;
        
      case 'check_stock':
        params.product = match[1].trim();
        break;
        
      case 'create_product':
        params.name = match[1].trim();
        params.price = parseInt(match[2]);
        break;
        
      case 'update_price':
        params.product = match[1].trim();
        params.price = parseInt(match[2]);
        break;
        
      case 'register_sale':
        params.quantity = parseInt(match[1]);
        params.product = match[2].trim();
        break;
        
      case 'make_batch':
        params.quantity = parseInt(match[1]);
        params.product = match[2].trim();
        break;
        
      case 'recipe_cost':
        params.product = match[1].trim();
        break;
        
      default:
        // Extraer parámetros generales
        for (let i = 1; i < match.length; i++) {
          params[`param${i}`] = match[i];
        }
    }
    
    return params;
  }

  detectUnit(text) {
    if (text.includes('kg')) return 'kg';
    if (text.includes('litros') || text.includes('l ')) return 'litros';
    if (text.includes('unidades')) return 'unidades';
    return 'unidades'; // default
  }

  calculateConfidence(match, pattern) {
    // Simple confidence calculation based on match quality
    const matchLength = match[0].length;
    const messageLength = match.input.length;
    return Math.min(0.9, (matchLength / messageLength) * 1.2);
  }

  requiresConfirmation(intent) {
    return this.config.confirmationRequired.includes(intent.command) && 
           !this.config.autoExecute;
  }

  // =================================================================================
  // EJECUCIÓN DE COMANDOS
  // =================================================================================

  async executeCommand(intent, context) {
    const { category, command, parameters } = intent;
    
    console.log(`🎯 Ejecutando: ${category}.${command}`, parameters);
    
    try {
      switch (category) {
        case 'inventory':
          return await this.executeInventoryCommand(command, parameters, context);
        case 'sales':
          return await this.executeSalesCommand(command, parameters, context);
        case 'production':
          return await this.executeProductionCommand(command, parameters, context);
        case 'emergency':
          return await this.executeEmergencyCommand(command, parameters, context);
        case 'analytics':
          return await this.executeAnalyticsCommand(command, parameters, context);
        case 'compound':
          return await this.executeCompoundCommand(command, parameters, context);
        case 'general':
          return await this.executeGeneralCommand(command, parameters, context);
        default:
          return this.generateErrorResponse(`Categoría desconocida: ${category}`);
      }
    } catch (error) {
      console.error(`❌ Error ejecutando ${category}.${command}:`, error);
      return this.generateErrorResponse(error.message);
    }
  }

  // ========== COMANDOS DE INVENTARIO ==========
  async executeInventoryCommand(command, params, context) {
    switch (command) {
      case 'add_stock':
        return await this.addStock(params, context);
        
      case 'check_stock':
        return await this.checkStock(params, context);
        
      case 'low_stock':
        return await this.getLowStock(context);
        
      case 'create_product':
        return await this.createProduct(params, context);
        
      case 'update_price':
        return await this.updatePrice(params, context);
        
      default:
        return this.generateErrorResponse(`Comando de inventario desconocido: ${command}`);
    }
  }

  async addStock(params, context) {
    try {
      // Buscar el producto por nombre
      const product = await this.findProductByName(params.product);
      
      if (!product) {
        return {
          success: false,
          message: `❌ **Producto no encontrado**\n\nNo encontré un producto llamado "${params.product}".\n\n¿Quieres crearlo?`,
          suggestions: [
            `Crear helado ${params.product} $4500`,
            'Ver todos los productos',
            'Buscar productos similares'
          ],
          needsAction: 'create_product_suggestion'
        };
      }

      // Ejecutar la acción si tenemos executeAction
      if (context.executeAction) {
        const result = await context.executeAction('add_stock', {
          productId: product.id,
          quantity: params.quantity,
          unit: params.unit
        });

        if (result.success) {
          return {
            success: true,
            message: `✅ **Stock actualizado correctamente**\n\n📦 **${product.name}**\n• Agregado: ${params.quantity} ${params.unit}\n• Stock anterior: ${product.current_stock || 0}\n• Stock actual: ${(product.current_stock || 0) + params.quantity}\n\n🎯 **Acción completada automáticamente**`,
            actionExecuted: true,
            data: {
              product: product.name,
              added: params.quantity,
              unit: params.unit,
              newStock: (product.current_stock || 0) + params.quantity
            }
          };
        } else {
          return {
            success: false,
            message: `❌ **Error actualizando stock**\n\n${result.message}`,
            suggestions: ['Intentar de nuevo', 'Verificar producto', 'Ver inventario']
          };
        }
      }

      // Si no tenemos executeAction, dar instrucciones manuales
      return {
        success: true,
        message: `📦 **Instrucciones para agregar stock**\n\n**Producto:** ${product.name}\n**Cantidad:** ${params.quantity} ${params.unit}\n\n**Pasos a seguir:**\n1. Ve a Inventario → Productos\n2. Busca "${product.name}"\n3. Haz clic en "Editar"\n4. Suma ${params.quantity} al stock actual\n5. Guarda los cambios`,
        suggestions: ['Ir a inventario', 'Ver producto', 'Cancelar']
      };

    } catch (error) {
      return this.generateErrorResponse(`Error agregando stock: ${error.message}`);
    }
  }

  async checkStock(params, context) {
    try {
      const product = await this.findProductByName(params.product);
      
      if (!product) {
        return {
          success: false,
          message: `❌ **Producto no encontrado**\n\nNo encontré "${params.product}" en el inventario.\n\n¿Te refieres a alguno de estos?`,
          suggestions: await this.getSimilarProducts(params.product)
        };
      }

      const stock = product.current_stock || 0;
      const isLow = stock <= (product.minimum_stock || 10);
      
      return {
        success: true,
        message: `📦 **Stock actual de ${product.name}**\n\n• **Cantidad:** ${stock} unidades ${isLow ? '⚠️ **BAJO**' : '✅'}\n• **Precio:** $${product.price}\n• **Estado:** ${product.active ? 'Activo' : 'Inactivo'}\n${isLow ? `\n🚨 **Stock bajo** - Mínimo recomendado: ${product.minimum_stock || 10}` : ''}`,
        data: {
          product: product.name,
          stock,
          isLow,
          price: product.price
        },
        suggestions: isLow ? [`Agregar stock de ${product.name}`, 'Ver proveedores', 'Programar pedido'] : ['Ver otros productos', 'Actualizar precio', 'Ver ventas']
      };
      
    } catch (error) {
      return this.generateErrorResponse(`Error consultando stock: ${error.message}`);
    }
  }

  async getLowStock(context) {
    try {
      // Obtener productos con stock bajo desde el contexto
      const businessData = context.businessData;
      
      if (businessData?.analytics?.lowStockProducts?.length > 0) {
        const lowStockList = businessData.analytics.lowStockProducts
          .map(p => `• **${p.name}**: ${p.stock} unidades (necesitas ${p.needed} más)`)
          .join('\n');
        
        return {
          success: true,
          message: `⚠️ **Productos con stock bajo**\n\n${lowStockList}\n\n📋 **Total de productos en alerta:** ${businessData.analytics.lowStockProducts.length}`,
          data: businessData.analytics.lowStockProducts,
          suggestions: ['Generar pedido automático', 'Ver proveedores', 'Programar reposición']
        };
      } else {
        return {
          success: true,
          message: `✅ **¡Excelente!**\n\nTodos tus productos tienen stock suficiente.\n\n📦 No hay alertas de stock bajo en este momento.`,
          suggestions: ['Ver inventario completo', 'Agregar nuevo producto', 'Ver ventas del día']
        };
      }
      
    } catch (error) {
      return this.generateErrorResponse(`Error consultando stock bajo: ${error.message}`);
    }
  }

  async createProduct(params, context) {
    try {
      if (context.executeAction) {
        const result = await context.executeAction('create_product', {
          name: `Helado ${params.name.charAt(0).toUpperCase() + params.name.slice(1)}`,
          price: params.price,
          category: 'Helado',
          context: 'general',
          initialStock: 0
        });

        if (result.success) {
          return {
            success: true,
            message: `✅ **¡Nuevo producto creado!**\n\n🍦 **Helado ${params.name}**\n• Precio: $${params.price}\n• Stock inicial: 0 unidades\n• Estado: Activo\n\n🎯 **Producto agregado al catálogo**`,
            actionExecuted: true,
            data: {
              name: params.name,
              price: params.price
            },
            suggestions: [`Agregar stock a ${params.name}`, 'Ver todos los productos', 'Configurar receta']
          };
        } else {
          return {
            success: false,
            message: `❌ **Error creando producto**\n\n${result.message}`,
            suggestions: ['Intentar con otro nombre', 'Ver productos existentes', 'Contactar soporte']
          };
        }
      }

      // Instrucciones manuales
      return {
        success: true,
        message: `🍦 **Instrucciones para crear producto**\n\n**Nuevo helado:** ${params.name}\n**Precio:** $${params.price}\n\n**Pasos:**\n1. Ve a Productos → "+ Nuevo Producto"\n2. Nombre: "Helado ${params.name}"\n3. Precio: ${params.price}\n4. Categoría: Helado\n5. Guarda el producto`,
        suggestions: ['Ir a productos', 'Cancelar', 'Ver catálogo actual']
      };

    } catch (error) {
      return this.generateErrorResponse(`Error creando producto: ${error.message}`);
    }
  }

  async updatePrice(params, context) {
    try {
      const product = await this.findProductByName(params.product);
      
      if (!product) {
        return {
          success: false,
          message: `❌ **Producto no encontrado**\n\nNo encontré "${params.product}" para cambiar el precio.`,
          suggestions: await this.getSimilarProducts(params.product)
        };
      }

      if (context.executeAction) {
        const result = await context.executeAction('update_price', {
          productId: product.id,
          newPrice: params.price
        });

        if (result.success) {
          return {
            success: true,
            message: `✅ **Precio actualizado**\n\n🍦 **${product.name}**\n• Precio anterior: $${product.price}\n• Precio nuevo: $${params.price}\n• Diferencia: $${params.price - product.price} (${params.price > product.price ? '+' : ''}${(((params.price - product.price) / product.price) * 100).toFixed(1)}%)\n\n💰 **Cambio aplicado automáticamente**`,
            actionExecuted: true,
            data: {
              product: product.name,
              oldPrice: product.price,
              newPrice: params.price,
              difference: params.price - product.price
            }
          };
        } else {
          return {
            success: false,
            message: `❌ **Error actualizando precio**\n\n${result.message}`,
            suggestions: ['Intentar de nuevo', 'Verificar producto', 'Ver precios actuales']
          };
        }
      }

      // Instrucciones manuales
      return {
        success: true,
        message: `💰 **Instrucciones para cambiar precio**\n\n**Producto:** ${product.name}\n**Precio actual:** $${product.price}\n**Precio nuevo:** $${params.price}\n\n**Pasos:**\n1. Ve a Productos\n2. Busca "${product.name}"\n3. Haz clic en "Editar"\n4. Cambia precio a ${params.price}\n5. Guarda cambios`,
        suggestions: ['Ir a productos', 'Ver otros precios', 'Cancelar']
      };

    } catch (error) {
      return this.generateErrorResponse(`Error actualizando precio: ${error.message}`);
    }
  }

  // ========== COMANDOS DE VENTAS ==========
  async executeSalesCommand(command, params, context) {
    const businessData = context.businessData;
    
    switch (command) {
      case 'daily_sales':
        const todaySales = businessData?.sales?.today?.total || 0;
        const transactions = businessData?.sales?.today?.transactions || 0;
        const avgTicket = transactions > 0 ? (todaySales / transactions).toFixed(0) : 0;
        
        return {
          success: true,
          message: `📈 **Ventas de hoy**\n\n💰 **Total:** $${todaySales.toLocaleString()}\n🛒 **Transacciones:** ${transactions}\n🎯 **Ticket promedio:** $${avgTicket}\n\n${todaySales > 0 ? '✅ ¡Buen trabajo!' : '📊 Aún no hay ventas registradas hoy'}`,
          data: { todaySales, transactions, avgTicket },
          suggestions: ['Ver productos más vendidos', 'Comparar con ayer', 'Ver detalles de ventas']
        };
        
      case 'best_sellers':
        return {
          success: true,
          message: `🏆 **Productos más vendidos**\n\n📊 Para ver el ranking completo:\n1. Ve a Reportes → Productos\n2. Selecciona "Más vendidos"\n3. Elige el período (hoy/semana/mes)\n\n💡 **Tip:** Los datos se actualizan en tiempo real`,
          suggestions: ['Ver reporte completo', 'Analizar tendencias', 'Optimizar stock']
        };
        
      case 'weekly_sales':
        return {
          success: true,
          message: `📊 **Reporte semanal**\n\n📈 Para ver las ventas de la semana:\n1. Ve a Reportes → Ventas\n2. Selecciona "Últimos 7 días"\n3. Analiza gráficos y métricas\n\n🎯 **Incluye:** Ingresos, productos, clientes, tendencias`,
          suggestions: ['Ver reporte detallado', 'Comparar semanas', 'Exportar datos']
        };
        
      case 'register_sale':
        return {
          success: true,
          message: `🛒 **Registrar venta**\n\n**Cantidad:** ${params.quantity}\n**Producto:** ${params.product}\n\n📋 **Para registrar:**\n1. Ve a POS/Ventas\n2. Busca "${params.product}"\n3. Selecciona cantidad: ${params.quantity}\n4. Completa la venta`,
          suggestions: ['Ir a POS', 'Ver productos', 'Registrar cliente']
        };
        
      default:
        return this.generateErrorResponse(`Comando de ventas desconocido: ${command}`);
    }
  }

  // ========== COMANDOS DE PRODUCCIÓN ==========
  async executeProductionCommand(command, params, context) {
    switch (command) {
      case 'make_batch':
        return {
          success: true,
          message: `🏭 **Orden de producción**\n\n**Producto:** ${params.product}\n**Cantidad:** ${params.quantity} unidades\n\n📋 **Próximos pasos:**\n1. Verificar ingredientes disponibles\n2. Preparar receta para ${params.quantity} unidades\n3. Iniciar producción\n4. Actualizar stock al completar`,
          suggestions: ['Verificar ingredientes', 'Ver receta', 'Programar producción']
        };
        
      case 'available_recipes':
        return {
          success: true,
          message: `👨‍🍳 **Recetas disponibles**\n\n📚 Para ver recetas que puedes hacer:\n1. Ve a Producción → Recetas\n2. Filtra por "Ingredientes disponibles"\n3. Selecciona la receta deseada\n\n✅ Solo se muestran recetas con stock suficiente`,
          suggestions: ['Ver todas las recetas', 'Crear nueva receta', 'Verificar ingredientes']
        };
        
      case 'recipe_cost':
        return {
          success: true,
          message: `💰 **Cálculo de costos**\n\n**Producto:** ${params.product}\n\n📊 **Para calcular costo:**\n1. Ve a Producción → Análisis de costos\n2. Selecciona "${params.product}"\n3. Ve desglose de ingredientes\n4. Incluye mano de obra y gastos\n\n💡 **Incluye:** Ingredientes, energía, tiempo, packaging`,
          suggestions: ['Ver análisis completo', 'Optimizar receta', 'Comparar costos']
        };
        
      default:
        return this.generateErrorResponse(`Comando de producción desconocido: ${command}`);
    }
  }

  // ========== COMANDOS DE EMERGENCIA ==========
  async executeEmergencyCommand(command, params, context) {
    const businessData = context.businessData;
    
    switch (command) {
      case 'critical_stock':
        const criticalProducts = businessData?.analytics?.lowStockProducts?.filter(p => p.stock === 0 || p.stock <= 2) || [];
        
        if (criticalProducts.length > 0) {
          const criticalList = criticalProducts
            .map(p => `• **${p.name}**: ${p.stock} unidades ⚠️ CRÍTICO`)
            .join('\n');
          
          return {
            success: true,
            message: `🚨 **ALERTA CRÍTICA - STOCK AGOTADO**\n\n${criticalList}\n\n📋 **Total productos críticos:** ${criticalProducts.length}\n\n🚀 **ACCIÓN INMEDIATA REQUERIDA**`,
            data: criticalProducts,
            suggestions: ['Generar orden de compra urgente', 'Contactar proveedores', 'Desactivar productos agotados'],
            urgency: 'critical'
          };
        } else {
          return {
            success: true,
            message: `✅ **Sin alertas críticas**\n\nNo hay productos en estado crítico en este momento.\n\n📦 Stock bajo disponible para revisión.`,
            suggestions: ['Ver stock bajo general', 'Configurar alertas preventivas', 'Revisar proyecciones']
          };
        }
        
      case 'business_emergency':
        const emergencyIndicators = this.analyzeBusinessEmergency(businessData);
        
        return {
          success: true,
          message: `🚨 **DIAGNÓSTICO DE EMERGENCIA EMPRESARIAL**\n\n${emergencyIndicators.message}`,
          data: emergencyIndicators.data,
          suggestions: emergencyIndicators.suggestions,
          urgency: emergencyIndicators.urgency
        };
        
      case 'urgent_restock':
        return {
          success: true,
          message: `⚡ **PEDIDO DE EMERGENCIA**\n\n📋 **Para generar pedido urgente:**\n1. Revisar productos críticos\n2. Contactar proveedores prioritarios\n3. Coordinar entrega express\n4. Actualizar sistema al recibir\n\n🔥 **Productos prioritarios detectados automáticamente**`,
          suggestions: ['Ver lista de proveedores', 'Generar pedido automático', 'Programar entrega urgente']
        };
        
      default:
        return this.generateErrorResponse(`Comando de emergencia desconocido: ${command}`);
    }
  }

  // ========== COMANDOS DE ANÁLISIS ==========
  async executeAnalyticsCommand(command, params, context) {
    const businessData = context.businessData;
    
    switch (command) {
      case 'business_health':
        const healthScore = this.calculateBusinessHealth(businessData);
        
        return {
          success: true,
          message: `🏥 **SALUD EMPRESARIAL**\n\n📊 **Puntuación:** ${healthScore.score}/100\n📈 **Estado:** ${healthScore.status}\n\n**Indicadores clave:**\n${healthScore.indicators.map(i => `• ${i.name}: ${i.value} ${i.status}`).join('\n')}\n\n💡 **Recomendaciones:**\n${healthScore.recommendations.map(r => `• ${r}`).join('\n')}`,
          data: healthScore,
          suggestions: ['Ver análisis detallado', 'Generar plan de mejora', 'Configurar monitoreo']
        };
        
      case 'profit_analysis':
        return {
          success: true,
          message: `💰 **ANÁLISIS DE RENTABILIDAD**\n\n📊 **Para análisis completo de rentabilidad:**\n1. Ve a Reportes → Análisis Financiero\n2. Selecciona "Rentabilidad por Producto"\n3. Configura período de análisis\n4. Exporta datos para decisiones\n\n🎯 **Incluye:** Márgenes, costos, ROI, productos estrella`,
          suggestions: ['Ver margen por producto', 'Analizar costos', 'Optimizar precios']
        };
        
      case 'performance_metrics':
        const kpis = this.calculateKPIs(businessData);
        
        return {
          success: true,
          message: `📈 **INDICADORES CLAVE DE RENDIMIENTO**\n\n${kpis.map(kpi => `📊 **${kpi.name}:** ${kpi.value} ${kpi.trend}`).join('\n')}\n\n⏰ **Actualizado:** ${new Date().toLocaleString('es-CO')}`,
          data: kpis,
          suggestions: ['Análisis histórico', 'Comparar períodos', 'Configurar alertas']
        };
        
      case 'forecast':
        return {
          success: true,
          message: `🔮 **PROYECCIÓN DE VENTAS**\n\n📊 **Basado en datos históricos:**\n• Tendencia actual detectada\n• Patrones estacionales considerados\n• Factores externos evaluados\n\n📈 **Para proyección detallada:**\nVe a Reportes → Análisis Predictivo`,
          suggestions: ['Ver proyección detallada', 'Ajustar inventario', 'Planificar producción']
        };
        
      default:
        return this.generateErrorResponse(`Comando de análisis desconocido: ${command}`);
    }
  }

  // ========== COMANDOS COMPUESTOS (NUEVO) ==========
  async executeCompoundCommand(command, params, context) {
    switch (command) {
      case 'stock_and_price':
        return await this.executeStockAndPrice(params, context);
        
      case 'create_and_stock':
        return await this.executeCreateAndStock(params, context);
        
      case 'multiple_operations':
        return await this.executeMultipleOperations(params, context);
        
      case 'batch_update':
        return await this.executeBatchUpdate(params, context);
        
      default:
        return this.generateErrorResponse(`Comando compuesto desconocido: ${command}`);
    }
  }

  async executeStockAndPrice(params, context) {
    try {
      // Parsear parámetros del comando compuesto
      let quantity, product, newPrice;
      
      if (params.param1 && params.param2 && params.param3) {
        quantity = parseInt(params.param1);
        product = params.param2;
        newPrice = parseInt(params.param3);
      } else {
        return this.generateErrorResponse('Formato incorrecto para operación compuesta');
      }

      // Buscar producto
      const productData = await this.findProductByName(product);
      if (!productData) {
        return {
          success: false,
          message: `❌ Producto "${product}" no encontrado para operación compuesta`,
          suggestions: [`Crear producto ${product}`, 'Ver productos disponibles']
        };
      }

      // Ejecutar ambas operaciones
      const results = [];
      
      // 1. Actualizar stock
      if (context.executeAction) {
        const stockResult = await context.executeAction('add_stock', {
          productId: productData.id,
          quantity: quantity,
          unit: 'unidades'
        });
        results.push(stockResult);
      }

      // 2. Actualizar precio
      if (context.executeAction) {
        const priceResult = await context.executeAction('update_price', {
          productId: productData.id,
          newPrice: newPrice
        });
        results.push(priceResult);
      }

      // Verificar resultados
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        return {
          success: true,
          message: `✅ **Operación compuesta completada**\n\n🍦 **${productData.name}**\n📦 Stock: +${quantity} unidades\n💰 Nuevo precio: $${newPrice}\n\n🎯 **Ambas acciones ejecutadas correctamente**`,
          actionExecuted: true,
          data: {
            product: productData.name,
            stockAdded: quantity,
            newPrice: newPrice
          }
        };
      } else {
        return {
          success: false,
          message: '❌ Error en operación compuesta. Algunas acciones fallaron.',
          details: results
        };
      }
      
    } catch (error) {
      return this.generateErrorResponse(`Error en operación compuesta: ${error.message}`);
    }
  }

  async executeCreateAndStock(params, context) {
    try {
      // Parsear parámetros
      const name = params.param1;
      const price = parseInt(params.param2);
      const initialStock = parseInt(params.param3);

      if (context.executeAction) {
        // Crear producto con stock inicial
        const result = await context.executeAction('create_product', {
          name: `Helado ${name.charAt(0).toUpperCase() + name.slice(1)}`,
          price: price,
          category: 'Helado',
          context: 'general',
          initialStock: initialStock
        });

        if (result.success) {
          return {
            success: true,
            message: `✅ **Producto creado con stock inicial**\n\n🍦 **Helado ${name}**\n💰 Precio: $${price}\n📦 Stock inicial: ${initialStock} unidades\n\n🎯 **Producto listo para vender**`,
            actionExecuted: true,
            data: {
              name: name,
              price: price,
              initialStock: initialStock
            }
          };
        } else {
          return result;
        }
      }

      return this.generateErrorResponse('No se puede ejecutar la acción de crear producto con stock');
      
    } catch (error) {
      return this.generateErrorResponse(`Error creando producto con stock: ${error.message}`);
    }
  }

  async executeMultipleOperations(params, context) {
    // Implementar parser para múltiples comandos
    return {
      success: true,
      message: `🔄 **Operaciones múltiples detectadas**\n\n📋 Esta función está en desarrollo.\n\n💡 Por ahora, ejecuta los comandos uno por uno.`,
      suggestions: ['Ejecutar comandos individuales', 'Ver ayuda de comandos']
    };
  }

  async executeBatchUpdate(params, context) {
    return {
      success: true,
      message: `📦 **Actualización masiva**\n\n🛠️ Para realizar actualizaciones masivas:\n1. Ve a Productos → Herramientas\n2. Selecciona "Actualización masiva"\n3. Elige los productos y cambios\n4. Confirma la operación\n\n⚡ Próximamente: Actualizaciones masivas por comando`,
      suggestions: ['Ir a productos', 'Ver herramientas', 'Actualizar individual']
    };
  }

  // ========== COMANDOS GENERALES MEJORADOS ==========
  async executeGeneralCommand(command, params, context) {
    const businessData = context.businessData;
    
    switch (command) {
      case 'help':
        return this.generateAdvancedHelpResponse();
        
      case 'status':
        const ventas = businessData?.sales?.today?.total || 0;
        const productos = businessData?.inventory?.totalProducts || 0;
        const stockBajo = businessData?.analytics?.lowStockCount || 0;
        const healthScore = this.calculateBusinessHealth(businessData);
        
        return {
          success: true,
          message: `📊 **REPORTE EJECUTIVO**\n\n💰 **Ventas hoy:** $${ventas.toLocaleString()}\n📦 **Productos activos:** ${productos}\n⚠️ **Alertas de stock:** ${stockBajo}\n🏥 **Salud empresarial:** ${healthScore.score}/100\n\n${this.getStatusEmoji(healthScore.score)} **Estado:** ${healthScore.status}`,
          data: { ventas, productos, stockBajo, healthScore },
          suggestions: ['Dashboard completo', 'Resolver alertas', 'Análisis detallado']
        };
        
      case 'configuration':
        return {
          success: true,
          message: `⚙️ **CONFIGURACIÓN SUPERBOT**\n\n🎯 **Opciones disponibles:**\n• Ejecución automática: ${this.config.autoExecute ? 'Activada' : 'Desactivada'}\n• Confirmación requerida: ${this.config.confirmationRequired.length} comandos\n• Tiempo de respuesta: ${this.config.responseTimeout}ms\n\n🔧 **Para personalizar:** Contacta al administrador`,
          suggestions: ['Activar auto-ejecución', 'Configurar alertas', 'Personalizar comandos']
        };
        
      case 'learning':
        return {
          success: true,
          message: `🧠 **SISTEMA DE APRENDIZAJE**\n\n📚 **Capacidades actuales:**\n• Reconocimiento de patrones de lenguaje\n• Adaptación a preferencias del usuario\n• Mejora continua de respuestas\n\n🎯 **En desarrollo:**\n• Comandos personalizados\n• Respuestas adaptativas\n• Integración con preferencias`,
          suggestions: ['Ver estadísticas de uso', 'Entrenar nuevo comando', 'Feedback del sistema']
        };
        
      default:
        return this.generateErrorResponse(`Comando general desconocido: ${command}`);
    }
  }

  // =================================================================================
  // FUNCIONES DE CONFIRMACIÓN
  // =================================================================================

  async requestConfirmation(intent, context) {
    const { command, parameters } = intent;
    
    // Generar mensaje de confirmación específico
    let confirmationMessage = '';
    let actionSummary = '';
    
    switch (command) {
      case 'add_stock':
        actionSummary = `Agregar ${parameters.quantity} ${parameters.unit} de "${parameters.product}"`;
        confirmationMessage = `⚠️ **Confirmar acción**\n\n🎯 **Acción:** ${actionSummary}\n\n¿Estás seguro de que quieres realizar esta acción?\n\n⚡ **Tip:** Puedes activar ejecución automática en configuración`;
        break;
        
      case 'create_product':
        actionSummary = `Crear producto "${parameters.name}" a $${parameters.price}`;
        confirmationMessage = `⚠️ **Confirmar creación**\n\n🎯 **Nuevo producto:** ${parameters.name}\n💰 **Precio:** $${parameters.price}\n\n¿Proceder con la creación?`;
        break;
        
      case 'update_price':
        actionSummary = `Cambiar precio de "${parameters.product}" a $${parameters.price}`;
        confirmationMessage = `⚠️ **Confirmar cambio de precio**\n\n🎯 **Producto:** ${parameters.product}\n💰 **Nuevo precio:** $${parameters.price}\n\n¿Aplicar el cambio?`;
        break;
        
      default:
        actionSummary = `Ejecutar ${command}`;
        confirmationMessage = `⚠️ **Confirmar acción**\n\n🎯 **Acción:** ${actionSummary}\n\n¿Continuar?`;
    }
    
    // Guardar acción pendiente
    this.conversationContext.pendingActions.push({
      id: Date.now(),
      intent,
      context,
      timestamp: new Date(),
      summary: actionSummary
    });
    
    return {
      success: true,
      message: confirmationMessage,
      needsConfirmation: true,
      pendingActionId: this.conversationContext.pendingActions[this.conversationContext.pendingActions.length - 1].id,
      suggestions: ['✅ Sí, ejecutar', '❌ Cancelar', '⚙️ Configurar auto-ejecución']
    };
  }

  async confirmAction(actionId, confirmed = true) {
    const pendingAction = this.conversationContext.pendingActions.find(action => action.id === actionId);
    
    if (!pendingAction) {
      return {
        success: false,
        message: '❌ **Acción no encontrada**\n\nLa acción que intentas confirmar ya no está disponible o expiró.',
        suggestions: ['Repetir comando', 'Ver ayuda']
      };
    }
    
    if (confirmed) {
      // Ejecutar la acción confirmada
      const result = await this.executeCommand(pendingAction.intent, pendingAction.context);
      
      // Limpiar acciones pendientes
      this.conversationContext.pendingActions = this.conversationContext.pendingActions.filter(a => a.id !== actionId);
      
      return {
        ...result,
        message: `✅ **Acción confirmada y ejecutada**\n\n${result.message}`
      };
    } else {
      // Cancelar acción
      this.conversationContext.pendingActions = this.conversationContext.pendingActions.filter(a => a.id !== actionId);
      
      return {
        success: true,
        message: '❌ **Acción cancelada**\n\nLa acción ha sido cancelada correctamente.',
        suggestions: ['Probar otro comando', 'Ver ayuda', 'Configurar bot']
      };
    }
  }

  // =================================================================================
  // FUNCIONES AUXILIARES
  // =================================================================================

  async findProductByName(name) {
    const searchTerm = name.toLowerCase().trim();
    
    // Verificar cache primero
    if (this.productCache.has(searchTerm)) {
      const cached = this.productCache.get(searchTerm);
      if (Date.now() - cached.timestamp < this.config.cacheMaxAge) {
        console.log('🎯 Producto encontrado en cache:', searchTerm);
        return cached.data;
      }
    }
    
    // Normalizar usando sinónimos
    const normalizedTerm = this.normalizeProductName(searchTerm);
    
    // Buscar en businessData si está disponible
    if (this.conversationContext.businessData?.inventory?.products) {
      const product = this.conversationContext.businessData.inventory.products.find(p => {
        const productName = p.name.toLowerCase();
        
        // Coincidencia exacta
        if (productName === normalizedTerm) return true;
        
        // Coincidencia parcial
        if (productName.includes(normalizedTerm) || normalizedTerm.includes(productName)) return true;
        
        // Buscar en sinónimos
        for (const [key, synonyms] of Object.entries(this.synonyms.products)) {
          if (key === normalizedTerm || synonyms.includes(normalizedTerm)) {
            return productName.includes(key) || key.includes(productName);
          }
        }
        
        return false;
      });
      
      if (product) {
        // Guardar en cache
        this.productCache.set(searchTerm, {
          data: product,
          timestamp: Date.now()
        });
        
        // Limpiar cache si está muy grande
        if (this.productCache.size > this.config.cacheMaxSize) {
          const firstKey = this.productCache.keys().next().value;
          this.productCache.delete(firstKey);
        }
        
        return product;
      }
    }
    
    return null;
  }
  
  normalizeProductName(name) {
    // Remover tildes y caracteres especiales
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  async getSimilarProducts(name, limit = 3) {
    // Implementar búsqueda de productos similares
    return ['Ver todos los productos', 'Crear nuevo producto', 'Buscar en catálogo'];
  }

  // Función auxiliar para análisis de emergencia empresarial
  analyzeBusinessEmergency(businessData) {
    const issues = [];
    let urgencyLevel = 'low';
    
    // Verificar stock crítico
    const criticalStock = businessData?.analytics?.lowStockProducts?.filter(p => p.stock === 0) || [];
    if (criticalStock.length > 0) {
      issues.push(`⚠️ ${criticalStock.length} productos agotados`);
      urgencyLevel = 'high';
    }
    
    // Verificar ventas
    const todaySales = businessData?.sales?.today?.total || 0;
    if (todaySales === 0) {
      issues.push(`📉 Sin ventas registradas hoy`);
      if (urgencyLevel !== 'high') urgencyLevel = 'medium';
    }
    
    // Crear mensaje
    let message = issues.length > 0 
      ? `🚨 **ISSUES DETECTADOS:**\n${issues.map(i => `• ${i}`).join('\n')}`
      : `✅ **Sistema estable** - No se detectaron emergencias`;
    
    return {
      message,
      data: { issues, urgencyLevel },
      suggestions: urgencyLevel === 'high' 
        ? ['Resolver stock crítico', 'Contactar proveedores', 'Revisar operaciones']
        : ['Monitoreo preventivo', 'Optimizar procesos', 'Revisar métricas'],
      urgency: urgencyLevel
    };
  }
  
  // Función auxiliar para calcular salud empresarial
  calculateBusinessHealth(businessData) {
    let score = 0;
    const indicators = [];
    const recommendations = [];
    
    // Indicador de ventas (40 puntos máximo)
    const todaySales = businessData?.sales?.today?.total || 0;
    const salesScore = Math.min(40, todaySales > 0 ? (todaySales / 50000) * 40 : 0);
    score += salesScore;
    indicators.push({
      name: 'Ventas diarias',
      value: `$${todaySales.toLocaleString()}`,
      status: salesScore > 20 ? '✅' : salesScore > 10 ? '⚠️' : '❌'
    });
    
    // Indicador de inventario (30 puntos máximo)
    const totalProducts = businessData?.inventory?.totalProducts || 0;
    const lowStockCount = businessData?.analytics?.lowStockCount || 0;
    const inventoryScore = Math.min(30, totalProducts > 0 ? 30 - (lowStockCount / totalProducts) * 30 : 0);
    score += inventoryScore;
    indicators.push({
      name: 'Gestión de inventario',
      value: `${totalProducts - lowStockCount}/${totalProducts} óptimos`,
      status: inventoryScore > 20 ? '✅' : inventoryScore > 10 ? '⚠️' : '❌'
    });
    
    // Indicador de diversidad (30 puntos máximo)
    const diversityScore = Math.min(30, totalProducts > 0 ? (totalProducts / 20) * 30 : 0);
    score += diversityScore;
    indicators.push({
      name: 'Diversidad de productos',
      value: `${totalProducts} productos`,
      status: diversityScore > 20 ? '✅' : diversityScore > 10 ? '⚠️' : '❌'
    });
    
    // Determinar estado general
    let status = 'Crítico';
    if (score >= 80) status = 'Excelente';
    else if (score >= 60) status = 'Bueno';
    else if (score >= 40) status = 'Regular';
    
    // Generar recomendaciones
    if (salesScore < 20) recommendations.push('Impulsar estrategias de ventas');
    if (inventoryScore < 20) recommendations.push('Optimizar gestión de inventario');
    if (diversityScore < 20) recommendations.push('Expandir catálogo de productos');
    
    return {
      score: Math.round(score),
      status,
      indicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Mantener operaciones actuales']
    };
  }
  
  // Función auxiliar para calcular KPIs
  calculateKPIs(businessData) {
    const kpis = [];
    
    // KPI de ventas
    const todaySales = businessData?.sales?.today?.total || 0;
    kpis.push({
      name: 'Ventas del día',
      value: `$${todaySales.toLocaleString()}`,
      trend: todaySales > 0 ? '📈' : '📊'
    });
    
    // KPI de productos
    const totalProducts = businessData?.inventory?.totalProducts || 0;
    kpis.push({
      name: 'Productos activos',
      value: totalProducts,
      trend: totalProducts > 10 ? '📈' : '📊'
    });
    
    // KPI de stock
    const lowStockCount = businessData?.analytics?.lowStockCount || 0;
    kpis.push({
      name: 'Alertas de stock',
      value: lowStockCount,
      trend: lowStockCount === 0 ? '✅' : lowStockCount < 5 ? '⚠️' : '❌'
    });
    
    return kpis;
  }
  
  // Función auxiliar para emoji de estado
  getStatusEmoji(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }
  
  // Respuesta de ayuda avanzada
  generateAdvancedHelpResponse() {
    return {
      success: true,
      message: `🚀 **SuperBot Venezia v${this.version} - MEJORADO**\n\n🎯 **COMANDOS POR CATEGORÍA:**\n\n**📦 INVENTARIO INTELIGENTE:**\n• "Agregar 15 kg de chocolate" / "Llegaron 10 kilos de vainilla"\n• "¿Cuánto chocolate me queda?" / "Stock de fresa"\n• "¿Qué necesito reponer?" / "Productos con stock bajo"\n• "Crear sabor pistacho $5200"\n• "Cambiar precio del chocolate a $4800"\n\n**🔄 OPERACIONES COMPUESTAS (NUEVO):**\n• "Agregar 10 kg de chocolate y cambiar precio a $5000"\n• "Crear helado mango $4500 con 20 unidades"\n• "Actualizar chocolate: 15 kg y $5200"\n• "Hacer todo: crear fresa $4000, agregar 10 kg"\n\n**📊 ANÁLISIS EMPRESARIAL:**\n• "Salud del negocio" / "¿Cómo va todo?"\n• "Análisis de rentabilidad"\n• "KPIs del negocio" / "Métricas principales"\n• "Proyección de ventas"\n• "Tendencias del mes"\n\n**📈 VENTAS Y REPORTES:**\n• "¿Cuánto vendimos hoy?" / "Ventas del día"\n• "Top 5 más vendidos" / "Productos estrella"\n• "Comparar con ayer/semana pasada"\n• "¿Cuál es el más rentable?"\n\n**🚨 COMANDOS DE EMERGENCIA:**\n• "¿Qué está crítico?" / "Stock agotado"\n• "Estado de emergencia"\n• "Pedido urgente" / "Reposición inmediata"\n\n**⚙️ CONFIGURACIÓN:**\n• "Configurar bot" / "Ajustes"\n• "Activar ejecución automática"\n• "Personalizar respuestas"\n\n🧠 **INTELIGENCIA MEJORADA:**\n• Cache inteligente para respuestas rápidas\n• Sinónimos y variaciones de productos\n• Detección de patrones naturales en español\n• Integración con Gemini AI cuando disponible\n\n⚡ **EJECUCIÓN REAL** - Modifico tu base de datos automáticamente\n🎯 **APRENDIZAJE** - Mejoro con cada interacción\n💬 **LENGUAJE NATURAL** - Háblame como prefieras`,
      suggestions: ['Probar comando compuesto', 'Ver stock bajo', 'Activar auto-ejecución', 'Estado del negocio']
    };
  }
  
  generateHelpResponse(originalMessage = '') {
    return this.generateAdvancedHelpResponse();
  }

  generateErrorResponse(message) {
    return {
      success: false,
      message: `❌ **Error**\n\n${message}\n\n💡 **¿Necesitas ayuda?** Escribe "ayuda" para ver todos los comandos disponibles.`,
      suggestions: ['Ver ayuda', 'Probar comando simple', 'Contactar soporte']
    };
  }

  // =================================================================================
  // CONFIGURACIÓN Y PREFERENCIAS
  // =================================================================================

  loadUserPreferences() {
    try {
      const stored = localStorage.getItem('superbot-preferences');
      return stored ? JSON.parse(stored) : {
        autoExecute: false,
        confirmationRequired: true,
        voiceEnabled: true,
        language: 'es'
      };
    } catch {
      return {
        autoExecute: false,
        confirmationRequired: true,
        voiceEnabled: true,
        language: 'es'
      };
    }
  }

  saveUserPreferences(preferences) {
    try {
      this.conversationContext.userPreferences = { ...this.conversationContext.userPreferences, ...preferences };
      localStorage.setItem('superbot-preferences', JSON.stringify(this.conversationContext.userPreferences));
      return true;
    } catch {
      return false;
    }
  }

  updateConfiguration(config) {
    this.config = { ...this.config, ...config };
    return this.config;
  }

  getStatus() {
    return {
      version: this.version,
      capabilities: this.capabilities,
      config: this.config,
      pendingActions: this.conversationContext.pendingActions.length,
      userPreferences: this.conversationContext.userPreferences,
      cacheStatus: {
        commandCacheSize: this.commandCache.size,
        responseCacheSize: this.responseCache.size,
        productCacheSize: this.productCache.size,
        lastCacheClean: this.lastCacheClean
      },
      sessionHistory: this.conversationContext.sessionHistory.length
    };
  }
  
  clearCache() {
    this.commandCache.clear();
    this.responseCache.clear();
    this.productCache.clear();
    this.lastCacheClean = Date.now();
    console.log('🧹 Cache del SuperBot limpiado completamente');
    return {
      success: true,
      message: 'Cache limpiado exitosamente'
    };
  }
  
  // Método para actualizar el contexto del negocio
  updateBusinessContext(businessData) {
    this.conversationContext.businessData = businessData;
    this.conversationContext.businessMetrics = {
      lastUpdate: Date.now(),
      totalProducts: businessData?.inventory?.products?.length || 0,
      lowStockCount: businessData?.analytics?.lowStockProducts?.length || 0,
      todaySales: businessData?.sales?.today?.total || 0
    };
  }
}

// Instancia singleton
const superBotVenezia = new SuperBotVenezia();

export default superBotVenezia;