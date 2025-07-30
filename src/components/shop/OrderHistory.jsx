import React, { useState, useEffect } from 'react';
import { 
  Clock,
  Package,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Star,
  ChevronRight,
  Receipt,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Search,
  FileText,
  Repeat
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import OrderTracking from './OrderTracking';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const OrderHistory = ({ customerId }) => {
  const { success, error: showError, info } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Estadísticas
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrder: 0,
    favoriteProduct: null,
    lastOrderDays: 0
  });

  useEffect(() => {
    loadOrderHistory();
  }, [customerId]);

  const loadOrderHistory = async () => {
    try {
      const response = await fetch(`/api/shop/customers/${customerId}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        calculateStats(data.orders || []);
      }
    } catch (err) {
      showError('Error', 'No se pudo cargar el historial de pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas del cliente
  const calculateStats = (orderList) => {
    if (orderList.length === 0) return;

    const completedOrders = orderList.filter(o => 
      o.status === 'delivered' || o.status === 'completed'
    );

    const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrder = totalSpent / (completedOrders.length || 1);

    // Producto favorito
    const productCount = {};
    orderList.forEach(order => {
      order.items?.forEach(item => {
        productCount[item.productName] = (productCount[item.productName] || 0) + item.quantity;
      });
    });

    const favoriteProduct = Object.entries(productCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Días desde última orden
    const lastOrder = orderList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const lastOrderDays = lastOrder 
      ? Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24))
      : null;

    setStats({
      totalOrders: orderList.length,
      totalSpent,
      averageOrder,
      favoriteProduct,
      lastOrderDays
    });
  };

  // Repetir pedido
  const repeatOrder = async (order) => {
    try {
      const response = await fetch('/api/shop/orders/repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          items: order.items 
        })
      });

      if (response.ok) {
        const data = await response.json();
        success('Pedido agregado al carrito', 'Los productos se agregaron a tu carrito');
        
        // Redirigir al carrito o checkout
        if (window.location.pathname.includes('webshop')) {
          window.location.href = '/webshop/cart';
        }
      }
    } catch (err) {
      showError('Error', 'No se pudo repetir el pedido');
    }
  };

  // Descargar factura
  const downloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}/invoice`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        info('Factura descargada', 'La factura se descargó correctamente');
      }
    } catch (err) {
      showError('Error', 'No se pudo descargar la factura');
    }
  };

  // Filtrar y ordenar pedidos
  const filteredOrders = orders
    .filter(order => {
      // Filtro por búsqueda
      const matchesSearch = !searchTerm || 
        order.id.toString().includes(searchTerm) ||
        order.items?.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Filtro por fecha
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = orderDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = orderDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            matchesDate = orderDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount_desc':
          return (b.total || 0) - (a.total || 0);
        case 'amount_asc':
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

  const statusColors = {
    pending: 'yellow',
    confirmed: 'blue',
    preparing: 'orange',
    ready: 'green',
    delivering: 'blue',
    delivered: 'green',
    cancelled: 'red'
  };

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    delivering: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-venezia-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas del cliente */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalOrders}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalSpent.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pedido Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.averageOrder.toFixed(2)}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Producto Favorito</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {stats.favoriteProduct || 'N/A'}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número de orden o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="delivered">Entregados</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Cancelados</option>
          </Select>

          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="date_desc">Más recientes</option>
            <option value="date_asc">Más antiguos</option>
            <option value="amount_desc">Mayor monto</option>
            <option value="amount_asc">Menor monto</option>
          </Select>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron pedidos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Intenta ajustar los filtros'
              : 'Aún no has realizado ningún pedido'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Orden #{order.id}
                    </h3>
                    <Badge 
                      variant={statusColors[order.status] || 'default'}
                      size="sm"
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${order.total?.toFixed(2)}
                </p>
              </div>

              {/* Items del pedido */}
              <div className="border-t dark:border-gray-700 pt-4 mb-4">
                <div className="space-y-2">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      +{order.items.length - 3} productos más
                    </p>
                  )}
                </div>
              </div>

              {/* Rating si existe */}
              {order.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={clsx(
                          "w-4 h-4",
                          star <= order.rating
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300 dark:text-gray-600"
                        )}
                      />
                    ))}
                  </div>
                  {order.ratingComment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{order.ratingComment}"
                    </p>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetailsModal(true);
                  }}
                  icon={FileText}
                >
                  Ver detalles
                </Button>
                
                {(order.status === 'pending' || order.status === 'confirmed' || 
                  order.status === 'preparing' || order.status === 'delivering') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowTrackingModal(true);
                    }}
                    icon={Package}
                  >
                    Seguir pedido
                  </Button>
                )}
                
                {order.status === 'delivered' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => repeatOrder(order)}
                      icon={Repeat}
                    >
                      Repetir pedido
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(order.id)}
                      icon={Download}
                    >
                      Factura
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de tracking */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedOrder(null);
        }}
        title="Seguimiento de Pedido"
        size="lg"
      >
        {selectedOrder && (
          <OrderTracking 
            orderId={selectedOrder.id}
            onClose={() => setShowTrackingModal(false)}
          />
        )}
      </Modal>

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        title={`Detalles de Orden #${selectedOrder?.id}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                <Badge variant={statusColors[selectedOrder.status] || 'default'}>
                  {statusLabels[selectedOrder.status] || selectedOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fecha</p>
                <p className="font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-2">Productos</h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">
                  ${selectedOrder.total?.toFixed(2)}
                </span>
              </div>
            </div>

            {selectedOrder.deliveryAddress && (
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-2">Dirección de entrega</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrder.deliveryAddress}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;