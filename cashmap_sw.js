/**
 * CashMap — Service Worker
 * Para deploy en servidor propio (GitHub Pages, Netlify, etc.)
 * Coloca este archivo en la misma carpeta que index.html
 */

const CACHE_NAME = 'cashmap-v1.1';
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
        // addAll falla si algún recurso 404 — usar add individual para resiliencia
        return Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar cachés viejos ─────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[CashMap SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => { console.log('[CashMap SW] Removing old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Llamadas al backend de Apps Script → Network only (siempre fresco)
  // Incluye script.googleusercontent.com porque Apps Script redirige ahí
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

  // 2. Chart.js CDN → Cache first, revalidar en background (stale-while-revalidate)
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // 3. App shell (HTML, JS, CSS, manifest) → Cache first
  if (event.request.method === 'GET') {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

// ── Estrategias de cache ─────────────────────────────────────────────────────

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
    // Fallback: intentar index.html para rutas de la SPA
    const fallback = await caches.match('./index.html');
    return fallback || new Response('Sin conexión', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  // Revalidar en background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise;
}

// ── Background Sync (si el navegador lo soporta) ─────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'cashmap-sync') {
    console.log('[CashMap SW] Background sync triggered');
    event.waitUntil(
      // Notificar a la página activa para que intente guardar
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }))
      )
    );
  }
});

// ── Push notifications (esqueleto para futuro uso) ───────────────────────────
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
