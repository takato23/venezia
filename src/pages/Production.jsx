import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Factory, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  BarChart3,
  Package,
  Users,
  ChefHat,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import { useProductionNotifications } from '../hooks/useProductionNotifications';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import ProductionOrderCard from '../components/production/ProductionOrderCard';
import ProductionOrderForm from '../components/production/ProductionOrderForm';
import BatchAssignment from '../components/production/BatchAssignment';
import BatchTracking from '../components/production/BatchTracking';
import clsx from 'clsx';

const ProductionPage = () => {
  const location = useLocation();
  
  // State - Set default tab based on route
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/production-orders' ? 'orders' : 'orders'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('scheduled_date');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Toast
  const { success, error, warning } = useToast();
  
  // API Data
  const { 
    data: orders, 
    loading: loadingOrders, 
    refetch: refetchOrders 
  } = useApiCache('/api/production_batches');
  
  const { 
    data: batches, 
    loading: loadingBatches, 
    refetch: refetchBatches 
  } = useApiCache('/api/production_batches');
  
  const { 
    data: recipes, 
    loading: loadingRecipes 
  } = useApiCache('/api/recipes');
  
  const { 
    data: products, 
    loading: loadingProducts 
  } = useApiCache('/api/products');
  
  const { 
    data: ingredients, 
    loading: loadingIngredients 
  } = useApiCache('/api/ingredients');
  
  // Ensure arrays are never null and handle API response structure
  const safeOrders = Array.isArray(orders?.orders) ? orders.orders :
                     Array.isArray(orders) ? orders : [];
  const safeBatches = Array.isArray(batches?.batches) ? batches.batches :
                      Array.isArray(batches) ? batches : [];
  const safeRecipes = Array.isArray(recipes?.recipes) ? recipes.recipes : 
                     Array.isArray(recipes) ? recipes : [];
  const safeProducts = Array.isArray(products?.products) ? products.products : 
                      Array.isArray(products) ? products : [];
  const safeIngredients = Array.isArray(ingredients?.ingredients) ? ingredients.ingredients : 
                         Array.isArray(ingredients) ? ingredients : [];

  const loading = loadingOrders || loadingBatches || loadingRecipes || 
                 loadingProducts || loadingIngredients;

  // Use production notifications
  useProductionNotifications(safeBatches, safeOrders);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger shortcuts when not in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        setSelectedOrder(null);
        setShowOrderForm(true);
      } else if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        handleRefresh();
      } else if (e.key >= '1' && e.key <= '3') {
        const tabIndex = parseInt(e.key) - 1;
        const tabIds = ['orders', 'batches', 'analytics'];
        if (tabIds[tabIndex]) {
          setActiveTab(tabIds[tabIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pending = safeOrders.filter(o => o.status === 'pending').length;
    const inProgress = safeOrders.filter(o => o.status === 'in_progress').length;
    const completed = safeOrders.filter(o => o.status === 'completed').length;
    const dueToday = safeOrders.filter(o => {
      const scheduled = new Date(o.scheduled_date);
      scheduled.setHours(0, 0, 0, 0);
      return scheduled.getTime() === today.getTime() && o.status !== 'completed';
    }).length;

    return { pending, inProgress, completed, dueToday };
  }, [safeOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter(order => {
      // Search filter
      const matchesSearch = 
        (order.recipe?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      // Priority filter
      const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
      
      // Date filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const orderDate = new Date(order.scheduled_date);
        const today = new Date();
        
        switch (dateRange) {
          case 'today':
            matchesDate = orderDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = orderDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = orderDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'scheduled_date':
          return new Date(a.scheduled_date) - new Date(b.scheduled_date);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [safeOrders, searchTerm, filterStatus, filterPriority, dateRange, sortBy]);

  // Filter batches
  const filteredBatches = useMemo(() => {
    return safeBatches.filter(batch => {
      // Search filter
      const matchesSearch = 
        (batch.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.order_id || '').toString().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'batch_number':
          return (a.batch_number || '').localeCompare(b.batch_number || '');
        case 'start_date':
          return new Date(a.start_date || 0) - new Date(b.start_date || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });
  }, [safeBatches, searchTerm, filterStatus, sortBy]);

  // Handle order save
  const handleSaveOrder = async (data) => {
    try {
      const url = selectedOrder 
        ? `/api/production_batches/${selectedOrder.id}`
        : '/api/production_batches';
      
      const response = await fetch(url, {
        method: selectedOrder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        success(
          selectedOrder ? 'Orden actualizada' : 'Orden creada',
          `La orden de producción se ${selectedOrder ? 'actualizó' : 'creó'} correctamente`
        );
        refetchOrders();
        setShowOrderForm(false);
        setSelectedOrder(null);
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo guardar la orden');
      }
    } catch (err) {
      error('Error', 'Error al guardar la orden de producción');
    }
  };

  // Handle status change
  const handleStatusChange = async (order, newStatus) => {
    try {
      const response = await fetch(`/api/production_batches/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        success('Estado actualizado', `La orden ahora está ${getStatusLabel(newStatus)}`);
        refetchOrders();
        
        // If starting production, refresh batches too
        if (newStatus === 'in_progress') {
          refetchBatches();
        }
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo actualizar el estado');
      }
    } catch (err) {
      error('Error', 'Error al actualizar el estado');
    }
  };

  // Handle batch assignment
  const handleAssignBatch = async (orderId, batchData) => {
    try {
      const response = await fetch(`/api/production_batches/${orderId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches: batchData })
      });

      if (response.ok) {
        success('Lotes asignados', 'Los lotes se asignaron correctamente');
        refetchOrders();
        refetchBatches();
        setShowBatchAssignment(false);
        setSelectedOrder(null);
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudieron asignar los lotes');
      }
    } catch (err) {
      error('Error', 'Error al asignar los lotes');
    }
  };

  // Handle delete
  const handleDelete = async (orderId) => {
    if (!window.confirm('¿Está seguro de eliminar esta orden de producción?')) {
      return;
    }

    try {
      const response = await fetch(`/api/production_batches/${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Eliminado', 'Orden de producción eliminada correctamente');
        refetchOrders();
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo eliminar la orden');
      }
    } catch (err) {
      error('Error', 'Error al eliminar la orden');
    }
  };

  const handleRefresh = () => {
    refetchOrders();
    refetchBatches();
    success('Actualizado', 'Datos actualizados correctamente');
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      on_hold: 'En Espera'
    };
    return labels[status] || status;
  };

  // Tabs configuration
  const tabs = [
    { 
      id: 'orders', 
      label: 'Órdenes de Producción', 
      icon: Factory,
      count: safeOrders.length 
    },
    { 
      id: 'batches', 
      label: 'Lotes', 
      icon: Package,
      count: safeBatches.length 
    },
    { 
      id: 'analytics', 
      label: 'Análisis', 
      icon: BarChart3 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Producción
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control de órdenes de producción y lotes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            icon={RefreshCw}
            title="Actualizar (Ctrl+R)"
          >
            Actualizar
          </Button>
          
          <Button
            onClick={() => {
              setSelectedOrder(null);
              setShowOrderForm(true);
            }}
            variant="primary"
            icon={Plus}
            title="Nueva Orden (Ctrl+N)"
          >
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.inProgress}</p>
            </div>
            <Play className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencen Hoy</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{stats.dueToday}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="border-b dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-venezia-600 text-venezia-600 dark:text-venezia-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge size="xs" variant="default">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        {(activeTab === 'orders' || activeTab === 'batches') && (
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={activeTab === 'orders' ? "Buscar órdenes..." : "Buscar lotes..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'in_progress', label: 'En Proceso' },
                  { value: 'completed', label: 'Completado' },
                  { value: 'on_hold', label: 'En Espera' },
                  { value: 'cancelled', label: 'Cancelado' }
                ]}
                icon={Filter}
                className="w-full sm:w-48"
              />
              
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas las prioridades' },
                  { value: 'low', label: 'Baja' },
                  { value: 'medium', label: 'Media' },
                  { value: 'high', label: 'Alta' },
                  { value: 'urgent', label: 'Urgente' }
                ]}
                icon={AlertTriangle}
                className="w-full sm:w-48"
              />
              
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas las fechas' },
                  { value: 'today', label: 'Hoy' },
                  { value: 'week', label: 'Esta semana' },
                  { value: 'month', label: 'Este mes' }
                ]}
                icon={Calendar}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <>
                  {showBatchAssignment && selectedOrder ? (
                    <div className="space-y-4">
                      <BatchAssignment
                        order={selectedOrder}
                        onAssignBatch={handleAssignBatch}
                        onCancel={() => {
                          setShowBatchAssignment(false);
                          setSelectedOrder(null);
                        }}
                        users={[
                          { id: '1', name: 'Juan Pérez' },
                          { id: '2', name: 'María García' },
                          { id: '3', name: 'Carlos López' }
                        ]}
                        existingBatches={safeBatches.filter(b => b.order_id === selectedOrder.id)}
                      />
                      
                      {/* Order Details Panel */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Detalles de la Orden
                        </h3>
                        
                        {selectedOrder.recipe && (
                          <div className="space-y-4">
                            {/* Recipe Ingredients */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ingredientes Necesarios
                              </h4>
                              <div className="space-y-2">
                                {selectedOrder.recipe.recipe_ingredients?.map((ri, index) => {
                                  const ingredient = safeIngredients.find(i => i.id === ri.ingredient_id);
                                  const needed = ri.quantity * selectedOrder.quantity;
                                  const available = ingredient?.current_stock || 0;
                                  const sufficient = available >= needed;
                                  
                                  return (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{ingredient?.name || 'Desconocido'}</span>
                                        {!sufficient && (
                                          <Badge variant="danger" size="xs">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Insuficiente
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className={sufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                          {available.toFixed(2)}
                                        </span>
                                        <span> / {needed.toFixed(2)} {ingredient?.unit}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Timeline */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Línea de Tiempo Estimada
                              </h4>
                              <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Inicio Programado</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(selectedOrder.scheduled_date).toLocaleDateString()} - {selectedOrder.scheduled_time}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                      <Play className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Duración Estimada</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {selectedOrder.estimated_duration || 60} minutos
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Finalización Esperada</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(() => {
                                          const start = new Date(selectedOrder.scheduled_date + 'T' + selectedOrder.scheduled_time);
                                          start.setMinutes(start.getMinutes() + (selectedOrder.estimated_duration || 60));
                                          return start.toLocaleString();
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredOrders.map(order => (
                        <ProductionOrderCard
                          key={order.id}
                          order={order}
                          onEdit={(order) => {
                            setSelectedOrder(order);
                            setShowOrderForm(true);
                          }}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                          onViewDetails={(order) => {
                            setSelectedOrder(order);
                            setShowBatchAssignment(true);
                          }}
                          onDuplicate={(order) => {
                            const duplicated = { 
                              ...order, 
                              id: null, 
                              order_number: null,
                              status: 'pending',
                              scheduled_date: new Date().toISOString().split('T')[0]
                            };
                            setSelectedOrder(duplicated);
                            setShowOrderForm(true);
                          }}
                        />
                      ))}
                      
                      {filteredOrders.length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No se encontraron órdenes de producción</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Batches Tab */}
              {activeTab === 'batches' && (
                <div>
                  {filteredBatches.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {safeBatches.length === 0 ? 'No hay lotes asignados' : 'No se encontraron lotes'}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {safeBatches.length === 0 ? 
                          'Los lotes aparecerán aquí cuando asignes órdenes de producción' :
                          'Prueba con otros filtros de búsqueda'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredBatches.map(batch => {
                        const order = safeOrders.find(o => o.id === batch.order_id);
                        return (
                          <BatchTracking
                            key={batch.id}
                            batch={batch}
                            order={order}
                            ingredients={safeIngredients}
                            onUpdateStatus={async (batchId, newStatus) => {
                              try {
                                const response = await fetch(`/api/production_batches/${batchId}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus })
                                });
                                
                                if (response.ok) {
                                  success('Estado actualizado', `El lote ahora está ${newStatus}`);
                                  refetchBatches();
                                  
                                  // If completing a batch, check if all batches are complete
                                  if (newStatus === 'completed') {
                                    const orderBatches = safeBatches.filter(b => b.order_id === batch.order_id);
                                    const allComplete = orderBatches.every(b => 
                                      b.id === batch.id ? newStatus === 'completed' : b.status === 'completed'
                                    );
                                    
                                    if (allComplete && order) {
                                      // Auto-complete the order if all batches are done
                                      await handleStatusChange(order, 'completed');
                                    }
                                    
                                    // Update inventory - consume ingredients
                                    if (order?.recipe?.recipe_ingredients) {
                                      try {
                                        await fetch('/api/production/consume-ingredients', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            orderId: order.id,
                                            batchId: batch.id,
                                            quantity: batch.quantity,
                                            ingredients: order.recipe.recipe_ingredients
                                          })
                                        });
                                        
                                        // Update product stock
                                        if (order.product_id) {
                                          await fetch(`/api/products/${order.product_id}/stock`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              adjustment: batch.quantity,
                                              type: 'production',
                                              reference: `Lote ${batch.batch_number}`
                                            })
                                          });
                                        }
                                        
                                        info('Inventario actualizado', 'Stock de ingredientes y productos actualizado');
                                      } catch (err) {
                                        warning('Advertencia', 'No se pudo actualizar el inventario automáticamente');
                                      }
                                    }
                                  }
                                } else {
                                  error('Error', 'No se pudo actualizar el estado del lote');
                                }
                              } catch (err) {
                                error('Error', 'Error al actualizar el lote');
                              }
                            }}
                            onComplete={async (batchId) => {
                              // Additional actions when batch is completed
                              refetchBatches();
                              refetchOrders();
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Production Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Eficiencia</h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {safeOrders.length > 0 ? 
                            Math.round((stats.completed / safeOrders.length) * 100) : 0
                          }%
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Promedio</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {safeOrders.filter(o => o.recipe?.preparation_time).length > 0 ?
                            Math.round(
                              safeOrders
                                .filter(o => o.recipe?.preparation_time)
                                .reduce((sum, o) => sum + (o.recipe.preparation_time || 0), 0) /
                              safeOrders.filter(o => o.recipe?.preparation_time).length
                            ) : 0
                          } min
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Lotes Activos</h3>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                          {safeBatches.filter(b => b.status === 'in_progress').length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border dark:border-gray-700">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo Total</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          ${safeOrders.reduce((sum, o) => sum + (o.estimated_cost || 0), 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Production by Recipe */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Producción por Receta
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const recipeStats = {};
                        safeOrders.forEach(order => {
                          const recipeName = order.recipe?.name || order.product_name || 'Sin receta';
                          if (!recipeStats[recipeName]) {
                            recipeStats[recipeName] = { count: 0, quantity: 0, completed: 0 };
                          }
                          recipeStats[recipeName].count++;
                          recipeStats[recipeName].quantity += order.quantity || 0;
                          if (order.status === 'completed') {
                            recipeStats[recipeName].completed++;
                          }
                        });
                        
                        return Object.entries(recipeStats)
                          .sort(([,a], [,b]) => b.count - a.count)
                          .slice(0, 5)
                          .map(([recipeName, stats]) => (
                            <div key={recipeName} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {recipeName}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {stats.count} órdenes • {stats.quantity} unidades
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-venezia-500 h-2 rounded-full" 
                                    style={{ width: `${(stats.completed / stats.count) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Actividad Reciente
                    </h3>
                    <div className="space-y-3">
                      {safeOrders
                        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                        .slice(0, 5)
                        .map(order => (
                          <div key={order.id} className="flex items-center gap-3 py-2">
                            <div className={clsx(
                              'w-2 h-2 rounded-full',
                              order.status === 'completed' ? 'bg-green-500' :
                              order.status === 'in_progress' ? 'bg-yellow-500' :
                              order.status === 'cancelled' ? 'bg-red-500' :
                              'bg-gray-400'
                            )} />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">
                                Orden #{order.order_number || order.id} - {order.recipe?.name || order.product_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.updated_at ? 
                                  `Actualizado ${new Date(order.updated_at).toLocaleDateString()}` :
                                  `Creado ${new Date(order.created_at || Date.now()).toLocaleDateString()}`
                                }
                              </p>
                            </div>
                            <Badge 
                              variant={
                                order.status === 'completed' ? 'success' : 
                                order.status === 'in_progress' ? 'warning' : 
                                order.status === 'cancelled' ? 'danger' :
                                'default'
                              }
                              size="xs"
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                        ))
                      }
                      {safeOrders.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No hay actividad reciente
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductionOrderForm
        isOpen={showOrderForm}
        onClose={() => {
          setShowOrderForm(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveOrder}
        order={selectedOrder}
        recipes={safeRecipes}
        products={safeProducts}
        users={[
          { id: '1', name: 'Juan Pérez' },
          { id: '2', name: 'María García' },
          { id: '3', name: 'Carlos López' }
        ]}
      />
    </div>
  );
};

export default ProductionPage;