const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database/db');
const Provider = require('../models/Provider.supabase');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const jsPDF = require('jspdf');

// Determine if we should use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL;

// Apply flexible auth to all routes
router.use(flexibleAuth);

// ==================== PROVIDER ENDPOINTS ====================

// Get all providers
router.get('/providers', async (req, res) => {
  try {
    const { category_id, is_active, search, store_id } = req.query;
    const filters = { category_id, is_active, search, store_id };

    if (USE_SUPABASE) {
      try {
        const providers = await Provider.getAll(filters);
        return res.json({
          success: true,
          data: providers
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT p.*, pc.name as category_name,
        (SELECT COUNT(*) FROM purchase_orders WHERE provider_id = p.id AND status != 'cancelled') as order_count,
        (SELECT SUM(total_amount) FROM purchase_orders WHERE provider_id = p.id AND status != 'cancelled') as total_purchases
      FROM providers p
      LEFT JOIN provider_categories pc ON p.category_id = pc.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (is_active !== undefined) {
      query += ` AND p.is_active = ?`;
      params.push(is_active === 'true' ? 1 : 0);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.contact_person LIKE ? OR p.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (store_id) {
      query += ` AND p.store_id = ?`;
      params.push(store_id);
    }

    query += ` ORDER BY p.name ASC`;

    const providers = await allAsync(query, params);

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
});

// Get provider by ID
router.get('/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const provider = await Provider.getById(providerId);
        if (!provider) {
          return res.status(404).json({
            success: false,
            message: 'Proveedor no encontrado'
          });
        }
        return res.json({
          success: true,
          data: provider
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const provider = await getAsync(
      `SELECT p.*, pc.name as category_name
       FROM providers p
       LEFT JOIN provider_categories pc ON p.category_id = pc.id
       WHERE p.id = ?`,
      [providerId]
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Get provider products
    const products = await allAsync(
      `SELECT * FROM provider_products WHERE provider_id = ? ORDER BY product_name`,
      [providerId]
    );

    provider.provider_products = products;

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
});

// Create new provider
router.post('/providers', async (req, res) => {
  try {
    const providerData = req.body;

    // Validate required fields
    if (!providerData.name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Provider.create(providerData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const result = await runAsync(
      `INSERT INTO providers (
        name, contact_person, phone, email, address, cuit,
        category_id, notes, payment_terms, credit_limit,
        is_active, store_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
      [
        providerData.name,
        providerData.contact_person || null,
        providerData.phone || null,
        providerData.email || null,
        providerData.address || null,
        providerData.cuit || null,
        providerData.category_id || null,
        providerData.notes || null,
        providerData.payment_terms || 'Net 30',
        providerData.credit_limit || 0,
        providerData.store_id || null
      ]
    );

    res.json({
      success: true,
      provider: {
        id: result.id,
        ...providerData
      }
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
});

// Update provider
router.put('/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;
    const updateData = req.body;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.update(providerId, updateData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    fields.push(`updated_at = datetime('now')`);
    values.push(providerId);

    await runAsync(
      `UPDATE providers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const provider = await getAsync(
      'SELECT * FROM providers WHERE id = ?',
      [providerId]
    );

    res.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
});

// Delete provider
router.delete('/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.delete(providerId);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Check if provider has purchase orders
    const orderCount = await getAsync(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE provider_id = ?',
      [providerId]
    );

    if (orderCount.count > 0) {
      // Soft delete
      await runAsync(
        'UPDATE providers SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?',
        [providerId]
      );
    } else {
      // Hard delete
      await runAsync('DELETE FROM providers WHERE id = ?', [providerId]);
    }

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
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

// ==================== CATEGORY ENDPOINTS ====================

// Get provider categories
router.get('/provider-categories', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      try {
        const categories = await Provider.getCategories();
        return res.json({
          success: true,
          data: categories
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const categories = await allAsync(
      'SELECT * FROM provider_categories WHERE is_active = 1 ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching provider categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
});

// Create provider category
router.post('/provider-categories', async (req, res) => {
  try {
    const categoryData = req.body;

    if (!categoryData.name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Provider.createCategory(categoryData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const result = await runAsync(
      `INSERT INTO provider_categories (name, description, is_active, created_at, updated_at)
       VALUES (?, ?, 1, datetime('now'), datetime('now'))`,
      [categoryData.name, categoryData.description || null]
    );

    res.json({
      success: true,
      category: {
        id: result.id,
        ...categoryData
      }
    });
  } catch (error) {
    console.error('Error creating provider category:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
});

// ==================== PROVIDER PRODUCTS ENDPOINTS ====================

// Get provider products
router.get('/providers/:id/products', async (req, res) => {
  try {
    const providerId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const products = await Provider.getProducts(providerId);
        return res.json({
          success: true,
          data: products
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const products = await allAsync(
      'SELECT * FROM provider_products WHERE provider_id = ? ORDER BY product_name ASC',
      [providerId]
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching provider products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos del proveedor',
      error: error.message
    });
  }
});

// Add product to provider
router.post('/providers/:id/products', async (req, res) => {
  try {
    const providerId = req.params.id;
    const productData = req.body;

    if (!productData.product_id || !productData.product_name || productData.unit_cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ID del producto, nombre y costo unitario son requeridos'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Provider.addProduct(providerId, productData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const result = await runAsync(
      `INSERT INTO provider_products (
        provider_id, product_id, product_code, product_name,
        unit_cost, lead_time_days, minimum_order_quantity,
        is_preferred, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        providerId,
        productData.product_id,
        productData.product_code || null,
        productData.product_name,
        productData.unit_cost,
        productData.lead_time_days || 0,
        productData.minimum_order_quantity || 1,
        productData.is_preferred ? 1 : 0,
        productData.notes || null
      ]
    );

    res.json({
      success: true,
      provider_product: {
        id: result.id,
        provider_id: providerId,
        ...productData
      }
    });
  } catch (error) {
    console.error('Error adding provider product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al proveedor',
      error: error.message
    });
  }
});

// Update provider product
router.put('/providers/:providerId/products/:productId', async (req, res) => {
  try {
    const { providerId, productId } = req.params;
    const updateData = req.body;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.updateProduct(providerId, productId, updateData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'provider_id' && key !== 'product_id' && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    fields.push(`updated_at = datetime('now')`);
    values.push(providerId, productId);

    await runAsync(
      `UPDATE provider_products SET ${fields.join(', ')} WHERE provider_id = ? AND product_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating provider product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
});

// Remove product from provider
router.delete('/providers/:providerId/products/:productId', async (req, res) => {
  try {
    const { providerId, productId } = req.params;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.removeProduct(providerId, productId);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    await runAsync(
      'DELETE FROM provider_products WHERE provider_id = ? AND product_id = ?',
      [providerId, productId]
    );

    res.json({
      success: true,
      message: 'Producto eliminado del proveedor exitosamente'
    });
  } catch (error) {
    console.error('Error removing provider product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
});

// ==================== PURCHASE ORDER ENDPOINTS ====================

// Get all purchase orders
router.get('/purchase-orders', async (req, res) => {
  try {
    const { provider_id, status, payment_status, store_id, start_date, end_date } = req.query;
    const filters = { provider_id, status, payment_status, store_id, start_date, end_date };

    if (USE_SUPABASE) {
      try {
        const orders = await Provider.getPurchaseOrders(filters);
        return res.json({
          success: true,
          data: orders
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT po.*, p.name as provider_name, p.email as provider_email,
        p.phone as provider_phone, p.payment_terms,
        (SELECT COUNT(*) FROM purchase_order_items WHERE order_id = po.id) as item_count
      FROM purchase_orders po
      INNER JOIN providers p ON po.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (provider_id) {
      query += ` AND po.provider_id = ?`;
      params.push(provider_id);
    }

    if (status) {
      query += ` AND po.status = ?`;
      params.push(status);
    }

    if (payment_status) {
      query += ` AND po.payment_status = ?`;
      params.push(payment_status);
    }

    if (store_id) {
      query += ` AND po.store_id = ?`;
      params.push(store_id);
    }

    if (start_date) {
      query += ` AND po.order_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND po.order_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY po.order_date DESC`;

    const orders = await allAsync(query, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de compra',
      error: error.message
    });
  }
});

// Get purchase order by ID
router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const order = await Provider.getPurchaseOrderById(orderId);
        if (!order) {
          return res.status(404).json({
            success: false,
            message: 'Orden de compra no encontrada'
          });
        }
        return res.json({
          success: true,
          data: order
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const order = await getAsync(
      `SELECT po.*, p.name as provider_name, p.email as provider_email,
        p.phone as provider_phone, p.payment_terms
       FROM purchase_orders po
       INNER JOIN providers p ON po.provider_id = p.id
       WHERE po.id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }

    // Get order items
    const items = await allAsync(
      'SELECT * FROM purchase_order_items WHERE order_id = ?',
      [orderId]
    );

    order.purchase_order_items = items;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden de compra',
      error: error.message
    });
  }
});

// Create purchase order
router.post('/purchase-orders', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.provider_id) {
      return res.status(400).json({
        success: false,
        message: 'El proveedor es requerido'
      });
    }

    if (USE_SUPABASE) {
      try {
        // Check credit limit if order has total
        if (orderData.subtotal) {
          const creditCheck = await Provider.checkCreditLimit(
            orderData.provider_id,
            orderData.subtotal + (orderData.tax_amount || 0) + (orderData.shipping_cost || 0) - (orderData.discount_amount || 0)
          );

          if (!creditCheck.success) {
            return res.status(400).json(creditCheck);
          }
        }

        const result = await Provider.createPurchaseOrder(orderData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Generate order number
    const year = new Date().getFullYear();
    const lastOrder = await getAsync(
      `SELECT MAX(CAST(SUBSTR(order_number, -5) AS INTEGER)) as last_num
       FROM purchase_orders
       WHERE order_number LIKE 'PO-${year}-%'`
    );

    const nextNum = (lastOrder.last_num || 0) + 1;
    const orderNumber = `PO-${year}-${String(nextNum).padStart(5, '0')}`;

    // Calculate subtotal if items provided
    let subtotal = 0;
    if (orderData.items && orderData.items.length > 0) {
      subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    }

    const result = await runAsync(
      `INSERT INTO purchase_orders (
        order_number, provider_id, store_id, order_date,
        expected_delivery_date, status, subtotal, tax_amount,
        shipping_cost, discount_amount, notes, payment_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
      [
        orderNumber,
        orderData.provider_id,
        orderData.store_id || null,
        orderData.expected_delivery_date || null,
        orderData.status || 'draft',
        subtotal,
        orderData.tax_amount || 0,
        orderData.shipping_cost || 0,
        orderData.discount_amount || 0,
        orderData.notes || null
      ]
    );

    // Add order items
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        await runAsync(
          `INSERT INTO purchase_order_items (
            order_id, product_id, product_name, quantity,
            unit, unit_cost, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            result.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit,
            item.unit_cost,
            item.notes || null
          ]
        );
      }
    }

    res.json({
      success: true,
      order: {
        id: result.id,
        order_number: orderNumber,
        ...orderData,
        subtotal,
        total_amount: subtotal + (orderData.tax_amount || 0) + (orderData.shipping_cost || 0) - (orderData.discount_amount || 0)
      }
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de compra',
      error: error.message
    });
  }
});

// Update purchase order
router.put('/purchase-orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.updatePurchaseOrder(orderId, updateData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const { items, ...orderData } = updateData;

    // Update order
    const fields = [];
    const values = [];

    Object.keys(orderData).forEach(key => {
      if (key !== 'id' && key !== 'order_number' && orderData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(orderData[key]);
      }
    });

    if (fields.length > 0) {
      fields.push(`updated_at = datetime('now')`);
      values.push(orderId);

      await runAsync(
        `UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update items if provided
    if (items) {
      // Delete existing items
      await runAsync('DELETE FROM purchase_order_items WHERE order_id = ?', [orderId]);

      // Insert new items
      let subtotal = 0;
      for (const item of items) {
        await runAsync(
          `INSERT INTO purchase_order_items (
            order_id, product_id, product_name, quantity,
            unit, unit_cost, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit,
            item.unit_cost,
            item.notes || null
          ]
        );
        subtotal += item.quantity * item.unit_cost;
      }

      // Update subtotal
      await runAsync(
        'UPDATE purchase_orders SET subtotal = ? WHERE id = ?',
        [subtotal, orderId]
      );
    }

    res.json({
      success: true,
      message: 'Orden de compra actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden de compra',
      error: error.message
    });
  }
});

// Delete purchase order
router.delete('/purchase-orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const result = await Provider.deletePurchaseOrder(orderId);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Check if order is draft
    const order = await getAsync(
      'SELECT status FROM purchase_orders WHERE id = ?',
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar órdenes en borrador'
      });
    }

    await runAsync('DELETE FROM purchase_orders WHERE id = ?', [orderId]);

    res.json({
      success: true,
      message: 'Orden de compra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar orden de compra',
      error: error.message
    });
  }
});

// Receive purchase order
router.post('/purchase-orders/:id/receive', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar los items recibidos'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Provider.receivePurchaseOrder(orderId, items);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Update received quantities
    for (const item of items) {
      await runAsync(
        `UPDATE purchase_order_items
         SET received_quantity = ?
         WHERE order_id = ? AND product_id = ?`,
        [item.received_quantity, orderId, item.product_id]
      );
    }

    // Check if all items are received
    const itemsStatus = await allAsync(
      `SELECT quantity, received_quantity
       FROM purchase_order_items
       WHERE order_id = ?`,
      [orderId]
    );

    let allReceived = true;
    let partialReceived = false;

    for (const item of itemsStatus) {
      if (item.received_quantity < item.quantity) {
        allReceived = false;
      }
      if (item.received_quantity > 0 && item.received_quantity < item.quantity) {
        partialReceived = true;
      }
    }

    // Update order status
    let status = 'confirmed';
    if (allReceived) {
      status = 'received';
    } else if (partialReceived) {
      status = 'partial';
    }

    await runAsync(
      `UPDATE purchase_orders
       SET status = ?, delivery_date = CASE WHEN ? = 'received' THEN datetime('now') ELSE delivery_date END
       WHERE id = ?`,
      [status, status, orderId]
    );

    res.json({
      success: true,
      status,
      message: 'Recepción procesada exitosamente'
    });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar recepción',
      error: error.message
    });
  }
});

// Generate purchase order PDF
router.get('/purchase-orders/:id/pdf', async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Get order details
    let order;
    if (USE_SUPABASE) {
      try {
        order = await Provider.getPurchaseOrderById(orderId);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    if (!order) {
      // SQLite fallback
      order = await getAsync(
        `SELECT po.*, p.name as provider_name, p.email as provider_email,
          p.phone as provider_phone, p.address as provider_address
         FROM purchase_orders po
         INNER JOIN providers p ON po.provider_id = p.id
         WHERE po.id = ?`,
        [orderId]
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }

      // Get order items
      const items = await allAsync(
        'SELECT * FROM purchase_order_items WHERE order_id = ?',
        [orderId]
      );

      order.purchase_order_items = items;
    }

    // Create PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('ORDEN DE COMPRA', 105, 20, { align: 'center' });

    // Order info
    doc.setFontSize(12);
    doc.text(`Número: ${order.order_number}`, 20, 40);
    doc.text(`Fecha: ${new Date(order.order_date).toLocaleDateString()}`, 20, 50);
    doc.text(`Estado: ${order.status}`, 20, 60);

    // Provider info
    doc.text('PROVEEDOR:', 20, 80);
    doc.text(order.provider_name, 20, 90);
    if (order.provider_address) doc.text(order.provider_address, 20, 100);
    if (order.provider_phone) doc.text(`Tel: ${order.provider_phone}`, 20, 110);
    if (order.provider_email) doc.text(`Email: ${order.provider_email}`, 20, 120);

    // Items table
    let yPos = 140;
    doc.text('ITEMS:', 20, yPos);
    yPos += 10;

    // Table header
    doc.text('Producto', 20, yPos);
    doc.text('Cant.', 100, yPos);
    doc.text('Unidad', 120, yPos);
    doc.text('P. Unit.', 140, yPos);
    doc.text('Total', 170, yPos);
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Table rows
    order.purchase_order_items.forEach(item => {
      doc.text(item.product_name, 20, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(item.unit, 120, yPos);
      doc.text(`$${item.unit_cost}`, 140, yPos);
      doc.text(`$${(item.quantity * item.unit_cost).toFixed(2)}`, 170, yPos);
      yPos += 10;
    });

    // Totals
    yPos += 10;
    doc.line(140, yPos, 190, yPos);
    yPos += 10;
    doc.text('Subtotal:', 140, yPos);
    doc.text(`$${order.subtotal}`, 170, yPos);
    yPos += 10;

    if (order.tax_amount > 0) {
      doc.text('IVA:', 140, yPos);
      doc.text(`$${order.tax_amount}`, 170, yPos);
      yPos += 10;
    }

    if (order.shipping_cost > 0) {
      doc.text('Envío:', 140, yPos);
      doc.text(`$${order.shipping_cost}`, 170, yPos);
      yPos += 10;
    }

    if (order.discount_amount > 0) {
      doc.text('Descuento:', 140, yPos);
      doc.text(`-$${order.discount_amount}`, 170, yPos);
      yPos += 10;
    }

    doc.setFontSize(14);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`$${order.total_amount}`, 170, yPos);

    // Send PDF
    const pdfOutput = doc.output();
    res.contentType('application/pdf');
    res.send(Buffer.from(pdfOutput, 'binary'));

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF',
      error: error.message
    });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

// Record payment
router.post('/provider-payments', async (req, res) => {
  try {
    const paymentData = req.body;

    if (!paymentData.provider_id || !paymentData.amount || !paymentData.payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor, monto y método de pago son requeridos'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Provider.recordPayment(paymentData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const result = await runAsync(
      `INSERT INTO provider_payments (
        provider_id, purchase_order_id, payment_date,
        amount, payment_method, reference_number,
        notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        paymentData.provider_id,
        paymentData.purchase_order_id || null,
        paymentData.payment_date || new Date().toISOString(),
        paymentData.amount,
        paymentData.payment_method,
        paymentData.reference_number || null,
        paymentData.notes || null
      ]
    );

    // Update provider balance
    await runAsync(
      `UPDATE providers
       SET current_balance = (
         SELECT COALESCE(SUM(po.total_amount), 0) - COALESCE(SUM(pp.amount), 0)
         FROM purchase_orders po
         LEFT JOIN provider_payments pp ON pp.provider_id = providers.id
         WHERE po.provider_id = providers.id AND po.status != 'cancelled'
       )
       WHERE id = ?`,
      [paymentData.provider_id]
    );

    // Update purchase order payment status if applicable
    if (paymentData.purchase_order_id) {
      const order = await getAsync(
        'SELECT total_amount FROM purchase_orders WHERE id = ?',
        [paymentData.purchase_order_id]
      );

      const totalPaid = await getAsync(
        `SELECT SUM(amount) as total_paid
         FROM provider_payments
         WHERE purchase_order_id = ?`,
        [paymentData.purchase_order_id]
      );

      let paymentStatus = 'pending';
      if (totalPaid.total_paid >= order.total_amount) {
        paymentStatus = 'paid';
      } else if (totalPaid.total_paid > 0) {
        paymentStatus = 'partial';
      }

      await runAsync(
        `UPDATE purchase_orders
         SET payment_status = ?, payment_date = CASE WHEN ? = 'paid' THEN ? ELSE payment_date END
         WHERE id = ?`,
        [paymentStatus, paymentStatus, paymentData.payment_date || new Date().toISOString(), paymentData.purchase_order_id]
      );
    }

    res.json({
      success: true,
      payment: {
        id: result.id,
        ...paymentData
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  }
});

// Get payments
router.get('/provider-payments', async (req, res) => {
  try {
    const { provider_id, purchase_order_id, start_date, end_date } = req.query;
    const filters = { provider_id, purchase_order_id, start_date, end_date };

    if (USE_SUPABASE) {
      try {
        const payments = await Provider.getPayments(filters);
        return res.json({
          success: true,
          data: payments
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT pp.*, p.name as provider_name, po.order_number
      FROM provider_payments pp
      INNER JOIN providers p ON pp.provider_id = p.id
      LEFT JOIN purchase_orders po ON pp.purchase_order_id = po.id
      WHERE 1=1
    `;
    const params = [];

    if (provider_id) {
      query += ` AND pp.provider_id = ?`;
      params.push(provider_id);
    }

    if (purchase_order_id) {
      query += ` AND pp.purchase_order_id = ?`;
      params.push(purchase_order_id);
    }

    if (start_date) {
      query += ` AND pp.payment_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND pp.payment_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY pp.payment_date DESC`;

    const payments = await allAsync(query, params);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
});

// ==================== ANALYTICS & REPORTS ====================

// Get provider analytics
router.get('/providers/:id/analytics', async (req, res) => {
  try {
    const providerId = req.params.id;
    const { start_date, end_date } = req.query;

    if (USE_SUPABASE) {
      try {
        const analytics = await Provider.getProviderAnalytics(providerId, { start_date, end_date });
        return res.json({
          success: true,
          data: analytics
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let ordersQuery = `
      SELECT * FROM purchase_orders
      WHERE provider_id = ? AND status != 'cancelled'
    `;
    const ordersParams = [providerId];

    if (start_date) {
      ordersQuery += ` AND order_date >= ?`;
      ordersParams.push(start_date);
    }

    if (end_date) {
      ordersQuery += ` AND order_date <= ?`;
      ordersParams.push(end_date);
    }

    const orders = await allAsync(ordersQuery, ordersParams);

    // Get payments
    let paymentsQuery = `
      SELECT * FROM provider_payments
      WHERE provider_id = ?
    `;
    const paymentsParams = [providerId];

    if (start_date) {
      paymentsQuery += ` AND payment_date >= ?`;
      paymentsParams.push(start_date);
    }

    if (end_date) {
      paymentsQuery += ` AND payment_date <= ?`;
      paymentsParams.push(end_date);
    }

    const payments = await allAsync(paymentsQuery, paymentsParams);

    // Calculate analytics
    const totalPurchases = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = totalPurchases - totalPayments;
    const averageOrderValue = orders.length > 0 ? totalPurchases / orders.length : 0;

    // Group orders by status
    const ordersByStatus = {};
    orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_purchases: totalPurchases,
        total_payments: totalPayments,
        pending_amount: pendingAmount,
        order_count: orders.length,
        average_order_value: averageOrderValue,
        payment_count: payments.length,
        orders_by_status: ordersByStatus
      }
    });
  } catch (error) {
    console.error('Error getting provider analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis del proveedor',
      error: error.message
    });
  }
});

// Get spending report
router.get('/reports/spending', async (req, res) => {
  try {
    const { start_date, end_date, store_id } = req.query;
    const filters = { start_date, end_date, store_id };

    if (USE_SUPABASE) {
      try {
        const report = await Provider.getSpendingReport(filters);
        return res.json({
          success: true,
          data: report
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT po.*, p.name as provider_name, p.category_id
      FROM purchase_orders po
      INNER JOIN providers p ON po.provider_id = p.id
      WHERE po.status != 'cancelled'
    `;
    const params = [];

    if (start_date) {
      query += ` AND po.order_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND po.order_date <= ?`;
      params.push(end_date);
    }

    if (store_id) {
      query += ` AND po.store_id = ?`;
      params.push(store_id);
    }

    const orders = await allAsync(query, params);

    // Group by provider
    const providerSpending = {};
    orders.forEach(order => {
      const providerId = order.provider_id;
      if (!providerSpending[providerId]) {
        providerSpending[providerId] = {
          provider_name: order.provider_name,
          category_id: order.category_id,
          total_orders: 0,
          total_spending: 0
        };
      }
      providerSpending[providerId].total_orders += 1;
      providerSpending[providerId].total_spending += order.total_amount;
    });

    const totalSpending = orders.reduce((sum, order) => sum + order.total_amount, 0);

    res.json({
      success: true,
      data: {
        total_spending: totalSpending,
        total_orders: orders.length,
        by_provider: Object.values(providerSpending).sort((a, b) => b.total_spending - a.total_spending)
      }
    });
  } catch (error) {
    console.error('Error getting spending report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de gastos',
      error: error.message
    });
  }
});

// Get product price history
router.get('/providers/:providerId/products/:productId/price-history', async (req, res) => {
  try {
    const { providerId, productId } = req.params;

    if (USE_SUPABASE) {
      try {
        const priceHistory = await Provider.getProductPriceHistory(providerId, productId);
        return res.json({
          success: true,
          data: priceHistory
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const priceHistory = await allAsync(
      `SELECT poi.unit_cost as purchase_price, po.order_date, po.order_number
       FROM purchase_order_items poi
       INNER JOIN purchase_orders po ON poi.order_id = po.id
       WHERE po.provider_id = ? AND poi.product_id = ? AND po.status IN ('received', 'partial')
       ORDER BY po.order_date DESC
       LIMIT 20`,
      [providerId, productId]
    );

    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de precios',
      error: error.message
    });
  }
});

// Get preferred providers for a product
router.get('/products/:productId/preferred-providers', async (req, res) => {
  try {
    const productId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const providers = await Provider.getPreferredProviders(productId);
        return res.json({
          success: true,
          data: providers
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const providers = await allAsync(
      `SELECT pp.*, p.name as provider_name, p.email, p.phone
       FROM provider_products pp
       INNER JOIN providers p ON pp.provider_id = p.id
       WHERE pp.product_id = ? AND pp.is_preferred = 1 AND p.is_active = 1
       ORDER BY pp.unit_cost ASC`,
      [productId]
    );

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching preferred providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores preferidos',
      error: error.message
    });
  }
});

module.exports = router;