import { supabase } from '../config/supabase';
import { io } from 'socket.io-client';

class BranchNotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.subscriptions = new Map();
  }

  // Inicializar conexión WebSocket
  connect(organizationId, branchIds = []) {
    if (this.socket) {
      this.disconnect();
    }

    // Conectar al servidor de WebSocket
    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
      auth: {
        organizationId,
        branchIds
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to branch notifications');
      this.subscribeToChannels(branchIds);
    });

    this.socket.on('notification', this.handleNotification.bind(this));
    this.socket.on('branch_update', this.handleBranchUpdate.bind(this));
    this.socket.on('stock_alert', this.handleStockAlert.bind(this));
    this.socket.on('transfer_request', this.handleTransferRequest.bind(this));
    this.socket.on('employee_alert', this.handleEmployeeAlert.bind(this));
  }

  // Desconectar WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.unsubscribeAll();
  }

  // Suscribirse a canales de Supabase Realtime
  subscribeToChannels(branchIds) {
    // Canal para actualizaciones de sucursales
    const branchChannel = supabase
      .channel('branch-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branches',
          filter: `id=in.(${branchIds.join(',')})`
        },
        this.handleBranchChange.bind(this)
      )
      .subscribe();

    this.subscriptions.set('branches', branchChannel);

    // Canal para transferencias
    const transferChannel = supabase
      .channel('transfer-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branch_transfers',
          filter: `or(from_branch_id.in.(${branchIds.join(',')}),to_branch_id.in.(${branchIds.join(',')}))`
        },
        this.handleTransferChange.bind(this)
      )
      .subscribe();

    this.subscriptions.set('transfers', transferChannel);

    // Canal para inventario
    const inventoryChannel = supabase
      .channel('inventory-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branch_inventory',
          filter: `branch_id=in.(${branchIds.join(',')})`
        },
        this.handleInventoryChange.bind(this)
      )
      .subscribe();

    this.subscriptions.set('inventory', inventoryChannel);

    // Canal para ventas en tiempo real
    const salesChannel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `branch_id=in.(${branchIds.join(',')})`
        },
        this.handleNewSale.bind(this)
      )
      .subscribe();

    this.subscriptions.set('sales', salesChannel);
  }

  // Desuscribirse de todos los canales
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }
    this.subscriptions.clear();
  }

  // Handlers para diferentes tipos de notificaciones
  handleNotification(data) {
    this.emit('notification', data);
    
    // Mostrar notificación del sistema si está disponible
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data.id,
        requireInteraction: data.priority === 'high'
      });
    }
  }

  handleBranchUpdate(data) {
    this.emit('branch:update', data);
  }

  handleStockAlert(data) {
    this.emit('stock:alert', data);
    
    // Notificación crítica para stock bajo
    if (data.level === 'critical') {
      this.showCriticalNotification(
        '⚠️ Stock Crítico',
        `${data.productName} en ${data.branchName}: ${data.currentStock} ${data.unit}`
      );
    }
  }

  handleTransferRequest(data) {
    this.emit('transfer:request', data);
    
    if (data.type === 'new') {
      this.showNotification(
        '📦 Nueva Transferencia',
        `Solicitud de ${data.fromBranch} a ${data.toBranch}`
      );
    }
  }

  handleEmployeeAlert(data) {
    this.emit('employee:alert', data);
    
    if (data.type === 'absence') {
      this.showNotification(
        '👤 Empleado Ausente',
        `${data.employeeName} no ha registrado entrada en ${data.branchName}`
      );
    }
  }

  // Handlers para cambios en Supabase
  handleBranchChange(payload) {
    this.emit('branch:change', payload);
  }

  handleTransferChange(payload) {
    this.emit('transfer:change', payload);
    
    if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
      this.showNotification(
        '✅ Transferencia Aprobada',
        `Tu solicitud de transferencia ha sido aprobada`
      );
    }
  }

  handleInventoryChange(payload) {
    if (payload.new.current_stock <= payload.new.min_stock) {
      this.emit('inventory:low', payload);
    }
  }

  handleNewSale(payload) {
    this.emit('sale:new', payload);
  }

  // Sistema de eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utilidades para mostrar notificaciones
  showNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    }
  }

  showCriticalNotification(title, body) {
    this.showNotification(title, body, {
      requireInteraction: true,
      vibrate: [200, 100, 200],
      urgency: 'high'
    });
  }

  // Solicitar permisos de notificación
  static async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  // Métodos de utilidad para enviar notificaciones a otras sucursales
  async notifyBranch(branchId, notification) {
    if (this.socket) {
      this.socket.emit('notify:branch', {
        branchId,
        notification
      });
    }
  }

  async notifyAllBranches(notification) {
    if (this.socket) {
      this.socket.emit('notify:all', notification);
    }
  }

  async notifyRole(role, notification) {
    if (this.socket) {
      this.socket.emit('notify:role', {
        role,
        notification
      });
    }
  }

  // Métodos específicos para diferentes tipos de notificaciones
  async sendStockAlert(branchId, productId, currentStock, minStock) {
    const notification = {
      type: 'stock_alert',
      branchId,
      productId,
      currentStock,
      minStock,
      timestamp: new Date().toISOString()
    };

    await this.notifyBranch(branchId, notification);
    await this.notifyRole('manager', notification);
  }

  async sendTransferRequest(fromBranchId, toBranchId, items) {
    const notification = {
      type: 'transfer_request',
      fromBranchId,
      toBranchId,
      items,
      timestamp: new Date().toISOString()
    };

    await this.notifyBranch(toBranchId, notification);
  }

  async sendEmployeeAlert(branchId, employeeId, alertType) {
    const notification = {
      type: 'employee_alert',
      branchId,
      employeeId,
      alertType,
      timestamp: new Date().toISOString()
    };

    await this.notifyBranch(branchId, notification);
    await this.notifyRole('manager', notification);
  }

  // Estado de conexión
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Singleton
const branchNotificationService = new BranchNotificationService();

export default branchNotificationService;