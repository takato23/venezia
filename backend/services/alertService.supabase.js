const cron = require('node-cron');
const { supabase } = require('../config/supabase');

class AlertServiceSupabase {
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
    console.log('🚨 Iniciando servicio de alertas para Supabase...');
    
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
        this.checkCashFlow()
      ]);
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // Check for low stock products
  async checkLowStock() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('active', true)
        .lte('current_stock', this.thresholds.lowStock)
        .order('current_stock', { ascending: true });
      
      if (error) throw error;

      const newAlerts = [];

      for (const product of (products || [])) {
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
          
          // Also save to database
          await this.saveAlertToDatabase(alert);
        }
      }

      // Emit new alerts
      if (newAlerts.length > 0) {
        this.io.emit('alerts:stock', newAlerts);
      }

      // Remove resolved alerts
      for (const [key, alert] of this.alerts) {
        if (alert.type === 'stock' && !products.find(p => `stock_${p.id}` === key)) {
          this.alerts.delete(key);
          this.io.emit('alert:resolved', { id: key });
          await this.resolveAlertInDatabase(key);
        }
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  }

  // Check for expiring ingredients
  async checkExpiringIngredients() {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.thresholds.expiryDays);
      
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('*')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', expiryDate.toISOString())
        .gte('expiry_date', new Date().toISOString())
        .order('expiry_date', { ascending: true });
      
      if (error) throw error;

      const newAlerts = [];

      for (const ingredient of (ingredients || [])) {
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
          await this.saveAlertToDatabase(alert);
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
      // Get latest cash flow entry for each store
      const { data: stores } = await supabase
        .from('stores')
        .select('id');
      
      const newAlerts = [];

      for (const store of (stores || [])) {
        const { data: latestEntry } = await supabase
          .from('cash_flow')
          .select('store_id, balance')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (latestEntry && latestEntry.balance < 500) {
          const alertKey = `cash_${store.id}`;
          const severity = latestEntry.balance < 200 ? 'critical' : 'warning';
          
          const alert = {
            id: alertKey,
            type: 'cash',
            severity,
            title: `Efectivo ${severity === 'critical' ? 'Crítico' : 'Bajo'}`,
            message: `Solo $${latestEntry.balance} disponible en caja`,
            data: latestEntry,
            timestamp: new Date().toISOString()
          };

          const existingAlert = this.alerts.get(alertKey);
          if (!existingAlert || existingAlert.severity !== severity) {
            this.alerts.set(alertKey, alert);
            newAlerts.push(alert);
            await this.saveAlertToDatabase(alert);
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

  // Save alert to database
  async saveAlertToDatabase(alert) {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .upsert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          data: alert.data,
          resolved: false
        }, { onConflict: 'id' });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving alert to database:', error);
    }
  }

  // Resolve alert in database
  async resolveAlertInDatabase(alertId) {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error resolving alert in database:', error);
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
      this.resolveAlertInDatabase(alertId);
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
      default:
        await this.checkAllAlerts();
    }
  }
}

module.exports = AlertServiceSupabase;