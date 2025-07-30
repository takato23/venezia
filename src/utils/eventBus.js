// Event Bus para comunicación entre componentes
class EventBus {
  constructor() {
    this.events = {};
  }

  // Suscribirse a un evento
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Retornar función para desuscribirse
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emitir un evento
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  // Limpiar todos los eventos
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Crear instancia única
const eventBus = new EventBus();

// Eventos predefinidos
export const EVENTS = {
  PROVIDER_CREATED: 'provider:created',
  PROVIDER_UPDATED: 'provider:updated',
  PROVIDER_DELETED: 'provider:deleted',
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  STOCK_UPDATED: 'stock:updated',
  CACHE_INVALIDATE: 'cache:invalidate',
  AI_ACTION_COMPLETED: 'ai:action:completed'
};

export default eventBus;