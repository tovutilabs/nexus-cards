const CACHE_NAME = 'nexus-cards-v2';
const STATIC_CACHE = 'nexus-static-v2';
const DYNAMIC_CACHE = 'nexus-dynamic-v2';
const IMAGE_CACHE = 'nexus-images-v2';
const TRANSLATION_CACHE = 'nexus-translations-v2';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/dashboard/cards',
  '/dashboard/contacts',
  '/dashboard/analytics',
  '/dashboard/nfc',
  '/dashboard/notifications',
];

const OFFLINE_QUEUE_KEY = 'nexus-offline-queue';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE &&
              name !== TRANSLATION_CACHE
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname.includes('/avatars/') ||
    url.pathname.includes('/uploads/')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.pathname.includes('/messages/') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirst(request, TRANSLATION_CACHE));
    return;
  }

  if (url.pathname.startsWith('/p/')) {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (url.pathname.startsWith('/dashboard')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed for cache-first:', error);
    throw error;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function networkFirstWithOffline(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log(
      '[SW] Network failed for public card, trying cache:',
      request.url
    );
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    console.log('[SW] No cache available, showing offline page');
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response(
      '<html><body><h1>Offline</h1><p>This card is not available offline.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function networkFirstWithCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed for dashboard, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        offline: true,
        message: 'You are currently offline. Some features may be unavailable.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Mode': 'true',
        },
      }
    );
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname.includes('/contacts')) {
    try {
      return await fetch(request.clone());
    } catch (error) {
      console.log('[SW] Queuing contact submission for later');
      await queueRequest(request.clone());

      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Saved offline. Will sync when connection is restored.',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Network request failed', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function queueRequest(request) {
  const db = await openDatabase();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');

  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  await store.add(requestData);
}

async function processQueue() {
  const db = await openDatabase();
  const tx = db.transaction('queue', 'readonly');
  const store = tx.objectStore('queue');
  const requests = await store.getAll();

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });

      if (response.ok) {
        const deleteTx = db.transaction('queue', 'readwrite');
        const deleteStore = deleteTx.objectStore('queue');
        await deleteStore.delete(req.id);
        console.log('[SW] Queued request processed:', req.url);
      }
    } catch (error) {
      console.log('[SW] Failed to process queued request, will retry later');
    }
  }
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'PROCESS_QUEUE') {
    processQueue().catch((err) => {
      console.error('[SW] Failed to process queue:', err);
    });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue());
  }
});
