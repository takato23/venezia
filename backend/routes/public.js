const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');

// Obtener productos activos de la tienda web
router.get('/shop/products', async (req, res) => {
  try {
    // Obtener productos que están marcados como activos en la tienda web
    const { data: shopProducts, error: shopError } = await supabase
      .from('shop_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (shopError) {
      console.error('Error fetching shop products:', shopError);
      // Si no existe la tabla shop_products, intentar obtener productos normales
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (productsError) {
        throw productsError;
      }

      // Transformar productos normales al formato de shop
      const transformedProducts = products.map(p => ({
        id: p.id,
        product: p,
        name: p.name,
        webPrice: p.price,
        price: p.price,
        category: p.category,
        description: p.description,
        isActive: true,
        isFeatured: false
      }));

      return res.json({ 
        success: true, 
        products: transformedProducts 
      });
    }

    res.json({ 
      success: true, 
      products: shopProducts || [] 
    });
  } catch (error) {
    console.error('Error in public shop products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener productos' 
    });
  }
});

// Obtener configuración de la tienda
router.get('/shop/config', async (req, res) => {
  try {
    // Configuración específica de heladería
    const config = {
      storeName: 'Venezia Gelato Artesanal',
      storeEmail: 'pedidos@veneziagelato.com',
      storePhone: '+54 11 4567-8900',
      storeAddress: 'Av. Corrientes 1234, CABA, Buenos Aires',
      deliveryEnabled: true,
      deliveryFee: 350,
      minimumOrderAmount: 2000,
      workingHours: {
        monday: { open: '12:00', close: '23:00' },
        tuesday: { open: '12:00', close: '23:00' },
        wednesday: { open: '12:00', close: '23:00' },
        thursday: { open: '12:00', close: '23:00' },
        friday: { open: '12:00', close: '00:00' },
        saturday: { open: '11:00', close: '00:00' },
        sunday: { open: '11:00', close: '23:00' }
      },
      specialFeatures: {
        hasVeganOptions: true,
        hasSugarFreeOptions: true,
        hasGlutenFreeOptions: true,
        customFlavors: true,
        cateringService: true
      }
    };

    res.json({ 
      success: true, 
      config 
    });
  } catch (error) {
    console.error('Error getting shop config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener configuración' 
    });
  }
});

// Crear orden desde la tienda web
router.post('/shop/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items,
      total,
      deliveryType,
      paymentMethod,
      notes
    } = req.body;

    // Validar datos requeridos
    if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos'
      });
    }

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('online_orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_type: deliveryType || 'pickup',
        payment_method: paymentMethod || 'cash',
        items: items,
        total: total,
        status: 'pending',
        notes: notes,
        order_number: `WEB-${Date.now()}`
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // TODO: Enviar email de confirmación
    // TODO: Notificar al panel de administración

    res.json({
      success: true,
      order: order,
      message: 'Orden creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la orden'
    });
  }
});

// Obtener estado de una orden por número
router.get('/shop/orders/:orderNumber/status', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const { data: order, error } = await supabase
      .from('online_orders')
      .select('order_number, status, created_at, estimated_time')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error getting order status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de la orden'
    });
  }
});

// Verificar disponibilidad de productos
router.post('/shop/check-availability', async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: 'IDs de productos requeridos'
      });
    }

    // Por ahora asumimos que todos están disponibles
    // Luego esto puede verificar stock real
    const availability = productIds.reduce((acc, id) => {
      acc[id] = {
        available: true,
        stock: 100 // Mock stock
      };
      return acc;
    }, {});

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar disponibilidad'
    });
  }
});

module.exports = router;