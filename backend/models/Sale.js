const { runAsync, getAsync, allAsync } = require('../database/db');

class Sale {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        u.name as user_name,
        st.name as store_name,
        COUNT(si.id) as item_count,
        SUM(si.quantity) as total_items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.store_id) {
      query += ' AND s.store_id = ?';
      params.push(filters.store_id);
    }

    if (filters.user_id) {
      query += ' AND s.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(filters.customer_id);
    }

    if (filters.payment_method) {
      query += ' AND s.payment_method = ?';
      params.push(filters.payment_method);
    }

    if (filters.status) {
      query += ' AND s.status = ?';
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ' AND DATE(s.created_at) >= DATE(?)';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(s.created_at) <= DATE(?)';
      params.push(filters.date_to);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    try {
      return await allAsync(query, params) || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      const sale = await getAsync(`
        SELECT 
          s.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          u.name as user_name,
          st.name as store_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.id = ?
      `, [id]);
      
      if (sale) {
        // Get sale items
        sale.items = await allAsync(`
          SELECT 
            si.*,
            p.name as product_name,
            p.description as product_description
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
          ORDER BY si.id
        `, [id]) || [];
      }
      
      return sale;
    } catch (error) {
      console.error('Error fetching sale by id:', error);
      return null;
    }
  }

  static async create(data) {
    const { 
      customer_id, 
      store_id, 
      user_id, 
      total, 
      payment_method = 'cash',
      status = 'completed',
      notes,
      items = []
    } = data;
    
    try {
      // Start transaction
      await runAsync('BEGIN TRANSACTION');
      
      // Create sale
      const saleResult = await runAsync(
        `INSERT INTO sales (customer_id, store_id, user_id, total, payment_method, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [customer_id || null, store_id || 1, user_id || 1, total, payment_method, status, notes || null]
      );
      
      const saleId = saleResult.lastID;
      
      // Create sale items
      for (const item of items) {
        await runAsync(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.product_id, item.quantity, item.price, item.subtotal || (item.quantity * item.price)]
        );
        
        // Update product stock
        if (status === 'completed') {
          await runAsync(
            'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }
      
      // Commit transaction
      await runAsync('COMMIT');
      
      return await this.getById(saleId);
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  static async update(id, data) {
    const { 
      customer_id, 
      store_id, 
      user_id, 
      total, 
      payment_method,
      status,
      notes
    } = data;
    
    try {
      await runAsync(
        `UPDATE sales 
         SET customer_id = ?, store_id = ?, user_id = ?, total = ?, 
             payment_method = ?, status = ?, notes = ?
         WHERE id = ?`,
        [customer_id || null, store_id, user_id, total, payment_method, status, notes || null, id]
      );
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Start transaction
      await runAsync('BEGIN TRANSACTION');
      
      // Get sale items to restore stock
      const items = await allAsync('SELECT * FROM sale_items WHERE sale_id = ?', [id]);
      
      // Restore product stock
      for (const item of items) {
        await runAsync(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      
      // Delete sale items
      await runAsync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
      
      // Delete sale
      await runAsync('DELETE FROM sales WHERE id = ?', [id]);
      
      // Commit transaction
      await runAsync('COMMIT');
      
      return { success: true };
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  static async getDailySummary(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const summary = await getAsync(`
        SELECT 
          COUNT(DISTINCT s.id) as total_sales,
          COALESCE(SUM(s.total), 0) as total_revenue,
          COUNT(DISTINCT s.customer_id) as unique_customers,
          COALESCE(AVG(s.total), 0) as average_ticket
        FROM sales s
        WHERE DATE(s.created_at) = DATE(?)
        AND s.status = 'completed'
      `, [dateStr]);
      
      // Get payment method breakdown
      summary.payment_methods = await allAsync(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(total) as total
        FROM sales
        WHERE DATE(created_at) = DATE(?)
        AND status = 'completed'
        GROUP BY payment_method
      `, [dateStr]) || [];
      
      // Get top products
      summary.top_products = await allAsync(`
        SELECT 
          p.name,
          SUM(si.quantity) as quantity_sold,
          SUM(si.subtotal) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.created_at) = DATE(?)
        AND s.status = 'completed'
        GROUP BY p.id
        ORDER BY quantity_sold DESC
        LIMIT 5
      `, [dateStr]) || [];
      
      return summary;
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      return null;
    }
  }
}

module.exports = Sale;