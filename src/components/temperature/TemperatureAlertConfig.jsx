import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import { useApiCache } from '../../hooks/useApiCache';
import { useTemperatureAlerts } from '../../hooks/useTemperatureData';
import clsx from 'clsx';

const TemperatureAlertConfig = ({ onClose, onSave }) => {
  const [alertConfig, setAlertConfig] = useState({
    enabled: true,
    critical_temp_deviation: 3,
    warning_temp_deviation: 2,
    offline_threshold_minutes: 30,
    notification_cooldown_minutes: 60,
    notification_methods: {
      app: true,
      email: false,
      sms: false,
      whatsapp: false
    },
    recipients: []
  });

  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    phone: '',
    methods: {
      email: true,
      sms: false,
      whatsapp: false
    }
  });

  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const { success, error } = useToast();

  // Fetch existing config using simulated service
  const { data: configData, updateConfig } = useTemperatureAlerts();

  useEffect(() => {
    if (configData) {
      setAlertConfig(configData);
    }
  }, [configData]);

  const handleAddRecipient = () => {
    if (!newRecipient.name || (!newRecipient.email && !newRecipient.phone)) {
      error('Error', 'Completa nombre y al menos un método de contacto');
      return;
    }

    setAlertConfig({
      ...alertConfig,
      recipients: [...alertConfig.recipients, { ...newRecipient, id: Date.now() }]
    });

    setNewRecipient({
      name: '',
      email: '',
      phone: '',
      methods: { email: true, sms: false, whatsapp: false }
    });
    setIsAddingRecipient(false);
    success('Destinatario agregado');
  };

  const handleRemoveRecipient = (recipientId) => {
    setAlertConfig({
      ...alertConfig,
      recipients: alertConfig.recipients.filter(r => r.id !== recipientId)
    });
  };

  const handleSaveConfig = async () => {
    try {
      const result = await updateConfig(alertConfig);
      
      if (result.success) {
        success('Configuración guardada', 'Las alertas se han actualizado correctamente');
        onSave();
      } else {
        error('Error', 'No se pudo guardar la configuración');
      }
    } catch (err) {
      error('Error', 'No se pudo guardar la configuración');
    }
  };

  const alertTypes = [
    {
      id: 'critical',
      title: 'Temperatura Crítica',
      description: 'Se activa cuando la temperatura supera los límites críticos',
      icon: AlertTriangle,
      color: 'red',
      configKey: 'critical_temp_deviation'
    },
    {
      id: 'warning',
      title: 'Temperatura de Advertencia',
      description: 'Se activa cuando la temperatura se acerca a los límites',
      icon: AlertTriangle,
      color: 'yellow',
      configKey: 'warning_temp_deviation'
    },
    {
      id: 'offline',
      title: 'Dispositivo Sin Conexión',
      description: 'Se activa cuando un dispositivo deja de reportar',
      icon: Clock,
      color: 'gray',
      configKey: 'offline_threshold_minutes'
    }
  ];

  const notificationMethods = [
    { id: 'app', label: 'Notificación en App', icon: Bell },
    { id: 'email', label: 'Correo Electrónico', icon: Mail },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
  ];

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configuración de Alertas
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable/Disable Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Sistema de Alertas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Activa o desactiva todas las alertas de temperatura
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Alert Types Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tipos de Alerta
            </h3>
            
            <div className="space-y-4">
              {alertTypes.map(alert => (
                <div
                  key={alert.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'p-2 rounded-lg',
                      alert.color === 'red' && 'bg-red-100 dark:bg-red-900/30',
                      alert.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                      alert.color === 'gray' && 'bg-gray-100 dark:bg-gray-900/30'
                    )}>
                      <alert.icon className={clsx(
                        'h-5 w-5',
                        alert.color === 'red' && 'text-red-600 dark:text-red-400',
                        alert.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                        alert.color === 'gray' && 'text-gray-600 dark:text-gray-400'
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {alert.description}
                      </p>
                      
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {alert.id === 'offline' ? 'Tiempo sin conexión (minutos)' : 'Desviación de temperatura (°C)'}
                        </label>
                        <Input
                          type="number"
                          value={alertConfig[alert.configKey]}
                          onChange={(e) => setAlertConfig({
                            ...alertConfig,
                            [alert.configKey]: parseFloat(e.target.value)
                          })}
                          className="w-32 mt-1"
                          min="0"
                          step={alert.id === 'offline' ? '5' : '0.5'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Methods */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Métodos de Notificación
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {notificationMethods.map(method => (
                <label
                  key={method.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    alertConfig.notification_methods[method.id]
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={alertConfig.notification_methods[method.id]}
                    onChange={(e) => setAlertConfig({
                      ...alertConfig,
                      notification_methods: {
                        ...alertConfig.notification_methods,
                        [method.id]: e.target.checked
                      }
                    })}
                    className="sr-only"
                  />
                  <method.icon className={clsx(
                    'h-5 w-5',
                    alertConfig.notification_methods[method.id]
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                  )} />
                  <span className={clsx(
                    'text-sm font-medium',
                    alertConfig.notification_methods[method.id]
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Cooldown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiempo entre notificaciones (minutos)
            </label>
            <Input
              type="number"
              value={alertConfig.notification_cooldown_minutes}
              onChange={(e) => setAlertConfig({
                ...alertConfig,
                notification_cooldown_minutes: parseInt(e.target.value)
              })}
              className="w-48"
              min="5"
              step="5"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tiempo mínimo antes de repetir una alerta del mismo tipo
            </p>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Destinatarios
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingRecipient(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Destinatario
              </Button>
            </div>

            {/* Recipients List */}
            <div className="space-y-3">
              {alertConfig.recipients.map(recipient => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {recipient.name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {recipient.email && <span>{recipient.email}</span>}
                      {recipient.phone && <span>{recipient.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {Object.entries(recipient.methods).map(([method, enabled]) => 
                        enabled && (
                          <Badge key={method} variant="blue" size="sm">
                            {method}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {alertConfig.recipients.length === 0 && !isAddingRecipient && (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay destinatarios configurados
                  </p>
                </div>
              )}
            </div>

            {/* Add Recipient Form */}
            {isAddingRecipient && (
              <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Nuevo Destinatario
                </h4>
                
                <Input
                  placeholder="Nombre"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                />
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                />
                
                <Input
                  type="tel"
                  placeholder="Teléfono (con código de país)"
                  value={newRecipient.phone}
                  onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                />
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRecipient.methods.email}
                      onChange={(e) => setNewRecipient({
                        ...newRecipient,
                        methods: { ...newRecipient.methods, email: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRecipient.methods.sms}
                      onChange={(e) => setNewRecipient({
                        ...newRecipient,
                        methods: { ...newRecipient.methods, sms: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">SMS</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRecipient.methods.whatsapp}
                      onChange={(e) => setNewRecipient({
                        ...newRecipient,
                        methods: { ...newRecipient.methods, whatsapp: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">WhatsApp</span>
                  </label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddingRecipient(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddRecipient}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveConfig}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TemperatureAlertConfig;