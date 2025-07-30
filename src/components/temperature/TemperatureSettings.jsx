import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus,
  Trash2,
  Thermometer,
  MapPin,
  Snowflake,
  Settings
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useApiCache } from '../../hooks/useApiCache';
import { useTemperatureDevices } from '../../hooks/useTemperatureData';

const TemperatureSettings = ({ onClose, onSave }) => {
  const [devices, setDevices] = useState([]);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  
  const { success, error } = useToast();
  
  // Fetch existing devices using simulated service
  const { data: devicesData, updateDevices: updateDevicesService } = useTemperatureDevices();
  
  useEffect(() => {
    if (devicesData?.devices) {
      setDevices(devicesData.devices);
    }
  }, [devicesData]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'freezer',
    location: '',
    min_temp: -25,
    max_temp: -18,
    alert_threshold: 2,
    sensor_id: '',
    notes: ''
  });

  const deviceTypes = [
    { value: 'freezer', label: 'Congelador', defaultMin: -25, defaultMax: -18 },
    { value: 'fridge', label: 'Heladera', defaultMin: 2, defaultMax: 8 },
    { value: 'display', label: 'Vitrina', defaultMin: -5, defaultMax: -2 },
    { value: 'storage', label: 'Almacén frío', defaultMin: 0, defaultMax: 10 }
  ];

  const handleAddDevice = () => {
    setIsAddingDevice(true);
    setEditingDevice(null);
    setFormData({
      name: '',
      type: 'freezer',
      location: '',
      min_temp: -25,
      max_temp: -18,
      alert_threshold: 2,
      sensor_id: '',
      notes: ''
    });
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setIsAddingDevice(true);
    setFormData({
      name: device.name,
      type: device.type,
      location: device.location,
      min_temp: device.min_temp,
      max_temp: device.max_temp,
      alert_threshold: device.alert_threshold || 2,
      sensor_id: device.sensor_id || '',
      notes: device.notes || ''
    });
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este dispositivo?')) return;
    
    try {
      // API call to delete device
      setDevices(devices.filter(d => d.id !== deviceId));
      success('Dispositivo eliminado');
    } catch (err) {
      error('Error', 'No se pudo eliminar el dispositivo');
    }
  };

  const handleSaveDevice = async () => {
    // Validation
    if (!formData.name || !formData.location || !formData.sensor_id) {
      error('Error', 'Completa todos los campos requeridos');
      return;
    }

    try {
      if (editingDevice) {
        // Update existing device
        setDevices(devices.map(d => 
          d.id === editingDevice.id 
            ? { ...d, ...formData }
            : d
        ));
        success('Dispositivo actualizado');
      } else {
        // Add new device
        const newDevice = {
          id: Date.now(),
          ...formData,
          status: 'normal',
          current_temp: (formData.min_temp + formData.max_temp) / 2,
          battery_level: 100,
          last_reading: new Date().toISOString()
        };
        setDevices([...devices, newDevice]);
        success('Dispositivo agregado');
      }
      
      setIsAddingDevice(false);
      setEditingDevice(null);
    } catch (err) {
      error('Error', 'No se pudo guardar el dispositivo');
    }
  };

  const handleTypeChange = (type) => {
    const deviceType = deviceTypes.find(dt => dt.value === type);
    setFormData({
      ...formData,
      type,
      min_temp: deviceType.defaultMin,
      max_temp: deviceType.defaultMax
    });
  };

  const handleSaveAll = async () => {
    try {
      // Save all devices using the service
      const result = await updateDevicesService(devices);
      
      if (result.success) {
        onSave();
      } else {
        error('Error', 'No se pudieron guardar los cambios');
      }
    } catch (err) {
      error('Error', 'No se pudieron guardar los cambios');
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configuración de Dispositivos
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
        <div className="p-6">
          {!isAddingDevice ? (
            <>
              {/* Device List */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dispositivos Configurados
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddDevice}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Dispositivo
                </Button>
              </div>

              <div className="space-y-3">
                {devices.map(device => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                        <Thermometer className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {device.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {device.location}
                          </span>
                          <span>•</span>
                          <span>
                            {device.min_temp}°C a {device.max_temp}°C
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {deviceTypes.find(dt => dt.value === device.type)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditDevice(device)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {devices.length === 0 && (
                  <div className="text-center py-8">
                    <Thermometer className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay dispositivos configurados
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Add/Edit Device Form */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingDevice ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del dispositivo *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Congelador Principal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de dispositivo
                    </label>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      {deviceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ubicación *
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ej: Sala de producción"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID del Sensor *
                    </label>
                    <Input
                      value={formData.sensor_id}
                      onChange={(e) => setFormData({ ...formData, sensor_id: e.target.value })}
                      placeholder="Ej: SENS-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temperatura mínima (°C)
                    </label>
                    <Input
                      type="number"
                      value={formData.min_temp}
                      onChange={(e) => setFormData({ ...formData, min_temp: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temperatura máxima (°C)
                    </label>
                    <Input
                      type="number"
                      value={formData.max_temp}
                      onChange={(e) => setFormData({ ...formData, max_temp: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Umbral de alerta (°C)
                    </label>
                    <Input
                      type="number"
                      value={formData.alert_threshold}
                      onChange={(e) => setFormData({ ...formData, alert_threshold: parseFloat(e.target.value) })}
                      min="0.5"
                      step="0.5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Margen antes de activar alerta
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Información adicional sobre el dispositivo..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsAddingDevice(false);
                      setEditingDevice(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveDevice}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingDevice ? 'Actualizar' : 'Agregar'} Dispositivo
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isAddingDevice && (
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
                onClick={handleSaveAll}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TemperatureSettings;