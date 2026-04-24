const CACHE_NAME = 'vn-trip-v4';
const urlsToCache = [
  './',
  './index.html',
  './app.jsx',
  './firebase-config.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // claim clients immediately
  );
});

self.addEventListener('fetch', event => {
  // Network first for app.jsx during development
  if (event.request.url.includes('app.jsx') || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for everything else
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
