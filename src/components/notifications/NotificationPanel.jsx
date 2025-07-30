import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Settings, CheckCheck, Filter, 
  Package, ShoppingBag, AlertTriangle, 
  DollarSign, Beaker, Calendar, System 
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import NotificationPreferences from './NotificationPreferences';

const NotificationPanel = ({ onClose }) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    filterNotifications
  } = useNotifications();
  
  const filteredNotifications = filterNotifications(filterType);
  
  const notificationTypes = [
    { value: 'all', label: 'Todas', icon: null },
    { value: 'stock_alert', label: 'Stock', icon: Package },
    { value: 'new_order', label: 'Pedidos', icon: ShoppingBag },
    { value: 'temperature_warning', label: 'Temperatura', icon: AlertTriangle },
    { value: 'payment_success', label: 'Pagos', icon: DollarSign },
    { value: 'batch_completed', label: 'Producción', icon: Beaker },
    { value: 'expiration_warning', label: 'Vencimiento', icon: Calendar }
  ];
  
  const getNotificationIcon = (type) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.icon || null;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Preferencias"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="px-2 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {notificationTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all
                flex items-center gap-1.5
                ${filterType === type.value
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {type.icon && <type.icon className="w-3 h-3" />}
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      {showPreferences ? (
        <NotificationPreferences onClose={() => setShowPreferences(false)} />
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Filter className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  icon={getNotificationIcon(notification.type)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      {!showPreferences && filteredNotifications.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={() => {/* Navigate to full notifications page */}}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationPanel;