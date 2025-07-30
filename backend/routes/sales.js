const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database/db');
const Sale = require('../models/Sale.supabase');
const CashFlow = require('../models/CashFlow');
const { getNotificationService } = require('../services/notificationService.instance');

// Determine if we should use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL;

// ==================== SALES ENDPOINTS ====================

// Create a new sale
router.post('/', async (req, res) => {
  try {
    const { items, customer, payment_method, discount, total } = req.body;
    
    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un producto para procesar la venta'
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El total de la venta debe ser mayor a 0'
      });
    }

    // Use Supabase if available
    if (USE_SUPABASE) {
      try {
        const result = await Sale.create({
          customer_id: customer?.id || null,
          store_id: req.user?.store_id || 1,
          user_id: req.user?.id || 1,
          total,
          payment_method: payment_method || 'cash',
          items: items.map(item => ({
            product_id: item.product_id || item.id,
            quantity: item.quantity,
            price: item.price || item.unit_price || 0
          }))
        });

        // Send notification for new order
        const notificationService = getNotificationService();
        if (notificationService) {
          notificationService.notifyNewOrder({
            id: result.sale.id,
            order_number: result.receipt_number,
            customer_name: customer?.name || 'Cliente',
            total_amount: total,
            store_id: req.user?.store_id || 1
          }).catch(err => console.error('Error sending notification:', err));
        }

        return res.json({
          success: true,
          message: 'Venta procesada exitosamente',
          receipt_number: result.receipt_number,
          sale: result.sale
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
        // Fall through to SQLite implementation
      }
    }

    // SQLite implementation (fallback)
    // Create or find customer
    let customerId = null;
    if (customer && customer.name) {
      const existingCustomer = await getAsync(
        'SELECT id FROM customers WHERE name = ? OR phone = ?',
        [customer.name, customer.phone || '']
      );
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const result = await runAsync(
          'INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)',
          [customer.name, customer.phone || '', customer.email || '']
        );
        customerId = result.id;
      }
    }
    
    // Create sale
    const saleResult = await runAsync(
      'INSERT INTO sales (customer_id, store_id, user_id, total, payment_method) VALUES (?, ?, ?, ?, ?)',
      [customerId, req.user?.store_id || 1, req.user?.id || 1, total, payment_method || 'cash']
    );
    
    // Add sale items and update stock
    for (const item of items) {
      await runAsync(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleResult.id, item.product_id || item.id, item.quantity, item.price || 0, (item.price || 0) * item.quantity]
      );
      
      // Update product stock
      await runAsync(
        'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
        [item.quantity, item.product_id || item.id]
      );
    }
    
    // Update customer stats if applicable
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
    
    // Add to cash flow if payment is cash
    if (payment_method === 'cash') {
      await CashFlow.addMovement(
        req.user?.store_id || 1, 
        req.user?.id || 1, 
        'income', 
        total, 
        `Venta #${saleResult.id}`, 
        saleResult.id
      );
    }
    
    // Send notification for new order
    const notificationService = getNotificationService();
    if (notificationService) {
      notificationService.notifyNewOrder({
        id: saleResult.id,
        order_number: `VEN-${saleResult.id.toString().padStart(6, '0')}`,
        customer_name: customer?.name || 'Cliente',
        total_amount: total,
        store_id: req.user?.store_id || 1
      }).catch(err => console.error('Error sending notification:', err));
    }
    
    res.json({
      success: true,
      message: 'Venta procesada exitosamente',
      receipt_number: `VEN-${saleResult.id.toString().padStart(6, '0')}`,
      sale: {
        id: saleResult.id,
        total,
        payment_method
      }
    });
  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar venta',
      error: error.message
    });
  }
});

// Get recent sales
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    if (USE_SUPABASE) {
      try {
        const sales = await Sale.getRecent(limit);
        return res.json({
          success: true,
          data: sales
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const sales = await allAsync(`
      SELECT s.*, c.name as customer_name,
             COUNT(si.id) as items_count,
             GROUP_CONCAT(p.name || ' x' || si.quantity, ', ') as items_preview
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ?
    `, [limit]);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent sales',
      error: error.message
    });
  }
});

