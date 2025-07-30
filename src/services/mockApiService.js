// Mock API Service - Simulates backend responses for development
class MockApiService {
  static async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));
  }

  // Dashboard API
  static async getDashboardOverview() {
    await this.delay();
    
    return {
      today: {
        sales: 15420,
        orders: 89,
        customers: 67,
        delivery_orders: 23
      },
      yesterday: {
        sales: 13240,
        orders: 78,
        customers: 58,
        delivery_orders: 18
      },
      weekly_sales: [
        { day: 'Lun', amount: 8500 },
        { day: 'Mar', amount: 9200 },
        { day: 'Mié', amount: 11400 },
        { day: 'Jue', amount: 12100 },
        { day: 'Vie', amount: 15420 },
        { day: 'Sáb', amount: 18900 },
        { day: 'Dom', amount: 16300 }
      ],
      top_products: [
        { name: 'Chocolate con Almendras', sales: 45, revenue: 2250 },
        { name: 'Vainilla Premium', sales: 38, revenue: 1900 },
        { name: 'Frutilla Natural', sales: 35, revenue: 1750 },
        { name: 'Dulce de Leche', sales: 32, revenue: 1600 },
        { name: 'Mint Chip', sales: 28, revenue: 1400 }
      ],
      recent_orders: [
        {
          id: 1234,
          customer: 'María González',
          items: 3,
          total: 450,
          status: 'completed',
          time: '14:35'
        },
        {
          id: 1233,
          customer: 'Carlos Ruiz',
          items: 2,
          total: 380,
          status: 'in_progress',
          time: '14:20'
        },
        {
          id: 1232,
          customer: 'Ana López',
          items: 4,
          total: 620,
          status: 'pending',
          time: '14:15'
        }
      ],
      low_stock_alerts: [
        { product: 'Chocolate Belga', current: 5, minimum: 20, urgency: 'high' },
        { product: 'Vainilla Bourbon', current: 12, minimum: 25, urgency: 'medium' },
        { product: 'Pistache Premium', current: 8, minimum: 15, urgency: 'low' }
      ],
      performance_metrics: {
        sales_growth: 16.4,
        customer_satisfaction: 94.5,
        order_fulfillment: 98.2,
        inventory_turnover: 85.7
      }
    };
  }

  // Sales API
  static async getSales(params = {}) {
    await this.delay();
    
    const sales = [];
    const today = new Date();
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - Math.floor(Math.random() * 30));
      
      sales.push({
        id: 1200 + i,
        date: date.toISOString(),
        customer_name: this.generateCustomerName(),
        customer_phone: `+54 11 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        items: [
          {
            product_name: this.generateProductName(),
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 200) + 100,
            flavor: this.generateFlavor()
          }
        ],
        total: Math.floor(Math.random() * 800) + 200,
        status: this.generateOrderStatus(),
        payment_method: this.generatePaymentMethod(),
        store_id: Math.floor(Math.random() * 3) + 1,
        is_delivery: Math.random() > 0.7
      });
    }
    
    return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Production API
  static async getProductionOrders() {
    await this.delay();
    
    return [
      {
        id: 145,
        recipe_name: 'Chocolate Premium',
        quantity: 50,
        status: 'in_progress',
        progress: 80,
        start_date: '2025-07-03T08:00:00Z',
        estimated_completion: '2025-07-03T16:00:00Z',
        assigned_to: 'Juan Pérez',
        priority: 'high'
      },
      {
        id: 146,
        recipe_name: 'Vainilla Bourbon',
        quantity: 35,
        status: 'in_progress',
        progress: 45,
        start_date: '2025-07-03T10:00:00Z',
        estimated_completion: '2025-07-03T18:00:00Z',
        assigned_to: 'María García',
        priority: 'medium'
      },
      {
        id: 147,
        recipe_name: 'Frutilla Natural',
        quantity: 40,
        status: 'pending',
        progress: 0,
        start_date: null,
        estimated_completion: null,
        assigned_to: null,
        priority: 'low'
      }
    ];
  }

  static async getProductionBatches() {
    await this.delay();
    
    return [
      {
        id: 'BATCH-2025-001',
        product: 'Chocolate con Almendras',
        quantity: 50,
        status: 'completed',
        quality_score: 95,
        start_time: '2025-07-02T08:00:00Z',
        end_time: '2025-07-02T16:30:00Z',
        operator: 'Juan Pérez'
      },
      {
        id: 'BATCH-2025-002',
        product: 'Vainilla Premium',
        quantity: 40,
        status: 'in_progress',
        quality_score: null,
        start_time: '2025-07-03T09:00:00Z',
        end_time: null,
        operator: 'María García'
      }
    ];
  }

  // Inventory API
  static async getInventory() {
    await this.delay();
    
    const products = [
      'Chocolate Belga', 'Vainilla Bourbon', 'Frutilla Natural', 'Dulce de Leche',
      'Mint Chip', 'Pistache Premium', 'Limón Natural', 'Coco Rayado',
      'Chocolate Blanco', 'Café Espresso', 'Banana Split', 'Mango Tropical'
    ];
    
    return products.map((name, index) => ({
      id: index + 1,
      name,
      current_stock: Math.floor(Math.random() * 80) + 5,
      minimum_stock: 20,
      maximum_stock: 100,
      unit_cost: Math.floor(Math.random() * 50) + 25,
      last_updated: new Date().toISOString(),
      store_id: Math.floor(Math.random() * 3) + 1,
      category: 'helados'
    }));
  }

  // Analytics API
  static async getAnalytics(type = 'sales', params = {}) {
    await this.delay();
    
    switch (type) {
      case 'sales':
        return {
          total_sales: 145230,
          total_orders: 892,
          avg_ticket: 163,
          sales_growth: 18.5,
          orders_growth: 12.3,
          ticket_growth: 5.5,
          by_store: [
            { name: 'Centro', revenue: 65420, orders: 420, avg_ticket: 156 },
            { name: 'Norte', revenue: 48900, orders: 312, avg_ticket: 157 },
            { name: 'Sur', revenue: 30910, orders: 160, avg_ticket: 193 }
          ],
          sales_by_period: this.generateTimeSeriesData(30)
        };
      
      case 'products':
        return {
          top_products: [
            { name: 'Chocolate con Almendras', units_sold: 245, revenue: 12250, percentage: 22.5 },
            { name: 'Vainilla Premium', units_sold: 198, revenue: 9900, percentage: 18.2 },
            { name: 'Frutilla Natural', units_sold: 176, revenue: 8800, percentage: 16.1 },
            { name: 'Dulce de Leche', units_sold: 154, revenue: 7700, percentage: 14.1 },
            { name: 'Mint Chip', units_sold: 132, revenue: 6600, percentage: 12.1 }
          ]
        };

      case 'customers':
        return {
          unique_customers: 425,
          customers_growth: 15.8,
          new_customers: 89,
          returning_customers: 336,
          customer_retention: 79.2,
          avg_orders_per_customer: 2.1,
          customer_segments: [
            { segment: 'VIP', count: 45, revenue: 45600, avg_ticket: 320 },
            { segment: 'Frecuente', count: 156, revenue: 78000, avg_ticket: 250 },
            { segment: 'Ocasional', count: 224, revenue: 56800, avg_ticket: 127 }
          ],
          top_customers: [
            { name: 'María González', orders: 15, revenue: 4500, last_order: '2025-07-02' },
            { name: 'Carlos Ruiz', orders: 12, revenue: 3800, last_order: '2025-07-03' },
            { name: 'Ana López', orders: 11, revenue: 3200, last_order: '2025-07-01' }
          ]
        };
      
      default:
        return {};
    }
  }

  // Analytics Export API
  static async getAnalyticsExport(params = {}) {
    await this.delay(1000); // Longer delay for export generation
    
    // Simulate PDF blob generation
    const pdfContent = this.generateMockPDFContent(params);
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  static generateMockPDFContent(params) {
    return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj

4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Reporte Analytics Venezia - ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
308
%%EOF`;
  }

  // Reports API
  static async getReports(category, params = {}) {
    await this.delay();
    
    switch (category) {
      case 'sales':
        return {
          total_revenue: 145230,
          total_orders: 892,
          avg_order_value: 163,
          sales_by_period: this.generateTimeSeriesData(30),
          top_products: this.generateTopProducts(),
          sales_detail: this.generateSalesDetail()
        };
      
      case 'inventory':
        return {
          total_value: 45230,
          low_stock_count: 8,
          value_by_category: [
            { name: 'Helados Premium', value: 25600 },
            { name: 'Helados Tradicionales', value: 12400 },
            { name: 'Sabores Especiales', value: 7230 }
          ],
          stock_movements: this.generateStockMovements(),
          low_stock_items: this.generateLowStockItems()
        };
      
      default:
        return {};
    }
  }

  // Helper methods
  static generateCustomerName() {
    const names = ['María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Jorge', 'Isabel', 'Roberto'];
    const surnames = ['González', 'Rodríguez', 'López', 'Martínez', 'García', 'Pérez', 'Sánchez', 'Ruiz'];
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
  }

  static generateProductName() {
    const products = ['1/4 kg', '1/2 kg', '1 kg', 'Palito', 'Cono', 'Sundae'];
    return products[Math.floor(Math.random() * products.length)];
  }

  static generateFlavor() {
    const flavors = ['Chocolate', 'Vainilla', 'Frutilla', 'Dulce de Leche', 'Mint Chip', 'Pistache'];
    return flavors[Math.floor(Math.random() * flavors.length)];
  }

  static generateOrderStatus() {
    const statuses = ['completed', 'in_progress', 'pending', 'cancelled'];
    const weights = [0.7, 0.15, 0.1, 0.05];
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return statuses[i];
    }
    return 'completed';
  }

  static generatePaymentMethod() {
    const methods = ['efectivo', 'tarjeta', 'mercadopago', 'transferencia'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  static generateTimeSeriesData(days) {
    const data = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 5000) + 8000,
        label: date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  }

  static generateTopProducts() {
    return [
      { name: 'Chocolate con Almendras', sales: 245, revenue: 12250 },
      { name: 'Vainilla Premium', sales: 198, revenue: 9900 },
      { name: 'Frutilla Natural', sales: 176, revenue: 8800 },
      { name: 'Dulce de Leche', sales: 154, revenue: 7700 },
      { name: 'Mint Chip', sales: 132, revenue: 6600 }
    ];
  }

  static generateSalesDetail() {
    const details = [];
    for (let i = 0; i < 20; i++) {
      details.push({
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        order_id: 1200 + i,
        customer: this.generateCustomerName(),
        products: Math.floor(Math.random() * 4) + 1,
        total: Math.floor(Math.random() * 800) + 200,
        status: this.generateOrderStatus()
      });
    }
    return details;
  }

  static generateStockMovements() {
    return [
      { date: '2025-07-01', type: 'entrada', product: 'Chocolate Belga', quantity: 50, reason: 'Producción' },
      { date: '2025-07-02', type: 'salida', product: 'Vainilla Premium', quantity: 25, reason: 'Venta' },
      { date: '2025-07-03', type: 'entrada', product: 'Frutilla Natural', quantity: 30, reason: 'Producción' }
    ];
  }

  static generateLowStockItems() {
    return [
      { name: 'Chocolate Belga', current_stock: 5, min_stock: 20, value: 250, last_movement: '2025-07-01' },
      { name: 'Pistache Premium', current_stock: 8, min_stock: 15, value: 480, last_movement: '2025-07-02' },
      { name: 'Café Espresso', current_stock: 12, min_stock: 25, value: 360, last_movement: '2025-07-03' }
    ];
  }

  // AI Executive Actions APIs
  static async addInventory(data) {
    await this.delay(800);
    
    return {
      success: true,
      message: 'Inventario actualizado correctamente',
      data: {
        product: data.product,
        quantity_added: data.quantity,
        unit: data.unit,
        new_stock: Math.floor(Math.random() * 50) + data.quantity,
        timestamp: new Date().toISOString(),
        updated_by: 'AI Assistant'
      }
    };
  }

  static async createProductionOrder(data) {
    await this.delay(1200);
    
    const batchId = 'BATCH-' + Date.now();
    
    return {
      success: true,
      message: 'Orden de producción creada exitosamente',
      data: {
        batch_id: batchId,
        recipe_name: data.recipe_name,
        quantity: data.quantity,
        priority: data.priority,
        status: 'pending',
        estimated_completion: new Date(Date.now() + data.quantity * 60 * 60 * 1000).toISOString(),
        created_by: data.requested_by,
        timestamp: new Date().toISOString()
      }
    };
  }

  static async createSalesOrder(data) {
    await this.delay(1000);
    
    const orderId = Math.floor(Math.random() * 9000) + 1000;
    
    return {
      success: true,
      message: 'Orden de venta creada exitosamente',
      data: {
        order_id: orderId,
        customer: data.customer,
        items: data.items,
        total: data.total,
        payment_method: data.payment_method,
        is_delivery: data.is_delivery,
        status: 'pending',
        created_by: 'AI Assistant',
        timestamp: new Date().toISOString()
      }
    };
  }

  static async getAvailableDrivers() {
    await this.delay(500);
    
    return {
      success: true,
      drivers: [
        { id: 1, name: 'Juan Pérez', vehicle: 'Moto Honda', available: true, current_orders: 2 },
        { id: 2, name: 'María García', vehicle: 'Auto Fiat', available: true, current_orders: 1 },
        { id: 3, name: 'Carlos López', vehicle: 'Bicicleta', available: false, current_orders: 0 },
        { id: 4, name: 'Ana Rodríguez', vehicle: 'Moto Yamaha', available: true, current_orders: 3 }
      ]
    };
  }

  // Delivery API - comprehensive mock data
  static async getDeliveries() {
    await this.delay();
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const deliveries = [];
    
    // Generate mock deliveries for different days and statuses
    const customerNames = ['María González', 'Carlos López', 'Ana Martínez', 'Luis Pérez', 'Carmen Silva', 'Jorge Rodríguez', 'Isabel García', 'Roberto Díaz', 'Laura Fernández', 'Diego Morales'];
    const neighborhoods = ['San Nicolás', 'Recoleta', 'Palermo', 'Villa Crespo', 'Barracas', 'La Boca', 'Puerto Madero', 'Belgrano', 'Núñez', 'Caballito'];
    const streets = ['Av. Corrientes', 'Santa Fe', 'Av. Cabildo', 'Rivadavia', 'Callao', 'Florida', 'Lavalle', 'Paraguay', 'Uruguay', 'Brasil'];
    const statuses = ['pending', 'assigned', 'in_transit', 'delivered', 'failed'];
    const priorities = ['normal', 'high', 'urgent'];
    
    const products = [
      { name: '1/4 kg Chocolate', price: 250 },
      { name: '1/2 kg Vainilla', price: 450 },
      { name: '1 kg Dulce de Leche', price: 850 },
      { name: 'Palito Frutilla', price: 150 },
      { name: 'Cono Triple', price: 320 },
      { name: 'Sundae Especial', price: 480 }
    ];
    
    for (let i = 1; i <= 25; i++) {
      // Distribute deliveries across different dates
      let deliveryDate;
      if (i <= 8) deliveryDate = today;
      else if (i <= 12) deliveryDate = tomorrow;
      else if (i <= 16) deliveryDate = yesterday;
      else {
        deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 7) - 3);
      }
      
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const streetNumber = Math.floor(Math.random() * 9000) + 1000;
      
      // Generate random items for the delivery
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        items.push({
          product_name: product.name,
          quantity: quantity,
          price: product.price,
          subtotal: product.price * quantity
        });
        totalAmount += product.price * quantity;
      }
      
      // Status distribution: more pending/assigned for today, more delivered for past
      let status;
      if (deliveryDate.toDateString() === today.toDateString()) {
        status = statuses[Math.floor(Math.random() * 3)]; // pending, assigned, in_transit
      } else if (deliveryDate < today) {
        status = Math.random() > 0.2 ? 'delivered' : 'failed'; // mostly delivered
      } else {
        status = 'pending'; // future deliveries are pending
      }
      
      deliveries.push({
        id: i,
        order_number: 1200 + i,
        customer_name: customerName,
        customer_phone: `+54 11 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        address: {
          street: street,
          number: streetNumber.toString(),
          neighborhood: neighborhood,
          city: 'Buenos Aires',
          instructions: Math.random() > 0.5 ? ['Timbre B', 'Portero', 'PB departamento A', 'Casa azul', 'Hablar por portero'][Math.floor(Math.random() * 5)] : null
        },
        driver_id: status === 'pending' ? null : Math.floor(Math.random() * 4) + 1,
        driver_name: status === 'pending' ? null : ['Juan Pérez', 'María García', 'Carlos López', 'Ana Rodríguez'][Math.floor(Math.random() * 4)],
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        scheduled_date: deliveryDate.toISOString().split('T')[0],
        scheduled_time: `${Math.floor(Math.random() * 12) + 8}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`,
        estimated_time: `${Math.floor(Math.random() * 30) + 15}-${Math.floor(Math.random() * 30) + 30} min`,
        items: items,
        total_amount: totalAmount,
        notes: Math.random() > 0.7 ? ['Entregar en horario de almuerzo', 'Llamar antes de llegar', 'Cuidado con el perro', 'Casa con rejas verdes'][Math.floor(Math.random() * 4)] : null,
        created_at: new Date(deliveryDate.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return deliveries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // POS specific endpoints
  static async createDeliveryOrder(data = {}) {
    await this.delay(1000);
    
    const orderId = Math.floor(Math.random() * 9000) + 1000;
    const receiptNumber = `R-${new Date().getFullYear()}-${orderId}`;
    
    return {
      success: true,
      message: 'Orden de delivery creada exitosamente',
      receipt_number: receiptNumber,
      sale: {
        id: orderId,
        total: data.total || (Math.random() * 500 + 200).toFixed(2),
        items: data.items || [],
        customer: data.customer || { name: 'Cliente General' },
        payment_method: data.payment_method || 'cash',
        created_at: new Date().toISOString()
      },
      delivery: {
        id: orderId + 10000,
        estimated_time: data.estimated_time || '30-45 minutos',
        delivery_address: data.delivery_address || 'Dirección no especificada',
        delivery_phone: data.delivery_phone || 'No especificado',
        status: 'pending',
        driver_id: null,
        notes: data.notes || null
      },
      stock_updated: data.items ? data.items.map(item => ({
        product_id: item.product_id,
        quantity_sold: item.quantity,
        new_stock: Math.floor(Math.random() * 50) + 10
      })) : []
    };
  }

  // Método principal para obtener datos mock por URL
  static getMockData(url) {
    console.log(`📦 Obteniendo datos mock para: ${url}`);
    
    switch (url) {
      case '/api/deliveries':
        return this.getDeliveries();

      case '/api/deliveries/active':
        const allDeliveries = this.getDeliveries();
        return allDeliveries.filter(d => ['pending', 'assigned', 'in_transit'].includes(d.status));

      case '/api/pos/live-metrics':
        return {
          data: {
            todaySales: 2750.50,
            salesCount: 18,
            avgTicket: 152.81,
            itemsSold: 47,
            efficiency: 2.8,
            deliveries: {
              total: 12,
              pending: 3,
              in_transit: 2
            }
          }
        };

      case '/api/pos/create-delivery-order':
        return this.createDeliveryOrder();

      case '/api/drivers':
        return [
          { id: 1, name: 'Juan Pérez', vehicle: 'Moto Honda', available: true, current_orders: 2 },
          { id: 2, name: 'María García', vehicle: 'Auto Fiat', available: true, current_orders: 1 },
          { id: 3, name: 'Carlos López', vehicle: 'Bicicleta', available: false, current_orders: 0 },
          { id: 4, name: 'Ana Rodríguez', vehicle: 'Moto Yamaha', available: true, current_orders: 3 }
        ];

      case '/api/sales':
        return {
          sales: [
            {
              id: 1234,
              customer_name: 'María González',
              customer_phone: '+54 11 1234-5678',
              total: 450,
              delivery_id: null,
              status: 'completed',
              created_at: new Date().toISOString()
            },
            {
              id: 1235,
              customer_name: 'Carlos López',
              customer_phone: '+54 11 5678-1234',
              total: 320,
              delivery_id: null,
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ]
        };

      case '/api/products':
        return [
          {
            id: 1,
            name: 'Helado de Chocolate',
            price: 85.50,
            category_id: 1,
            category: 'Helado',
            description: 'Delicioso helado de chocolate premium',
            current_stock: 25,
            minimum_stock: 10
          },
          {
            id: 2,
            name: 'Helado de Vainilla',
            price: 80.00,
            category_id: 1,
            category: 'Helado',
            description: 'Cremoso helado de vainilla natural',
            current_stock: 30,
            minimum_stock: 10
          },
          {
            id: 3,
            name: 'Cono de Waffle',
            price: 25.00,
            category_id: 2,
            category: 'Complementos',
            description: 'Cono crujiente de waffle artesanal',
            current_stock: 50,
            minimum_stock: 20
          },
          {
            id: 4,
            name: 'Topping de Granillo',
            price: 15.00,
            category_id: 2,
            category: 'Complementos',
            description: 'Granillo de chocolate colorido',
            current_stock: 40,
            minimum_stock: 15
          },
          {
            id: 5,
            name: 'Batido de Frutilla',
            price: 120.00,
            category_id: 3,
            category: 'Bebidas',
            description: 'Batido cremoso con frutillas frescas',
            current_stock: 20,
            minimum_stock: 5
          }
        ];

      case '/api/categories':
        return [
          { id: 1, name: 'Helado', description: 'Helados artesanales' },
          { id: 2, name: 'Complementos', description: 'Conos, toppings y extras' },
          { id: 3, name: 'Bebidas', description: 'Batidos y bebidas heladas' }
        ];

      case '/api/customers':
        return [
          {
            id: 1,
            name: 'María González',
            phone: '+54 11 1234-5678',
            email: 'maria@email.com',
            address: 'Av. Corrientes 1234',
            total_orders: 15,
            total_spent: 2340.50
          },
          {
            id: 2,
            name: 'Carlos López',
            phone: '+54 11 5678-1234',
            email: 'carlos@email.com',
            address: 'Calle Falsa 123',
            total_orders: 8,
            total_spent: 1200.75
          }
        ];

      case '/api/sales/recent?limit=5':
        return [
          {
            id: 1234,
            customer_name: 'María González',
            items_count: 3,
            total: 285.50,
            created_at: new Date().toISOString(),
            items_preview: 'Chocolate x2, Cono x1'
          },
          {
            id: 1233,
            customer_name: 'Carlos López',
            items_count: 2,
            total: 170.00,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            items_preview: 'Vainilla x1, Batido x1'
          }
        ];

      case '/api/cashflow/status':
        return {
          available: 1250.75,
          daily_income: 2750.50,
          daily_expenses: 890.25
        };

      case '/api/ingredients':
        return [
          { id: 1, name: 'Leche Entera', unit: 'L', current_stock: 50, minimum_stock: 20, unit_cost: 2.50 },
          { id: 2, name: 'Crema de Leche', unit: 'L', current_stock: 30, minimum_stock: 15, unit_cost: 4.80 },
          { id: 3, name: 'Azúcar', unit: 'kg', current_stock: 25, minimum_stock: 10, unit_cost: 1.20 },
          { id: 4, name: 'Chocolate Belga', unit: 'kg', current_stock: 15, minimum_stock: 8, unit_cost: 12.50 },
          { id: 5, name: 'Vainilla Bourbon', unit: 'ml', current_stock: 500, minimum_stock: 200, unit_cost: 0.15 },
          { id: 6, name: 'Frutillas', unit: 'kg', current_stock: 10, minimum_stock: 5, unit_cost: 8.00 },
          { id: 7, name: 'Almendras', unit: 'kg', current_stock: 8, minimum_stock: 4, unit_cost: 18.00 },
          { id: 8, name: 'Dulce de Leche', unit: 'kg', current_stock: 20, minimum_stock: 10, unit_cost: 6.50 }
        ];

      case '/api/transactions':
        return [];

      case '/api/users':
        return [
          { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'production', active: true },
          { id: 2, name: 'María García', email: 'maria@example.com', role: 'production', active: true },
          { id: 3, name: 'Carlos López', email: 'carlos@example.com', role: 'production', active: false },
          { id: 4, name: 'Ana Rodríguez', email: 'ana@example.com', role: 'admin', active: true },
          { id: 5, name: 'Luis Martínez', email: 'luis@example.com', role: 'production', active: true }
        ];

      case '/api/products':
        return [
          { id: 1, name: 'Chocolate con Almendras', category_id: 1, price_cup: 250, price_kg: 1200, available: true, stock: 25, description: 'Delicioso helado de chocolate con trozos de almendras' },
          { id: 2, name: 'Vainilla Premium', category_id: 1, price_cup: 200, price_kg: 1000, available: true, stock: 30, description: 'Helado de vainilla con esencia natural' },
          { id: 3, name: 'Frutilla Natural', category_id: 2, price_cup: 220, price_kg: 1100, available: true, stock: 20, description: 'Helado de frutilla con trozos de fruta' },
          { id: 4, name: 'Dulce de Leche', category_id: 1, price_cup: 230, price_kg: 1150, available: true, stock: 35, description: 'Tradicional helado de dulce de leche' },
          { id: 5, name: 'Mint Chip', category_id: 3, price_cup: 240, price_kg: 1200, available: false, stock: 0, description: 'Refrescante helado de menta con chips de chocolate' },
          { id: 6, name: 'Limón Natural', category_id: 4, price_cup: 180, price_kg: 900, available: true, stock: 15, description: 'Sorbete de limón natural' },
          { id: 7, name: 'Chocolate Blanco', category_id: 3, price_cup: 260, price_kg: 1300, available: true, stock: 10, description: 'Cremoso helado de chocolate blanco' },
          { id: 8, name: 'Pistacho Premium', category_id: 3, price_cup: 300, price_kg: 1500, available: true, stock: 8, description: 'Helado de pistacho con frutos secos' }
        ];

      case '/api/product_categories':
        return [
          { id: 1, name: 'Clásicos', description: 'Sabores tradicionales', active: true },
          { id: 2, name: 'Frutales', description: 'Sabores a base de frutas', active: true },
          { id: 3, name: 'Premium', description: 'Sabores especiales y gourmet', active: true },
          { id: 4, name: 'Sorbetes', description: 'Opciones sin lácteos', active: true }
        ];

      case '/api/providers':
        return [
          {
            id: 1,
            name: 'Lácteos Del Valle',
            contact_person: 'Juan Pérez',
            email: 'juan@lacteoselvalle.com',
            phone: '+54 11 4567-8901',
            address: 'Av. Industrial 1234, Buenos Aires',
            category_id: 1,
            category: 'Lácteos',
            status: 'active',
            payment_terms: '30 días',
            tax_id: '20-12345678-9',
            notes: 'Proveedor principal de leche y crema',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-15T00:00:00Z'
          },
          {
            id: 2,
            name: 'Frutas Premium S.A.',
            contact_person: 'María González',
            email: 'maria@frutaspremium.com',
            phone: '+54 11 4890-1234',
            address: 'Mercado Central, Puesto 45-47',
            category_id: 2,
            category: 'Frutas',
            status: 'active',
            payment_terms: '15 días',
            tax_id: '20-87654321-0',
            notes: 'Frutas de estación para helados',
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-20T00:00:00Z'
          },
          {
            id: 3,
            name: 'Chocolate Artesanal Belgrano',
            contact_person: 'Carlos López',
            email: 'carlos@chocolatebelgrano.com',
            phone: '+54 11 4234-5678',
            address: 'Belgrano 567, Belgrano',
            category_id: 3,
            category: 'Chocolates',
            status: 'active',
            payment_terms: '45 días',
            tax_id: '20-11223344-5',
            notes: 'Chocolate belga importado y local',
            created_at: '2025-01-03T00:00:00Z',
            updated_at: '2025-01-25T00:00:00Z'
          },
          {
            id: 4,
            name: 'Envases y Packaging Norte',
            contact_person: 'Ana Rodríguez',
            email: 'ana@envasesnorte.com',
            phone: '+54 11 4345-6789',
            address: 'Zona Industrial Norte, Lote 12',
            category_id: 4,
            category: 'Envases',
            status: 'inactive',
            payment_terms: '30 días',
            tax_id: '20-99887766-3',
            notes: 'Potes, cucharitas y material de packaging',
            created_at: '2025-01-04T00:00:00Z',
            updated_at: '2025-01-10T00:00:00Z'
          }
        ];

      case '/api/provider_categories':
        return [
          { id: 1, name: 'Lácteos', description: 'Leche, crema, manteca', active: true },
          { id: 2, name: 'Frutas', description: 'Frutas frescas y congeladas', active: true },
          { id: 3, name: 'Chocolates', description: 'Chocolate y cacao', active: true },
          { id: 4, name: 'Envases', description: 'Packaging y material', active: true },
          { id: 5, name: 'Ingredientes', description: 'Azúcar, vainilla, etc.', active: true }
        ];

      case '/api/stores':
        return [
          {
            id: 1,
            name: 'Venezia Centro',
            code: 'VZ-001',
            address: 'Av. Corrientes 1234, Buenos Aires',
            phone: '+54 11 4123-4567',
            email: 'centro@venezia.com',
            manager: 'María González',
            active: true,
            employees_count: 8,
            monthly_sales: 45230,
            daily_orders: 23,
            coordinates: { lat: -34.6037, lng: -58.3816 },
            opening_hours: {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '20:00', closed: false },
              saturday: { open: '10:00', close: '20:00', closed: false },
              sunday: { open: '11:00', close: '19:00', closed: false }
            }
          },
          {
            id: 2,
            name: 'Venezia Norte',
            code: 'VZ-002',
            address: 'Av. Cabildo 2567, Belgrano',
            phone: '+54 11 4567-8901',
            email: 'norte@venezia.com',
            manager: 'Carlos López',
            active: true,
            employees_count: 6,
            monthly_sales: 32100,
            daily_orders: 18,
            coordinates: { lat: -34.5631, lng: -58.4564 },
            opening_hours: {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '20:00', closed: false },
              saturday: { open: '10:00', close: '20:00', closed: false },
              sunday: { open: '11:00', close: '19:00', closed: false }
            }
          },
          {
            id: 3,
            name: 'Venezia Sur',
            code: 'VZ-003',
            address: 'Av. San Juan 1890, Barracas',
            phone: '+54 11 4890-1234',
            email: 'sur@venezia.com',
            manager: 'Ana Rodríguez',
            active: true,
            employees_count: 5,
            monthly_sales: 28750,
            daily_orders: 15,
            coordinates: { lat: -34.6469, lng: -58.3774 },
            opening_hours: {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '19:00', closed: false },
              saturday: { open: '10:00', close: '19:00', closed: false },
              sunday: { open: '11:00', close: '18:00', closed: false }
            }
          },
          {
            id: 4,
            name: 'Venezia Palermo',
            code: 'VZ-004',
            address: 'Av. Santa Fe 3456, Palermo',
            phone: '+54 11 4234-5678',
            email: 'palermo@venezia.com',
            manager: 'Luis Martínez',
            active: false,
            employees_count: 0,
            monthly_sales: 0,
            daily_orders: 0,
            coordinates: { lat: -34.5875, lng: -58.3974 },
            opening_hours: {
              monday: { open: '09:00', close: '18:00', closed: true },
              tuesday: { open: '09:00', close: '18:00', closed: true },
              wednesday: { open: '09:00', close: '18:00', closed: true },
              thursday: { open: '09:00', close: '18:00', closed: true },
              friday: { open: '09:00', close: '18:00', closed: true },
              saturday: { open: '09:00', close: '18:00', closed: true },
              sunday: { open: '09:00', close: '18:00', closed: true }
            }
          }
        ];

      default:
        console.warn(`No hay datos mock disponibles para: ${url}`);
        return null;
    }
  }
}

export default MockApiService;