const cron = require('node-cron');
const { getNotificationService } = require('./notificationService.instance');
const { models, USE_SUPABASE } = require('../config/database');
const { allAsync } = USE_SUPABASE ? { allAsync: async () => [] } : require('../database/db');

class ScheduledNotifications {
  constructor() {
    this.jobs = [];
  }
  
  init() {
    console.log('📅 Initializing scheduled notifications...');
    
    // Daily sales report at 10 PM
    this.scheduleJob('0 22 * * *', this.sendDailySalesReport.bind(this), 'Daily Sales Report');
    
    // Check expiring products every day at 8 AM
    this.scheduleJob('0 8 * * *', this.checkExpiringProducts.bind(this), 'Expiring Products Check');
    
    // Weekly inventory report on Mondays at 9 AM
    this.scheduleJob('0 9 * * 1', this.sendWeeklyInventoryReport.bind(this), 'Weekly Inventory Report');
    
    // Check sales milestones every hour
    this.scheduleJob('0 * * * *', this.checkSalesMilestones.bind(this), 'Sales Milestones Check');
    
    // Clean up old notifications every night at 3 AM
    this.scheduleJob('0 3 * * *', this.cleanupOldNotifications.bind(this), 'Notification Cleanup');
  }
  
  scheduleJob(cronPattern, handler, name) {
    const job = cron.schedule(cronPattern, async () => {
      console.log(`🔔 Running scheduled job: ${name}`);
      try {
        await handler();
      } catch (error) {
        console.error(`Error in scheduled job ${name}:`, error);
      }
    });
    
    this.jobs.push({ name, job });
    console.log(`✅ Scheduled job registered: ${name}`);
  }
  
  async sendDailySalesReport() {
    const notificationService = getNotificationService();
    if (!notificationService) return;
    
    try {
      // Get today's sales data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let salesData;
      
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());
        
        if (error) throw error;
        salesData = data || [];
      } else {
        salesData = await allAsync(`
          SELECT * FROM sales 
          WHERE created_at >= ? AND created_at < ?
        `, [today.toISOString(), tomorrow.toISOString()]);
      }
      
      // Calculate totals
      const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const orderCount = salesData.length;
      const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
      
