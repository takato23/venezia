import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  User,
  Phone,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const DeliveryDetailsModal = ({ isOpen, onClose, delivery }) => {
  if (!delivery) return null;

  const statusConfig = {
    pending: {
      label: 'Pendiente',
      variant: 'default',
      icon: Clock,
      color: 'text-gray-600'
    },
    assigned: {
      label: 'Asignado',
      variant: 'info',
      icon: User,
      color: 'text-blue-600'
    },
    in_transit: {
      label: 'En Tránsito',
      variant: 'warning',
      icon: Truck,
      color: 'text-yellow-600'
    },
    delivered: {
      label: 'Entregado',
      variant: 'success',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    failed: {
      label: 'Fallido',
      variant: 'danger',
      icon: AlertCircle,
      color: 'text-red-600'
    }
  };

  const status = statusConfig[delivery.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'Sin dirección especificada';
    return `${address.street || ''} ${address.number || ''}, ${address.neighborhood || ''}, ${address.city || ''}`;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container - Flexbox Centering */}
          <div className="min-h-full flex items-center justify-center p-4">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalles de Entrega #{delivery.order_number || delivery.id}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Status and Date */}
                <div className="flex items-center justify-between">
                  <Badge variant={status.variant} size="lg">
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {status.label}
                  </Badge>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="inline-block w-4 h-4 mr-1" />
                    {formatDate(delivery.created_at)}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Información del Cliente
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Nombre:</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {delivery.customer_name}
                      </p>
                    </div>
                    {delivery.customer_phone && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Teléfono:</span>
                        <p className="text-sm font-medium">
                          <a
                            href={`tel:${delivery.customer_phone}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {delivery.customer_phone}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Dirección:</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {formatAddress(delivery.address)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Información de Entrega
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Repartidor:</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {delivery.driver_name || 'Sin asignar'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Tiempo Estimado:</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {delivery.estimated_time || 'Por definir'}
                      </p>
                    </div>
                    {delivery.delivered_at && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Entregado:</span>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatDate(delivery.delivered_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {delivery.items && delivery.items.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Productos ({delivery.items.length})
                    </h3>
                    <div className="space-y-2">
                      {delivery.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.product_name}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Total
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ${delivery.total_amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {delivery.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notas
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {delivery.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
                {delivery.customer_phone && (
                  <Button
                    variant="primary"
                    icon={Phone}
                    onClick={() => window.location.href = `tel:${delivery.customer_phone}`}
                  >
                    Llamar Cliente
                  </Button>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DeliveryDetailsModal;