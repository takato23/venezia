// API Service optimizado para WebShop con cache y retry

class WebShopAPI {
  constructor() {
    this.baseURL = '/api/public/shop';
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Request con cache y deduplicación
   */
  async cachedRequest(url, options = {}, cacheKey = null) {
    const key = cacheKey || `${url}:${JSON.stringify(options)}`;
    
    // Verificar cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Verificar si ya hay una request pendiente
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // Crear nueva request
    const requestPromise = this.makeRequest(url, options)
      .then(data => {
        // Guardar en cache
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        
        // Limpiar request pendiente
        this.pendingRequests.delete(key);
        
        return data;
      })
      .catch(error => {
        // Limpiar request pendiente en caso de error
        this.pendingRequests.delete(key);
        throw error;
      });
    
    // Guardar como pendiente
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }

  /**
   * Request con retry automático
   */
  async makeRequest(url, options = {}, retries = 3) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      clearTimeout(timeout);
      
      // Retry en caso de error de red
      if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
        await this.delay(1000); // Esperar 1 segundo
        return this.makeRequest(url, options, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtener productos con cache
   */
  async getProducts() {
    const response = await this.cachedRequest(`${this.baseURL}/products`);
    return response.products || [];
  }

  /**
   * Obtener configuración con cache
   */
  async getConfig() {
    const response = await this.cachedRequest(`${this.baseURL}/config`);
    return response.config || {};
  }

  /**
   * Verificar disponibilidad (sin cache)
   */
  async checkAvailability(productIds) {
    return this.makeRequest(`${this.baseURL}/check-availability`, {
      method: 'POST',
      body: JSON.stringify({ productIds })
    });
  }

  /**
   * Crear orden (sin cache)
   */
  async createOrder(orderData) {
    return this.makeRequest(`${this.baseURL}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  /**
   * Obtener estado de orden
   */
  async getOrderStatus(orderNumber) {
    return this.cachedRequest(
      `${this.baseURL}/orders/${orderNumber}/status`,
      {},
      `order-status:${orderNumber}`
    );
  }

  /**
   * Batch request para múltiples endpoints
   */
  async batchRequest(requests) {
    return Promise.all(
      requests.map(req => 
        this.cachedRequest(req.url, req.options, req.cacheKey)
      )
    );
  }

  /**
   * Prefetch de datos críticos
   */
  async prefetch() {
    // Cargar productos y config en paralelo
    return Promise.all([
      this.getProducts(),
      this.getConfig()
    ]);
  }

  /**
   * Sincronizar carrito con backend (futuro)
   */
  async syncCart(cart) {
    // Por ahora solo guardamos en localStorage
    localStorage.setItem('venezia_cart_backup', JSON.stringify({
      cart,
      timestamp: Date.now()
    }));
    
    // En el futuro, sincronizar con backend
    // return this.makeRequest(`${this.baseURL}/cart/sync`, {
    //   method: 'POST',
    //   body: JSON.stringify({ cart })
    // });
  }

  /**
   * Analytics - Track evento
   */
  async trackEvent(eventName, eventData) {
    // No bloquear UI con analytics
    this.makeRequest(`${this.baseURL}/analytics/track`, {
      method: 'POST',
      body: JSON.stringify({ 
        event: eventName, 
        data: eventData,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silenciar errores de analytics
      console.debug('Analytics error silenced');
    });
  }
}

// Singleton instance
const webshopAPI = new WebShopAPI();

// Auto-prefetch al cargar
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webshopAPI.prefetch();
    });
  } else {
    webshopAPI.prefetch();
  }
}

export default webshopAPI;