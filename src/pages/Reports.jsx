import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Truck,
  Factory,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  Printer,
  FileDown,
  Activity
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import ReportCard from '../components/reports/ReportCard';
import ReportChart from '../components/reports/ReportChart';
import ReportTable from '../components/reports/ReportTable';
import ExportModal from '../components/reports/ExportModal';
import clsx from 'clsx';

const ReportsPage = () => {
  // State
  const [activeCategory, setActiveCategory] = useState('sales');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Toast
  const { success, error } = useToast();

  // API Data
  const { 
    data: salesData, 
    loading: loadingSales, 
    error: salesError,
    refetch: refetchSales 
  } = useApiCache(`/api/reports/sales?range=${dateRange}&store=${selectedStore}&from=${customDateFrom}&to=${customDateTo}`);

  const { 
    data: inventoryData, 
    loading: loadingInventory,
    refetch: refetchInventory 
  } = useApiCache(`/api/reports/inventory?range=${dateRange}&store=${selectedStore}`);

  const { 
    data: productionData, 
    loading: loadingProduction,
    refetch: refetchProduction 
  } = useApiCache(`/api/reports/production?range=${dateRange}`);

  const { 
    data: financialData, 
    loading: loadingFinancial,
    refetch: refetchFinancial 
  } = useApiCache(`/api/reports/financial?range=${dateRange}&store=${selectedStore}`);

  const { 
    data: deliveryData, 
    loading: loadingDelivery,
    refetch: refetchDelivery 
  } = useApiCache(`/api/reports/delivery?range=${dateRange}`);

  const { 
    data: stores, 
    loading: loadingStores 
  } = useApiCache('/api/stores');

  // Safe data
  const safeSalesData = salesData || {};
  const safeInventoryData = inventoryData || {};
  const safeProductionData = productionData || {};
  const safeFinancialData = financialData || {};
  const safeDeliveryData = deliveryData || {};
  const safeStores = stores || [];

  const loading = loadingSales || loadingInventory || loadingProduction || loadingFinancial || loadingDelivery || loadingStores;

  // Report categories
  const categories = [
    {
      id: 'sales',
      name: 'Ventas',
      icon: DollarSign,
      description: 'Análisis de ventas y rendimiento comercial',
      color: 'text-green-600'
    },
    {
      id: 'inventory',
      name: 'Inventario',
      icon: Package,
      description: 'Estado de stock y movimientos de inventario',
      color: 'text-blue-600'
    },
    {
      id: 'production',
      name: 'Producción',
      icon: Factory,
      description: 'Eficiencia y métricas de producción',
      color: 'text-purple-600'
    },
    {
      id: 'financial',
      name: 'Financiero',
      icon: TrendingUp,
      description: 'Análisis financiero y rentabilidad',
      color: 'text-indigo-600'
    },
    {
      id: 'delivery',
      name: 'Entregas',
      icon: Truck,
      description: 'Rendimiento de entregas y logística',
      color: 'text-orange-600'
    }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'this_year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    return {
      totalRevenue: safeSalesData.total_revenue || 0,
      totalOrders: safeSalesData.total_orders || 0,
      averageOrderValue: safeSalesData.avg_order_value || 0,
      totalCustomers: safeSalesData.unique_customers || 0,
      inventoryValue: safeInventoryData.total_value || 0,
      lowStockItems: safeInventoryData.low_stock_count || 0,
      productionEfficiency: safeProductionData.efficiency_percentage || 0,
      completedBatches: safeProductionData.completed_batches || 0,
      netProfit: safeFinancialData.net_profit || 0,
      profitMargin: safeFinancialData.profit_margin || 0,
      deliveredOrders: safeDeliveryData.delivered_orders || 0,
      deliveryEfficiency: safeDeliveryData.efficiency_percentage || 0
    };
  }, [safeSalesData, safeInventoryData, safeProductionData, safeFinancialData, safeDeliveryData]);

  // Handle refresh
  const handleRefresh = () => {
    refetchSales();
    refetchInventory();
    refetchProduction();
    refetchFinancial();
    refetchDelivery();
    success('Actualizado', 'Datos actualizados correctamente');
  };

  // Handle export
  const handleExport = (reportType) => {
    setSelectedReport(reportType);
    setShowExportModal(true);
  };

  const handleExportConfirm = async (format, includeCharts) => {
    try {
      const params = new URLSearchParams({
        category: activeCategory,
        range: dateRange,
        store: selectedStore,
        format,
        charts: includeCharts,
        ...(customDateFrom && { from: customDateFrom }),
        ...(customDateTo && { to: customDateTo })
      });

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `reporte_${activeCategory}_${date}.${format}`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        success('Exportado', `Reporte exportado como ${filename}`);
      } else {
        error('Error', 'No se pudo exportar el reporte');
      }
    } catch (err) {
      error('Error', 'Error al exportar el reporte');
    }
    
    setShowExportModal(false);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Centro de Reportes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análisis completo y reportes de negocio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Actualizar
          </Button>
          
          <Button
            onClick={() => handleExport(activeCategory)}
            variant="primary"
            icon={Download}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Período"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={dateRangeOptions}
            icon={Calendar}
          />
          
          <Select
            label="Tienda"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las tiendas' },
              ...safeStores.map(store => ({
                value: store.id.toString(),
                label: store.name
              }))
            ]}
            icon={Users}
          />
          
          {dateRange === 'custom' && (
            <>
              <Input
                label="Desde"
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
              />
              <Input
                label="Hasta"
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
              <p className="text-xl font-bold text-green-600">
                ${summaryMetrics.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes</p>
              <p className="text-xl font-bold text-blue-600">
                {summaryMetrics.totalOrders}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
              <p className="text-xl font-bold text-orange-600">
                {summaryMetrics.lowStockItems}
              </p>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Producción</p>
              <p className="text-xl font-bold text-purple-600">
                {summaryMetrics.productionEfficiency.toFixed(1)}%
              </p>
            </div>
            <Factory className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Margen</p>
              <p className="text-xl font-bold text-indigo-600">
                {summaryMetrics.profitMargin.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Entregas</p>
              <p className="text-xl font-bold text-orange-600">
                {summaryMetrics.deliveryEfficiency.toFixed(1)}%
              </p>
            </div>
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="border-b dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={clsx(
                    'flex items-center gap-3 px-6 py-4 border-b-2 transition-colors whitespace-nowrap min-w-fit',
                    activeCategory === category.id
                      ? 'border-venezia-600 text-venezia-600 dark:text-venezia-400 bg-venezia-50 dark:bg-venezia-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', category.color)} />
                  <div className="text-left">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {category.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <LoadingState
            loading={loading}
            error={salesError}
            empty={false}
            onRetry={handleRefresh}
            emptyText="No hay datos disponibles"
            emptyIcon={FileText}
          />

          {!loading && (
            <>
              {/* Sales Reports */}
              {activeCategory === 'sales' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReportCard
                      title="Ventas por Período"
                      description="Evolución de ventas en el tiempo"
                      data={safeSalesData.sales_by_period}
                      type="line"
                      onExport={() => handleExport('sales_period')}
                    />
                    
                    <ReportCard
                      title="Productos Más Vendidos"
                      description="Top productos por volumen de ventas"
                      data={safeSalesData.top_products}
                      type="bar"
                      onExport={() => handleExport('top_products')}
                    />
                  </div>

                  <ReportTable
                    title="Detalle de Ventas"
                    data={safeSalesData.sales_detail || []}
                    columns={[
                      { key: 'date', label: 'Fecha' },
                      { key: 'order_id', label: 'Orden' },
                      { key: 'customer', label: 'Cliente' },
                      { key: 'products', label: 'Productos' },
                      { key: 'total', label: 'Total', format: 'currency' },
                      { key: 'status', label: 'Estado' }
                    ]}
                    onExport={() => handleExport('sales_detail')}
                  />
                </div>
              )}

              {/* Inventory Reports */}
              {activeCategory === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReportCard
                      title="Valor de Inventario"
                      description="Distribución del valor por categoría"
                      data={safeInventoryData.value_by_category}
                      type="pie"
                      onExport={() => handleExport('inventory_value')}
                    />
                    
                    <ReportCard
                      title="Movimientos de Stock"
                      description="Entradas y salidas de inventario"
                      data={safeInventoryData.stock_movements}
                      type="bar"
                      onExport={() => handleExport('stock_movements')}
                    />
                  </div>

                  <ReportTable
                    title="Productos con Stock Bajo"
                    data={safeInventoryData.low_stock_items || []}
                    columns={[
                      { key: 'name', label: 'Producto' },
                      { key: 'current_stock', label: 'Stock Actual' },
                      { key: 'min_stock', label: 'Stock Mínimo' },
                      { key: 'value', label: 'Valor', format: 'currency' },
                      { key: 'last_movement', label: 'Último Movimiento' }
                    ]}
                    onExport={() => handleExport('low_stock')}
                  />
                </div>
              )}

              {/* Production Reports */}
              {activeCategory === 'production' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReportCard
                      title="Eficiencia de Producción"
                      description="Métricas de rendimiento por período"
                      data={safeProductionData.efficiency_by_period}
                      type="line"
                      onExport={() => handleExport('production_efficiency')}
                    />
                    
                    <ReportCard
                      title="Producción por Sabor"
                      description="Volumen de producción por tipo de helado"
                      data={safeProductionData.production_by_flavor}
                      type="bar"
                      onExport={() => handleExport('production_flavor')}
                    />
                  </div>

                  <ReportTable
                    title="Lotes de Producción"
                    data={safeProductionData.production_batches || []}
                    columns={[
                      { key: 'batch_id', label: 'Lote' },
                      { key: 'product', label: 'Producto' },
                      { key: 'quantity', label: 'Cantidad' },
                      { key: 'start_date', label: 'Inicio' },
                      { key: 'completion_date', label: 'Finalización' },
                      { key: 'efficiency', label: 'Eficiencia', format: 'percentage' }
                    ]}
                    onExport={() => handleExport('production_batches')}
                  />
                </div>
              )}

              {/* Financial Reports */}
              {activeCategory === 'financial' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReportCard
                      title="Ingresos vs Gastos"
                      description="Análisis de rentabilidad"
                      data={safeFinancialData.revenue_vs_costs}
                      type="line"
                      onExport={() => handleExport('revenue_costs')}
                    />
                    
                    <ReportCard
                      title="Márgenes por Producto"
                      description="Rentabilidad por línea de producto"
                      data={safeFinancialData.margins_by_product}
                      type="bar"
                      onExport={() => handleExport('product_margins')}
                    />
                  </div>

                  <ReportTable
                    title="Resumen Financiero"
                    data={safeFinancialData.financial_summary || []}
                    columns={[
                      { key: 'period', label: 'Período' },
                      { key: 'revenue', label: 'Ingresos', format: 'currency' },
                      { key: 'costs', label: 'Costos', format: 'currency' },
                      { key: 'gross_profit', label: 'Utilidad Bruta', format: 'currency' },
                      { key: 'net_profit', label: 'Utilidad Neta', format: 'currency' },
                      { key: 'margin', label: 'Margen', format: 'percentage' }
                    ]}
                    onExport={() => handleExport('financial_summary')}
                  />
                </div>
              )}

              {/* Delivery Reports */}
              {activeCategory === 'delivery' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReportCard
                      title="Rendimiento de Entregas"
                      description="Métricas de eficiencia en entregas"
                      data={safeDeliveryData.delivery_performance}
                      type="line"
                      onExport={() => handleExport('delivery_performance')}
                    />
                    
                    <ReportCard
                      title="Entregas por Zona"
                      description="Distribución geográfica de entregas"
                      data={safeDeliveryData.deliveries_by_zone}
                      type="pie"
                      onExport={() => handleExport('delivery_zones')}
                    />
                  </div>

                  <ReportTable
                    title="Detalle de Entregas"
                    data={safeDeliveryData.delivery_detail || []}
                    columns={[
                      { key: 'date', label: 'Fecha' },
                      { key: 'order_id', label: 'Orden' },
                      { key: 'customer', label: 'Cliente' },
                      { key: 'address', label: 'Dirección' },
                      { key: 'driver', label: 'Repartidor' },
                      { key: 'status', label: 'Estado' },
                      { key: 'delivery_time', label: 'Tiempo Entrega' }
                    ]}
                    onExport={() => handleExport('delivery_detail')}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportConfirm}
        reportName={selectedReport}
      />
    </div>
  );
};

export default ReportsPage;