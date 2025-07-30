const EventEmitter = require('events');
const { createClient } = require('@supabase/supabase-js');

class NotificationService extends EventEmitter {
  constructor(io, supabase = null) {
    super();
    this.io = io;
    this.supabase = supabase;
    this.notificationQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    
    // Notification types
    this.TYPES = {
      STOCK_ALERT: 'stock_alert',
      LOW_STOCK: 'low_stock',
      OUT_OF_STOCK: 'out_of_stock',
      NEW_ORDER: 'new_order',
      ORDER_READY: 'order_ready',
      ORDER_DELIVERED: 'order_delivered',
      SYSTEM_MAINTENANCE: 'system_maintenance',
      SYSTEM_UPDATE: 'system_update',
      SALES_MILESTONE: 'sales_milestone',
      DAILY_GOAL: 'daily_goal',
      RECORD_SALES: 'record_sales',
      TEMPERATURE_WARNING: 'temperature_warning',
      TEMPERATURE_CRITICAL: 'temperature_critical',
      PAYMENT_SUCCESS: 'payment_success',
      PAYMENT_FAILED: 'payment_failed',
      BATCH_COMPLETED: 'batch_completed',
      EXPIRATION_WARNING: 'expiration_warning'
    };
    
    // Priority levels
    this.PRIORITY = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    // Default templates
    this.templates = new Map();
    this.initializeTemplates();
  }
  
  initializeTemplates() {
    // Stock templates
    this.templates.set(this.TYPES.LOW_STOCK, {
      title: 'Stock Bajo',
      message: 'El producto {product} tiene stock bajo ({current}/{minimum})',
      priority: this.PRIORITY.MEDIUM
    });
    
    this.templates.set(this.TYPES.OUT_OF_STOCK, {
      title: 'Sin Stock',
      message: 'El producto {product} está agotado',
      priority: this.PRIORITY.HIGH
    });
    
    // Order templates
    this.templates.set(this.TYPES.NEW_ORDER, {
      title: 'Nueva Orden',
      message: 'Nueva orden #{order_number} de {customer}',
      priority: this.PRIORITY.MEDIUM
    });
    
    this.templates.set(this.TYPES.ORDER_READY, {
      title: 'Orden Lista',
      message: 'La orden #{order_number} está lista para entrega',
      priority: this.PRIORITY.MEDIUM
    });
    
    // Sales templates
    this.templates.set(this.TYPES.DAILY_GOAL, {
      title: 'Meta Diaria Alcanzada',
      message: 'Has alcanzado la meta diaria de ventas ({amount})',
      priority: this.PRIORITY.LOW
    });
    
    this.templates.set(this.TYPES.RECORD_SALES, {
      title: 'Record de Ventas',
      message: 'Nuevo record de ventas: {amount}',
      priority: this.PRIORITY.MEDIUM
    });
    
    // Temperature templates
    this.templates.set(this.TYPES.TEMPERATURE_WARNING, {
      title: 'Advertencia de Temperatura',
      message: 'Temperatura del {device} fuera de rango: {temperature}°C',
      priority: this.PRIORITY.HIGH
    });
    
    this.templates.set(this.TYPES.TEMPERATURE_CRITICAL, {
      title: 'Temperatura Crítica',
      message: 'ALERTA CRÍTICA: {device} a {temperature}°C',
      priority: this.PRIORITY.CRITICAL
    });
    
    // Payment templates
    this.templates.set(this.TYPES.PAYMENT_SUCCESS, {
      title: 'Pago Exitoso',
      message: 'Pago de {amount} recibido para orden #{order_number}',
      priority: this.PRIORITY.LOW
    });
    
    // Production templates
    this.templates.set(this.TYPES.BATCH_COMPLETED, {
      title: 'Lote Completado',
      message: 'Lote de {product} completado ({quantity} unidades)',
      priority: this.PRIORITY.LOW
    });
    
    // Expiration templates
    this.templates.set(this.TYPES.EXPIRATION_WARNING, {
      title: 'Advertencia de Vencimiento',
      message: '{product} vence en {days} días',
      priority: this.PRIORITY.MEDIUM
    });
  }
  
