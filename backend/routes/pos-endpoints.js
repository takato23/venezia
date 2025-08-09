// POS endpoints for SimplePOS component

module.exports = function(app) {
  // Get flavors list
  app.get('/api/flavors', (req, res) => {
    const flavors = [
      { id: 1, name: 'Chocolate', color: '#8B4513' },
      { id: 2, name: 'Vainilla', color: '#F3E5AB' },
      { id: 3, name: 'Frutilla', color: '#FF69B4' },
      { id: 4, name: 'Dulce de Leche', color: '#D2691E' },
      { id: 5, name: 'Limón', color: '#FFFF00' },
      { id: 6, name: 'Menta Granizada', color: '#90EE90' },
      { id: 7, name: 'Banana Split', color: '#FFE4B5' },
      { id: 8, name: 'Crema Americana', color: '#FFFACD' },
      { id: 9, name: 'Chocolate Suizo', color: '#654321' },
      { id: 10, name: 'Frambuesa', color: '#E30B5C' },
      { id: 11, name: 'Sambayón', color: '#F0E68C' },
      { id: 12, name: 'Marroc', color: '#8B7355' },
      { id: 13, name: 'Cereza', color: '#DE3163' },
      { id: 14, name: 'Mango', color: '#FFC800' },
      { id: 15, name: 'Coco', color: '#FFFAFA' }
    ];
    
    res.json({
      success: true,
      data: flavors
    });
  });

  // Get current stock by flavor
  app.get('/api/stock/current', (req, res) => {
    // Mock stock data - in real app would query database
    const stockData = {
      1: 15.5,  // Chocolate
      2: 8.2,   // Vainilla
      3: 0,     // Frutilla - agotado
      4: 22.0,  // Dulce de Leche
      5: 4.5,   // Limón - stock bajo
      6: 12.0,  // Menta
      7: 10.5,  // Banana Split
      8: 7.8,   // Crema Americana
      9: 18.0,  // Chocolate Suizo
      10: 3.2,  // Frambuesa - stock bajo
      11: 6.5,  // Sambayón
      12: 9.0,  // Marroc
      13: 0,    // Cereza - agotado
      14: 11.5, // Mango
      15: 5.0   // Coco
    };
    
    res.json({
      success: true,
      data: stockData
    });
  });

  // Process sale
  app.post('/api/pos/sale', async (req, res) => {
    try {
      const { 
        items, 
        subtotal, 
        discount, 
        total, 
        paymentMethod, 
        customerId,
        storeId = 1 
      } = req.body;

      // Here would go the logic to:
      // 1. Create sale record
      // 2. Create sale items
      // 3. Update stock
      // 4. Generate receipt
      
      const saleId = Date.now(); // Mock sale ID
      
      res.json({
        success: true,
        message: 'Venta procesada exitosamente',
        data: {
          saleId,
          receiptNumber: `VZ-${saleId}`,
          total,
          paymentMethod
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al procesar la venta'
      });
    }
  });

  // Get product categories
  app.get('/api/categories', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Helados' },
        { id: 2, name: 'Bebidas' },
        { id: 3, name: 'Postres' },
        { id: 4, name: 'Otros' }
      ]
    });
  });
};