import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ShoppingBag,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Package,
  MessageSquare
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useApiCache } from '../../hooks/useApiCache';
import LoadingSpinner from '../ui/LoadingSpinner';
import clsx from 'clsx';

const CustomerDetail = ({ customer, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch customer purchase history
  const { 
    data: purchaseHistory, 
    loading: loadingHistory 
  } = useApiCache(`/api/customers/${customer.id}/purchases`);

  // Calculate customer metrics
  const metrics = {
    totalSpent: customer.total_spent || 0,
    totalOrders: customer.total_orders || 0,
    avgOrderValue: customer.total_orders ? (customer.total_spent / customer.total_orders) : 0,
    lastOrderDays: customer.last_order_date 
      ? Math.floor((new Date() - new Date(customer.last_order_date)) / (1000 * 60 * 60 * 24))
      : null,
    memberSince: customer.created_at 
      ? Math.floor((new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24))
      : 0
  };

  const getSegmentInfo = (segment) => {
    const segments = {
      vip: { label: 'VIP', color: 'purple', icon: Star },
      frequent: { label: 'Frecuente', color: 'blue', icon: TrendingUp },
      regular: { label: 'Regular', color: 'green', icon: ShoppingBag },
      new: { label: 'Nuevo', color: 'yellow', icon: Clock },
      inactive: { label: 'Inactivo', color: 'gray', icon: Clock }
    };
    return segments[segment] || segments.new;
  };

  const segmentInfo = getSegmentInfo(customer.segment);

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {customer.name}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={segmentInfo.color} size="sm">
                    <segmentInfo.icon className="h-3 w-3 mr-1" />
                    {segmentInfo.label}
                  </Badge>
                  <Badge 
                    variant={customer.status === 'active' ? 'success' : 'gray'} 
                    size="sm"
                  >
                    {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'purchases', label: 'Historial de Compras' },
              { id: 'communication', label: 'Comunicación' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${metrics.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total gastado
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                    <span className="text-xs text-gray-500">Pedidos</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.totalOrders}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de pedidos
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    <span className="text-xs text-gray-500">Promedio</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${Math.round(metrics.avgOrderValue).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Ticket promedio
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-xs text-gray-500">Actividad</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.lastOrderDays !== null ? `${metrics.lastOrderDays}d` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Desde última compra
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Información de Contacto
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.email}
                        </div>
                      </div>
                    </div>

                    {customer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Teléfono</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Dirección</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.address}
                          </div>
                        </div>
                      </div>
                    )}

                    {customer.birth_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de nacimiento</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(customer.birth_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Información Adicional
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Cliente desde</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(customer.created_at).toLocaleDateString()} 
                        ({metrics.memberSince} días)
                      </div>
                    </div>

                    {customer.preferences && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Preferencias</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.preferences}
                        </div>
                      </div>
                    )}

                    {customer.tags && customer.tags.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Etiquetas</div>
                        <div className="flex flex-wrap gap-2">
                          {customer.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {customer.notes && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Notas</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : purchaseHistory && purchaseHistory.length > 0 ? (
                <div className="space-y-4">
                  {purchaseHistory.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Pedido #{purchase.order_number}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(purchase.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${purchase.total.toLocaleString()}
                          </div>
                          <Badge 
                            variant={purchase.status === 'completed' ? 'success' : 'warning'} 
                            size="sm"
                          >
                            {purchase.status === 'completed' ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                      
                      {purchase.items && purchase.items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {purchase.items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                              {item.quantity}x {item.product_name} - ${item.subtotal}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay historial de compras
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Historial de Comunicaciones
                </h3>
                <Button variant="primary" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nueva Comunicación
                </Button>
              </div>
              
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No hay comunicaciones registradas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDetail;