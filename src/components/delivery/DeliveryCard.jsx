import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Truck,
  MapPin,
  Phone,
  Clock,
  Package,
  User,
  Calendar,
  MoreVertical,
  Navigation,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const DeliveryCard = ({ 
  delivery, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onViewDetails,
  onViewRoute
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Status configuration with enhanced colors
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      variant: 'warning',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    assigned: {
      label: 'Asignado',
      variant: 'info',
      icon: User,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    in_transit: {
      label: 'En Tránsito',
      variant: 'info',
      icon: Truck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    delivered: {
      label: 'Entregado',
      variant: 'success',
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800'
    },
    failed: {
      label: 'Fallido',
      variant: 'danger',
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  };

  const status = statusConfig[delivery.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleAction = (action) => {
    setShowMenu(false);
    action();
  };

  const handleMenuToggle = (event) => {
    if (!showMenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.right - 160 + window.scrollX // 160px for menu width
      });
    }
    setShowMenu(!showMenu);
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return 'Sin dirección';
    return `${address.street || ''} ${address.number || ''}, ${address.neighborhood || ''}`;
  };

  // Calculate time since created
  const getTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:shadow-venezia-100/50 dark:hover:shadow-venezia-900/50 hover:border-venezia-300 dark:hover:border-venezia-700 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer">
      {/* Status color bar */}
      <div className={clsx(
        'absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5',
        delivery.status === 'pending' && 'bg-gradient-to-r from-amber-400 to-orange-500',
        delivery.status === 'assigned' && 'bg-gradient-to-r from-blue-400 to-blue-600',
        delivery.status === 'in_transit' && 'bg-gradient-to-r from-indigo-400 to-purple-600',
        delivery.status === 'delivered' && 'bg-gradient-to-r from-emerald-400 to-green-600',
        delivery.status === 'failed' && 'bg-gradient-to-r from-red-400 to-red-600'
      )} />
      
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                #{delivery.order_number || delivery.id}
              </h3>
              <Badge variant={status.variant} size="xs">
                <StatusIcon className="w-2.5 h-2.5 mr-1" />
                {status.label}
              </Badge>
              {delivery.priority && delivery.priority !== 'normal' && (
                <span className={clsx(
                  'px-1.5 py-0.5 text-xs font-medium rounded-full',
                  priorityColors[delivery.priority]
                )}>
                  {delivery.priority === 'urgent' ? 'Urgente' : 'Alta'}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Hace {getTimeAgo(delivery.created_at)}
            </p>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <Button
              ref={buttonRef}
              variant="ghost"
              size="xs"
              icon={MoreVertical}
              onClick={handleMenuToggle}
              className="text-gray-400 hover:text-venezia-600 dark:hover:text-venezia-400 p-1.5 hover:bg-venezia-50 dark:hover:bg-venezia-900/20 rounded-lg transition-all duration-200 hover:scale-110"
            />
            
            {showMenu && createPortal(
              <div 
                ref={menuRef} 
                className="fixed w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50 py-2 animate-in slide-in-from-top-2 duration-200"
                style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              >
                <button
                  onClick={() => handleAction(() => onViewDetails(delivery))}
                  className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-venezia-50 dark:hover:bg-venezia-900/20 hover:text-venezia-700 dark:hover:text-venezia-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                >
                  <Package className="w-4 h-4 text-purple-500" />
                  Ver Detalles
                </button>
                
                <button
                  onClick={() => handleAction(() => onViewRoute(delivery))}
                  className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-venezia-50 dark:hover:bg-venezia-900/20 hover:text-venezia-700 dark:hover:text-venezia-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                >
                  <Navigation className="w-4 h-4 text-blue-500" />
                  Ver Ruta
                </button>
                
                {delivery.status === 'pending' && (
                  <button
                    onClick={() => handleAction(() => onStatusChange(delivery, 'assigned'))}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    Asignar Repartidor
                  </button>
                )}
                
                {delivery.status === 'assigned' && (
                  <button
                    onClick={() => handleAction(() => onStatusChange(delivery, 'in_transit'))}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                  >
                    <Truck className="w-4 h-4 text-indigo-500" />
                    Iniciar Entrega
                  </button>
                )}
                
                {delivery.status === 'in_transit' && (
                  <button
                    onClick={() => handleAction(() => onStatusChange(delivery, 'delivered'))}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Marcar Entregado
                  </button>
                )}
                
                <div className="border-t border-gray-200/50 dark:border-gray-600/50 my-1" />
                
                <button
                  onClick={() => handleAction(() => onEdit(delivery))}
                  className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                >
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  Editar Notas
                </button>
                
                {delivery.status === 'pending' && (
                  <button
                    onClick={() => handleAction(() => onDelete(delivery.id))}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-3 transition-all duration-200 rounded-lg mx-1"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Cancelar
                  </button>
                )}
              </div>,
              document.body
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {delivery.customer_name}
            </span>
          </div>
          
          {delivery.customer_phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
              <a 
                href={`tel:${delivery.customer_phone}`}
                className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium transition-colors"
              >
                {delivery.customer_phone}
              </a>
            </div>
          )}
          
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {formatAddress(delivery.address)}
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Repartidor</p>
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {delivery.driver_name || 'Sin asignar'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estimado</p>
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {delivery.estimated_time || 'Por definir'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        {delivery.items && delivery.items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Productos ({delivery.items.length})
              </p>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {delivery.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.product_name}</span>
                  {item.price && (
                    <span className="text-gray-500">${item.price * item.quantity}</span>
                  )}
                </div>
              ))}
              {delivery.items.length > 2 && (
                <div className="text-xs text-gray-500 italic">
                  +{delivery.items.length - 2} productos más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="font-medium">Total</span>
          </div>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
            ${delivery.total_amount?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Notes */}
        {delivery.notes && (
          <div className="mt-3 flex gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {delivery.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryCard;