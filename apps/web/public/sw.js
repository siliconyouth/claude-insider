// Cache version - UPDATE THIS ON EACH DEPLOY to bust old caches
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `claude-insider-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `claude-insider-dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `claude-insider-offline-${CACHE_VERSION}`;

// Static assets to cache immediately (shell)
const STATIC_ASSETS = [
  '/',
  '/docs',
  '/docs/getting-started',
  '/resources',
  '/search',
  '/manifest.json',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Pages that should work offline (cached more aggressively)
const OFFLINE_PAGES = [
  '/favorites',
  '/reading-lists',
  '/notifications',
];

// API routes that should be cached for offline
const CACHEABLE_API_ROUTES = [
  '/api/favorites',
  '/api/collections',
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
          .filter((name) =>
            name !== STATIC_CACHE &&
            name !== DYNAMIC_CACHE &&
            name !== OFFLINE_CACHE
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'claude-insider-notification',
      renotify: true,
      data: {
        url: data.url || '/',
        ...data
      },
      actions: data.actions || [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Claude Insider', options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'close') return;

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (notificationData.url) {
              client.navigate(notificationData.url);
            }
            return;
          }
        }
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow(notificationData.url || '/');
        }
      })
  );
});

// Message handler for cache operations
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_PAGE':
      // Cache a specific page for offline reading
      if (payload?.url) {
        caches.open(OFFLINE_CACHE).then((cache) => {
          cache.add(payload.url).catch((err) => {
            console.warn('Failed to cache page:', payload.url, err);
          });
        });
      }
      break;

    case 'CACHE_PAGES':
      // Cache multiple pages
      if (payload?.urls && Array.isArray(payload.urls)) {
        caches.open(OFFLINE_CACHE).then((cache) => {
          cache.addAll(payload.urls).catch((err) => {
            console.warn('Failed to cache pages:', err);
          });
        });
      }
      break;

    case 'CLEAR_OFFLINE_CACHE':
      caches.delete(OFFLINE_CACHE);
      break;

    case 'GET_CACHE_STATUS':
      // Return cached URLs
      caches.open(OFFLINE_CACHE).then((cache) => {
        cache.keys().then((requests) => {
          const urls = requests.map((req) => req.url);
          event.source.postMessage({ type: 'CACHE_STATUS', urls });
        });
      });
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Fetch event - network-first for pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip Next.js internals (but not all API routes)
  if (url.pathname.startsWith('/_next')) {
    return;
  }

  // Handle cacheable API routes with stale-while-revalidate
  const isCacheableAPI = CACHEABLE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );
  if (isCacheableAPI) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });

          // Return cached if available, fetch in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Skip other API routes
  if (url.pathname.startsWith('/api')) {
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
        .catch(async () => {
          // Offline fallback - check all caches in priority order
          const offlineMatch = await caches.match(request, { cacheName: OFFLINE_CACHE });
          if (offlineMatch) return offlineMatch;

          const dynamicMatch = await caches.match(request, { cacheName: DYNAMIC_CACHE });
          if (dynamicMatch) return dynamicMatch;

          const staticMatch = await caches.match(request, { cacheName: STATIC_CACHE });
          if (staticMatch) return staticMatch;

          // Last resort - return the cached home page
          return caches.match('/');
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
