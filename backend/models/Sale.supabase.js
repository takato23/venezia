const { supabase } = require('../config/supabase');

class Sale {
  static async create(saleData) {
    const { 
      customer_id, 
      store_id, 
      user_id, 
      total, 
      payment_method = 'cash',
      sale_type = 'regular',
      items = []
    } = saleData;

    try {
      // Start a transaction-like operation
      // 1. Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id,
          store_id: store_id || 1,
          user_id: user_id || 1,
          total,
          payment_method,
          sale_type,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Create sale items and update stock
      const saleItems = [];
      const stockUpdates = [];

      for (const item of items) {
        // Add to sale items
        const saleItem = {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price || 0,
          subtotal: (item.price || 0) * item.quantity
        };
        saleItems.push(saleItem);

        // Prepare stock update
        stockUpdates.push({
          id: item.product_id,
          quantity_to_deduct: item.quantity
        });
      }

      // Insert all sale items
      if (saleItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      // Update product stock
      for (const update of stockUpdates) {
        // First get current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', update.id)
          .single();

        if (fetchError) throw fetchError;

        // Update stock
        const newStock = (product.current_stock || 0) - update.quantity_to_deduct;
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      // 3. Update customer stats if applicable
      if (customer_id) {
        const { data: customer, error: customerFetchError } = await supabase
          .from('customers')
          .select('total_orders, total_spent')
          .eq('id', customer_id)
          .single();

        if (!customerFetchError && customer) {
          const { error: customerUpdateError } = await supabase
            .from('customers')
            .update({
              total_orders: (customer.total_orders || 0) + 1,
              total_spent: (customer.total_spent || 0) + total,
              last_order_date: new Date().toISOString()
            })
            .eq('id', customer_id);

          if (customerUpdateError) {
            console.error('Error updating customer stats:', customerUpdateError);
          }
        }
      }

      // 4. Add to cash flow if payment is cash
      if (payment_method === 'cash') {
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            user_id: user_id || 1,
            store_id: store_id || 1,
            type: 'income',
            amount: total,
            description: `Venta #${sale.id}`,
            reference_id: sale.id,
            created_at: new Date().toISOString()
          });

        if (cashFlowError) {
          console.error('Error creating cash flow entry:', cashFlowError);
        }
      }

      return {
        success: true,
        sale,
        receipt_number: `VEN-${sale.id.toString().padStart(6, '0')}`
      };

    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  static async getRecent(limit = 5) {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name),
          sale_items(
            quantity,
            product:products(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format the response
      const formattedSales = sales.map(sale => ({
        ...sale,
        customer_name: sale.customer?.name || 'Sin cliente',
        items_count: sale.sale_items?.length || 0,
        items_preview: sale.sale_items
          ?.map(item => `${item.product?.name || 'Producto'} x${item.quantity}`)
          .join(', ') || ''
      }));

      return formattedSales;

    } catch (error) {
      console.error('Error fetching recent sales:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data: sale, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          store:stores(*),
          user:users(id, name, email),
          sale_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return sale;

    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  }

  static async getTodayStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: sales, error } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', todayISO);

      if (error) throw error;

      const stats = {
        sales_count: sales.length,
        sales_total: sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        avg_ticket: sales.length > 0 
          ? sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length 
          : 0
      };

      return stats;

    } catch (error) {
      console.error('Error fetching today stats:', error);
      throw error;
    }
  }

  static async getSalesByPeriod(startDate, endDate) {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return sales;

    } catch (error) {
      console.error('Error fetching sales by period:', error);
      throw error;
    }
  }

  static async getProductSalesStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This is a complex query that might need to be done in parts
      const { data: salesItems, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          subtotal,
          product:products(id, name, price),
          sale:sales(created_at)
        `)
        .gte('sale.created_at', startDate.toISOString());

      if (error) throw error;

      // Group by product
      const productStats = {};
      salesItems.forEach(item => {
        if (item.product) {
          const productId = item.product.id;
          if (!productStats[productId]) {
            productStats[productId] = {
              id: productId,
              name: item.product.name,
              price: item.product.price,
              units_sold: 0,
              revenue: 0,
              orders_count: 0
            };
          }
          productStats[productId].units_sold += item.quantity;
          productStats[productId].revenue += item.subtotal;
          productStats[productId].orders_count += 1;
        }
      });

      // Convert to array and sort by units sold
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.units_sold - a.units_sold)
        .slice(0, 10);

      return topProducts;

    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  }

  static async createDeliveryOrder(orderData) {
    const {
      items,
      customer,
      payment_method,
      total,
      delivery_address,
      delivery_phone,
      estimated_time = '30-45 minutos',
      notes = ''
    } = orderData;

    try {
      // Create or find customer
      let customerId = null;
      if (customer && customer.name) {
        // Check if customer exists
        const { data: existingCustomers, error: searchError } = await supabase
          .from('customers')
          .select('id')
          .or(`name.eq.${customer.name},phone.eq.${delivery_phone}`)
          .limit(1);

        if (searchError) throw searchError;

        if (existingCustomers && existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
          
          // Update customer info
          await supabase
            .from('customers')
            .update({
              address: delivery_address,
              phone: delivery_phone
            })
            .eq('id', customerId);
        } else {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              phone: delivery_phone,
              email: customer.email || '',
              address: delivery_address
            })
            .select()
            .single();

          if (createError) throw createError;
          customerId = newCustomer.id;
        }
      }

      // Create sale with delivery type
      const saleResult = await this.create({
        customer_id: customerId,
        store_id: 1,
        user_id: 1,
        total,
        payment_method,
        sale_type: 'delivery',
        items
      });

      // Create delivery record
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          sale_id: saleResult.sale.id,
          customer_name: customer?.name || 'Cliente sin nombre',
          customer_phone: delivery_phone,
          address: delivery_address,
          total_amount: total,
          status: 'pending',
          estimated_time,
          notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      return {
        success: true,
        sale: saleResult.sale,
        delivery,
        receipt_number: `DEL-${saleResult.sale.id.toString().padStart(6, '0')}`
      };

    } catch (error) {
      console.error('Error creating delivery order:', error);
      throw error;
    }
  }
}

module.exports = Sale;