      // Get yesterday's total for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let yesterdayData;
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('sales')
          .select('total')
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString());
        
        if (error) throw error;
        yesterdayData = data || [];
      } else {
        yesterdayData = await allAsync(`
          SELECT total FROM sales 
          WHERE created_at >= ? AND created_at < ?
        `, [yesterday.toISOString(), today.toISOString()]);
      }
      
      const yesterdayTotal = yesterdayData.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const growthPercentage = yesterdayTotal > 0 ? 
        ((totalSales - yesterdayTotal) / yesterdayTotal * 100).toFixed(1) : 0;
      
      // Send daily report notification
      await notificationService.createNotification('daily_report', {
        date: today.toLocaleDateString('es-AR'),
        total_sales: totalSales,
        order_count: orderCount,
        average_order: averageOrderValue.toFixed(2),
        growth: growthPercentage,
        comparison: growthPercentage > 0 ? 'increase' : 'decrease'
      }, {
        role: 'admin',
        priority: 'low'
      });
      
      // Check if it's a record day
      if (totalSales > 0) {
        const recordCheck = await this.checkDailyRecord(totalSales);
        if (recordCheck.isRecord) {
          await notificationService.notifySalesMilestone(
            notificationService.TYPES.RECORD_SALES,
            {
              amount: totalSales,
              previous_record: recordCheck.previousRecord,
              date: today.toLocaleDateString('es-AR'),
              store_id: 1
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending daily sales report:', error);
    }
  }
  
  async checkExpiringProducts() {
    const notificationService = getNotificationService();
    if (!notificationService) return;
    
    try {
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7); // 7 days warning
      
      let expiringProducts;
      
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('ingredient_batches')
          .select('*, ingredient:ingredients(*)')
          .gte('expiration_date', today.toISOString())
          .lte('expiration_date', warningDate.toISOString())
          .eq('status', 'active')
          .order('expiration_date', { ascending: true });
        
        if (error) throw error;
        expiringProducts = data || [];
      } else {
        expiringProducts = await allAsync(`
          SELECT ib.*, i.name as ingredient_name
          FROM ingredient_batches ib
          JOIN ingredients i ON ib.ingredient_id = i.id
          WHERE ib.expiration_date >= ? 
          AND ib.expiration_date <= ?
          AND ib.status = 'active'
          ORDER BY ib.expiration_date ASC
        `, [today.toISOString(), warningDate.toISOString()]);
      }
      
      // Send notifications for each expiring product
      for (const batch of expiringProducts) {
        const expirationDate = new Date(batch.expiration_date);
        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
        
        const productName = batch.ingredient?.name || batch.ingredient_name || 'Producto';
        
        await notificationService.notifyExpirationWarning(
          {
            id: batch.ingredient_id || batch.id,
            name: productName,
            expiration_date: batch.expiration_date,
            store_id: batch.store_id || 1
          },
          daysUntilExpiration
        );
      }
    } catch (error) {
      console.error('Error checking expiring products:', error);
    }
  }
  
  async sendWeeklyInventoryReport() {
    const notificationService = getNotificationService();
    if (!notificationService) return;
    
    try {
      // Get inventory statistics
      let lowStockCount, outOfStockCount, totalProducts;
      
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        
        // Count low stock products
        const { count: lowStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('current_stock', 10)
          .gt('current_stock', 0)
          .eq('active', true);
        
        // Count out of stock products
        const { count: outOfStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('current_stock', 0)
          .eq('active', true);
        
        // Count total active products
        const { count: total } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);
        
        lowStockCount = lowStock || 0;
        outOfStockCount = outOfStock || 0;
        totalProducts = total || 0;
      } else {
        const stats = await allAsync(`
          SELECT 
            COUNT(CASE WHEN current_stock <= 10 AND current_stock > 0 THEN 1 END) as low_stock,
            COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock,
            COUNT(*) as total
          FROM products
          WHERE active = 1
        `);
        
        lowStockCount = stats[0].low_stock || 0;
        outOfStockCount = stats[0].out_of_stock || 0;
        totalProducts = stats[0].total || 0;
      }
      
      // Send weekly inventory report
      await notificationService.createNotification('weekly_inventory_report', {
        total_products: totalProducts,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        health_percentage: totalProducts > 0 ? 
          (((totalProducts - lowStockCount - outOfStockCount) / totalProducts) * 100).toFixed(1) : 100
      }, {
        role: 'admin',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending weekly inventory report:', error);
    }
  }
  
  async checkSalesMilestones() {
    const notificationService = getNotificationService();
    if (!notificationService) return;
    
    try {
      // Check hourly sales milestones
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      let hourlySales;
      
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('sales')
          .select('total')
          .gte('created_at', hourAgo.toISOString())
          .lte('created_at', now.toISOString());
        
        if (error) throw error;
        hourlySales = data || [];
      } else {
        hourlySales = await allAsync(`
          SELECT total FROM sales 
          WHERE created_at >= ? AND created_at <= ?
        `, [hourAgo.toISOString(), now.toISOString()]);
      }
      
      const hourlyTotal = hourlySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      // Check for significant milestones
      const milestones = [
        { amount: 100000, message: '¡$100,000 en ventas en la última hora!' },
        { amount: 50000, message: '¡$50,000 en ventas en la última hora!' },
        { amount: 25000, message: '¡$25,000 en ventas en la última hora!' }
      ];
      
      for (const milestone of milestones) {
        if (hourlyTotal >= milestone.amount) {
          // Check if we've already sent this milestone today
          const milestoneKey = `hourly_milestone_${milestone.amount}_${now.toDateString()}`;
          
          // Simple in-memory check to avoid duplicate notifications
          if (!this.sentMilestones) this.sentMilestones = new Set();
          
          if (!this.sentMilestones.has(milestoneKey)) {
            this.sentMilestones.add(milestoneKey);
            
            await notificationService.notifySalesMilestone(
              notificationService.TYPES.SALES_MILESTONE,
              {
                message: milestone.message,
                amount: hourlyTotal,
                store_id: 1
              }
            );
            
            break; // Only send the highest milestone
          }
        }
      }
    } catch (error) {
      console.error('Error checking sales milestones:', error);
    }
  }
  
  async checkDailyRecord(todayTotal) {
    try {
      let previousRecord = 0;
      
      if (USE_SUPABASE) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('sales')
          .select('created_at, total')
          .order('total', { ascending: false })
          .limit(100);
        
        if (!error && data) {
          // Group by date and find max
          const dailyTotals = {};
          data.forEach(sale => {
            const date = new Date(sale.created_at).toDateString();
            dailyTotals[date] = (dailyTotals[date] || 0) + sale.total;
          });
          
          previousRecord = Math.max(...Object.values(dailyTotals), 0);
        }
      } else {
        const records = await allAsync(`
          SELECT DATE(created_at) as date, SUM(total) as daily_total
          FROM sales
          GROUP BY DATE(created_at)
          ORDER BY daily_total DESC
          LIMIT 1
        `);
        
        if (records.length > 0) {
          previousRecord = records[0].daily_total || 0;
        }
      }
      
      return {
        isRecord: todayTotal > previousRecord,
        previousRecord
      };
    } catch (error) {
      console.error('Error checking daily record:', error);
      return { isRecord: false, previousRecord: 0 };
    }
  }
  
  async cleanupOldNotifications() {
    const notificationService = getNotificationService();
    if (!notificationService) return;
    
    try {
      await notificationService.cleanupOldNotifications(30); // Keep 30 days
      console.log('✅ Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
  
  stop() {
    // Stop all scheduled jobs
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`⏹️ Stopped scheduled job: ${name}`);
    });
    
    this.jobs = [];
    console.log('📅 Scheduled notifications stopped');
  }
}

module.exports = ScheduledNotifications;