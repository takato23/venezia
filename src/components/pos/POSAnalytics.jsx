import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Target,
  Truck,
  Clock,
  Users
} from 'lucide-react';
import { useApiCache } from '../../hooks/useApiCache';
import LoadingSpinner from '../ui/LoadingSpinner';

const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue', isLoading = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                {value}
              </p>
            )}
            {trend && (
              <span className={`text-xs flex items-center gap-1 ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );
};

const POSAnalytics = ({ className = "" }) => {
  const { 
    data: liveMetrics, 
    loading: loadingMetrics 
  } = useApiCache('/api/pos/live-metrics', {
    refreshInterval: 30000 // Actualizar cada 30 segundos
  });

  const metrics = liveMetrics?.data || {};

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📊 Métricas en Vivo
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Actualizado cada 30s</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas Hoy"
          value={`$${metrics.todaySales?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="green"
          isLoading={loadingMetrics}
        />
        
        <MetricCard
          title="Ticket Promedio"
          value={`$${metrics.avgTicket?.toFixed(2) || '0.00'}`}
          icon={Target}
          color="blue"
          isLoading={loadingMetrics}
        />
        
        <MetricCard
          title="Productos Vendidos"
          value={metrics.itemsSold || 0}
          icon={ShoppingCart}
          color="purple"
          isLoading={loadingMetrics}
        />
        
        <MetricCard
          title="Eficiencia"
          value={`${metrics.efficiency || 0} v/h`}
          icon={TrendingUp}
          color="orange"
          isLoading={loadingMetrics}
        />
      </div>

      {/* Delivery Metrics (if there are any) */}
      {metrics.deliveries && (metrics.deliveries.total > 0 || metrics.deliveries.pending > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Estado de Deliveries Hoy
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.deliveries.total || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {metrics.deliveries.pending || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.deliveries.in_transit || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En Tránsito</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Insights */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">💡 Insights Rápidos</h4>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {metrics.salesCount > 0 ? (
            <>
              <p>• Llevas {metrics.salesCount} ventas realizadas hoy</p>
              <p>• Tu eficiencia actual es {metrics.efficiency} ventas por hora</p>
              {metrics.avgTicket > 50 && (
                <p className="text-green-600 dark:text-green-400">• ¡Excelente ticket promedio!</p>
              )}
            </>
          ) : (
            <p>• ¡Aún no hay ventas hoy! Es momento de empezar 🚀</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSAnalytics;