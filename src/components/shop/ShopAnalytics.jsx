import React, { useState, useMemo } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Star,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  ShoppingBag,
  CreditCard,
  Target,
  Award
} from 'lucide-react';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const ShopAnalytics = ({ orders = [], products = [], customers = [] }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [metricView, setMetricView] = useState('overview');
  
  // Filtrar datos por rango de tiempo
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    );
    
    return { orders: filteredOrders };
  }, [orders, timeRange]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const { orders: filteredOrders } = filteredData;
    
    // Métricas generales
    const totalRevenue = filteredOrders
      .filter(o => o.status === 'delivered' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => 
      o.status === 'delivered' || o.status === 'completed'
    ).length;
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0;
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    // Productos más vendidos
    const productSales = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total || 0;
        productSales[item.productId].orders += 1;
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Clientes frecuentes
    const customerOrders = {};
    filteredOrders.forEach(order => {
      const customerId = order.customer?.id || order.customer?.email;
      if (!customerId) return;
      
      if (!customerOrders[customerId]) {
        customerOrders[customerId] = {
          name: order.customer.name,
          orders: 0,
          totalSpent: 0,
          lastOrder: order.created_at
        };
      }
      customerOrders[customerId].orders += 1;
      customerOrders[customerId].totalSpent += order.total || 0;
      
      if (new Date(order.created_at) > new Date(customerOrders[customerId].lastOrder)) {
        customerOrders[customerId].lastOrder = order.created_at;
      }
    });
    
    const topCustomers = Object.entries(customerOrders)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    // Ventas por día/hora
    const salesByDay = {};
    const salesByHour = Array(24).fill(0);
    
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { orders: 0, revenue: 0 };
      }
      salesByDay[dayKey].orders += 1;
      salesByDay[dayKey].revenue += order.total || 0;
      
      salesByHour[hour] += order.total || 0;
    });
    
    // Tasa de abandono
    const abandonedCarts = filteredOrders.filter(o => o.status === 'abandoned').length;
    const abandonmentRate = totalOrders > 0 ? (abandonedCarts / totalOrders) * 100 : 0;
    
    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      averageOrderValue,
      conversionRate,
      abandonmentRate,
      topProducts,
      topCustomers,
      salesByDay,
      salesByHour
    };
  }, [filteredData]);

  // Comparar con período anterior
  const comparison = useMemo(() => {
    // Simplificado para el ejemplo
    return {
      revenue: { current: metrics.totalRevenue, previous: metrics.totalRevenue * 0.8, change: 25 },
      orders: { current: metrics.totalOrders, previous: Math.floor(metrics.totalOrders * 0.9), change: 11 },
      avgOrder: { current: metrics.averageOrderValue, previous: metrics.averageOrderValue * 0.95, change: 5 }
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </Select>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMetricView('overview')}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                metricView === 'overview' 
                  ? "bg-venezia-600 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              General
            </button>
            <button
              onClick={() => setMetricView('products')}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                metricView === 'products' 
                  ? "bg-venezia-600 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              Productos
            </button>
            <button
              onClick={() => setMetricView('customers')}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                metricView === 'customers' 
                  ? "bg-venezia-600 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              Clientes
            </button>
          </div>
        </div>
      </div>

      {/* Vista General */}
      {metricView === 'overview' && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ingresos Totales"
              value={`$${metrics.totalRevenue.toLocaleString()}`}
              change={comparison.revenue.change}
              icon={DollarSign}
              color="green"
            />
            <MetricCard
              title="Órdenes Totales"
              value={metrics.totalOrders}
              change={comparison.orders.change}
              icon={ShoppingCart}
              color="blue"
            />
            <MetricCard
              title="Ticket Promedio"
              value={`$${Math.round(metrics.averageOrderValue).toLocaleString()}`}
              change={comparison.avgOrder.change}
              icon={CreditCard}
              color="purple"
            />
            <MetricCard
              title="Tasa de Conversión"
              value={`${metrics.conversionRate.toFixed(1)}%`}
              change={0}
              icon={Target}
              color="orange"
            />
          </div>

          {/* Gráfico de ventas por día */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Ventas por Día
            </h3>
            <div className="h-64 flex items-end gap-2">
              {Object.entries(metrics.salesByDay).slice(-7).map(([date, data]) => {
                const maxRevenue = Math.max(...Object.values(metrics.salesByDay).map(d => d.revenue));
                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-venezia-500 rounded-t hover:bg-venezia-600 transition-colors relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${data.revenue.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(date).toLocaleDateString('es', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métricas secundarias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horarios pico */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Horarios de Mayor Venta
              </h3>
              <div className="space-y-3">
                {metrics.salesByHour
                  .map((revenue, hour) => ({ hour, revenue }))
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map(({ hour, revenue }) => (
                    <div key={hour} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {hour}:00 - {hour + 1}:00
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-venezia-500 h-2 rounded-full"
                            style={{ width: `${(revenue / Math.max(...metrics.salesByHour)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20 text-right">
                          ${revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tasa de abandono */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Rendimiento de Conversión
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de conversión</span>
                    <span className="text-sm font-medium">{metrics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${metrics.conversionRate}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de abandono</span>
                    <span className="text-sm font-medium">{metrics.abandonmentRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${metrics.abandonmentRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Productos */}
      {metricView === 'products' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Productos Más Vendidos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Órdenes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tendencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.topProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {index + 1}. {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {product.orders}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        ${product.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Clientes */}
      {metricView === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Mejores Clientes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Órdenes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total Gastado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Última Orden
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.topCustomers.map((customer, index) => {
                    const daysSinceLastOrder = Math.floor(
                      (Date.now() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {customer.orders}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          ${customer.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                          Hace {daysSinceLastOrder} días
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge 
                            variant={daysSinceLastOrder < 30 ? 'success' : daysSinceLastOrder < 60 ? 'warning' : 'danger'}
                            size="sm"
                          >
                            {daysSinceLastOrder < 30 ? 'Activo' : daysSinceLastOrder < 60 ? 'En riesgo' : 'Inactivo'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente MetricCard
const MetricCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={clsx("p-3 rounded-lg", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== 0 && (
          <div className={clsx(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
};

export default ShopAnalytics;