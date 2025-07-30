import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Eye,
  Printer,
  MessageSquare,
  Send,
  User,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const OnlineOrderManager = ({ orders = [], onUpdateOrder, onRefresh }) => {
  const { success, error, info } = useToast();
  
  // Estados
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh para nuevas órdenes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Notificación de nuevas órdenes
  useEffect(() => {
    const newOrders = orders.filter(o => 
      o.status === 'pending' && 
      new Date(o.created_at) > new Date(Date.now() - 60000)
    );
    
    if (newOrders.length > 0) {
      info('Nueva orden', `${newOrders.length} nueva(s) orden(es) recibida(s)`);
      playNotificationSound();
    }
  }, [orders]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGI0fPTgjMGHm7A7+OZURE');
      audio.play();
    } catch (err) {
      console.log('Could not play notification sound');
    }
  };

  // Estados de orden
  const orderStatuses = [
    { value: 'pending', label: 'Pendiente', color: 'yellow', icon: Clock },
    { value: 'confirmed', label: 'Confirmada', color: 'blue', icon: CheckCircle },
    { value: 'preparing', label: 'Preparando', color: 'orange', icon: Package },
    { value: 'ready', label: 'Lista', color: 'green', icon: CheckCircle },
    { value: 'delivering', label: 'En camino', color: 'purple', icon: Truck },
    { value: 'delivered', label: 'Entregada', color: 'green', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelada', color: 'red', icon: XCircle }
  ];

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // Cambiar estado de orden
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await onUpdateOrder(orderId, { status: newStatus });
      success('Estado actualizado', `La orden ahora está ${getStatusLabel(newStatus)}`);
      
      // Enviar notificación al cliente si es necesario
      if (['confirmed', 'ready', 'delivering'].includes(newStatus)) {
        sendCustomerNotification(orderId, newStatus);
      }
    } catch (err) {
      error('Error', 'No se pudo actualizar el estado');
    }
  };

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj?.label || status;
  };

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getStatusIcon = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj?.icon || AlertCircle;
  };

  // Enviar notificación al cliente
  const sendCustomerNotification = async (orderId, status) => {
    try {
      await fetch('/api/shop/orders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  // Enviar mensaje personalizado
  const sendCustomMessage = async () => {
    if (!message.trim() || !selectedOrder) return;
    
    try {
      await fetch('/api/shop/orders/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: selectedOrder.id, 
          message 
        })
      });
      
      success('Mensaje enviado', 'El cliente recibirá el mensaje por WhatsApp/Email');
      setMessage('');
      setShowMessageModal(false);
    } catch (err) {
      error('Error', 'No se pudo enviar el mensaje');
    }
  };

  // Imprimir orden
  const printOrder = (order) => {
    window.print(); // Simplificado, en producción usaría una librería de PDF
  };

  // Calcular tiempo transcurrido
  const getElapsedTime = (createdAt) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Filtros de estado */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas ({orders.length})
              </Button>
              {orderStatuses.map(status => {
                const count = orders.filter(o => o.status === status.value).length;
                if (count === 0) return null;
                
                return (
                  <Button
                    key={status.value}
                    variant={statusFilter === status.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status.value)}
                  >
                    {status.label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              icon={RefreshCw}
            >
              Actualizar
            </Button>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-600 dark:text-gray-400">Auto-actualizar</span>
            </label>
          </div>
        </div>
      </div>

      {/* Órdenes pendientes urgentes */}
      {filteredOrders.filter(o => o.status === 'pending' && new Date(o.created_at) < new Date(Date.now() - 900000)).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              {filteredOrders.filter(o => o.status === 'pending' && new Date(o.created_at) < new Date(Date.now() - 900000)).length} órdenes pendientes por más de 15 minutos
            </span>
          </div>
        </div>
      )}

      {/* Lista de órdenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
            onViewDetails={() => {
              setSelectedOrder(order);
              setShowOrderModal(true);
            }}
            onSendMessage={() => {
              setSelectedOrder(order);
              setShowMessageModal(true);
            }}
            onPrint={() => printOrder(order)}
            getElapsedTime={getElapsedTime}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getStatusLabel={getStatusLabel}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay órdenes {statusFilter !== 'all' ? getStatusLabel(statusFilter).toLowerCase() + 's' : ''}</p>
        </div>
      )}

      {/* Modal de detalles */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onStatusChange={handleStatusChange}
        onPrint={printOrder}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      {/* Modal de mensaje */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Enviar mensaje al cliente"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Cliente: {selectedOrder?.customer?.name}</p>
            <p>Teléfono: {selectedOrder?.customer?.phone}</p>
          </div>
          
          <Input
            label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={4}
            placeholder="Escribe tu mensaje aquí..."
          />
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMessageModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={sendCustomMessage}
              icon={Send}
              disabled={!message.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Componente OrderCard
const OrderCard = ({ 
  order, 
  onStatusChange, 
  onViewDetails, 
  onSendMessage, 
  onPrint,
  getElapsedTime,
  getStatusColor,
  getStatusIcon,
  getStatusLabel 
}) => {
  const StatusIcon = getStatusIcon(order.status);
  
  return (
    <div className={clsx(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4",
      order.status === 'pending' && new Date(order.created_at) < new Date(Date.now() - 900000) && "ring-2 ring-red-500"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Orden #{order.orderNumber || order.id}
            </h3>
            <Badge variant={getStatusColor(order.status)} size="sm">
              <StatusIcon className="w-3 h-3 mr-1" />
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Hace {getElapsedTime(order.created_at)}
          </p>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onPrint(order)}
            icon={Printer}
          />
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onSendMessage(order)}
            icon={MessageSquare}
          />
        </div>
      </div>

      {/* Cliente */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-white">{order.customer?.name}</span>
        </div>
        {order.customer?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{order.customer.phone}</span>
          </div>
        )}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-400">{order.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-t dark:border-gray-700 pt-3 mb-3">
        <div className="space-y-1 text-sm">
          {order.items?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {item.quantity}x {item.productName}
              </span>
              <span className="text-gray-900 dark:text-white">
                ${item.total?.toLocaleString()}
              </span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              +{order.items.length - 3} más...
            </p>
          )}
        </div>
      </div>

      {/* Total y acciones */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${order.total?.toLocaleString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            icon={Eye}
          >
            Ver
          </Button>
          
          {/* Acciones rápidas según estado */}
          {order.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStatusChange(order.id, 'confirmed')}
            >
              Confirmar
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStatusChange(order.id, 'preparing')}
            >
              Preparar
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStatusChange(order.id, 'ready')}
            >
              Listo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de detalles de orden
const OrderDetailModal = ({ 
  order, 
  isOpen, 
  onClose, 
  onStatusChange, 
  onPrint,
  getStatusColor,
  getStatusLabel 
}) => {
  if (!order) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Orden #${order.orderNumber || order.id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Estado y tiempo */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado actual</p>
            <Badge variant={getStatusColor(order.status)} size="lg">
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Creada</p>
            <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Información del cliente */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Nombre</p>
              <p className="font-medium">{order.customer?.name}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Teléfono</p>
              <p className="font-medium">{order.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium">{order.customer?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Método de pago</p>
              <p className="font-medium">{order.paymentMethod || 'Efectivo'}</p>
            </div>
          </div>
          
          {order.deliveryAddress && (
            <div className="mt-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Dirección de entrega</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
          )}
        </div>

        {/* Items del pedido */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Productos</h3>
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Producto</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Cant.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Precio</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.productName}</td>
                    <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right">${item.price?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">${item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-right font-medium">Total</td>
                  <td className="px-4 py-2 text-right font-bold text-lg">
                    ${order.total?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Notas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              {order.notes}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-between pt-4 border-t dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onPrint(order)}
            icon={Printer}
          >
            Imprimir
          </Button>
          
          <div className="flex gap-2">
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <>
                <Button
                  variant="danger"
                  onClick={() => onStatusChange(order.id, 'cancelled')}
                >
                  Cancelar orden
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const nextStatus = {
                      'pending': 'confirmed',
                      'confirmed': 'preparing',
                      'preparing': 'ready',
                      'ready': 'delivering',
                      'delivering': 'delivered'
                    }[order.status];
                    
                    if (nextStatus) {
                      onStatusChange(order.id, nextStatus);
                    }
                  }}
                >
                  Siguiente estado
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OnlineOrderManager;