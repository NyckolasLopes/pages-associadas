const CACHE_NAME = 'fa-static-v6';

const IMMUTABLE_URLS = [
  '/favicon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(IMMUTABLE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Apenas esquemas HTTP/HTTPS
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Não intercepta chamadas dinâmicas, admin, painel, api ou supabase
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/painel-loja') ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase.co') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts'))
  ) {
    return;
  }

  // 1. Assets versionados e Google Fonts (Cache-First com fallback seguro)
  if (
    url.pathname.startsWith('/assets/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          if (cached) return cached;

          const response = await fetch(request);
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          return fetch(request);
        }
      })()
    );
    return;
  }

  // 2. Imagens locais e estáticas (Stale-While-Revalidate seguro)
  if (
    request.destination === 'image' ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          const networkFetch = fetch(request).then(async (response) => {
            if (response && response.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          }).catch(() => null);

          if (cached) return cached;
          const networkResponse = await networkFetch;
          if (networkResponse) return networkResponse;

          return fetch(request);
        } catch {
          return fetch(request);
        }
      })()
    );
    return;
  }
});
