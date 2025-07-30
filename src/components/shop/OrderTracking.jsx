import React, { useState, useEffect } from 'react';
import { 
  Package,
  Clock,
  CheckCircle,
  Circle,
  Truck,
  MapPin,
  Star,
  ChefHat,
  ShoppingBag,
  AlertCircle,
  Phone,
  MessageCircle,
  Navigation,
  Timer,
  TrendingUp
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const OrderTracking = ({ orderId, onClose }) => {
  const { info, success, error: showError } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Estados de la orden
  const orderStates = [
    { 
      id: 'pending', 
      label: 'Pedido Recibido', 
      icon: ShoppingBag,
      description: 'Tu pedido ha sido recibido',
      color: 'gray'
    },
    { 
      id: 'confirmed', 
      label: 'Confirmado', 
      icon: CheckCircle,
      description: 'Estamos preparando tu pedido',
      color: 'blue'
    },
    { 
      id: 'preparing', 
      label: 'En Preparación', 
      icon: ChefHat,
      description: 'Nuestro chef está preparando tu pedido',
      color: 'orange'
    },
    { 
      id: 'ready', 
      label: 'Listo', 
      icon: Package,
      description: 'Tu pedido está listo',
      color: 'green'
    },
    { 
      id: 'delivering', 
      label: 'En Camino', 
      icon: Truck,
      description: 'Tu pedido está en camino',
      color: 'blue'
    },
    { 
      id: 'delivered', 
      label: 'Entregado', 
      icon: CheckCircle,
      description: 'Tu pedido ha sido entregado',
      color: 'green'
    }
  ];

  // Cargar orden y actualizaciones en tiempo real
  useEffect(() => {
    loadOrder();
    
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      loadOrder();
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/tracking`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        
        // Calcular tiempo estimado
        calculateEstimatedTime(data.order);
        
        // Mostrar rating si la orden está entregada
        if (data.order.status === 'delivered' && !data.order.rating) {
          setShowRating(true);
        }
      }
    } catch (err) {
      showError('Error', 'No se pudo cargar la información del pedido');
    } finally {
      setLoading(false);
    }
  };

  // Calcular tiempo estimado basado en el estado actual
  const calculateEstimatedTime = (orderData) => {
    const statusTimes = {
      pending: 5,
      confirmed: 25,
      preparing: 15,
      ready: 10,
      delivering: 15
    };

    const currentStateIndex = orderStates.findIndex(s => s.id === orderData.status);
    let remainingTime = 0;

    for (let i = currentStateIndex; i < orderStates.length - 1; i++) {
      remainingTime += statusTimes[orderStates[i].id] || 0;
    }

    setEstimatedTime(remainingTime);
  };

  // Obtener ubicación en vivo del delivery
  const trackDelivery = async () => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/location`);
      if (response.ok) {
        const data = await response.json();
        setLiveLocation(data.location);
        info('Ubicación actualizada', 'La ubicación del repartidor se ha actualizado');
      }
    } catch (err) {
      showError('Error', 'No se pudo obtener la ubicación');
    }
  };

  // Enviar calificación
  const submitRating = async () => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });

      if (response.ok) {
        success('Gracias por tu calificación', 'Tu opinión nos ayuda a mejorar');
        setShowRating(false);
      }
    } catch (err) {
      showError('Error', 'No se pudo enviar la calificación');
    }
  };

  // Contactar al repartidor
  const contactDelivery = (type) => {
    if (type === 'call') {
      window.location.href = `tel:${order.deliveryPhone}`;
    } else {
      window.location.href = `https://wa.me/${order.deliveryPhone}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-venezia-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No se encontró la orden</p>
      </div>
    );
  }

  const currentStateIndex = orderStates.findIndex(s => s.id === order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Orden #{order.id}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Tiempo estimado */}
      {estimatedTime && order.status !== 'delivered' && (
        <div className="bg-venezia-50 dark:bg-venezia-900/20 rounded-lg p-6 text-center">
          <Timer className="w-8 h-8 text-venezia-600 dark:text-venezia-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-venezia-900 dark:text-venezia-100">
            Tiempo estimado: {estimatedTime} minutos
          </p>
          <p className="text-sm text-venezia-600 dark:text-venezia-400 mt-1">
            Tu pedido llegará aproximadamente a las {
              new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString('es', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          </p>
        </div>
      )}

      {/* Timeline de estados */}
      <div className="relative">
        {orderStates.map((state, index) => {
          const isCompleted = index <= currentStateIndex;
          const isCurrent = index === currentStateIndex;
          const StateIcon = state.icon;

          return (
            <div key={state.id} className="flex items-start mb-8 last:mb-0">
              {/* Línea vertical */}
              {index < orderStates.length - 1 && (
                <div 
                  className={clsx(
                    "absolute left-6 top-12 w-0.5 h-16",
                    isCompleted ? "bg-venezia-500" : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              )}

              {/* Icono del estado */}
              <div className={clsx(
                "relative z-10 flex items-center justify-center w-12 h-12 rounded-full",
                isCompleted 
                  ? "bg-venezia-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}>
                <StateIcon className="w-6 h-6" />
                {isCurrent && (
                  <div className="absolute -inset-1 rounded-full border-2 border-venezia-500 animate-pulse" />
                )}
              </div>

              {/* Contenido del estado */}
              <div className="ml-4 flex-1">
                <h4 className={clsx(
                  "font-semibold",
                  isCompleted 
                    ? "text-gray-900 dark:text-white" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {state.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {state.description}
                </p>
                {isCurrent && state.id === 'preparing' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <div className="animate-pulse">
                        <div className="h-2 w-2 bg-orange-500 rounded-full" />
                      </div>
                      En proceso...
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones según el estado */}
      {order.status === 'delivering' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Tu pedido está en camino
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Repartidor: {order.deliveryPerson}
              </p>
            </div>
            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => trackDelivery()}
              icon={Navigation}
            >
              Ver ubicación
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactDelivery('call')}
              icon={Phone}
            >
              Llamar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactDelivery('whatsapp')}
              icon={MessageCircle}
            >
              WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Mostrar mapa si hay ubicación en vivo */}
      {liveLocation && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">Ubicación del repartidor</span>
          </div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Mapa en tiempo real
            </p>
          </div>
        </div>
      )}

      {/* Formulario de calificación */}
      {showRating && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            ¿Cómo fue tu experiencia?
          </h4>
          
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star 
                  className={clsx(
                    "w-8 h-8 transition-colors",
                    star <= rating 
                      ? "text-yellow-500 fill-current" 
                      : "text-gray-300 dark:text-gray-600"
                  )}
                />
              </button>
            ))}
          </div>

          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-venezia-500"
            rows="3"
            placeholder="Cuéntanos más sobre tu experiencia (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRating(false)}
            >
              Más tarde
            </Button>
            <Button
              variant="primary"
              onClick={submitRating}
              disabled={rating === 0}
            >
              Enviar calificación
            </Button>
          </div>
        </div>
      )}

      {/* Resumen del pedido */}
      <div className="border-t dark:border-gray-700 pt-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Resumen del pedido
        </h4>
        <div className="space-y-2">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {item.quantity}x {item.productName}
              </span>
              <span className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;