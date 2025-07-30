const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database - In production, this would be a real database
let mockData = {
  products: [
    {
      id: 1,
      name: 'Chocolate Amargo',
      price: 3500,
      stock: 25,
      current_stock: 25,
      category: 'Helado',
      context: 'general',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Vainilla',
      price: 3200,
      stock: 18,
      current_stock: 18,
      category: 'Helado',
      context: 'general',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Dulce de Leche',
      price: 3800,
      stock: 12,
      current_stock: 12,
      category: 'Helado',
      context: 'general',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Frutilla',
      price: 3600,
      stock: 20,
      current_stock: 20,
      category: 'Helado',
      context: 'web',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Menta Granizada',
      price: 3700,
      stock: 15,
      current_stock: 15,
      category: 'Helado',
      context: 'stock',
      created_at: new Date().toISOString()
    }
  ],
  sales: [],
  orders: [],
  users: [
    {
      id: 1,
      email: 'admin@venezia.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin'
    }
  ],
  stocks: [],
  dashboard: {
    ventas_hoy: 0,
    ordenes_pendientes: 0,
    stock_bajo: 2,
    ingresos_mes: 0
  }
};

// Utility functions
function generateId(collection) {
  return Math.max(...collection.map(item => item.id || 0), 0) + 1;
}

function findProductByName(name) {
  return mockData.products.find(p => 
    p.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(p.name.toLowerCase())
  );
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Venezia Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// AI health endpoint
app.get('/api/ai/health', (req, res) => {
  res.json({ 
    success: true, 
    ai_status: 'online',
    models: ['gemma-local', 'gemini-cloud'],
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockData.users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      token: 'mock-jwt-token-' + user.id
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/auth/check', (req, res) => {
  // Mock authentication check
  res.json({
    success: true,
    authenticated: true,
    user: {
      id: 1,
      email: 'admin@venezia.com',
      name: 'Admin',
      role: 'admin'
    }
  });
});

// Products endpoints
// Simple stores endpoint for Analytics
app.get('/api/stores', (req, res) => {
  try {
    // For a single ice cream shop, return one default store
    const stores = [
      {
        id: 1,
        name: 'Venezia Ice Cream',
        location: 'Local Principal',
        status: 'active'
      }
    ];
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stores',
      error: error.message
    });
  }
});

// GET /api/product_categories - Obtener categorías de productos
app.get('/api/product_categories', (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Helados', description: 'Helados tradicionales' },
      { id: 2, name: 'Paletas', description: 'Paletas de agua y crema' },
      { id: 3, name: 'Postres', description: 'Postres helados' },
      { id: 4, name: 'Bebidas', description: 'Bebidas frías' },
      { id: 5, name: 'Accesorios', description: 'Conos, cucharitas, servilletas' }
    ];
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product categories',
      error: error.message
    });
  }
});

// POST /api/product_categories - Crear nueva categoría
app.post('/api/product_categories', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }
    
    const newCategory = {
      id: Date.now(),
      name,
      description: description || '',
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Categoría creada exitosamente',
      category: newCategory
    });
    
  } catch (error) {
    console.error('Error creating product category:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
});

app.get('/api/products', (req, res) => {
  const { context, category } = req.query;
  
  let products = [...mockData.products];
  
  if (context) {
    products = products.filter(p => p.context === context || p.context === 'general');
  }
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  res.json({
    success: true,
    products: products,
    data: products
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, category, context, initial_stock } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Name and price are required'
    });
  }
  
  const newProduct = {
    id: generateId(mockData.products),
    name: name.trim(),
    price: parseFloat(price),
    category: category || 'Helado',
    context: context || 'general',
    stock: initial_stock || 0,
    current_stock: initial_stock || 0,
    created_at: new Date().toISOString()
  };
  
  mockData.products.push(newProduct);
  
  res.json({
    success: true,
    message: 'Product created successfully',
    product: newProduct
  });
});

// PUT /api/products/:id - Actualizar producto
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, context } = req.body;
    
    const productIndex = mockData.products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Actualizar producto
    mockData.products[productIndex] = {
      ...mockData.products[productIndex],
      name: name || mockData.products[productIndex].name,
      description: description !== undefined ? description : mockData.products[productIndex].description,
      price: price !== undefined ? parseFloat(price) : mockData.products[productIndex].price,
      stock: stock !== undefined ? parseInt(stock) : mockData.products[productIndex].stock,
      current_stock: stock !== undefined ? parseInt(stock) : mockData.products[productIndex].current_stock,
      category_id: category_id !== undefined ? parseInt(category_id) : mockData.products[productIndex].category_id,
      context: context || mockData.products[productIndex].context,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: mockData.products[productIndex]
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

// DELETE /api/products/:id - Eliminar producto
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const productIndex = mockData.products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Eliminar producto
    const deletedProduct = mockData.products.splice(productIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      product: deletedProduct
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

// Executive endpoints (for guided assistant)
app.post('/api/executive/add-stock', (req, res) => {
  const { product_id, quantity, unit } = req.body;
  
  const productId = parseInt(product_id);
  const qty = parseFloat(quantity);
  
  if (!productId || !qty || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID or quantity'
    });
  }
  
  const product = mockData.products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Update stock
  product.stock += qty;
  product.current_stock += qty;
  
  // Add to stock history
  const stockEntry = {
    id: generateId(mockData.stocks),
    product_id: productId,
    quantity: qty,
    type: 'addition',
    unit: unit || 'kg',
    timestamp: new Date().toISOString(),
    reason: 'Manual addition via assistant'
  };
  
  mockData.stocks.push(stockEntry);
  
  res.json({
    success: true,
    message: `Added ${qty} ${unit || 'kg'} to ${product.name}`,
    product: product,
    new_stock: product.stock
  });
});

app.post('/api/executive/create-product', (req, res) => {
  const { name, price, context, category, initial_stock } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Name and price are required'
    });
  }
  
  // Check if product already exists
  const existingProduct = findProductByName(name);
  if (existingProduct) {
    return res.status(400).json({
      success: false,
      message: `A product similar to "${name}" already exists: "${existingProduct.name}"`
    });
  }
  
  const newProduct = {
    id: generateId(mockData.products),
    name: name.trim(),
    price: parseFloat(price),
    category: category || 'Helado',
    context: context || 'general',
    stock: initial_stock || 0,
    current_stock: initial_stock || 0,
    created_at: new Date().toISOString()
  };
  
  mockData.products.push(newProduct);
  
  res.json({
    success: true,
    message: `Product "${name}" created successfully`,
    product: newProduct
  });
});

app.post('/api/executive/update-price', (req, res) => {
  const { product_id, new_price } = req.body;
  
  const productId = parseInt(product_id);
  const price = parseFloat(new_price);
  
  if (!productId || !price || price <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID or price'
    });
  }
  
  const product = mockData.products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const oldPrice = product.price;
  product.price = price;
  product.updated_at = new Date().toISOString();
  
  res.json({
    success: true,
    message: `Price updated for ${product.name}: $${oldPrice} → $${price}`,
    product: product,
    old_price: oldPrice,
    new_price: price
  });
});

// Dashboard endpoints
app.get('/api/dashboard/overview', (req, res) => {
  const lowStockCount = mockData.products.filter(p => (p.stock || 0) < 10).length;
  
  res.json({
    success: true,
    data: {
      ventas_hoy: mockData.sales.length,
      ordenes_pendientes: mockData.orders.filter(o => o.status === 'pending').length,
      stock_bajo: lowStockCount,
      ingresos_mes: mockData.sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
      total_products: mockData.products.length,
      total_stock: mockData.products.reduce((sum, p) => sum + (p.stock || 0), 0)
    }
  });
});

