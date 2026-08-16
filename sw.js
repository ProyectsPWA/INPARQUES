const CACHE_NAME = 'inparques-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './logo-inparques.webp',
  './MORROCOY.webp',
  './CANAIMA.webp',
  './WARAIRA.webp',
  './Isla_Larga_colorida.webp',
  './CAYOS.webp',
  './ESTEBAN.webp',
  './MOCHIMA.webp',
  './CAYOP.webp',
  './SOLANO.webp'
];

// Install Event: Pre-cache static shell & essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching PWA assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Deleting legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First strategy for images/assets, Stale-While-Revalidate for HTML/API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if request is an Image, Font, or Static Asset
  const isImageOrAsset = 
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com');

  if (isImageOrAsset) {
    // Cache-First Strategy for Instant Load & Offline Support
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {/* Offline fallback */});
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  } else {
    // Stale-While-Revalidate for App Shell & Navigation
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
