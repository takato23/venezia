const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/environment');
const { initializeDatabase, models, USE_SUPABASE } = require('./config/database');
const { seedDatabase } = require('./database/seed');

// Import models from configuration
const { Customer, CashFlow, Product } = models;

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const publicRoutes = require('./routes/public');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const paymentRoutes = require('./routes/payments');
const providersRoutes = require('./routes/providers');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const quickfixRoutes = require('./routes/quickfix');

// Import middleware
const { authMiddleware, requireRole, optionalAuth } = require('./middleware/auth');
const { flexibleAuth } = require('./middleware/flexibleAuth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = config.PORT || 5001;

// Import and initialize services
const AlertService = USE_SUPABASE 
  ? require('./services/alertService.supabase')
  : require('./services/alertService');
const alertService = new AlertService(io);

const BackupService = require('./services/backupService');
const backupService = new BackupService();

const NotificationService = require('./services/notificationService');
const notificationService = new NotificationService(io);
const { setNotificationService } = require('./services/notificationService.instance');
setNotificationService(notificationService);

const ScheduledNotifications = require('./services/scheduledNotifications');
const scheduledNotifications = new ScheduledNotifications();

// Middleware
app.use(cors({
  origin: config.isDevelopment ? true : config.ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Initialize database
(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
})();

// Then seed after a delay to ensure tables are created
setTimeout(async () => {
  try {
    // Initialize services after database is ready
    alertService.init();
    backupService.init();
    notificationService.init();
    scheduledNotifications.init();
    
    // Only seed if using SQLite
    if (!USE_SUPABASE) {
      const { allAsync } = require('./database/db');
      const productCount = await allAsync('SELECT COUNT(*) as count FROM products');
      if (productCount[0].count === 0) {
        console.log('🌱 Database is empty, seeding...');
        await seedDatabase();
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}, 1000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'venezia-backend-api'
  });
});

// ==================== AUTH ROUTES (PUBLIC) ====================
app.use('/api/auth', authRoutes);

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================
app.use('/api/public', publicRoutes);

// ==================== USER MANAGEMENT (PROTECTED) ====================
app.use('/api/users', userRoutes);

// ==================== SALES ENDPOINTS (PROTECTED) ====================
app.use('/api/sales', flexibleAuth, salesRoutes);

// ==================== INVENTORY ENDPOINTS (PROTECTED) ====================
app.use('/api/inventory', inventoryRoutes);

// ==================== PAYMENT ENDPOINTS (PROTECTED) ====================
app.use('/api/payments', paymentRoutes);

// ==================== PROVIDERS ENDPOINTS (PROTECTED) ====================
app.use('/api', providersRoutes);

// ==================== REPORTS ENDPOINTS (PROTECTED) ====================
app.use('/api/reports', reportsRoutes);

// ==================== AI ENDPOINTS (PROTECTED) ====================
app.use('/api/ai', aiRoutes);

// ==================== QUICKFIX ENDPOINTS (FOR SUPERBOT) ====================
app.use('/api', quickfixRoutes);

// ==================== CUSTOMER ENDPOINTS (PROTECTED) ====================
app.get('/api/customers', flexibleAuth, async (req, res) => {
  try {
    const customers = await Customer.getAll();
    res.json({
      success: true,
      data: customers,
      total: customers.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.getById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.update(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await Customer.delete(req.params.id);
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
});

// ==================== CASH FLOW ENDPOINTS ====================
app.get('/api/cashflow/status', async (req, res) => {
  try {
    const status = await CashFlow.getCashRegisterStatus(req.query.store_id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching cash status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash status',
      error: error.message
    });
  }
});

app.post('/api/cashflow/open', async (req, res) => {
  try {
    const { user_id, store_id, initial_amount } = req.body;
    const result = await CashFlow.openCashRegister(user_id || 1, store_id || 1, initial_amount || 0);
    res.json({
      success: true,
      message: 'Caja abierta exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error opening cash register:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al abrir caja',
      error: error.message
    });
  }
});

app.post('/api/cashflow/close', async (req, res) => {
  try {
    const { user_id, store_id, final_amount } = req.body;
    const result = await CashFlow.closeCashRegister(user_id || 1, store_id || 1, final_amount);
    res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error closing cash register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar caja',
      error: error.message
    });
  }
});

app.post('/api/cashflow/movements', async (req, res) => {
  try {
    const { user_id, store_id, type, amount, description } = req.body;
    const result = await CashFlow.addMovement(
      user_id || 1, 
      store_id || 1, 
      type, 
      amount, 
      description
    );
    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error adding movement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar movimiento',
      error: error.message
    });
  }
});

app.get('/api/cashflow', async (req, res) => {
  try {
    const movements = await CashFlow.getMovements(req.query.store_id);
    const summary = await CashFlow.getDailySummary(req.query.store_id);
    res.json({
      success: true,
      data: {
        movements,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash flow',
      error: error.message
    });
  }
});

app.put('/api/cashflow/movements/:id', async (req, res) => {
  try {
    const movement = await CashFlow.updateMovement(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Movimiento actualizado exitosamente',
      data: movement
    });
  } catch (error) {
    console.error('Error updating movement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar movimiento',
      error: error.message
    });
  }
});

// ==================== PRODUCT ENDPOINTS ====================
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.getAll(req.query);
    res.json({
      success: true,
      products,
      data: products // for compatibility
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({
      success: true,
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
});

// ==================== ALERT ENDPOINTS ====================
app.get('/api/alerts', flexibleAuth, (req, res) => {
  try {
    const alerts = alertService.getActiveAlerts();
    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

app.post('/api/alerts/:id/dismiss', flexibleAuth, (req, res) => {
  try {
    const dismissed = alertService.dismissAlert(req.params.id);
    if (dismissed) {
      res.json({
        success: true,
        message: 'Alert dismissed successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error dismissing alert',
      error: error.message
    });
  }
});

app.put('/api/alerts/thresholds', flexibleAuth, (req, res) => {
  try {
    alertService.updateThresholds(req.body);
    res.json({
      success: true,
      message: 'Alert thresholds updated successfully'
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating thresholds',
      error: error.message
    });
  }
});

app.post('/api/alerts/check/:type', flexibleAuth, async (req, res) => {
  try {
    await alertService.triggerCheck(req.params.type);
    res.json({
      success: true,
      message: `${req.params.type} alerts checked successfully`
    });
  } catch (error) {
    console.error('Error triggering alert check:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering alert check',
      error: error.message
    });
  }
});

// ==================== BACKUP ENDPOINTS ====================
app.get('/api/backups', flexibleAuth, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      data: backups,
      total: backups.length
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing backups',
      error: error.message
    });
  }
});

app.post('/api/backups', flexibleAuth, async (req, res) => {
  try {
    const backup = await backupService.createBackup('manual');
    if (backup) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        data: backup
      });
    } else {
      res.status(409).json({
        success: false,
        message: 'Backup already in progress'
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating backup',
      error: error.message
    });
  }
});

