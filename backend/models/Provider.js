const { runAsync, getAsync, allAsync } = require('../database/db');

class Provider {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        p.*,
        pc.name as category_name,
        COUNT(DISTINCT i.id) as ingredient_count,
        COALESCE(SUM(i.current_stock * i.cost_per_unit), 0) as total_inventory_value
      FROM providers p
      LEFT JOIN provider_categories pc ON p.category_id = pc.id
      LEFT JOIN ingredients i ON p.id = i.provider_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }

    query += ' GROUP BY p.id ORDER BY p.name';
    
    try {
      return await allAsync(query, params) || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      const provider = await getAsync(`
        SELECT 
          p.*,
          pc.name as category_name
        FROM providers p
        LEFT JOIN provider_categories pc ON p.category_id = pc.id
        WHERE p.id = ?
      `, [id]);
      
      if (provider) {
        // Get ingredients from this provider
        provider.ingredients = await allAsync(
          'SELECT id, name, unit, cost_per_unit FROM ingredients WHERE provider_id = ? ORDER BY name',
          [id]
        ) || [];
      }
      
      return provider;
    } catch (error) {
      console.error('Error fetching provider by id:', error);
      return null;
    }
  }

  static async create(data) {
    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      cuit,
      category_id, 
      notes,
      status = 'active'
    } = data;
    
    try {
      const result = await runAsync(
        `INSERT INTO providers (name, contact_person, phone, email, address, cuit, category_id, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, contact_person || null, phone || null, email || null, address || null, 
         cuit || null, category_id || null, notes || null, status]
      );
      
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  static async update(id, data) {
    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      cuit,
      category_id, 
      notes,
      status
    } = data;
    
    try {
      await runAsync(
        `UPDATE providers 
         SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, 
             cuit = ?, category_id = ?, notes = ?, status = ?
         WHERE id = ?`,
        [name, contact_person || null, phone || null, email || null, address || null,
         cuit || null, category_id || null, notes || null, status || 'active', id]
      );
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Check if provider has ingredients
      const ingredientCount = await getAsync(
        'SELECT COUNT(*) as count FROM ingredients WHERE provider_id = ?',
        [id]
      );
      
      if (ingredientCount && ingredientCount.count > 0) {
        throw new Error('Cannot delete provider with associated ingredients');
      }
      
      await runAsync('DELETE FROM providers WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }

  static async getCategories() {
    try {
      return await allAsync('SELECT * FROM provider_categories ORDER BY name') || [];
    } catch (error) {
      console.error('Error fetching provider categories:', error);
      return [];
    }
  }

  static async getByIngredient(ingredientId) {
    try {
      return await getAsync(`
        SELECT p.* 
        FROM providers p
        JOIN ingredients i ON p.id = i.provider_id
        WHERE i.id = ?
      `, [ingredientId]);
    } catch (error) {
      console.error('Error fetching provider by ingredient:', error);
      return null;
    }
  }
}

module.exports = Provider;