// AI Chat endpoints
app.post('/api/ai/chat', (req, res) => {
  const { message, context } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }
  
  // Simple AI response logic (mock)
  let response = "Entiendo tu consulta. ¿Podrías ser más específico?";
  
  const msg = message.toLowerCase();
  
  if (msg.includes('stock') || msg.includes('inventario')) {
    const lowStock = mockData.products.filter(p => (p.stock || 0) < 10);
    if (lowStock.length > 0) {
      response = `Tienes ${lowStock.length} productos con stock bajo: ${lowStock.map(p => p.name).join(', ')}`;
    } else {
      response = "Todos los productos tienen stock suficiente.";
    }
  } else if (msg.includes('producto') && (msg.includes('crear') || msg.includes('nuevo'))) {
    response = "Para crear un nuevo producto, necesito: nombre, precio y contexto (web, stock, producción). ¿Qué producto quieres crear?";
  } else if (msg.includes('precio') && msg.includes('cambiar')) {
    response = "Para cambiar precios, dime qué producto y cuál es el nuevo precio.";
  } else if (msg.includes('venta') || msg.includes('ventas')) {
    response = `Hoy se registraron ${mockData.sales.length} ventas por un total de $${mockData.sales.reduce((sum, s) => sum + (s.total || 0), 0)}.`;
  }
  
  res.json({
    success: true,
    response: response,
    timestamp: new Date().toISOString(),
    model_used: 'mock-ai'
  });
});

// Stock endpoints
app.get('/api/stock', (req, res) => {
  const stockData = mockData.products.map(product => ({
    product_id: product.id,
    product_name: product.name,
    current_stock: product.stock || 0,
    unit: 'kg',
    last_updated: product.updated_at || product.created_at
  }));
  
  res.json({
    success: true,
    stock: stockData
  });
});

app.get('/api/stock/low', (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  
  const lowStockProducts = mockData.products
    .filter(p => (p.stock || 0) < threshold)
    .map(product => ({
      product_id: product.id,
      product_name: product.name,
      current_stock: product.stock || 0,
      threshold: threshold,
      unit: 'kg'
    }));
  
  res.json({
    success: true,
    low_stock_products: lowStockProducts,
    count: lowStockProducts.length
  });
});

// ============================================
// 🛒 SALES ENDPOINTS (NEW - POS FUNCTIONALITY)
// ============================================

// Variables globales para almacenar datos (en producción usarías una base de datos)
let salesData = [];
let saleCounter = 1;

// Datos de inventario - Ingredientes
let ingredientsData = [
  {
    id: 1,
    name: "Leche",
    quantity: 45,
    unit: "litros",
    minimum_stock: 20,
    cost_per_unit: 150,
    supplier: "Lácteos del Valle",
    expiry_date: "2025-01-15",
    category: "Lácteos",
    last_updated: new Date().toISOString()
  },
  {
    id: 2,
    name: "Crema de leche",
    quantity: 12,
    unit: "litros",
    minimum_stock: 8,
    cost_per_unit: 450,
    supplier: "Lácteos del Valle",
    expiry_date: "2025-01-10",
    category: "Lácteos",
    last_updated: new Date().toISOString()
  },
  {
    id: 3,
    name: "Azúcar",
    quantity: 25,
    unit: "kg",
    minimum_stock: 10,
    cost_per_unit: 80,
    supplier: "Azucarera Nacional",
    expiry_date: "2025-12-31",
    category: "Endulzantes",
    last_updated: new Date().toISOString()
  },
  {
    id: 4,
    name: "Huevos",
    quantity: 120,
    unit: "unidades",
    minimum_stock: 60,
    cost_per_unit: 12,
    supplier: "Granja San José",
    expiry_date: "2024-12-20",
    category: "Proteínas",
    last_updated: new Date().toISOString()
  },
  {
    id: 5,
    name: "Chocolate en polvo",
    quantity: 8,
    unit: "kg",
    minimum_stock: 5,
    cost_per_unit: 650,
    supplier: "Chocolates Premium",
    expiry_date: "2025-06-30",
    category: "Saborizantes",
    last_updated: new Date().toISOString()
  },
  {
    id: 6,
    name: "Extracto de vainilla",
    quantity: 15,
    unit: "ml",
    minimum_stock: 10,
    cost_per_unit: 25,
    supplier: "Esencias Naturales",
    expiry_date: "2025-08-15",
    category: "Saborizantes",
    last_updated: new Date().toISOString()
  },
  {
    id: 7,
    name: "Fresas frescas",
    quantity: 3,
    unit: "kg",
    minimum_stock: 5,
    cost_per_unit: 420,
    supplier: "Frutas del Campo",
    expiry_date: "2024-12-08",
    category: "Frutas",
    last_updated: new Date().toISOString()
  }
];

let ingredientCounter = 8;

// Datos de recetas
let recipesData = [
  {
    id: 1,
    name: "Helado Vainilla Clásico",
    description: "Receta tradicional de helado de vainilla con ingredientes premium",
    category: "Helados Base",
    yield_quantity: 5, // litros
    yield_unit: "litros",
    preparation_time: 45, // minutos
    freezing_time: 180, // minutos
    difficulty: "Fácil",
    ingredients: [
      { ingredient_id: 1, quantity: 2, unit: "litros" }, // Leche
      { ingredient_id: 2, quantity: 0.5, unit: "litros" }, // Crema
      { ingredient_id: 3, quantity: 0.4, unit: "kg" }, // Azúcar
      { ingredient_id: 4, quantity: 6, unit: "unidades" }, // Huevos
      { ingredient_id: 6, quantity: 2, unit: "ml" } // Vainilla
    ],
    instructions: [
      "Calentar la leche a 70°C",
      "Batir yemas con azúcar hasta blanquear",
      "Agregar leche caliente gradualmente",
      "Cocinar a baño maría hasta 82°C",
      "Enfriar completamente",
      "Agregar crema y vainilla",
      "Procesar en heladora por 30 minutos"
    ],
    cost_calculation: null, // Se calculará automáticamente
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Helado Chocolate Intenso",
    description: "Helado de chocolate con alto contenido de cacao",
    category: "Helados Sabor",
    yield_quantity: 4.5,
    yield_unit: "litros",
    preparation_time: 60,
    freezing_time: 200,
    difficulty: "Intermedio",
    ingredients: [
      { ingredient_id: 1, quantity: 1.8, unit: "litros" },
      { ingredient_id: 2, quantity: 0.6, unit: "litros" },
      { ingredient_id: 3, quantity: 0.5, unit: "kg" },
      { ingredient_id: 4, quantity: 8, unit: "unidades" },
      { ingredient_id: 5, quantity: 0.3, unit: "kg" }
    ],
    instructions: [
      "Disolver chocolate en polvo con leche caliente",
      "Preparar base como helado de vainilla",
      "Incorporar mezcla de chocolate",
      "Procesar en heladora por 35 minutos",
      "Reposar en freezer por 3 horas mínimo"
    ],
    cost_calculation: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Helado Fresa Natural",
    description: "Helado con fresas frescas de temporada",
    category: "Helados Fruta",
    yield_quantity: 4,
    yield_unit: "litros",
    preparation_time: 50,
    freezing_time: 160,
    difficulty: "Intermedio",
    ingredients: [
      { ingredient_id: 1, quantity: 1.5, unit: "litros" },
      { ingredient_id: 2, quantity: 0.4, unit: "litros" },
      { ingredient_id: 3, quantity: 0.35, unit: "kg" },
      { ingredient_id: 4, quantity: 6, unit: "unidades" },
      { ingredient_id: 7, quantity: 1.2, unit: "kg" }
    ],
    instructions: [
      "Lavar y procesar fresas con azúcar",
      "Dejar macerar por 30 minutos",
      "Preparar base de helado",
      "Incorporar pulpa de fresa",
      "Procesar en heladora por 30 minutos"
    ],
    cost_calculation: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let recipeCounter = 4;

// Datos de órdenes de producción
let productionOrdersData = [
  {
    id: 1,
    order_number: 'PO-001',
    recipe_id: 1,
    recipe: {
      id: 1,
      name: 'Helado Vainilla Clásico',
      preparation_time: 45,
      freezing_time: 180,
      recipe_ingredients: [
        { ingredient_id: 1, quantity: 2, unit: "litros" },
        { ingredient_id: 2, quantity: 0.5, unit: "litros" }
      ]
    },
    product_name: 'Helado Vainilla Clásico',
    quantity: 10,
    unit: 'litros',
    status: 'in_progress',
    priority: 'high',
    scheduled_date: new Date().toISOString(),
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    estimated_completion: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    assigned_to: 'Juan Pérez',
    assigned_user_id: '1',
    batch_number: 'BATCH-001',
    notes: 'Producción urgente para reposición',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    order_number: 'PO-002',
    recipe_id: 2,
    recipe: {
      id: 2,
      name: 'Chocolate Premium',
      preparation_time: 60,
      freezing_time: 200,
      recipe_ingredients: [
        { ingredient_id: 1, quantity: 1.8, unit: "litros" },
        { ingredient_id: 5, quantity: 0.3, unit: "kg" }
      ]
    },
    product_name: 'Chocolate Premium',
    quantity: 8,
    unit: 'litros',
    status: 'pending',
    priority: 'medium',
    scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    started_at: null,
    estimated_completion: null,
    assigned_to: null,
    assigned_user_id: null,
    batch_number: null,
    notes: 'Producción programada para mañana',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    order_number: 'PO-003',
    recipe_id: 3,
    recipe: {
      id: 3,
      name: 'Frutilla Natural',
      preparation_time: 50,
      freezing_time: 160,
      recipe_ingredients: [
        { ingredient_id: 1, quantity: 1.5, unit: "litros" },
        { ingredient_id: 7, quantity: 1, unit: "kg" }
      ]
    },
    product_name: 'Frutilla Natural',
    quantity: 12,
    unit: 'litros',
    status: 'completed',
    priority: 'low',
    scheduled_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    started_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    estimated_completion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    assigned_to: 'María García',
    assigned_user_id: '2',
    batch_number: 'BATCH-003',
    notes: 'Completada exitosamente',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let productionOrderCounter = 4;

// Datos de lotes de producción
let productionBatchesData = [
  {
    id: 1,
    batch_number: 'BATCH-001',
    order_id: 1,
    recipe_id: 1,
    status: 'in_progress',
    quantity: 10,
    unit: 'litros',
    quality_check: 'pending',
    temperature: -12,
    assigned_to: 'Juan Pérez',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimated_completion: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    actual_completion: null,
    notes: 'Proceso normal',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    batch_number: 'BATCH-003',
    order_id: 3,
    recipe_id: 3,
    status: 'completed',
    quantity: 12,
    unit: 'litros',
    quality_check: 'approved',
    temperature: -15,
    assigned_to: 'María García',
    start_time: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    estimated_completion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actual_completion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'Lote completado con alta calidad',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

let batchCounter = 3;

// POST /api/sales - Procesar nueva venta desde POS
app.post('/api/sales', (req, res) => {
  try {
    const { 
      items, 
      customer = {}, 
      payment_method = 'cash',
      discount = 0,
      total 
    } = req.body;

    // Validación básica
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required and must be a non-empty array'
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total must be a positive number'
      });
    }

    // Verificar stock disponible y calcular total
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = mockData.products.find(p => p.id === item.product_id);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      if ((product.stock || 0) < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock || 0}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      processedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal
      });
    }

    // Aplicar descuento
    const discountAmount = calculatedTotal * (discount / 100);
    const finalTotal = calculatedTotal - discountAmount;

    // Reducir stock de productos vendidos
    processedItems.forEach(item => {
      const product = mockData.products.find(p => p.id === item.product_id);
      if (product) {
        product.stock = (product.stock || 0) - item.quantity;
      }
    });

    // Crear registro de venta
    const sale = {
      id: saleCounter++,
      date: new Date().toISOString(),
      customer: {
        name: customer.name || 'Cliente sin nombre',
        phone: customer.phone || '',
        email: customer.email || ''
      },
      items: processedItems,
      subtotal: calculatedTotal,
      discount_percentage: discount,
      discount_amount: discountAmount,
      total: finalTotal,
      payment_method: payment_method,
      status: 'completed',
      receipt_number: `REC-${Date.now()}`
    };

    // Guardar venta
    salesData.push(sale);

    // Actualizar métricas del dashboard
    mockData.dashboard.ventas_hoy += finalTotal;
    mockData.dashboard.ordenes_pendientes += 1;

    console.log(`💰 Nueva venta procesada: $${finalTotal} - Recibo: ${sale.receipt_number}`);

    res.status(201).json({
      success: true,
      message: 'Sale processed successfully',
      sale: sale,
      receipt_number: sale.receipt_number,
      stock_updated: processedItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        new_stock: mockData.products.find(p => p.id === item.product_id)?.stock || 0
      }))
    });

  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing sale',
      error: error.message
    });
  }
});

// GET /api/sales - Obtener historial de ventas
app.get('/api/sales', (req, res) => {
  try {
    const { 
      date = null, 
      limit = 50, 
      offset = 0,
      status = null 
    } = req.query;

    let filteredSales = [...salesData];

    // Filtrar por fecha si se proporciona
    if (date) {
      const filterDate = new Date(date).toISOString().split('T')[0];
      filteredSales = filteredSales.filter(sale => 
        sale.date.split('T')[0] === filterDate
      );
    }

    // Filtrar por estado si se proporciona
    if (status) {
      filteredSales = filteredSales.filter(sale => sale.status === status);
    }

    // Ordenar por fecha (más recientes primero)
    filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Aplicar paginación
    const paginatedSales = filteredSales.slice(offset, offset + parseInt(limit));

    // Calcular estadísticas
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;

    res.json({
      success: true,
      sales: paginatedSales,
      pagination: {
        total: filteredSales.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (offset + parseInt(limit)) < filteredSales.length
      },
      summary: {
        total_sales: totalSales,
        total_transactions: totalTransactions,
        average_ticket: totalTransactions > 0 ? totalSales / totalTransactions : 0
      }
    });

  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales',
      error: error.message
    });
  }
});

// GET /api/sales/today - Ventas del día actual
app.get('/api/sales/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData.filter(sale => 
      sale.date.split('T')[0] === today
    );

    const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    res.json({
      success: true,
      date: today,
      sales: todaySales,
      total_sales: totalToday,
      total_transactions: todaySales.length,
      average_ticket: todaySales.length > 0 ? totalToday / todaySales.length : 0
    });

  } catch (error) {
    console.error('Error fetching today sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today sales',
      error: error.message
    });
  }
});

// ============================================
// 📦 INVENTORY ENDPOINTS (NEW - INGREDIENTS)
// ============================================

// GET /api/ingredients - Obtener todos los ingredientes
app.get('/api/ingredients', (req, res) => {
  try {
    const { category = null, low_stock = null } = req.query;
    
    let filteredIngredients = [...ingredientsData];
    
    // Filtrar por categoría si se proporciona
    if (category && category !== 'all') {
      filteredIngredients = filteredIngredients.filter(ingredient => 
        ingredient.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filtrar por stock bajo si se solicita
    if (low_stock === 'true') {
      filteredIngredients = filteredIngredients.filter(ingredient => 
        ingredient.quantity <= ingredient.minimum_stock
      );
    }
    
    // Agregar información calculada y mapear campos para compatibilidad con frontend
    const enrichedIngredients = filteredIngredients.map(ingredient => ({
      ...ingredient,
      // Mapear campos para compatibilidad con frontend
      current_stock: ingredient.quantity,
      min_stock: ingredient.minimum_stock,
      max_stock: ingredient.maximum_stock || ingredient.minimum_stock * 3, // Default max_stock
      unit_cost: ingredient.cost_per_unit,
      supplier_name: ingredient.supplier,
      // Información calculada
      status: ingredient.quantity <= ingredient.minimum_stock ? 'low' : 'normal',
      total_value: ingredient.quantity * ingredient.cost_per_unit,
      days_to_expiry: Math.ceil((new Date(ingredient.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));
    
    res.json({
      success: true,
      ingredients: enrichedIngredients,
      total_count: enrichedIngredients.length,
      categories: [...new Set(ingredientsData.map(i => i.category))],
      low_stock_count: ingredientsData.filter(i => i.quantity <= i.minimum_stock).length
    });
    
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ingredients',
      error: error.message
    });
  }
});

// POST /api/ingredients - Crear nuevo ingrediente
app.post('/api/ingredients', (req, res) => {
  try {
    const {
      name,
      quantity,
      unit,
      minimum_stock,
      cost_per_unit,
      supplier,
      expiry_date,
      category
    } = req.body;
    
    // Validación básica
    if (!name || !unit || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, unit, and category are required'
      });
    }
    
    // Verificar si ya existe un ingrediente con el mismo nombre
    const existingIngredient = ingredientsData.find(ingredient => 
      ingredient.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingIngredient) {
      return res.status(400).json({
        success: false,
        message: `Ingredient '${name}' already exists`
      });
    }
    
    // Crear nuevo ingrediente
    const newIngredient = {
      id: ingredientCounter++,
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      unit: unit.trim(),
      minimum_stock: parseFloat(minimum_stock) || 0,
      cost_per_unit: parseFloat(cost_per_unit) || 0,
      supplier: supplier?.trim() || 'Sin proveedor',
      expiry_date: expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: category.trim(),
      last_updated: new Date().toISOString()
    };
    
    ingredientsData.push(newIngredient);
    
    console.log(`📦 Nuevo ingrediente creado: ${newIngredient.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Ingredient created successfully',
      ingredient: {
        ...newIngredient,
        status: newIngredient.quantity <= newIngredient.minimum_stock ? 'low' : 'normal',
        total_value: newIngredient.quantity * newIngredient.cost_per_unit
      }
    });
    
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ingredient',
      error: error.message
    });
  }
});

// PUT /api/ingredients/:id - Actualizar ingrediente
app.put('/api/ingredients/:id', (req, res) => {
  try {
    const ingredientId = parseInt(req.params.id);
    const updateData = req.body;
    
    const ingredientIndex = ingredientsData.findIndex(ingredient => ingredient.id === ingredientId);
    
    if (ingredientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    // Actualizar ingrediente
    const updatedIngredient = {
      ...ingredientsData[ingredientIndex],
      ...updateData,
      id: ingredientId, // Mantener ID original
      last_updated: new Date().toISOString()
    };
    
    ingredientsData[ingredientIndex] = updatedIngredient;
    
    console.log(`📦 Ingrediente actualizado: ${updatedIngredient.name}`);
    
    res.json({
      success: true,
      message: 'Ingredient updated successfully',
      ingredient: {
        ...updatedIngredient,
        status: updatedIngredient.quantity <= updatedIngredient.minimum_stock ? 'low' : 'normal',
        total_value: updatedIngredient.quantity * updatedIngredient.cost_per_unit
      }
    });
    
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ingredient',
      error: error.message
    });
  }
});

// DELETE /api/ingredients/:id - Eliminar ingrediente
app.delete('/api/ingredients/:id', (req, res) => {
  try {
    const ingredientId = parseInt(req.params.id);
    
    const ingredientIndex = ingredientsData.findIndex(ingredient => ingredient.id === ingredientId);
    
    if (ingredientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    const deletedIngredient = ingredientsData[ingredientIndex];
    ingredientsData.splice(ingredientIndex, 1);
    
    console.log(`📦 Ingrediente eliminado: ${deletedIngredient.name}`);
    
    res.json({
      success: true,
      message: 'Ingredient deleted successfully',
      deleted_ingredient: deletedIngredient
    });
    
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ingredient',
      error: error.message
    });
  }
});

// POST /api/ingredients/:id/add-stock - Agregar stock a ingrediente
app.post('/api/ingredients/:id/add-stock', (req, res) => {
  try {
    const ingredientId = parseInt(req.params.id);
    const { quantity, cost_per_unit } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    const ingredient = ingredientsData.find(ing => ing.id === ingredientId);
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    // Actualizar cantidad
    const oldQuantity = ingredient.quantity;
    ingredient.quantity += parseFloat(quantity);
    
    // Actualizar costo si se proporciona
    if (cost_per_unit && cost_per_unit > 0) {
      ingredient.cost_per_unit = parseFloat(cost_per_unit);
    }
    
    ingredient.last_updated = new Date().toISOString();
    
    console.log(`📦 Stock agregado: ${ingredient.name} +${quantity} ${ingredient.unit}`);
    
    res.json({
      success: true,
      message: `Stock added successfully: +${quantity} ${ingredient.unit}`,
      ingredient: {
        ...ingredient,
        status: ingredient.quantity <= ingredient.minimum_stock ? 'low' : 'normal',
        total_value: ingredient.quantity * ingredient.cost_per_unit
      },
      stock_change: {
        old_quantity: oldQuantity,
        added_quantity: parseFloat(quantity),
        new_quantity: ingredient.quantity
      }
    });
    
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding stock',
      error: error.message
    });
  }
});

// ============================================
// 📝 RECIPES ENDPOINTS (NEW - RECIPE MANAGEMENT)
// ============================================

// Función auxiliar para calcular costo de receta
const calculateRecipeCost = (recipe) => {
  let totalCost = 0;
  let canMake = true;
  let missingIngredients = [];
  
  const enrichedIngredients = recipe.ingredients.map(recipeIngredient => {
    const ingredient = ingredientsData.find(ing => ing.id === recipeIngredient.ingredient_id);
    
    if (!ingredient) {
      canMake = false;
      missingIngredients.push(`Ingrediente ID ${recipeIngredient.ingredient_id} no encontrado`);
      return { ...recipeIngredient, cost: 0, available: false };
    }
    
    const cost = ingredient.cost_per_unit * recipeIngredient.quantity;
    totalCost += cost;
    
    // Verificar si hay suficiente stock
    const hasEnoughStock = ingredient.quantity >= recipeIngredient.quantity;
    if (!hasEnoughStock) {
      canMake = false;
      missingIngredients.push(`${ingredient.name}: necesita ${recipeIngredient.quantity} ${recipeIngredient.unit}, disponible ${ingredient.quantity} ${ingredient.unit}`);
    }
    
    return {
      ...recipeIngredient,
      ingredient_name: ingredient.name,
      cost: cost,
      cost_per_unit: ingredient.cost_per_unit,
      available_stock: ingredient.quantity,
      available: hasEnoughStock
    };
  });
  
  return {
    total_cost: totalCost,
    cost_per_unit: totalCost / recipe.yield_quantity,
    can_make: canMake,
    missing_ingredients: missingIngredients,
    enriched_ingredients: enrichedIngredients
  };
};

// GET /api/recipes - Obtener todas las recetas
app.get('/api/recipes', (req, res) => {
  try {
    const { category = null, difficulty = null, include_costs = 'true' } = req.query;
    
    let filteredRecipes = [...recipesData];
    
    // Filtrar por categoría
    if (category && category !== 'all') {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filtrar por dificultad
    if (difficulty && difficulty !== 'all') {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }
    
    // Enriquecer con costos si se solicita
    const enrichedRecipes = filteredRecipes.map(recipe => {
      if (include_costs === 'true') {
        const costData = calculateRecipeCost(recipe);
        return {
          ...recipe,
          cost_calculation: costData
        };
      }
      return recipe;
    });
    
    res.json({
      success: true,
      recipes: enrichedRecipes,
      total_count: enrichedRecipes.length,
      categories: [...new Set(recipesData.map(r => r.category))],
      difficulties: [...new Set(recipesData.map(r => r.difficulty))]
    });
    
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipes',
      error: error.message
    });
  }
});

// GET /api/recipes/:id - Obtener receta específica
app.get('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const recipe = recipesData.find(r => r.id === recipeId);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    // Enriquecer con información de costos
    const costData = calculateRecipeCost(recipe);
    
    res.json({
      success: true,
      recipe: {
        ...recipe,
        cost_calculation: costData
      }
    });
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipe',
      error: error.message
    });
  }
});

// POST /api/recipes - Crear nueva receta
app.post('/api/recipes', (req, res) => {
  try {
    const {
      name,
      description,
      category,
      yield_quantity,
      yield_unit,
      preparation_time,
      freezing_time,
      difficulty,
      ingredients,
      instructions
    } = req.body;
    
    // Validación básica
    if (!name || !category || !yield_quantity || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, yield_quantity, and ingredients array are required'
      });
    }
    
    // Verificar que todos los ingredientes existen
    const invalidIngredients = ingredients.filter(ing => 
      !ingredientsData.find(ingredient => ingredient.id === ing.ingredient_id)
    );
    
    if (invalidIngredients.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some ingredients not found',
        invalid_ingredients: invalidIngredients
      });
    }
    
    // Crear nueva receta
    const newRecipe = {
      id: recipeCounter++,
      name: name.trim(),
      description: description?.trim() || '',
      category: category.trim(),
      yield_quantity: parseFloat(yield_quantity),
      yield_unit: yield_unit?.trim() || 'litros',
      preparation_time: parseInt(preparation_time) || 0,
      freezing_time: parseInt(freezing_time) || 0,
      difficulty: difficulty?.trim() || 'Fácil',
      ingredients: ingredients.map(ing => ({
        ingredient_id: parseInt(ing.ingredient_id),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit?.trim() || 'unidades'
      })),
      instructions: Array.isArray(instructions) ? instructions : [],
      cost_calculation: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    recipesData.push(newRecipe);
    
    // Calcular costos para la respuesta
    const costData = calculateRecipeCost(newRecipe);
    
    console.log(`📝 Nueva receta creada: ${newRecipe.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      recipe: {
        ...newRecipe,
        cost_calculation: costData
      }
    });
    
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating recipe',
      error: error.message
    });
  }
});

// PUT /api/recipes/:id - Actualizar receta
app.put('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const updateData = req.body;
    
    const recipeIndex = recipesData.findIndex(recipe => recipe.id === recipeId);
    
    if (recipeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    // Actualizar receta
    const updatedRecipe = {
      ...recipesData[recipeIndex],
      ...updateData,
      id: recipeId, // Mantener ID original
      updated_at: new Date().toISOString()
    };
    
    recipesData[recipeIndex] = updatedRecipe;
    
    // Calcular costos actualizados
    const costData = calculateRecipeCost(updatedRecipe);
    
    console.log(`📝 Receta actualizada: ${updatedRecipe.name}`);
    
    res.json({
      success: true,
      message: 'Recipe updated successfully',
      recipe: {
        ...updatedRecipe,
        cost_calculation: costData
      }
    });
    
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recipe',
      error: error.message
    });
  }
});

// DELETE /api/recipes/:id - Eliminar receta
app.delete('/api/recipes/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    const recipeIndex = recipesData.findIndex(recipe => recipe.id === recipeId);
    
    if (recipeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    const deletedRecipe = recipesData[recipeIndex];
    recipesData.splice(recipeIndex, 1);
    
    console.log(`📝 Receta eliminada: ${deletedRecipe.name}`);
    
    res.json({
      success: true,
      message: 'Recipe deleted successfully',
      deleted_recipe: deletedRecipe
    });
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recipe',
      error: error.message
    });
  }
});

// GET /api/recipes/:id/calculate-cost - Recalcular costo de receta
app.get('/api/recipes/:id/calculate-cost', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const recipe = recipesData.find(r => r.id === recipeId);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    const result = calculateRecipeCost(recipe);
    
    // Update the recipe with new cost
    recipe.total_cost = result.total_cost;
    recipe.cost_per_unit = result.cost_per_unit;
    recipe.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      total_cost: result.total_cost,
      cost_per_unit: result.cost_per_unit,
      available: result.available,
      missing_ingredients: result.missing_ingredients,
      breakdown: result.ingredients
    });
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular costo de receta',
      error: error.message
    });
  }
});

// POST /api/recipes/:id/check-availability - Verificar si se puede hacer la receta
app.post('/api/recipes/:id/check-availability', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const { multiplier = 1 } = req.body;
    
    const recipe = recipesData.find(r => r.id === recipeId);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    // Crear una copia de la receta con cantidades multiplicadas
    const scaledRecipe = {
      ...recipe,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * multiplier
      }))
    };
    
    const availability = calculateRecipeCost(scaledRecipe);
    
    res.json({
      success: true,
      recipe_name: recipe.name,
      multiplier: multiplier,
      expected_yield: recipe.yield_quantity * multiplier,
      availability: availability
    });
    
  } catch (error) {
    console.error('Error checking recipe availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking recipe availability',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== PRODUCTION ORDERS ENDPOINTS =====

// GET /api/production_orders - Listar órdenes de producción
app.get('/api/production_orders', (req, res) => {
  try {
    const { status, priority, assigned_to, page = 1, limit = 50 } = req.query;
    
    let filteredOrders = [...productionOrdersData];
    
    // Filtros
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (priority && priority !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.priority === priority);
    }
    
    if (assigned_to && assigned_to !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.assigned_user_id === assigned_to);
    }
    
    // Paginación
    const offset = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        total: filteredOrders.length,
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: filteredOrders.length > offset + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching production orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de producción',
      error: error.message
    });
  }
});

// GET /api/production_orders/:id - Obtener orden específica
app.get('/api/production_orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = productionOrdersData.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    // Incluir lotes asociados
    const batches = productionBatchesData.filter(b => b.order_id === orderId);
    
    res.json({
      success: true,
      order: {
        ...order,
        batches
      }
    });
  } catch (error) {
    console.error('Error fetching production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden de producción',
      error: error.message
    });
  }
});

// POST /api/production_orders - Crear nueva orden
app.post('/api/production_orders', (req, res) => {
  try {
    const {
      recipe_id,
      product_name,
      quantity,
      unit = 'litros',
      priority = 'medium',
      scheduled_date,
      assigned_user_id,
      notes
    } = req.body;
    
    // Validación
    if (!recipe_id || !product_name || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID, nombre del producto y cantidad son requeridos'
      });
    }
    
    // Buscar receta
    const recipe = recipesData.find(r => r.id === recipe_id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }
    
    // Crear nueva orden
    const newOrder = {
      id: productionOrderCounter++,
      order_number: `PO-${String(productionOrderCounter - 1).padStart(3, '0')}`,
      recipe_id,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        preparation_time: recipe.preparation_time,
        freezing_time: recipe.freezing_time,
        recipe_ingredients: recipe.ingredients
      },
      product_name,
      quantity: parseFloat(quantity),
      unit,
      status: 'pending',
      priority,
      scheduled_date: scheduled_date || new Date().toISOString(),
      started_at: null,
      estimated_completion: null,
      assigned_to: assigned_user_id ? getUserName(assigned_user_id) : null,
      assigned_user_id,
      batch_number: null,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    productionOrdersData.push(newOrder);
    
    console.log(`📦 Nueva orden de producción creada: ${newOrder.order_number} - ${newOrder.product_name}`);
    
    res.status(201).json({
      success: true,
      message: 'Orden de producción creada exitosamente',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de producción',
      error: error.message
    });
  }
});

// PUT /api/production_orders/:id - Actualizar orden
app.put('/api/production_orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderIndex = productionOrdersData.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    const {
      recipe_id,
      product_name,
      quantity,
      unit,
      priority,
      scheduled_date,
      assigned_user_id,
      notes
    } = req.body;
    
    // Actualizar campos
    const updatedOrder = {
      ...productionOrdersData[orderIndex],
      ...(recipe_id && { recipe_id }),
      ...(product_name && { product_name }),
      ...(quantity && { quantity: parseFloat(quantity) }),
      ...(unit && { unit }),
      ...(priority && { priority }),
      ...(scheduled_date && { scheduled_date }),
      ...(assigned_user_id !== undefined && { 
        assigned_user_id,
        assigned_to: assigned_user_id ? getUserName(assigned_user_id) : null
      }),
      ...(notes !== undefined && { notes }),
      updated_at: new Date().toISOString()
    };
    
    // Si se cambió la receta, actualizar info de receta
    if (recipe_id && recipe_id !== productionOrdersData[orderIndex].recipe_id) {
      const recipe = recipesData.find(r => r.id === recipe_id);
      if (recipe) {
        updatedOrder.recipe = {
          id: recipe.id,
          name: recipe.name,
          preparation_time: recipe.preparation_time,
          freezing_time: recipe.freezing_time,
          recipe_ingredients: recipe.ingredients
        };
      }
    }
    
    productionOrdersData[orderIndex] = updatedOrder;
    
    res.json({
      success: true,
      message: 'Orden de producción actualizada',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden de producción',
      error: error.message
    });
  }
});

// PUT /api/production_orders/:id/status - Cambiar estado
app.put('/api/production_orders/:id/status', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    const orderIndex = productionOrdersData.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }
    
    const order = productionOrdersData[orderIndex];
    const oldStatus = order.status;
    
    // Actualizar estado y timestamps según el nuevo estado
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'in_progress' && oldStatus === 'pending') {
      updates.started_at = new Date().toISOString();
      // Calcular tiempo estimado de finalización
      const totalTime = (order.recipe.preparation_time || 60) + (order.recipe.freezing_time || 180);
      updates.estimated_completion = new Date(Date.now() + totalTime * 60 * 1000).toISOString();
      
      // Generar número de lote si no existe
      if (!order.batch_number) {
        updates.batch_number = `BATCH-${String(batchCounter++).padStart(3, '0')}`;
      }
    }
    
    productionOrdersData[orderIndex] = { ...order, ...updates };
    
    console.log(`📦 Estado de orden ${order.order_number} cambió de ${oldStatus} a ${status}`);
    
    res.json({
      success: true,
      message: `Estado actualizado a ${status}`,
      order: productionOrdersData[orderIndex]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
});

