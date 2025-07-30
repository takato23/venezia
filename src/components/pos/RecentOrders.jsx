import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  RefreshCw, 
  User,
  Package
} from 'lucide-react';
import clsx from 'clsx';

const RecentOrders = ({ 
  orders = [], 
  onRepeatOrder,
  maxOrders = 5 
}) => {
  // Solo mostrar las últimas órdenes
  const recentOrders = orders.slice(0, maxOrders);

  if (recentOrders.length === 0) {
    return null;
  }

  const formatTime = (date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diff = now - orderDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Recién';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return orderDate.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Últimas Ventas
        </h3>
      </div>

      <div className="space-y-2">
        {recentOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg',
              'bg-gray-50 dark:bg-gray-900/50',
              'hover:bg-gray-100 dark:hover:bg-gray-900/70',
              'transition-colors duration-150 group'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {order.customer_name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="truncate">{order.customer_name}</span>
                  </div>
                )}
                <span className="text-xs text-gray-400">
                  {formatTime(order.created_at)}
                </span>
              </div>
              
              <div className="mt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Package className="h-3 w-3" />
                  <span>
                    {order.items_count} items · ${order.total}
                  </span>
                </div>
                {/* Preview de items */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                  {order.items_preview}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRepeatOrder(order)}
              className={clsx(
                'p-2 rounded-lg',
                'bg-blue-100 dark:bg-blue-900/30',
                'text-blue-600 dark:text-blue-400',
                'opacity-0 group-hover:opacity-100',
                'transition-all duration-200'
              )}
              title="Repetir pedido"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        Click en <RefreshCw className="h-3 w-3 inline" /> para repetir pedido
      </div>
    </div>
  );
};

export default RecentOrders;