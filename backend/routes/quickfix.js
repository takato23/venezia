const express = require('express');
const router = express.Router();

// Fix para endpoints faltantes que el SuperBot necesita

// GET /api/superbot/business-context
router.get('/superbot/business-context', async (req, res) => {
  try {
    // Mock data para el contexto del negocio
    const businessContext = {
      sales: {
        today: {
          total: 125000,
          transactions: 23,
          avgTicket: 5435,
          topProducts: [
            { name: 'Helado de Chocolate', units: 15, revenue: 30000 },
            { name: 'Helado de Vainilla', units: 12, revenue: 24000 },
            { name: 'Helado de Frutilla', units: 10, revenue: 20000 }
          ]
        },
        yesterday: {
          total: 98000,
          transactions: 19
        }
      },
      inventory: {
        lowStock: [
          { name: 'Chocolate', quantity: 5, unit: 'kg', minimum: 20, needed: 15 },
          { name: 'Leche', quantity: 10, unit: 'litros', minimum: 50, needed: 40 }
        ],
        ingredients: [
          { id: 1, name: 'Chocolate', quantity: 5, unit: 'kg', minimum: 20 },
          { id: 2, name: 'Vainilla', quantity: 30, unit: 'kg', minimum: 10 },
          { id: 3, name: 'Frutilla', quantity: 25, unit: 'kg', minimum: 15 },
          { id: 4, name: 'Leche', quantity: 10, unit: 'litros', minimum: 50 },
          { id: 5, name: 'Azúcar', quantity: 100, unit: 'kg', minimum: 50 }
        ],
        products: [
          { id: 1, name: 'Helado de Chocolate', stock: 45, price: 2000, minimum: 20 },
          { id: 2, name: 'Helado de Vainilla', stock: 38, price: 2000, minimum: 20 },
          { id: 3, name: 'Helado de Frutilla', stock: 8, price: 2000, minimum: 20 },
          { id: 4, name: 'Helado de Dulce de Leche', stock: 52, price: 2500, minimum: 20 }
        ]
      },
      analytics: {
        bestSellers: [
          { name: 'Helado de Chocolate', salesThisMonth: 450 },
          { name: 'Helado de Dulce de Leche', salesThisMonth: 380 },
          { name: 'Helado de Vainilla', salesThisMonth: 320 }
        ],
        lowStock: [
          { name: 'Chocolate', quantity: 5, unit: 'kg', minimum: 20, needed: 15 },
          { name: 'Frutilla', stock: 8, unit: 'unidades', minimum: 20, needed: 12 }
        ]
      }
    };

    res.json(businessContext);
  } catch (error) {
    console.error('Error getting business context:', error);
    res.status(500).json({ error: 'Error getting business context' });
  }
});

// GET /api/stock/low
router.get('/stock/low', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    // Mock data de productos con stock bajo
    const lowStockItems = [
      {
        id: 3,
        name: 'Helado de Frutilla',
        stock: 8,
        minimum: 20,
        unit: 'unidades',
        category: 'Helados',
        price: 2000
      },
      {
        id: 7,
        name: 'Helado de Limón',
        stock: 5,
        minimum: 15,
        unit: 'unidades',
        category: 'Helados',
        price: 1800
      }
    ];

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error getting low stock:', error);
    res.status(500).json({ error: 'Error getting low stock' });
  }
});

module.exports = router;