app.post('/api/backups/:fileName/restore', flexibleAuth, async (req, res) => {
  try {
    const result = await backupService.restoreBackup(req.params.fileName);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring backup',
      error: error.message
    });
  }
});

app.get('/api/backups/:fileName/download', flexibleAuth, async (req, res) => {
  try {
    const data = await backupService.exportBackup(req.params.fileName);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
    res.send(data);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading backup',
      error: error.message
    });
  }
});

app.get('/api/backups/info', flexibleAuth, async (req, res) => {
  try {
    const info = await backupService.getBackupInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting backup info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting backup info',
      error: error.message
    });
  }
});

// ==================== NOTIFICATION ENDPOINTS ====================
app.get('/api/notifications', flexibleAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly, limit } = req.query;
    
    const notifications = await notificationService.getNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({
      success: true,
      data: notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

app.post('/api/notifications/:id/read', flexibleAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

app.post('/api/notifications/read-all', flexibleAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

app.get('/api/notifications/unread-count', flexibleAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
});

app.get('/api/notifications/preferences', flexibleAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const preferences = await notificationService.getPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences',
      error: error.message
    });
  }
});

app.put('/api/notifications/preferences', flexibleAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    await notificationService.updatePreferences(userId, req.body);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current alerts to newly connected client
  socket.emit('alerts:current', alertService.getActiveAlerts());
  
  // Setup heartbeat
  const heartbeatInterval = setInterval(() => {
    socket.emit('heartbeat', { timestamp: new Date().toISOString() });
  }, 30000); // 30 seconds
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    clearInterval(heartbeatInterval);
  });
  
  socket.on('heartbeat:response', () => {
    // Client is alive
  });
});

// Import remaining endpoints from old server
// This includes providers, stores, analytics, etc.
require('./routes/remaining-endpoints')(app);

// ==================== DELIVERIES ENDPOINTS ====================
// Mock delivery data - In production, this would be in a database
let deliveries = [
  {
    id: 1,
    order_id: 1,
    order_number: 'ORD-001',
    driver_id: 1,
    driver_name: 'Carlos Rodriguez',
    customer_name: 'María García',
    customer_phone: '+54 11 2345-6789',
    address: {
      street: 'Av. Santa Fe',
      number: '1234',
      neighborhood: 'Recoleta',
      city: 'Buenos Aires'
    },
    scheduled_date: new Date().toISOString(),
    scheduled_time: '14:30',
    priority: 'normal',
    status: 'pending',
    items: [
      { product_name: 'Helado Chocolate', quantity: 2, price: 3500 },
      { product_name: 'Helado Vainilla', quantity: 1, price: 3200 }
    ],
    total_amount: 10200,
    notes: 'Timbre: 3A',
    created_at: new Date().toISOString(),
    created_by: 'admin'
  },
  {
    id: 2,
    order_id: 2,
    order_number: 'ORD-002',
    driver_id: 2,
    driver_name: 'Ana Martínez',
    customer_name: 'Juan Pérez',
    customer_phone: '+54 11 8765-4321',
    address: {
      street: 'Av. Corrientes',
      number: '5678',
      neighborhood: 'Almagro',
      city: 'Buenos Aires'
    },
    scheduled_date: new Date().toISOString(),
    scheduled_time: '16:00',
    priority: 'high',
    status: 'in_transit',
    items: [
      { product_name: 'Helado Dulce de Leche', quantity: 1, price: 3800 }
    ],
    total_amount: 3800,
    notes: 'Departamento en primer piso',
    created_at: new Date().toISOString(),
    created_by: 'admin'
  }
];

// Mock drivers data
let drivers = [
  {
    id: 1,
    name: 'Carlos Rodriguez',
    phone: '+54 11 9876-5432',
    vehicle: 'Moto Honda 150cc',
    license: 'ABC123',
    available: true,
    current_location: { lat: -34.6037, lng: -58.3816 },
    active_deliveries: 1
  },
  {
    id: 2,
    name: 'Ana Martínez',
    phone: '+54 11 8765-4321',
    vehicle: 'Bicicleta eléctrica',
    license: 'BIC456',
    available: true,
    current_location: { lat: -34.6118, lng: -58.3960 },
    active_deliveries: 1
  }
];

let deliveryCounter = 3;

// GET /api/deliveries
app.get('/api/deliveries', flexibleAuth, (req, res) => {
  try {
    const { status, driver_id, date } = req.query;
    
    let filteredDeliveries = [...deliveries];
    
    // Filter by status
    if (status && status !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(d => d.status === status);
    }
    
    // Filter by driver
    if (driver_id && driver_id !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(d => d.driver_id === parseInt(driver_id));
    }
    
    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      filteredDeliveries = filteredDeliveries.filter(d => {
        const deliveryDate = new Date(d.scheduled_date);
        return deliveryDate.toDateString() === targetDate.toDateString();
      });
    }
    
    res.json(filteredDeliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener entregas'
    });
  }
});

