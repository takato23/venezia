import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Store, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Phone,
  Clock,
  Users,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Map
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const StoreCard = ({ store, onEdit, onDelete, onView }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{store.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{store.code}</p>
          </div>
        </div>
        
        <Badge variant={store.active ? 'success' : 'danger'}>
          {store.active ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      
      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{store.address}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Phone className="h-4 w-4" />
          <span>{store.phone || 'Sin teléfono'}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>{store.employees_count || 0} empleados</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            ${(store.monthly_sales || 0).toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Ventas del mes
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {store.daily_orders || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Órdenes hoy
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(store)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(store)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(store)}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const StoreForm = ({ store, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    active: true,
    coordinates: { lat: null, lng: null },
    opening_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }
  });
  
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        code: store.code || '',
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        manager: store.manager || '',
        active: store.active !== false,
        coordinates: store.coordinates || { lat: null, lng: null },
        opening_hours: store.opening_hours || formData.opening_hours
      });
    } else {
      // Reset form for new store
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        active: true,
        coordinates: { lat: null, lng: null },
        opening_hours: formData.opening_hours
      });
    }
  }, [store, isOpen]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={store ? 'Editar Tienda' : 'Nueva Tienda'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Tienda
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Venezia Centro"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
              placeholder="VZ-001"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dirección
          </label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            required
            placeholder="Av. Principal 123, Ciudad"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tienda@venezia.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gerente
          </label>
          <Input
            value={formData.manager}
            onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
            placeholder="Nombre del gerente"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900 dark:text-white">
            Tienda activa
          </label>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            {store ? 'Actualizar' : 'Crear'} Tienda
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const StoresPage = () => {
  const location = useLocation();
  const { success, error, warning } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // API Data
  const { 
    data: stores, 
    loading: loadingStores, 
    refetch: refetchStores 
  } = useApiCache('/api/stores');
  
  // Handle both direct array and {success: true, data: [...]} formats
  const extractedStores = stores?.data || stores;
  const safeStores = Array.isArray(extractedStores) ? extractedStores : [];
  
  
  // Filter and sort stores
  const filteredStores = useMemo(() => {
    // Ensure we have an array even inside useMemo
    const stores = Array.isArray(safeStores) ? safeStores : [];
    
    let filtered = stores.filter(store => {
      const matchesSearch = store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && store.active) ||
                           (filterStatus === 'inactive' && !store.active);
      return matchesSearch && matchesStatus;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name?.localeCompare(b.name) || 0;
        case 'sales':
          return (b.monthly_sales || 0) - (a.monthly_sales || 0);
        case 'orders':
          return (b.daily_orders || 0) - (a.daily_orders || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [safeStores, searchTerm, filterStatus, sortBy]);
  
  // Store stats
  const storeStats = useMemo(() => {
    const stores = Array.isArray(safeStores) ? safeStores : [];
    const total = stores.length;
    const active = stores.filter(s => s.active).length;
    const inactive = total - active;
    const totalSales = stores.reduce((sum, s) => sum + (s.monthly_sales || 0), 0);
    
    return { total, active, inactive, totalSales };
  }, [safeStores]);
  
  // Handlers
  const handleAddStore = () => {
    setSelectedStore(null);
    setShowStoreForm(true);
  };
  
  const handleEditStore = (store) => {
    setSelectedStore(store);
    setShowStoreForm(true);
  };
  
  const handleDeleteStore = (store) => {
    setSelectedStore(store);
    setShowDeleteConfirm(true);
  };
  
  const handleViewStore = (store) => {
    // Navigate to store details page
    console.log('View store:', store);
  };
  
  const handleSaveStore = async (storeData) => {
    try {
      const url = selectedStore 
        ? `/api/stores/${selectedStore.id}` 
        : '/api/stores';
      const method = selectedStore ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar la tienda');
      }
      
      success(
        selectedStore ? 'Tienda actualizada' : 'Tienda creada',
        `${storeData.name} ha sido ${selectedStore ? 'actualizada' : 'creada'} exitosamente`
      );
      
      setShowStoreForm(false);
      setSelectedStore(null);
      refetchStores();
      
    } catch (err) {
      error('Error', err.message || 'Error al guardar la tienda');
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedStore) return;
    
    try {
      const response = await fetch(`/api/stores/${selectedStore.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la tienda');
      }
      
      success('Tienda eliminada', `${selectedStore.name} ha sido eliminada`);
      setShowDeleteConfirm(false);
      setSelectedStore(null);
      refetchStores();
      
    } catch (err) {
      error('Error', err.message || 'Error al eliminar la tienda');
    }
  };
  
  if (loadingStores) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tiendas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona las sucursales y puntos de venta</p>
        </div>
        
        <Button onClick={handleAddStore} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Tienda
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tiendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{storeStats.total}</p>
            </div>
            <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{storeStats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactivas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{storeStats.inactive}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${storeStats.totalSales.toFixed(0)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar tiendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={filterStatus} onChange={setFilterStatus} className="w-full sm:w-48">
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </Select>
        
        <Select value={sortBy} onChange={setSortBy} className="w-full sm:w-48">
          <option value="name">Ordenar por nombre</option>
          <option value="sales">Ordenar por ventas</option>
          <option value="orders">Ordenar por órdenes</option>
        </Select>
      </div>
      
      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map(store => (
          <StoreCard
            key={store.id}
            store={store}
            onEdit={handleEditStore}
            onDelete={handleDeleteStore}
            onView={handleViewStore}
          />
        ))}
      </div>
      
      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron tiendas
          </p>
        </div>
      )}
      
      {/* Store Form Modal */}
      <StoreForm
        store={selectedStore}
        isOpen={showStoreForm}
        onClose={() => {
          setShowStoreForm(false);
          setSelectedStore(null);
        }}
        onSave={handleSaveStore}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedStore(null);
        }}
        title="Eliminar Tienda"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que deseas eliminar la tienda <strong>{selectedStore?.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedStore(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              className="flex-1"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoresPage;