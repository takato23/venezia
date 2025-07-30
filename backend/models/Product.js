const { runAsync, getAsync, allAsync } = require('../database/db');

class Product {
  static async getAll(filters = {}) {
    let query = 'SELECT p.*, pc.name as category_name FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE 1=1';
    const params = [];

    if (filters.context) {
      query += ' AND p.context = ?';
      params.push(filters.context);
    }

    if (filters.category) {
      query += ' AND p.category_id = ?';
      params.push(filters.category);
    }

    if (filters.active !== undefined) {
      query += ' AND p.active = ?';
      params.push(filters.active ? 1 : 0);
    }

    query += ' ORDER BY p.name';
    return await allAsync(query, params);
  }

  static async getById(id) {
    return await getAsync(
      'SELECT p.*, pc.name as category_name FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.id = ?',
      [id]
    );
  }

  static async create(data) {
    const { name, description, price, stock, category_id, context } = data;
    const result = await runAsync(
      `INSERT INTO products (name, description, price, stock, current_stock, category_id, context) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', price, stock || 0, stock || 0, category_id || null, context || 'general']
    );
    return this.getById(result.id);
  }

  static async update(id, data) {
    const { name, description, price, stock, category_id, context } = data;
    await runAsync(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, stock = ?, current_stock = ?, category_id = ?, context = ?
       WHERE id = ?`,
      [name, description || '', price, stock || 0, stock || 0, category_id || null, context || 'general', id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    return await runAsync('DELETE FROM products WHERE id = ?', [id]);
  }

  static async updateStock(id, quantity, operation = 'set') {
    const product = await this.getById(id);
    if (!product) throw new Error('Producto no encontrado');

    let newStock;
    if (operation === 'set') {
      newStock = quantity;
    } else if (operation === 'add') {
      newStock = product.current_stock + quantity;
    } else if (operation === 'subtract') {
      newStock = product.current_stock - quantity;
      if (newStock < 0) throw new Error('Stock insuficiente');
    }

    await runAsync(
      'UPDATE products SET current_stock = ? WHERE id = ?',
      [newStock, id]
    );
    return this.getById(id);
  }

  static async getLowStock(threshold = 10) {
    return await allAsync(
      `SELECT p.*, pc.name as category_name 
       FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id 
       WHERE p.current_stock <= ? AND p.active = 1
       ORDER BY p.current_stock ASC`,
      [threshold]
    );
  }

  static async search(query) {
    return await allAsync(
      `SELECT p.*, pc.name as category_name 
       FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id 
       WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.active = 1
       ORDER BY p.name`,
      [`%${query}%`, `%${query}%`]
    );
  }
}

module.exports = Product;