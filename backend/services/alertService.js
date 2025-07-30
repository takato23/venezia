const cron = require('node-cron');
const { USE_SUPABASE } = require('../config/database');
const { allAsync } = USE_SUPABASE ? { allAsync: async () => [] } : require('../database/db');

// Only import supabase-db if we're actually using Supabase
let db = null;
if (USE_SUPABASE) {
  try {
    db = require('../database/supabase-db');
  } catch (error) {
    console.error('Failed to load Supabase database:', error);
  }
}

const { getNotificationService } = require('./notificationService.instance');

class AlertService {
  constructor(io) {
    this.io = io;
    this.alerts = new Map();
    this.thresholds = {
      lowStock: 10,
      criticalStock: 5,
      expiryDays: 7
    };
  }

  // Initialize alert monitoring
  init() {
    console.log('🚨 Iniciando servicio de alertas...');
    
    // Check alerts every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkAllAlerts();
    });

    // Initial check
    this.checkAllAlerts();
  }

  // Check all alert conditions
  async checkAllAlerts() {
    try {
      await Promise.all([
        this.checkLowStock(),
        this.checkExpiringIngredients(),
        this.checkCashFlow(),
        this.checkSalesAnomalies()
      ]);
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // Check for low stock products
  async checkLowStock() {
    try {
      let products = [];
      
      if (USE_SUPABASE && db) {
        const { supabase } = require('../config/supabase');
        const { data, error } = await supabase
          .from('products')
          .select('*, category:product_categories(name)')
          .eq('active', true)
          .lte('current_stock', this.thresholds.lowStock)
          .order('current_stock', { ascending: true });
        
        if (error) throw error;
        products = data || [];
      } else {
        products = await allAsync(`
          SELECT p.*, pc.name as category_name
          FROM products p
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          WHERE p.active = 1 AND p.current_stock <= ?
          ORDER BY p.current_stock ASC
        `, [this.thresholds.lowStock]);
      }

      const newAlerts = [];

      for (const product of products) {
        const alertKey = `stock_${product.id}`;
        const severity = product.current_stock <= this.thresholds.criticalStock ? 'critical' : 'warning';
        
        const alert = {
          id: alertKey,
          type: 'stock',
          severity,
          title: `Stock ${severity === 'critical' ? 'Crítico' : 'Bajo'}: ${product.name}`,
          message: `Quedan solo ${product.current_stock} unidades`,
          data: product,
          timestamp: new Date().toISOString()
        };

        // Check if alert is new or severity changed
        const existingAlert = this.alerts.get(alertKey);
        if (!existingAlert || existingAlert.severity !== severity) {
          this.alerts.set(alertKey, alert);
          newAlerts.push(alert);
        }
      }

      // Emit new alerts and send notifications
      if (newAlerts.length > 0) {
        this.io.emit('alerts:stock', newAlerts);
        
        // Send notifications for new alerts
        const notificationService = getNotificationService();
        if (notificationService) {
          for (const alert of newAlerts) {
            if (alert.severity === 'critical' && alert.data.current_stock === 0) {
              notificationService.notifyOutOfStock({
                id: alert.data.id,
                name: alert.data.name,
                store_id: alert.data.store_id || 1
              }).catch(err => console.error('Error sending notification:', err));
            } else {
              notificationService.notifyLowStock(
                { id: alert.data.id, name: alert.data.name, store_id: alert.data.store_id || 1 },
                alert.data.current_stock,
                alert.data.minimum_stock || this.thresholds.lowStock
              ).catch(err => console.error('Error sending notification:', err));
            }
          }
        }
      }

      // Remove resolved alerts
      for (const [key, alert] of this.alerts) {
        if (alert.type === 'stock' && !products.find(p => `stock_${p.id}` === key)) {
          this.alerts.delete(key);
          this.io.emit('alert:resolved', { id: key });
        }
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  }

  // Check for expiring ingredients
  async checkExpiringIngredients() {
    try {
      let ingredients = [];
      
      if (USE_SUPABASE && db) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.thresholds.expiryDays);
        
        const { data, error } = await db.supabase
          .from('ingredients')
          .select('*')
          .not('expiry_date', 'is', null)
          .lte('expiry_date', expiryDate.toISOString())
          .gte('expiry_date', new Date().toISOString())
          .order('expiry_date', { ascending: true });
        
        if (error) throw error;
        ingredients = data || [];
      } else {
        ingredients = await allAsync(`
          SELECT *
          FROM ingredients
          WHERE expiry_date IS NOT NULL
            AND DATE(expiry_date) <= DATE('now', '+${this.thresholds.expiryDays} days')
            AND DATE(expiry_date) >= DATE('now')
          ORDER BY expiry_date ASC
        `);
      }

      const newAlerts = [];

      for (const ingredient of ingredients) {
        const alertKey = `expiry_${ingredient.id}`;
        const daysUntilExpiry = Math.ceil(
          (new Date(ingredient.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        const alert = {
          id: alertKey,
          type: 'expiry',
          severity: daysUntilExpiry <= 3 ? 'critical' : 'warning',
          title: `Ingrediente por vencer: ${ingredient.name}`,
          message: `Vence en ${daysUntilExpiry} días (${new Date(ingredient.expiry_date).toLocaleDateString()})`,
          data: ingredient,
          timestamp: new Date().toISOString()
        };

        const existingAlert = this.alerts.get(alertKey);
        if (!existingAlert || existingAlert.data.daysUntilExpiry !== daysUntilExpiry) {
          this.alerts.set(alertKey, alert);
          newAlerts.push(alert);
        }
      }

      if (newAlerts.length > 0) {
        this.io.emit('alerts:expiry', newAlerts);
      }
    } catch (error) {
      console.error('Error checking expiry alerts:', error);
    }
  }

  // Check cash flow status
  async checkCashFlow() {
    try {
      let cashStatus = [];
      
      if (USE_SUPABASE && db) {
        // Get latest cash flow entry for each store
        const { data: stores } = await db.supabase
          .from('stores')
          .select('id');
        
        for (const store of (stores || [])) {
          const { data: latestEntry } = await db.supabase
            .from('cash_flow')
            .select('store_id, balance')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (latestEntry) {
            cashStatus.push(latestEntry);
          }
        }
      } else {
        cashStatus = await allAsync(`
          SELECT store_id, balance
          FROM cash_flow
          WHERE id IN (
            SELECT MAX(id)
            FROM cash_flow
            GROUP BY store_id
          )
        `);
      }

      const newAlerts = [];

      for (const status of cashStatus) {
        if (status.balance < 500) {
          const alertKey = `cash_${status.store_id}`;
          const severity = status.balance < 200 ? 'critical' : 'warning';
          
          const alert = {
            id: alertKey,
            type: 'cash',
            severity,
            title: `Efectivo ${severity === 'critical' ? 'Crítico' : 'Bajo'}`,
            message: `Solo $${status.balance} disponible en caja`,
            data: status,
            timestamp: new Date().toISOString()
          };

          const existingAlert = this.alerts.get(alertKey);
          if (!existingAlert || existingAlert.severity !== severity) {
            this.alerts.set(alertKey, alert);
            newAlerts.push(alert);
          }
        }
      }

      if (newAlerts.length > 0) {
        this.io.emit('alerts:cash', newAlerts);
      }
    } catch (error) {
      console.error('Error checking cash alerts:', error);
    }
  }

  // Check for sales anomalies
  async checkSalesAnomalies() {
    try {
      let salesData = [];
      
      if (USE_SUPABASE && db) {
        // Get today's sales count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { count: todaySales } = await db.supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());
        
        // Get average daily sales for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: historicalSales } = await db.supabase
          .from('sales')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .lt('created_at', today.toISOString());
        
        // Calculate average
        const salesByDay = {};
        (historicalSales || []).forEach(sale => {
          const date = new Date(sale.created_at).toDateString();
          salesByDay[date] = (salesByDay[date] || 0) + 1;
        });
        
        const avgDailySales = Object.values(salesByDay).reduce((a, b) => a + b, 0) / Math.max(Object.keys(salesByDay).length, 1);
        
        salesData = [{
          today: today.toISOString(),
          today_sales: todaySales || 0,
          avg_daily_sales: avgDailySales
        }];
      } else {
        salesData = await allAsync(`
          SELECT 
            DATE('now') as today,
            (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = DATE('now')) as today_sales,
            (SELECT AVG(daily_sales) FROM (
              SELECT COUNT(*) as daily_sales
              FROM sales
              WHERE DATE(created_at) >= DATE('now', '-30 days')
                AND DATE(created_at) < DATE('now')
              GROUP BY DATE(created_at)
            )) as avg_daily_sales
        `);
      }

      const data = salesData[0];
      if (data.avg_daily_sales && data.today_sales < data.avg_daily_sales * 0.5) {
        const alertKey = 'sales_low';
        const alert = {
          id: alertKey,
          type: 'sales',
          severity: 'info',
          title: 'Ventas bajas hoy',
          message: `Solo ${data.today_sales} ventas (promedio: ${Math.round(data.avg_daily_sales)})`,
          data: data,
          timestamp: new Date().toISOString()
        };

        this.alerts.set(alertKey, alert);
        this.io.emit('alerts:sales', [alert]);
      }
    } catch (error) {
      console.error('Error checking sales alerts:', error);
    }
  }

  // Get all active alerts
  getActiveAlerts() {
    return Array.from(this.alerts.values())
      .sort((a, b) => {
        // Sort by severity then by timestamp
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }

  // Dismiss an alert
  dismissAlert(alertId) {
    if (this.alerts.has(alertId)) {
      this.alerts.delete(alertId);
      this.io.emit('alert:dismissed', { id: alertId });
      return true;
    }
    return false;
  }

  // Update alert thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.checkAllAlerts(); // Recheck with new thresholds
  }

  // Manual trigger for specific checks
  async triggerCheck(checkType) {
    switch (checkType) {
      case 'stock':
        await this.checkLowStock();
        break;
      case 'expiry':
        await this.checkExpiringIngredients();
        break;
      case 'cash':
        await this.checkCashFlow();
        break;
      case 'sales':
        await this.checkSalesAnomalies();
        break;
      default:
        await this.checkAllAlerts();
    }
  }
}

module.exports = AlertService;