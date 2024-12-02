const CACHE_NAME = 'handstack-v2';

const URLS_CACHE_ONLY = [
    '/lib/tabler-icons-webfont/dist/tabler-icons.css',
    '/font/tabler-icons.eot',
    '/font/tabler-icons.ttf',
    '/font/tabler-icons.woff',
    '/font/tabler-icons.woff2',
    '/css/syn.bundle.css',
    '/css/syn.bundle.min.css',
    '/js/syn.bundle.js',
    '/js/syn.bundle.min.js',
    '/js/syn.controls.js',
    '/js/syn.controls.min.js',
    '/js/syn.scripts.js',
    '/js/syn.scripts.min.js',
];

const URLS_CACHE_FALLBACK = [
    '/index.html',
    '/js/syn.domain.js',
    '/js/syn.domain.min.js',
    '/js/syn.js',
    '/js/syn.min.js',
    '/js/syn.loader.js',
    '/js/syn.loader.min.js',
];

self.addEventListener('install', function (event) {
    console.log('install');
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
    console.log('fetch');
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
    console.log('activate');
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
    console.log('getByNetworkFallingBackByCache');
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
    console.log('getByCacheOnly');
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
            return response;
        });
    });
};
