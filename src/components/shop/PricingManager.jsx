import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Percent,
  History,
  Edit,
  Save,
  X,
  AlertCircle,
  Tag
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const PricingManager = ({ 
  products = [], 
  onUpdatePricing,
  customerTiers = ['regular', 'silver', 'gold', 'platinum']
}) => {
  const { success, error, warning, info } = useToast();
  
  // Estados
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  
  // Configuración de precios dinámicos
  const [dynamicPricing, setDynamicPricing] = useState({
    enabled: false,
    rules: []
  });

  // Temporadas predefinidas
  const seasons = [
    { id: 'summer', name: 'Verano', months: [12, 1, 2], multiplier: 1.2 },
    { id: 'winter', name: 'Invierno', months: [6, 7, 8], multiplier: 0.9 },
    { id: 'spring', name: 'Primavera', months: [9, 10, 11], multiplier: 1.0 },
    { id: 'fall', name: 'Otoño', months: [3, 4, 5], multiplier: 1.0 }
  ];

  // Horarios de alta demanda
  const peakHours = [
    { id: 'lunch', name: 'Almuerzo', hours: [12, 13, 14], multiplier: 1.1 },
    { id: 'afternoon', name: 'Tarde', hours: [16, 17, 18, 19], multiplier: 1.15 },
    { id: 'night', name: 'Noche', hours: [20, 21, 22], multiplier: 1.05 }
  ];

  // Descuentos por volumen
  const volumeDiscounts = [
    { minQty: 5, discount: 5 },
    { minQty: 10, discount: 10 },
    { minQty: 20, discount: 15 },
    { minQty: 50, discount: 20 }
  ];

  // Calcular precio actual con todas las reglas
  const calculateDynamicPrice = (product, quantity = 1, customerTier = 'regular', date = new Date()) => {
    let basePrice = product.webPrice || product.price;
    let finalPrice = basePrice;
    let appliedRules = [];

    // Aplicar precio por temporada
    const currentMonth = date.getMonth() + 1;
    const season = seasons.find(s => s.months.includes(currentMonth));
    if (season && dynamicPricing.enabled) {
      finalPrice *= season.multiplier;
      appliedRules.push({
        type: 'season',
        name: `Temporada ${season.name}`,
        adjustment: `${((season.multiplier - 1) * 100).toFixed(0)}%`
      });
    }

    // Aplicar precio por horario
    const currentHour = date.getHours();
    const peakHour = peakHours.find(p => p.hours.includes(currentHour));
    if (peakHour && dynamicPricing.enabled) {
      finalPrice *= peakHour.multiplier;
      appliedRules.push({
        type: 'peakHour',
        name: `Horario ${peakHour.name}`,
        adjustment: `+${((peakHour.multiplier - 1) * 100).toFixed(0)}%`
      });
    }

    // Aplicar descuento por volumen
    const volumeDiscount = volumeDiscounts
      .filter(v => quantity >= v.minQty)
      .sort((a, b) => b.discount - a.discount)[0];
    
    if (volumeDiscount) {
      const discountAmount = finalPrice * (volumeDiscount.discount / 100);
      finalPrice -= discountAmount;
      appliedRules.push({
        type: 'volume',
        name: `Descuento por volumen (${quantity} unidades)`,
        adjustment: `-${volumeDiscount.discount}%`
      });
    }

    // Aplicar descuento por tier de cliente
    const tierDiscounts = {
      regular: 0,
      silver: 5,
      gold: 10,
      platinum: 15
    };
    
    const tierDiscount = tierDiscounts[customerTier] || 0;
    if (tierDiscount > 0) {
      finalPrice *= (1 - tierDiscount / 100);
      appliedRules.push({
        type: 'customerTier',
        name: `Cliente ${customerTier}`,
        adjustment: `-${tierDiscount}%`
      });
    }

    return {
      basePrice,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discount: basePrice - finalPrice,
      discountPercentage: ((basePrice - finalPrice) / basePrice * 100).toFixed(1),
      appliedRules
    };
  };

  // Guardar cambio de precio
  const savePriceChange = async (productId, newPrice, reason = '') => {
    try {
      // Guardar en historial
      const historyEntry = {
        productId,
        previousPrice: selectedProduct.webPrice,
        newPrice,
        changedAt: new Date().toISOString(),
        changedBy: 'current_user', // En producción vendría del contexto de auth
        reason
      };

      const response = await fetch('/api/shop/products/price-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyEntry)
      });

      if (response.ok) {
        await onUpdatePricing(productId, { webPrice: newPrice });
        success('Precio actualizado', `Nuevo precio: $${newPrice}`);
        setShowPricingModal(false);
      } else {
        throw new Error('Error al actualizar precio');
      }
    } catch (err) {
      error('Error', 'No se pudo actualizar el precio');
    }
  };

  // Cargar historial de precios
  const loadPriceHistory = async (productId) => {
    try {
      const response = await fetch(`/api/shop/products/${productId}/price-history`);
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data.history || []);
        setShowHistoryModal(true);
      }
    } catch (err) {
      error('Error', 'No se pudo cargar el historial');
    }
  };

  // Configurar reglas de precios dinámicos
  const toggleDynamicPricing = async () => {
    try {
      const newState = !dynamicPricing.enabled;
      setDynamicPricing(prev => ({ ...prev, enabled: newState }));
      
      await fetch('/api/shop/config/dynamic-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState })
      });

      if (newState) {
        info('Precios dinámicos activados', 'Los precios se ajustarán automáticamente');
      } else {
        info('Precios dinámicos desactivados', 'Se usarán precios fijos');
      }
    } catch (err) {
      error('Error', 'No se pudo cambiar la configuración');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Gestión de Precios
          </h3>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dynamicPricing.enabled}
                onChange={toggleDynamicPricing}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Precios dinámicos
              </span>
            </label>
          </div>
        </div>

        {/* Indicadores de reglas activas */}
        {dynamicPricing.enabled && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" size="sm">
              <Calendar className="w-3 h-3 mr-1" />
              Ajuste por temporada activo
            </Badge>
            <Badge variant="info" size="sm">
              <Clock className="w-3 h-3 mr-1" />
              Ajuste por horario activo
            </Badge>
            <Badge variant="info" size="sm">
              <Users className="w-3 h-3 mr-1" />
              Descuentos por cliente activos
            </Badge>
          </div>
        )}
      </div>

      {/* Lista de productos con precios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Precios por Producto
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Precio Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Precio Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descuentos Activos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Última Actualización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(product => {
                const pricing = calculateDynamicPrice(product);
                const hasDiscount = pricing.finalPrice < pricing.basePrice;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${pricing.basePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "text-sm font-medium",
                          hasDiscount ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                        )}>
                          ${pricing.finalPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <Badge variant="success" size="xs">
                            -{pricing.discountPercentage}%
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {pricing.appliedRules.slice(0, 2).map((rule, index) => (
                          <Badge key={index} variant="default" size="xs">
                            {rule.adjustment}
                          </Badge>
                        ))}
                        {pricing.appliedRules.length > 2 && (
                          <Badge variant="default" size="xs">
                            +{pricing.appliedRules.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.priceUpdatedAt 
                        ? new Date(product.priceUpdatedAt).toLocaleDateString()
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowPricingModal(true);
                          }}
                          icon={Edit}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => loadPriceHistory(product.id)}
                          icon={History}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Descuentos por volumen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Descuentos por Volumen
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {volumeDiscounts.map((discount, index) => (
            <div 
              key={index}
              className="p-4 border dark:border-gray-700 rounded-lg text-center"
            >
              <div className="text-2xl font-bold text-venezia-600 dark:text-venezia-400">
                {discount.discount}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {discount.minQty}+ unidades
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edición de precio */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title="Actualizar Precio"
      >
        {selectedProduct && (
          <PriceEditForm
            product={selectedProduct}
            onSave={savePriceChange}
            onCancel={() => setShowPricingModal(false)}
            calculateDynamicPrice={calculateDynamicPrice}
          />
        )}
      </Modal>

      {/* Modal de historial */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Historial de Precios"
      >
        <div className="space-y-3">
          {priceHistory.map((entry, index) => (
            <div 
              key={index}
              className="p-3 border dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    ${entry.previousPrice} → ${entry.newPrice}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.changedAt).toLocaleString()}
                  </p>
                </div>
                <Badge 
                  variant={entry.newPrice > entry.previousPrice ? 'danger' : 'success'}
                  size="sm"
                >
                  {entry.newPrice > entry.previousPrice ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(((entry.newPrice - entry.previousPrice) / entry.previousPrice * 100)).toFixed(1)}%
                </Badge>
              </div>
              {entry.reason && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Motivo: {entry.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// Componente de formulario de edición de precio
const PriceEditForm = ({ product, onSave, onCancel, calculateDynamicPrice }) => {
  const [newPrice, setNewPrice] = useState(product.webPrice || product.price);
  const [reason, setReason] = useState('');
  
  const currentPricing = calculateDynamicPrice(product);
  const priceDifference = newPrice - currentPricing.basePrice;
  const percentageChange = ((priceDifference / currentPricing.basePrice) * 100).toFixed(1);
  
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Producto</p>
        <p className="font-medium">{product.name}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Precio actual</p>
          <p className="text-lg font-medium">${currentPricing.basePrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Precio con descuentos</p>
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            ${currentPricing.finalPrice.toFixed(2)}
          </p>
        </div>
      </div>
      
      <Input
        label="Nuevo precio base"
        type="number"
        step="0.01"
        value={newPrice}
        onChange={(e) => setNewPrice(parseFloat(e.target.value))}
        icon={DollarSign}
      />
      
      {priceDifference !== 0 && (
        <div className={clsx(
          "p-3 rounded-lg",
          priceDifference > 0 
            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
        )}>
          <div className="flex items-center gap-2">
            {priceDifference > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {priceDifference > 0 ? 'Aumento' : 'Reducción'} de {Math.abs(percentageChange)}%
            </span>
          </div>
        </div>
      )}
      
      <Input
        label="Motivo del cambio"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ej: Ajuste por costos, promoción especial..."
      />
      
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onSave(product.id, newPrice, reason)}
          icon={Save}
        >
          Guardar precio
        </Button>
      </div>
    </div>
  );
};

export default PricingManager;