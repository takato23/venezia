import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, DollarSign, Users, Package,
  ShoppingCart, Clock, Calendar, Download, RefreshCw,
  BarChart3, PieChart, Activity, ArrowUp, ArrowDown,
  Star, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '../../config/supabase';
import { formatCurrency } from '../../utils/formatters';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BranchMetrics = ({ branch, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [metrics, setMetrics] = useState({
    revenue: { current: 0, previous: 0, trend: 0 },
    sales: { current: 0, previous: 0, trend: 0 },
    avgTicket: { current: 0, previous: 0, trend: 0 },
    customers: { current: 0, previous: 0, trend: 0 },
    topProducts: [],
    hourlyDistribution: [],
    categoryBreakdown: [],
    employeePerformance: [],
    inventoryStatus: { healthy: 0, low: 0, critical: 0 },
    customerSatisfaction: 0,
    operationalEfficiency: 0
  });

  useEffect(() => {
    loadMetrics();
  }, [branch, dateRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = getStartDate(dateRange);
      const previousStartDate = getPreviousStartDate(dateRange);
      
      // Cargar ventas del período actual
      const { data: currentSales } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(name, category))')
        .eq('branch_id', branch.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Cargar ventas del período anterior
      const { data: previousSales } = await supabase
        .from('sales')
        .select('*')
        .eq('branch_id', branch.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calcular métricas básicas
      const currentRevenue = currentSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const previousRevenue = previousSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentSalesCount = currentSales?.length || 0;
      const previousSalesCount = previousSales?.length || 0;
      const salesTrend = previousSalesCount > 0 ? ((currentSalesCount - previousSalesCount) / previousSalesCount) * 100 : 0;

      const currentAvgTicket = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
      const previousAvgTicket = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;
      const avgTicketTrend = previousAvgTicket > 0 ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100 : 0;

      // Clientes únicos
      const currentCustomers = new Set(currentSales?.map(s => s.customer_id).filter(Boolean)).size;
      const previousCustomers = new Set(previousSales?.map(s => s.customer_id).filter(Boolean)).size;
      const customersTrend = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

      // Top productos
      const productSales = {};
      currentSales?.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const productName = item.products.name;
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0,
              category: item.products.category
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.price * item.quantity;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Distribución por hora
      const hourlyDistribution = Array(24).fill(0);
      currentSales?.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        hourlyDistribution[hour]++;
      });

      // Categorías
      const categoryBreakdown = {};
      currentSales?.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const category = item.products.category || 'Sin categoría';
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = 0;
          }
          categoryBreakdown[category] += item.price * item.quantity;
        });
      });

      // Estado del inventario
      const { data: inventory } = await supabase
        .from('branch_inventory')
        .select('current_stock, min_stock')
        .eq('branch_id', branch.id);

      const inventoryStatus = {
        healthy: 0,
        low: 0,
        critical: 0
      };

      inventory?.forEach(item => {
        const stockRatio = item.current_stock / item.min_stock;
        if (stockRatio > 1.5) inventoryStatus.healthy++;
        else if (stockRatio > 0.5) inventoryStatus.low++;
        else inventoryStatus.critical++;
      });

      // Satisfacción del cliente (simulada - en producción vendría de reseñas)
      const customerSatisfaction = 4.2 + Math.random() * 0.6;

      // Eficiencia operacional (simulada)
      const operationalEfficiency = 75 + Math.random() * 20;

      setMetrics({
        revenue: { current: currentRevenue, previous: previousRevenue, trend: revenueTrend },
        sales: { current: currentSalesCount, previous: previousSalesCount, trend: salesTrend },
        avgTicket: { current: currentAvgTicket, previous: previousAvgTicket, trend: avgTicketTrend },
        customers: { current: currentCustomers, previous: previousCustomers, trend: customersTrend },
        topProducts,
        hourlyDistribution,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
        inventoryStatus,
        customerSatisfaction,
        operationalEfficiency
      });

    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range) => {
    const date = new Date();
    switch (range) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  };

  const getPreviousStartDate = (range) => {
    const date = getStartDate(range);
    switch (range) {
      case 'today':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  };

  const MetricCard = ({ title, current, previous, trend, icon: Icon, color, format = 'number' }) => {
    const formattedValue = format === 'currency' ? formatCurrency(current) : current.toLocaleString();
    const isPositive = trend >= 0;
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{formattedValue}</p>
        <p className="text-xs text-gray-500 mt-1">
          vs {format === 'currency' ? formatCurrency(previous) : previous.toLocaleString()} anterior
        </p>
      </div>
    );
  };

  const exportReport = () => {
    // Implementar exportación a PDF/Excel
    console.log('Exporting report...');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-50 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Métricas de {branch.name}
              </h2>
              <p className="text-gray-600 mt-1">Análisis detallado del rendimiento</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['today', 'week', 'month', 'year'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      dateRange === range
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {range === 'today' ? 'Hoy' :
                     range === 'week' ? 'Semana' :
                     range === 'month' ? 'Mes' : 'Año'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={exportReport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exportar reporte"
              >
                <Download className="h-5 w-5" />
              </button>
              
              <button
                onClick={loadMetrics}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Ingresos"
                  current={metrics.revenue.current}
                  previous={metrics.revenue.previous}
                  trend={metrics.revenue.trend}
                  icon={DollarSign}
                  color="bg-green-500"
                  format="currency"
                />
                <MetricCard
                  title="Ventas"
                  current={metrics.sales.current}
                  previous={metrics.sales.previous}
                  trend={metrics.sales.trend}
                  icon={ShoppingCart}
                  color="bg-blue-500"
                />
                <MetricCard
                  title="Ticket Promedio"
                  current={metrics.avgTicket.current}
                  previous={metrics.avgTicket.previous}
                  trend={metrics.avgTicket.trend}
                  icon={TrendingUp}
                  color="bg-purple-500"
                  format="currency"
                />
                <MetricCard
                  title="Clientes"
                  current={metrics.customers.current}
                  previous={metrics.customers.previous}
                  trend={metrics.customers.trend}
                  icon={Users}
                  color="bg-orange-500"
                />
              </div>

              {/* Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Satisfaction */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Satisfacción del Cliente
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="8"
                          strokeDasharray={`${(metrics.customerSatisfaction / 5) * 377} 377`}
                          strokeLinecap="round"
                          transform="rotate(-90 64 64)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{metrics.customerSatisfaction.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">de 5.0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Efficiency */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Eficiencia Operacional
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          strokeDasharray={`${(metrics.operationalEfficiency / 100) * 377} 377`}
                          strokeLinecap="round"
                          transform="rotate(-90 64 64)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{metrics.operationalEfficiency.toFixed(0)}%</p>
                          <p className="text-sm text-gray-500">Eficiencia</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Status */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    Estado del Inventario
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Stock Saludable</span>
                      </div>
                      <span className="font-semibold">{metrics.inventoryStatus.healthy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm">Stock Bajo</span>
                      </div>
                      <span className="font-semibold">{metrics.inventoryStatus.low}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Stock Crítico</span>
                      </div>
                      <span className="font-semibold">{metrics.inventoryStatus.critical}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Distribution */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Distribución de Ventas por Hora</h3>
                  <Bar
                    data={{
                      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                      datasets: [{
                        label: 'Ventas',
                        data: metrics.hourlyDistribution,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Ventas por Categoría</h3>
                  <Doughnut
                    data={{
                      labels: metrics.categoryBreakdown.map(c => c.name),
                      datasets: [{
                        data: metrics.categoryBreakdown.map(c => c.value),
                        backgroundColor: [
                          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                          '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Top Products Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="font-semibold">Productos Más Vendidos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingresos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.topProducts.map((product, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BranchMetrics;