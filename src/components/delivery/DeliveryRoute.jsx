import React, { useState, useEffect } from 'react';
import { 
  Navigation,
  MapPin,
  Clock,
  Truck,
  User,
  Phone,
  Package,
  AlertCircle,
  CheckCircle,
  RotateCw,
  X
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const DeliveryRoute = ({ 
  isOpen, 
  onClose, 
  deliveries = [],
  driver = null
}) => {
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Status colors
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_transit: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    if (deliveries.length > 0) {
      // In a real app, this would call a route optimization API
      // For now, we'll just sort by priority and proximity
      const sorted = [...deliveries].sort((a, b) => {
        // Priority first
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by scheduled time
        return new Date(a.scheduled_date) - new Date(b.scheduled_date);
      });
      
      setOptimizedRoute(sorted);
      
      // Calculate estimated totals (mock data)
      setTotalDistance(sorted.length * 2.5); // Average 2.5km per delivery
      setTotalTime(sorted.length * 15 + 30); // 15 min per delivery + 30 min buffer
    }
  }, [deliveries]);

  const handleOptimizeRoute = () => {
    // In a real app, this would call a route optimization service
    // For demo, we'll just shuffle the order
    const shuffled = [...optimizedRoute].sort(() => Math.random() - 0.5);
    setOptimizedRoute(shuffled);
  };

  const formatAddress = (address) => {
    if (!address) return 'Sin dirección';
    return `${address.street} ${address.number}, ${address.neighborhood}`;
  };

  const getDeliveryIcon = (status) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'failed':
        return AlertCircle;
      case 'in_transit':
        return Truck;
      default:
        return MapPin;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Ruta de Entrega
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Driver Info */}
        {driver && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-venezia-100 dark:bg-venezia-900/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {driver.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {driver.vehicle} • {driver.phone}
                  </p>
                </div>
              </div>
              <Badge variant="success">
                Activo
              </Badge>
            </div>
          </div>
        )}

        {/* Route Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {optimizedRoute.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Entregas
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalDistance.toFixed(1)} km
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distancia total
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.floor(totalTime / 60)}h {totalTime % 60}m
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tiempo estimado
            </p>
          </div>
        </div>

        {/* Optimize Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleOptimizeRoute}
            variant="outline"
            icon={RotateCw}
          >
            Optimizar Ruta
          </Button>
        </div>

        {/* Route List */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Orden de entregas
          </h3>
          
          <div className="space-y-2">
            {optimizedRoute.map((delivery, index) => {
              const Icon = getDeliveryIcon(delivery.status);
              const isSelected = selectedDelivery?.id === delivery.id;
              
              return (
                <div
                  key={delivery.id}
                  className={clsx(
                    'relative pl-8 pb-8 cursor-pointer transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-4 -m-4',
                    isSelected && 'bg-venezia-50 dark:bg-venezia-900/20'
                  )}
                  onClick={() => setSelectedDelivery(
                    isSelected ? null : delivery
                  )}
                >
                  {/* Timeline Line */}
                  {index < optimizedRoute.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
                  )}
                  
                  {/* Timeline Dot */}
                  <div className={clsx(
                    'absolute left-2 top-4 w-4 h-4 rounded-full border-2',
                    delivery.status === 'delivered' 
                      ? 'bg-green-500 border-green-500' 
                      : delivery.status === 'in_transit'
                      ? 'bg-yellow-500 border-yellow-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  )} />
                  
                  {/* Content */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {delivery.customer_name}
                        </h4>
                        <span className={clsx(
                          'px-2 py-0.5 text-xs rounded-full',
                          statusColors[delivery.status]
                        )}>
                          {delivery.status === 'pending' && 'Pendiente'}
                          {delivery.status === 'in_transit' && 'En camino'}
                          {delivery.status === 'delivered' && 'Entregado'}
                          {delivery.status === 'failed' && 'Fallido'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <MapPin className="inline w-3 h-3 mr-1" />
                        {formatAddress(delivery.address)}
                      </p>
                      
                      {delivery.scheduled_time && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          <Clock className="inline w-3 h-3 mr-1" />
                          {delivery.scheduled_time}
                        </p>
                      )}
                    </div>
                    
                    <Icon className={clsx(
                      'w-5 h-5 flex-shrink-0 ml-3',
                      delivery.status === 'delivered' && 'text-green-500',
                      delivery.status === 'failed' && 'text-red-500',
                      delivery.status === 'in_transit' && 'text-yellow-500',
                      delivery.status === 'pending' && 'text-gray-400'
                    )} />
                  </div>
                  
                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a 
                          href={`tel:${delivery.customer_phone}`}
                          className="text-venezia-600 hover:text-venezia-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {delivery.customer_phone}
                        </a>
                      </div>
                      
                      {delivery.items && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <Package className="inline w-4 h-4 mr-1" />
                          {delivery.items.length} productos
                        </div>
                      )}
                      
                      {delivery.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{delivery.notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Vista del mapa disponible próximamente
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            icon={X}
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            icon={Navigation}
          >
            Iniciar Navegación
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryRoute;