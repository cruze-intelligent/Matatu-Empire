const CACHE_VERSION = 'matatu-empire-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './styles.css',
    './manifest.webmanifest',
    './game.js',
    './components/DashboardUI.js',
    './components/DriverMessages.js',
    './components/EventPopupUI.js',
    './components/MapUI.js',
    './components/WelcomeModal.js',
    './logic/Economy.js',
    './logic/EventManager.js',
    './logic/ProgressionManager.js',
    './logic/RouteManager.js',
    './logic/VehicleManager.js',
    './logic/WeatherManager.js',
    './data/routes.json',
    './data/vehicles.json',
    './assets/images/favicon.png',
    './assets/images/matatu_old.svg',
    './assets/images/matatu_sound.svg',
    './assets/pwa/apple-touch-icon.png',
    './assets/pwa/icon-192.png',
    './assets/pwa/icon-512.png',
    './assets/pwa/maskable-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, './offline.html'));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request, fallbackUrl) {
    const cache = await caches.open(CACHE_VERSION);

    try {
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        return cachedResponse || cache.match(fallbackUrl);
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cachedResponse = await cache.match(request);

    const networkPromise = fetch(request)
        .then(response => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cachedResponse || networkPromise || new Response('', { status: 504, statusText: 'Offline' });
}