// POST /api/deliveries
app.post('/api/deliveries', flexibleAuth, (req, res) => {
  try {
    const {
      order_id,
      driver_id,
      customer_name,
      customer_phone,
      address,
      scheduled_date,
      scheduled_time,
      priority,
      items,
      total_amount,
      notes
    } = req.body;
    
    // Find driver name
    const driver = drivers.find(d => d.id === parseInt(driver_id));
    
    const newDelivery = {
      id: deliveryCounter++,
      order_id: order_id || null,
      order_number: `ORD-${String(deliveryCounter).padStart(3, '0')}`,
      driver_id: driver_id ? parseInt(driver_id) : null,
      driver_name: driver ? driver.name : null,
      customer_name,
      customer_phone,
      address,
      scheduled_date,
      scheduled_time,
      priority: priority || 'normal',
      status: 'pending',
      items: items || [],
      total_amount: total_amount || 0,
      notes: notes || '',
      created_at: new Date().toISOString(),
      created_by: 'current_user'
    };
    
    deliveries.push(newDelivery);
    
    res.status(201).json({
      success: true,
      message: 'Entrega creada correctamente',
      delivery: newDelivery
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la entrega'
    });
  }
});

// PUT /api/deliveries/:id
app.put('/api/deliveries/:id', flexibleAuth, (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);
    
    if (deliveryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }
    
    // Update delivery
    deliveries[deliveryIndex] = {
      ...deliveries[deliveryIndex],
      ...req.body,
      id: deliveryId, // Preserve ID
      updated_at: new Date().toISOString()
    };
    
    // Update driver name if driver changed
    if (req.body.driver_id) {
      const driver = drivers.find(d => d.id === parseInt(req.body.driver_id));
      if (driver) {
        deliveries[deliveryIndex].driver_name = driver.name;
      }
    }
    
    res.json({
      success: true,
      message: 'Entrega actualizada correctamente',
      delivery: deliveries[deliveryIndex]
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la entrega'
    });
  }
});

// PUT /api/deliveries/:id/status
app.put('/api/deliveries/:id/status', flexibleAuth, (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const { status } = req.body;
    const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);
    
    if (deliveryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }
    
    const validStatuses = ['pending', 'assigned', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }
    
    deliveries[deliveryIndex].status = status;
    deliveries[deliveryIndex].updated_at = new Date().toISOString();
    
    // Add timestamp for status changes
    if (status === 'delivered') {
      deliveries[deliveryIndex].delivered_at = new Date().toISOString();
    } else if (status === 'in_transit') {
      deliveries[deliveryIndex].started_at = new Date().toISOString();
    }
    
    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      delivery: deliveries[deliveryIndex]
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado'
    });
  }
});

// DELETE /api/deliveries/:id
app.delete('/api/deliveries/:id', flexibleAuth, (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);
    
    if (deliveryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }
    
    // Only allow deletion of pending deliveries
    if (deliveries[deliveryIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden cancelar entregas pendientes'
      });
    }
    
    deliveries.splice(deliveryIndex, 1);
    
    res.json({
      success: true,
      message: 'Entrega cancelada correctamente'
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar la entrega'
    });
  }
});

// GET /api/drivers
app.get('/api/drivers', flexibleAuth, (req, res) => {
  try {
    // Add current delivery count to each driver
    const driversWithStats = drivers.map(driver => ({
      ...driver,
      active_deliveries: deliveries.filter(d => 
        d.driver_id === driver.id && 
        ['assigned', 'in_transit'].includes(d.status)
      ).length
    }));
    
    res.json(driversWithStats);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener repartidores'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Venezia Backend API running on port ${PORT}`);
  console.log(`📊 Database: ${USE_SUPABASE ? 'Supabase' : 'SQLite'}`);
  console.log(`🔔 Real-time alerts: WebSocket enabled`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;