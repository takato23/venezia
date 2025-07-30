const { runAsync, getAsync, allAsync } = require('../database/db');

class Ingredient {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        i.*,
        p.name as provider_name,
        p.phone as provider_phone,
        CASE 
          WHEN i.quantity <= i.minimum_stock THEN 'low'
          WHEN i.expiry_date IS NOT NULL AND DATE(i.expiry_date) <= DATE('now', '+7 days') THEN 'expiring'
          ELSE 'ok'
        END as stock_status
      FROM ingredients i
      LEFT JOIN providers p ON i.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
      query += ' AND i.category = ?';
      params.push(filters.category);
    }

    if (filters.provider_id) {
      query += ' AND i.provider_id = ?';
      params.push(filters.provider_id);
    }

    if (filters.low_stock) {
      query += ' AND i.quantity <= i.minimum_stock';
    }

    if (filters.expiring_soon) {
      query += ' AND i.expiry_date IS NOT NULL AND DATE(i.expiry_date) <= DATE("now", "+7 days")';
    }

    query += ' ORDER BY i.name';
    
    try {
      return await allAsync(query, params) || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      const ingredient = await getAsync(`
        SELECT 
          i.*,
          p.name as provider_name,
          p.phone as provider_phone,
          p.email as provider_email
        FROM ingredients i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = ?
      `, [id]);
      
      if (ingredient) {
        // Get recent transactions
        ingredient.recent_transactions = await allAsync(`
          SELECT 
            it.*,
            u.name as user_name
          FROM inventory_transactions it
          LEFT JOIN users u ON it.user_id = u.id
          WHERE it.ingredient_id = ?
          ORDER BY it.created_at DESC
          LIMIT 10
        `, [id]) || [];
        
        // Get usage in recipes
        ingredient.used_in_recipes = await allAsync(`
          SELECT 
            r.id,
            r.name,
            ri.quantity as required_quantity,
            ri.unit
          FROM recipe_ingredients ri
          JOIN recipes r ON ri.recipe_id = r.id
          WHERE ri.ingredient_id = ?
          ORDER BY r.name
        `, [id]) || [];
      }
      
      return ingredient;
    } catch (error) {
      console.error('Error fetching ingredient by id:', error);
      return null;
    }
  }

  static async create(data) {
    const { 
      name, 
      quantity = 0, 
      unit, 
      minimum_stock = 0,
      cost_per_unit = 0,
      provider_id,
      expiry_date,
      category,
      supplier // Legacy field, maps to provider_id
    } = data;
    
    try {
      const result = await runAsync(
        `INSERT INTO ingredients (name, quantity, unit, minimum_stock, cost_per_unit, provider_id, supplier, expiry_date, category, current_stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, quantity, unit, minimum_stock, cost_per_unit, 
         provider_id || null, supplier || null, expiry_date || null, category || null, quantity]
      );
      
      // Log initial stock transaction
      await this.logTransaction({
        ingredient_id: result.lastID,
        type: 'adjustment',
        quantity: quantity,
        reason: 'Initial stock',
        user_id: 1
      });
      
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  }

  static async update(id, data) {
    const { 
      name, 
      quantity, 
      unit, 
      minimum_stock,
      cost_per_unit,
      provider_id,
      expiry_date,
      category,
      supplier
    } = data;
    
    try {
      // Get current quantity for transaction logging
      const current = await getAsync('SELECT quantity FROM ingredients WHERE id = ?', [id]);
      
      await runAsync(
        `UPDATE ingredients 
         SET name = ?, quantity = ?, unit = ?, minimum_stock = ?, cost_per_unit = ?,
             provider_id = ?, supplier = ?, expiry_date = ?, category = ?, 
             current_stock = ?, last_updated = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, quantity, unit, minimum_stock || 0, cost_per_unit || 0,
         provider_id || null, supplier || null, expiry_date || null, category || null, 
         quantity, id]
      );
      
      // Log quantity change if different
      if (current && current.quantity !== quantity) {
        const difference = quantity - current.quantity;
        await this.logTransaction({
          ingredient_id: id,
          type: 'adjustment',
          quantity: difference,
          reason: 'Manual adjustment',
          user_id: 1
        });
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Check if ingredient is used in recipes
      const recipeCount = await getAsync(
        'SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = ?',
        [id]
      );
      
      if (recipeCount && recipeCount.count > 0) {
        throw new Error('Cannot delete ingredient used in recipes');
      }
      
      await runAsync('DELETE FROM ingredients WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }

  static async updateStock(id, quantity, reason = 'Manual update', userId = 1) {
    try {
      await runAsync('BEGIN TRANSACTION');
      
      // Update ingredient stock
      await runAsync(
        'UPDATE ingredients SET quantity = quantity + ?, current_stock = current_stock + ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, quantity, id]
      );
      
      // Log transaction
      await this.logTransaction({
        ingredient_id: id,
        type: quantity > 0 ? 'purchase' : 'usage',
        quantity: quantity,
        reason: reason,
        user_id: userId
      });
      
      await runAsync('COMMIT');
      
      return await this.getById(id);
    } catch (error) {
      await runAsync('ROLLBACK');
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  static async logTransaction(data) {
    const { ingredient_id, type, quantity, reason, user_id } = data;
    
    try {
      await runAsync(
        `INSERT INTO inventory_transactions (ingredient_id, type, quantity, reason, user_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [ingredient_id, type, quantity, reason || null, user_id || 1]
      );
    } catch (error) {
      console.error('Error logging transaction:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  static async getLowStock() {
    try {
      return await allAsync(`
        SELECT 
          i.*,
          p.name as provider_name,
          p.phone as provider_phone,
          (i.minimum_stock - i.quantity) as quantity_needed
        FROM ingredients i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.quantity <= i.minimum_stock
        ORDER BY (i.quantity / NULLIF(i.minimum_stock, 0))
      `) || [];
    } catch (error) {
      console.error('Error fetching low stock:', error);
      return [];
    }
  }

  static async getExpiringIngredients(days = 7) {
    try {
      return await allAsync(`
        SELECT 
          i.*,
          p.name as provider_name,
          julianday(i.expiry_date) - julianday('now') as days_until_expiry
        FROM ingredients i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.expiry_date IS NOT NULL 
        AND DATE(i.expiry_date) <= DATE('now', '+' || ? || ' days')
        ORDER BY i.expiry_date
      `, [days]) || [];
    } catch (error) {
      console.error('Error fetching expiring ingredients:', error);
      return [];
    }
  }

  static async getCategories() {
    try {
      const categories = await allAsync(
        'SELECT DISTINCT category FROM ingredients WHERE category IS NOT NULL ORDER BY category'
      ) || [];
      return categories.map(c => c.category);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}

module.exports = Ingredient;