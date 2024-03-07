const CACHE_NAME = 'handstack-v1';

const URLS_CACHE_ONLY = [
    '/css/tabler-icons.css',
    '/font/tabler-icons.eot',
    '/font/tabler-icons.ttf',
    '/font/tabler-icons.woff',
    '/font/tabler-icons.woff2',
];

const URLS_CACHE_FALLBACK = [
    '/index.html',
    '/css/syn.bundle.css',
    '/css/syn.bundle.min.css',
    '/js/syn.bundle.js',
    '/js/syn.bundle.min.js',
    '/js/syn.controls.js',
    '/js/syn.controls.min.js',
    '/js/syn.domain.js',
    '/js/syn.domain.min.js',
    '/js/syn.js',
    '/js/syn.loader.js',
    '/js/syn.loader.min.js',
    '/js/syn.min.js',
    '/js/syn.scripts.js',
    '/js/syn.scripts.min.js',
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS_CACHE_ONLY.concat(URLS_CACHE_FALLBACK));
        }).catch((err) => {
            console.error(err);
            return new Promise((resolve, reject) => {
                reject('ERROR: ' + err);
            });
        })
    );
});

self.addEventListener('fetch', function (event) {
    const requestURL = new URL(event.request.url);
    if (requestURL.pathname === '/') {
        event.respondWith(getByNetworkFallingBackByCache('/index.html'));
    }
    else if (URLS_CACHE_FALLBACK.includes(requestURL.pathname) == true) {
        event.respondWith(getByNetworkFallingBackByCache(event.request));
    }
    else if (URLS_CACHE_ONLY.includes(requestURL.pathname) == true) {
        event.respondWith(getByCacheOnly(event.request));
    }
    else if (requestURL.host === 'www.google-analytics.com') {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (CACHE_NAME !== cacheName && cacheName.startsWith('handstack-')) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

const getByNetworkFallingBackByCache = (request) => {
    return caches.open(CACHE_NAME).then((cache) => {
        return fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        })
        .catch(() => {
            return caches.match(request);
        });
    });
};

const getByCacheOnly = (request) => {
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
            return response;
        });
    });
};
