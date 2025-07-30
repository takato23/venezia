// Alert Service - Manages intelligent alerts for the system
class AlertService {
  constructor() {
    this.alertRules = {
      stock: {
        lowStockThreshold: 0.2, // 20% of max stock
        criticalStockThreshold: 0.1, // 10% of max stock
        checkInterval: 3600000 // 1 hour
      },
      expiration: {
        warningDays: 7, // Alert 7 days before expiration
        criticalDays: 3, // Critical alert 3 days before
        checkInterval: 86400000 // 24 hours
      },
      sales: {
        anomalyThreshold: 0.3, // 30% deviation from average
        checkInterval: 3600000 // 1 hour
      }
    };
    
    this.alerts = [];
    this.listeners = new Set();
  }

  // Generate alerts based on current data
  async generateAlerts(data) {
    const newAlerts = [];
    
    // Check stock levels
    if (data.inventory) {
      const stockAlerts = this.checkStockLevels(data.inventory);
      newAlerts.push(...stockAlerts);
    }
    
    // Check expiration dates
    if (data.batches) {
      const expirationAlerts = this.checkExpirationDates(data.batches);
      newAlerts.push(...expirationAlerts);
    }
    
    // Check sales anomalies
    if (data.sales) {
      const salesAlerts = this.checkSalesAnomalies(data.sales);
      newAlerts.push(...salesAlerts);
    }
    
    // Notify listeners
    newAlerts.forEach(alert => this.notifyListeners(alert));
    
    return newAlerts;
  }

