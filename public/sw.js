/**
 * Service Worker for Hackpact
 * Handles Web Push notifications and offline caching.
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `hackpact-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `hackpact-dynamic-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// ── Install: cache static shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// ── Fetch: network-first for API, cache-first for static ─────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return
  }

  // API requests: network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Static _next assets: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
            return response
          }),
      ),
    )
    return
  }

  // Everything else: network-first with dynamic cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone))
        return response
      })
      .catch(() => caches.match(request)),
  )
})

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Hackpact', body: event.data.text() }
  }

  const { title = 'Hackpact', body = '', url = '/', icon, badge } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? '/icons/icon-192x192.png',
      badge: badge ?? '/icons/badge-72x72.png',
      data: { url },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }),
  )
})

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existingClient = clientList.find((c) => c.url.includes(self.location.origin))
        if (existingClient) {
          existingClient.focus()
          existingClient.navigate(url)
        } else {
          clients.openWindow(url)
        }
      }),
  )
})
