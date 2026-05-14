const CACHE_NAME = 'congen-v7.0.0-cache';

// Only caching the absolute minimum shell for offline fallback
const URLS_TO_CACHE = [
    './',
    './index.html',
    './css/congen.css',
    './js/congen.js',
    './js/congen-core.js',
    './js/congen-ui.js',
    './js/congen-omni.js',
    './js/congen-export.js',
    './js/congen-renderer.js',
    './js/congen-storage.js',
    './js/congen-bug-report.js'
];

// Install Event: Cache the essential files
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(URLS_TO_CACHE))
    );
});

// Activate Event: Clean up old caches when the version bumps
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-First Strategy
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If the network fetch is successful, update the cache silently
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline, fallback to the cache
                return caches.match(event.request);
            })
    );
});