  async init() {
    // Initialize Supabase if not provided
    if (!this.supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    
    // Start processing queue
    this.startQueueProcessor();
    
    // Set up Socket.IO event handlers
    this.setupSocketHandlers();
    
    console.log('✅ Notification service initialized');
  }
  
  setupSocketHandlers() {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      // Join user-specific room
      socket.on('join:notifications', (data) => {
        const { userId, storeId, role } = data;
        
        // Join personal notification room
        if (userId) {
          socket.join(`user:${userId}`);
        }
        
        // Join store notification room
        if (storeId) {
          socket.join(`store:${storeId}`);
        }
        
        // Join role-based notification room
        if (role) {
          socket.join(`role:${role}`);
        }
        
        console.log(`Socket ${socket.id} joined notification rooms`);
      });
      
      // Handle notification preferences
      socket.on('notifications:preferences', async (data) => {
        await this.updatePreferences(data.userId, data.preferences);
      });
      
      // Mark notification as read
      socket.on('notifications:read', async (data) => {
        await this.markAsRead(data.notificationId, data.userId);
      });
      
      // Get unread count
      socket.on('notifications:unread', async (data) => {
        const count = await this.getUnreadCount(data.userId);
        socket.emit('notifications:unread:count', count);
      });
    });
  }
  
  async createNotification(type, data, options = {}) {
    try {
      const template = this.templates.get(type) || {};
      const message = this.formatMessage(template.message || '', data);
      
      const notification = {
        type,
        title: template.title || 'Notificación',
        message,
        data: data || {},
        priority: options.priority || template.priority || this.PRIORITY.MEDIUM,
        user_id: options.userId || null,
        store_id: options.storeId || null,
        role: options.role || null,
        created_at: new Date().toISOString(),
        read_at: null
      };
      
      // Add to queue for processing
      this.notificationQueue.push(notification);
      
      // Emit event
      this.emit('notification:created', notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  formatMessage(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return data[key] || match;
    });
  }
  
  async startQueueProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.isProcessing) {
      if (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      }
      
      // Small delay to prevent CPU overuse
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  async processNotification(notification) {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        // Save to database if Supabase is available
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('notifications')
            .insert([notification])
            .select()
            .single();
          
          if (error) throw error;
          notification.id = data.id;
        }
        
        // Send via Socket.IO
        this.broadcastNotification(notification);
        
        // Success - exit retry loop
        break;
      } catch (error) {
        attempts++;
        console.error(`Error processing notification (attempt ${attempts}):`, error);
        
        if (attempts < this.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * attempts)
          );
        } else {
          // Max retries reached - log and move on
          console.error('Failed to process notification after max retries:', notification);
          this.emit('notification:failed', { notification, error });
        }
      }
    }
  }
  
  broadcastNotification(notification) {
    if (!this.io) return;
    
    // Broadcast to specific user
    if (notification.user_id) {
      this.io.to(`user:${notification.user_id}`).emit('notification:new', notification);
    }
    
    // Broadcast to store
    if (notification.store_id) {
      this.io.to(`store:${notification.store_id}`).emit('notification:new', notification);
    }
    
    // Broadcast to role
    if (notification.role) {
      this.io.to(`role:${notification.role}`).emit('notification:new', notification);
    }
    
    // Broadcast to all if no specific target
    if (!notification.user_id && !notification.store_id && !notification.role) {
      this.io.emit('notification:new', notification);
    }
  }
  
  async getNotifications(userId, options = {}) {
    try {
      if (!this.supabase) {
        return [];
      }
      
      let query = this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by user
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      // Filter by read status
      if (options.unreadOnly) {
        query = query.is('read_at', null);
      }
      
      // Limit results
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
  
  async markAsRead(notificationId, userId) {
    try {
      if (!this.supabase) return;
      
      const { error } = await this.supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Emit update event
      this.io.to(`user:${userId}`).emit('notification:read', notificationId);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  async markAllAsRead(userId) {
    try {
      if (!this.supabase) return;
      
      const { error } = await this.supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      
      if (error) throw error;
      
      // Emit update event
      this.io.to(`user:${userId}`).emit('notifications:all:read');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
  
  async getUnreadCount(userId) {
    try {
      if (!this.supabase) return 0;
      
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .is('read_at', null);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
  
  async getPreferences(userId) {
    try {
      if (!this.supabase) return null;
      
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  getDefaultPreferences() {
    return {
      email_enabled: false,
      push_enabled: true,
      sound_enabled: true,
      types: {
        [this.TYPES.STOCK_ALERT]: true,
        [this.TYPES.NEW_ORDER]: true,
        [this.TYPES.TEMPERATURE_WARNING]: true,
        [this.TYPES.TEMPERATURE_CRITICAL]: true,
        [this.TYPES.PAYMENT_SUCCESS]: true,
        [this.TYPES.PAYMENT_FAILED]: true,
        [this.TYPES.SALES_MILESTONE]: true,
        [this.TYPES.EXPIRATION_WARNING]: true
      }
    };
  }
  
  async updatePreferences(userId, preferences) {
    try {
      if (!this.supabase) return;
      
      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Emit update event
      this.io.to(`user:${userId}`).emit('preferences:updated', preferences);
      
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }
  
  // Integration methods for other services
  async notifyLowStock(product, currentStock, minimumStock) {
    return this.createNotification(this.TYPES.LOW_STOCK, {
      product: product.name,
      current: currentStock,
      minimum: minimumStock,
      product_id: product.id
    }, {
      storeId: product.store_id,
      role: 'admin'
    });
  }
  
  async notifyOutOfStock(product) {
    return this.createNotification(this.TYPES.OUT_OF_STOCK, {
      product: product.name,
      product_id: product.id
    }, {
      storeId: product.store_id,
      role: 'admin',
      priority: this.PRIORITY.HIGH
    });
  }
  
  async notifyNewOrder(order) {
    return this.createNotification(this.TYPES.NEW_ORDER, {
      order_number: order.order_number,
      customer: order.customer_name,
      order_id: order.id,
      amount: order.total_amount
    }, {
      storeId: order.store_id,
      role: 'sales'
    });
  }
  
  async notifyOrderReady(order) {
    return this.createNotification(this.TYPES.ORDER_READY, {
      order_number: order.order_number,
      order_id: order.id
    }, {
      userId: order.customer_id,
      storeId: order.store_id
    });
  }
  
  async notifyTemperatureAlert(device, temperature, isWarning = true) {
    const type = isWarning ? 
      this.TYPES.TEMPERATURE_WARNING : 
      this.TYPES.TEMPERATURE_CRITICAL;
    
    return this.createNotification(type, {
      device: device.name,
      temperature,
      device_id: device.id
    }, {
      storeId: device.store_id,
      role: 'admin',
      priority: isWarning ? this.PRIORITY.HIGH : this.PRIORITY.CRITICAL
    });
  }
  
  async notifyPaymentSuccess(payment, order) {
    return this.createNotification(this.TYPES.PAYMENT_SUCCESS, {
      amount: payment.amount,
      order_number: order.order_number,
      payment_id: payment.id
    }, {
      userId: order.customer_id,
      storeId: order.store_id
    });
  }
  
  async notifySalesMilestone(type, data) {
    return this.createNotification(type, data, {
      storeId: data.store_id,
      role: 'admin'
    });
  }
  
  async notifyBatchCompleted(batch) {
    return this.createNotification(this.TYPES.BATCH_COMPLETED, {
      product: batch.product_name,
      quantity: batch.quantity,
      batch_id: batch.id
    }, {
      storeId: batch.store_id,
      role: 'production'
    });
  }
  
  async notifyExpirationWarning(product, daysUntilExpiration) {
    return this.createNotification(this.TYPES.EXPIRATION_WARNING, {
      product: product.name,
      days: daysUntilExpiration,
      product_id: product.id,
      expiration_date: product.expiration_date
    }, {
      storeId: product.store_id,
      role: 'admin',
      priority: daysUntilExpiration <= 3 ? this.PRIORITY.HIGH : this.PRIORITY.MEDIUM
    });
  }
  
  // Scheduled notification for daily reports
  async sendDailyReport(storeId, reportData) {
    return this.createNotification('daily_report', reportData, {
      storeId,
      role: 'admin'
    });
  }
  
  // Clean up old notifications
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      if (!this.supabase) return;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .not('read_at', 'is', null);
      
      if (error) throw error;
      
      console.log('Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
  
  // Stop the service
  stop() {
    this.isProcessing = false;
    this.removeAllListeners();
    console.log('Notification service stopped');
  }
}

module.exports = NotificationService;