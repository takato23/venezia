import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, TrendingUp, Users, Package, AlertTriangle, 
  ArrowUp, ArrowDown, DollarSign, ShoppingCart, Clock,
  MapPin, BarChart3, PieChart, Activity, Truck,
  Calendar, Filter, Download, RefreshCw, Settings,
  TrendingDown, Eye, ChevronRight
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
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// Registrar componentes de Chart.js
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

const CorporateDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    topProducts: [],
    revenueByBranch: [],
    salesTrend: [],
    inventoryAlerts: [],
    employeePerformance: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedBranches, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', user?.organization_id || 'demo')
        .eq('is_active', true);
      
      setBranches(branchData || []);
      
      if (selectedBranches.length === 0 && branchData) {
        setSelectedBranches(branchData.map(b => b.id));
      }
      
      await Promise.all([
        loadRevenueMetrics(),
        loadProductMetrics(),
        loadInventoryAlerts(),
        loadEmployeeMetrics()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueMetrics = async () => {
    const dateFilter = getDateFilter();
    
    const { data: salesData } = await supabase
      .from('sales')
      .select('*, branches(name)')
      .in('branch_id', selectedBranches.length > 0 ? selectedBranches : ['demo'])
      .gte('created_at', dateFilter);
    
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const totalSales = salesData?.length || 0;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const revenueByBranch = branches.map(branch => {
      const branchSales = salesData?.filter(s => s.branch_id === branch.id) || [];
      const revenue = branchSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      return {
        branch: branch.name,
        revenue,
        sales: branchSales.length
      };
    });
    
    const salesTrend = generateSalesTrend(salesData);
    
    setMetrics(prev => ({
      ...prev,
      totalRevenue,
      totalSales,
      avgTicket,
      revenueByBranch,
      salesTrend
    }));
  };

  const loadProductMetrics = async () => {
    const { data: productSales } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        price,
        products(name, category),
        sales!inner(branch_id, created_at)
      `)
      .in('sales.branch_id', selectedBranches.length > 0 ? selectedBranches : ['demo'])
      .gte('sales.created_at', getDateFilter());
    
    const productMap = {};
    productSales?.forEach(item => {
      if (item.products) {
        const key = item.products.name;
        if (!productMap[key]) {
          productMap[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productMap[key].quantity += item.quantity || 0;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 0);
      }
    });
    
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    setMetrics(prev => ({ ...prev, topProducts }));
  };

  const loadInventoryAlerts = async () => {
    const { data: alerts } = await supabase
      .from('branch_inventory')
      .select(`
        *,
        branches(name),
        products(name)
      `)
      .in('branch_id', selectedBranches.length > 0 ? selectedBranches : ['demo'])
      .lte('current_stock', 'min_stock')
      .eq('is_available', true);
    
    setMetrics(prev => ({ ...prev, inventoryAlerts: alerts || [] }));
  };

  const loadEmployeeMetrics = async () => {
    const { data: shifts } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        users(name),
        branches(name)
      `)
      .in('branch_id', selectedBranches.length > 0 ? selectedBranches : ['demo'])
      .gte('date', getDateFilter())
      .eq('status', 'completed');
    
    const employeeMap = {};
    shifts?.forEach(shift => {
      if (shift.users) {
        const key = shift.user_id;
        if (!employeeMap[key]) {
          employeeMap[key] = {
            name: shift.users.name,
            hoursWorked: 0,
            shifts: 0
          };
        }
        employeeMap[key].shifts += 1;
        if (shift.clock_in && shift.clock_out) {
          const hours = (new Date(shift.clock_out) - new Date(shift.clock_in)) / (1000 * 60 * 60);
          employeeMap[key].hoursWorked += hours;
        }
      }
    });
    
    setMetrics(prev => ({ 
      ...prev, 
      employeePerformance: Object.values(employeeMap) 
    }));
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    }
  };

  const generateSalesTrend = (salesData) => {
    const days = dateRange === 'today' ? 24 : 30;
    const trend = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySales = salesData?.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= dayStart && saleDate <= dayEnd;
      }) || [];
      
      trend.push({
        date: dayStart.toLocaleDateString(),
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
      });
    }
    
    return trend;
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, format = 'number' }) => {
    const formattedValue = format === 'currency' ? formatCurrency(value) : value.toLocaleString();
    const isPositive = change >= 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-950/30 p-8 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl dark:hover:shadow-gray-950/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 text-base font-medium">{title}</p>
            <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{formattedValue}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="ml-1">{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>
    );
  };

  const BranchPerformanceCard = ({ branch, index }) => {
    const maxRevenue = Math.max(...metrics.revenueByBranch.map(b => b.revenue));
    const percentage = maxRevenue > 0 ? (branch.revenue / maxRevenue) * 100 : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {branch.branch}
          </h4>
          <span className="text-base text-gray-600 dark:text-gray-300">{branch.sales} ventas</span>
        </div>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(branch.revenue)}
        </p>
        <div className="mt-3">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false,
        labels: {
          color: '#9CA3AF'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.2)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.2)'
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-950/30 border-b border-gray-200 dark:border-gray-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  Dashboard Corporativo
                </h1>
                <p className="mt-3 text-lg text-gray-700 dark:text-gray-300">
                  Visión general de todas las sucursales
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/branches'}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Settings className="h-4 w-4" />
                  Gestionar Sucursales
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-950/30 p-6 border border-gray-200 dark:border-gray-800 transition-all duration-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Branch selector */}
            <div className="flex items-center gap-2">
              <Filter className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              <select
                multiple
                value={selectedBranches}
                onChange={(e) => setSelectedBranches(Array.from(e.target.selectedOptions, option => option.value))}
                className="border-2 dark:border-gray-700 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[200px]"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex gap-2">
              {['today', 'week', 'month', 'year'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    dateRange === range 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range === 'today' ? 'Hoy' : 
                   range === 'week' ? 'Semana' : 
                   range === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="ml-auto flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={loadDashboardData}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Ingresos Totales"
                value={metrics.totalRevenue}
                change={12.5}
                icon={DollarSign}
                color="from-green-500 to-emerald-600"
                format="currency"
              />
              <MetricCard
                title="Ventas Totales"
                value={metrics.totalSales}
                change={8.3}
                icon={ShoppingCart}
                color="from-blue-500 to-cyan-600"
              />
              <MetricCard
                title="Ticket Promedio"
                value={metrics.avgTicket}
                change={-2.1}
                icon={TrendingUp}
                color="from-purple-500 to-pink-600"
                format="currency"
              />
              <MetricCard
                title="Alertas de Stock"
                value={metrics.inventoryAlerts.length}
                icon={AlertTriangle}
                color="from-red-500 to-orange-600"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-950/30 p-8 border border-gray-200 dark:border-gray-800 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Tendencia de Ventas
                </h3>
                <div style={{ height: '300px' }}>
                  <Line
                    data={{
                      labels: metrics.salesTrend.map(d => d.date),
                      datasets: [{
                        label: 'Ingresos',
                        data: metrics.salesTrend.map(d => d.revenue),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={chartOptions}
                  />
                </div>
              </motion.div>

              {/* Top Products */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-950/30 p-8 border border-gray-200 dark:border-gray-800 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Productos Más Vendidos
                </h3>
                <div className="space-y-3">
                  {metrics.topProducts.slice(0, 5).map((product, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-base text-gray-600 dark:text-gray-300">
                            {product.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(product.revenue)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Branch Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-950/30 p-8 border border-gray-200 dark:border-gray-800 transition-all duration-300"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                Rendimiento por Sucursal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.revenueByBranch.map((branch, index) => (
                  <BranchPerformanceCard key={index} branch={branch} index={index} />
                ))}
              </div>
            </motion.div>

            {/* Inventory Alerts */}
            {metrics.inventoryAlerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow-lg dark:shadow-gray-950/20 p-6 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas de Inventario Crítico
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.inventoryAlerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{alert.products?.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{alert.branches?.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {alert.current_stock} {alert.stock_unit}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          Mín: {alert.min_stock} {alert.stock_unit}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateDashboard;