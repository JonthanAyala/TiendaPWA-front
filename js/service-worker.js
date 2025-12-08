const CACHE_NAME = 'narvaez-cache-v1';
const urlsToCache = [
  '/TiendaPWA-front/',
  '/TiendaPWA-front/index.html',
  '/TiendaPWA-front/pages/homeRepartidor.html',
  '/TiendaPWA-front/pages/dasboardAdmin.html',
  '/TiendaPWA-front/pages/loginAdmin.html',
  '/TiendaPWA-front/pages/loginRepartidor.html',
  '/TiendaPWA-front/pages/pedidos.html',
  '/TiendaPWA-front/pages/pedidosPendientes.html',
  '/TiendaPWA-front/pages/gestionPedidos.html',
  '/TiendaPWA-front/pages/gestionProductos.html',
  '/TiendaPWA-front/pages/gestionTiendas.html',
  '/TiendaPWA-front/pages/gestionRepartidores.html',
  '/TiendaPWA-front/pages/detalleTienda.html',
  '/TiendaPWA-front/pages/perfil.html',
  '/TiendaPWA-front/pages/registroVisita.html',
  '/TiendaPWA-front/pages/visitasTemporal.html',
  '/TiendaPWA-front/pages/confirmacionPedido.html',
  '/TiendaPWA-front/pages/panelNotificaciones.html',
  '/TiendaPWA-front/assets/css/styles.css',
  '/TiendaPWA-front/assets/css/responsive.css',
  '/TiendaPWA-front/js/app.js',
  '/TiendaPWA-front/js/offline.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Error al cachear algunos recursos:', err);
          // Cachear solo los que se puedan cargar
          return Promise.all(
            urlsToCache.map(url =>
              cache.add(url).catch(() => console.log(`No se pudo cachear: ${url}`))
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Estrategia: Cache First, luego Network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Para navegación, usar Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cachear la respuesta
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Si no hay red, servir del cache
          return caches.match(request)
            .then(response => response || caches.match('/TiendaPWA-front/offline.html'));
        })
    );
  } else {
    // Para otros recursos, Cache First
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              // Cachear la respuesta
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clonedResponse);
              });
              return response;
            })
            .catch(() => {
              // Respuesta offline para imágenes
              if (request.destination === 'image') {
                return new Response(
                  '<svg role="img" aria-label="Imagen no disponible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return null;
            });
        })
    );
  }
});

// Sincronización en segundo plano (opcional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(
      // Aquí puedes sincronizar datos cuando vuelva la conexión
      Promise.resolve()
    );
  }
});

// Notificaciones push (opcional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/TiendaPWA-front/assets/icons/icon-192x192.png',
    badge: '/TiendaPWA-front/assets/icons/icon-192x192.png',
    tag: 'narvaez-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Narvaez', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/TiendaPWA-front/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/TiendaPWA-front/');
      }
    })
  );
});
