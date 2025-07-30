// Sistema de caché para optimizar las respuestas del chat
class ChatCache {
  constructor(maxSize = 100, ttl = 3600000) { // 1 hora por defecto
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  // Generar clave única para el mensaje
  generateKey(message, context = []) {
    const contextString = context
      .slice(-5) // Solo últimos 5 mensajes de contexto
      .map(m => m.content)
      .join('|');
    return `${message.toLowerCase().trim()}::${contextString}`;
  }

  // Obtener respuesta del caché
  get(message, context) {
    const key = this.generateKey(message, context);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Verificar si expiró
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    // Actualizar timestamp de último acceso
    cached.lastAccessed = Date.now();
    return cached.response;
  }

  // Guardar respuesta en caché
  set(message, context, response) {
    const key = this.generateKey(message, context);

    // Si alcanzamos el tamaño máximo, eliminar el más antiguo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  // Encontrar la entrada más antigua
  findOldestEntry() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Limpiar caché
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  // Obtener estadísticas
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    };
  }

  // Limpiar entradas expiradas
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Instancia singleton
const chatCache = new ChatCache();

// Función helper para usar el caché
export const getCachedResponse = (message, context) => {
  return chatCache.get(message, context);
};

export const setCachedResponse = (message, context, response) => {
  chatCache.set(message, context, response);
};

export const getCacheStats = () => {
  return chatCache.getStats();
};

export const clearCache = () => {
  chatCache.clear();
};

export default chatCache;