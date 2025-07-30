const { db } = require('../database/db');

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

  // Helper to promisify database queries
  dbAsync = {
    all: (sql, params) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    get: (sql, params) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  };

  // Sales Reports
  async getSalesReport({ period, startDate, endDate, storeId }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // Build query
      let salesQuery = `
        SELECT s.*, 
               c.name as customer_name, c.phone as customer_phone,
               st.name as store_name,
               u.name as user_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.created_at >= ? AND s.created_at <= ?
          AND s.status = 'completed'
      `;
      const params = [start.toISOString(), end.toISOString()];

      if (storeId) {
        salesQuery += ' AND s.store_id = ?';
        params.push(storeId);
      }

      salesQuery += ' ORDER BY s.created_at DESC';

      const sales = await this.dbAsync.all(salesQuery, params);

      // Get sale items for each sale
      for (const sale of sales) {
        const items = await this.dbAsync.all(`
          SELECT si.*, p.name as product_name, p.price
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
        `, [sale.id]);
        sale.sale_items = items;
      }

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
              product_id: item.product_id,
              product_name: item.product_name,
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
      // Get products
      let productsQuery = `
        SELECT p.*, pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.active = 1
      `;

      const products = await this.dbAsync.all(productsQuery);

      // Get ingredients
      const ingredients = await this.dbAsync.all('SELECT * FROM ingredients');

      // Build inventory items
      let inventoryItems = [
        ...products.map(p => ({
          type: 'product',
          id: p.id,
          name: p.name,
          category: p.category_name || 'Uncategorized',
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
      
      // Get sales with items
      const salesQuery = `
        SELECT s.*, si.*, p.id as product_id, p.name as product_name, p.price
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ? AND s.created_at <= ?
          AND s.status = 'completed'
      `;

      const salesItems = await this.dbAsync.all(salesQuery, [start.toISOString(), end.toISOString()]);

      // Get recipes and ingredients
      const recipes = await this.dbAsync.all(`
        SELECT r.*, ri.*, i.name as ingredient_name, i.cost_per_unit
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
      `);

      // Build recipe map
      const recipeMap = {};
      recipes.forEach(row => {
        if (!recipeMap[row.product_id]) {
          recipeMap[row.product_id] = {
            id: row.id,
            name: row.name,
            yield_amount: row.yield_amount,
            ingredients: []
          };
        }
        recipeMap[row.product_id].ingredients.push({
          ingredient_id: row.ingredient_id,
          ingredient_name: row.ingredient_name,
          quantity: row.quantity,
          cost_per_unit: row.cost_per_unit || 0
        });
      });

      // Calculate production metrics
      const productionData = {};
      const ingredientUsage = {};

      salesItems.forEach(item => {
        if (!productionData[item.product_id]) {
          productionData[item.product_id] = {
            product_id: item.product_id,
            product_name: item.product_name,
            quantityProduced: 0,
            revenue: 0,
            cost: 0
          };
        }
        
        productionData[item.product_id].quantityProduced += item.quantity;
        productionData[item.product_id].revenue += item.subtotal;

        // Calculate ingredient usage and costs
        const recipe = recipeMap[item.product_id];
        if (recipe) {
          recipe.ingredients.forEach(ingredient => {
            const usedQuantity = (ingredient.quantity * item.quantity) / (recipe.yield_amount || 1);
            
            if (!ingredientUsage[ingredient.ingredient_id]) {
              ingredientUsage[ingredient.ingredient_id] = {
                ingredient_name: ingredient.ingredient_name,
                totalUsed: 0,
                totalCost: 0
              };
            }
            
            ingredientUsage[ingredient.ingredient_id].totalUsed += usedQuantity;
            ingredientUsage[ingredient.ingredient_id].totalCost += usedQuantity * ingredient.cost_per_unit;
            
            productionData[item.product_id].cost += usedQuantity * ingredient.cost_per_unit;
          });
        }
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
      let salesQuery = `
        SELECT * FROM sales
        WHERE created_at >= ? AND created_at <= ?
          AND status = 'completed'
      `;
      const salesParams = [start.toISOString(), end.toISOString()];

      if (storeId) {
        salesQuery += ' AND store_id = ?';
        salesParams.push(storeId);
      }

      const sales = await this.dbAsync.all(salesQuery, salesParams);

      // Get cash flow data
      let cashFlowQuery = `
        SELECT * FROM cash_flow
        WHERE created_at >= ? AND created_at <= ?
      `;
      const cashFlowParams = [start.toISOString(), end.toISOString()];

      if (storeId) {
        cashFlowQuery += ' AND store_id = ?';
        cashFlowParams.push(storeId);
      }

      const cashFlows = await this.dbAsync.all(cashFlowQuery, cashFlowParams);

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

  // Customer Analytics
  async getCustomerAnalytics({ period, startDate, endDate }) {
    try {
      const { startDate: start, endDate: end } = this.parseDateRange(period, startDate, endDate);
      
      // Get all customers
      const customers = await this.dbAsync.all('SELECT * FROM customers');

      // Get sales for each customer in the period
      const salesQuery = `
        SELECT customer_id, COUNT(*) as order_count, SUM(total) as total_revenue
        FROM sales
        WHERE created_at >= ? AND created_at <= ?
          AND status = 'completed'
          AND customer_id IS NOT NULL
        GROUP BY customer_id
      `;

      const customerSales = await this.dbAsync.all(salesQuery, [start.toISOString(), end.toISOString()]);

      // Create customer map
      const customerMap = {};
      customers.forEach(c => {
        customerMap[c.id] = { ...c, periodOrders: 0, periodRevenue: 0 };
      });

      customerSales.forEach(cs => {
        if (customerMap[cs.customer_id]) {
          customerMap[cs.customer_id].periodOrders = cs.order_count;
          customerMap[cs.customer_id].periodRevenue = cs.total_revenue;
        }
      });

      const customersWithPeriodData = Object.values(customerMap);

      // Calculate metrics
      const activeCustomers = customersWithPeriodData.filter(c => c.periodOrders > 0);
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
          customerRetention: {} // Simplified for SQLite
        }
      };
    } catch (error) {
      console.error('Error generating customer analytics:', error);
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