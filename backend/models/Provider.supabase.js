const { supabase } = require('../config/supabase');

class Provider {
  // ==================== PROVIDER CRUD ====================
  
  static async create(providerData) {
    const {
      name,
      contact_person,
      phone,
      email,
      address,
      cuit,
      category_id,
      notes,
      payment_terms,
      credit_limit = 0,
      store_id
    } = providerData;

    try {
      const { data: provider, error } = await supabase
        .from('providers')
        .insert({
          name,
          contact_person,
          phone,
          email,
          address,
          cuit,
          category_id,
          notes,
          payment_terms,
          credit_limit,
          store_id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        provider
      };

    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data: provider, error } = await supabase
        .from('providers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        provider
      };

    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data: provider, error } = await supabase
        .from('providers_with_balance')
        .select(`
          *,
          provider_products(
            id,
            product_id,
            product_code,
            product_name,
            unit_cost,
            lead_time_days,
            minimum_order_quantity,
            is_preferred
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return provider;

    } catch (error) {
      console.error('Error fetching provider:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('providers_with_balance')
        .select('*')
        .order('name', { ascending: true });

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      const { data: providers, error } = await query;

      if (error) throw error;

      return providers;

    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Check if provider has purchase orders
      const { data: orders, error: checkError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('provider_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (orders && orders.length > 0) {
        // Soft delete - just deactivate
        return await this.update(id, { is_active: false });
      }

      // Hard delete if no orders
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Provider deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================

  static async getCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('provider_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return categories;

    } catch (error) {
      console.error('Error fetching provider categories:', error);
      throw error;
    }
  }

  static async createCategory(categoryData) {
    try {
      const { data: category, error } = await supabase
        .from('provider_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        category
      };

    } catch (error) {
      console.error('Error creating provider category:', error);
      throw error;
    }
  }

  // ==================== PRODUCT ASSOCIATIONS ====================

  static async addProduct(providerId, productData) {
    try {
      const { data: providerProduct, error } = await supabase
        .from('provider_products')
        .insert({
          provider_id: providerId,
          product_id: productData.product_id,
          product_code: productData.product_code,
          product_name: productData.product_name,
          unit_cost: productData.unit_cost,
          lead_time_days: productData.lead_time_days || 0,
          minimum_order_quantity: productData.minimum_order_quantity || 1,
          is_preferred: productData.is_preferred || false,
          notes: productData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        provider_product: providerProduct
      };

    } catch (error) {
      console.error('Error adding provider product:', error);
      throw error;
    }
  }

  static async updateProduct(providerId, productId, updateData) {
    try {
      const { data: providerProduct, error } = await supabase
        .from('provider_products')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('provider_id', providerId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        provider_product: providerProduct
      };

    } catch (error) {
      console.error('Error updating provider product:', error);
      throw error;
    }
  }

  static async removeProduct(providerId, productId) {
    try {
      const { error } = await supabase
        .from('provider_products')
        .delete()
        .eq('provider_id', providerId)
        .eq('product_id', productId);

      if (error) throw error;

      return {
        success: true,
        message: 'Product removed from provider successfully'
      };

    } catch (error) {
      console.error('Error removing provider product:', error);
      throw error;
    }
  }

  static async getProducts(providerId) {
    try {
      const { data: products, error } = await supabase
        .from('provider_products')
        .select('*')
        .eq('provider_id', providerId)
        .order('product_name', { ascending: true });

      if (error) throw error;

      return products;

    } catch (error) {
      console.error('Error fetching provider products:', error);
      throw error;
    }
  }

  // ==================== PURCHASE ORDER MANAGEMENT ====================

  static async createPurchaseOrder(orderData) {
    try {
      // Generate order number
      const { data: orderNumber } = await supabase
        .rpc('generate_purchase_order_number');

      const { data: order, error } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          provider_id: orderData.provider_id,
          store_id: orderData.store_id,
          expected_delivery_date: orderData.expected_delivery_date,
          status: orderData.status || 'draft',
          subtotal: 0, // Will be calculated by trigger
          tax_amount: orderData.tax_amount || 0,
          shipping_cost: orderData.shipping_cost || 0,
          discount_amount: orderData.discount_amount || 0,
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add order items if provided
      if (orderData.items && orderData.items.length > 0) {
        const items = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          notes: item.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Fetch complete order with items
      const completeOrder = await this.getPurchaseOrderById(order.id);

      return {
        success: true,
        order: completeOrder
      };

    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  static async updatePurchaseOrder(orderId, updateData) {
    try {
      const { items, ...orderData } = updateData;

      // Update order
      const { data: order, error } = await supabase
        .from('purchase_orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('order_id', orderId);

        // Insert new items
        if (items.length > 0) {
          const newItems = items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            unit_cost: item.unit_cost,
            notes: item.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(newItems);

          if (itemsError) throw itemsError;
        }
      }

      return {
        success: true,
        order
      };

    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  static async getPurchaseOrderById(orderId) {
    try {
      const { data: order, error } = await supabase
        .from('purchase_orders_detailed')
        .select(`
          *,
          purchase_order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return order;

    } catch (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }
  }

