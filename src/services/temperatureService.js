// Simulated Temperature Service
// This service provides mock temperature data for testing the temperature monitoring system

class TemperatureService {
  constructor() {
    this.devices = [
      {
        id: 'TEMP-001',
        name: 'Congelador Principal',
        type: 'freezer',
        location: 'Sala de Producción',
        min_temp: -25,
        max_temp: -18,
        current_temp: -20,
        temp_change: -0.5,
        status: 'normal',
        battery_level: 95,
        last_reading: new Date().toISOString(),
        sensor_id: 'SENS-001',
        notes: 'Congelador principal para almacenamiento de helados'
      },
      {
        id: 'TEMP-002',
        name: 'Heladera de Ingredientes',
        type: 'fridge',
        location: 'Cocina',
        min_temp: 2,
        max_temp: 8,
        current_temp: 5,
        temp_change: 0.2,
        status: 'normal',
        battery_level: 82,
        last_reading: new Date().toISOString(),
        sensor_id: 'SENS-002',
        notes: 'Almacenamiento de leche, crema y frutas frescas'
      },
      {
        id: 'TEMP-003',
        name: 'Vitrina de Exhibición',
        type: 'display',
        location: 'Área de Venta',
        min_temp: -5,
        max_temp: -2,
        current_temp: -1,
        temp_change: 0.8,
        status: 'warning',
        battery_level: 67,
        last_reading: new Date().toISOString(),
        alert_message: 'Temperatura acercándose al límite máximo',
        sensor_id: 'SENS-003'
      },
      {
        id: 'TEMP-004',
        name: 'Congelador de Respaldo',
        type: 'freezer',
        location: 'Almacén',
        min_temp: -25,
        max_temp: -18,
        current_temp: -15,
        temp_change: 2.5,
        status: 'alert',
        battery_level: 45,
        last_reading: new Date().toISOString(),
        alert_message: 'ALERTA: Temperatura fuera de rango permitido',
        sensor_id: 'SENS-004'
      },
      {
        id: 'TEMP-005',
        name: 'Cámara Fría',
        type: 'storage',
        location: 'Depósito',
        min_temp: 0,
        max_temp: 10,
        status: 'offline',
        battery_level: 12,
        last_reading: new Date(Date.now() - 45 * 60000).toISOString(),
        offline_duration: '45 minutos',
        sensor_id: 'SENS-005'
      }
    ];

    // History data for charts
    this.history = {};
    this._generateHistoryData();
    
    // Start simulation
    this._startSimulation();
  }

  // Generate historical data for charts
  _generateHistoryData() {
    this.devices.forEach(device => {
      if (device.status !== 'offline') {
        this.history[device.id] = [];
        
        // Generate 24 hours of data
        for (let i = 24; i >= 0; i--) {
          const timestamp = new Date(Date.now() - i * 3600000);
          const baseTemp = (device.min_temp + device.max_temp) / 2;
          const variation = (Math.random() - 0.5) * 4;
          
          this.history[device.id].push({
            timestamp: timestamp.toISOString(),
            temperature: Math.round((baseTemp + variation) * 10) / 10
          });
        }
      }
    });
  }

  // Start real-time simulation
  _startSimulation() {
    setInterval(() => {
      this.devices.forEach(device => {
        if (device.status !== 'offline') {
          // Simulate temperature changes
          const change = (Math.random() - 0.5) * 0.5;
          device.current_temp = Math.round((device.current_temp + change) * 10) / 10;
          device.temp_change = Math.round(change * 10) / 10;
          device.last_reading = new Date().toISOString();
          
          // Simulate battery drain
          if (device.battery_level > 0) {
            device.battery_level = Math.max(0, device.battery_level - Math.random() * 0.5);
          }
          
          // Update status based on temperature
          if (device.current_temp < device.min_temp - 2 || device.current_temp > device.max_temp + 2) {
            device.status = 'alert';
            device.alert_message = `ALERTA: Temperatura crítica: ${device.current_temp}°C`;
          } else if (device.current_temp < device.min_temp || device.current_temp > device.max_temp) {
            device.status = 'warning';
            device.alert_message = `Advertencia: Temperatura fuera de rango: ${device.current_temp}°C`;
          } else {
            device.status = 'normal';
            device.alert_message = null;
          }
          
          // Add to history
          if (this.history[device.id]) {
            this.history[device.id].push({
              timestamp: new Date().toISOString(),
              temperature: device.current_temp
            });
            
            // Keep only last 24 hours
            if (this.history[device.id].length > 100) {
              this.history[device.id].shift();
            }
          }
        } else {
          // Update offline duration
          const offlineTime = Date.now() - new Date(device.last_reading).getTime();
          const minutes = Math.floor(offlineTime / 60000);
          device.offline_duration = `${minutes} minutos`;
        }
      });
    }, 30000); // Update every 30 seconds
  }

  // Get current temperature data
  async getCurrentData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      devices: this.devices,
      last_update: new Date().toISOString()
    };
  }

  // Get temperature history
  async getHistory(range = '24h') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const filteredHistory = {};
    const now = Date.now();
    let hoursToInclude = 24;
    
    switch(range) {
      case '1h':
        hoursToInclude = 1;
        break;
      case '6h':
        hoursToInclude = 6;
        break;
      case '24h':
        hoursToInclude = 24;
        break;
      case '7d':
        hoursToInclude = 168;
        break;
    }
    
    const cutoffTime = now - (hoursToInclude * 3600000);
    
    Object.keys(this.history).forEach(deviceId => {
      filteredHistory[deviceId] = this.history[deviceId].filter(
        reading => new Date(reading.timestamp).getTime() > cutoffTime
      );
    });
    
    return filteredHistory;
  }

  // Get devices configuration
  async getDevices() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      devices: this.devices.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        location: device.location,
        min_temp: device.min_temp,
        max_temp: device.max_temp,
        sensor_id: device.sensor_id,
        notes: device.notes
      }))
    };
  }

  // Update device configuration
  async updateDevices(devices) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update device configurations
    devices.forEach(updatedDevice => {
      const device = this.devices.find(d => d.id === updatedDevice.id);
      if (device) {
        Object.assign(device, updatedDevice);
      }
    });
    
    return { success: true };
  }

  // Get alert configuration
  async getAlertConfig() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      enabled: true,
      critical_temp_deviation: 3,
      warning_temp_deviation: 2,
      offline_threshold_minutes: 30,
      notification_cooldown_minutes: 60,
      notification_methods: {
        app: true,
        email: true,
        sms: false,
        whatsapp: true
      },
      recipients: [
        {
          id: 1,
          name: 'Juan Pérez',
          email: 'juan@venezia.com',
          phone: '+54911234567',
          methods: {
            email: true,
            sms: false,
            whatsapp: true
          }
        },
        {
          id: 2,
          name: 'María González',
          email: 'maria@venezia.com',
          phone: '+54917654321',
          methods: {
            email: true,
            sms: true,
            whatsapp: false
          }
        }
      ]
    };
  }

  // Update alert configuration
  async updateAlertConfig(config) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, this would update the database
    console.log('Alert config updated:', config);
    
    return { success: true };
  }
}

// Create singleton instance
const temperatureService = new TemperatureService();

// Export service
export default temperatureService;