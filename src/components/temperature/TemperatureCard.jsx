import React from 'react';
import { 
  Thermometer, 
  AlertTriangle, 
  CheckCircle,
  AlertCircle,
  Snowflake,
  Zap,
  Battery
} from 'lucide-react';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const TemperatureCard = ({ device, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'alert':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'offline':
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'alert':
        return AlertTriangle;
      case 'offline':
        return Zap;
      default:
        return Thermometer;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return { variant: 'success', label: 'Normal' };
      case 'warning':
        return { variant: 'warning', label: 'Advertencia' };
      case 'alert':
        return { variant: 'danger', label: 'Alerta' };
      case 'offline':
        return { variant: 'gray', label: 'Sin conexión' };
      default:
        return { variant: 'gray', label: 'Desconocido' };
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'freezer':
        return Snowflake;
      case 'fridge':
        return Thermometer;
      default:
        return Thermometer;
    }
  };

  const StatusIcon = getStatusIcon(device.status);
  const DeviceIcon = getDeviceIcon(device.type);
  const statusBadge = getStatusBadge(device.status);

  const isOutOfRange = device.status === 'alert' || 
    (device.current_temp < device.min_temp || device.current_temp > device.max_temp);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border-2 cursor-pointer transition-all',
        getStatusColor(device.status),
        isSelected && 'ring-2 ring-blue-500 dark:ring-blue-400',
        'hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'p-2 rounded-lg',
            device.status === 'normal' && 'bg-green-100 dark:bg-green-900/30',
            device.status === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30',
            device.status === 'alert' && 'bg-red-100 dark:bg-red-900/30',
            device.status === 'offline' && 'bg-gray-100 dark:bg-gray-900/30'
          )}>
            <DeviceIcon className={clsx(
              'h-5 w-5',
              device.status === 'normal' && 'text-green-600 dark:text-green-400',
              device.status === 'warning' && 'text-yellow-600 dark:text-yellow-400',
              device.status === 'alert' && 'text-red-600 dark:text-red-400',
              device.status === 'offline' && 'text-gray-600 dark:text-gray-400'
            )} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {device.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {device.location}
            </p>
          </div>
        </div>
        
        <Badge variant={statusBadge.variant} size="sm">
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusBadge.label}
        </Badge>
      </div>

      {device.status !== 'offline' ? (
        <>
          {/* Temperature Display */}
          <div className="mb-3">
            <div className={clsx(
              'text-3xl font-bold',
              isOutOfRange 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-900 dark:text-white'
            )}>
              {device.current_temp}°C
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Rango: {device.min_temp}°C - {device.max_temp}°C
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                Δ {device.temp_change > 0 ? '+' : ''}{device.temp_change}°C/h
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Battery className="h-3 w-3 text-gray-400" />
              <span className={clsx(
                'text-gray-600 dark:text-gray-300',
                device.battery_level < 20 && 'text-red-600 dark:text-red-400'
              )}>
                {device.battery_level}%
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sin conexión desde hace {device.offline_duration}
          </p>
        </div>
      )}

      {/* Alert Message */}
      {device.alert_message && (
        <div className={clsx(
          'mt-3 p-2 rounded text-xs',
          device.status === 'alert' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          device.status === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        )}>
          {device.alert_message}
        </div>
      )}
    </div>
  );
};

export default TemperatureCard;