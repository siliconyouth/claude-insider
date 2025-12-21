// Cache version - UPDATE THIS ON EACH DEPLOY to bust old caches
const CACHE_VERSION = 'v6';
const STATIC_CACHE = `claude-insider-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `claude-insider-dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `claude-insider-offline-${CACHE_VERSION}`;
const SYNC_DB_NAME = 'claude-insider-sync';
const SYNC_STORE_NAME = 'pending-requests';

// Background Sync Tags
const SYNC_TAGS = {
  FAVORITES: 'sync-favorites',
  RATINGS: 'sync-ratings',
  MESSAGES: 'sync-messages',
  PREFERENCES: 'sync-preferences',
};

// Static assets to cache immediately (shell)
const STATIC_ASSETS = [
  '/',
  '/docs',
  '/docs/getting-started',
  '/resources',
  '/search',
  '/manifest.json',
  '/favicon.ico',
  // All PWA icons
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-120x120.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-167x167.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  '/icons/safari-pinned-tab.svg',
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

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB Helpers for Background Sync
// ─────────────────────────────────────────────────────────────────────────────

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const store = db.createObjectStore(SYNC_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('tag', 'tag', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function addPendingRequest(tag, request) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);

    const data = {
      tag,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request._body || null,
      timestamp: Date.now(),
    };

    const addRequest = store.add(data);
    addRequest.onsuccess = () => resolve(addRequest.result);
    addRequest.onerror = () => reject(addRequest.error);
  });
}

async function getPendingRequests(tag) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const index = store.index('tag');
    const request = index.getAll(tag);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingRequest(id) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearPendingRequests(tag) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const index = store.index('tag');
    const cursorRequest = index.openCursor(IDBKeyRange.only(tag));

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Install event - cache static assets
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Background Sync Handler
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  // Handle different sync tags
  if (Object.values(SYNC_TAGS).includes(event.tag)) {
    event.waitUntil(processBackgroundSync(event.tag));
  }
});

async function processBackgroundSync(tag) {
  try {
    const pendingRequests = await getPendingRequests(tag);
    console.log(`[SW] Processing ${pendingRequests.length} pending requests for ${tag}`);

    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          await removePendingRequest(request.id);
          console.log(`[SW] Successfully synced request:`, request.url);

          // Notify client of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              tag,
              url: request.url,
            });
          });
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - remove from queue (don't retry)
          await removePendingRequest(request.id);
          console.warn(`[SW] Request failed with client error, removing:`, request.url);
        }
        // For 5xx errors, keep in queue for retry
      } catch (err) {
        console.warn(`[SW] Failed to sync request, will retry:`, request.url, err);
        // Keep in queue for next sync attempt
      }
    }
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
    throw err; // Throw to trigger retry
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncCachedContent());
  }
});

async function syncCachedContent() {
  try {
    // Refresh key cached pages
    const pagesToRefresh = [
      '/',
      '/docs',
      '/resources',
    ];

    for (const url of pagesToRefresh) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(url, response);
        }
      } catch (_err) {
        // Offline, skip
      }
    }
  } catch (err) {
    console.error('[SW] Periodic sync failed:', err);
  }
}

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

// Message handler for cache and sync operations
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

    // ─────────────────────────────────────────────────────────────────────────
    // Background Sync Messages
    // ─────────────────────────────────────────────────────────────────────────

    case 'QUEUE_SYNC':
      // Queue a request for background sync
      if (payload?.tag && payload?.request) {
        addPendingRequest(payload.tag, payload.request)
          .then(() => {
            // Register for background sync
            if (self.registration.sync) {
              return self.registration.sync.register(payload.tag);
            }
          })
          .then(() => {
            event.source?.postMessage({
              type: 'SYNC_QUEUED',
              tag: payload.tag,
            });
          })
          .catch((err) => {
            console.error('[SW] Failed to queue sync:', err);
            event.source?.postMessage({
              type: 'SYNC_QUEUE_ERROR',
              tag: payload.tag,
              error: err.message,
            });
          });
      }
      break;

    case 'GET_PENDING_SYNCS':
      // Return pending sync requests
      if (payload?.tag) {
        getPendingRequests(payload.tag)
          .then((requests) => {
            event.source?.postMessage({
              type: 'PENDING_SYNCS',
              tag: payload.tag,
              requests,
            });
          })
          .catch((err) => {
            console.error('[SW] Failed to get pending syncs:', err);
          });
      }
      break;

    case 'CLEAR_PENDING_SYNCS':
      // Clear pending sync requests for a tag
      if (payload?.tag) {
        clearPendingRequests(payload.tag)
          .then(() => {
            event.source?.postMessage({
              type: 'SYNCS_CLEARED',
              tag: payload.tag,
            });
          })
          .catch((err) => {
            console.error('[SW] Failed to clear pending syncs:', err);
          });
      }
      break;

    case 'TRIGGER_SYNC':
      // Manually trigger background sync (for testing or when coming online)
      if (payload?.tag && self.registration.sync) {
        self.registration.sync.register(payload.tag)
          .then(() => {
            event.source?.postMessage({
              type: 'SYNC_TRIGGERED',
              tag: payload.tag,
            });
          })
          .catch((err) => {
            console.error('[SW] Failed to trigger sync:', err);
          });
      }
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
