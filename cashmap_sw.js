/**
 * CashMap — Service Worker
 * Para deploy en servidor propio (GitHub Pages, Netlify, etc.)
 * Coloca este archivo en la misma carpeta que index.html
 */

const CACHE_NAME = 'cashmap-v1.40';
const APP_SHELL  = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// ── Install: precachear shell de la app ──────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[CashMap SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[CashMap SW] Precaching app shell');
        return Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar cachés viejos + notificar clientes para recargar ───────
self.addEventListener('activate', event => {
  console.log('[CashMap SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)
            .map(k => { console.log('[CashMap SW] Removing old cache:', k); return caches.delete(k); })
        )
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Notificar a todos los clientes abiertos para que recarguen y obtengan el código nuevo
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clients => clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' })));
      })
  );
});

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Llamadas al backend de Apps Script → Network only (siempre fresco)
  if (url.hostname === 'script.google.com' ||
      url.hostname === 'script.googleusercontent.com' ||
      url.hostname.endsWith('.googleusercontent.com') ||
      url.search.includes('action=')) {
    event.respondWith(
      fetch(event.request, { redirect: 'follow' })
        .catch(() => new Response(
          JSON.stringify({ error: 'offline', message: 'Sin conexión al servidor' }),
          { headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // 2. Chart.js CDN → stale-while-revalidate
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // 3. index.html → Network first: siempre intenta red, cache solo si offline
  const isHtml = url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  if (event.request.method === 'GET' && isHtml) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 4. Resto de app shell (manifest, SW, etc.) → Cache first
  if (event.request.method === 'GET') {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

// ── Estrategias de cache ─────────────────────────────────────────────────────

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    const cached = await caches.match(request) || await caches.match('./index.html');
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    const fallback = await caches.match('./index.html');
    return fallback || new Response('Sin conexión', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise;
}

// ── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'cashmap-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }))
      )
    );
  }
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'CashMap', body: 'Tienes una notificación' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'CashMap', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-72.png',
      tag: 'cashmap-notification',
      renotify: true,
      data: data
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) { clients[0].focus(); return; }
      self.clients.openWindow('./');
    })
  );
});
