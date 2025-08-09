const { runAsync, getAsync, allAsync } = require('../database/db');
const aiRoutes = require('./ai');
const superBotRoutes = require('./superbot');

module.exports = (app) => {
  // ==================== AI ROUTES ====================
  app.use('/api/ai', aiRoutes);
  
  // ==================== SUPER-BOT ROUTES ====================
  app.use('/api/superbot', superBotRoutes);
  // ==================== PRODUCT CATEGORIES ====================
  app.get('/api/product_categories', async (req, res) => {
    try {
      const categories = await allAsync('SELECT * FROM product_categories ORDER BY name');
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product categories',
        error: error.message
      });
    }
  });

  app.post('/api/product_categories', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es requerido'
        });
      }
      
      const result = await runAsync(
        'INSERT INTO product_categories (name, description) VALUES (?, ?)',
        [name, description || '']
      );
      
      const category = await getAsync(
        'SELECT * FROM product_categories WHERE id = ?',
        [result.id]
      );
      
      res.json({
        success: true,
        message: 'Categoría creada exitosamente',
        category
      });
    } catch (error) {
      console.error('Error creating product category:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear categoría',
        error: error.message
      });
    }
  });

  app.put('/api/product_categories/:id', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      await runAsync(
        'UPDATE product_categories SET name = ?, description = ? WHERE id = ?',
        [name, description || '', req.params.id]
      );
      
      const category = await getAsync(
        'SELECT * FROM product_categories WHERE id = ?',
        [req.params.id]
      );
      
      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        category
      });
    } catch (error) {
      console.error('Error updating product category:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
        error: error.message
      });
    }
  });

  app.delete('/api/product_categories/:id', async (req, res) => {
    try {
      await runAsync('DELETE FROM product_categories WHERE id = ?', [req.params.id]);
      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error deleting product category:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar categoría',
        error: error.message
      });
    }
  });

  // ==================== STORES ====================
  app.get('/api/stores', async (req, res) => {
    try {
      const stores = await allAsync('SELECT * FROM stores ORDER BY name');
      res.json({
        success: true,
        data: stores
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stores',
        error: error.message
      });
    }
  });

  app.post('/api/stores', async (req, res) => {
    try {
      const { name, location, phone, email } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la tienda es requerido'
        });
      }
      
      const result = await runAsync(
        'INSERT INTO stores (name, location, phone, email) VALUES (?, ?, ?, ?)',
        [name, location || '', phone || '', email || '']
      );
      
      const store = await getAsync('SELECT * FROM stores WHERE id = ?', [result.id]);
      
      res.json({
        success: true,
        message: 'Tienda creada exitosamente',
        store
      });
    } catch (error) {
      console.error('Error creating store:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear tienda',
        error: error.message
      });
    }
  });

  // ==================== PROVIDERS ====================
  app.get('/api/providers', async (req, res) => {
    try {
      const providers = await allAsync(`
        SELECT p.*, pc.name as category_name 
        FROM providers p 
        LEFT JOIN provider_categories pc ON p.category_id = pc.id
        ORDER BY p.name
      `);
      
      res.json({
        success: true,
        providers,
        total_count: providers.length
      });
    } catch (error) {
      console.error('Error fetching providers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching providers',
        error: error.message
      });
    }
  });

  app.get('/api/provider_categories', async (req, res) => {
    try {
      const categories = await allAsync('SELECT * FROM provider_categories ORDER BY name');
      res.json({
        success: true,
        data: categories,
        categories // For compatibility
      });
    } catch (error) {
      console.error('Error fetching provider categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching provider categories',
        error: error.message
      });
    }
  });

  app.post('/api/providers/add', async (req, res) => {
    try {
      const { name, contact_person, phone, email, address, cuit, category_id, notes } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del proveedor es requerido'
        });
      }
      
      const result = await runAsync(
        `INSERT INTO providers (name, contact_person, phone, email, address, cuit, category_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, contact_person || '', phone || '', email || '', address || '', 
         cuit || '', category_id || null, notes || '']
      );
      
      const provider = await getAsync(
        `SELECT p.*, pc.name as category_name 
         FROM providers p 
         LEFT JOIN provider_categories pc ON p.category_id = pc.id
         WHERE p.id = ?`,
        [result.id]
      );
      
      res.json({
        success: true,
        message: 'Proveedor agregado exitosamente',
        provider
      });
    } catch (error) {
      console.error('Error adding provider:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar proveedor',
        error: error.message
      });
    }
  });

  app.post('/api/providers/edit', async (req, res) => {
    try {
      const { id, name, contact_person, phone, email, address, cuit, category_id, notes } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({
          success: false,
          message: 'ID y nombre del proveedor son requeridos'
        });
      }
      
      await runAsync(
        `UPDATE providers 
         SET name = ?, contact_person = ?, phone = ?, email = ?, 
             address = ?, cuit = ?, category_id = ?, notes = ?
         WHERE id = ?`,
        [name, contact_person || '', phone || '', email || '', address || '', 
         cuit || '', category_id || null, notes || '', id]
      );
      
      const provider = await getAsync(
        `SELECT p.*, pc.name as category_name 
         FROM providers p 
         LEFT JOIN provider_categories pc ON p.category_id = pc.id
         WHERE p.id = ?`,
        [id]
      );
      
      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        provider
      });
    } catch (error) {
      console.error('Error editing provider:', error);
      res.status(500).json({
        success: false,
        message: 'Error al editar proveedor',
        error: error.message
      });
    }
  });

  app.delete('/api/providers/:id', async (req, res) => {
    try {
      await runAsync('DELETE FROM providers WHERE id = ?', [req.params.id]);
      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente',
        deleted_id: req.params.id
      });
    } catch (error) {
      console.error('Error deleting provider:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar proveedor',
        error: error.message
      });
    }
  });

  app.post('/api/providers/toggle_status/:id', async (req, res) => {
    try {
      const provider = await getAsync('SELECT status FROM providers WHERE id = ?', [req.params.id]);
      
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
      
      const newStatus = provider.status === 'active' ? 'inactive' : 'active';
      await runAsync('UPDATE providers SET status = ? WHERE id = ?', [newStatus, req.params.id]);
      
      res.json({
        success: true,
        message: `Proveedor ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`,
        status: newStatus
      });
    } catch (error) {
      console.error('Error toggling provider status:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del proveedor',
        error: error.message
      });
    }
  });

  // ==================== WEB USERS ====================
  app.get('/api/web_users', async (req, res) => {
    try {
      const users = await allAsync(`
        SELECT wu.*, c.name as customer_name, c.phone as customer_phone
        FROM web_users wu
        LEFT JOIN customers c ON wu.customer_id = c.id
        ORDER BY wu.username
      `);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching web users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching web users',
        error: error.message
      });
    }
  });

  app.post('/web_users/add', async (req, res) => {
    try {
      const { username, password, email, phone, customer_id } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username, password y email son requeridos'
        });
      }
      
      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await runAsync(
        `INSERT INTO web_users (username, password, email, phone, customer_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, email, phone || '', customer_id || null]
      );
      
      const user = await getAsync(
        `SELECT id, username, email, phone, customer_id, active, created_at 
         FROM web_users WHERE id = ?`,
        [result.id]
      );
      
      res.json({
        success: true,
        message: 'Usuario web creado exitosamente',
        user
      });
    } catch (error) {
      console.error('Error creating web user:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario web',
        error: error.message
      });
    }
  });

  // ==================== SALES ====================
  // Nota: El endpoint principal POST /api/sales fue movido a router dedicado (routes/sales.js)

  app.get('/api/sales/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
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

  // ==================== ANALYTICS ====================
  app.get('/api/analytics/sales', async (req, res) => {
    try {
      const { range = 'last_30_days', from, to } = req.query;
      
      // Calculate total sales
      const totals = await getAsync(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_sales,
          COALESCE(AVG(total), 0) as avg_ticket
        FROM sales
        WHERE created_at >= datetime('now', '-30 days')
      `);
      
      // Get sales by period (last 30 days)
      const salesByPeriod = await allAsync(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(total) as revenue,
          AVG(total) as avg_ticket
        FROM sales
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      
      res.json({
        success: true,
        data: {
          total_sales: totals.total_sales || 0,
          total_orders: totals.total_orders || 0,
          avg_ticket: totals.avg_ticket || 0,
          sales_growth: 18.5, // Mock data for now
          orders_growth: 12.3,
          ticket_growth: 5.5,
          sales_by_period: salesByPeriod
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: error.message
      });
    }
  });

  app.get('/api/analytics/products', async (req, res) => {
    try {
      const topProducts = await allAsync(`
        SELECT 
          p.id,
          p.name,
          p.price,
          SUM(si.quantity) as units_sold,
          SUM(si.subtotal) as revenue,
          COUNT(DISTINCT si.sale_id) as orders_count
        FROM products p
        INNER JOIN sale_items si ON p.id = si.product_id
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= datetime('now', '-30 days')
        GROUP BY p.id
        ORDER BY units_sold DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        data: {
          top_products: topProducts
        },
        top_products: topProducts // For compatibility
      });
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product analytics',
        error: error.message
      });
    }
  });

  app.get('/api/analytics/customers', async (req, res) => {
    try {
      const customerStats = await getAsync(`
        SELECT 
          COUNT(DISTINCT customer_id) as total_customers,
          COUNT(DISTINCT CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN customer_id END) as active_customers
        FROM sales
        WHERE customer_id IS NOT NULL
      `);
      
      res.json({
        success: true,
        data: {
          total_customers: customerStats.total_customers || 0,
          active_customers: customerStats.active_customers || 0,
          new_customers_growth: 15.2 // Mock data
        }
      });
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching customer analytics',
        error: error.message
      });
    }
  });

  app.get('/api/analytics/kpis', async (req, res) => {
    try {
      // Calculate key performance indicators
      const kpis = await getAsync(`
        SELECT 
          COUNT(DISTINCT s.id) as total_orders,
          COUNT(DISTINCT s.customer_id) as unique_customers,
          COALESCE(SUM(s.total), 0) as total_revenue,
          COALESCE(AVG(s.total), 0) as avg_order_value,
          COUNT(DISTINCT CASE WHEN s.created_at >= datetime('now', '-7 days') THEN s.id END) as weekly_orders,
          COUNT(DISTINCT CASE WHEN s.created_at >= datetime('now', '-1 days') THEN s.id END) as daily_orders
        FROM sales s
        WHERE s.created_at >= datetime('now', '-30 days')
      `);
      
      // Calculate conversion rate (mock data for now)
      const conversionRate = 3.2; // percentage
      const customerRetention = 65.5; // percentage
      
      res.json({
        success: true,
        data: {
          conversion_rate: conversionRate,
          customer_retention: customerRetention,
          avg_order_value: kpis.avg_order_value || 0,
          total_revenue: kpis.total_revenue || 0,
          total_orders: kpis.total_orders || 0,
          unique_customers: kpis.unique_customers || 0,
          weekly_orders: kpis.weekly_orders || 0,
          daily_orders: kpis.daily_orders || 0
        }
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching KPIs',
        error: error.message
      });
    }
  });

  // ==================== POS DELIVERY INTEGRATION ====================
  app.post('/api/pos/create-delivery-order', async (req, res) => {
    try {
      const { items, customer, payment_method, discount, total, delivery_address, delivery_phone, estimated_time, notes } = req.body;
      
      if (!delivery_address || !delivery_phone) {
        return res.status(400).json({
          success: false,
          message: 'Dirección y teléfono de entrega son requeridos'
        });
      }
      
      // Create or find customer
      let customerId = null;
      if (customer && customer.name) {
        const existingCustomer = await getAsync(
          'SELECT id FROM customers WHERE name = ? OR phone = ?',
          [customer.name, customer.phone || delivery_phone]
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update customer address if provided
          await runAsync(
            'UPDATE customers SET address = ?, phone = ? WHERE id = ?',
            [delivery_address, delivery_phone, customerId]
          );
        } else {
          const result = await runAsync(
            'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [customer.name, delivery_phone, customer.email || '', delivery_address]
          );
          customerId = result.id;
        }
      }
      
      // Create sale
      const saleResult = await runAsync(
        'INSERT INTO sales (customer_id, store_id, user_id, total, payment_method, sale_type) VALUES (?, ?, ?, ?, ?, ?)',
        [customerId, 1, 1, total, payment_method || 'cash', 'delivery']
      );
      
      // Add sale items and update stock
      const stockUpdated = [];
      for (const item of items) {
        await runAsync(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [saleResult.id, item.product_id, item.quantity, item.price || 0, (item.price || 0) * item.quantity]
        );
        
        // Update product stock
        const stockResult = await runAsync(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
        
        stockUpdated.push({
          product_id: item.product_id,
          quantity_deducted: item.quantity
        });
      }
      
      // Create delivery record
      const deliveryResult = await runAsync(
        `INSERT INTO deliveries (
          sale_id, customer_name, customer_phone, address, 
          total_amount, status, estimated_time, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          saleResult.id,
          customer.name || 'Cliente sin nombre',
          delivery_phone,
          delivery_address,
          total,
          'pending',
          estimated_time || '30-45 minutos',
          notes || ''
        ]
      );
      
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
        const CashFlow = require('../models/CashFlow');
        await CashFlow.addMovement(1, 1, 'income', total, `Venta Delivery #${saleResult.id}`, saleResult.id);
      }
      
      res.json({
        success: true,
        message: 'Orden de delivery creada exitosamente',
        receipt_number: `DEL-${saleResult.id.toString().padStart(6, '0')}`,
        sale: {
          id: saleResult.id,
          total,
          payment_method,
          type: 'delivery'
        },
        delivery: {
          id: deliveryResult.id,
          estimated_time,
          status: 'pending'
        },
        stock_updated: stockUpdated
      });
    } catch (error) {
      console.error('Error creating delivery order:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear orden de delivery',
        error: error.message
      });
    }
  });

  // ==================== DELIVERIES ACTIVE ====================
  app.get('/api/deliveries/active', async (req, res) => {
    try {
      const activeDeliveries = await allAsync(`
        SELECT d.*, s.total as sale_total
        FROM deliveries d
        LEFT JOIN sales s ON d.sale_id = s.id
        WHERE d.status IN ('pending', 'assigned', 'in_transit')
        ORDER BY 
          CASE d.status 
            WHEN 'in_transit' THEN 1
            WHEN 'assigned' THEN 2
            WHEN 'pending' THEN 3
          END,
          d.created_at ASC
      `);
      
      res.json({
        success: true,
        data: activeDeliveries
      });
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active deliveries',
        error: error.message
      });
    }
  });

  // ==================== POS LIVE METRICS ====================
  app.get('/api/pos/live-metrics', async (req, res) => {
    try {
      // Today's metrics
      const todayStats = await getAsync(`
        SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as sales_total,
          COALESCE(AVG(total), 0) as avg_ticket
        FROM sales
        WHERE DATE(created_at) = DATE('now')
      `);
      
      // Items sold today
      const itemsSold = await getAsync(`
        SELECT COALESCE(SUM(si.quantity), 0) as items_count
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) = DATE('now')
      `);
      
      // Efficiency calculation (sales per hour)
      const currentHour = new Date().getHours();
      const efficiency = currentHour > 0 ? (todayStats.sales_count / currentHour).toFixed(1) : '0.0';
      
      // Delivery metrics
      const deliveryStats = await getAsync(`
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_deliveries,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_deliveries
        FROM deliveries
        WHERE DATE(created_at) = DATE('now')
      `);
      
      res.json({
        success: true,
        data: {
          todaySales: todayStats.sales_total || 0,
          salesCount: todayStats.sales_count || 0,
          avgTicket: todayStats.avg_ticket || 0,
          itemsSold: itemsSold.items_count || 0,
          efficiency: parseFloat(efficiency),
          deliveries: {
            total: deliveryStats.total_deliveries || 0,
            pending: deliveryStats.pending_deliveries || 0,
            in_transit: deliveryStats.in_transit_deliveries || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching POS live metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching live metrics',
        error: error.message
      });
    }
  });

  // ==================== OTHER ENDPOINTS ====================
  app.get('/api/dashboard/overview', async (req, res) => {
    try {
      const todayStats = await getAsync(`
        SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as sales_total
        FROM sales
        WHERE DATE(created_at) = DATE('now')
      `);
      
      const lowStock = await allAsync(
        'SELECT COUNT(*) as count FROM products WHERE current_stock <= 10 AND active = 1'
      );
      
      res.json({
        success: true,
        data: {
          todaySales: todayStats.sales_count || 0,
          todayRevenue: todayStats.sales_total || 0,
          activeOrders: 0, // TODO: Implement order tracking
          lowStockItems: lowStock[0]?.count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard',
        error: error.message
      });
    }
  });
};