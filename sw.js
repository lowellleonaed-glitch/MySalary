/**
 * SalaryHub Service Worker - Offline PWA Support
 * Version 1.0.0
 */

const CACHE_NAME = 'salaryhub-v31';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './manifest.webmanifest',
    './favicon.ico',
    './favicon.svg',
    './favicon-32x32.png',
    './favicon-16x16.png',
    './apple-touch-icon.png',
    './apple-touch-icon-precomposed.png',
    './icon-192.png',
    './icon-512.png',
    '/favicon.svg',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/icon-192.png',
    '/icon-512.png',
    './icons/favicon.png',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    './icons/apple-touch-icon-180x180.png',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap'
];

// 1. Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[ServiceWorker] Pre-caching offline assets');
            // Cache local assets reliably
            for (const url of STATIC_ASSETS) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn(`[ServiceWorker] Could not pre-cache: ${url}`, err);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate Event - Clean Up Outdated Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[ServiceWorker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event - Stale-While-Revalidate / Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // For same-origin resources & CDN libraries
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // If network fails and no cache, fallback for html navigation
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html', { ignoreSearch: true });
                    }
                });

            // Return cached response immediately if exists, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
