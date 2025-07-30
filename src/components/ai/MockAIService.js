// Import MockApiService for executive actions
import MockApiService from '../../services/mockApiService';

// Auto-configurar Gemini API key si no está disponible
try {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('gemini-api-key')) {
    // Use environment variable if available, otherwise don't set a hardcoded key
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
      console.log('🚀 API key de Gemini configurada desde variables de entorno');
      
      // Importar y configurar AIService
      import('../../services/AIService.js').then(module => {
        const aiService = module.default;
        aiService.setGeminiApiKey(apiKey);
        console.log('✅ Gemini AI configurado con API key del entorno');
      }).catch(error => {
        console.log('ℹ️ AIService se configurará cuando sea necesario');
      });
    } else {
      console.log('⚠️ No se encontró REACT_APP_GEMINI_API_KEY en las variables de entorno');
    }
  }
} catch (error) {
  console.log('ℹ️ Configuración automática de Gemini omitida');
}

// Mock AI Service for development - simulates backend responses
class MockAIService {
  static async chatResponse(message, history = []) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // First check if this is an action command
    const actionResult = await this.processActionCommand(message);
    if (actionResult) {
      return actionResult;
    }
    
    // Organized responses with multiple keywords for better matching
    const responseCategories = {
      greetings: {
        keywords: ['hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 'saludos'],
        response: '¡Hola! Soy **VenezIA**, tu asistente inteligente de Venezia Ice Cream. ¿En qué puedo ayudarte hoy? Puedo ayudarte con ventas, inventario, producción, entregas y análisis.'
      },
      
      sales: {
        keywords: ['ventas', 'sales', 'vender', 'vendido', 'facturación', 'ingresos', 'cómo van las ventas', 'cómo van las ventas hoy', 'van las ventas'],
        response: '📊 **Ventas de Hoy - Excelente Rendimiento**\n\n💰 **Ingresos actuales:** $15,450\n📦 **Órdenes procesadas:** 89\n🏆 **Sabor más vendido:** Chocolate con Almendras (23 unidades)\n📈 **Tendencia:** +18% vs ayer\n\n🎯 *Recomendación: Considera aumentar stock de Chocolate con Almendras para mañana.*'
      },
      
      inventory: {
        keywords: ['inventario', 'inventory', 'stock', 'reponer', 'reabastecer', 'productos', 'necesito reponer', 'qué productos', 'falta', 'agotar', 'qué productos necesito reponer'],
        response: '📦 **Estado del Inventario - Alerta de Stock**\n\n🔴 **Stock Crítico:**\n• Chocolate Belga: 5 kg (Recomendado: 45 kg)\n• Vainilla Bourbon: 12 kg (Recomendado: 35 kg)\n\n🟡 **Stock Bajo:**\n• Frutilla Natural: 18 kg (Recomendado: 30 kg)\n• Dulce de Leche: 22 kg (Recomendado: 40 kg)\n\n✅ **Acción sugerida:** Crear orden de producción urgente para Chocolate y Vainilla.\n💡 *¿Quieres que genere automáticamente las órdenes de producción?*'
      },
      
      flavors: {
        keywords: ['sabores', 'flavors', 'sabores más vendidos', 'cuáles son mis sabores', 'top sabores', 'populares', 'más vendidos'],
        response: '🍦 **Top Sabores Más Vendidos**\n\n🥇 **#1 Chocolate con Almendras**\n• 127 ventas esta semana\n• Margen: 45%\n• Stock actual: Crítico (5 kg)\n\n🥈 **#2 Vainilla Premium**\n• 98 ventas esta semana\n• Margen: 40%\n• Stock actual: Bajo (12 kg)\n\n🥉 **#3 Dulce de Leche**\n• 85 ventas esta semana\n• Margen: 42%\n• Stock actual: Normal (22 kg)\n\n📈 **Tendencias:**\n• Chocolate +23% vs semana pasada\n• Sabores premium crecen 18%\n• Demanda pico: Viernes-Domingo\n\n💡 *Recomendación: Aumenta producción de los top 3 para el fin de semana.*'
      },
      
      addStock: {
        keywords: ['agregar stock', 'quiero agregar stock', 'añadir stock', 'suma stock', 'incrementar stock', 'agreguemos', 'helado', 'agregar helado', 'añadir helado'],
        response: '➕ **Agregar Stock a Productos**\n\n📝 **Para agregar stock, puedes decirme:**\n\n**Ejemplos de comandos:**\n• "Suma 15 kg de chocolate"\n• "Agregar 20 litros de vainilla"\n• "Incrementar 10 kg de frutilla"\n\n📦 **Productos disponibles:**\n• Chocolate Belga (crítico)\n• Vainilla Bourbon (bajo)\n• Frutilla Natural (normal)\n• Dulce de Leche (normal)\n• Mint Chip (normal)\n• Pistache Premium (normal)\n\n💡 *Solo escribe algo como "Suma 25 kg de chocolate" y yo lo ejecutaré automáticamente.*'
      },
      
      newFlavor: {
        keywords: ['nuevo sabor', 'crear sabor', 'crear un nuevo sabor', 'nuevo helado', 'nueva receta'],
        response: '🆕 **Crear Nuevo Sabor de Helado**\n\n📋 **Para crear un nuevo sabor necesito:**\n\n🍦 **Información básica:**\n• Nombre del sabor\n• Ingredientes principales\n• Tipo (cremoso, frutal, premium)\n• Precio sugerido\n\n📊 **Datos técnicos:**\n• Tiempo de preparación\n• Rendimiento por lote\n• Ingredientes especiales\n• Alergenos\n\n**Ejemplo:** "Crear sabor Cookies & Cream, cremoso, con galletas oreo trituradas, precio $180 por kg"\n\n💡 *¿Qué sabor tienes en mente? Compárteme los detalles y yo ayudo con la receta y configuración.*'
      },
      
      suppliers: {
        keywords: ['agregar proveedor', 'nuevo proveedor', 'crear proveedor', 'proveedores', 'suppliers'],
        response: '🏢 **Gestión de Proveedores**\n\n📋 **Para agregar un proveedor necesito:**\n\n🏭 **Información básica:**\n• Nombre de la empresa\n• Contacto principal\n• Teléfono y email\n• Dirección\n\n📦 **Productos que suministra:**\n• Tipo de ingredientes\n• Calidad (premium, estándar)\n• Precios por kg/litro\n• Tiempos de entrega\n\n**Ejemplo:** "Crear proveedor Lácteos San Miguel, contacto Juan Pérez, tel 1234-5678, suministra leche premium a $120/litro"\n\n💡 *¿Qué proveedor quieres agregar? Proporciona los detalles.*'
      },
      
      changePrices: {
        keywords: ['cambiar precios', 'actualizar precios', 'modificar precios', 'ajustar precios', 'nuevos precios'],
        response: '💰 **Cambiar Precios de Productos**\n\n📊 **Precios Actuales:**\n• Chocolate Belga: $195/kg\n• Vainilla Premium: $185/kg\n• Frutilla Natural: $175/kg\n• Dulce de Leche: $190/kg\n• Mint Chip: $180/kg\n• Pistache Premium: $220/kg\n\n📈 **Para cambiar precios, dime:**\n• "Cambiar precio de chocolate a $200"\n• "Actualizar vainilla a $190 por kg"\n• "Subir todos los precios 5%"\n\n💡 **Análisis de mercado:**\n• Competencia promedio: $185/kg\n• Margen actual: 38-45%\n• Elasticidad: Premium tolera +10%\n\n🎯 *¿Qué producto quieres ajustar y a qué precio?*'
      },
      
      production: {
        keywords: ['producción', 'production', 'lotes', 'fabricar', 'hacer', 'preparar', 'cocinar', 'batches'],
        response: '🏭 **Estado de Producción Actual**\n\n🔄 **Lotes en Proceso:**\n• **Lote #145** - Chocolate Premium\n  └ Progreso: 80% completo\n  └ Tiempo restante: 2 horas\n\n• **Lote #146** - Vainilla Bourbon\n  └ Progreso: 45% completo\n  └ Tiempo restante: 5.5 horas\n\n• **Lote #147** - Frutilla Natural\n  └ Progreso: 20% completo\n  └ Tiempo restante: 8 horas\n\n⚡ **Capacidad disponible:** 2 máquinas libres\n🎯 *¿Necesitas programar nuevos lotes?*'
      },
      
      analytics: {
        keywords: ['análisis', 'analytics', 'reporte', 'estadísticas', 'performance', 'rendimiento', 'métricas', 'analiza', 'rendimeinto', 'heladeria', 'heladería'],
        response: '📈 **Análisis de Rendimiento Semanal**\n\n🚀 **Crecimiento:** +15% en ventas\n📅 **Días pico:** Viernes y Sábado (+40%)\n🍦 **Top 3 Sabores:**\n  1. Chocolate con Almendras (127 ventas)\n  2. Vainilla Premium (98 ventas)\n  3. Dulce de Leche (85 ventas)\n\n💡 **Insights:**\n• Los fines de semana demandan 40% más helados premium\n• Las promociones de medio día aumentan ventas 25%\n• Días lluviosos reducen ventas 15%\n\n🎯 **Recomendación:** Aumentar producción premium para el próximo fin de semana.'
      },
      
      deliveries: {
        keywords: ['entregas', 'deliveries', 'delivery', 'repartidores', 'envíos', 'distribución', 'drivers'],
        response: '🚚 **Estado de Entregas del Día**\n\n📊 **Resumen General:**\n• Total programadas: 12 entregas\n• ✅ Entregadas: 8 (67%)\n• 🚛 En tránsito: 3 (25%)\n• ⏳ Pendientes: 1 (8%)\n\n👨‍💼 **Rendimiento de Repartidores:**\n• **Juan Pérez:** 98% éxito (5 entregas hoy)\n• **María García:** 95% éxito (3 entregas hoy)\n• **Carlos López:** 92% éxito (2 entregas hoy)\n\n🎯 *Tiempo promedio de entrega: 32 minutos*'
      },
      
      recommendations: {
        keywords: ['recomendaciones', 'recommendations', 'sugerencias', 'consejos', 'qué hacer', 'mejoras', 'mejorar', 'como puedo mejorar', 'mejorar mis ventas', 'aumentar ventas'],
        response: '💡 **Recomendaciones Inteligentes Basadas en Datos**\n\n🔥 **Prioridad Alta:**\n1. **Aumentar Producción de Chocolate** - Stock crítico, alta demanda\n2. **Promocionar Sabores de Temporada** - Aprovecha tendencias estacionales\n3. **Optimizar Rutas de Entrega** - Reduce tiempos 15%\n\n📈 **Oportunidades de Crecimiento:**\n• Programa de fidelización de clientes (+25% retención)\n• Horarios extendidos fin de semana (+30% ventas)\n• Nuevos sabores premium (+20% margen)\n\n🎯 *¿Te interesa implementar alguna de estas recomendaciones?*'
      },
      
    };
    
    const lowerMessage = message.toLowerCase();
    
    // Find best matching response using multiple keywords
    for (const [category, data] of Object.entries(responseCategories)) {
      for (const keyword of data.keywords) {
        if (lowerMessage.includes(keyword)) {
          return data.response;
        }
      }
    }
    
    // Default response with context awareness
    if (lowerMessage.includes('?') || lowerMessage.includes('qué') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return `Entiendo que preguntas sobre "${message}". Como asistente AI de Venezia, puedo ayudarte con información sobre ventas, inventario, producción, entregas y análisis del negocio. ¿Podrías ser más específico sobre qué aspecto te interesa?`;
    }
    
    return `He procesado tu mensaje: "${message}". Como tu asistente AI especializado en heladería, puedo ayudarte con análisis de ventas, optimización de inventario, planificación de producción y gestión de entregas. ¿En qué área específica necesitas asistencia?`;
  }

