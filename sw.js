const CACHE_NAME = 'expense-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  'https://cdn.jsdelivr.net/npm/chart.js', // External Chart.js library
  '/images/icon-192x192.png', 
  '/images/icon-512x512.png'
];

// Install event: Caches all necessary assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache).catch(err => {
            console.error('[Service Worker] Failed to cache resource:', err);
        });
      })
  );
});

// Fetch event: Tries to get content from the cache first, then the network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request).catch(() => {
            // Fallback for when network is unavailable (optional: serve a fallback page here)
            // console.log('[Service Worker] Fetch failed, no cached match.');
        });
      })
  );
});

// Activate event: Cleans up old caches (crucial for updating the PWA)
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of the page immediately
  return self.clients.claim();
});