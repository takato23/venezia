// Optimized API service with caching and request deduplication
import axios from 'axios';

// Create axios instance with optimized defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request queue for deduplication
const pendingRequests = new Map();

// Simple in-memory cache
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new ApiCache();

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timing
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log slow requests
    const duration = Date.now() - response.config.metadata.startTime;
    if (duration > 1000) {
      console.warn(`Slow API call: ${response.config.method.toUpperCase()} ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Deduplicated GET request
async function getCached(url, options = {}) {
  const cacheKey = `GET:${url}:${JSON.stringify(options.params || {})}`;
  
  // Check cache first
  if (options.cache !== false) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, cached: true };
    }
  }
  
  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Make request
  const promise = api.get(url, options)
    .then(response => {
      // Cache successful responses
      if (options.cache !== false) {
        cache.set(cacheKey, response.data, options.cacheTTL);
      }
      
      pendingRequests.delete(cacheKey);
      return response;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });
  
  pendingRequests.set(cacheKey, promise);
  return promise;
}

// Batch requests
class BatchQueue {
  constructor(batchFn, delay = 50) {
    this.queue = [];
    this.batchFn = batchFn;
    this.delay = delay;
    this.timeout = null;
  }
  
  add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.timeout = null;
    
    try {
      const results = await this.batchFn(batch.map(b => b.item));
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}

// Optimized API methods
const apiOptimized = {
  // Products
  products: {
    list: (params) => getCached('/products', { params, cache: true }),
    get: (id) => getCached(`/products/${id}`, { cache: true }),
    create: (data) => {
      cache.invalidate('/products');
      return api.post('/products', data);
    },
    update: (id, data) => {
      cache.invalidate(`/products/${id}`);
      cache.invalidate('/products');
      return api.put(`/products/${id}`, data);
    },
    delete: (id) => {
      cache.invalidate(`/products/${id}`);
      cache.invalidate('/products');
      return api.delete(`/products/${id}`);
    }
  },
  
  // Sales
  sales: {
    list: (params) => getCached('/sales', { params, cache: true, cacheTTL: 60000 }), // 1 minute cache
    create: (data) => {
      cache.invalidate('/sales');
      cache.invalidate('/reports');
      return api.post('/sales', data);
    },
    getDailySummary: (date) => getCached(`/sales/daily-summary`, { 
      params: { date }, 
      cache: true,
      cacheTTL: 300000 // 5 minutes
    })
  },
  
  // Inventory
  inventory: {
    list: () => getCached('/inventory', { cache: true }),
    updateStock: (id, data) => {
      cache.invalidate('/inventory');
      return api.post(`/inventory/${id}/stock`, data);
    },
    getLowStock: () => getCached('/inventory/low-stock', { cache: true, cacheTTL: 60000 })
  },
  
  // Reports
  reports: {
    sales: (params) => getCached('/reports/sales', { params, cache: true, cacheTTL: 300000 }),
    inventory: () => getCached('/reports/inventory', { cache: true, cacheTTL: 300000 }),
    customers: () => getCached('/reports/customers', { cache: true, cacheTTL: 300000 })
  },
  
  // Batch operations
  batch: new BatchQueue(async (operations) => {
    const response = await api.post('/batch', { operations });
    return response.data.results;
  }),
  
  // Clear cache
  clearCache: () => cache.clear(),
  
  // Invalidate specific cache patterns
  invalidateCache: (pattern) => cache.invalidate(pattern)
};

// Prefetch common data
export const prefetchCommonData = async () => {
  const prefetchList = [
    apiOptimized.products.list(),
    apiOptimized.inventory.list()
  ];
  
  try {
    await Promise.all(prefetchList);
  } catch (error) {
    console.error('Prefetch error:', error);
  }
};

// Export optimized API
export default apiOptimized;