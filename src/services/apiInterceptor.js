import axios from 'axios';
import toast from 'react-hot-toast';
import errorReportingService from './errorReporting';

// Flag para modo offline
let isOfflineMode = false;
let hasShownOfflineNotification = false;

// Mock data para diferentes endpoints
const mockData = {
  '/api/dashboard/overview': {
    success: true,
    data: {
      revenue: { today: 15420, growth: 12.5 },
      orders: { today: 42, growth: 8.3 },
      products: { total: 156, lowStock: 12 },
      customers: { total: 324, new: 15 },
      salesByHour: [
        { hour: '9AM', sales: 5 },
        { hour: '10AM', sales: 8 },
        { hour: '11AM', sales: 12 },
        { hour: '12PM', sales: 15 },
        { hour: '1PM', sales: 18 },
        { hour: '2PM', sales: 14 },
        { hour: '3PM', sales: 10 },
        { hour: '4PM', sales: 7 },
      ],
      topProducts: [
        { name: 'Helado de Vainilla', sales: 145, revenue: 2175 },
        { name: 'Helado de Chocolate', sales: 132, revenue: 1980 },
        { name: 'Helado de Fresa', sales: 98, revenue: 1470 },
        { name: 'Helado de Dulce de Leche', sales: 87, revenue: 1305 },
      ],
      recentOrders: [
        { id: '001', customer: 'Juan Pérez', total: 125.50, status: 'completed', time: '10:30 AM' },
        { id: '002', customer: 'María García', total: 87.25, status: 'pending', time: '11:15 AM' },
        { id: '003', customer: 'Carlos López', total: 156.00, status: 'completed', time: '12:00 PM' },
      ]
    }
  },
  '/api/alerts': {
    success: true,
    data: [
      {
        id: 1,
        type: 'stock',
        severity: 'warning',
        title: 'Stock Bajo',
        message: 'Helado de Vainilla por debajo del mínimo',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'info',
        severity: 'info',
        title: 'Nuevo Pedido',
        message: 'Pedido #1234 recibido',
        timestamp: new Date().toISOString(),
        read: false
      }
    ]
  },
  '/api/products': {
    success: true,
    data: [
      {
        id: 1,
        name: 'Helado de Vainilla',
        price: 15.00,
        stock: 45,
        category: 'Clásicos',
        image: null
      },
      {
        id: 2,
        name: 'Helado de Chocolate',
        price: 15.00,
        stock: 38,
        category: 'Clásicos',
        image: null
      },
      {
        id: 3,
        name: 'Helado de Fresa',
        price: 15.00,
        stock: 52,
        category: 'Frutales',
        image: null
      }
    ]
  },
  '/api/ai/health': {
    status: 'ok',
    offline: true,
    message: 'Modo offline activo'
  },
  '/api/ingredients': {
    success: true,
    data: [
      {
        id: 1,
        name: 'Leche Entera',
        current_stock: 50,
        unit: 'litros',
        supplier_name: 'Lácteos del Sur',
        min_stock: 20
      },
      {
        id: 2,
        name: 'Crema de Leche',
        current_stock: 30,
        unit: 'litros',
        supplier_name: 'Lácteos del Sur',
        min_stock: 15
      },
      {
        id: 3,
        name: 'Azúcar',
        current_stock: 100,
        unit: 'kg',
        supplier_name: 'Distribuidora Central',
        min_stock: 50
      }
    ]
  },
  '/api/recipes': {
    success: true,
    data: [
      {
        id: 1,
        name: 'Helado de Vainilla',
        yield: 10,
        unit: 'litros',
        ingredients_count: 5
      },
      {
        id: 2,
        name: 'Helado de Chocolate',
        yield: 10,
        unit: 'litros',
        ingredients_count: 6
      }
    ]
  },
  '/api/stores': {
    success: true,
    data: [
      {
        id: 1,
        name: 'Sucursal Centro',
        address: 'Av. Principal 123',
        active: true
      },
      {
        id: 2,
        name: 'Sucursal Norte',
        address: 'Calle Norte 456',
        active: true
      }
    ]
  },
  '/api/users': {
    success: true,
    data: [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@venezia.com',
        role: 'Administrador'
      },
      {
        id: 2,
        name: 'Vendedor 1',
        email: 'vendedor1@venezia.com',
        role: 'Vendedor'
      }
    ]
  }
};

// Configurar interceptores
export const setupApiInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Agregar headers si es necesario
      config.timeout = config.timeout || 10000; // 10 segundos de timeout por defecto
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Si recibimos una respuesta exitosa y estábamos en modo offline
      if (isOfflineMode) {
        isOfflineMode = false;
        hasShownOfflineNotification = false;
        toast.success('Conexión restaurada');
      }
      return response;
    },
    async (error) => {
      const { config, response } = error;

      // Report API error to error service
      errorReportingService.reportApiError(error, config?.url, config?.data);

      // Si es un error 504 (Gateway Timeout) o no hay respuesta
      if (response?.status === 504 || !response) {
        isOfflineMode = true;

        // Mostrar notificación solo una vez
        if (!hasShownOfflineNotification) {
          hasShownOfflineNotification = true;
          toast.error('No se puede conectar con el servidor. Usando modo offline.', {
            duration: 5000,
            icon: '🔌'
          });
        }

        // Buscar datos mock para la URL
        const url = config.url;
        const mockResponse = mockData[url] || mockData[url.split('?')[0]];

        if (mockResponse) {
          // Simular una respuesta exitosa con datos mock
          return {
            data: mockResponse,
            status: 200,
            statusText: 'OK (Mock)',
            headers: {},
            config: config,
            request: {}
          };
        }

        // Si no hay datos mock, devolver un error genérico
        return Promise.reject({
          message: 'Sin conexión al servidor',
          code: 'OFFLINE',
          originalError: error
        });
      }

      // Para otros errores, simplemente rechazar
      return Promise.reject(error);
    }
  );
};

// Función para verificar si estamos en modo offline
export const isInOfflineMode = () => isOfflineMode;

// Función para forzar modo offline (útil para testing)
export const setOfflineMode = (offline) => {
  isOfflineMode = offline;
  hasShownOfflineNotification = false;
};

// Función para agregar más datos mock
export const addMockData = (endpoint, data) => {
  mockData[endpoint] = data;
};

// Función para obtener datos mock
export const getMockData = (endpoint) => {
  return mockData[endpoint];
};