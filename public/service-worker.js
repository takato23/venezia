// Service Worker para Venezia WebShop
const CACHE_VERSION = 'v2';
const CACHE_NAME = `venezia-webshop-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `venezia-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `venezia-images-${CACHE_VERSION}`;

// Archivos esenciales para funcionar offline
const urlsToCache = [
  '/',
  '/webshop',
  '/manifest.json',
  '/placeholder-ice-cream.jpg',
  '/offline.html'
];

// Límites de cache
const CACHE_LIMITS = {
  images: 50,
  dynamic: 30
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones de extensiones del navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  // API calls - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clonar la respuesta
          const responseToCache = response.clone();
          
          // Guardar en cache dinámico
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Si falla, buscar en cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Imágenes - Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          });
        })
        .catch(() => {
          // Imagen placeholder si no hay conexión
          return caches.match('/placeholder-ice-cream.jpg');
        })
    );
    return;
  }
  
  // Resto de recursos - Cache First con fallback
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          // No cachear respuestas no exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Página offline si es una navegación
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

// Función para sincronizar pedidos pendientes
async function syncPendingOrders() {
  const pendingOrders = await getPendingOrders();
  
  for (const order of pendingOrders) {
    try {
      await fetch('/api/public/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      // Marcar como sincronizado
      await markOrderAsSynced(order.id);
    } catch (error) {
      console.error('Error sincronizando orden:', error);
    }
  }
}

// Helpers para IndexedDB (simplificado)
async function getPendingOrders() {
  // Implementar con IndexedDB
  return [];
}

async function markOrderAsSynced(orderId) {
  // Implementar con IndexedDB
}