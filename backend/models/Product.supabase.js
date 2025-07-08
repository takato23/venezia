const db = require('../database/supabase-db');

class Product {
  static async create(data) {
    const { name, description, category_id, price, cost, min_stock, unit, active } = data;
    
    try {
      const product = await db.insert('products', {
        name,
        description,
        category_id,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        current_stock: 0,
        min_stock: min_stock || 10,
        unit: unit || 'unidad',
        active: active !== false
      });
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(filters = {}) {
    const conditions = {};
    
    if (filters.active !== undefined) {
      conditions.active = filters.active === 'true' || filters.active === true;
    }
    
    if (filters.category_id) {
      conditions.category_id = filters.category_id;
    }
    
    const products = await db.select('products', conditions, {
      orderBy: 'name',
      ascending: true
    });
    
    // Get categories for each product
    const productWithCategories = await Promise.all(
      products.map(async (product) => {
        if (product.category_id) {
          const category = await db.selectOne('product_categories', { id: product.category_id });
          return { ...product, category };
        }
        return product;
      })
    );
    
    return productWithCategories;
  }

  static async getById(id) {
    const product = await db.selectOne('products', { id });
    
    if (product && product.category_id) {
      const category = await db.selectOne('product_categories', { id: product.category_id });
      return { ...product, category };
    }
    
    return product;
  }

  static async update(id, data) {
    const { name, description, category_id, price, cost, min_stock, unit, active } = data;
    
    const updates = {
      name,
      description,
      category_id,
      price: price ? parseFloat(price) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      min_stock: min_stock !== undefined ? parseInt(min_stock) : undefined,
      unit,
      active: active !== undefined ? active : undefined
    };
    
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) delete updates[key];
    });
    
    return await db.update('products', id, updates);
  }

  static async delete(id) {
    // Check if product has sales
    const salesCount = await db.count('sale_items', { product_id: id });
    
    if (salesCount > 0) {
      throw new Error('No se puede eliminar un producto con ventas registradas');
    }
    
    // Check if product has recipes
    const recipesCount = await db.count('recipes', { product_id: id });
    
    if (recipesCount > 0) {
      throw new Error('No se puede eliminar un producto con recetas asociadas');
    }
    
    return await db.delete('products', id);
  }

  static async updateStock(id, quantity, type = 'absolute') {
    const product = await this.getById(id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    let newStock;
    if (type === 'absolute') {
      newStock = quantity;
    } else if (type === 'increment') {
      newStock = (product.current_stock || 0) + quantity;
    } else if (type === 'decrement') {
      newStock = (product.current_stock || 0) - quantity;
    }
    
    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }
    
    const updated = await db.update('products', id, {
      current_stock: newStock
    });
    
    // Check if low stock alert needed
    if (newStock < product.min_stock) {
      await this.createLowStockAlert(product, newStock);
    }
    
    return updated;
  }

  static async createLowStockAlert(product, currentStock) {
    const severity = currentStock <= 5 ? 'critical' : 'warning';
    
    await db.insert('system_alerts', {
      type: 'stock',
      severity,
      title: `Stock ${severity === 'critical' ? 'Crítico' : 'Bajo'}: ${product.name}`,
      message: `Quedan solo ${currentStock} unidades`,
      data: { product_id: product.id, current_stock: currentStock, min_stock: product.min_stock }
    });
  }

  static async getLowStock() {
    const { data: products, error } = await db.supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .lt('current_stock', 'min_stock')
      .eq('active', true)
      .order('current_stock', { ascending: true });
    
    if (error) throw error;
    return products;
  }

  static async search(query) {
    const { data: products, error } = await db.supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    return products;
  }

  static async getCategories() {
    return await db.select('product_categories', {}, {
      orderBy: 'display_order',
      ascending: true
    });
  }

  static async createCategory(data) {
    const { name, description, display_order } = data;
    
    return await db.insert('product_categories', {
      name,
      description,
      display_order: display_order || 0
    });
  }

  static async updateCategory(id, data) {
    const { name, description, display_order } = data;
    
    return await db.update('product_categories', id, {
      name,
      description,
      display_order
    });
  }

  static async deleteCategory(id) {
    // Check if category has products
    const productsCount = await db.count('products', { category_id: id });
    
    if (productsCount > 0) {
      throw new Error('No se puede eliminar una categoría con productos asociados');
    }
    
    return await db.delete('product_categories', id);
  }
}

module.exports = Product;