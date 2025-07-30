const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database/db');
const { authMiddleware: authenticateToken } = require('../middleware/auth');

// ==================== ENDPOINTS PARA SUPER-BOT VENEZIA ====================

// Endpoint para ejecutar acciones del SuperBot
router.post('/execute-action', authenticateToken, async (req, res) => {
  try {
    const { action, params, userId } = req.body;
    
    console.log('🤖 SuperBot ejecutando acción:', action, params);
    
    let result = {};
    
    switch (action) {
      case 'add_stock':
        result = await executeAddStock(params);
        break;
        
      case 'create_product':
        result = await executeCreateProduct(params);
        break;
        
      case 'update_price':
        result = await executeUpdatePrice(params);
        break;
        
      case 'register_sale':
        result = await executeRegisterSale(params);
        break;
        
      case 'create_production_order':
        result = await executeCreateProductionOrder(params);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: `Acción no reconocida: ${action}`
        });
    }

    // Log de la acción para auditoría
    await logBotAction(req.user.userId, action, params, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error ejecutando acción del SuperBot:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno ejecutando la acción',
      error: error.message
    });
  }
});

// ==================== ACCIONES ESPECÍFICAS ====================

async function executeAddStock(params) {
  try {
    const { productId, quantity, unit = 'unidades' } = params;
    
    // Verificar que el producto existe
    const product = await getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      return {
        success: false,
        message: `Producto con ID ${productId} no encontrado`
      };
    }
    
    // Actualizar el stock
    const newStock = (product.current_stock || 0) + quantity;
    await runAsync(
      'UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStock, productId]
    );
    
    // Registrar movimiento de inventario
    await runAsync(
      `INSERT INTO inventory_movements 
       (product_id, type, quantity, previous_stock, new_stock, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        productId, 
        'addition', 
        quantity, 
        product.current_stock || 0, 
        newStock, 
        `SuperBot: Agregado por comando de voz/texto - ${quantity} ${unit}`
      ]
    );
    
    return {
      success: true,
      message: `✅ Stock actualizado: ${quantity} ${unit} agregadas a ${product.name}`,
      data: {
        productId,
        productName: product.name,
        quantityAdded: quantity,
        unit,
        previousStock: product.current_stock || 0,
        newStock,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en executeAddStock:', error);
    return {
      success: false,
      message: `Error agregando stock: ${error.message}`
    };
  }
}

async function executeCreateProduct(params) {
  try {
    const { 
      name, 
      price, 
      category = 'Helado', 
      context = 'general', 
      initialStock = 0,
      description = '',
      minimumStock = 10
    } = params;
    
    // Verificar que no existe un producto con el mismo nombre
    const existingProduct = await getAsync(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    
    if (existingProduct) {
      return {
        success: false,
        message: `Ya existe un producto llamado "${name}"`
      };
    }
    
    // Buscar o crear la categoría
    let categoryId = null;
    const categoryResult = await getAsync(
      'SELECT id FROM product_categories WHERE LOWER(name) = LOWER(?)',
      [category]
    );
    
    if (categoryResult) {
      categoryId = categoryResult.id;
    } else {
      const newCategory = await runAsync(
        'INSERT INTO product_categories (name, description) VALUES (?, ?)',
        [category, `Categoría ${category}`]
      );
      categoryId = newCategory.id;
    }
    
    // Crear el producto
    const productResult = await runAsync(
      `INSERT INTO products 
       (name, description, price, category_id, current_stock, minimum_stock, context, active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [name, description, price, categoryId, initialStock, minimumStock, context]
    );
    
    // Si hay stock inicial, registrar movimiento
    if (initialStock > 0) {
      await runAsync(
        `INSERT INTO inventory_movements 
         (product_id, type, quantity, previous_stock, new_stock, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          productResult.id, 
          'initial', 
          initialStock, 
          0, 
          initialStock, 
          `SuperBot: Stock inicial al crear producto`
        ]
      );
    }
    
    // Obtener el producto creado con su categoría
    const newProduct = await getAsync(
      `SELECT p.*, pc.name as category_name 
       FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id 
       WHERE p.id = ?`,
      [productResult.id]
    );
    
    return {
      success: true,
      message: `✅ Producto creado: ${name} - $${price}`,
      data: {
        product: newProduct,
        created: true,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en executeCreateProduct:', error);
    return {
      success: false,
      message: `Error creando producto: ${error.message}`
    };
  }
}

async function executeUpdatePrice(params) {
  try {
    const { productId, newPrice } = params;
    
    // Verificar que el producto existe
    const product = await getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      return {
        success: false,
        message: `Producto con ID ${productId} no encontrado`
      };
    }
    
    const oldPrice = product.price;
    
    // Actualizar el precio
    await runAsync(
      'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPrice, productId]
    );
    
    // Registrar cambio de precio para auditoría
    await runAsync(
      `INSERT INTO price_history 
       (product_id, old_price, new_price, change_reason, created_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [productId, oldPrice, newPrice, 'SuperBot: Cambio por comando de voz/texto']
    );
    
    const priceDifference = newPrice - oldPrice;
    const percentageChange = oldPrice > 0 ? ((priceDifference / oldPrice) * 100).toFixed(1) : 0;
    
    return {
      success: true,
      message: `✅ Precio actualizado a $${newPrice} (${priceDifference >= 0 ? '+' : ''}${percentageChange}%)`,
      data: {
        productId,
        productName: product.name,
        oldPrice,
        newPrice,
        difference: priceDifference,
        percentageChange: parseFloat(percentageChange),
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en executeUpdatePrice:', error);
    return {
      success: false,
      message: `Error actualizando precio: ${error.message}`
    };
  }
}

async function executeRegisterSale(params) {
  try {
    const { 
      items, // [{ productId, quantity, price }]
      customerName = null,
      customerPhone = null,
      paymentMethod = 'cash',
      total,
      notes = ''
    } = params;
    
    let customerId = null;
    
    // Crear o encontrar cliente si se proporciona información
    if (customerName || customerPhone) {
      const existingCustomer = await getAsync(
        'SELECT id FROM customers WHERE name = ? OR phone = ?',
        [customerName || '', customerPhone || '']
      );
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else if (customerName) {
        const newCustomer = await runAsync(
          'INSERT INTO customers (name, phone, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [customerName, customerPhone || '']
        );
        customerId = newCustomer.id;
      }
    }
    
    // Crear la venta
    const saleResult = await runAsync(
      `INSERT INTO sales 
       (customer_id, store_id, user_id, total, payment_method, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [customerId, 1, 1, total, paymentMethod, `SuperBot: ${notes}`]
    );
    
    const saleId = saleResult.id;
    const updatedProducts = [];
    
    // Agregar items de la venta y actualizar stock
    for (const item of items) {
      const { productId, quantity, price } = item;
      
      // Agregar item a la venta
      await runAsync(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleId, productId, quantity, price, price * quantity]
      );
      
      // Actualizar stock del producto
      const product = await getAsync('SELECT name, current_stock FROM products WHERE id = ?', [productId]);
      const newStock = Math.max(0, (product.current_stock || 0) - quantity);
      
      await runAsync(
        'UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStock, productId]
      );
      
      // Registrar movimiento de inventario
      await runAsync(
        `INSERT INTO inventory_movements 
         (product_id, type, quantity, previous_stock, new_stock, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          productId, 
          'sale', 
          -quantity, 
          product.current_stock || 0, 
          newStock, 
          `SuperBot: Venta registrada - Sale ID: ${saleId}`
        ]
      );
      
      updatedProducts.push({
        productId,
        name: product.name,
        quantitySold: quantity,
        previousStock: product.current_stock || 0,
        newStock
      });
    }
    
    // Actualizar estadísticas del cliente si existe
    if (customerId) {
      await runAsync(
        `UPDATE customers 
         SET total_orders = total_orders + 1, 
             total_spent = total_spent + ?, 
             last_order_date = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [total, customerId]
      );
    }
    
    const receiptNumber = `VEN-${saleId.toString().padStart(6, '0')}`;
    
    return {
      success: true,
      message: `✅ Venta registrada - Recibo: ${receiptNumber}`,
      data: {
        saleId,
        receiptNumber,
        total,
        paymentMethod,
        customerId,
        customerName,
        updatedProducts,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en executeRegisterSale:', error);
    return {
      success: false,
      message: `Error registrando venta: ${error.message}`
    };
  }
}

async function executeCreateProductionOrder(params) {
  try {
    const { productId, quantity, notes = '', estimatedTime = 60 } = params;
    
    // Verificar que el producto existe
    const product = await getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (!product) {
      return {
        success: false,
        message: `Producto con ID ${productId} no encontrado`
      };
    }
    
    // Crear orden de producción
    const orderResult = await runAsync(
      `INSERT INTO production_orders 
       (product_id, quantity_requested, status, notes, estimated_minutes, created_at) 
       VALUES (?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`,
      [productId, quantity, `SuperBot: ${notes}`, estimatedTime]
    );
    
    const orderNumber = `PROD-${orderResult.id.toString().padStart(6, '0')}`;
    
    return {
      success: true,
      message: `✅ Orden de producción creada: ${orderNumber}`,
      data: {
        orderId: orderResult.id,
        orderNumber,
        productId,
        productName: product.name,
        quantity,
        status: 'pending',
        estimatedTime,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error en executeCreateProductionOrder:', error);
    return {
      success: false,
      message: `Error creando orden de producción: ${error.message}`
    };
  }
}

// ==================== CONSULTAS AVANZADAS PARA EL BOT ====================

// Buscar productos por nombre (fuzzy search)
router.get('/search-products', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }
    
    const products = await allAsync(
      `SELECT p.*, pc.name as category_name,
              CASE 
                WHEN LOWER(p.name) = LOWER(?) THEN 100
                WHEN LOWER(p.name) LIKE LOWER(?) THEN 90
                WHEN LOWER(p.name) LIKE LOWER(?) THEN 80
                ELSE 50
              END as relevance_score
       FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE LOWER(p.name) LIKE LOWER(?)
       ORDER BY relevance_score DESC, p.name
       LIMIT ?`,
      [query, `${query}%`, `%${query}%`, `%${query}%`, limit]
    );
    
    res.json({
      success: true,
      data: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

// Obtener contexto completo de negocio para el bot
router.get('/business-context', authenticateToken, async (req, res) => {
  try {
    // Obtener datos en paralelo
    const [
      todayStats,
      lowStockProducts,
      topProducts,
      recentSales,
      pendingOrders
    ] = await Promise.all([
      // Estadísticas del día
      getAsync(`
        SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(AVG(total), 0) as avg_ticket,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales
        FROM sales 
        WHERE DATE(created_at) = DATE('now')
      `),
      
      // Productos con stock bajo
      allAsync(`
        SELECT p.id, p.name, p.current_stock, p.minimum_stock,
               (p.minimum_stock - p.current_stock) as needed,
               pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.current_stock <= p.minimum_stock AND p.active = 1
        ORDER BY (p.minimum_stock - p.current_stock) DESC
        LIMIT 10
      `),
      
      // Productos más vendidos (últimos 30 días)
      allAsync(`
        SELECT p.id, p.name, p.price,
               SUM(si.quantity) as units_sold,
               SUM(si.subtotal) as revenue,
               COUNT(DISTINCT s.id) as orders_count
        FROM products p
        INNER JOIN sale_items si ON p.id = si.product_id
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= datetime('now', '-30 days')
        GROUP BY p.id
        ORDER BY units_sold DESC
        LIMIT 5
      `),
      
      // Ventas recientes
      allAsync(`
        SELECT s.id, s.total, s.payment_method, s.created_at,
               c.name as customer_name,
               COUNT(si.id) as items_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 5
      `),
      
      // Órdenes pendientes (si existen)
      allAsync(`
        SELECT po.id, po.quantity_requested, po.status, po.created_at,
               p.name as product_name
        FROM production_orders po
        INNER JOIN products p ON po.product_id = p.id
        WHERE po.status IN ('pending', 'in_progress')
        ORDER BY po.created_at DESC
        LIMIT 5
      `).catch(() => []) // Si no existe la tabla, devolver array vacío
    ]);
    
    // Calcular métricas adicionales
    const totalProducts = await getAsync('SELECT COUNT(*) as count FROM products WHERE active = 1');
    const totalStock = await getAsync('SELECT SUM(current_stock) as total FROM products WHERE active = 1');
    
    const businessContext = {
      sales: {
        today: {
          total: todayStats.total_revenue || 0,
          transactions: todayStats.sales_count || 0,
          avgTicket: todayStats.avg_ticket || 0,
          cashSales: todayStats.cash_sales || 0
        }
      },
      inventory: {
        totalProducts: totalProducts.count || 0,
        totalStock: totalStock.total || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.current_stock,
          minimum: p.minimum_stock,
          needed: p.needed,
          category: p.category_name
        }))
      },
      analytics: {
        topProducts: topProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unitsSold: p.units_sold,
          revenue: p.revenue,
          ordersCount: p.orders_count
        })),
        recentSales: recentSales.map(s => ({
          id: s.id,
          total: s.total,
          paymentMethod: s.payment_method,
          customerName: s.customer_name,
          itemsCount: s.items_count,
          createdAt: s.created_at
        })),
        pendingOrders: pendingOrders.map(o => ({
          id: o.id,
          productName: o.product_name,
          quantity: o.quantity_requested,
          status: o.status,
          createdAt: o.created_at
        }))
      },
      lastUpdated: new Date().toISOString(),
      source: 'superbot_context'
    };
    
    res.json({
      success: true,
      data: businessContext
    });
    
  } catch (error) {
    console.error('Error obteniendo contexto de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting business context',
      error: error.message
    });
  }
});

// ==================== AUDITORÍA Y LOGS ====================

async function logBotAction(userId, action, params, result) {
  try {
    await runAsync(
      `INSERT INTO bot_actions_log 
       (user_id, action_type, action_params, result, success, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        action,
        JSON.stringify(params),
        JSON.stringify(result),
        result.success ? 1 : 0
      ]
    );
  } catch (error) {
    console.error('Error logging bot action:', error);
    // No propagar el error, es solo para auditoría
  }
}

// Obtener historial de acciones del bot
router.get('/action-history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, userId = null } = req.query;
    
    let query = `
      SELECT bal.*, u.name as user_name
      FROM bot_actions_log bal
      LEFT JOIN users u ON bal.user_id = u.id
    `;
    let params = [];
    
    if (userId) {
      query += ' WHERE bal.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY bal.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const actions = await allAsync(query, params);
    
    res.json({
      success: true,
      data: actions.map(action => ({
        id: action.id,
        userId: action.user_id,
        userName: action.user_name,
        actionType: action.action_type,
        actionParams: JSON.parse(action.action_params || '{}'),
        result: JSON.parse(action.result || '{}'),
        success: action.success === 1,
        createdAt: action.created_at
      }))
    });
    
  } catch (error) {
    console.error('Error obteniendo historial de acciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting action history',
      error: error.message
    });
  }
});

module.exports = router;