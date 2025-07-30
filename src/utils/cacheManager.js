import eventBus, { EVENTS } from './eventBus';

// Cache manager global
class CacheManager {
  // Invalidar caché para endpoints específicos
  invalidateEndpoints(endpoints) {
    if (!Array.isArray(endpoints)) {
      endpoints = [endpoints];
    }
    
    eventBus.emit(EVENTS.CACHE_INVALIDATE, { endpoints });
  }

  // Invalidar caché por patrón
  invalidatePattern(pattern) {
    eventBus.emit(EVENTS.CACHE_INVALIDATE, { pattern });
  }

  // Invalidar todo el caché
  invalidateAll() {
    eventBus.emit(EVENTS.CACHE_INVALIDATE, { pattern: '' });
  }

  // Métodos de conveniencia para endpoints comunes
  invalidateProviders() {
    this.invalidateEndpoints(['/api/providers', '/api/provider_categories']);
  }

  invalidateProducts() {
    this.invalidateEndpoints(['/api/products', '/api/product_categories', '/api/flavors']);
  }

  invalidateStock() {
    this.invalidateEndpoints(['/api/stock_data', '/api/inventory']);
  }

  invalidateDashboard() {
    this.invalidateEndpoints(['/api/dashboard/overview']);
  }
}

// Crear instancia única
const cacheManager = new CacheManager();

// Exponerlo globalmente para debugging
if (typeof window !== 'undefined') {
  window.cacheManager = cacheManager;
}

export default cacheManager;