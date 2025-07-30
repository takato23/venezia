import React, { useMemo } from 'react';
import { Percent, Tag, Star, Users, Calendar, Gift } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const DynamicDiscounts = ({ cart = [], customer = null, onApplyDiscount, className = "" }) => {
  
  // Motor de descuentos dinámicos con reglas de negocio
  const availableDiscounts = useMemo(() => {
    if (cart.length === 0) return [];

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueProducts = cart.length;
    
    const discounts = [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = domingo, 6 = sábado

    // REGLA 1: Descuento por volumen
    if (itemCount >= 5) {
      discounts.push({
        id: 'bulk_discount',
        type: 'percent',
        value: itemCount >= 10 ? 20 : 15,
        title: `${itemCount >= 10 ? '20%' : '15%'} por Volumen`,
        description: `Compraste ${itemCount} productos`,
        reason: 'bulk',
        priority: 3,
        icon: Tag,
        color: 'purple',
        condition: `${itemCount} productos o más`
      });
    }

    // REGLA 2: Descuento por monto
    if (cartTotal >= 500) {
      const discountPercent = cartTotal >= 1000 ? 15 : 10;
      discounts.push({
        id: 'amount_discount',
        type: 'percent',
        value: discountPercent,
        title: `${discountPercent}% por Monto Alto`,
        description: `Compra de $${cartTotal.toFixed(2)}`,
        reason: 'amount',
        priority: 3,
        icon: Gift,
        color: 'green',
        condition: `Compras sobre $${cartTotal >= 1000 ? '1000' : '500'}`
      });
    }

    // REGLA 3: Cliente VIP
    if (customer?.total_orders >= 10 || customer?.total_spent >= 2000) {
      discounts.push({
        id: 'vip_discount',
        type: 'percent',
        value: 25,
        title: '25% Cliente VIP',
        description: `${customer.total_orders} órdenes | $${customer.total_spent} gastado`,
        reason: 'vip',
        priority: 4,
        icon: Star,
        color: 'yellow',
        condition: 'Cliente frecuente'
      });
    }

    // REGLA 4: Happy Hour (14:00 - 17:00)
    if (currentHour >= 14 && currentHour <= 17) {
      discounts.push({
        id: 'happy_hour',
        type: 'percent',
        value: 10,
        title: '10% Happy Hour',
        description: 'Promoción de tarde (14-17hs)',
        reason: 'time',
        priority: 2,
        icon: Calendar,
        color: 'blue',
        condition: 'Válido hasta las 17:00'
      });
    }

    // REGLA 5: Combo heladería (helado + complemento)
    const hasIceCream = cart.some(item => 
      item.name?.toLowerCase().includes('helado') || 
      item.category?.toLowerCase().includes('helado')
    );
    const hasComplement = cart.some(item => 
      item.name?.toLowerCase().includes('cono') || 
      item.name?.toLowerCase().includes('topping') ||
      item.category?.toLowerCase().includes('complemento')
    );
    
    if (hasIceCream && hasComplement) {
      discounts.push({
        id: 'combo_discount',
        type: 'fixed',
        value: 50,
        title: '$50 Combo Heladería',
        description: 'Helado + Complemento',
        reason: 'combo',
        priority: 2,
        icon: Gift,
        color: 'orange',
        condition: 'Helado + Cono/Topping'
      });
    }

    // REGLA 6: Fin de semana (Sábado y Domingo)
    if (currentDay === 0 || currentDay === 6) {
      discounts.push({
        id: 'weekend_special',
        type: 'percent',
        value: 12,
        title: '12% Especial Fin de Semana',
        description: 'Promoción de weekend',
        reason: 'weekend',
        priority: 2,
        icon: Calendar,
        color: 'pink',
        condition: 'Solo sábados y domingos'
      });
    }

    // REGLA 7: Descuento por variedad (3+ productos diferentes)
    if (uniqueProducts >= 3) {
      discounts.push({
        id: 'variety_discount',
        type: 'percent',
        value: 8,
        title: '8% por Variedad',
        description: `${uniqueProducts} productos diferentes`,
        reason: 'variety',
        priority: 1,
        icon: Users,
        color: 'teal',
        condition: '3 o más productos diferentes'
      });
    }

    // Ordenar por prioridad y tomar los mejores
    return discounts
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Máximo 3 descuentos para no saturar
      
  }, [cart, customer]);

  // Calcular el mejor descuento disponible
  const bestDiscount = useMemo(() => {
    if (availableDiscounts.length === 0) return null;
    
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return availableDiscounts.reduce((best, current) => {
      const currentSavings = current.type === 'percent' 
        ? cartTotal * (current.value / 100)
        : current.value;
      
      const bestSavings = best.type === 'percent'
        ? cartTotal * (best.value / 100)
        : best.value;
        
      return currentSavings > bestSavings ? current : best;
    });
  }, [availableDiscounts, cart]);

  const getDiscountIcon = (reason) => {
    const iconMap = {
      bulk: Tag,
      amount: Gift,
      vip: Star,
      time: Calendar,
      combo: Gift,
      weekend: Calendar,
      variety: Users
    };
    return iconMap[reason] || Percent;
  };

  if (availableDiscounts.length === 0) return null;

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="font-medium text-gray-900 dark:text-white">
          🎉 Descuentos Disponibles
        </h4>
        {bestDiscount && (
          <Badge variant="success" size="sm">
            Mejor: {bestDiscount.type === 'percent' ? `${bestDiscount.value}%` : `$${bestDiscount.value}`}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        {availableDiscounts.map((discount) => {
          const DiscountIcon = getDiscountIcon(discount.reason);
          const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const savings = discount.type === 'percent' 
            ? cartTotal * (discount.value / 100)
            : discount.value;
          
          return (
            <div
              key={discount.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={discount.color} size="sm">
                    <DiscountIcon className="h-3 w-3 mr-1" />
                    {discount.title}
                  </Badge>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Ahorras: ${savings.toFixed(2)}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyDiscount(discount)}
                  className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                >
                  <Tag className="h-3 w-3" />
                  Aplicar
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {discount.description}
              </p>
              
              <p className="text-xs text-gray-500 dark:text-gray-500">
                📋 Condición: {discount.condition}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Los descuentos se calculan automáticamente según tus compras
        </p>
      </div>
    </div>
  );
};

export default DynamicDiscounts;