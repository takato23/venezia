import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Store, 
  MapPin,
  Phone,
  Clock,
  Users,
  BarChart3,
  Settings,
  Edit,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Package
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const StoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  
  // State
  const [store, setStore] = useState(location.state?.store || null);
  const [loading, setLoading] = useState(!store);
  
  // API cache
  const { data: storeData, loading: apiLoading, error: apiError } = useApiCache(
    store ? null : `/api/stores/${id}`,
    { enabled: !store }
  );
  
  useEffect(() => {
    if (storeData && !store) {
      setStore(storeData);
      setLoading(false);
    }
  }, [storeData, store]);
  
  useEffect(() => {
    if (apiError) {
      error('Error al cargar los detalles de la tienda');
    }
  }, [apiError, error]);
  
  const handleEdit = () => {
    navigate('/stores', { 
      state: { 
        editStore: store,
        openForm: true 
      }
    });
  };
  
  const handleBack = () => {
    navigate('/stores');
  };
  
  if (loading || apiLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!store) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Tienda no encontrada
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          La tienda solicitada no existe o no tienes permisos para verla.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a tiendas
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {store.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Código: {store.code}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={store.active ? 'success' : 'danger'} size="lg">
            {store.active ? 'Activa' : 'Inactiva'}
          </Badge>
          
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información General
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Dirección
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {store.address || 'No especificada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Teléfono
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {store.phone || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Empleados
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {store.employees_count || 0} empleados
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fecha de apertura
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {store.opening_date ? new Date(store.opening_date).toLocaleDateString() : 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rendimiento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(store.monthly_sales || 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ventas mensuales
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(store.growth_rate || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Crecimiento
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Package className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {store.products_sold || 0}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Productos vendidos
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h2>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/stores/${store.id}/analytics`)}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Ver Analytics
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/stores/${store.id}/employees`)}
              >
                <Users className="h-4 w-4 mr-3" />
                Gestionar Empleados
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/stores/${store.id}/settings`)}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configuración
              </Button>
            </div>
          </div>
          
          {/* Store Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado de la Tienda
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {store.active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {store.active ? 'Tienda activa y operativa' : 'Tienda inactiva'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Horario: {store.hours || 'No especificado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetails;