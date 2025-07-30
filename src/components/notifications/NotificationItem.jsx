import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertCircle, AlertTriangle, Info, CheckCircle,
  Package, ShoppingBag, Thermometer, DollarSign,
  Beaker, Calendar, Bell
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationItem = ({ notification, icon }) => {
  const { markAsRead } = useNotifications();
  const isUnread = !notification.read_at;
  
  // Priority-based styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50 hover:bg-red-100',
          border: 'border-red-200',
          icon: 'text-red-600',
          dot: 'bg-red-500'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 hover:bg-orange-100',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          dot: 'bg-orange-500'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          dot: 'bg-blue-500'
        };
      case 'low':
      default:
        return {
          bg: 'bg-gray-50 hover:bg-gray-100',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          dot: 'bg-gray-500'
        };
    }
  };
  
  const styles = getPriorityStyles(notification.priority);
  
  // Get appropriate icon
  const getIcon = () => {
    if (icon) return icon;
    
    // Fallback icons based on priority
    switch (notification.priority) {
      case 'critical':
        return AlertCircle;
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Info;
      case 'low':
      default:
        return Bell;
    }
  };
  
  const Icon = getIcon();
  
  const handleClick = () => {
    if (isUnread) {
      markAsRead(notification.id);
    }
    
    // Handle notification click action based on type
    handleNotificationAction(notification);
  };
  
  const handleNotificationAction = (notification) => {
    // Navigate or perform action based on notification type and data
    switch (notification.type) {
      case 'new_order':
        if (notification.data?.order_id) {
          // Navigate to order details
          window.location.href = `/orders/${notification.data.order_id}`;
        }
        break;
      case 'low_stock':
      case 'out_of_stock':
        if (notification.data?.product_id) {
          // Navigate to product inventory
          window.location.href = `/inventory/products/${notification.data.product_id}`;
        }
        break;
      case 'temperature_warning':
      case 'temperature_critical':
        // Navigate to temperature monitoring
        window.location.href = '/monitoring/temperature';
        break;
      case 'payment_success':
      case 'payment_failed':
        if (notification.data?.order_id) {
          // Navigate to order payments
          window.location.href = `/orders/${notification.data.order_id}/payment`;
        }
        break;
      default:
        // Default action - could open a modal with more details
        console.log('Notification clicked:', notification);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ x: 5 }}
      className={`
        relative p-4 cursor-pointer transition-all duration-200
        ${isUnread ? styles.bg : 'hover:bg-gray-50'}
        ${isUnread ? styles.border : ''}
        ${isUnread ? 'border-l-4' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium text-gray-900 ${isUnread ? 'font-semibold' : ''}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: es
                })}
              </p>
            </div>
            
            {/* Unread indicator */}
            {isUnread && (
              <div className={`w-2 h-2 rounded-full ${styles.dot} flex-shrink-0 mt-1.5`} />
            )}
          </div>
          
          {/* Additional data */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {notification.data.amount && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ${notification.data.amount.toLocaleString('es-AR')}
                </span>
              )}
              {notification.data.order_number && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Orden #{notification.data.order_number}
                </span>
              )}
              {notification.data.temperature && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  {notification.data.temperature}°C
                </span>
              )}
              {notification.data.quantity && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  {notification.data.quantity} unidades
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;