// DELETE /api/production_orders/:id - Eliminar orden
app.delete('/api/production_orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderIndex = productionOrdersData.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    const order = productionOrdersData[orderIndex];
    
    // No permitir eliminar órdenes en progreso
    if (order.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una orden en progreso'
      });
    }
    
    // Eliminar lotes asociados
    productionBatchesData = productionBatchesData.filter(b => b.order_id !== orderId);
    
    // Eliminar orden
    productionOrdersData.splice(orderIndex, 1);
    
    console.log(`📦 Orden de producción eliminada: ${order.order_number}`);
    
    res.json({
      success: true,
      message: 'Orden de producción eliminada'
    });
  } catch (error) {
    console.error('Error deleting production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar orden de producción',
      error: error.message
    });
  }
});

// ===== PRODUCTION BATCHES ENDPOINTS =====

// GET /api/production_batches - Listar lotes de producción
app.get('/api/production_batches', (req, res) => {
  try {
    const { status, order_id, assigned_to } = req.query;
    
    let filteredBatches = [...productionBatchesData];
    
    if (status && status !== 'all') {
      filteredBatches = filteredBatches.filter(batch => batch.status === status);
    }
    
    if (order_id) {
      filteredBatches = filteredBatches.filter(batch => batch.order_id === parseInt(order_id));
    }
    
    if (assigned_to && assigned_to !== 'all') {
      filteredBatches = filteredBatches.filter(batch => batch.assigned_to === assigned_to);
    }
    
    res.json({
      success: true,
      batches: filteredBatches
    });
  } catch (error) {
    console.error('Error fetching production batches:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes de producción',
      error: error.message
    });
  }
});

// POST /api/production_orders/:id/batches - Asignar lotes a una orden
app.post('/api/production_orders/:id/batches', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { batches } = req.body;
    
    // Validar que la orden existe
    const order = productionOrdersData.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden de producción no encontrada'
      });
    }
    
    // Validar datos de lotes
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de lotes requeridos'
      });
    }
    
    // Eliminar lotes existentes para esta orden
    productionBatchesData = productionBatchesData.filter(b => b.order_id !== orderId);
    
    // Crear nuevos lotes
    const newBatches = batches.map((batchData, index) => ({
      id: Date.now() + index,
      order_id: orderId,
      batch_number: batchData.batch_number,
      quantity: parseFloat(batchData.quantity),
      assigned_to: batchData.assigned_to,
      assigned_user_name: getUserName(batchData.assigned_to),
      start_date: batchData.start_date,
      notes: batchData.notes || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Agregar los nuevos lotes
    productionBatchesData.push(...newBatches);
    
    console.log(`📦 Lotes asignados a orden ${order.order_number}: ${newBatches.length} lotes`);
    
    res.json({
      success: true,
      message: 'Lotes asignados correctamente',
      batches: newBatches
    });
    
  } catch (error) {
    console.error('Error assigning batches:', error);
    res.status(500).json({
      success: false,
      error: 'Error al asignar lotes'
    });
  }
});

// Función auxiliar para obtener nombre de usuario
function getUserName(userId) {
  const userNames = {
    '1': 'Juan Pérez',
    '2': 'María García',
    '3': 'Carlos López'
  };
  return userNames[userId] || 'Usuario desconocido';
}

// ===== SHOP/WEBSHOP ENDPOINTS =====

// Shop configuration data
let shopConfig = {
  storeName: "Venezia Heladería",
  storeDescription: "Los mejores helados artesanales de la ciudad",
  storePhone: "+54 11 1234-5678",
  storeEmail: "info@venezia.com",
  storeAddress: "Av. Corrientes 1234, Buenos Aires",
  deliveryEnabled: true,
  minimumOrderAmount: 1500,
  deliveryFee: 200,
  freeDeliveryThreshold: 3000,
  businessHours: {
    monday: { open: "10:00", close: "22:00" },
    tuesday: { open: "10:00", close: "22:00" },
    wednesday: { open: "10:00", close: "22:00" },
    thursday: { open: "10:00", close: "22:00" },
    friday: { open: "10:00", close: "23:00" },
    saturday: { open: "10:00", close: "23:00" },
    sunday: { open: "11:00", close: "21:00" }
  }
};

// Shop products (products enabled for web shop)
let shopProducts = [
  {
    id: 1,
    productId: 1,
    product: mockData.products.find(p => p.id === 1),
    webPrice: 3800,
    webDescription: "Nuestro clásico helado de chocolate amargo, elaborado con cacao premium",
    webImages: ["/images/chocolate.jpg"],
    isActive: true,
    isFeatured: true
  },
  {
    id: 2,
    productId: 2,
    product: mockData.products.find(p => p.id === 2),
    webPrice: 3500,
    webDescription: "Suave y cremoso helado de vainilla con vainas naturales",
    webImages: ["/images/vainilla.jpg"],
    isActive: true,
    isFeatured: false
  }
];

// Shop orders
let shopOrders = [];
let shopOrderCounter = 1;

// GET /api/shop/config
app.get('/api/shop/config', (req, res) => {
  res.json({
    success: true,
    config: shopConfig
  });
});

// PUT /api/shop/config
app.put('/api/shop/config', (req, res) => {
  try {
    shopConfig = { ...shopConfig, ...req.body };
    res.json({
      success: true,
      message: 'Configuración actualizada',
      config: shopConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración'
    });
  }
});

// GET /api/shop/products
app.get('/api/shop/products', (req, res) => {
  // Enrich shop products with current product data
  const enrichedProducts = shopProducts.map(sp => ({
    ...sp,
    product: mockData.products.find(p => p.id === sp.productId)
  }));
  
  res.json({
    success: true,
    products: enrichedProducts
  });
});

// POST /api/shop/products
app.post('/api/shop/products', (req, res) => {
  try {
    const { productId, webPrice, webDescription, webImages, isActive, isFeatured } = req.body;
    
    // Check if product exists
    const product = mockData.products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Check if already in shop
    if (shopProducts.find(sp => sp.productId === parseInt(productId))) {
      return res.status(400).json({
        success: false,
        error: 'El producto ya está en la tienda web'
      });
    }
    
    const newShopProduct = {
      id: shopProducts.length + 1,
      productId: parseInt(productId),
      product,
      webPrice: parseFloat(webPrice) || product.price,
      webDescription: webDescription || product.description || '',
      webImages: webImages || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false
    };
    
    shopProducts.push(newShopProduct);
    
    res.status(201).json({
      success: true,
      message: 'Producto agregado a la tienda web',
      product: newShopProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al agregar producto'
    });
  }
});

// PUT /api/shop/products/:id
app.put('/api/shop/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const shopProductIndex = shopProducts.findIndex(sp => sp.id === productId);
    
    if (shopProductIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado en la tienda web'
      });
    }
    
    shopProducts[shopProductIndex] = {
      ...shopProducts[shopProductIndex],
      ...req.body,
      id: productId // Preserve ID
    };
    
    res.json({
      success: true,
      message: 'Producto actualizado',
      product: shopProducts[shopProductIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto'
    });
  }
});

// PUT /api/shop/products/:id/toggle
app.put('/api/shop/products/:id/toggle', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const shopProductIndex = shopProducts.findIndex(sp => sp.id === productId);
    
    if (shopProductIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    shopProducts[shopProductIndex].isActive = req.body.isActive;
    
    res.json({
      success: true,
      message: `Producto ${req.body.isActive ? 'activado' : 'desactivado'}`,
      product: shopProducts[shopProductIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del producto'
    });
  }
});

// GET /api/shop/orders
app.get('/api/shop/orders', (req, res) => {
  res.json({
    success: true,
    orders: shopOrders
  });
});

