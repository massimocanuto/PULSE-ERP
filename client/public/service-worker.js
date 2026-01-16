// Service Worker per PULSE ERP PWA
// Versione: 1.0.0

const CACHE_VERSION = 'pulse-erp-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Risorse da cachare immediatamente
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
];

// Installazione: pre-cache delle risorse statiche
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );

    // Forza l'attivazione immediata
    self.skipWaiting();
});

// Attivazione: pulizia cache vecchie
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating new service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('pulse-erp-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );

    // Prendi il controllo immediatamente
    return self.clients.claim();
});

// Fetch: gestione richieste network/cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignora richieste non-GET e request per domini esterni (tranne API)
    if (request.method !== 'GET' || (url.origin !== self.location.origin && !url.pathname.startsWith('/api'))) {
        return;
    }

    // Strategia per API: Network-first con fallback alla cache
    if (url.pathname.startsWith('/api')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }

    // Strategia per assets statici: Cache-first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // Strategia default per tutto il resto: Network-first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Strategia Cache-First (per assets statici)
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache-first strategy failed:', error);
        return await caches.match('/offline.html') || new Response('Offline');
    }
}

// Strategia Network-First (per contenuti dinamici e API)
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Network request failed, trying cache:', error);

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Se è una richiesta API, restituisci un json di errore
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({ error: 'Offline - unable to fetch data' }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                }
            );
        }

        // Altrimenti, mostra pagina offline
        return await caches.match('/offline.html') || new Response('Offline');
    }
}

// Verifica se è un asset statico
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Messaggi dal client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

// Background sync (se supportato)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(performDataSync());
    }
});

async function performDataSync() {
    try {
        console.log('[SW] Performing background data sync...');
        // Qui puoi implementare la sincronizzazione dei dati
        // Questo sarà chiamato quando la connessione è ripristinata
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

console.log('[SW] Service Worker loaded');
