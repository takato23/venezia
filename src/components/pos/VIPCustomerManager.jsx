import React, { useMemo } from 'react';
import { Star, Crown, Gift, TrendingUp, Calendar, Phone, Mail } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const VIPCustomerManager = ({ customer = null, cart = [], onApplyVIPBenefit, className = "" }) => {
  
  // Análisis del estado VIP del cliente
  const vipAnalysis = useMemo(() => {
    if (!customer) return null;

    const totalOrders = customer.total_orders || 0;
    const totalSpent = customer.total_spent || 0;
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Criterios VIP
    const vipThresholds = {
      bronze: { orders: 5, spent: 1000 },
      silver: { orders: 10, spent: 2500 },
      gold: { orders: 20, spent: 5000 },
      platinum: { orders: 50, spent: 12000 }
    };

    // Determinar nivel VIP actual
    let currentTier = 'regular';
    let nextTier = 'bronze';
    let currentBenefits = [];
    let nextTierProgress = 0;

    if (totalOrders >= vipThresholds.platinum.orders && totalSpent >= vipThresholds.platinum.spent) {
      currentTier = 'platinum';
      nextTier = null;
      currentBenefits = ['30% descuento', 'Envío gratis', 'Productos exclusivos', 'Atención prioritaria', 'Regalos especiales'];
    } else if (totalOrders >= vipThresholds.gold.orders && totalSpent >= vipThresholds.gold.spent) {
      currentTier = 'gold';
      nextTier = 'platinum';
      currentBenefits = ['25% descuento', 'Envío gratis', 'Productos exclusivos', 'Atención prioritaria'];
      const ordersNeeded = vipThresholds.platinum.orders - totalOrders;
      const spentNeeded = vipThresholds.platinum.spent - totalSpent;
      nextTierProgress = Math.min(
        (totalOrders / vipThresholds.platinum.orders) * 100,
        (totalSpent / vipThresholds.platinum.spent) * 100
      );
    } else if (totalOrders >= vipThresholds.silver.orders && totalSpent >= vipThresholds.silver.spent) {
      currentTier = 'silver';
      nextTier = 'gold';
      currentBenefits = ['20% descuento', 'Envío gratis', 'Productos exclusivos'];
      nextTierProgress = Math.min(
        (totalOrders / vipThresholds.gold.orders) * 100,
        (totalSpent / vipThresholds.gold.spent) * 100
      );
    } else if (totalOrders >= vipThresholds.bronze.orders && totalSpent >= vipThresholds.bronze.spent) {
      currentTier = 'bronze';
      nextTier = 'silver';
      currentBenefits = ['15% descuento', 'Puntos dobles'];
      nextTierProgress = Math.min(
        (totalOrders / vipThresholds.silver.orders) * 100,
        (totalSpent / vipThresholds.silver.spent) * 100
      );
    } else {
      nextTierProgress = Math.min(
        (totalOrders / vipThresholds.bronze.orders) * 100,
        (totalSpent / vipThresholds.bronze.spent) * 100
      );
    }

    // Beneficios aplicables a la compra actual
    const availableBenefits = [];
    
    if (currentTier !== 'regular') {
      // Descuento VIP
      const discountPercent = {
        bronze: 15,
        silver: 20,
        gold: 25,
        platinum: 30
      }[currentTier];

      availableBenefits.push({
        id: 'vip_discount',
        type: 'discount',
        title: `${discountPercent}% Descuento VIP`,
        description: `Descuento exclusivo para miembros ${currentTier.toUpperCase()}`,
        value: discountPercent,
        icon: Star,
        color: getTierColor(currentTier)
      });

      // Puntos dobles en ciertas condiciones
      if (['bronze', 'silver'].includes(currentTier) && cartTotal > 300) {
        availableBenefits.push({
          id: 'double_points',
          type: 'points',
          title: 'Puntos Dobles',
          description: 'Gana puntos dobles en esta compra',
          value: cartTotal * 0.02, // 2% del total como puntos
          icon: Gift,
          color: 'purple'
        });
      }

      // Envío gratis para Silver+
      if (['silver', 'gold', 'platinum'].includes(currentTier)) {
        availableBenefits.push({
          id: 'free_shipping',
          type: 'shipping',
          title: 'Envío Gratis',
          description: 'Delivery sin costo adicional',
          value: 0,
          icon: TrendingUp,
          color: 'green'
        });
      }

      // Regalo especial para Gold+
      if (['gold', 'platinum'].includes(currentTier) && cartTotal > 500) {
        availableBenefits.push({
          id: 'special_gift',
          type: 'gift',
          title: 'Regalo Especial',
          description: 'Producto de cortesía incluido',
          value: 'Helado premium 1/4kg',
          icon: Gift,
          color: 'yellow'
        });
      }
    }

    // Sugerencias para alcanzar el siguiente nivel
    const nextTierSuggestions = [];
    if (nextTier && vipThresholds[nextTier]) {
      const ordersNeeded = Math.max(0, vipThresholds[nextTier].orders - totalOrders);
      const spentNeeded = Math.max(0, vipThresholds[nextTier].spent - totalSpent);
      
      if (ordersNeeded > 0) {
        nextTierSuggestions.push(`${ordersNeeded} compras más`);
      }
      if (spentNeeded > 0) {
        nextTierSuggestions.push(`$${spentNeeded} más en compras`);
      }
    }

    return {
      currentTier,
      nextTier,
      currentBenefits,
      availableBenefits,
      nextTierProgress,
      nextTierSuggestions,
      customerStats: {
        totalOrders,
        totalSpent,
        averageTicket: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : 0
      }
    };
  }, [customer, cart]);

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'orange',
      silver: 'gray',
      gold: 'yellow',
      platinum: 'purple'
    };
    return colors[tier] || 'gray';
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: Star,
      silver: Star,
      gold: Crown,
      platinum: Crown
    };
    return icons[tier] || Star;
  };

  if (!customer || !vipAnalysis) {
    return (
      <div className={`bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-gray-400" />
          <h4 className="font-medium text-gray-600 dark:text-gray-400">
            👤 Cliente VIP
          </h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un cliente para ver sus beneficios VIP
        </p>
      </div>
    );
  }

  const { currentTier, nextTier, availableBenefits, nextTierProgress, nextTierSuggestions, customerStats } = vipAnalysis;
  const TierIcon = getTierIcon(currentTier);

  if (currentTier === 'regular') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-gray-900 dark:text-white">
            👤 {customer.name}
          </h4>
          <Badge variant="blue" size="sm">Regular</Badge>
        </div>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            📊 {customerStats.totalOrders} compras • ${customerStats.totalSpent} gastado
          </div>
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Progreso a Bronze VIP
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {Math.round(nextTierProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${nextTierProgress}%` }}
              />
            </div>
            {nextTierSuggestions.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💎 Para Bronze VIP: {nextTierSuggestions.join(' y ')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-700 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TierIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <h4 className="font-medium text-gray-900 dark:text-white">
          👑 {customer.name}
        </h4>
        <Badge variant={getTierColor(currentTier)} size="sm">
          {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} VIP
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Stats del cliente */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
            <div className="font-medium text-gray-900 dark:text-white">{customerStats.totalOrders}</div>
            <div className="text-gray-600 dark:text-gray-400">Compras</div>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
            <div className="font-medium text-gray-900 dark:text-white">${customerStats.totalSpent}</div>
            <div className="text-gray-600 dark:text-gray-400">Gastado</div>
          </div>
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
            <div className="font-medium text-gray-900 dark:text-white">${customerStats.averageTicket}</div>
            <div className="text-gray-600 dark:text-gray-400">Promedio</div>
          </div>
        </div>

        {/* Beneficios disponibles */}
        {availableBenefits.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              🎁 Beneficios Disponibles:
            </p>
            {availableBenefits.map((benefit) => {
              const BenefitIcon = benefit.icon;
              return (
                <div key={benefit.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BenefitIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {benefit.title}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          {benefit.description}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyVIPBenefit && onApplyVIPBenefit(benefit)}
                      className="flex items-center gap-1"
                    >
                      <Gift className="h-3 w-3" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progreso al siguiente nivel */}
        {nextTier && (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Progreso a {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}
              </span>
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                {Math.round(nextTierProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${nextTierProgress}%` }}
              />
            </div>
            {nextTierSuggestions.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💎 Faltan: {nextTierSuggestions.join(' y ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          👑 Cliente VIP con beneficios exclusivos y atención preferencial
        </p>
      </div>
    </div>
  );
};

export default VIPCustomerManager;