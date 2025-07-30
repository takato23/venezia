const { supabase } = require('../config/supabase');

class ReportsService {
  // Helper function to parse date ranges
  parseDateRange(period, customStart, customEnd) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = today;
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() - 1);
        break;
      case 'last_7_days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last_30_days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'custom':
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error('Invalid period specified');
    }

    return { startDate, endDate };
  }

  // Sales Reports
  async getSalesReport({ period, startDate, endDate, storeId }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      let query = supabase
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
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data: sales, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate metrics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Payment method breakdown
      const paymentMethods = sales.reduce((acc, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
        return acc;
      }, {});

      // Top products
      const productSales = {};
      sales.forEach(sale => {
        sale.sale_items.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              product: item.product,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.product_id].quantity += item.quantity;
          productSales[item.product_id].revenue += item.subtotal;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Hourly distribution
      const hourlyDistribution = Array(24).fill(0);
      sales.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        hourlyDistribution[hour]++;
      });

      return {
        success: true,
        data: {
          period: { start, end },
          summary: {
            totalSales,
            totalRevenue,
            averageOrderValue,
            uniqueCustomers: new Set(sales.map(s => s.customer_id).filter(Boolean)).size
          },
          sales,
          paymentMethods,
          topProducts,
          hourlyDistribution
        }
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      return { success: false, error: error.message };
    }
  }

  // Inventory Report
  async getInventoryReport({ storeId, lowStockOnly = false }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*),
          recipe:recipes(
            *,
            recipe_ingredients(
              *,
              ingredient:ingredients(*)
            )
          )
        `)
        .eq('active', true);

      const { data: products, error } = await query;

      if (error) throw error;

      // Get ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*');

      if (ingredientsError) throw ingredientsError;

      // Filter low stock if requested
      let inventoryItems = [
        ...products.map(p => ({
          type: 'product',
          id: p.id,
          name: p.name,
          category: p.category?.name || 'Uncategorized',
          current_stock: p.current_stock || 0,
          minimum_stock: p.stock || 0,
          unit: 'units',
          value: (p.current_stock || 0) * p.price,
          status: (p.current_stock || 0) <= (p.stock || 0) ? 'low' : 'normal'
        })),
        ...ingredients.map(i => ({
          type: 'ingredient',
          id: i.id,
          name: i.name,
          category: i.category || 'Ingredients',
          current_stock: i.quantity,
          minimum_stock: i.minimum_stock,
          unit: i.unit,
          value: i.quantity * (i.cost_per_unit || 0),
          status: i.quantity <= i.minimum_stock ? 'low' : 'normal'
        }))
      ];

      if (lowStockOnly) {
        inventoryItems = inventoryItems.filter(item => item.status === 'low');
      }

      const totalValue = inventoryItems.reduce((sum, item) => sum + item.value, 0);
      const lowStockCount = inventoryItems.filter(item => item.status === 'low').length;

      return {
        success: true,
        data: {
          summary: {
            totalItems: inventoryItems.length,
            totalValue,
            lowStockCount,
            categories: [...new Set(inventoryItems.map(i => i.category))].length
          },
          items: inventoryItems,
          byCategory: inventoryItems.reduce((acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = {
                items: [],
                totalValue: 0,
                count: 0
              };
            }
            acc[item.category].items.push(item);
            acc[item.category].totalValue += item.value;
            acc[item.category].count++;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return { success: false, error: error.message };
    }
  }

  // Production Report
  async getProductionReport({ period, startDate, endDate }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // Get all sales in the period
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            product:products(
              *,
              recipe:recipes(
                *,
                recipe_ingredients(
                  *,
                  ingredient:ingredients(*)
                )
              )
            )
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      if (salesError) throw salesError;

      // Calculate production metrics
      const productionData = {};
      const ingredientUsage = {};

      sales.forEach(sale => {
        sale.sale_items.forEach(item => {
          const product = item.product;
          if (!productionData[product.id]) {
            productionData[product.id] = {
              product,
              quantityProduced: 0,
              revenue: 0,
              cost: 0
            };
          }
          
          productionData[product.id].quantityProduced += item.quantity;
          productionData[product.id].revenue += item.subtotal;

          // Calculate ingredient usage and costs
          if (product.recipe && product.recipe[0]) {
            const recipe = product.recipe[0];
            recipe.recipe_ingredients.forEach(ri => {
              const ingredient = ri.ingredient;
              const usedQuantity = (ri.quantity * item.quantity) / (recipe.yield_amount || 1);
              
              if (!ingredientUsage[ingredient.id]) {
                ingredientUsage[ingredient.id] = {
                  ingredient,
                  totalUsed: 0,
                  totalCost: 0
                };
              }
              
              ingredientUsage[ingredient.id].totalUsed += usedQuantity;
              ingredientUsage[ingredient.id].totalCost += usedQuantity * (ingredient.cost_per_unit || 0);
              
              productionData[product.id].cost += usedQuantity * (ingredient.cost_per_unit || 0);
            });
          }
        });
      });

      // Calculate efficiency metrics
      const productionSummary = Object.values(productionData);
      const totalRevenue = productionSummary.reduce((sum, p) => sum + p.revenue, 0);
      const totalCost = productionSummary.reduce((sum, p) => sum + p.cost, 0);
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      return {
        success: true,
        data: {
          period: { start, end },
          summary: {
            totalRevenue,
            totalCost,
            grossProfit: totalRevenue - totalCost,
            grossMargin,
            totalProductsProduced: productionSummary.reduce((sum, p) => sum + p.quantityProduced, 0)
          },
          productionByProduct: productionSummary.sort((a, b) => b.revenue - a.revenue),
          ingredientUsage: Object.values(ingredientUsage).sort((a, b) => b.totalCost - a.totalCost),
          profitability: productionSummary.map(p => ({
            ...p,
            profit: p.revenue - p.cost,
            margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0
          })).sort((a, b) => b.margin - a.margin)
        }
      };
    } catch (error) {
      console.error('Error generating production report:', error);
      return { success: false, error: error.message };
    }
  }

  // Financial Report
  async getFinancialReport({ period, startDate, endDate, storeId }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // Get sales data
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      if (storeId) {
        salesQuery = salesQuery.eq('store_id', storeId);
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Get cash flow data
      let cashFlowQuery = supabase
        .from('cash_flow')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (storeId) {
        cashFlowQuery = cashFlowQuery.eq('store_id', storeId);
      }

      const { data: cashFlows, error: cashFlowError } = await cashFlowQuery;
      if (cashFlowError) throw cashFlowError;

      // Calculate financial metrics
      const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const expenses = cashFlows
        .filter(cf => cf.type === 'expense')
        .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
      
      const netIncome = revenue - expenses;
      const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

      // Daily breakdown
      const dailyBreakdown = {};
      const dateFormatter = (date) => new Date(date).toISOString().split('T')[0];

      sales.forEach(sale => {
        const date = dateFormatter(sale.created_at);
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { revenue: 0, expenses: 0, transactions: 0 };
        }
        dailyBreakdown[date].revenue += sale.total;
        dailyBreakdown[date].transactions++;
      });

      cashFlows.forEach(cf => {
        if (cf.type === 'expense') {
          const date = dateFormatter(cf.created_at);
          if (!dailyBreakdown[date]) {
            dailyBreakdown[date] = { revenue: 0, expenses: 0, transactions: 0 };
          }
          dailyBreakdown[date].expenses += Math.abs(cf.amount);
        }
      });

      // Cash flow summary
      const cashFlowSummary = {
        opening: cashFlows
          .filter(cf => cf.type === 'opening')
          .reduce((sum, cf) => sum + cf.amount, 0),
        closing: cashFlows
          .filter(cf => cf.type === 'closing')
          .reduce((sum, cf) => sum + cf.amount, 0),
        income: cashFlows
          .filter(cf => cf.type === 'income')
          .reduce((sum, cf) => sum + cf.amount, 0),
        expenses
      };

      return {
        success: true,
        data: {
          period: { start, end },
          summary: {
            revenue,
            expenses,
            netIncome,
            profitMargin,
            averageTransactionValue: sales.length > 0 ? revenue / sales.length : 0,
            totalTransactions: sales.length
          },
          cashFlow: cashFlowSummary,
          dailyBreakdown: Object.entries(dailyBreakdown)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)),
          expenseCategories: cashFlows
            .filter(cf => cf.type === 'expense')
            .reduce((acc, cf) => {
              const category = cf.description || 'Other';
              if (!acc[category]) acc[category] = 0;
              acc[category] += Math.abs(cf.amount);
              return acc;
            }, {})
        }
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return { success: false, error: error.message };
    }
  }

  // Delivery Report
  async getDeliveryReport({ period, startDate, endDate }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // For now, delivery functionality is handled separately
      // Return a placeholder report structure
      // In production, this would query a deliveries table
      
      return {
        success: true,
        data: {
          period: { start, end },
          summary: {
            totalDeliveries: 0,
            completedDeliveries: 0,
            canceledDeliveries: 0,
            pendingDeliveries: 0,
            completionRate: 0,
            averageDeliveryTime: 0,
            totalRevenue: 0
          },
          driverPerformance: [],
          zoneAnalysis: {},
          hourlyDistribution: Array(24).fill(0),
          recentDeliveries: [],
          message: 'Delivery reporting requires deliveries table setup'
        }
      };
    } catch (error) {
      console.error('Error generating delivery report:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method for hourly distribution
  getHourlyDistribution(items) {
    const distribution = Array(24).fill(0);
    items.forEach(item => {
      const hour = new Date(item.created_at).getHours();
      distribution[hour]++;
    });
    return distribution;
  }

  // Customer Analytics
  async getCustomerAnalytics({ period, startDate, endDate }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // Get customers with their orders
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          *,
          sales(
            id,
            total,
            created_at,
            status
          )
        `);

      if (error) throw error;

      // Filter sales by period
      const customersWithPeriodSales = customers.map(customer => {
        const periodSales = customer.sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= start && saleDate <= end && sale.status === 'completed';
        });

        return {
          ...customer,
          periodSales,
          periodOrders: periodSales.length,
          periodRevenue: periodSales.reduce((sum, sale) => sum + sale.total, 0)
        };
      });

      // Calculate metrics
      const activeCustomers = customersWithPeriodSales.filter(c => c.periodOrders > 0);
      const newCustomers = customers.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate >= start && createdDate <= end;
      });

      // Top customers
      const topCustomers = activeCustomers
        .sort((a, b) => b.periodRevenue - a.periodRevenue)
        .slice(0, 10);

      // Customer segments
      const segments = {
        vip: activeCustomers.filter(c => c.periodRevenue > 1000).length,
        regular: activeCustomers.filter(c => c.periodRevenue > 100 && c.periodRevenue <= 1000).length,
        occasional: activeCustomers.filter(c => c.periodRevenue <= 100).length
      };

      return {
        success: true,
        data: {
          period: { start, end },
          summary: {
            totalCustomers: customers.length,
            activeCustomers: activeCustomers.length,
            newCustomers: newCustomers.length,
            averageOrderValue: activeCustomers.length > 0 
              ? activeCustomers.reduce((sum, c) => sum + c.periodRevenue, 0) / activeCustomers.reduce((sum, c) => sum + c.periodOrders, 0)
              : 0,
            totalRevenue: activeCustomers.reduce((sum, c) => sum + c.periodRevenue, 0)
          },
          topCustomers,
          segments,
          customerRetention: this.calculateRetentionRate(customers, start, end)
        }
      };
    } catch (error) {
      console.error('Error generating customer analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate customer retention rate
  calculateRetentionRate(customers, startDate, endDate) {
    const monthlyRetention = {};
    
    customers.forEach(customer => {
      if (customer.sales && customer.sales.length > 0) {
        const firstOrderDate = new Date(customer.sales[0].created_at);
        const lastOrderDate = new Date(customer.sales[customer.sales.length - 1].created_at);
        
        const monthsSinceFirst = Math.floor((lastOrderDate - firstOrderDate) / (30 * 24 * 60 * 60 * 1000));
        
        if (!monthlyRetention[monthsSinceFirst]) {
          monthlyRetention[monthsSinceFirst] = 0;
        }
        monthlyRetention[monthsSinceFirst]++;
      }
    });

    return monthlyRetention;
  }

  // Comparative Analysis
  async getComparativeAnalysis({ period, storeId }) {
    try {
      const now = new Date();
      const { startDate: currentStart, endDate: currentEnd } = this.parseDateRange(period);
      
      // Calculate previous period
      const periodLength = currentEnd - currentStart;
      const previousStart = new Date(currentStart.getTime() - periodLength);
      const previousEnd = new Date(currentStart.getTime() - 1);

      // Get current period data
      const currentSales = await this.getSalesReport({ 
        period: 'custom', 
        startDate: currentStart, 
        endDate: currentEnd, 
        storeId 
      });

      // Get previous period data
      const previousSales = await this.getSalesReport({ 
        period: 'custom', 
        startDate: previousStart, 
        endDate: previousEnd, 
        storeId 
      });

      if (!currentSales.success || !previousSales.success) {
        throw new Error('Failed to fetch comparison data');
      }

      const current = currentSales.data.summary;
      const previous = previousSales.data.summary;

      // Calculate growth rates
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        success: true,
        data: {
          currentPeriod: { start: currentStart, end: currentEnd },
          previousPeriod: { start: previousStart, end: previousEnd },
          comparison: {
            revenue: {
              current: current.totalRevenue,
              previous: previous.totalRevenue,
              growth: calculateGrowth(current.totalRevenue, previous.totalRevenue)
            },
            orders: {
              current: current.totalSales,
              previous: previous.totalSales,
              growth: calculateGrowth(current.totalSales, previous.totalSales)
            },
            averageOrderValue: {
              current: current.averageOrderValue,
              previous: previous.averageOrderValue,
              growth: calculateGrowth(current.averageOrderValue, previous.averageOrderValue)
            },
            customers: {
              current: current.uniqueCustomers,
              previous: previous.uniqueCustomers,
              growth: calculateGrowth(current.uniqueCustomers, previous.uniqueCustomers)
            }
          }
        }
      };
    } catch (error) {
      console.error('Error generating comparative analysis:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ReportsService();