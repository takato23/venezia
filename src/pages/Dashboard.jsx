import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle,
  Users,
  Factory,
  Clock,
  Brain
} from 'lucide-react';
import ModernMetricCard from '../components/dashboard/ModernMetricCard';
import ModernChartContainer from '../components/dashboard/ModernChartContainer';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { useSocket } from '../services/socketMock';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import axios from 'axios';
import { format, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// Componente de métrica individual optimizado con memo
const MetricCard = memo(({ icon: Icon, title, value, change, changeType, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card hover-lift"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-xl bg-venezia-100">
        <Icon className="h-6 w-6 text-venezia-700" />
      </div>
      {change && (
        <span className={`metric-change ${changeType}`}>
          {changeType === 'positive' ? '+' : ''}{change}%
        </span>
      )}
    </div>
    
    <div>
      {isLoading ? (
        <div className="loading-skeleton h-8 w-24 rounded mb-2" />
      ) : (
        <div className="metric-value">{value}</div>
      )}
      <div className="metric-label">{title}</div>
    </div>
  </motion.div>
));

MetricCard.displayName = 'MetricCard';

// Componente de gráfico con loading state optimizado con memo
const ChartContainer = memo(({ title, children, isLoading, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`card ${className}`}
  >
    <div className="p-6 border-b border-venezia-200">
      <h3 className="text-lg font-semibold text-venezia-900">{title}</h3>
    </div>
    <div className="p-6">
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Cargando datos..." />
        </div>
      ) : (
        children
      )}
    </div>
  </motion.div>
));

ChartContainer.displayName = 'ChartContainer';

