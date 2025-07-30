const { runAsync, getAsync, allAsync } = require('../database/db');

class Customer {
  static async getAll() {
    return await allAsync('SELECT * FROM customers ORDER BY name');
  }

  static async getById(id) {
    return await getAsync('SELECT * FROM customers WHERE id = ?', [id]);
  }

  static async create(data) {
    const { name, phone, email, address, notes } = data;
    const result = await runAsync(
      `INSERT INTO customers (name, phone, email, address, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email, address, notes]
    );
    return this.getById(result.id);
  }

  static async update(id, data) {
    const { name, phone, email, address, notes } = data;
    await runAsync(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, notes = ?
       WHERE id = ?`,
      [name, phone, email, address, notes, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    return await runAsync('DELETE FROM customers WHERE id = ?', [id]);
  }

  static async updateStats(customerId, orderTotal) {
    await runAsync(
      `UPDATE customers 
       SET total_orders = total_orders + 1,
           total_spent = total_spent + ?,
           last_order_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderTotal, customerId]
    );
  }

  static async search(query) {
    return await allAsync(
      `SELECT * FROM customers 
       WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
       ORDER BY name`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
  }
}

module.exports = Customer;