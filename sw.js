const CACHE_NAME = 'video-cache-v2'
const VIDEO_URL = 'https://storage.googleapis.com/engage360_signage_trial/e360_Signage_Video/Final%20Reel_3.mp4'

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker activated')
      return clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Cache the video from Google Storage
  if (url.href === VIDEO_URL || url.href.includes('Final%20Reel_3.mp4')) {
    // Use cache-first strategy for video caching
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        
        // Try cache first - check for exact match
        let cachedResponse = await cache.match(event.request)
        
        // If no exact match, try matching by URL only (ignore headers like Range, etc.)
        if (!cachedResponse) {
          // Create a request without headers for matching
          const urlOnlyRequest = new Request(event.request.url, {
            method: 'GET',
            mode: event.request.mode,
            credentials: event.request.credentials
          })
          cachedResponse = await cache.match(urlOnlyRequest)
        }
        
        if (cachedResponse) {
          console.log('✅ Serving video from Service Worker cache')
          
          // Handle range requests properly
          const rangeHeader = event.request.headers.get('range')
          if (rangeHeader && cachedResponse.status === 200) {
            // If we have a full video cached but request wants a range, serve the range
            const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/)
            if (rangeMatch) {
              const start = parseInt(rangeMatch[1], 10)
              const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined
              
              // Get the full video body
              const fullBody = await cachedResponse.arrayBuffer()
              const totalLength = fullBody.byteLength
              const endByte = end !== undefined ? Math.min(end, totalLength - 1) : totalLength - 1
              const contentLength = endByte - start + 1
              
              // Create range response
              const rangeBody = fullBody.slice(start, endByte + 1)
              const headers = new Headers(cachedResponse.headers)
              headers.set('Content-Range', `bytes ${start}-${endByte}/${totalLength}`)
              headers.set('Content-Length', contentLength.toString())
              headers.set('Accept-Ranges', 'bytes')
              
              return new Response(rangeBody, {
                status: 206,
                statusText: 'Partial Content',
                headers: headers
              })
            }
          }
          
          // Return cached response as-is
          return cachedResponse
        }
        
        // If not in cache, fetch from network
        console.log('🌐 Fetching video from network')
        try {
          const networkResponse = await fetch(event.request.clone())
          
          // Cache successful responses (200 = full, 206 = partial/range)
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
            // Only cache if response is not opaque (has proper CORS headers)
            if (networkResponse.type !== 'opaque') {
              // Always cache the full video request (without range headers) for better matching
              const fullVideoRequest = new Request(event.request.url, {
                method: 'GET',
                mode: event.request.mode,
                credentials: event.request.credentials
              })
              
              // Cache both the original request and the full video request
              await cache.put(event.request.clone(), networkResponse.clone())
              
              // If this was a full request (status 200), also cache it as the "full video"
              if (networkResponse.status === 200) {
                await cache.put(fullVideoRequest, networkResponse.clone())
              }
              
              console.log('💾 Video cached successfully')
            } else {
              console.warn('⚠️ Cannot cache opaque response (CORS issue)')
            }
          }
          
          return networkResponse
        } catch (error) {
          console.error('❌ Failed to fetch video:', error)
          throw error
        }
      })()
    )
    return
  }
  
  // Also handle local videos
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


