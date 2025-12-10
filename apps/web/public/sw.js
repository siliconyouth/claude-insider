// Cache version - UPDATE THIS ON EACH DEPLOY to bust old caches
const CACHE_VERSION = 'v2';
const CACHE_NAME = `claude-insider-${CACHE_VERSION}`;
const STATIC_CACHE = `claude-insider-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `claude-insider-dynamic-${CACHE_VERSION}`;

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

// Fetch event - network-first for pages, cache-first for assets
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

  // For navigation requests (HTML pages) - use NETWORK-FIRST strategy
  // This ensures users always get the latest content
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - serve from cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For other assets (images, scripts, etc.) - use CACHE-FIRST strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
