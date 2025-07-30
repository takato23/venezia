import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  Clock,
  TrendingDown,
  X,
  Check,
  Eye,
  EyeOff,
  Settings,
  Calendar
} from 'lucide-react';
import { useApiCache } from '../../hooks/useApiCache';
import { useToast } from '../../hooks/useToast';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import clsx from 'clsx';

const AlertCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const { success } = useToast();

  // Fetch alerts from API
  const { data: alertsData, refetch } = useApiCache('/api/alerts');

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData.alerts || []);
      setUnreadCount(alertsData.unread_count || 0);
    }
  }, [alertsData]);

  // Check for new alerts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refetch]);

  const markAsRead = async (alertId) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      success('Alerta descartada');
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'stock_low':
        return Package;
      case 'expiration':
        return Clock;
      case 'sales_anomaly':
        return TrendingDown;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'info':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'stock') return alert.type === 'stock_low';
    if (filter === 'expiration') return alert.type === 'expiration';
    return true;
  });

  return (
    <>
      {/* Alert Bell Icon - Professional Design */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "notification-button",
            unreadCount > 0 && "has-unread",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          )}
          aria-label={`Alertas${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
          aria-expanded={isOpen}
          aria-controls="alert-panel"
        >
          <Bell className="header-action-icon" />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Alert Dropdown/Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Alert Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              id="alert-panel"
              className="fixed right-20 top-16 z-50 w-96 max-h-[calc(100vh-5rem)] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              role="dialog"
              aria-labelledby="alert-center-title"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 id="alert-center-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Centro de Alertas
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-venezia-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Cerrar panel de alertas"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'Todas' },
                    { value: 'unread', label: 'No leídas' },
                    { value: 'critical', label: 'Críticas' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'expiration', label: 'Vencimientos' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={clsx(
                        'px-3 py-1 text-sm rounded-full transition-colors',
                        filter === option.value
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alerts List */}
              <div className="overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-950">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-base">No hay alertas {filter !== 'all' ? 'en esta categoría' : ''}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAlerts.map(alert => {
                      const Icon = getAlertIcon(alert.type);
                      const colorClass = getAlertColor(alert.severity);
                      
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={clsx(
                            'p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer',
                            !alert.read && 'bg-blue-50 dark:bg-blue-900/20'
                          )}
                          onClick={() => !alert.read && markAsRead(alert.id)}
                        >
                          <div className="flex gap-3">
                            <div className={clsx('p-2 rounded-lg', colorClass)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                    {alert.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                    {alert.message}
                                  </p>
                                  {alert.action_url && (
                                    <Button
                                      size="sm"
                                      variant="link"
                                      className="mt-2 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = alert.action_url;
                                      }}
                                    >
                                      Ver detalles →
                                    </Button>
                                  )}
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissAlert(alert.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-venezia-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                  aria-label="Descartar alerta"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                                {!alert.read && (
                                  <Badge variant="info" size="sm">
                                    Nueva
                                  </Badge>
                                )}
                                {alert.severity === 'critical' && (
                                  <Badge variant="danger" size="sm">
                                    Crítica
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/settings#alerts';
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      alerts.filter(a => !a.read).forEach(a => markAsRead(a.id));
                      success('Todas las alertas marcadas como leídas');
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Marcar todas
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AlertCenter;