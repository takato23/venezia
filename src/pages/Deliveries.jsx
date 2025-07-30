import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Clock,
  Package,
  User,
  Phone,
  Navigation,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import mockDeliveryService from '../services/mockDeliveryService';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import DeliveryCard from '../components/delivery/DeliveryCard';
import DeliveryForm from '../components/delivery/DeliveryForm';
import DeliveryRoute from '../components/delivery/DeliveryRoute';
import DeliveryDetailsModal from '../components/delivery/DeliveryDetailsModal';
import LoadingState from '../components/ui/LoadingState';
import clsx from 'clsx';

const DeliveriesPage = () => {
  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Toast
  const { success, error, warning } = useToast();
  
  // API Data
  const { 
    data: deliveries, 
    loading: loadingDeliveries, 
    error: deliveriesError,
    refetch: refetchDeliveries 
  } = useApiCache('/api/deliveries');
  
  const { 
    data: drivers, 
    loading: loadingDrivers,
    refetch: refetchDrivers 
  } = useApiCache('/api/drivers');
  
  const { 
    data: orders, 
    loading: loadingOrders 
  } = useApiCache('/api/sales');

  // Safe arrays
  const safeDeliveries = deliveries || [];
  const safeDrivers = drivers || [];
  const safeOrders = orders?.sales || orders || [];

  const loading = loadingDeliveries || loadingDrivers || loadingOrders;

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeliveries = safeDeliveries.filter(d => {
      const deliveryDate = new Date(d.scheduled_date);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate.getTime() === today.getTime();
    });

    return {
      total: todayDeliveries.length,
      pending: todayDeliveries.filter(d => d.status === 'pending').length,
      inTransit: todayDeliveries.filter(d => d.status === 'in_transit').length,
      delivered: todayDeliveries.filter(d => d.status === 'delivered').length,
      failed: todayDeliveries.filter(d => d.status === 'failed').length
    };
  }, [safeDeliveries]);

  // Filter deliveries
  const filteredDeliveries = useMemo(() => {
    return safeDeliveries.filter(delivery => {
      // Search filter
      const matchesSearch = 
        delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer_phone?.includes(searchTerm) ||
        delivery.order_number?.toString().includes(searchTerm) ||
        delivery.address?.street?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
      
      // Driver filter
      const matchesDriver = filterDriver === 'all' || 
        delivery.driver_id === parseInt(filterDriver);
      
      // Date filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const deliveryDate = new Date(delivery.scheduled_date);
        const today = new Date();
        
        switch (dateRange) {
          case 'today':
            deliveryDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            matchesDate = deliveryDate.getTime() === today.getTime();
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            deliveryDate.setHours(0, 0, 0, 0);
            tomorrow.setHours(0, 0, 0, 0);
            matchesDate = deliveryDate.getTime() === tomorrow.getTime();
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = deliveryDate >= weekAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDriver && matchesDate;
    }).sort((a, b) => {
      // Sort by priority and scheduled time
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.scheduled_date) - new Date(b.scheduled_date);
    });
  }, [safeDeliveries, searchTerm, filterStatus, filterDriver, dateRange]);

  // Group deliveries by driver for route view
  const deliveriesByDriver = useMemo(() => {
    const grouped = {};
    filteredDeliveries.forEach(delivery => {
      const driverId = delivery.driver_id || 'unassigned';
      if (!grouped[driverId]) {
        grouped[driverId] = [];
      }
      grouped[driverId].push(delivery);
    });
    return grouped;
  }, [filteredDeliveries]);

  // Handle delivery save
  const handleSaveDelivery = async (data) => {
    try {
      const url = selectedDelivery 
        ? `/api/deliveries/${selectedDelivery.id}`
        : '/api/deliveries';
      
      console.log('🚚 Guardando entrega:', { url, method: selectedDelivery ? 'PUT' : 'POST', data });
      
      const response = await axios({
        method: selectedDelivery ? 'PUT' : 'POST',
        url: url,
        data: data,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Respuesta del servidor:', response.data);

      if (response.status >= 200 && response.status < 300) {
        success(
          selectedDelivery ? 'Entrega actualizada' : 'Entrega creada',
          `La entrega se ${selectedDelivery ? 'actualizó' : 'creó'} correctamente`
        );
        
        // Pequeño delay para asegurar que el backend procesó el cambio
        setTimeout(() => {
          refetchDeliveries();
        }, 100);
        setShowDeliveryForm(false);
        setSelectedDelivery(null);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error saving delivery:', err);
      
      // Modo mock: Usar servicio local cuando el backend no responde
      if (err.message.includes('504') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.log('🚛 Modo offline: Guardando en almacenamiento local');
        
        try {
          let result;
          if (selectedDelivery) {
            // Actualizar entrega existente
            result = mockDeliveryService.update(selectedDelivery.id, data);
            success(
              'Entrega actualizada',
              'Los cambios se guardaron correctamente (modo offline)'
            );
          } else {
            // Crear nueva entrega
            result = mockDeliveryService.create(data);
            success(
              'Entrega creada',
              `Entrega #${result.id} creada correctamente (modo offline)`
            );
          }
          
          // Sincronizar con el cache de la API
          mockDeliveryService.syncWithApiCache();
          
          // Refrescar la lista
          refetchDeliveries();
          setShowDeliveryForm(false);
          setSelectedDelivery(null);
        } catch (mockError) {
          console.error('Error en modo mock:', mockError);
          error('Error al guardar', 'No se pudo guardar la entrega localmente');
        }
      } else {
        error('Error al guardar entrega', 'Por favor, intente nuevamente');
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (delivery, newStatus) => {
    try {
      const response = await fetch(`/api/deliveries/${delivery.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        success('Estado actualizado', `La entrega ahora está ${getStatusLabel(newStatus)}`);
        refetchDeliveries();
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo actualizar el estado');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      
      // Modo offline
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        try {
          mockDeliveryService.updateStatus(delivery.id, newStatus);
          mockDeliveryService.syncWithApiCache();
          success('Estado actualizado', `La entrega ahora está ${getStatusLabel(newStatus)} (modo offline)`);
          refetchDeliveries();
        } catch (mockError) {
          error('Error', 'No se pudo actualizar el estado localmente');
        }
      } else {
        error('Error', 'Error al actualizar el estado');
      }
    }
  };

  // Handle delete
  const handleDelete = async (deliveryId) => {
    if (!window.confirm('¿Está seguro de cancelar esta entrega?')) {
      return;
    }

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Cancelado', 'Entrega cancelada correctamente');
        refetchDeliveries();
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo cancelar la entrega');
      }
    } catch (err) {
      console.error('Error deleting delivery:', err);
      
      // Modo offline
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        try {
          mockDeliveryService.delete(deliveryId);
          mockDeliveryService.syncWithApiCache();
          success('Cancelado', 'Entrega cancelada correctamente (modo offline)');
          refetchDeliveries();
        } catch (mockError) {
          error('Error', 'No se pudo cancelar la entrega localmente');
        }
      } else {
        error('Error', 'Error al cancelar la entrega');
      }
    }
  };

  const handleRefresh = () => {
    refetchDeliveries();
    refetchDrivers();
    success('Actualizado', 'Datos actualizados correctamente');
  };

  const handleViewRoute = (delivery) => {
    if (delivery.driver_id) {
      const driver = safeDrivers.find(d => d.id === delivery.driver_id);
      const driverDeliveries = deliveriesByDriver[delivery.driver_id] || [];
      setSelectedDriver(driver);
      setShowRouteModal(true);
    } else {
      warning('Sin repartidor', 'Esta entrega no tiene un repartidor asignado');
    }
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_transit: 'En Tránsito',
      delivered: 'Entregado',
      failed: 'Fallido'
    };
    return labels[status] || status;
  };

  // Tabs configuration
  const tabs = [
    { 
      id: 'all', 
      label: 'Todas', 
      icon: Package,
      count: filteredDeliveries.length 
    },
    { 
      id: 'today', 
      label: 'Hoy', 
      icon: Calendar,
      count: stats.total
    },
    { 
      id: 'routes', 
      label: 'Rutas', 
      icon: Navigation,
      count: Object.keys(deliveriesByDriver).filter(id => id !== 'unassigned').length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Gestión de Entregas
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Control y seguimiento de entregas a domicilio
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
            onClick={() => {
              setSelectedDelivery(null);
              setShowDeliveryForm(true);
            }}
            variant="primary"
            icon={Plus}
          >
            Nueva Entrega
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Hoy</p>
              <p className="text-lg font-bold mt-1">{stats.total}</p>
            </div>
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-lg font-bold mt-1 text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">En Tránsito</p>
              <p className="text-lg font-bold mt-1 text-blue-600">{stats.inTransit}</p>
            </div>
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Entregadas</p>
              <p className="text-lg font-bold mt-1 text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Fallidas</p>
              <p className="text-lg font-bold mt-1 text-red-600">{stats.failed}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border dark:border-gray-700">
        <div className="border-b dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm',
                    activeTab === tab.id
                      ? 'border-venezia-600 text-venezia-600 dark:text-venezia-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
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
        <div className="p-3 border-b dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por cliente, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            
            {activeTab !== 'routes' && (
              <>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'assigned', label: 'Asignado' },
                    { value: 'in_transit', label: 'En Tránsito' },
                    { value: 'delivered', label: 'Entregado' },
                    { value: 'failed', label: 'Fallido' }
                  ]}
                  icon={Filter}
                  className="w-full sm:w-40"
                />
                
                <Select
                  value={filterDriver}
                  onChange={(e) => setFilterDriver(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos los repartidores' },
                    ...safeDrivers.map(d => ({
                      value: d.id.toString(),
                      label: d.name
                    }))
                  ]}
                  icon={User}
                  className="w-full sm:w-40"
                />
                
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  options={[
                    { value: 'today', label: 'Hoy' },
                    { value: 'tomorrow', label: 'Mañana' },
                    { value: 'week', label: 'Esta semana' },
                    { value: 'all', label: 'Todas' }
                  ]}
                  icon={Calendar}
                  className="w-full sm:w-32"
                />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <LoadingState
            loading={loading}
            error={deliveriesError}
            empty={filteredDeliveries.length === 0 && !loading}
            onRetry={refetchDeliveries}
            emptyText="No se encontraron entregas"
            emptyIcon={Package}
          />

          {!loading && !deliveriesError && (
            <>
              {/* All/Today Tab */}
              {(activeTab === 'all' || activeTab === 'today') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredDeliveries.map(delivery => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onEdit={(delivery) => {
                        setSelectedDelivery(delivery);
                        setShowDeliveryForm(true);
                      }}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onViewDetails={handleViewDetails}
                      onViewRoute={handleViewRoute}
                    />
                  ))}
                </div>
              )}

              {/* Routes Tab */}
              {activeTab === 'routes' && (
                <div className="space-y-6">
                  {Object.entries(deliveriesByDriver).map(([driverId, deliveries]) => {
                    if (driverId === 'unassigned') return null;
                    
                    const driver = safeDrivers.find(d => d.id === parseInt(driverId));
                    if (!driver) return null;
                    
                    return (
                      <div key={driverId} className="border dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-venezia-100 dark:bg-venezia-900/20 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {driver.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {deliveries.length} entregas • {driver.vehicle}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowRouteModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            icon={Navigation}
                          >
                            Ver Ruta
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {deliveries.slice(0, 3).map(delivery => (
                            <div key={delivery.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {delivery.customer_name}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {delivery.address?.street} {delivery.address?.number}
                              </p>
                            </div>
                          ))}
                          {deliveries.length > 3 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              +{deliveries.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Unassigned Deliveries */}
                  {deliveriesByDriver.unassigned && deliveriesByDriver.unassigned.length > 0 && (
                    <div className="border dark:border-gray-700 rounded-lg p-4 border-dashed">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                        Sin Asignar ({deliveriesByDriver.unassigned.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deliveriesByDriver.unassigned.map(delivery => (
                          <div key={delivery.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {delivery.customer_name}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {delivery.address?.street} {delivery.address?.number}
                            </p>
                            <Button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setShowDeliveryForm(true);
                              }}
                              variant="ghost"
                              size="xs"
                              className="mt-2"
                            >
                              Asignar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeliveryForm
        isOpen={showDeliveryForm}
        onClose={() => {
          setShowDeliveryForm(false);
          setSelectedDelivery(null);
        }}
        onSave={handleSaveDelivery}
        delivery={selectedDelivery}
        drivers={safeDrivers}
        orders={safeOrders.filter(o => !o.delivery_id)} // Only unassigned orders
      />

      <DeliveryRoute
        isOpen={showRouteModal}
        onClose={() => {
          setShowRouteModal(false);
          setSelectedDriver(null);
        }}
        deliveries={selectedDriver ? (deliveriesByDriver[selectedDriver.id] || []) : []}
        driver={selectedDriver}
      />

      <DeliveryDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDelivery(null);
        }}
        delivery={selectedDelivery}
      />
    </div>
  );
};

export default DeliveriesPage;