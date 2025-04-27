<<<<<<< HEAD
const CACHE_NAME = 'gym-progress-v1';
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Helper function to check if a request is an auth request
const isAuthRequest = (url) => {
  return url.pathname.includes('/profile/select') || 
         url.pathname.includes('/profile/new') ||
         url.pathname.includes('/logout');
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Helper function to determine if a request is for a build file
const isBuildFile = (url) => {
  return url.includes('/build/');
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some(asset => url.endsWith(asset));
};

// Helper function for network-first strategy
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Helper function for cache-first strategy
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  const networkResponse = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, networkResponse.clone());
  return networkResponse;
};

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar solicitudes de autenticación
  if (isAuthRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Handle build files
  if (isBuildFile(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle all other requests
  event.respondWith(
    networkFirst(request)
      .catch(error => {
        console.error('Fetch failed:', error);
        return new Response('Network error', { status: 408, statusText: 'Network error' });
      })
  );
=======
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
>>>>>>> 95a3c1246c1a6c9854832977ac51e3e27b33c307
}); 