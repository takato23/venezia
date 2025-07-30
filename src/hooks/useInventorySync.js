import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';

export const useInventorySync = (products = [], shopProducts = []) => {
  const { warning, info, error } = useToast();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [reservedStock, setReservedStock] = useState({});

  // Configuración de umbrales de stock
  const STOCK_THRESHOLDS = {
    critical: 5,
    low: 10,
    optimal: 20
  };

  // Verificar niveles de stock
  const checkStockLevels = useCallback(() => {
    const alerts = [];
    
    shopProducts.forEach(shopProduct => {
      const physicalProduct = products.find(p => p.id === shopProduct.productId);
      if (!physicalProduct) return;

      const availableStock = physicalProduct.stock - (reservedStock[physicalProduct.id] || 0);
      
      if (availableStock <= 0) {
        alerts.push({
          productId: physicalProduct.id,
          productName: physicalProduct.name,
          level: 'outOfStock',
          message: `${physicalProduct.name} está agotado`,
          availableStock: 0
        });
      } else if (availableStock <= STOCK_THRESHOLDS.critical) {
        alerts.push({
          productId: physicalProduct.id,
          productName: physicalProduct.name,
          level: 'critical',
          message: `${physicalProduct.name} tiene stock crítico (${availableStock} unidades)`,
          availableStock
        });
      } else if (availableStock <= STOCK_THRESHOLDS.low) {
        alerts.push({
          productId: physicalProduct.id,
          productName: physicalProduct.name,
          level: 'low',
          message: `${physicalProduct.name} tiene stock bajo (${availableStock} unidades)`,
          availableStock
        });
      }
    });

    setStockAlerts(alerts);
    
    // Notificar alertas críticas
    alerts.forEach(alert => {
      if (alert.level === 'outOfStock') {
        error('Stock Agotado', alert.message);
      } else if (alert.level === 'critical') {
        warning('Stock Crítico', alert.message);
      }
    });

    return alerts;
  }, [shopProducts, products, reservedStock, error, warning]);

  // Sincronizar inventario
  const syncInventory = useCallback(async () => {
    setSyncStatus('syncing');
    
    try {
      // Actualizar stock disponible en productos web
      const updates = [];
      
      for (const shopProduct of shopProducts) {
        const physicalProduct = products.find(p => p.id === shopProduct.productId);
        if (!physicalProduct) continue;

        const availableStock = physicalProduct.stock - (reservedStock[physicalProduct.id] || 0);
        
        // Si el stock cambió, actualizar
        if (shopProduct.availableStock !== availableStock) {
          updates.push({
            productId: shopProduct.id,
            availableStock,
            autoDisable: availableStock <= 0
          });
        }
      }

      // Enviar actualizaciones al backend
      if (updates.length > 0) {
        const response = await fetch('/api/shop/products/sync-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });

        if (response.ok) {
          info('Inventario Sincronizado', `${updates.length} productos actualizados`);
          setLastSync(new Date());
        } else {
          throw new Error('Error al sincronizar inventario');
        }
      }

      // Verificar niveles de stock después de sincronizar
      checkStockLevels();
      
      setSyncStatus('success');
    } catch (err) {
      error('Error de Sincronización', 'No se pudo sincronizar el inventario');
      setSyncStatus('error');
    }
  }, [shopProducts, products, reservedStock, checkStockLevels, info, error]);

  // Reservar stock para órdenes pendientes
  const reserveStock = useCallback((orderId, items) => {
    const newReservations = { ...reservedStock };
    
    items.forEach(item => {
      if (!newReservations[item.productId]) {
        newReservations[item.productId] = {};
      }
      newReservations[item.productId][orderId] = item.quantity;
    });

    setReservedStock(newReservations);
    
    // Actualizar el backend
    fetch('/api/shop/stock/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, items })
    });
  }, [reservedStock]);

  // Liberar stock reservado
  const releaseStock = useCallback((orderId) => {
    const newReservations = { ...reservedStock };
    
    Object.keys(newReservations).forEach(productId => {
      if (newReservations[productId][orderId]) {
        delete newReservations[productId][orderId];
      }
    });

    setReservedStock(newReservations);
    
    // Actualizar el backend
    fetch('/api/shop/stock/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
  }, [reservedStock]);

  // Auto-sync cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      syncInventory();
    }, 5 * 60 * 1000);

    // Sync inicial
    syncInventory();

    return () => clearInterval(interval);
  }, [syncInventory]);

  // Calcular stock disponible real
  const getAvailableStock = useCallback((productId) => {
    const physicalProduct = products.find(p => p.id === productId);
    if (!physicalProduct) return 0;

    const reserved = Object.values(reservedStock[productId] || {}).reduce((sum, qty) => sum + qty, 0);
    return Math.max(0, physicalProduct.stock - reserved);
  }, [products, reservedStock]);

  // Predecir agotamiento de stock
  const predictStockout = useCallback((productId, salesHistory = []) => {
    const availableStock = getAvailableStock(productId);
    if (availableStock === 0) return { days: 0, date: new Date() };

    // Calcular tasa de venta promedio (últimos 7 días)
    const recentSales = salesHistory.slice(-7);
    const averageDailySales = recentSales.length > 0 
      ? recentSales.reduce((sum, day) => sum + day.quantity, 0) / recentSales.length
      : 0;

    if (averageDailySales === 0) return { days: Infinity, date: null };

    const daysUntilStockout = Math.floor(availableStock / averageDailySales);
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

    return { days: daysUntilStockout, date: stockoutDate };
  }, [getAvailableStock]);

  return {
    syncStatus,
    lastSync,
    stockAlerts,
    syncInventory,
    reserveStock,
    releaseStock,
    getAvailableStock,
    predictStockout,
    checkStockLevels,
    reservedStock
  };
};