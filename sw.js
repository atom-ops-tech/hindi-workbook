// sw.js - Service Worker for the Hindi Learning App

// Define a name for our cache. Using a version number is a good practice.
const CACHE_NAME = 'hindi-audio-cache-v1';

// This is the fetch event handler, which is the core of our caching strategy.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // We only want to cache requests made to our TTS API endpoint.
  // We'll ignore all other requests (like to the main page or other assets).
  if (requestUrl.pathname === '/tts') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        // 1. Try to find a matching request in our cache.
        return cache.match(event.request).then((cachedResponse) => {
          // 2. If a cached version is found, return it immediately.
          if (cachedResponse) {
            console.log('Cache hit:', event.request.url);
            return cachedResponse;
          }

          // 3. If not found in cache, fetch it from the network.
          console.log('Cache miss, fetching from network:', event.request.url);
          return fetch(event.request).then((networkResponse) => {
            // 4. Once fetched, store a copy in the cache for next time.
            // We need to clone the response because it can only be consumed once.
            cache.put(event.request, networkResponse.clone());

            // 5. Return the network response to the app.
            return networkResponse;
          });
        });
      })
    );
  }
});