// Get sale by ID with details
router.get('/:id', async (req, res) => {
  try {
    const saleId = req.params.id;
    
    if (USE_SUPABASE) {
      try {
        const sale = await Sale.getById(saleId);
        if (!sale) {
          return res.status(404).json({
            success: false,
            message: 'Venta no encontrada'
          });
        }
        return res.json({
          success: true,
          data: sale
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const sale = await getAsync(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone,
             u.name as cashier_name, st.name as store_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.id = ?
    `, [saleId]);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }
    
    // Get sale items
    const items = await allAsync(`
      SELECT si.*, p.name as product_name, p.price as current_price
      FROM sale_items si
      INNER JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [saleId]);
    
    sale.items = items;
    
    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles de la venta',
      error: error.message
    });
  }
});

// Create delivery order
router.post('/delivery', async (req, res) => {
  try {
    const { 
      items, 
      customer, 
      payment_method, 
      total, 
      delivery_address, 
      delivery_phone, 
      estimated_time, 
      notes 
    } = req.body;
    
    // Validate delivery fields
    if (!delivery_address || !delivery_phone) {
      return res.status(400).json({
        success: false,
        message: 'Dirección y teléfono de entrega son requeridos'
      });
    }
    
    if (USE_SUPABASE) {
      try {
        const result = await Sale.createDeliveryOrder({
          items: items.map(item => ({
            product_id: item.product_id || item.id,
            quantity: item.quantity,
            price: item.price || item.unit_price || 0
          })),
          customer,
          payment_method,
          total,
          delivery_address,
          delivery_phone,
          estimated_time,
          notes
        });

        return res.json({
          success: true,
          message: 'Orden de delivery creada exitosamente',
          receipt_number: result.receipt_number,
          sale: result.sale,
          delivery: result.delivery
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite implementation (use existing endpoint logic from remaining-endpoints.js)
    // This would be the same logic as in the /api/pos/create-delivery-order endpoint
    // For now, we'll redirect to that endpoint
    req.url = '/pos/create-delivery-order';
    return require('./remaining-endpoints')(req, res);
    
  } catch (error) {
    console.error('Error creating delivery order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de delivery',
      error: error.message
    });
  }
});

// Get today's sales stats
router.get('/stats/today', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      try {
        const stats = await Sale.getTodayStats();
        return res.json({
          success: true,
          data: stats
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const stats = await getAsync(`
      SELECT 
        COUNT(*) as sales_count,
        COALESCE(SUM(total), 0) as sales_total,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales
      WHERE DATE(created_at) = DATE('now')
    `);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del día',
      error: error.message
    });
  }
});

// Get sales analytics
router.get('/analytics/:period', async (req, res) => {
  try {
    const { period } = req.params;
    let startDate, endDate;
    
    // Calculate date range based on period
    const now = new Date();
    endDate = now.toISOString();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
    }
    
    if (USE_SUPABASE) {
      try {
        const sales = await Sale.getSalesByPeriod(startDate, endDate);
        const productStats = await Sale.getProductSalesStats(30);
        
        return res.json({
          success: true,
          data: {
            sales,
            productStats,
            period: {
              start: startDate,
              end: endDate
            }
          }
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback - simplified version
    const sales = await allAsync(`
      SELECT * FROM sales
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at
    `, [startDate, endDate]);
    
    res.json({
      success: true,
      data: {
        sales,
        period: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de ventas',
      error: error.message
    });
  }
});

// Generate receipt PDF
router.get('/:id/receipt', async (req, res) => {
  try {
    const saleId = req.params.id;
    const ReceiptService = require('../services/receiptService');
    const receiptService = new ReceiptService();
    
    // Get sale data
    let saleData;
    
    if (USE_SUPABASE) {
      try {
        saleData = await Sale.getById(saleId);
        if (!saleData) {
          return res.status(404).json({
            success: false,
            message: 'Venta no encontrada'
          });
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
        // Fall through to SQLite
      }
    }
    
    if (!saleData) {
      // SQLite fallback
      const sale = await getAsync(`
        SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
               u.name as cashier_name, st.name as store_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.id = ?
      `, [saleId]);
      
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      // Get sale items
      const items = await allAsync(`
        SELECT si.*, p.name as product_name, p.price as current_price
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [saleId]);
      
      sale.items = items;
      sale.receipt_number = `VEN-${sale.id.toString().padStart(6, '0')}`;
      saleData = sale;
    }
    
    // Generate receipt PDF
    const pdfBuffer = await receiptService.generateReceiptBuffer(saleData);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo-${saleData.receipt_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar recibo',
      error: error.message
    });
  }
});

// Generate invoice PDF
router.get('/:id/invoice', async (req, res) => {
  try {
    const saleId = req.params.id;
    const ReceiptService = require('../services/receiptService');
    const receiptService = new ReceiptService();
    
    // Get sale data
    let saleData;
    
    if (USE_SUPABASE) {
      try {
        saleData = await Sale.getById(saleId);
        if (!saleData) {
          return res.status(404).json({
            success: false,
            message: 'Venta no encontrada'
          });
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
        // Fall through to SQLite
      }
    }
    
    if (!saleData) {
      // SQLite fallback
      const sale = await getAsync(`
        SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
               u.name as cashier_name, st.name as store_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.id = ?
      `, [saleId]);
      
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      // Get sale items
      const items = await allAsync(`
        SELECT si.*, p.name as product_name, p.price as current_price
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [saleId]);
      
      sale.items = items;
      sale.receipt_number = `VEN-${sale.id.toString().padStart(6, '0')}`;
      sale.invoice_number = `FAC-${sale.id.toString().padStart(6, '0')}`;
      saleData = sale;
    }
    
    // Generate invoice PDF
    const pdfBuffer = await receiptService.generateInvoiceBuffer(saleData);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${saleData.invoice_number || saleData.receipt_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar factura',
      error: error.message
    });
  }
});

module.exports = router;