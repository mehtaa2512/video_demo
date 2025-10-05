self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

const CACHE_NAME = 'video-cache-v1'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/videos/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const resp = await fetch(event.request)
        if (resp && resp.status === 200) {
          cache.put(event.request, resp.clone())
        }
        return resp
      })
    )
  }
})