// POST /api/shop/orders - Create a test order (for demo purposes)
app.post('/api/shop/orders', (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, total, deliveryAddress, notes } = req.body;
    
    if (!customerName || !customerEmail || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, email, items, and total are required'
      });
    }
    
    const newOrder = {
      id: shopOrderCounter++,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      items: items || [],
      total: parseFloat(total),
      status: 'pending',
      deliveryAddress: deliveryAddress || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    shopOrders.push(newOrder);
    
    console.log(`🛒 Nueva orden web creada: #${newOrder.id} - ${newOrder.customerName} - $${newOrder.total}`);
    
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear la orden'
    });
  }
});

// PUT /api/shop/orders/:id/status
app.put('/api/shop/orders/:id/status', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderIndex = shopOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }
    
    shopOrders[orderIndex].status = req.body.status;
    shopOrders[orderIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Estado de orden actualizado',
      order: shopOrders[orderIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado de orden'
    });
  }
});

// ===== DELIVERIES ENDPOINTS =====

// Mock delivery data
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
      neighborhood: 'Palermo',
      city: 'Buenos Aires',
      instructions: 'Timbre 3A'
    },
    status: 'pending',
    priority: 'normal',
    scheduled_date: new Date().toISOString(),
    scheduled_time: '15:00-17:00',
    estimated_time: '30-45 min',
    total_amount: 3800,
    items: [
      { product_name: 'Helado Chocolate', quantity: 2, price: 1900 }
    ],
    notes: 'Cliente prefiere entrega por la tarde',
    created_at: new Date().toISOString(),
    created_by: 'admin'
  },
  {
    id: 2,
    order_id: 2,
    order_number: 'ORD-002',
    driver_id: 1,
    driver_name: 'Carlos Rodriguez',
    customer_name: 'Juan Pérez',
    customer_phone: '+54 11 3456-7890',
    address: {
      street: 'Av. Corrientes',
      number: '2500',
      neighborhood: 'Balvanera',
      city: 'Buenos Aires',
      instructions: 'Portón verde'
    },
    status: 'in_transit',
    priority: 'high',
    scheduled_date: new Date().toISOString(),
    scheduled_time: '13:00-15:00',
    estimated_time: '20-30 min',
    total_amount: 5600,
    items: [
      { product_name: 'Helado Vainilla', quantity: 1, price: 3200 },
      { product_name: 'Helado Dulce de Leche', quantity: 1, price: 2400 }
    ],
    notes: '',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
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
    active_deliveries: 2
  },
  {
    id: 2,
    name: 'Ana Martínez',
    phone: '+54 11 8765-4321',
    vehicle: 'Bicicleta eléctrica',
    license: 'BIC456',
    available: true,
    current_location: { lat: -34.6118, lng: -58.3960 },
    active_deliveries: 0
  }
];

let deliveryCounter = 3;

// GET /api/deliveries
app.get('/api/deliveries', (req, res) => {
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
      const filterDate = new Date(date).toISOString().split('T')[0];
      filteredDeliveries = filteredDeliveries.filter(d => 
        d.scheduled_date.split('T')[0] === filterDate
      );
    }
    
    res.json(filteredDeliveries);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener entregas'
    });
  }
});

// POST /api/deliveries
app.post('/api/deliveries', (req, res) => {
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
      estimated_time,
      notes
    } = req.body;
    
    // Basic validation
    if (!customer_name || !customer_phone || !address?.street) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos'
      });
    }
    
    // Find order data if order_id is provided
    let orderData = null;
    if (order_id) {
      orderData = salesData.find(sale => sale.id === parseInt(order_id));
    }
    
    const newDelivery = {
      id: deliveryCounter++,
      order_id: order_id ? parseInt(order_id) : null,
      order_number: order_id ? `ORD-${order_id.toString().padStart(3, '0')}` : `DEL-${deliveryCounter.toString().padStart(3, '0')}`,
      driver_id: driver_id ? parseInt(driver_id) : null,
      driver_name: driver_id ? drivers.find(d => d.id === parseInt(driver_id))?.name : null,
      customer_name,
      customer_phone,
      address,
      status: 'pending',
      priority: priority || 'normal',
      scheduled_date: scheduled_date || new Date().toISOString(),
      scheduled_time,
      estimated_time: estimated_time || '30-45 min',
      total_amount: orderData ? orderData.total : 0,
      items: orderData ? orderData.items : [],
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
    res.status(500).json({
      success: false,
      error: 'Error al crear la entrega'
    });
  }
});

// PUT /api/deliveries/:id
app.put('/api/deliveries/:id', (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la entrega'
    });
  }
});

// PUT /api/deliveries/:id/status
app.put('/api/deliveries/:id/status', (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado'
    });
  }
});

// DELETE /api/deliveries/:id
app.delete('/api/deliveries/:id', (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Error al cancelar la entrega'
    });
  }
});

// GET /api/drivers
app.get('/api/drivers', (req, res) => {
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
    res.status(500).json({
      success: false,
      error: 'Error al obtener repartidores'
    });
  }
});

// ===== ANALYTICS ENDPOINTS =====

// GET /api/analytics/sales - Analytics de ventas
app.get('/api/analytics/sales', (req, res) => {
  try {
    const { start_date, end_date, period = 'daily' } = req.query;
    
    // Calcular métricas de ventas
    const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = salesData.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Sales by period (últimos 30 días para demo)
    const salesByPeriod = generateSalesTimeSeriesData(30);
    
    // Top products por ventas
    const productSales = {};
    salesData.forEach(sale => {
      sale.items?.forEach(item => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = {
            name: item.product_name,
            units_sold: 0,
            revenue: 0
          };
        }
        productSales[item.product_name].units_sold += item.quantity;
        productSales[item.product_name].revenue += item.total_price;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        ...product,
        percentage: totalSales > 0 ? (product.revenue / totalSales * 100) : 0
      }));

    res.json({
      success: true,
      data: {
        total_sales: totalSales,
        total_orders: totalOrders,
        avg_ticket: Math.round(avgTicket),
        sales_growth: 18.5, // Mock data for demo
        orders_growth: 12.3,
        ticket_growth: 5.5,
        top_products: topProducts,
        sales_by_period: salesByPeriod
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics de ventas',
      error: error.message
    });
  }
});

// GET /api/analytics/products - Analytics de productos
app.get('/api/analytics/products', (req, res) => {
  try {
    // Calcular métricas de productos
    const productAnalytics = {};
    
    salesData.forEach(sale => {
      sale.items?.forEach(item => {
        if (!productAnalytics[item.product_id]) {
          productAnalytics[item.product_id] = {
            id: item.product_id,
            name: item.product_name,
            units_sold: 0,
            revenue: 0,
            avg_price: item.unit_price
          };
        }
        productAnalytics[item.product_id].units_sold += item.quantity;
        productAnalytics[item.product_id].revenue += item.total_price;
      });
    });
    
    const totalRevenue = Object.values(productAnalytics)
      .reduce((sum, product) => sum + product.revenue, 0);
    
    const topProducts = Object.values(productAnalytics)
      .map(product => ({
        ...product,
        percentage: totalRevenue > 0 ? (product.revenue / totalRevenue * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    // Stock status analysis
    const stockAnalysis = mockData.products.map(product => {
      const analytics = productAnalytics[product.id] || { units_sold: 0, revenue: 0 };
      return {
        id: product.id,
        name: product.name,
        current_stock: product.stock,
        units_sold: analytics.units_sold,
        revenue: analytics.revenue,
        stock_status: product.stock < 10 ? 'low' : product.stock < 20 ? 'medium' : 'high'
      };
    });

    res.json({
      success: true,
      data: {
        top_products: topProducts.slice(0, 10),
        stock_analysis: stockAnalysis,
        total_products: mockData.products.length,
        low_stock_count: stockAnalysis.filter(p => p.stock_status === 'low').length
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics de productos',
      error: error.message
    });
  }
});

// GET /api/analytics/customers - Analytics de clientes
app.get('/api/analytics/customers', (req, res) => {
  try {
    // Análisis de clientes
    const customerAnalytics = {};
    
    salesData.forEach(sale => {
      const customerKey = sale.customer?.name || 'Sin nombre';
      if (!customerAnalytics[customerKey]) {
        customerAnalytics[customerKey] = {
          name: customerKey,
          phone: sale.customer?.phone || '',
          email: sale.customer?.email || '',
          orders: 0,
          total_spent: 0,
          avg_ticket: 0,
          last_order: null
        };
      }
      
      customerAnalytics[customerKey].orders += 1;
      customerAnalytics[customerKey].total_spent += sale.total;
      customerAnalytics[customerKey].last_order = sale.date;
    });
    
    // Calcular promedio por cliente
    Object.values(customerAnalytics).forEach(customer => {
      customer.avg_ticket = customer.orders > 0 ? customer.total_spent / customer.orders : 0;
    });
    
    const topCustomers = Object.values(customerAnalytics)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);
    
    const totalCustomers = Object.keys(customerAnalytics).length;
    const totalRevenue = Object.values(customerAnalytics)
      .reduce((sum, customer) => sum + customer.total_spent, 0);
    const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    res.json({
      success: true,
      data: {
        top_customers: topCustomers,
        total_customers: totalCustomers,
        avg_customer_value: Math.round(avgCustomerValue),
        repeat_customers: Object.values(customerAnalytics).filter(c => c.orders > 1).length,
        new_customers_trend: generateCustomerTrendData(30)
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics de clientes',
      error: error.message
    });
  }
});

// GET /api/analytics/dashboard - Dashboard analytics
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Ventas de hoy
    const todaySales = salesData.filter(sale => 
      new Date(sale.date) >= startOfDay
    );
    
    // Ventas del mes
    const monthSales = salesData.filter(sale => 
      new Date(sale.date) >= startOfMonth
    );
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Órdenes de producción
    const pendingOrders = productionOrdersData.filter(order => order.status === 'pending').length;
    const inProgressOrders = productionOrdersData.filter(order => order.status === 'in_progress').length;
    
    // Stock bajo
    const lowStockProducts = mockData.products.filter(product => product.stock < 10).length;

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          orders: todaySales.length,
          avg_ticket: todaySales.length > 0 ? todayRevenue / todaySales.length : 0
        },
        month: {
          revenue: monthRevenue,
          orders: monthSales.length,
          avg_ticket: monthSales.length > 0 ? monthRevenue / monthSales.length : 0
        },
        production: {
          pending_orders: pendingOrders,
          in_progress_orders: inProgressOrders,
          completed_today: productionOrdersData.filter(order => 
            order.status === 'completed' && 
            new Date(order.updated_at) >= startOfDay
          ).length
        },
        inventory: {
          low_stock_products: lowStockProducts,
          total_products: mockData.products.length,
          total_stock_value: mockData.products.reduce((sum, p) => sum + (p.stock * p.price), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics del dashboard',
      error: error.message
    });
  }
});

// Funciones auxiliares para generar datos de series temporales
function generateSalesTimeSeriesData(days) {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generar datos mock basados en ventas reales si existen
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const daySales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= dayStart && saleDate < dayEnd;
    });
    
    const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
    const orders = daySales.length;
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: revenue || Math.floor(Math.random() * 5000) + 1000, // Mock data si no hay ventas reales
      orders: orders || Math.floor(Math.random() * 20) + 5,
      avg_ticket: orders > 0 ? revenue / orders : Math.floor(Math.random() * 300) + 100
    });
  }
  
  return data;
}

function generateCustomerTrendData(days) {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      new_customers: Math.floor(Math.random() * 10) + 1,
      returning_customers: Math.floor(Math.random() * 15) + 5
    });
  }
  
  return data;
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// GET /api/stock_data - Obtener datos de stock consolidados
app.get('/api/stock_data', (req, res) => {
  try {
    // Calcular estadísticas de stock
    const totalIngredients = ingredientsData.length;
    const lowStockIngredients = ingredientsData.filter(i => i.quantity <= i.minimum_stock && i.quantity > 0).length;
    const outOfStockIngredients = ingredientsData.filter(i => i.quantity <= 0).length;
    const totalValue = ingredientsData.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0);
    
    // Obtener categorías únicas
    const categories = [...new Set(ingredientsData.map(i => i.category))];
    
    // Ingredientes por categoría
    const ingredientsByCategory = categories.map(category => ({
      category,
      count: ingredientsData.filter(i => i.category === category).length,
      total_value: ingredientsData
        .filter(i => i.category === category)
        .reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0)
    }));
    
    // Ingredientes próximos a expirar
    const expiringIngredients = ingredientsData.filter(ingredient => {
      const daysToExpiry = Math.ceil((new Date(ingredient.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 7 && daysToExpiry > 0;
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          total_ingredients: totalIngredients,
          low_stock_count: lowStockIngredients,
          out_of_stock_count: outOfStockIngredients,
          total_value: totalValue,
          categories_count: categories.length
        },
        categories: ingredientsByCategory,
        alerts: {
          low_stock: lowStockIngredients,
          out_of_stock: outOfStockIngredients,
          expiring_soon: expiringIngredients.length
        },
        recent_updates: ingredientsData
          .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
          .slice(0, 5)
          .map(ingredient => ({
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            updated_at: ingredient.last_updated
          }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock data',
      error: error.message
    });
  }
});

// GET /api/providers - Obtener lista de proveedores
app.get('/api/providers', (req, res) => {
  try {
    // Extraer proveedores únicos de los ingredientes
    const providers = [...new Set(ingredientsData.map(i => i.supplier))]
      .filter(supplier => supplier) // Filtrar valores nulos/undefined
      .map((supplier, index) => ({
        id: index + 1,
        name: supplier,
        contact_info: `contacto@${supplier.toLowerCase().replace(/\s+/g, '')}.com`,
        ingredients_count: ingredientsData.filter(i => i.supplier === supplier).length,
        total_value: ingredientsData
          .filter(i => i.supplier === supplier)
          .reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0),
        status: 'active',
        created_at: new Date().toISOString()
      }));
    
    res.json({
      success: true,
      providers,
      total_count: providers.length
    });
    
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
});

// GET /api/provider_categories - Obtener categorías de proveedores
app.get('/api/provider_categories', (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Lácteos', description: 'Proveedores de productos lácteos' },
      { id: 2, name: 'Frutas', description: 'Proveedores de frutas frescas' },
      { id: 3, name: 'Chocolates', description: 'Proveedores de chocolates y coberturas' },
      { id: 4, name: 'Envases', description: 'Proveedores de envases y empaques' },
      { id: 5, name: 'Insumos', description: 'Proveedores de otros insumos' }
    ];
    
    res.json({
      success: true,
      data: categories,
      categories // Para compatibilidad con el frontend
    });
    
  } catch (error) {
    console.error('Error fetching provider categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider categories',
      error: error.message
    });
  }
});

// POST /api/providers/add - Agregar nuevo proveedor
app.post('/api/providers/add', (req, res) => {
  try {
    const { name, contact_person, phone, email, address, cuit, category_id, notes } = req.body;
    
    // Validación básica
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }
    
    // En una aplicación real, aquí guardarías en la base de datos
    // Por ahora, simulamos el éxito
    const newProvider = {
      id: Date.now(), // ID temporal
      name,
      contact_person: contact_person || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      cuit: cuit || '',
      category_id: category_id || null,
      notes: notes || '',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Proveedor agregado exitosamente',
      provider: newProvider
    });
    
  } catch (error) {
    console.error('Error adding provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar proveedor',
      error: error.message
    });
  }
});

// POST /api/providers/edit - Editar proveedor existente
app.post('/api/providers/edit', (req, res) => {
  try {
    const { id, name, contact_person, phone, email, address, cuit, category_id, notes } = req.body;
    
    // Validación básica
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: 'ID y nombre del proveedor son requeridos'
      });
    }
    
    // En una aplicación real, aquí actualizarías en la base de datos
    const updatedProvider = {
      id,
      name,
      contact_person: contact_person || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      cuit: cuit || '',
      category_id: category_id || null,
      notes: notes || '',
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      provider: updatedProvider
    });
    
  } catch (error) {
    console.error('Error editing provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar proveedor',
      error: error.message
    });
  }
});

// DELETE /api/providers/:id - Eliminar proveedor
app.delete('/api/providers/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del proveedor es requerido'
      });
    }
    
    // En una aplicación real, aquí eliminarías de la base de datos
    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
      deleted_id: id
    });
    
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Venezia Backend API running on port ${PORT}`);
  console.log(`📊 Mock data loaded: ${mockData.products.length} products`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;