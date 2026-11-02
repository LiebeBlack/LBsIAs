/* Nexo by LBs IAs — service worker.
   Guarda la interfaz y los assets estáticos para que la app abra sin conexión.
   Nunca cachea /api: las respuestas y las claves no se almacenan aquí. */

const VERSION = 'nexo-v3'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png']

/** Cachea el shell y descubre los assets con hash que referencia el HTML. */
async function precache() {
  const cache = await caches.open(VERSION)
  await Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))

  try {
    const response = await fetch('/index.html', { cache: 'reload' })
    if (!response.ok) return
    const html = await response.clone().text()
    await cache.put('/', response)
    const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g), (match) => match[1])
    await Promise.all(assets.map((url) => cache.add(url).catch(() => {})))
  } catch {
    // Sin red en la instalación: la caché en tiempo de ejecución lo cubrirá.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put('/', copy)).catch(() => {})
          return response
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match('/'))
          return (
            cached ||
            new Response('Sin conexión. Vuelve a abrir Nexo con internet una vez.', {
              status: 503,
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            })
          )
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {})
          }
          return response
        })
        .catch(() => new Response('', { status: 504, statusText: 'Offline' }))
    }),
  )
})