  static async getPurchaseOrders(filters = {}) {
    try {
      let query = supabase
        .from('purchase_orders_detailed')
        .select('*')
        .order('order_date', { ascending: false });

      // Apply filters
      if (filters.provider_id) {
        query = query.eq('provider_id', filters.provider_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters.start_date) {
        query = query.gte('order_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('order_date', filters.end_date);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      return orders;

    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  static async deletePurchaseOrder(orderId) {
    try {
      // Only allow deletion of draft orders
      const { data: order, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      if (order.status !== 'draft') {
        throw new Error('Only draft orders can be deleted');
      }

      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      return {
        success: true,
        message: 'Purchase order deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // ==================== ORDER PROCESSING ====================

  static async receivePurchaseOrder(orderId, receivedItems) {
    try {
      const { data: result, error } = await supabase
        .rpc('receive_purchase_order', {
          order_id_param: orderId,
          received_items: receivedItems
        });

      if (error) throw error;

      return result;

    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  }

  static async checkCreditLimit(providerId, orderAmount) {
    try {
      const { data: result, error } = await supabase
        .rpc('check_provider_credit_limit', {
          provider_id_param: providerId,
          new_order_amount: orderAmount
        });

      if (error) throw error;

      return result;

    } catch (error) {
      console.error('Error checking credit limit:', error);
      throw error;
    }
  }

  // ==================== PAYMENT TRACKING ====================

  static async recordPayment(paymentData) {
    try {
      const { data: payment, error } = await supabase
        .from('provider_payments')
        .insert({
          provider_id: paymentData.provider_id,
          purchase_order_id: paymentData.purchase_order_id,
          payment_date: paymentData.payment_date || new Date().toISOString(),
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          reference_number: paymentData.reference_number,
          notes: paymentData.notes,
          created_at: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        payment
      };

    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  static async getPayments(filters = {}) {
    try {
      let query = supabase
        .from('provider_payments')
        .select(`
          *,
          provider:providers(name),
          purchase_order:purchase_orders(order_number)
        `)
        .order('payment_date', { ascending: false });

      if (filters.provider_id) {
        query = query.eq('provider_id', filters.provider_id);
      }

      if (filters.purchase_order_id) {
        query = query.eq('purchase_order_id', filters.purchase_order_id);
      }

      if (filters.start_date) {
        query = query.gte('payment_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('payment_date', filters.end_date);
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      return payments;

    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTS ====================

  static async getProviderAnalytics(providerId, dateRange = {}) {
    try {
      // Get purchase history
      const ordersQuery = supabase
        .from('purchase_orders')
        .select('*')
        .eq('provider_id', providerId)
        .neq('status', 'cancelled');

      if (dateRange.start_date) {
        ordersQuery.gte('order_date', dateRange.start_date);
      }

      if (dateRange.end_date) {
        ordersQuery.lte('order_date', dateRange.end_date);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      // Get payment history
      const paymentsQuery = supabase
        .from('provider_payments')
        .select('*')
        .eq('provider_id', providerId);

      if (dateRange.start_date) {
        paymentsQuery.gte('payment_date', dateRange.start_date);
      }

      if (dateRange.end_date) {
        paymentsQuery.lte('payment_date', dateRange.end_date);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      // Calculate analytics
      const totalPurchases = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      const pendingAmount = totalPurchases - totalPayments;
      const averageOrderValue = orders.length > 0 ? totalPurchases / orders.length : 0;

      // Get most purchased products
      const { data: topProducts, error: productsError } = await supabase
        .from('purchase_order_items')
        .select('product_name, product_id')
        .in('order_id', orders.map(o => o.id))
        .select('product_name, product_id, quantity, unit_cost');

      if (productsError) throw productsError;

      // Aggregate product data
      const productSummary = {};
      topProducts.forEach(item => {
        if (!productSummary[item.product_id]) {
          productSummary[item.product_id] = {
            product_name: item.product_name,
            total_quantity: 0,
            total_value: 0
          };
        }
        productSummary[item.product_id].total_quantity += parseFloat(item.quantity);
        productSummary[item.product_id].total_value += parseFloat(item.quantity) * parseFloat(item.unit_cost);
      });

      const topProductsList = Object.values(productSummary)
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10);

      return {
        total_purchases: totalPurchases,
        total_payments: totalPayments,
        pending_amount: pendingAmount,
        order_count: orders.length,
        average_order_value: averageOrderValue,
        payment_count: payments.length,
        top_products: topProductsList,
        orders_by_status: this.groupByStatus(orders),
        monthly_purchases: this.groupByMonth(orders, 'order_date', 'total_amount')
      };

    } catch (error) {
      console.error('Error getting provider analytics:', error);
      throw error;
    }
  }

  static async getSpendingReport(filters = {}) {
    try {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          provider:providers(name, category_id),
          purchase_order_items(quantity, unit_cost)
        `)
        .neq('status', 'cancelled');

      if (filters.start_date) {
        query = query.gte('order_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('order_date', filters.end_date);
      }

      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Group by provider
      const providerSpending = {};
      orders.forEach(order => {
        const providerId = order.provider_id;
        if (!providerSpending[providerId]) {
          providerSpending[providerId] = {
            provider_name: order.provider.name,
            category_id: order.provider.category_id,
            total_orders: 0,
            total_spending: 0
          };
        }
        providerSpending[providerId].total_orders += 1;
        providerSpending[providerId].total_spending += parseFloat(order.total_amount || 0);
      });

      // Get category spending
      const categorySpending = {};
      Object.values(providerSpending).forEach(provider => {
        const categoryId = provider.category_id || 'uncategorized';
        if (!categorySpending[categoryId]) {
          categorySpending[categoryId] = {
            total_providers: 0,
            total_spending: 0
          };
        }
        categorySpending[categoryId].total_providers += 1;
        categorySpending[categoryId].total_spending += provider.total_spending;
      });

      return {
        total_spending: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
        total_orders: orders.length,
        by_provider: Object.values(providerSpending).sort((a, b) => b.total_spending - a.total_spending),
        by_category: categorySpending,
        monthly_trend: this.groupByMonth(orders, 'order_date', 'total_amount')
      };

    } catch (error) {
      console.error('Error getting spending report:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  static groupByStatus(orders) {
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return statusCount;
  }

  static groupByMonth(records, dateField, amountField) {
    const monthlyData = {};
    
    records.forEach(record => {
      const date = new Date(record[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          count: 0,
          total: 0
        };
      }
      
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].total += parseFloat(record[amountField] || 0);
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ==================== PRODUCT PRICE HISTORY ====================

  static async getProductPriceHistory(providerId, productId) {
    try {
      const { data: priceHistory, error } = await supabase
        .from('provider_product_price_history')
        .select('*')
        .eq('provider_id', providerId)
        .eq('product_id', productId)
        .order('order_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      return priceHistory;

    } catch (error) {
      console.error('Error fetching product price history:', error);
      throw error;
    }
  }

  static async getPreferredProviders(productId) {
    try {
      const { data: providers, error } = await supabase
        .from('provider_products')
        .select(`
          *,
          provider:providers(*)
        `)
        .eq('product_id', productId)
        .eq('is_preferred', true)
        .order('unit_cost', { ascending: true });

      if (error) throw error;

      return providers;

    } catch (error) {
      console.error('Error fetching preferred providers:', error);
      throw error;
    }
  }
}

module.exports = Provider;