import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Package, Clock, DollarSign, TrendingDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../services/socketMock';

const AlertPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { socket, connected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial alerts
    fetchAlerts();

    if (socket && connected) {
      // Socket event listeners
      socket.on('alerts:current', (currentAlerts) => {
        setAlerts(currentAlerts);
        updateUnreadCount(currentAlerts);
      });

      socket.on('alerts:stock', handleNewAlerts);
      socket.on('alerts:expiry', handleNewAlerts);
      socket.on('alerts:cash', handleNewAlerts);
      socket.on('alerts:sales', handleNewAlerts);

      socket.on('alert:resolved', ({ id }) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        toast.success('Alerta resuelta');
      });

      socket.on('alert:dismissed', ({ id }) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      });

      return () => {
        socket.off('alerts:current');
        socket.off('alerts:stock');
        socket.off('alerts:expiry');
        socket.off('alerts:cash');
        socket.off('alerts:sales');
        socket.off('alert:resolved');
        socket.off('alert:dismissed');
      };
    }
  }, [socket, connected]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      
      // Check if response is ok
      if (!response.ok) {
        // Use mock data if server is down
        const mockAlerts = [
          {
            id: 1,
            type: 'info',
            severity: 'info',
            title: 'Sistema Operativo',
            message: 'Sistema funcionando en modo offline',
            timestamp: new Date().toISOString(),
            read: false
          }
        ];
        setAlerts(mockAlerts);
        updateUnreadCount(mockAlerts);
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (data.success) {
          setAlerts(data.data);
          updateUnreadCount(data.data);
        }
      } else {
        console.warn('Response is not JSON, using mock data');
        const mockAlerts = [];
        setAlerts(mockAlerts);
        updateUnreadCount(mockAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Set empty alerts on error
      setAlerts([]);
      setUnreadCount(0);
    }
  };

  const handleNewAlerts = (newAlerts) => {
    setAlerts(prev => {
      // Remove existing alerts with same IDs
      const filteredPrev = prev.filter(alert => 
        !newAlerts.find(newAlert => newAlert.id === alert.id)
      );
      // Add new alerts
      const updated = [...newAlerts, ...filteredPrev];
      updateUnreadCount(updated);
      
      // Show toast for critical alerts
      newAlerts.forEach(alert => {
        if (alert.severity === 'critical') {
          toast.error(alert.title);
        }
      });
      
      return updated;
    });
  };

  const updateUnreadCount = (alertsList) => {
    const unread = alertsList.filter(alert => !alert.read).length;
    setUnreadCount(unread);
  };

  const dismissAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.success('Alerta descartada');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Error al descartar alerta');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'stock':
        return <Package className="h-5 w-5" />;
      case 'expiry':
        return <Clock className="h-5 w-5" />;
      case 'cash':
        return <DollarSign className="h-5 w-5" />;
      case 'sales':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      {/* Alert Bell Icon */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Alert Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl z-50"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Alertas</h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-center py-12">
                      <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">No hay alertas activas</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getAlertIcon(alert.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <p className="text-sm mt-1 opacity-80">{alert.message}</p>
                              <p className="text-xs mt-2 opacity-60">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setAlerts([]);
                      toast.success('Todas las alertas descartadas');
                    }}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
                  >
                    Descartar todas
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AlertPanel;