  // Process action commands that the AI can execute
  static async processActionCommand(message) {
    const lowerMessage = message.toLowerCase();
    
    // Inventory management commands
    if (this.isInventoryCommand(lowerMessage)) {
      return await this.handleInventoryCommand(message, lowerMessage);
    }
    
    // Production commands
    if (this.isProductionCommand(lowerMessage)) {
      return await this.handleProductionCommand(message, lowerMessage);
    }
    
    // Sales/Order commands
    if (this.isOrderCommand(lowerMessage)) {
      return await this.handleOrderCommand(message, lowerMessage);
    }
    
    // Delivery commands
    if (this.isDeliveryCommand(lowerMessage)) {
      return await this.handleDeliveryCommand(message, lowerMessage);
    }
    
    return null; // No action command detected
  }

  // Check if message is an inventory command
  static isInventoryCommand(message) {
    const inventoryKeywords = ['suma', 'agregar', 'añadir', 'incrementar', 'stock', 'inventario', 'kg', 'kilogramo', 'litro'];
    return inventoryKeywords.some(keyword => message.includes(keyword));
  }

  // Handle inventory commands
  static async handleInventoryCommand(originalMessage, lowerMessage) {
    // Extract quantity and product
    const quantityMatch = originalMessage.match(/(\d+(?:\.\d+)?)\s*(kg|kilogramo|litro|l|unidad)/i);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : null;
    const unit = quantityMatch ? quantityMatch[2].toLowerCase() : 'kg';
    
    // Extract product name and map to backend products
    let productName = null;
    let productId = null;
    
    // Map AI product names to backend product IDs
    const productMapping = {
      'chocolate': { id: 1, name: 'Chocolate Amargo' },
      'chocolate amargo': { id: 1, name: 'Chocolate Amargo' },
      'vainilla': { id: 2, name: 'Vainilla' },
      'dulce de leche': { id: 3, name: 'Dulce de Leche' },
      'frutilla': { id: 4, name: 'Frutilla' },
      'menta': { id: 5, name: 'Menta Granizada' },
      'menta granizada': { id: 5, name: 'Menta Granizada' }
    };
    
    // Find matching product
    for (const [key, value] of Object.entries(productMapping)) {
      if (lowerMessage.includes(key)) {
        productName = value.name;
        productId = value.id;
        break;
      }
    }
    
    // Default to chocolate if no specific product found but quantity is specified
    if (!productName && quantity) {
      productName = 'Chocolate Amargo';
      productId = 1;
    }

    if (quantity && productId) {
      // Call the REAL backend API
      try {
        console.log('🔥 Llamando API real:', `/api/executive/add-stock`);
        const response = await fetch('/api/executive/add-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            quantity: quantity,
            unit: unit
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Respuesta API real:', result);
          
          return `✅ ¡Listo! He agregado ${quantity} ${unit} de ${result.product.name} al inventario real.

📦 **Acción ejecutada en la base de datos:**
- Producto: ${result.product.name}
- Cantidad agregada: ${quantity} ${unit}
- Stock actual: ${result.new_stock} ${unit}
- Precio: $${result.product.price}

🔄 **El cambio se refleja inmediatamente en toda la aplicación web.**
💡 *Puedes verificarlo en la sección de productos o inventario.*`;
        } else {
          const errorData = await response.json();
          console.error('❌ Error API real:', errorData);
          throw new Error(errorData.message || 'API error');
        }
      } catch (error) {
        console.error('❌ Error conectando con backend:', error);
        
        // Fallback to mock execution but inform user
        try {
          const result = await MockApiService.addInventory({
            product: productName,
            quantity: quantity,
            unit: unit,
            reason: 'AI Assistant - Comando de usuario'
          });

          if (result.success) {
            return `⚠️ ¡Comando ejecutado en modo simulación!

📦 **Acción ejecutada (solo simulación):**
- Producto: ${productName}
- Cantidad agregada: ${quantity} ${unit}
- Stock simulado: ${result.data.new_stock} ${unit}
- Timestamp: ${new Date(result.data.timestamp).toLocaleString()}

🔧 **Nota:** El backend no está disponible, esto es solo una simulación.
💡 *Para cambios reales, usa el Asistente Guiado o verifica la conexión.*`;
          }
        } catch (mockError) {
          console.error('Mock API error:', mockError);
        }
        
        return `❌ **Error de conexión**

No pude conectar con la base de datos para agregar ${quantity} ${unit} de ${productName}.

🔧 **Posibles causas:**
- Servidor backend no disponible
- Producto no encontrado en la base de datos
- Error de red

💡 **Soluciones:**
- Usa el Asistente Guiado para acciones manuales
- Verifica que el servidor esté ejecutándose
- Intenta nuevamente en unos momentos`;
      }
    } else {
      return `❓ Entiendo que quieres agregar stock, pero necesito más información:

**Formato sugerido:** "Suma 2 kg de chocolate" o "Agregar 5 kg de vainilla"

📦 **Productos disponibles:**
- Chocolate Amargo
- Vainilla
- Dulce de Leche
- Frutilla
- Menta Granizada

¿Podrías especificar la cantidad y el producto?`;
    }
  }

  // Check if message is a production command
  static isProductionCommand(message) {
    const productionKeywords = ['producir', 'hacer', 'preparar', 'lote', 'receta', 'fabricar', 'crear sabor', 'nuevo sabor', 'nueva receta'];
    return productionKeywords.some(keyword => message.includes(keyword));
  }

  // Handle production commands
  static async handleProductionCommand(originalMessage, lowerMessage) {
    // Check if this is creating a new product vs production batch
    if (lowerMessage.includes('nuevo') || lowerMessage.includes('crear') || lowerMessage.includes('sabor')) {
      return this.handleNewProductCreation(originalMessage, lowerMessage);
    }
    
    const quantityMatch = originalMessage.match(/(\d+(?:\.\d+)?)\s*(kg|kilogramo|litro|l|unidad|lote)/i);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 25; // Default 25 kg
    
    let productName = 'Chocolate Premium'; // Default
    if (lowerMessage.includes('vainilla')) productName = 'Vainilla Bourbon';
    else if (lowerMessage.includes('frutilla')) productName = 'Frutilla Natural';
    else if (lowerMessage.includes('dulce')) productName = 'Dulce de Leche';

    // For now, production orders are not implemented in backend, so return guidance
    return `🏭 **Gestión de Producción**

📋 **Para órdenes de producción:** 
El sistema actual maneja inventario directo. Para aumentar stock de ${productName}:

💡 **Comando sugerido:** "Suma ${quantity} kg de ${productName.split(' ')[0].toLowerCase()}"

📦 **Productos disponibles para stock:**
- Chocolate Amargo
- Vainilla
- Dulce de Leche
- Frutilla
- Menta Granizada

🎯 *El comando de suma actualizará el inventario inmediatamente en la base de datos.*`;
  }

  // Handle new product creation
  static async handleNewProductCreation(originalMessage, lowerMessage) {
    // Extract product name
    const nameMatch = originalMessage.match(/(?:crear|nuevo|nueva)\s+(?:sabor\s+)?(.+?)(?:\s+(?:precio|a|por)|\s*$)/i);
    let productName = nameMatch ? nameMatch[1].trim() : null;
    
    // Extract price
    const priceMatch = originalMessage.match(/precio\s+(?:\$)?(\d+(?:\.\d+)?)/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 3500; // Default price
    
    if (!productName) {
      return `🆕 **Crear Nuevo Sabor**

Para crear un nuevo producto necesito el nombre:

**Formato:** "Crear sabor [Nombre] precio $[cantidad]"
**Ejemplo:** "Crear sabor Cookies & Cream precio $4000"

¿Qué sabor quieres crear?`;
    }

    try {
      console.log('🔥 Creando producto:', productName);
      const response = await fetch('/api/executive/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          price: price,
          context: 'ai_created',
          category: 'Helado',
          initial_stock: 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Producto creado:', result);
        
        return `🆕 ¡Nuevo sabor creado exitosamente!

📦 **Producto agregado a la base de datos:**
- Nombre: ${result.product.name}
- ID: #${result.product.id}
- Precio: $${result.product.price}
- Stock inicial: ${result.product.stock} kg
- Categoría: ${result.product.category}

🔄 **El producto ya está disponible en toda la aplicación.**
💡 *Ahora puedes agregar stock con: "Suma X kg de ${productName}"*`;
      } else {
        const errorData = await response.json();
        console.error('❌ Error creando producto:', errorData);
        
        if (errorData.message && errorData.message.includes('already exists')) {
          return `⚠️ **Producto Similar Existe**

${errorData.message}

💡 **Opciones:**
- Usa un nombre diferente
- Agrega stock al producto existente
- Modifica el nombre para hacerlo único`;
        }
        
        throw new Error(errorData.message || 'Error creando producto');
      }
    } catch (error) {
      console.error('❌ Error conectando con backend:', error);
      
      return `❌ **Error al crear producto**

No pude crear "${productName}" en la base de datos.

🔧 **Posibles causas:**
- Servidor backend no disponible
- Producto con nombre similar ya existe
- Error de red

💡 **Soluciones:**
- Verifica que el servidor esté ejecutándose
- Usa el Asistente Guiado para crear productos manualmente
- Intenta con un nombre diferente`;
    }
  }

  // Check if message is an order command
  static isOrderCommand(message) {
    const orderKeywords = ['crear orden', 'nueva venta', 'vender', 'orden', 'pedido'];
    return orderKeywords.some(keyword => message.includes(keyword));
  }

  // Handle order commands
  static async handleOrderCommand(originalMessage, lowerMessage) {
    return `🛒 Para crear órdenes de venta necesito más información:

**Datos requeridos:**
- Cliente (nombre/teléfono)
- Productos y cantidades
- Método de pago
- ¿Es para delivery?

**Ejemplo:** "Crear orden para Juan Pérez, 2 kg chocolate y 1 kg vainilla, pago efectivo, delivery a Av. Corrientes 1234"

¿Me proporcionas estos datos?`;
  }

  // Check if message is a delivery command
  static isDeliveryCommand(message) {
    const deliveryKeywords = ['entregar', 'delivery', 'envío', 'repartir', 'asignar repartidor', 'repartidores', 'drivers', 'disponibles'];
    return deliveryKeywords.some(keyword => message.includes(keyword));
  }

  // Handle delivery commands
  static async handleDeliveryCommand(originalMessage, lowerMessage) {
    // Check if asking for available drivers
    if (lowerMessage.includes('disponibles') || lowerMessage.includes('repartidores') || lowerMessage.includes('drivers')) {
      try {
        const result = await MockApiService.getAvailableDrivers();
        
        if (result.success) {
          const availableDrivers = result.drivers.filter(d => d.available);
          const unavailableDrivers = result.drivers.filter(d => !d.available);
          
          let response = `🚚 **Estado actual de repartidores:**\n\n`;
          
          if (availableDrivers.length > 0) {
            response += `✅ **Disponibles (${availableDrivers.length}):**\n`;
            availableDrivers.forEach(driver => {
              response += `• ${driver.name} - ${driver.vehicle} (${driver.current_orders} órdenes activas)\n`;
            });
          }
          
          if (unavailableDrivers.length > 0) {
            response += `\n❌ **No disponibles (${unavailableDrivers.length}):**\n`;
            unavailableDrivers.forEach(driver => {
              response += `• ${driver.name} - ${driver.vehicle}\n`;
            });
          }
          
          response += `\n💡 **Puedes decir:** "Asignar orden #1234 a ${availableDrivers[0]?.name || 'Juan'}"`;
          
          return response;
        }
      } catch (error) {
        console.error('Error getting drivers:', error);
      }
    }
    
    return `🚚 **Control de entregas disponible:**

Puedo ayudarte con:
- Ver repartidores disponibles: "¿Qué repartidores están disponibles?"
- Asignar repartidores a órdenes
- Actualizar estado de entregas
- Optimizar rutas

**Ejemplo:** "Asignar orden #1234 a Juan Pérez" o "¿Qué repartidores están disponibles?"

¿Qué acción específica necesitas?`;
  }
  
  static async getPredictions(days = 7) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const predictions = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const baseRevenue = 8000 + Math.random() * 4000;
      const baseSales = Math.floor(baseRevenue / 150); // Average $150 per sale
      const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence
      
      predictions.push({
        date: date.toLocaleDateString('es-AR'),
        predicted_sales: baseSales,
        predicted_revenue: baseRevenue,
        confidence: confidence
      });
    }
    