const Dashboard = () => {
  const { socket, connected, emitEvent } = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();

  // Cargar datos del dashboard optimizado con useCallback
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/dashboard/overview');
      setDashboardData(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto inicial para cargar datos
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // WebSocket listeners para actualizaciones en tiempo real optimizados
  useEffect(() => {
    if (socket) {
      const handleRealTimeUpdate = (data) => {
        console.log('📊 Actualización de dashboard en tiempo real:', data);
        setDashboardData(prev => ({
          ...prev,
          ...data,
        }));
        setLastUpdate(new Date());
      };

      socket.on('dashboard_update', handleRealTimeUpdate);
      socket.on('sales_update', handleRealTimeUpdate);
      socket.on('inventory_update', handleRealTimeUpdate);

      return () => {
        socket.off('dashboard_update', handleRealTimeUpdate);
        socket.off('sales_update', handleRealTimeUpdate);
        socket.off('inventory_update', handleRealTimeUpdate);
      };
    }
  }, [socket]);

  // Auto-refresh cada 30 segundos optimizado
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        loadDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading, loadDashboardData]);

  // Configuraciones de gráficos memoizadas
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
    },
  }), []);

  // Datos para gráfico de ventas (últimos 7 días)
  const salesChartData = {
    labels: dashboardData?.sales_chart?.labels || [],
    datasets: [
      {
        label: 'Ventas ($)',
        data: dashboardData?.sales_chart?.data || [],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Datos para gráfico de productos más vendidos
  const topProductsData = {
    labels: dashboardData?.top_products?.map(p => p.name) || [],
    datasets: [
      {
        data: dashboardData?.top_products?.map(p => p.quantity) || [],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#8b5cf6',
          '#06b6d4',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Datos para gráfico de stock por categoría
  const stockChartData = {
    labels: dashboardData?.stock_by_category?.map(c => c.category) || [],
    datasets: [
      {
        label: 'Stock (kg)',
        data: dashboardData?.stock_by_category?.map(c => c.total_stock) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información de conexión */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-venezia-900">Dashboard</h1>
          <p className="text-venezia-600 mt-1">
            Panel de control en tiempo real · Venezia Ice Cream
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-venezia-500">
            Actualizado: {format(lastUpdate, 'HH:mm:ss', { locale: es })}
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
            connected ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              connected ? 'bg-success-500' : 'bg-error-500'
            }`} />
            <span className="text-xs font-medium">
              {connected ? 'En vivo' : 'Sin conexión'}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas principales con diseño moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernMetricCard
          icon={DollarSign}
          title="Ventas Hoy"
          value={`$${dashboardData?.metrics?.today_sales?.toLocaleString() || '0'}`}
          change={dashboardData?.metrics?.sales_growth}
          changeType={dashboardData?.metrics?.sales_growth > 0 ? 'positive' : 'negative'}
          isLoading={isLoading}
          gradient="green"
          delay={0}
        />
        
        <ModernMetricCard
          icon={ShoppingCart}
          title="Órdenes Hoy"
          value={dashboardData?.metrics?.today_orders || '0'}
          change={dashboardData?.metrics?.orders_growth}
          changeType={dashboardData?.metrics?.orders_growth > 0 ? 'positive' : 'negative'}
          isLoading={isLoading}
          gradient="blue"
          delay={0.1}
        />
        
        <ModernMetricCard
          icon={AlertTriangle}
          title="Stock Bajo"
          value={dashboardData?.metrics?.low_stock_items || '0'}
          change={dashboardData?.metrics?.stock_change}
          changeType={dashboardData?.metrics?.stock_change < 0 ? 'positive' : 'negative'}
          isLoading={isLoading}
          gradient="orange"
          delay={0.2}
        />
        
        <ModernMetricCard
          icon={Users}
          title="Clientes Activos"
          value={dashboardData?.metrics?.active_customers || '0'}
          change={dashboardData?.metrics?.customers_growth}
          changeType={dashboardData?.metrics?.customers_growth > 0 ? 'positive' : 'neutral'}
          isLoading={isLoading}
          gradient="purple"
          delay={0.3}
        />
      </div>

      {/* Gráficos principales con diseño moderno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ventas */}
        <ModernChartContainer
          title="Ventas - Últimos 7 días"
          isLoading={isLoading}
          className="lg:col-span-1"
          gradient="green"
          icon={TrendingUp}
          delay={0.4}
        >
          <div className="h-64">
            <Line data={salesChartData} options={chartOptions} />
          </div>
        </ModernChartContainer>

        {/* Productos más vendidos */}
        <ModernChartContainer
          title="Productos Más Vendidos"
          isLoading={isLoading}
          className="lg:col-span-1"
          gradient="purple"
          icon={Package}
          delay={0.5}
        >
          <div className="h-64">
            <Doughnut 
              data={topProductsData} 
              options={{
                ...chartOptions,
                scales: undefined,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'right',
                  },
                },
              }} 
            />
          </div>
        </ModernChartContainer>
      </div>

      {/* Widget AI Assistant */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
              >
                <Brain size={32} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold mb-1">Asistente AI Venezia</h3>
                <p className="text-white/80 text-sm">Tu consultor de inteligencia artificial para el negocio</p>
              </div>
            </div>
            <motion.button
              onClick={() => window.open('/ai-assistant-test', '_blank', 'width=1200,height=800')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Brain size={20} />
              <span>Abrir AI Assistant</span>
            </motion.button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm font-medium">Chat IA</div>
              <div className="text-xs text-white/70">Consultas en tiempo real</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-sm font-medium">Predicciones</div>
              <div className="text-xs text-white/70">Ventas futuras</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm font-medium">Análisis</div>
              <div className="text-xs text-white/70">Rendimiento</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-sm font-medium">Inventario</div>
              <div className="text-xs text-white/70">Optimización</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fila inferior con más información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock por categoría */}
        <ModernChartContainer
          title="Stock por Categoría"
          isLoading={isLoading}
          className="lg:col-span-2"
          gradient="cyan"
          icon={Package}
          delay={0.6}
        >
          <div className="h-64">
            <Bar data={stockChartData} options={chartOptions} />
          </div>
        </ModernChartContainer>

        {/* Actividad reciente */}
        <ModernChartContainer
          title="Actividad Reciente"
          isLoading={isLoading}
          className="lg:col-span-1"
          gradient="orange"
          icon={Clock}
          delay={0.7}
        >
          <div className="space-y-4">
            {dashboardData?.recent_activity?.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-venezia-50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'sale' ? 'bg-success-100 text-success-700' :
                  activity.type === 'production' ? 'bg-primary-100 text-primary-700' :
                  'bg-warning-100 text-warning-700'
                }`}>
                  {activity.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> :
                   activity.type === 'production' ? <Factory className="h-4 w-4" /> :
                   <Package className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-venezia-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-venezia-500">
                    {format(new Date(activity.timestamp), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </motion.div>
            )) || (
              <div className="text-center py-8 text-venezia-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </ModernChartContainer>
      </div>

      {/* Botón AI movido a componente global - ver FloatingAIButton en App.jsx */}
    </div>
  );
};

export default Dashboard; 