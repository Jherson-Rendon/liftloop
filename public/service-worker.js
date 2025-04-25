const CACHE_NAME = 'gym-progress-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Función para verificar si una URL es válida para cachear
function isValidUrl(url) {
  try {
    // Convertir URLs relativas a absolutas usando la ubicación del service worker
    const absoluteUrl = new URL(url, self.location.origin);
    return ['http:', 'https:'].includes(absoluteUrl.protocol);
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          urlsToCache.map(url => {
            // Convertir URL relativa a absoluta
            const absoluteUrl = new URL(url, self.location.origin);
            
            if (!isValidUrl(absoluteUrl.href)) {
              console.warn(`Skipping invalid URL: ${url}`);
              return Promise.resolve();
            }
            
            return fetch(absoluteUrl)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to cache ${url}`);
                }
                return cache.put(absoluteUrl, response);
              })
              .catch(error => {
                console.error(`Failed to cache ${url}:`, error);
                return Promise.resolve();
              });
          })
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes de websocket y otras no HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            // Solo cachear recursos locales y HTTP/HTTPS
            if (response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(error => {
                  console.error('Cache put error:', error);
                });
            }

            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            throw error;
          });
      })
  );
}); 