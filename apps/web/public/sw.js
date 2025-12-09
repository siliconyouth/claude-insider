const CACHE_NAME = 'claude-insider-v1';
const STATIC_CACHE = 'claude-insider-static-v1';
const DYNAMIC_CACHE = 'claude-insider-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/docs',
  '/docs/getting-started',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip API routes and Next.js internals
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // Fetch updated version in background
        event.waitUntil(
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
