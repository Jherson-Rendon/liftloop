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
});