  checkStockLevels(inventory) {
    const alerts = [];
    
    inventory.forEach(item => {
      const stockPercentage = item.current_stock / item.max_stock;
      
      if (stockPercentage <= this.alertRules.stock.criticalStockThreshold) {
        alerts.push({
          id: `stock_critical_${item.id}_${Date.now()}`,
          type: 'stock_low',
          severity: 'critical',
          title: `Stock Crítico: ${item.name}`,
          message: `El stock de ${item.name} está en ${Math.round(stockPercentage * 100)}% (${item.current_stock} ${item.unit})`,
          data: {
            item_id: item.id,
            item_name: item.name,
            current_stock: item.current_stock,
            max_stock: item.max_stock,
            percentage: stockPercentage
          },
          action_url: `/inventory?highlight=${item.id}`,
          created_at: new Date().toISOString(),
          read: false
        });
      } else if (stockPercentage <= this.alertRules.stock.lowStockThreshold) {
        alerts.push({
          id: `stock_low_${item.id}_${Date.now()}`,
          type: 'stock_low',
          severity: 'warning',
          title: `Stock Bajo: ${item.name}`,
          message: `El stock de ${item.name} está en ${Math.round(stockPercentage * 100)}% (${item.current_stock} ${item.unit})`,
          data: {
            item_id: item.id,
            item_name: item.name,
            current_stock: item.current_stock,
            max_stock: item.max_stock,
            percentage: stockPercentage
          },
          action_url: `/inventory?highlight=${item.id}`,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });
    
    return alerts;
  }

  checkExpirationDates(batches) {
    const alerts = [];
    const now = new Date();
    
    batches.forEach(batch => {
      if (!batch.expiration_date || batch.status === 'consumed') return;
      
      const expirationDate = new Date(batch.expiration_date);
      const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration <= 0) {
        alerts.push({
          id: `expired_${batch.id}_${Date.now()}`,
          type: 'expiration',
          severity: 'critical',
          title: `Producto Vencido: ${batch.product_name}`,
          message: `El lote ${batch.batch_number} venció hace ${Math.abs(daysUntilExpiration)} días`,
          data: {
            batch_id: batch.id,
            batch_number: batch.batch_number,
            product_name: batch.product_name,
            expiration_date: batch.expiration_date,
            days_expired: Math.abs(daysUntilExpiration)
          },
          action_url: `/production/batches?highlight=${batch.id}`,
          created_at: new Date().toISOString(),
          read: false
        });
      } else if (daysUntilExpiration <= this.alertRules.expiration.criticalDays) {
        alerts.push({
          id: `expiring_critical_${batch.id}_${Date.now()}`,
          type: 'expiration',
          severity: 'critical',
          title: `Vencimiento Próximo: ${batch.product_name}`,
          message: `El lote ${batch.batch_number} vence en ${daysUntilExpiration} días`,
          data: {
            batch_id: batch.id,
            batch_number: batch.batch_number,
            product_name: batch.product_name,
            expiration_date: batch.expiration_date,
            days_until_expiration: daysUntilExpiration
          },
          action_url: `/production/batches?highlight=${batch.id}`,
          created_at: new Date().toISOString(),
          read: false
        });
      } else if (daysUntilExpiration <= this.alertRules.expiration.warningDays) {
        alerts.push({
          id: `expiring_warning_${batch.id}_${Date.now()}`,
          type: 'expiration',
          severity: 'warning',
          title: `Próximo a Vencer: ${batch.product_name}`,
          message: `El lote ${batch.batch_number} vence en ${daysUntilExpiration} días`,
          data: {
            batch_id: batch.id,
            batch_number: batch.batch_number,
            product_name: batch.product_name,
            expiration_date: batch.expiration_date,
            days_until_expiration: daysUntilExpiration
          },
          action_url: `/production/batches?highlight=${batch.id}`,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });
    
    return alerts;
  }

  checkSalesAnomalies(salesData) {
    const alerts = [];
    
    // Group sales by product
    const productSales = {};
    salesData.forEach(sale => {
      if (!productSales[sale.product_id]) {
        productSales[sale.product_id] = {
          product_name: sale.product_name,
          sales: []
        };
      }
      productSales[sale.product_id].sales.push(sale);
    });
    
    // Check for anomalies
    Object.entries(productSales).forEach(([productId, data]) => {
      const { product_name, sales } = data;
      
      if (sales.length < 7) return; // Need at least a week of data
      
      // Calculate average daily sales
      const dailySales = this.aggregateDailySales(sales);
      const avgDailySales = dailySales.reduce((sum, day) => sum + day.total, 0) / dailySales.length;
      
      // Check today's sales
      const todaySales = dailySales[dailySales.length - 1]?.total || 0;
      const deviation = Math.abs(todaySales - avgDailySales) / avgDailySales;
      
      if (deviation > this.alertRules.sales.anomalyThreshold) {
        const isLow = todaySales < avgDailySales;
        
        alerts.push({
          id: `sales_anomaly_${productId}_${Date.now()}`,
          type: 'sales_anomaly',
          severity: 'info',
          title: `Ventas ${isLow ? 'Bajas' : 'Altas'}: ${product_name}`,
          message: `Las ventas de hoy (${todaySales}) son ${Math.round(deviation * 100)}% ${isLow ? 'menores' : 'mayores'} que el promedio (${Math.round(avgDailySales)})`,
          data: {
            product_id: productId,
            product_name: product_name,
            today_sales: todaySales,
            average_sales: avgDailySales,
            deviation: deviation,
            trend: isLow ? 'low' : 'high'
          },
          action_url: `/analytics?product=${productId}`,
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });
    
    return alerts;
  }

  aggregateDailySales(sales) {
    const dailyMap = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at).toDateString();
      if (!dailyMap[date]) {
        dailyMap[date] = { date, total: 0, count: 0 };
      }
      dailyMap[date].total += sale.quantity;
      dailyMap[date].count += 1;
    });
    
    return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Subscribe to alert notifications
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(alert) {
    this.listeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error notifying alert listener:', error);
      }
    });
  }

  // Update alert rules
  updateRules(newRules) {
    this.alertRules = { ...this.alertRules, ...newRules };
  }

  // Get current alert rules
  getRules() {
    return this.alertRules;
  }
}

// Export singleton instance
export const alertService = new AlertService();