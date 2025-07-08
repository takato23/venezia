const db = require('../database/supabase-db');

class Customer {
  static async create(data) {
    const { name, phone, email, address, notes } = data;
    
    try {
      const customer = await db.insert('customers', {
        name,
        phone,
        email,
        address,
        notes,
        loyalty_points: 0
      });
      
      return customer;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  static async getAll(filters = {}) {
    const conditions = {};
    if (filters.active !== undefined) conditions.active = filters.active;
    
    const customers = await db.select('customers', conditions, {
      orderBy: 'created_at',
      ascending: false
    });
    
    return customers;
  }

  static async getById(id) {
    return await db.selectOne('customers', { id });
  }

  static async getByEmail(email) {
    return await db.selectOne('customers', { email });
  }

  static async update(id, data) {
    const { name, phone, email, address, notes } = data;
    
    try {
      const customer = await db.update('customers', id, {
        name,
        phone,
        email,
        address,
        notes
      });
      
      return customer;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  static async delete(id) {
    // Check if customer has sales
    const salesCount = await db.count('sales', { customer_id: id });
    
    if (salesCount > 0) {
      throw new Error('No se puede eliminar un cliente con ventas registradas');
    }
    
    return await db.delete('customers', id);
  }

  static async addLoyaltyPoints(id, points) {
    const customer = await this.getById(id);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    
    const newPoints = (customer.loyalty_points || 0) + points;
    
    return await db.update('customers', id, {
      loyalty_points: newPoints
    });
  }

  static async search(query) {
    // Note: For complex search, you might want to create a database function
    // For now, we'll fetch all and filter in memory (not ideal for large datasets)
    const allCustomers = await db.select('customers');
    
    const searchTerm = query.toLowerCase();
    return allCustomers.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm)
    );
  }

  static async getTopCustomers(limit = 10) {
    // Get customers with their total purchases
    // This would be better as a database view or function
    const customers = await db.select('customers', {}, {
      orderBy: 'loyalty_points',
      ascending: false,
      limit
    });
    
    // Get purchase totals for each customer
    const customersWithTotals = await Promise.all(
      customers.map(async (customer) => {
        const { data: sales } = await db.supabase
          .from('sales')
          .select('total')
          .eq('customer_id', customer.id);
        
        const totalPurchases = sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;
        const purchaseCount = sales?.length || 0;
        
        return {
          ...customer,
          total_purchases: totalPurchases,
          purchase_count: purchaseCount
        };
      })
    );
    
    return customersWithTotals;
  }
}

module.exports = Customer;