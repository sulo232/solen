/**
 * sw.js — Solen PWA Service Worker
 *
 * Caching strategy (tiered):
 *  1. App shell (HTML, CSS, JS)  → Stale-While-Revalidate
 *     Serves the cached version immediately, updates cache in background.
 *  2. Images                     → Cache-First (long TTL)
 *     Static images rarely change; serve from cache, fetch only on miss.
 *  3. API / Supabase             → Network-Only (never cache auth/data calls)
 *  4. Navigation (HTML)          → Network-First with offline fallback
 *
 * Cache versioning: bump CACHE_VERSION on every deploy to invalidate old caches.
 */

const CACHE_VERSION  = 'solen-v8';
const SHELL_CACHE    = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE    = `${CACHE_VERSION}-images`;
const OFFLINE_URL    = '/offline.html';

/** Assets to pre-cache on install (app shell). */
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  OFFLINE_URL,
];

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use `cache.addAll` with ignoreSearch to avoid busting shell on query params
      cache.addAll(SHELL_ASSETS).catch(() => {
        // If offline.html doesn't exist yet, skip it silently
        return cache.addAll(SHELL_ASSETS.filter((url) => url !== OFFLINE_URL));
      })
    ).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate — clean up old versioned caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — tiered strategy
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never cache: Supabase, external APIs, analytics
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager')
  ) {
    return; // fall through to browser default (network)
  }

  // Images → Cache-First
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Navigation (HTML page loads) → Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // App shell assets (JS, CSS, fonts) → Stale-While-Revalidate
  if (isSameOrigin(url)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // External resources (CDN: Leaflet, fonts) → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

// ---------------------------------------------------------------------------
// Strategy implementations
// ---------------------------------------------------------------------------

/** Cache-First: serve from cache; fetch and cache on miss. */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/** Stale-While-Revalidate: serve cached immediately; update cache in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache   = await caches.open(cacheName);
  const cached  = await cache.match(request);

  // Fetch in background regardless
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

/** Network-First: try network, fall back to cached, then offline page. */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline fallback
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head>' +
      '<body style="font-family:sans-serif;text-align:center;padding:40px">' +
      '<h1>Du bist offline</h1>' +
      '<p>Bitte \u00fcberpr\u00fcfe deine Internetverbindung und lade die Seite neu.</p>' +
      '<button onclick="location.reload()" style="padding:10px 20px;margin-top:16px;cursor:pointer">Neu laden</button>' +
      '</body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isImageRequest(request) {
  const dest = request.destination;
  if (dest === 'image') return true;
  const ext = new URL(request.url).pathname.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico', 'avif'].includes(ext);
}

function isSameOrigin(url) {
  return url.origin === location.origin;
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { return; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'solen', {
      body:    data.body  || '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      tag:     data.tag   || 'solen-notification',
      data:    data,
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
