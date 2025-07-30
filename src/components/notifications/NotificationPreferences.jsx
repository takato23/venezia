import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Volume2, VolumeX, 
  Mail, Smartphone, Clock, Save,
  ChevronLeft
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import toast from 'react-hot-toast';

const NotificationPreferences = ({ onClose }) => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState({
    email_enabled: false,
    push_enabled: true,
    sound_enabled: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    types: {}
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  
  // Notification categories
  const notificationCategories = [
    {
      title: 'Inventario',
      types: [
        { key: 'stock_alert', label: 'Alertas de stock', description: 'Stock bajo o agotado' },
        { key: 'expiration_warning', label: 'Vencimientos', description: 'Productos próximos a vencer' }
      ]
    },
    {
      title: 'Ventas',
      types: [
        { key: 'new_order', label: 'Nuevos pedidos', description: 'Cuando llega un pedido' },
        { key: 'order_ready', label: 'Pedidos listos', description: 'Pedidos listos para entregar' },
        { key: 'sales_milestone', label: 'Hitos de ventas', description: 'Metas y récords alcanzados' }
      ]
    },
    {
      title: 'Equipamiento',
      types: [
        { key: 'temperature_warning', label: 'Alertas de temperatura', description: 'Temperatura fuera de rango' },
        { key: 'temperature_critical', label: 'Temperatura crítica', description: 'Alertas críticas de temperatura' }
      ]
    },
    {
      title: 'Pagos',
      types: [
        { key: 'payment_success', label: 'Pagos exitosos', description: 'Confirmación de pagos' },
        { key: 'payment_failed', label: 'Pagos fallidos', description: 'Errores en el procesamiento' }
      ]
    },
    {
      title: 'Producción',
      types: [
        { key: 'batch_completed', label: 'Lotes completados', description: 'Finalización de producción' }
      ]
    }
  ];
  
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);
  
  const handleToggle = (key, value) => {
    const updated = { ...localPreferences, [key]: value };
    setLocalPreferences(updated);
    setHasChanges(true);
  };
  
  const handleTypeToggle = (typeKey, enabled) => {
    const updated = {
      ...localPreferences,
      types: {
        ...localPreferences.types,
        [typeKey]: enabled
      }
    };
    setLocalPreferences(updated);
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
      toast.success('Preferencias guardadas');
    } catch (error) {
      toast.error('Error al guardar las preferencias');
    }
  };
  
  const handleQuietHours = (start, end) => {
    const updated = {
      ...localPreferences,
      quiet_hours_start: start,
      quiet_hours_end: end
    };
    setLocalPreferences(updated);
    setHasChanges(true);
  };
  
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
        </div>
      </div>
      
      {/* General Settings */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {localPreferences.push_enabled ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900">Notificaciones Push</p>
              <p className="text-sm text-gray-500">Recibir notificaciones en tiempo real</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localPreferences.push_enabled}
              onChange={(e) => handleToggle('push_enabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {localPreferences.sound_enabled ? (
              <Volume2 className="w-5 h-5 text-blue-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900">Sonidos</p>
              <p className="text-sm text-gray-500">Reproducir sonido al recibir notificaciones</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localPreferences.sound_enabled}
              onChange={(e) => handleToggle('sound_enabled', e.target.checked)}
              disabled={!localPreferences.push_enabled}
            />
            <div className={`w-11 h-6 ${!localPreferences.push_enabled ? 'opacity-50' : ''} bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Notificaciones por Email</p>
              <p className="text-sm text-gray-500">Próximamente disponible</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={false}
              disabled
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
          </label>
        </div>
      </div>
      
      {/* Notification Types */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Tipos de Notificaciones</h4>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {notificationCategories.map(category => (
            <div key={category.title}>
              <h5 className="text-sm font-medium text-gray-700 mb-2">{category.title}</h5>
              <div className="space-y-2 ml-2">
                {category.types.map(type => (
                  <div key={type.key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localPreferences.types[type.key] !== false}
                        onChange={(e) => handleTypeToggle(type.key, e.target.checked)}
                        disabled={!localPreferences.push_enabled}
                      />
                      <div className={`w-9 h-5 ${!localPreferences.push_enabled ? 'opacity-50' : ''} bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600`}></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t"
        >
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationPreferences;