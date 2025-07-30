import React, { useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Clock, Zap } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const SmartStockManager = ({ cart = [], products = [], onAddToCart, className = "" }) => {
  
  // Motor de gestión inteligente de stock
  const stockAnalysis = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return null;

    const analysis = {
      lowStock: [],
      criticalStock: [],
      outOfStock: [],
      cartImpact: [],
      restockSuggestions: []
    };

    // Analizar cada producto
    products.forEach(product => {
      const currentStock = product.current_stock || 0;
      const minStock = product.minimum_stock || 10;
      const cartQuantity = cart.find(item => item.id === product.id)?.quantity || 0;
      const stockAfterCart = currentStock - cartQuantity;

      // Clasificar por nivel de stock
      if (currentStock === 0) {
        analysis.outOfStock.push({
          ...product,
          urgency: 'critical',
          message: 'Sin stock disponible'
        });
      } else if (currentStock <= minStock * 0.3) {
        analysis.criticalStock.push({
          ...product,
          urgency: 'critical',
          stockLevel: currentStock,
          daysLeft: Math.floor(currentStock / 3), // Asumiendo 3 ventas por día
          message: `Solo ${currentStock} unidades restantes`
        });
      } else if (currentStock <= minStock) {
        analysis.lowStock.push({
          ...product,
          urgency: 'medium',
          stockLevel: currentStock,
          daysLeft: Math.floor(currentStock / 2), // Asumiendo 2 ventas por día
          message: `Stock bajo: ${currentStock}/${minStock}`
        });
      }

      // Analizar impacto del carrito actual
      if (cartQuantity > 0 && stockAfterCart <= minStock) {
        analysis.cartImpact.push({
          ...product,
          cartQuantity,
          stockAfterCart,
          impact: stockAfterCart <= 0 ? 'critical' : 'warning',
          message: `Quedarán ${stockAfterCart} unidades tras la venta`
        });
      }
    });

    // Generar sugerencias de restock inteligentes
    [...analysis.criticalStock, ...analysis.lowStock]
      .sort((a, b) => a.stockLevel - b.stockLevel) // Ordenar por criticidad
      .slice(0, 5) // Top 5 más críticos
      .forEach(product => {
        const suggestedQuantity = Math.max(
          product.minimum_stock * 2, // Al menos el doble del mínimo
          50 // Cantidad mínima sugerida
        );
        
        analysis.restockSuggestions.push({
          ...product,
          suggestedQuantity,
          estimatedCost: (product.unit_cost || 50) * suggestedQuantity,
          priority: product.urgency === 'critical' ? 'high' : 'medium'
        });
      });

    return analysis;
  }, [products, cart]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'red';
      case 'warning': return 'yellow';
      case 'medium': return 'orange';
      default: return 'gray';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical': return AlertTriangle;
      case 'warning': return TrendingDown;
      default: return Package;
    }
  };

  if (!stockAnalysis) return null;

  const totalAlerts = stockAnalysis.criticalStock.length + 
                     stockAnalysis.lowStock.length + 
                     stockAnalysis.outOfStock.length +
                     stockAnalysis.cartImpact.length;

  if (totalAlerts === 0) return null;

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h4 className="font-medium text-gray-900 dark:text-white">
          📦 Gestión Inteligente de Stock
        </h4>
        <Badge variant="warning" size="sm">
          {totalAlerts} alertas
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Stock Crítico */}
        {stockAnalysis.criticalStock.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-900 dark:text-red-100">
                🚨 Stock Crítico ({stockAnalysis.criticalStock.length})
              </span>
            </div>
            <div className="space-y-2">
              {stockAnalysis.criticalStock.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {product.name}
                    </span>
                    <div className="text-red-700 dark:text-red-300">
                      {product.message} • ~{product.daysLeft} días
                    </div>
                  </div>
                  <Badge variant="red" size="sm">
                    {product.stockLevel} uds
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impacto del Carrito */}
        {stockAnalysis.cartImpact.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Impacto de Venta Actual
              </span>
            </div>
            <div className="space-y-2">
              {stockAnalysis.cartImpact.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-yellow-900 dark:text-yellow-100">
                      {item.name}
                    </span>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      {item.message}
                    </div>
                  </div>
                  <Badge variant={item.impact === 'critical' ? 'red' : 'yellow'} size="sm">
                    -{item.cartQuantity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Bajo */}
        {stockAnalysis.lowStock.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-orange-900 dark:text-orange-100">
                📉 Stock Bajo ({stockAnalysis.lowStock.length})
              </span>
            </div>
            <div className="space-y-1">
              {stockAnalysis.lowStock.slice(0, 2).map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-orange-900 dark:text-orange-100">
                    {product.name}
                  </span>
                  <Badge variant="orange" size="sm">
                    {product.stockLevel} uds
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias de Restock */}
        {stockAnalysis.restockSuggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  💡 Sugerencias de Restock
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {stockAnalysis.restockSuggestions.slice(0, 2).map((suggestion) => (
                <div key={suggestion.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                        {suggestion.name}
                      </span>
                      <div className="text-blue-700 dark:text-blue-300 text-xs">
                        Sugerido: {suggestion.suggestedQuantity} uds • ~${suggestion.estimatedCost}
                      </div>
                    </div>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'red' : 'blue'} 
                      size="sm"
                    >
                      {suggestion.priority === 'high' ? 'Urgente' : 'Pronto'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Simular navegación a inventario con filtro de stock bajo
            window.dispatchEvent(new CustomEvent('keyboardShortcut', {
              detail: { type: 'filter', action: 'low_stock', target: '/inventory' }
            }));
          }}
          className="flex items-center gap-1 text-xs"
        >
          <Package className="h-3 w-3" />
          Ver Inventario
        </Button>
        
        {stockAnalysis.restockSuggestions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Simular creación automática de orden de compra
              const totalCost = stockAnalysis.restockSuggestions
                .reduce((sum, item) => sum + item.estimatedCost, 0);
              
              window.dispatchEvent(new CustomEvent('notification', {
                detail: {
                  type: 'info',
                  title: '📋 Orden de Compra Sugerida',
                  message: `${stockAnalysis.restockSuggestions.length} productos • ~$${totalCost.toFixed(2)}`
                }
              }));
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Clock className="h-3 w-3" />
            Crear Orden
          </Button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          🤖 El sistema monitorea el stock automáticamente y sugiere reposiciones inteligentes
        </p>
      </div>
    </div>
  );
};

export default SmartStockManager;