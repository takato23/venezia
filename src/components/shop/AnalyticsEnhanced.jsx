import React, { useState, useMemo, useCallback } from 'react';
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
  Award,
  AlertTriangle,
  Download,
  FileText,
  Filter,
  Zap,
  TrendingDown as FunnelIcon,
  UserCheck,
  UserPlus,
  Crown,
  Tag,
  Percent,
  ArrowRight,
  Info,
  XCircle,
  RefreshCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AnalyticsEnhanced = ({ 
  orders = [], 
  products = [], 
  customers = [], 
  visits = [], 
  coupons = [] 
}) => {
  const [timeRange, setTimeRange] = useState('week');
  const [metricView, setMetricView] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  
  // Toggle expanded sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    );
    
    const filteredVisits = visits.filter(visit => 
      new Date(visit.timestamp) >= startDate
    );
    
    return { orders: filteredOrders, visits: filteredVisits };
  }, [orders, visits, timeRange]);

  // Calcular métricas extendidas
  const metrics = useMemo(() => {
    const { orders: filteredOrders, visits: filteredVisits } = filteredData;
    
    // Métricas generales
    const totalRevenue = filteredOrders
      .filter(o => o.status === 'delivered' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => 
      o.status === 'delivered' || o.status === 'completed'
    ).length;
    
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const conversionRate = filteredVisits.length > 0 
      ? (totalOrders / filteredVisits.length) * 100 
      : 0;

    // Funnel de conversión
    const funnel = {
      visits: filteredVisits.length,
      addedToCart: filteredOrders.filter(o => o.items?.length > 0).length,
      checkout: filteredOrders.filter(o => o.status !== 'abandoned').length,
      purchased: completedOrders
    };

    // Mapa de calor de horarios
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at);
      const day = date.getDay();
      const hour = date.getHours();
      heatmap[day][hour] += order.total || 0;
    });

    // Productos relacionados (frecuentemente comprados juntos)
    const productPairs = {};
    filteredOrders.forEach(order => {
      const items = order.items || [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i].productId, items[j].productId].sort().join('-');
          if (!productPairs[pair]) {
            productPairs[pair] = {
              products: [items[i].productName, items[j].productName],
              count: 0,
              revenue: 0
            };
          }
          productPairs[pair].count += 1;
          productPairs[pair].revenue += items[i].total + items[j].total;
        }
      }
    });

    const topProductPairs = Object.entries(productPairs)
      .map(([pair, data]) => ({ pair, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Predicción de demanda
    const demandPrediction = calculateDemandPrediction(filteredOrders, products);

    // Segmentación de clientes
    const customerSegments = segmentCustomers(filteredOrders, customers);

    // Análisis de abandono de carrito
    const cartAbandonment = analyzeCartAbandonment(filteredOrders);

    // ROI de cupones
    const couponROI = calculateCouponROI(filteredOrders, coupons);

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
    
    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      averageOrderValue,
      conversionRate,
      funnel,
      heatmap,
      topProductPairs,
      demandPrediction,
      customerSegments,
      cartAbandonment,
      couponROI,
      topProducts,
      salesByDay,
      salesByHour
    };
  }, [filteredData, products, customers, coupons]);

  // Funciones auxiliares
  function calculateDemandPrediction(orders, products) {
    const predictions = {};
    
    products.forEach(product => {
      const productOrders = orders.filter(o => 
        o.items?.some(item => item.productId === product.id)
      );
      
      if (productOrders.length > 0) {
        // Análisis de tendencia simple
        const weeklyData = {};
        productOrders.forEach(order => {
          const week = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (!weeklyData[week]) weeklyData[week] = 0;
          weeklyData[week] += order.items.find(i => i.productId === product.id)?.quantity || 0;
        });
        
        const weeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
        const avgWeekly = Object.values(weeklyData).reduce((a, b) => a + b, 0) / weeks.length;
        const trend = weeks.length > 1 
          ? (weeklyData[weeks[0]] - weeklyData[weeks[weeks.length - 1]]) / weeks.length 
          : 0;
        
        predictions[product.id] = {
          name: product.name,
          currentStock: product.stock || 0,
          avgWeeklyDemand: Math.round(avgWeekly),
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          weeksOfStock: product.stock > 0 ? Math.round(product.stock / avgWeekly) : 0,
          recommendedOrder: Math.max(0, Math.round(avgWeekly * 4 - (product.stock || 0)))
        };
      }
    });
    
    return predictions;
  }

  function segmentCustomers(orders, customers) {
    const segments = {
      new: [],
      recurring: [],
      vip: [],
      at_risk: [],
      lost: []
    };
    
    const customerStats = {};
    
    orders.forEach(order => {
      const customerId = order.customer?.id || order.customer?.email;
      if (!customerId) return;
      
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          id: customerId,
          name: order.customer.name,
          orders: 0,
          totalSpent: 0,
          firstOrder: order.created_at,
          lastOrder: order.created_at,
          avgOrderValue: 0
        };
      }
      
      customerStats[customerId].orders += 1;
      customerStats[customerId].totalSpent += order.total || 0;
      
      if (new Date(order.created_at) < new Date(customerStats[customerId].firstOrder)) {
        customerStats[customerId].firstOrder = order.created_at;
      }
      if (new Date(order.created_at) > new Date(customerStats[customerId].lastOrder)) {
        customerStats[customerId].lastOrder = order.created_at;
      }
    });
    
    // Calcular promedios y segmentar
    Object.values(customerStats).forEach(customer => {
      customer.avgOrderValue = customer.totalSpent / customer.orders;
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (customer.orders === 1 && daysSinceLastOrder < 30) {
        segments.new.push(customer);
      } else if (customer.totalSpent > 10000 || customer.orders > 20) {
        segments.vip.push(customer);
      } else if (daysSinceLastOrder > 90) {
        segments.lost.push(customer);
      } else if (daysSinceLastOrder > 60) {
        segments.at_risk.push(customer);
      } else {
        segments.recurring.push(customer);
      }
    });
    
    return segments;
  }

  function analyzeCartAbandonment(orders) {
    const abandonedOrders = orders.filter(o => o.status === 'abandoned');
    const reasons = {
      high_shipping: 0,
      complicated_checkout: 0,
      payment_issues: 0,
      price_concerns: 0,
      just_browsing: 0,
      unknown: 0
    };
    
    // Simular análisis de razones basado en patrones
    abandonedOrders.forEach(order => {
      if (order.shipping_cost > 50) {
        reasons.high_shipping++;
      } else if (order.items?.length > 5) {
        reasons.complicated_checkout++;
      } else if (order.total > 1000) {
        reasons.price_concerns++;
      } else {
        reasons.unknown++;
      }
    });
    
    const totalAbandoned = abandonedOrders.length;
    const abandonmentRate = orders.length > 0 ? (totalAbandoned / orders.length) * 100 : 0;
    const avgAbandonedValue = totalAbandoned > 0 
      ? abandonedOrders.reduce((sum, o) => sum + (o.total || 0), 0) / totalAbandoned 
      : 0;
    
    return {
      total: totalAbandoned,
      rate: abandonmentRate,
      avgValue: avgAbandonedValue,
      reasons: Object.entries(reasons).map(([reason, count]) => ({
        reason: reason.replace(/_/g, ' ').charAt(0).toUpperCase() + reason.replace(/_/g, ' ').slice(1),
        count,
        percentage: totalAbandoned > 0 ? (count / totalAbandoned) * 100 : 0
      })).sort((a, b) => b.count - a.count)
    };
  }

  function calculateCouponROI(orders, coupons) {
    const couponStats = {};
    
    coupons.forEach(coupon => {
      couponStats[coupon.code] = {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        uses: 0,
        revenue: 0,
        discountGiven: 0,
        newCustomers: 0
      };
    });
    
    orders.forEach(order => {
      if (order.coupon_code && couponStats[order.coupon_code]) {
        const stats = couponStats[order.coupon_code];
        stats.uses += 1;
        stats.revenue += order.total || 0;
        stats.discountGiven += order.discount_amount || 0;
        
        // Check if new customer (simplified)
        const customerOrders = orders.filter(o => 
          o.customer?.id === order.customer?.id && 
          new Date(o.created_at) < new Date(order.created_at)
        );
        if (customerOrders.length === 0) {
          stats.newCustomers += 1;
        }
      }
    });
    
    return Object.values(couponStats).map(stats => ({
      ...stats,
      roi: stats.discountGiven > 0 
        ? ((stats.revenue - stats.discountGiven) / stats.discountGiven) * 100 
        : 0,
      avgOrderValue: stats.uses > 0 ? stats.revenue / stats.uses : 0,
      newCustomerRate: stats.uses > 0 ? (stats.newCustomers / stats.uses) * 100 : 0
    })).sort((a, b) => b.roi - a.roi);
  }

  // Exportar datos
  const exportData = useCallback(() => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else if (exportFormat === 'pdf') {
      exportToPDF();
    }
  }, [exportFormat, metrics]);

  const exportToCSV = () => {
    const data = [];
    
    // Métricas generales
    data.push(['Métrica', 'Valor']);
    data.push(['Ingresos Totales', metrics.totalRevenue]);
    data.push(['Órdenes Totales', metrics.totalOrders]);
    data.push(['Órdenes Completadas', metrics.completedOrders]);
    data.push(['Ticket Promedio', metrics.averageOrderValue]);
    data.push(['Tasa de Conversión', `${metrics.conversionRate.toFixed(2)}%`]);
    data.push([]);
    
    // Funnel de conversión
    data.push(['Funnel de Conversión', '']);
    data.push(['Etapa', 'Cantidad', 'Porcentaje']);
    data.push(['Visitas', metrics.funnel.visits, '100%']);
    data.push(['Agregaron al Carrito', metrics.funnel.addedToCart, 
      `${((metrics.funnel.addedToCart / metrics.funnel.visits) * 100).toFixed(2)}%`]);
    data.push(['Iniciaron Checkout', metrics.funnel.checkout,
      `${((metrics.funnel.checkout / metrics.funnel.visits) * 100).toFixed(2)}%`]);
    data.push(['Compraron', metrics.funnel.purchased,
      `${((metrics.funnel.purchased / metrics.funnel.visits) * 100).toFixed(2)}%`]);
    data.push([]);
    
    // Productos más vendidos
    data.push(['Productos Más Vendidos', '']);
    data.push(['Producto', 'Cantidad', 'Ingresos', 'Órdenes']);
    metrics.topProducts.forEach(product => {
      data.push([product.name, product.quantity, product.revenue, product.orders]);
    });
    
    // Convertir a CSV
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Reporte de Analytics', 14, 22);
    doc.setFontSize(12);
    doc.text(`Período: ${timeRange}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Métricas generales
    doc.setFontSize(16);
    doc.text('Métricas Generales', 14, 50);
    doc.setFontSize(12);
    
    const generalMetrics = [
      ['Métrica', 'Valor'],
      ['Ingresos Totales', `$${metrics.totalRevenue.toLocaleString()}`],
      ['Órdenes Totales', metrics.totalOrders.toString()],
      ['Órdenes Completadas', metrics.completedOrders.toString()],
      ['Ticket Promedio', `$${Math.round(metrics.averageOrderValue).toLocaleString()}`],
      ['Tasa de Conversión', `${metrics.conversionRate.toFixed(2)}%`]
    ];
    
    doc.autoTable({
      head: [generalMetrics[0]],
      body: generalMetrics.slice(1),
      startY: 55,
      theme: 'grid'
    });
    
    // Funnel de conversión
    const funnelY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text('Funnel de Conversión', 14, funnelY);
    
    const funnelData = [
      ['Etapa', 'Cantidad', 'Porcentaje'],
      ['Visitas', metrics.funnel.visits.toString(), '100%'],
      ['Agregaron al Carrito', metrics.funnel.addedToCart.toString(), 
        `${((metrics.funnel.addedToCart / metrics.funnel.visits) * 100).toFixed(2)}%`],
      ['Iniciaron Checkout', metrics.funnel.checkout.toString(),
        `${((metrics.funnel.checkout / metrics.funnel.visits) * 100).toFixed(2)}%`],
      ['Compraron', metrics.funnel.purchased.toString(),
        `${((metrics.funnel.purchased / metrics.funnel.visits) * 100).toFixed(2)}%`]
    ];
    
    doc.autoTable({
      head: [funnelData[0]],
      body: funnelData.slice(1),
      startY: funnelY + 5,
      theme: 'grid'
    });
    
    // Productos más vendidos
    if (doc.lastAutoTable.finalY < 200) {
      const productsY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text('Top 5 Productos', 14, productsY);
      
      const productData = [
        ['Producto', 'Cantidad', 'Ingresos'],
        ...metrics.topProducts.slice(0, 5).map(p => [
          p.name,
          p.quantity.toString(),
          `$${p.revenue.toLocaleString()}`
        ])
      ];
      
      doc.autoTable({
        head: [productData[0]],
        body: productData.slice(1),
        startY: productsY + 5,
        theme: 'grid'
      });
    }
    
    // Guardar PDF
    doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Renderizar vistas
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Totales"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change={25}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Órdenes Totales"
          value={metrics.totalOrders}
          change={11}
          icon={ShoppingCart}
          color="blue"
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${Math.round(metrics.averageOrderValue).toLocaleString()}`}
          change={5}
          icon={CreditCard}
          color="purple"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          change={-2}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Funnel de Conversión */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            Funnel de Conversión
          </h3>
          <button
            onClick={() => toggleSection('funnel')}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {expandedSections.funnel ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
        
        {!expandedSections.funnel && (
          <div className="space-y-4">
            {Object.entries(metrics.funnel).map(([stage, value], index, arr) => {
              const percentage = index === 0 ? 100 : (value / metrics.funnel.visits) * 100;
              const prevValue = index > 0 ? Object.values(metrics.funnel)[index - 1] : value;
              const dropoff = index > 0 ? ((prevValue - value) / prevValue) * 100 : 0;
              
              const stageNames = {
                visits: 'Visitas',
                addedToCart: 'Agregaron al Carrito',
                checkout: 'Iniciaron Checkout',
                purchased: 'Compraron'
              };
              
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {stageNames[stage]}
                      </span>
                      <Badge variant="info" size="sm">
                        {value.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          -{dropoff.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                      <div 
                        className="bg-gradient-to-r from-venezia-600 to-venezia-400 h-8 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%` }}
                      >
                        {index < arr.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mapa de Calor de Horarios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Mapa de Calor - Horarios de Compra
        </h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-25 gap-1">
              <div></div>
              {Array(24).fill(null).map((_, hour) => (
                <div key={hour} className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {hour}
                </div>
              ))}
              
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, dayIndex) => (
                <React.Fragment key={day}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    {day}
                  </div>
                  {metrics.heatmap[dayIndex].map((value, hour) => {
                    const maxValue = Math.max(...metrics.heatmap.flat());
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="relative group"
                      >
                        <div
                          className="w-full h-8 rounded cursor-pointer transition-all hover:scale-110"
                          style={{
                            backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                            opacity: intensity > 0 ? 1 : 0.1
                          }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          ${value.toLocaleString()}
                          <br />
                          {day} {hour}:00
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Sin ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-venezia-200 rounded"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Pocas ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-venezia-500 rounded"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Muchas ventas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductAnalysis = () => (
    <div className="space-y-6">
      {/* Productos Relacionados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Productos Frecuentemente Comprados Juntos
        </h3>
        
        <div className="space-y-4">
          {metrics.topProductPairs.map(({ pair, products, count, revenue }) => (
            <div key={pair} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-venezia-100 dark:bg-venezia-900/20 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
                  </div>
                  <div className="w-10 h-10 bg-venezia-100 dark:bg-venezia-900/20 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {products[0]} + {products[1]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Comprados juntos {count} veces
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  en ingresos combinados
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predicción de Demanda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Predicción de Demanda
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Demanda Semanal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Semanas de Stock
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Recomendación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.values(metrics.demandPrediction).slice(0, 10).map((prediction) => (
                <tr key={prediction.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {prediction.name}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <Badge 
                      variant={prediction.currentStock < 10 ? 'danger' : prediction.currentStock < 50 ? 'warning' : 'success'}
                      size="sm"
                    >
                      {prediction.currentStock}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {prediction.avgWeeklyDemand}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <span className={clsx(
                      "font-medium",
                      prediction.weeksOfStock < 2 ? "text-red-600 dark:text-red-400" :
                      prediction.weeksOfStock < 4 ? "text-yellow-600 dark:text-yellow-400" :
                      "text-green-600 dark:text-green-400"
                    )}>
                      {prediction.weeksOfStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {prediction.trend === 'increasing' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                    ) : prediction.trend === 'decreasing' ? (
                      <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {prediction.recommendedOrder > 0 && (
                      <Badge variant="info" size="sm">
                        Pedir {prediction.recommendedOrder} unidades
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCustomerAnalysis = () => (
    <div className="space-y-6">
      {/* Segmentación de Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Segmentación de Clientes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Object.entries(metrics.customerSegments).map(([segment, customers]) => {
            const icons = {
              new: UserPlus,
              recurring: RefreshCcw,
              vip: Crown,
              at_risk: AlertTriangle,
              lost: XCircle
            };
            const colors = {
              new: 'blue',
              recurring: 'green',
              vip: 'purple',
              at_risk: 'yellow',
              lost: 'red'
            };
            const Icon = icons[segment];
            
            return (
              <button
                key={segment}
                onClick={() => setSelectedSegment(segment)}
                className={clsx(
                  "p-4 rounded-lg border transition-all",
                  selectedSegment === segment
                    ? "bg-venezia-50 dark:bg-venezia-900/20 border-venezia-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3 mx-auto",
                  `bg-${colors[segment]}-100 dark:bg-${colors[segment]}-900/20`
                )}>
                  <Icon className={clsx("w-5 h-5", `text-${colors[segment]}-600 dark:text-${colors[segment]}-400`)} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customers.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {segment === 'at_risk' ? 'En Riesgo' : segment === 'new' ? 'Nuevos' : segment === 'recurring' ? 'Recurrentes' : segment === 'lost' ? 'Perdidos' : segment.toUpperCase()}
                </p>
              </button>
            );
          })}
        </div>
        
        {/* Lista de clientes del segmento seleccionado */}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ticket Promedio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Última Compra
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.customerSegments[selectedSegment]?.slice(0, 10).map((customer) => (
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
                  <td className="px-6 py-4 text-right text-sm">
                    ${Math.round(customer.avgOrderValue).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {new Date(customer.lastOrder).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis de Abandono de Carrito */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Análisis de Abandono de Carrito
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Tasa de Abandono
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {metrics.cartAbandonment.rate.toFixed(1)}%
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Carritos Abandonados
                </p>
                <p className="text-2xl font-bold">
                  {metrics.cartAbandonment.total}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Valor promedio: ${Math.round(metrics.cartAbandonment.avgValue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Razones de Abandono
            </h4>
            <div className="space-y-3">
              {metrics.cartAbandonment.reasons.map(({ reason, count, percentage }) => (
                <div key={reason}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{reason}</span>
                    <span className="text-sm font-medium">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromotionAnalysis = () => (
    <div className="space-y-6">
      {/* ROI de Cupones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            ROI de Cupones y Promociones
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descuento Dado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  ROI
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nuevos Clientes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.couponROI.map((coupon) => (
                <tr key={coupon.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="info" size="sm">
                      {coupon.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {coupon.uses}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${coupon.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">
                    -${coupon.discountGiven.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={clsx(
                      "inline-flex items-center gap-1 text-sm font-medium",
                      coupon.roi > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {coupon.roi > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {coupon.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{coupon.newCustomers}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({coupon.newCustomerRate.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">ROI Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.couponROI.length > 0 
                  ? (metrics.couponROI.reduce((sum, c) => sum + c.roi, 0) / metrics.couponROI.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total en Descuentos</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${metrics.couponROI.reduce((sum, c) => sum + c.discountGiven, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Generados</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${metrics.couponROI.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con filtros y exportación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-48"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
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
            <button
              onClick={() => setMetricView('promotions')}
              className={clsx(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                metricView === 'promotions' 
                  ? "bg-venezia-600 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              Promociones
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-32"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </Select>
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-venezia-600 hover:bg-venezia-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      {metricView === 'overview' && renderOverview()}
      {metricView === 'products' && renderProductAnalysis()}
      {metricView === 'customers' && renderCustomerAnalysis()}
      {metricView === 'promotions' && renderPromotionAnalysis()}
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

export default AnalyticsEnhanced;