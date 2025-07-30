import React from 'react';
import { Truck, Clock, User, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useApiCache } from '../../hooks/useApiCache';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';

const ActiveDeliveries = ({ className = "" }) => {
  const { 
    data: deliveries, 
    loading: loadingDeliveries 
  } = useApiCache('/api/deliveries/active', {
    refreshInterval: 60000 // Actualizar cada minuto
  });

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pendiente',
        variant: 'default',
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400'
      },
      assigned: {
        label: 'Asignado',
        variant: 'info',
        icon: User,
        color: 'text-blue-600 dark:text-blue-400'
      },
      in_transit: {
        label: 'En Tránsito',
        variant: 'warning',
        icon: Truck,
        color: 'text-orange-600 dark:text-orange-400'
      },
      delivered: {
        label: 'Entregado',
        variant: 'success',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400'
      },
      failed: {
        label: 'Fallido',
        variant: 'danger',
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400'
      }
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loadingDeliveries) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Cargando deliveries...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Truck className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          🚚 Deliveries Activos
        </h4>
        <Badge variant="warning" size="sm">
          {safeDeliveries.length}
        </Badge>
      </div>
      
      {safeDeliveries.length === 0 ? (
        <div className="text-center py-4">
          <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No hay deliveries activos
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Los nuevos deliveries aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeDeliveries.slice(0, 5).map((delivery) => {
            const statusConfig = getStatusConfig(delivery.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={delivery.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        #{delivery.order_number || delivery.id}
                      </span>
                      <Badge variant={statusConfig.variant} size="sm">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <User className="h-3 w-3" />
                        <span>{delivery.customer_name}</span>
                      </div>
                      
                      {delivery.address && (
                        <div className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {typeof delivery.address === 'string' 
                              ? delivery.address 
                              : `${delivery.address?.street || ''} ${delivery.address?.number || ''}`
                            }
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(delivery.created_at)}</span>
                        </div>
                        
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ${delivery.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {delivery.estimated_time && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                    🕒 Tiempo estimado: {delivery.estimated_time}
                  </div>
                )}
              </div>
            );
          })}
          
          {safeDeliveries.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{safeDeliveries.length - 5} deliveries más...
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          📱 Se actualiza automáticamente cada minuto
        </p>
      </div>
    </div>
  );
};

export default ActiveDeliveries;