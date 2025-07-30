import React, { useState, useEffect, useMemo } from 'react';
import { 
  Thermometer, 
  AlertTriangle, 
  CheckCircle,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Bell,
  Settings,
  Download,
  RefreshCw,
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { format, subHours, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import { useTemperatureData, useTemperatureHistory } from '../hooks/useTemperatureData';
import { alertService } from '../services/alertService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import TemperatureCard from '../components/temperature/TemperatureCard';
import TemperatureSettings from '../components/temperature/TemperatureSettings';
import TemperatureAlertConfig from '../components/temperature/TemperatureAlertConfig';
import clsx from 'clsx';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TemperaturePage = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { success, error, warning } = useToast();

  // Fetch temperature data using simulated service
  const { 
    data: temperatureData, 
    loading, 
    refetch 
  } = useTemperatureData();

  const { 
    data: historyData,
    loading: loadingHistory
  } = useTemperatureHistory(timeRange);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Check for temperature alerts
  useEffect(() => {
    if (!temperatureData?.devices) return;

    temperatureData.devices.forEach(device => {
      if (device.status === 'alert') {
        // Generate alert through our alert service
        alertService.notifyListeners({
          id: `temp_alert_${device.id}_${Date.now()}`,
          type: 'temperature',
          severity: 'critical',
          title: `Alerta de Temperatura: ${device.name}`,
          message: `Temperatura fuera de rango: ${device.current_temp}°C (Rango: ${device.min_temp}°C - ${device.max_temp}°C)`,
          data: {
            device_id: device.id,
            device_name: device.name,
            current_temp: device.current_temp,
            min_temp: device.min_temp,
            max_temp: device.max_temp
          },
          created_at: new Date().toISOString(),
          read: false
        });
      }
    });
  }, [temperatureData]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    if (!temperatureData?.devices) return null;

    const devices = temperatureData.devices;
    const totalDevices = devices.length;
    const alertDevices = devices.filter(d => d.status === 'alert').length;
    const warningDevices = devices.filter(d => d.status === 'warning').length;
    const normalDevices = devices.filter(d => d.status === 'normal').length;
    const offlineDevices = devices.filter(d => d.status === 'offline').length;

    const avgTemp = devices
      .filter(d => d.status !== 'offline')
      .reduce((sum, d) => sum + d.current_temp, 0) / (totalDevices - offlineDevices);

    return {
      total: totalDevices,
      alert: alertDevices,
      warning: warningDevices,
      normal: normalDevices,
      offline: offlineDevices,
      avgTemp: avgTemp || 0
    };
  }, [temperatureData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!historyData || !selectedDevice) return null;

    const deviceHistory = historyData[selectedDevice.id] || [];
    const labels = deviceHistory.map(d => format(new Date(d.timestamp), 'HH:mm'));
    const temperatures = deviceHistory.map(d => d.temperature);

    return {
      labels,
      datasets: [
        {
          label: 'Temperatura',
          data: temperatures,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Máximo',
          data: new Array(labels.length).fill(selectedDevice.max_temp),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Mínimo',
          data: new Array(labels.length).fill(selectedDevice.min_temp),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [historyData, selectedDevice]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: selectedDevice ? `Historial - ${selectedDevice.name}` : 'Selecciona un dispositivo'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value + '°C';
          }
        }
      }
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    success('Actualizado', 'Datos de temperatura actualizados');
  };

  // Export temperature report
  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting temperature report...');
  };

  if (loading && !temperatureData) {
    return <LoadingState message="Cargando sistema de monitoreo..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Temperaturas</h1>
          <p className="page-subtitle">
            Monitoreo en tiempo real de la cadena de frío
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={clsx('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Actualizar
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => setShowAlertConfig(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </Button>
          
          <Button 
            variant="primary"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-gray-500">Promedio</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.avgTemp.toFixed(1)}°C
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Temperatura promedio
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Dispositivos
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs text-gray-500">Normal</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.normal}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              En rango
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-xs text-gray-500">Advertencia</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.warning}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Precaución
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-xs text-gray-500">Crítico</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.alert}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Fuera de rango
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Offline</span>
            </div>
            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
              {summary.offline}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sin conexión
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Dispositivos
              </h3>
            </div>
            
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {temperatureData?.devices?.map(device => (
                <TemperatureCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDevice?.id === device.id}
                  onClick={() => setSelectedDevice(device)}
                />
              ))}
              
              {(!temperatureData?.devices || temperatureData.devices.length === 0) && (
                <div className="text-center py-8">
                  <Thermometer className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay dispositivos configurados
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowSettings(true)}
                  >
                    Configurar dispositivos
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Historial de Temperatura
                </h3>
                
                <div className="flex items-center gap-2">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    <option value="1h">Última hora</option>
                    <option value="6h">Últimas 6 horas</option>
                    <option value="24h">Últimas 24 horas</option>
                    <option value="7d">Últimos 7 días</option>
                  </select>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600 dark:text-gray-400">
                      Auto actualizar
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {chartData ? (
                <div className="h-96">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Selecciona un dispositivo para ver su historial
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Device Details */}
          {selectedDevice && (
            <div className="card mt-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detalles del Dispositivo
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Ubicación
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedDevice.location}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tipo
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedDevice.type}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Última lectura
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(selectedDevice.last_reading), 'HH:mm:ss')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Batería
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedDevice.battery_level}%
                    </div>
                  </div>
                </div>
                
                {selectedDevice.notes && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedDevice.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TemperatureSettings
          onClose={() => setShowSettings(false)}
          onSave={() => {
            refetch();
            setShowSettings(false);
            success('Configuración guardada', 'Los dispositivos se han actualizado');
          }}
        />
      )}

      {/* Alert Configuration Modal */}
      {showAlertConfig && (
        <TemperatureAlertConfig
          onClose={() => setShowAlertConfig(false)}
          onSave={() => {
            setShowAlertConfig(false);
            success('Alertas configuradas', 'Las alertas se han actualizado');
          }}
        />
      )}
    </div>
  );
};

export default TemperaturePage;