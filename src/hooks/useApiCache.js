import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { handleApiError, logError } from '../utils/errorHandler';
import MockApiService from '../services/mockApiService';
import mockDeliveryService from '../services/mockDeliveryService';
import eventBus, { EVENTS } from '../utils/eventBus';

// Cache global para datos de API
const apiCache = new Map();
const pendingRequests = new Map();

// Configuración de caché por endpoint
const cacheConfig = {
  '/api/products': { ttl: 30 * 1000 }, // 30 segundos (reducido)
  '/api/product_categories': { ttl: 10 * 60 * 1000 }, // 10 minutos
  '/api/stores': { ttl: 10 * 60 * 1000 }, // 10 minutos
  '/api/providers': { ttl: 30 * 1000 }, // 30 segundos (reducido significativamente)
  '/api/dashboard/overview': { ttl: 30 * 1000 }, // 30 segundos
  '/api/stock_data': { ttl: 30 * 1000 }, // 30 segundos (reducido)
  '/api/web_users': { ttl: 2 * 60 * 1000 }, // 2 minutos (reducido)
  '/api/flavors': { ttl: 5 * 60 * 1000 }, // 5 minutos (reducido)
  '/api/deliveries': { ttl: 30 * 1000 }, // 30 segundos
  '/api/drivers': { ttl: 2 * 60 * 1000 }, // 2 minutos
  '/api/sales': { ttl: 30 * 1000 }, // 30 segundos
};

// Generar clave de caché incluyendo parámetros
const getCacheKey = (url, params) => {
  const sortedParams = params ? Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {}) : {};
  
  return `${url}?${new URLSearchParams(sortedParams).toString()}`;
};

// Verificar si el caché es válido
const isCacheValid = (cacheEntry, ttl) => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < ttl;
};

export const useApiCache = (url, params = null, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 0,
    onSuccess,
    onError
  } = options;

  const cacheKey = getCacheKey(url, params);
  const config = cacheConfig[url] || { ttl: 60 * 1000 }; // Default 1 minuto

  // Function to get mock data for specific endpoints
  const getMockData = async (endpoint, params) => {
    // First try specific method calls for complex data
    switch (endpoint) {
      case '/api/dashboard/overview':
        return MockApiService.getDashboardOverview();
      case '/api/deliveries':
        // Usar el servicio mock específico para entregas
        return mockDeliveryService.getAll();
      case '/api/sales':
        return MockApiService.getSales(params);
      case '/api/production_orders':
        return MockApiService.getProductionOrders();
      case '/api/production_batches':
        return MockApiService.getProductionBatches();
      case '/api/stock_data':
      case '/api/inventory':
        return MockApiService.getInventory();
      case '/api/analytics/sales':
        return MockApiService.getAnalytics('sales', params);
      case '/api/analytics/products':
        return MockApiService.getAnalytics('products', params);
      case '/api/analytics/customers':
        return MockApiService.getAnalytics('customers', params);
      case '/api/analytics/export':
        return MockApiService.getAnalyticsExport(params);
      case '/api/reports/sales':
        return MockApiService.getReports('sales', params);
      case '/api/reports/inventory':
        return MockApiService.getReports('inventory', params);
      default:
        // For other endpoints, use the main MockApiService.getMockData method
        return MockApiService.getMockData(endpoint);
    }
  };

  // Función para hacer la petición
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar caché si no es forzado
    if (!force) {
      const cached = apiCache.get(cacheKey);
      if (isCacheValid(cached, config.ttl)) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        onSuccess?.(cached.data);
        return cached.data;
      }
    }

    // Verificar si ya hay una petición pendiente
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey);
        setData(result);
        setLoading(false);
        setError(null);
        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);
        setLoading(false);
        onError?.(err);
        throw err;
      }
    }

    // Crear nueva petición
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const requestPromise = axios.get(url, {
      params,
      signal: abortControllerRef.current.signal
    }).then(response => {
      const responseData = response.data;
      
      // Guardar en caché
      apiCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      setData(responseData);
      setLoading(false);
      onSuccess?.(responseData);
      return responseData;
    }).catch(async (err) => {
      // Don't set error state or throw for cancelled requests
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Request was cancelled, this is expected behavior
        return null;
      }
      
      // Try to get mock data as fallback
      try {
        const mockData = await getMockData(url, params);
        if (mockData !== null) {
          // Use mock data as fallback
          apiCache.set(cacheKey, {
            data: mockData,
            timestamp: Date.now()
          });

          setData(mockData);
          setLoading(false);
          onSuccess?.(mockData);
          return mockData;
        }
      } catch (mockError) {
        console.warn('Mock data also failed:', mockError);
      }
      
      // Log error for debugging
      logError(err, { url, params, context: 'useApiCache' });
      
      // Create more user-friendly error
      const userError = {
        message: err.code === 'ECONNREFUSED' 
          ? 'No se pudo conectar con el servidor. Usando datos de demostración.'
          : err.response?.data?.error || err.message || 'Error al cargar datos',
        originalError: err,
        code: err.code,
        status: err.response?.status
      };
      
      setError(userError);
      setLoading(false);
      onError?.(userError);
      throw userError;
    }).finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [url, params, enabled, cacheKey, config.ttl, onSuccess, onError]);

  // Función para invalidar caché - MOVER ANTES DE LOS USEEFFECTS
  const invalidateCache = useCallback((pattern) => {
    if (pattern) {
      // Invalidar por patrón
      for (const key of apiCache.keys()) {
        if (key.includes(pattern)) {
          apiCache.delete(key);
        }
      }
    } else {
      // Invalidar caché específico
      apiCache.delete(cacheKey);
    }
  }, [cacheKey]);

  // Función para refetch manual
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Función para actualizar datos localmente
  const mutate = useCallback((newData) => {
    setData(newData);
    // Actualizar caché
    apiCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    let mounted = true;
    
    if (enabled) {
      fetchData(refetchOnMount).catch(err => {
        // Only log errors if component is still mounted and it's not a cancellation
        if (mounted && !axios.isCancel(err) && err.name !== 'CanceledError') {
          console.error('Error fetching data:', err);
        }
      });
    }

    return () => {
      mounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, enabled, refetchOnMount]);

  // Efecto para escuchar eventos de invalidación de caché
  useEffect(() => {
    // Listener para invalidación de caché específica
    const handleCacheInvalidation = (data) => {
      if (data && data.endpoints) {
        // Invalidar endpoints específicos
        data.endpoints.forEach(endpoint => {
          if (url.includes(endpoint)) {
            invalidateCache();
            if (enabled) {
              fetchData(true);
            }
          }
        });
      } else if (data && data.pattern) {
        // Invalidar por patrón
        if (url.includes(data.pattern)) {
          invalidateCache();
          if (enabled) {
            fetchData(true);
          }
        }
      }
    };

    // Listener para acciones completadas del AI
    const handleAIActionCompleted = (data) => {
      const actionEndpointMap = {
        'provider_created': '/api/providers',
        'product_created': '/api/products',
        'stock_updated': '/api/stock_data'
      };

      const endpoint = actionEndpointMap[data?.action];
      if (endpoint && url.includes(endpoint)) {
        invalidateCache();
        if (enabled) {
          fetchData(true);
        }
      }
    };

    // Suscribirse a eventos
    const unsubscribeCacheInvalidate = eventBus.on(EVENTS.CACHE_INVALIDATE, handleCacheInvalidation);
    const unsubscribeAIAction = eventBus.on(EVENTS.AI_ACTION_COMPLETED, handleAIActionCompleted);

    // Cleanup
    return () => {
      unsubscribeCacheInvalidate();
      unsubscribeAIAction();
    };
  }, [url, enabled, fetchData, invalidateCache]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    invalidateCache
  };
};

// Hook para múltiples peticiones paralelas
export const useMultipleApiCache = (requests) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const promises = requests.map(async ({ url, params, key }) => {
          const cacheKey = getCacheKey(url, params);
          const config = cacheConfig[url] || { ttl: 60 * 1000 };
          
          // Verificar caché
          const cached = apiCache.get(cacheKey);
          if (isCacheValid(cached, config.ttl)) {
            return { key: key || url, data: cached.data };
          }

          // Hacer petición
          const response = await axios.get(url, { params });
          
          // Guardar en caché
          apiCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
          });

          return { key: key || url, data: response.data };
        });

        const results = await Promise.all(promises);
        const dataMap = {};
        
        results.forEach(({ key, data: resultData }) => {
          dataMap[key] = resultData;
        });

        setData(dataMap);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (requests.length > 0) {
      fetchAll();
    }
  }, [requests]);

  return { data, loading, error };
};

// Función para limpiar caché expirado
export const cleanExpiredCache = () => {
  const now = Date.now();
  
  for (const [key, entry] of apiCache.entries()) {
    const url = key.split('?')[0];
    const config = cacheConfig[url] || { ttl: 60 * 1000 };
    
    if (now - entry.timestamp > config.ttl) {
      apiCache.delete(key);
    }
  }
};

// Limpiar caché expirado cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000); 