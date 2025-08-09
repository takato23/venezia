// Temporary mock endpoints for missing routes

module.exports = function(app) {
  // Alerts endpoint
  app.get('/api/alerts', (req, res) => {
    res.json({
      success: true,
      alerts: []
    });
  });

  // Ingredients endpoint
  app.get('/api/ingredients', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Leche',
          quantity: 100,
          unit: 'litros',
          cost_per_unit: 5,
          minimum_stock: 20
        },
        {
          id: 2,
          name: 'Azúcar',
          quantity: 50,
          unit: 'kg',
          cost_per_unit: 3,
          minimum_stock: 10
        }
      ]
    });
  });

  // Recipes endpoint
  app.get('/api/recipes', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Helado de Vainilla',
          product_id: 1,
          ingredients: []
        },
        {
          id: 2,
          name: 'Helado de Chocolate',
          product_id: 2,
          ingredients: []
        }
      ]
    });
  });

  // Users endpoint
  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Admin',
          email: 'admin@venezia.com',
          role: 'admin'
        }
      ]
    });
  });

  // Update products endpoint with more complete data
  app.get('/api/products', (req, res) => {
    res.json({
      success: true,
      data: [
        // Helados
        {
          id: 1,
          name: '1/4 Kg',
          price: 450,
          category: { id: 1, name: 'Helados' },
          max_flavors: 2,
          active: true
        },
        {
          id: 2,
          name: '1/2 Kg',
          price: 850,
          category: { id: 1, name: 'Helados' },
          max_flavors: 3,
          active: true
        },
        {
          id: 3,
          name: '1 Kg',
          price: 1600,
          category: { id: 1, name: 'Helados' },
          max_flavors: 4,
          active: true
        },
        {
          id: 4,
          name: 'Cono Simple',
          price: 180,
          category: { id: 1, name: 'Helados' },
          max_flavors: 1,
          active: true
        },
        {
          id: 5,
          name: 'Cono Doble',
          price: 320,
          category: { id: 1, name: 'Helados' },
          max_flavors: 2,
          active: true
        },
        {
          id: 6,
          name: 'Vaso Chico',
          price: 250,
          category: { id: 1, name: 'Helados' },
          max_flavors: 2,
          active: true
        },
        {
          id: 7,
          name: 'Vaso Grande',
          price: 400,
          category: { id: 1, name: 'Helados' },
          max_flavors: 3,
          active: true
        },
        // Otros productos
        {
          id: 8,
          name: 'Café',
          price: 120,
          category: { id: 2, name: 'Bebidas' },
          max_flavors: 0,
          active: true
        },
        {
          id: 9,
          name: 'Agua Mineral',
          price: 80,
          category: { id: 2, name: 'Bebidas' },
          max_flavors: 0,
          active: true
        },
        {
          id: 10,
          name: 'Torta Helada (porción)',
          price: 350,
          category: { id: 3, name: 'Postres' },
          max_flavors: 0,
          active: true
        }
      ]
    });
  });

  // Deliveries endpoint (for connection status check)
  app.get('/api/deliveries', (req, res) => {
    res.json({
      success: true,
      data: []
    });
  });

  // Sales endpoints
  app.get('/api/sales', (req, res) => {
    res.json({
      success: true,
      sales: [],
      total: 0,
      message: "Sales endpoint placeholder"
    });
  });

  app.get('/api/sales/today', (req, res) => {
    res.json({
      success: true,
      sales: [],
      total: 0,
      totalAmount: 0,
      message: "Today's sales placeholder"
    });
  });

  // Stock data endpoint
  app.get('/api/stock_data', (req, res) => {
    res.json({
      success: true,
      stock: [],
      lowStock: [],
      outOfStock: []
    });
  });

  // Categories endpoint
  app.get('/api/categories', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Helados', description: 'Helados artesanales' },
        { id: 2, name: 'Postres', description: 'Postres helados' },
        { id: 3, name: 'Bebidas', description: 'Bebidas frías' }
      ]
    });
  });

  // Production batches endpoint
  app.get('/api/production_batches', (req, res) => {
    res.json({
      success: true,
      batches: [
        {
          id: 1,
          batch_number: 'BATCH-001',
          product_id: 1,
          product_name: 'Helado de Vainilla',
          quantity: 50,
          unit: 'litros',
          status: 'completed',
          progress: 100,
          assigned_user_id: 1,
          assigned_user_name: 'Admin',
          scheduled_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          notes: 'Lote completado exitosamente'
        },
        {
          id: 2,
          batch_number: 'BATCH-002',
          product_id: 2,
          product_name: 'Helado de Chocolate',
          quantity: 30,
          unit: 'litros',
          status: 'in_progress',
          progress: 65,
          assigned_user_id: 1,
          assigned_user_name: 'Admin',
          scheduled_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          notes: 'En proceso de producción'
        }
      ]
    });
  });

  // Individual production batch endpoint
  app.get('/api/production_batches/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const batches = [
      {
        id: 1,
        batch_number: 'BATCH-001',
        product_id: 1,
        product_name: 'Helado de Vainilla',
        quantity: 50,
        unit: 'litros',
        status: 'completed',
        progress: 100,
        assigned_user_id: 1,
        assigned_user_name: 'Admin',
        scheduled_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        notes: 'Lote completado exitosamente'
      }
    ];
    
    const batch = batches.find(b => b.id === id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    res.json({
      success: true,
      data: batch
    });
  });

  // Update batch status
  app.put('/api/production_batches/:id/status', (req, res) => {
    const { status } = req.body;
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: { id: req.params.id, status }
    });
  });

  // Create/Update production batch
  app.post('/api/production_batches', (req, res) => {
    res.json({
      success: true,
      message: 'Batch created successfully',
      data: { id: Date.now(), ...req.body }
    });
  });

  app.put('/api/production_batches/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: { id: req.params.id, ...req.body }
    });
  });

  // Delete production batch
  app.delete('/api/production_batches/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  });

  // Payment config endpoint
  app.get('/api/payments/config', (req, res) => {
    res.json({
      success: true,
      config: {
        methods: ['cash', 'credit_card', 'debit_card', 'transfer'],
        default_method: 'cash'
      }
    });
  });

  // ==================== TRANSACTIONS ENDPOINTS ====================
  app.get('/api/transactions', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          type: 'sale',
          amount: 1250,
          description: 'Venta de helados',
          date: new Date().toISOString(),
          customer_id: 1,
          store_id: 1,
          user_id: 1,
          items: [
            { product: 'Helado Chocolate', quantity: 2, price: 450 },
            { product: 'Helado Vainilla', quantity: 1, price: 350 }
          ]
        },
        {
          id: 2,
          type: 'purchase',
          amount: -500,
          description: 'Compra de ingredientes',
          date: new Date(Date.now() - 86400000).toISOString(),
          supplier: 'Proveedor ABC',
          store_id: 1,
          user_id: 1
        }
      ],
      total: 2,
      totalAmount: 750,
      summary: {
        totalSales: 1250,
        totalPurchases: 500,
        netAmount: 750
      }
    });
  });

  app.get('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const transaction = {
      id: id,
      type: 'sale',
      amount: 1250,
      description: 'Venta de helados',
      date: new Date().toISOString(),
      customer_id: 1,
      store_id: 1,
      user_id: 1,
      items: [
        { product: 'Helado Chocolate', quantity: 2, price: 450 },
        { product: 'Helado Vainilla', quantity: 1, price: 350 }
      ]
    };
    
    res.json({
      success: true,
      data: transaction
    });
  });

  app.post('/api/transactions', (req, res) => {
    const newTransaction = {
      id: Date.now(),
      ...req.body,
      date: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: newTransaction
    });
  });

  // ==================== AUTH SESSIONS ENDPOINTS ====================
  app.get('/api/auth/sessions', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          user_id: 1,
          user_name: 'Admin User',
          user_email: 'admin@venezia.com',
          login_time: new Date(Date.now() - 3600000).toISOString(),
          last_activity: new Date().toISOString(),
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          active: true,
          location: 'Buenos Aires, Argentina'
        },
        {
          id: 2,
          user_id: 2,
          user_name: 'Empleado Test',
          user_email: 'empleado@venezia.com',
          login_time: new Date(Date.now() - 7200000).toISOString(),
          last_activity: new Date(Date.now() - 1800000).toISOString(),
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          active: false,
          location: 'Buenos Aires, Argentina'
        }
      ],
      total: 2,
      activeSessionsCount: 1
    });
  });

  app.delete('/api/auth/sessions/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Sesión terminada exitosamente',
      sessionId: req.params.id
    });
  });

  app.post('/api/auth/logout-all', (req, res) => {
    res.json({
      success: true,
      message: 'Todas las sesiones han sido terminadas',
      terminatedSessions: 2
    });
  });

  // ==================== BRANCHES ENDPOINTS ====================
  app.get('/api/branches', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Heladería Venezia - Centro',
          code: 'VEN001',
          address: 'Av. Corrientes 1234, CABA',
          phone: '+54 11 4567-8900',
          email: 'centro@venezia.com',
          coordinates: { lat: -34.6037, lng: -58.3816 },
          timezone: 'America/Argentina/Buenos_Aires',
          opening_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '12:00', close: '22:00' }
          },
          features: ['delivery', 'dine_in', 'takeaway', 'wifi'],
          settings: {
            max_delivery_distance: 5,
            delivery_fee: 200,
            min_order_amount: 1000,
            tax_rate: 21,
            currency: 'ARS'
          },
          is_main_branch: true,
          is_active: true,
          organization_id: 'demo',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Heladería Venezia - Palermo',
          code: 'VEN002',
          address: 'Av. Santa Fe 3456, Palermo',
          phone: '+54 11 4567-8901',
          email: 'palermo@venezia.com',
          coordinates: { lat: -34.5875, lng: -58.3974 },
          timezone: 'America/Argentina/Buenos_Aires',
          opening_hours: {
            monday: { open: '11:00', close: '23:00' },
            tuesday: { open: '11:00', close: '23:00' },
            wednesday: { open: '11:00', close: '23:00' },
            thursday: { open: '11:00', close: '23:00' },
            friday: { open: '11:00', close: '00:00' },
            saturday: { open: '11:00', close: '00:00' },
            sunday: { open: '11:00', close: '23:00' }
          },
          features: ['delivery', 'dine_in', 'takeaway', 'parking', 'wifi', 'outdoor'],
          settings: {
            max_delivery_distance: 7,
            delivery_fee: 250,
            min_order_amount: 800,
            tax_rate: 21,
            currency: 'ARS'
          },
          is_main_branch: false,
          is_active: true,
          organization_id: 'demo',
          created_at: new Date().toISOString()
        }
      ],
      total: 2
    });
  });

  app.get('/api/branches/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const branches = [
      {
        id: 1,
        name: 'Heladería Venezia - Centro',
        code: 'VEN001',
        address: 'Av. Corrientes 1234, CABA',
        phone: '+54 11 4567-8900',
        email: 'centro@venezia.com',
        coordinates: { lat: -34.6037, lng: -58.3816 },
        timezone: 'America/Argentina/Buenos_Aires',
        opening_hours: {
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '12:00', close: '22:00' }
        },
        features: ['delivery', 'dine_in', 'takeaway', 'wifi'],
        settings: {
          max_delivery_distance: 5,
          delivery_fee: 200,
          min_order_amount: 1000,
          tax_rate: 21,
          currency: 'ARS'
        },
        is_main_branch: true,
        is_active: true,
        organization_id: 'demo'
      }
    ];
    
    const branch = branches.find(b => b.id === id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: branch
    });
  });

  app.post('/api/branches', (req, res) => {
    const newBranch = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: newBranch
    });
  });

  app.put('/api/branches/:id', (req, res) => {
    const updatedBranch = {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: updatedBranch
    });
  });

  app.delete('/api/branches/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Sucursal eliminada exitosamente'
    });
  });

  // ==================== PRODUCTS ENDPOINTS ====================
  app.get('/api/products', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Helado de Vainilla',
          description: 'Delicioso helado cremoso de vainilla natural',
          price: 350,
          cost: 180,
          category_id: 1,
          category_name: 'Helados',
          stock: 25,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          sku: 'HEL-VAN-001',
          barcode: '7891234567890',
          is_active: true,
          image_url: '/images/helado-vainilla.jpg',
          ingredients: ['Leche', 'Crema', 'Azúcar', 'Vainilla'],
          allergens: ['Lactosa'],
          nutritional_info: {
            calories: 180,
            fat: 8,
            carbs: 22,
            protein: 4
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Helado de Chocolate',
          description: 'Intenso helado de chocolate belga premium',
          price: 380,
          cost: 200,
          category_id: 1,
          category_name: 'Helados',
          stock: 20,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          sku: 'HEL-CHO-001',
          barcode: '7891234567891',
          is_active: true,
          image_url: '/images/helado-chocolate.jpg',
          ingredients: ['Leche', 'Crema', 'Azúcar', 'Cacao', 'Chocolate'],
          allergens: ['Lactosa'],
          nutritional_info: {
            calories: 200,
            fat: 10,
            carbs: 24,
            protein: 5
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Helado de Fresa',
          description: 'Refrescante helado con trozos de fresa natural',
          price: 360,
          cost: 190,
          category_id: 1,
          category_name: 'Helados',
          stock: 18,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          sku: 'HEL-FRE-001',
          barcode: '7891234567892',
          is_active: true,
          image_url: '/images/helado-fresa.jpg',
          ingredients: ['Leche', 'Crema', 'Azúcar', 'Fresa'],
          allergens: ['Lactosa'],
          nutritional_info: {
            calories: 170,
            fat: 7,
            carbs: 25,
            protein: 4
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Paleta de Limón',
          description: 'Paleta refrescante de limón natural',
          price: 150,
          cost: 75,
          category_id: 2,
          category_name: 'Paletas',
          stock: 50,
          min_stock: 10,
          max_stock: 100,
          unit: 'unidades',
          sku: 'PAL-LIM-001',
          barcode: '7891234567893',
          is_active: true,
          image_url: '/images/paleta-limon.jpg',
          ingredients: ['Agua', 'Azúcar', 'Limón'],
          allergens: [],
          nutritional_info: {
            calories: 80,
            fat: 0,
            carbs: 20,
            protein: 0
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Sundae Especial',
          description: 'Sundae con helado, frutas y crema batida',
          price: 450,
          cost: 220,
          category_id: 3,
          category_name: 'Postres',
          stock: 15,
          min_stock: 3,
          max_stock: 30,
          unit: 'porciones',
          sku: 'SUN-ESP-001',
          barcode: '7891234567894',
          is_active: true,
          image_url: '/images/sundae-especial.jpg',
          ingredients: ['Helado', 'Frutas', 'Crema', 'Jarabe'],
          allergens: ['Lactosa'],
          nutritional_info: {
            calories: 320,
            fat: 15,
            carbs: 40,
            protein: 8
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 5,
      categories: [
        { id: 1, name: 'Helados', count: 3 },
        { id: 2, name: 'Paletas', count: 1 },
        { id: 3, name: 'Postres', count: 1 }
      ]
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const products = [
      {
        id: 1,
        name: 'Helado de Vainilla',
        description: 'Delicioso helado cremoso de vainilla natural',
        price: 350,
        cost: 180,
        category_id: 1,
        category_name: 'Helados',
        stock: 25,
        min_stock: 5,
        max_stock: 50,
        unit: 'litros',
        sku: 'HEL-VAN-001',
        barcode: '7891234567890',
        is_active: true,
        image_url: '/images/helado-vainilla.jpg',
        ingredients: ['Leche', 'Crema', 'Azúcar', 'Vainilla'],
        allergens: ['Lactosa'],
        nutritional_info: {
          calories: 180,
          fat: 8,
          carbs: 22,
          protein: 4
        }
      }
    ];
    
    const product = products.find(p => p.id === id) || products[0];
    res.json({
      success: true,
      data: product
    });
  });

  app.post('/api/products', (req, res) => {
    const newProduct = {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  });

  app.put('/api/products/:id', (req, res) => {
    const updatedProduct = {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  });

  app.delete('/api/products/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  });

  // ==================== INVENTORY/STOCK ENDPOINTS ====================
  app.get('/api/inventory', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          product_id: 1,
          product_name: 'Helado de Vainilla',
          current_stock: 25,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          cost_per_unit: 180,
          total_value: 4500,
          last_updated: new Date().toISOString(),
          status: 'normal',
          location: 'Freezer A1'
        },
        {
          id: 2,
          product_id: 2,
          product_name: 'Helado de Chocolate',
          current_stock: 20,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          cost_per_unit: 200,
          total_value: 4000,
          last_updated: new Date().toISOString(),
          status: 'normal',
          location: 'Freezer A2'
        },
        {
          id: 3,
          product_id: 3,
          product_name: 'Helado de Fresa',
          current_stock: 18,
          min_stock: 5,
          max_stock: 50,
          unit: 'litros',
          cost_per_unit: 190,
          total_value: 3420,
          last_updated: new Date().toISOString(),
          status: 'normal',
          location: 'Freezer A3'
        },
        {
          id: 4,
          product_id: 4,
          product_name: 'Paleta de Limón',
          current_stock: 50,
          min_stock: 10,
          max_stock: 100,
          unit: 'unidades',
          cost_per_unit: 75,
          total_value: 3750,
          last_updated: new Date().toISOString(),
          status: 'normal',
          location: 'Freezer B1'
        },
        {
          id: 5,
          product_id: 5,
          product_name: 'Sundae Especial',
          current_stock: 3,
          min_stock: 3,
          max_stock: 30,
          unit: 'porciones',
          cost_per_unit: 220,
          total_value: 660,
          last_updated: new Date().toISOString(),
          status: 'low',
          location: 'Freezer C1'
        }
      ],
      summary: {
        total_items: 5,
        total_value: 16330,
        low_stock_items: 1,
        out_of_stock_items: 0,
        normal_stock_items: 4
      },
      lowStock: [
        {
          id: 5,
          product_name: 'Sundae Especial',
          current_stock: 3,
          min_stock: 3,
          status: 'critical'
        }
      ],
      outOfStock: []
    });
  });

  app.post('/api/inventory/adjust', (req, res) => {
    const { product_id, adjustment, reason, type } = req.body;
    
    res.json({
      success: true,
      message: 'Ajuste de inventario realizado exitosamente',
      adjustment: {
        id: Date.now(),
        product_id,
        adjustment,
        reason,
        type,
        created_at: new Date().toISOString(),
        user_id: 1
      }
    });
  });

  // ==================== CUSTOMERS ENDPOINTS ====================
  app.get('/api/customers', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          first_name: 'María',
          last_name: 'González',
          email: 'maria.gonzalez@email.com',
          phone: '+54 9 11 1234-5678',
          address: 'Av. Corrientes 1234, CABA',
          city: 'Buenos Aires',
          postal_code: '1043',
          date_of_birth: '1985-03-15',
          customer_type: 'regular',
          vip_status: false,
          total_orders: 25,
          total_spent: 8750,
          average_order: 350,
          last_order: new Date(Date.now() - 86400000 * 5).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
          is_active: true,
          preferences: {
            favorite_flavors: ['Vainilla', 'Chocolate'],
            dietary_restrictions: [],
            communication_preference: 'email'
          }
        },
        {
          id: 2,
          first_name: 'Carlos',
          last_name: 'Rodríguez',
          email: 'carlos.rodriguez@email.com',
          phone: '+54 9 11 2345-6789',
          address: 'Santa Fe 3456, Palermo',
          city: 'Buenos Aires',
          postal_code: '1425',
          date_of_birth: '1978-07-22',
          customer_type: 'vip',
          vip_status: true,
          total_orders: 48,
          total_spent: 19200,
          average_order: 400,
          last_order: new Date(Date.now() - 86400000 * 2).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
          is_active: true,
          preferences: {
            favorite_flavors: ['Chocolate', 'Fresa'],
            dietary_restrictions: [],
            communication_preference: 'whatsapp'
          }
        },
        {
          id: 3,
          first_name: 'Ana',
          last_name: 'Martínez',
          email: 'ana.martinez@email.com',
          phone: '+54 9 11 3456-7890',
          address: 'Rivadavia 789, Caballito',
          city: 'Buenos Aires',
          postal_code: '1406',
          date_of_birth: '1992-11-08',
          customer_type: 'regular',
          vip_status: false,
          total_orders: 12,
          total_spent: 3600,
          average_order: 300,
          last_order: new Date(Date.now() - 86400000 * 10).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
          is_active: true,
          preferences: {
            favorite_flavors: ['Limón'],
            dietary_restrictions: ['lactose_free'],
            communication_preference: 'email'
          }
        }
      ],
      total: 3,
      summary: {
        total_customers: 3,
        vip_customers: 1,
        regular_customers: 2,
        total_revenue: 31550,
        average_order_value: 350
      }
    });
  });

  app.get('/api/customers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const customer = {
      id: id,
      first_name: 'María',
      last_name: 'González',
      email: 'maria.gonzalez@email.com',
      phone: '+54 9 11 1234-5678',
      address: 'Av. Corrientes 1234, CABA',
      city: 'Buenos Aires',
      postal_code: '1043',
      date_of_birth: '1985-03-15',
      customer_type: 'regular',
      vip_status: false,
      total_orders: 25,
      total_spent: 8750,
      created_at: new Date().toISOString(),
      is_active: true
    };
    
    res.json({
      success: true,
      data: customer
    });
  });

  app.post('/api/customers', (req, res) => {
    const newCustomer = {
      id: Date.now(),
      ...req.body,
      total_orders: 0,
      total_spent: 0,
      customer_type: 'regular',
      vip_status: false,
      created_at: new Date().toISOString(),
      is_active: true
    };
    
    res.json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: newCustomer
    });
  });

  app.put('/api/customers/:id', (req, res) => {
    const updatedCustomer = {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: updatedCustomer
    });
  });

  app.delete('/api/customers/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  });

  // ==================== PROVIDERS ENDPOINTS ====================
  app.get('/api/providers', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Lácteos San Antonio',
          contact_person: 'Juan Pérez',
          email: 'ventas@lacteossanantonio.com',
          phone: '+54 11 4567-8900',
          address: 'Ruta 9 Km 45, San Antonio de Areco',
          city: 'San Antonio de Areco',
          postal_code: '2760',
          tax_id: '20-12345678-9',
          category: 'Ingredientes',
          payment_terms: '30 días',
          credit_limit: 50000,
          current_balance: 15000,
          is_active: true,
          rating: 4.5,
          products_supplied: [
            { name: 'Leche entera', unit: 'litros' },
            { name: 'Crema de leche', unit: 'litros' },
            { name: 'Manteca', unit: 'kg' }
          ],
          created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
          last_order: new Date(Date.now() - 86400000 * 15).toISOString()
        },
        {
          id: 2,
          name: 'Dulces del Valle',
          contact_person: 'María López',
          email: 'compras@dulcesdelvalle.com',
          phone: '+54 11 5678-9012',
          address: 'Av. Industrial 123, Tigre',
          city: 'Tigre',
          postal_code: '1648',
          tax_id: '20-23456789-0',
          category: 'Ingredientes',
          payment_terms: '15 días',
          credit_limit: 30000,
          current_balance: 8500,
          is_active: true,
          rating: 4.8,
          products_supplied: [
            { name: 'Azúcar refinada', unit: 'kg' },
            { name: 'Esencia de vainilla', unit: 'litros' },
            { name: 'Cacao en polvo', unit: 'kg' }
          ],
          created_at: new Date(Date.now() - 86400000 * 200).toISOString(),
          last_order: new Date(Date.now() - 86400000 * 8).toISOString()
        },
        {
          id: 3,
          name: 'Envases Premium',
          contact_person: 'Roberto Silva',
          email: 'ventas@envasespremium.com',
          phone: '+54 11 6789-0123',
          address: 'Parque Industrial Norte, Garin',
          city: 'Garin',
          postal_code: '1619',
          tax_id: '20-34567890-1',
          category: 'Packaging',
          payment_terms: '45 días',
          credit_limit: 75000,
          current_balance: 25000,
          is_active: true,
          rating: 4.2,
          products_supplied: [
            { name: 'Envases 500ml', unit: 'unidades' },
            { name: 'Envases 1L', unit: 'unidades' },
            { name: 'Etiquetas', unit: 'unidades' }
          ],
          created_at: new Date(Date.now() - 86400000 * 150).toISOString(),
          last_order: new Date(Date.now() - 86400000 * 20).toISOString()
        }
      ],
      total: 3,
      summary: {
        total_providers: 3,
        active_providers: 3,
        total_credit_limit: 155000,
        total_current_balance: 48500,
        average_rating: 4.5
      }
    });
  });

  app.get('/api/providers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const provider = {
      id: id,
      name: 'Lácteos San Antonio',
      contact_person: 'Juan Pérez',
      email: 'ventas@lacteossanantonio.com',
      phone: '+54 11 4567-8900',
      address: 'Ruta 9 Km 45, San Antonio de Areco',
      category: 'Ingredientes',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: provider
    });
  });

  app.post('/api/providers', (req, res) => {
    const newProvider = {
      id: Date.now(),
      ...req.body,
      current_balance: 0,
      rating: 0,
      created_at: new Date().toISOString(),
      is_active: true
    };
    
    res.json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: newProvider
    });
  });

  app.put('/api/providers/:id', (req, res) => {
    const updatedProvider = {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updatedProvider
    });
  });

  app.delete('/api/providers/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  });

  // ==================== WEB USERS ENDPOINTS ====================
  app.get('/api/web_users', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          email: 'admin@venezia.com',
          first_name: 'Administrador',
          last_name: 'Sistema',
          phone: '+54 11 1234-5678',
          address: 'Av. Corrientes 1234, CABA',
          role: 'admin',
          active: true,
          created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
          last_login: new Date(Date.now() - 86400000).toISOString(),
          login_count: 450,
          permissions: ['all']
        },
        {
          id: 2,
          email: 'gerente@venezia.com',
          first_name: 'María',
          last_name: 'Gerente',
          phone: '+54 11 2345-6789',
          address: 'Santa Fe 3456, Palermo',
          role: 'manager',
          active: true,
          created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
          last_login: new Date(Date.now() - 86400000 * 2).toISOString(),
          login_count: 120,
          permissions: ['pos', 'inventory', 'customers', 'reports']
        },
        {
          id: 3,
          email: 'cajero@venezia.com',
          first_name: 'Carlos',
          last_name: 'Cajero',
          phone: '+54 11 3456-7890',
          address: 'Rivadavia 789, Caballito',
          role: 'cashier',
          active: true,
          created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
          last_login: new Date(Date.now() - 86400000 * 1).toISOString(),
          login_count: 85,
          permissions: ['pos']
        },
        {
          id: 4,
          email: 'empleado@venezia.com',
          first_name: 'Ana',
          last_name: 'Empleada',
          phone: '+54 11 4567-8901',
          address: 'Belgrano 456, Villa Crespo',
          role: 'employee',
          active: false,
          created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
          last_login: new Date(Date.now() - 86400000 * 30).toISOString(),
          login_count: 25,
          permissions: ['inventory']
        }
      ],
      total: 4,
      summary: {
        total_users: 4,
        active_users: 3,
        inactive_users: 1,
        roles: {
          admin: 1,
          manager: 1,
          cashier: 1,
          employee: 1
        }
      }
    });
  });

  app.get('/api/web_users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = {
      id: id,
      email: 'admin@venezia.com',
      first_name: 'Administrador',
      last_name: 'Sistema',
      phone: '+54 11 1234-5678',
      address: 'Av. Corrientes 1234, CABA',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: user
    });
  });

  app.post('/api/web_users', (req, res) => {
    const newUser = {
      id: Date.now(),
      ...req.body,
      login_count: 0,
      created_at: new Date().toISOString(),
      active: true
    };
    
    res.json({
      success: true,
      message: 'Usuario web creado exitosamente',
      data: newUser
    });
  });

  app.put('/api/web_users/:id', (req, res) => {
    const updatedUser = {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Usuario web actualizado exitosamente',
      data: updatedUser
    });
  });

  app.delete('/api/web_users/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Usuario web eliminado exitosamente'
    });
  });
};