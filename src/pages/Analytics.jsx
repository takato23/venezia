import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  Eye,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  Warehouse
} from 'lucide-react';
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useApiCache } from '../hooks/useApiCache';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Register ChartJS components
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

const AnalyticsPage = () => {
  // Estado principal
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [selectedStore, setSelectedStore] = useState('all');
  
  // Estado de filtros
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Generate date ranges
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return {
          from: today.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday.toISOString().split('T')[0],
          to: yesterday.toISOString().split('T')[0]
        };
      case 'last_7_days':
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        return {
          from: week.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'last_30_days':
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        return {
          from: month.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'last_90_days':
        const quarter = new Date(today);
        quarter.setDate(quarter.getDate() - 90);
        return {
          from: quarter.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        };
      case 'this_year':
        return {
          from: `${now.getFullYear()}-01-01`,
          to: today.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          from: fromDate,
          to: toDate
        };
      default:
        return {
          from: '',
          to: ''
        };
    }
  };

  const dateParams = getDateRange();

  // API calls using useApiCache
  const { data: salesData = {}, loading: salesLoading, refetch: refetchSales } = useApiCache(
    '/api/analytics/sales',
    {
      range: dateRange,
      store: selectedStore,
      ...dateParams
    },
    { enabled: true }
  );

  const { data: productData = {}, loading: productsLoading, refetch: refetchProducts } = useApiCache(
    '/api/analytics/products',
    {
      range: dateRange,
      store: selectedStore,
      ...dateParams
    },
    { enabled: true }
  );

  const { data: customerData = {}, loading: customersLoading, refetch: refetchCustomers } = useApiCache(
    '/api/analytics/customers',
    {
      range: dateRange,
      store: selectedStore,
      ...dateParams
    },
    { enabled: true }
  );

  const { data: storesData = [], loading: storesLoading } = useApiCache(
    '/api/stores',
    null,
    { enabled: true }
  );

  // Process stores data
  const stores = Array.isArray(storesData) ? storesData : 
                 (storesData && storesData.data) ? storesData.data :
                 (storesData && Array.isArray(storesData.stores)) ? storesData.stores : [];
  
  // Combined loading state
  const loading = salesLoading || productsLoading || customersLoading || storesLoading;

  // Ensure data is never null for safe access
  const safeData = {
    sales: salesData || {},
    products: productsData || {},
    customers: customerData || {},
    kpis: kpiData || {}
  };

  // Refresh all data
  const refreshData = () => {
    refetchSales();
    refetchProducts();
    refetchCustomers();
  };

  // Chart.js default options
  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
          font: {
            size: 11
          }
        },
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  // Prepare chart data
  const salesChartData = useMemo(() => {
    if (!safeData.sales.daily_sales || !Array.isArray(safeData.sales.daily_sales)) {
      return null;
    }

    return {
      labels: safeData.sales.daily_sales.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Ventas',
          data: safeData.sales.daily_sales.map(item => item.revenue || 0),
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [safeData.sales]);

  const paymentMethodsChartData = useMemo(() => {
    if (!safeData.sales.payment_methods || !Array.isArray(safeData.sales.payment_methods)) {
      return null;
    }

    const colors = [
      'rgba(251, 191, 36, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];

    return {
      labels: safeData.sales.payment_methods.map(item => item.method),
      datasets: [
        {
          data: safeData.sales.payment_methods.map(item => item.amount || 0),
          backgroundColor: colors.slice(0, safeData.sales.payment_methods.length),
          borderWidth: 0
        }
      ]
    };
  }, [safeData.sales]);

  const productCategoriesChartData = useMemo(() => {
    if (!safeData.products.by_category || !Array.isArray(safeData.products.by_category)) {
      return null;
    }

    return {
      labels: productData.by_category.map(item => item.category),
      datasets: [
        {
          label: 'Ventas por Categoría',
          data: productData.by_category.map(item => item.revenue || 0),
          backgroundColor: [
            'rgba(251, 191, 36, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderRadius: 8
        }
      ]
    };
  }, [productData]);

  const inventoryValueChartData = useMemo(() => {
    if (!productData.inventory_value || !Array.isArray(productData.inventory_value)) {
      return null;
    }

    return {
      labels: productData.inventory_value.map(item => item.product),
      datasets: [
        {
          label: 'Valor en Inventario',
          data: productData.inventory_value.map(item => item.value || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 4
        }
      ]
    };
  }, [productData]);

  // Export report function
  const handleExportReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(251, 191, 36);
      doc.text('Reporte de Analytics - Venezia', pageWidth / 2, 20, { align: 'center' });
      
      // Date info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Período: ${dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Personalizado'}`, 20, 35);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 20, 42);
      
      // KPIs section
      doc.setFontSize(16);
      doc.text('Indicadores Principales', 20, 55);
      
      doc.setFontSize(12);
      doc.text(`Ventas Totales: ${formatCurrency(salesData.total_sales || 0)}`, 20, 65);
      doc.text(`Órdenes: ${formatNumber(salesData.total_orders || 0)}`, 20, 72);
      doc.text(`Ticket Promedio: ${formatCurrency(salesData.avg_ticket || 0)}`, 20, 79);
      doc.text(`Clientes Únicos: ${formatNumber(customerData.unique_customers || 0)}`, 20, 86);
      
      // Top Products Table
      if (productData.top_products && productData.top_products.length > 0) {
        doc.setFontSize(16);
        doc.text('Productos Más Vendidos', 20, 100);
        
        const tableData = productData.top_products.slice(0, 10).map(product => [
          product.name,
          formatNumber(product.units_sold),
          formatCurrency(product.revenue),
          `${product.percentage?.toFixed(1)}%`
        ]);
        
        doc.autoTable({
          startY: 105,
          head: [['Producto', 'Unidades', 'Ingresos', '% Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [251, 191, 36] }
        });
      }
      
      // Save PDF
      doc.save(`reporte_venezia_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      alert('Error al exportar reporte');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen General', icon: BarChart3 },
    { id: 'sales', label: 'Ventas', icon: DollarSign },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'this_year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-venezia-900">Analytics</h1>
          <p className="text-venezia-600 mt-1">Reportes y métricas avanzadas</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-5 w-5 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Período"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          
          <Select
            label="Tienda"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="all">Todas las tiendas</option>
            {Array.isArray(stores) && stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </Select>
          
          {dateRange === 'custom' && (
            <>
              <Input
                label="Desde"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <Input
                label="Hasta"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-venezia-900">
                ${salesData?.total_sales?.toFixed(2) || '0.00'}
              </p>
              <p className={`text-sm ${salesData?.sales_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesData?.sales_growth >= 0 ? '+' : ''}{salesData?.sales_growth?.toFixed(1) || '0'}% vs período anterior
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Órdenes</p>
              <p className="text-2xl font-bold text-venezia-900">{salesData.total_orders || 0}</p>
              <p className={`text-sm ${salesData.orders_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesData.orders_growth >= 0 ? '+' : ''}{salesData.orders_growth?.toFixed(1) || '0'}% vs período anterior
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-venezia-900">
                ${salesData.avg_ticket?.toFixed(2) || '0.00'}
              </p>
              <p className={`text-sm ${salesData.ticket_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesData.ticket_growth >= 0 ? '+' : ''}{salesData.ticket_growth?.toFixed(1) || '0'}% vs período anterior
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-venezia-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Clientes Únicos</p>
              <p className="text-2xl font-bold text-venezia-900">{customerData.unique_customers || 0}</p>
              <p className={`text-sm ${customerData.customers_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customerData.customers_growth >= 0 ? '+' : ''}{customerData.customers_growth?.toFixed(1) || '0'}% vs período anterior
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-venezia-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-venezia-500 text-venezia-600'
                    : 'border-transparent text-venezia-500 hover:text-venezia-700 hover:border-venezia-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido por tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de ventas diarias */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Tendencia de Ventas</h3>
            <div className="h-64">
              {salesChartData ? (
                <Line data={salesChartData} options={defaultChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                    <p className="text-venezia-600">No hay datos de ventas</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Top productos */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Productos Más Vendidos</h3>
            <div className="space-y-3">
              {Array.isArray(productData.top_products) && productData.top_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-venezia-50 rounded-lg">
                  <div>
                    <p className="font-medium text-venezia-900">{product.name}</p>
                    <p className="text-sm text-venezia-600">{product.units_sold} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-venezia-900">${product.revenue?.toFixed(2)}</p>
                    <p className="text-sm text-venezia-600">{product.percentage?.toFixed(1)}% del total</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                  <p className="text-venezia-600">No hay datos de productos</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Ventas por tienda */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Rendimiento por Tienda</h3>
            {salesData.by_store && salesData.by_store.length > 1 ? (
              <div>
                <div className="h-64 mb-4">
                  <Bar
                    data={{
                      labels: salesData.by_store.map(store => store.name),
                      datasets: [
                        {
                          label: 'Ventas',
                          data: salesData.by_store.map(store => store.revenue || 0),
                          backgroundColor: 'rgba(251, 191, 36, 0.8)',
                          borderRadius: 4,
                          yAxisID: 'y'
                        },
                        {
                          label: 'Órdenes',
                          data: salesData.by_store.map(store => store.orders || 0),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderRadius: 4,
                          yAxisID: 'y1'
                        }
                      ]
                    }}
                    options={{
                      ...defaultChartOptions,
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          ticks: {
                            callback: function(value) {
                              return formatCurrency(value);
                            }
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          grid: {
                            drawOnChartArea: false
                          },
                          ticks: {
                            callback: function(value) {
                              return formatNumber(value);
                            }
                          }
                        },
                        x: {
                          ...defaultChartOptions.scales.x
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {salesData.by_store.map((store, index) => (
                    <div key={index} className="flex items-center justify-between p-2 text-sm">
                      <span className="text-venezia-700">{store.name}</span>
                      <span className="font-medium">Ticket: {formatCurrency(store.avg_ticket || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(salesData.by_store) && salesData.by_store.map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-venezia-50 rounded-lg">
                    <div>
                      <p className="font-medium text-venezia-900">{store.name}</p>
                      <p className="text-sm text-venezia-600">{formatNumber(store.orders)} órdenes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-venezia-900">{formatCurrency(store.revenue)}</p>
                      <p className="text-sm text-venezia-600">{formatCurrency(store.avg_ticket)} ticket promedio</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                    <p className="text-venezia-600">No hay datos por tienda</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Métodos de pago */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Métodos de Pago</h3>
            <div className="h-64">
              {paymentMethodsChartData ? (
                <Doughnut 
                  data={paymentMethodsChartData} 
                  options={{
                    ...defaultChartOptions,
                    scales: undefined,
                    plugins: {
                      ...defaultChartOptions.plugins,
                      tooltip: {
                        ...defaultChartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                    <p className="text-venezia-600">No hay datos de métodos de pago</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipe profitability analysis */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Análisis de Rentabilidad de Recetas</h3>
            {productData.recipe_profitability && productData.recipe_profitability.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <Bar
                    data={{
                      labels: productData.recipe_profitability.slice(0, 10).map(item => item.recipe_name),
                      datasets: [
                        {
                          label: 'Margen de Ganancia (%)',
                          data: productData.recipe_profitability.slice(0, 10).map(item => item.profit_margin || 0),
                          backgroundColor: productData.recipe_profitability.slice(0, 10).map(item =>
                            item.profit_margin >= 50 ? 'rgba(34, 197, 94, 0.8)' :
                            item.profit_margin >= 30 ? 'rgba(251, 191, 36, 0.8)' :
                            'rgba(239, 68, 68, 0.8)'
                          ),
                          borderRadius: 4
                        }
                      ]
                    }}
                    options={{
                      ...defaultChartOptions,
                      plugins: {
                        ...defaultChartOptions.plugins,
                        legend: {
                          display: false
                        },
                        tooltip: {
                          ...defaultChartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              return `Margen: ${context.parsed.y.toFixed(1)}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        ...defaultChartOptions.scales,
                        y: {
                          ...defaultChartOptions.scales.y,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-venezia-700">Top 5 Recetas Más Rentables</h4>
                  {productData.recipe_profitability.slice(0, 5).map((recipe, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-venezia-50 rounded-lg">
                      <div>
                        <p className="font-medium text-venezia-900">{recipe.recipe_name}</p>
                        <p className="text-sm text-venezia-600">
                          Costo: {formatCurrency(recipe.cost)} | Precio: {formatCurrency(recipe.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${recipe.profit_margin >= 50 ? 'text-green-600' : recipe.profit_margin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {recipe.profit_margin?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-venezia-600">{formatCurrency(recipe.profit)} ganancia</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center bg-venezia-50 rounded-lg">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                  <p className="text-venezia-600">No hay datos de rentabilidad de recetas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="card">
            <div className="px-6 py-4 border-b border-venezia-200">
              <h3 className="text-lg font-semibold text-venezia-900">Detalle de Ventas</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatNumber(salesData.total_orders || 0)}</p>
                  <p className="text-sm text-green-600">Total de Órdenes</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(salesData.total_sales || 0)}</p>
                  <p className="text-sm text-blue-600">Ingresos Totales</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(salesData.avg_ticket || 0)}</p>
                  <p className="text-sm text-purple-600">Ticket Promedio</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by hour */}
                <div>
                  <h4 className="text-md font-semibold text-venezia-900 mb-4">Ventas por Hora</h4>
                  <div className="h-64">
                    {salesData.hourly_sales && salesData.hourly_sales.length > 0 ? (
                      <Bar
                        data={{
                          labels: salesData.hourly_sales.map(item => `${item.hour}:00`),
                          datasets: [{
                            label: 'Ventas',
                            data: salesData.hourly_sales.map(item => item.revenue || 0),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderRadius: 4
                          }]
                        }}
                        options={{
                          ...defaultChartOptions,
                          plugins: {
                            ...defaultChartOptions.plugins,
                            legend: {
                              display: false
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                        <p className="text-venezia-600">No hay datos por hora</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sales trend comparison */}
                <div>
                  <h4 className="text-md font-semibold text-venezia-900 mb-4">Comparación con Período Anterior</h4>
                  <div className="h-64">
                    {salesData.comparison && salesData.comparison.current && salesData.comparison.previous ? (
                      <Line
                        data={{
                          labels: salesData.comparison.labels || [],
                          datasets: [
                            {
                              label: 'Período Actual',
                              data: salesData.comparison.current,
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Período Anterior',
                              data: salesData.comparison.previous,
                              borderColor: 'rgb(156, 163, 175)',
                              backgroundColor: 'rgba(156, 163, 175, 0.1)',
                              tension: 0.4,
                              borderDash: [5, 5]
                            }
                          ]
                        }}
                        options={defaultChartOptions}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                        <p className="text-venezia-600">No hay datos de comparación</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly performance */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-venezia-900 mb-4">Rendimiento Semanal</h4>
                <div className="h-64">
                  {salesData.weekly_performance && salesData.weekly_performance.length > 0 ? (
                    <Bar
                      data={{
                        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                        datasets: [{
                          label: 'Ventas Promedio',
                          data: salesData.weekly_performance.map(item => item.avg_revenue || 0),
                          backgroundColor: 'rgba(251, 191, 36, 0.8)',
                          borderRadius: 8
                        }]
                      }}
                      options={defaultChartOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                      <p className="text-venezia-600">No hay datos semanales</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Product analytics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <Package className="h-10 w-10 mx-auto text-venezia-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(productData.total_products || 0)}</p>
              <p className="text-sm text-venezia-600">Productos Activos</p>
            </div>
            <div className="card p-6 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto text-green-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(productData.total_units_sold || 0)}</p>
              <p className="text-sm text-venezia-600">Unidades Vendidas</p>
            </div>
            <div className="card p-6 text-center">
              <Warehouse className="h-10 w-10 mx-auto text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatCurrency(productData.inventory_total_value || 0)}</p>
              <p className="text-sm text-venezia-600">Valor en Inventario</p>
            </div>
            <div className="card p-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-red-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(productData.low_stock_count || 0)}</p>
              <p className="text-sm text-venezia-600">Productos Bajo Stock</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category performance */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-venezia-900 mb-4">Rendimiento por Categoría</h3>
              <div className="h-64">
                {productCategoriesChartData ? (
                  <Bar data={productCategoriesChartData} options={defaultChartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                    <p className="text-venezia-600">No hay datos por categoría</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory value distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-venezia-900 mb-4">Valor de Inventario Top 10</h3>
              <div className="h-64">
                {inventoryValueChartData ? (
                  <Bar 
                    data={inventoryValueChartData} 
                    options={{
                      ...defaultChartOptions,
                      indexAxis: 'y',
                      plugins: {
                        ...defaultChartOptions.plugins,
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                    <p className="text-venezia-600">No hay datos de inventario</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-venezia-200">
              <h3 className="text-lg font-semibold text-venezia-900">Top 20 Productos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-venezia-200">
                <thead className="bg-venezia-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Unidades Vendidas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">% del Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Precio Promedio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Margen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-venezia-200">
                  {Array.isArray(productData.top_products) && productData.top_products.slice(0, 20).map((product, index) => (
                    <tr key={index} className="hover:bg-venezia-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-venezia-900">{product.name}</div>
                        <div className="text-sm text-venezia-500">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatNumber(product.units_sold)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        <div className="flex items-center">
                          <span>{product.percentage?.toFixed(1)}%</span>
                          <div className="ml-2 w-16 bg-venezia-200 rounded-full h-2">
                            <div 
                              className="bg-venezia-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(product.percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatCurrency(product.avg_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.margin >= 50 ? 'bg-green-100 text-green-800' :
                          product.margin >= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.margin?.toFixed(1) || 0}%
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                        <p className="text-venezia-600">No hay datos de productos para mostrar</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <Users className="h-10 w-10 mx-auto text-venezia-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(customerData.unique_customers || 0)}</p>
              <p className="text-sm text-venezia-600">Clientes Únicos</p>
              <p className={`text-xs mt-1 ${customerData.customers_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customerData.customers_growth >= 0 ? '+' : ''}{customerData.customers_growth?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="card p-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto text-green-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(customerData.returning_customers || 0)}</p>
              <p className="text-sm text-venezia-600">Clientes Recurrentes</p>
              <p className="text-xs text-venezia-500 mt-1">
                {((customerData.returning_customers / customerData.unique_customers) * 100 || 0).toFixed(1)}% de retención
              </p>
            </div>
            <div className="card p-6 text-center">
              <DollarSign className="h-10 w-10 mx-auto text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatCurrency(customerData.avg_customer_value || 0)}</p>
              <p className="text-sm text-venezia-600">Valor Promedio</p>
              <p className={`text-xs mt-1 ${customerData.value_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customerData.value_growth >= 0 ? '+' : ''}{customerData.value_growth?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="card p-6 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto text-purple-600 mb-3" />
              <p className="text-2xl font-bold text-venezia-900">{formatNumber(customerData.avg_orders_per_customer?.toFixed(1) || 0)}</p>
              <p className="text-sm text-venezia-600">Órdenes por Cliente</p>
              <p className="text-xs text-venezia-500 mt-1">Frecuencia promedio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer segments */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-venezia-900 mb-4">Segmentación de Clientes</h3>
              <div className="h-64">
                {customerData.segments && customerData.segments.length > 0 ? (
                  <Pie
                    data={{
                      labels: customerData.segments.map(seg => seg.name),
                      datasets: [{
                        data: customerData.segments.map(seg => seg.count),
                        backgroundColor: [
                          'rgba(251, 191, 36, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(168, 85, 247, 0.8)',
                          'rgba(239, 68, 68, 0.8)'
                        ]
                      }]
                    }}
                    options={{
                      ...defaultChartOptions,
                      scales: undefined,
                      plugins: {
                        ...defaultChartOptions.plugins,
                        tooltip: {
                          ...defaultChartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed;
                              const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                              return `${label}: ${formatNumber(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                    <p className="text-venezia-600">No hay datos de segmentación</p>
                  </div>
                )}
              </div>
              {customerData.segments && (
                <div className="mt-4 space-y-2">
                  {customerData.segments.map((seg, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-venezia-700">{seg.name}</span>
                      <span className="font-medium">{formatCurrency(seg.revenue || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer lifetime value */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-venezia-900 mb-4">Valor de Vida del Cliente (CLV)</h3>
              <div className="h-64">
                {customerData.clv_distribution && customerData.clv_distribution.length > 0 ? (
                  <Bar
                    data={{
                      labels: customerData.clv_distribution.map(item => item.range),
                      datasets: [{
                        label: 'Número de Clientes',
                        data: customerData.clv_distribution.map(item => item.count),
                        backgroundColor: 'rgba(168, 85, 247, 0.8)',
                        borderRadius: 4
                      }]
                    }}
                    options={{
                      ...defaultChartOptions,
                      scales: {
                        ...defaultChartOptions.scales,
                        y: {
                          ...defaultChartOptions.scales.y,
                          ticks: {
                            callback: function(value) {
                              return formatNumber(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-venezia-50 rounded-lg">
                    <p className="text-venezia-600">No hay datos de CLV</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top customers table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-venezia-200">
              <h3 className="text-lg font-semibold text-venezia-900">Top 10 Clientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-venezia-200">
                <thead className="bg-venezia-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Órdenes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Total Gastado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Ticket Promedio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Última Compra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Segmento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-venezia-200">
                  {Array.isArray(customerData.top_customers) && customerData.top_customers.slice(0, 10).map((customer, index) => (
                    <tr key={index} className="hover:bg-venezia-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-venezia-900">{customer.name || 'Cliente Anónimo'}</div>
                        <div className="text-sm text-venezia-500">{customer.email || customer.phone || 'Sin contacto'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatNumber(customer.order_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatCurrency(customer.total_spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {formatCurrency(customer.avg_order_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-venezia-900">
                        {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('es-AR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.segment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                          customer.segment === 'Frecuente' ? 'bg-green-100 text-green-800' :
                          customer.segment === 'Regular' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.segment || 'Nuevo'}
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 mx-auto text-venezia-400 mb-2" />
                        <p className="text-venezia-600">No hay datos de clientes para mostrar</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage; 