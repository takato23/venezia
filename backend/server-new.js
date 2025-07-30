const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database/schema');
const { seedDatabase } = require('./database/seed');
const { db } = require('./database/db');

// Import models
const Customer = require('./models/Customer');
const CashFlow = require('./models/CashFlow');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database synchronously first
initializeDatabase();

// Then seed after a delay to ensure tables are created
setTimeout(async () => {
  try {
    // Check if database is empty
    const { allAsync } = require('./database/db');
    const productCount = await allAsync('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count === 0) {
      console.log('🌱 Database is empty, seeding...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('Database seeding error:', error);
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

// ==================== CUSTOMER ENDPOINTS ====================
app.get('/api/customers', async (req, res) => {
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

// Import remaining endpoints from old server
// This includes providers, stores, analytics, etc.
require('./routes/remaining-endpoints')(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Venezia Backend API with SQLite running on port ${PORT}`);
  console.log(`📊 Database: SQLite`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;