    return {
      summary: `Predicciones para los próximos ${days} días muestran un crecimiento sostenido del 12% con ingresos estimados de $${predictions.reduce((sum, p) => sum + p.predicted_revenue, 0).toLocaleString('es-AR', {maximumFractionDigits: 0})}`,
      predictions,
      recommended_products: [
        {
          product_name: 'Chocolate con Almendras',
          expected_demand: Math.floor(150 + Math.random() * 50),
          priority: 'alta'
        },
        {
          product_name: 'Vainilla Premium',
          expected_demand: Math.floor(120 + Math.random() * 40),
          priority: 'media'
        },
        {
          product_name: 'Frutilla Natural',
          expected_demand: Math.floor(100 + Math.random() * 30),
          priority: 'media'
        },
        {
          product_name: 'Dulce de Leche',
          expected_demand: Math.floor(90 + Math.random() * 25),
          priority: 'baja'
        }
      ],
      insights: [
        'Los fines de semana muestran un aumento del 40% en ventas',
        'Los sabores premium tienen mayor demanda en días calurosos',
        'Las promociones de medio día aumentan las ventas en un 25%',
        'Los días lluviosos reducen las ventas de helados en un 15%'
      ]
    };
  }
  
  static async getBusinessAnalysis() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      summary: 'El rendimiento general del negocio es excelente este mes. Las ventas han crecido un 18% comparado con el mes anterior, la eficiencia operativa ha mejorado y la satisfacción del cliente se mantiene alta.',
      performance_score: Math.floor(7 + Math.random() * 3), // 7-10 score
      recommendations: [
        {
          category: 'Ventas',
          priority: 'alta',
          action: 'Implementar programa de fidelización para clientes frecuentes',
          impact: 'Podría aumentar ventas recurrentes en un 25%'
        },
        {
          category: 'Inventario',
          priority: 'media',
          action: 'Optimizar niveles de stock usando predicciones AI',
          impact: 'Reducción del 15% en desperdicio de productos'
        },
        {
          category: 'Producción',
          priority: 'media',
          action: 'Automatizar más procesos de preparación',
          impact: 'Aumento del 20% en eficiencia de producción'
        },
        {
          category: 'Entregas',
          priority: 'baja',
          action: 'Expandir zona de delivery a nuevos barrios',
          impact: 'Potencial de crecimiento del 30% en entregas'
        }
      ],
      trends: {
        sales_growth: '18%',
        customer_satisfaction: '94%',
        operational_efficiency: '89%',
        profit_margin: '32%'
      }
    };
  }
  
  static async getInventoryOptimization() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      summary: 'Análisis de inventario completo. Se detectaron 3 productos con stock crítico, 2 con exceso de stock y se generaron recomendaciones de producción optimizada.',
      stock_alerts: [
        {
          product: 'Chocolate Belga',
          store: 'Sucursal Centro',
          current_stock: 5,
          recommended_stock: 45,
          urgency: 'alta',
          reasoning: 'Stock crítico. Producto muy demandado los fines de semana.'
        },
        {
          product: 'Vainilla Bourbon',
          store: 'Sucursal Norte',
          current_stock: 12,
          recommended_stock: 35,
          urgency: 'media',
          reasoning: 'Stock bajo. Aumentar antes del próximo fin de semana.'
        },
        {
          product: 'Limón Natural',
          store: 'Sucursal Sur',
          current_stock: 8,
          recommended_stock: 25,
          urgency: 'media',
          reasoning: 'Sabor de temporada con demanda creciente.'
        }
      ],
      overstock_items: [
        {
          product: 'Menta Granizada',
          store: 'Sucursal Centro',
          current_stock: 75,
          suggested_action: 'Promoción especial para reducir stock'
        },
        {
          product: 'Coco Rayado',
          store: 'Sucursal Norte',
          current_stock: 60,
          suggested_action: 'Transferir 20 unidades a Sucursal Sur'
        }
      ],
      production_priorities: [
        'Chocolate Belga',
        'Vainilla Bourbon',
        'Dulce de Leche',
        'Frutilla Cremosa',
        'Limón Natural'
      ]
    };
  }
}

export default MockAIService;