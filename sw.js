const CACHE = 'natgaswx-v15';
const STATIC = [
  '/Natgas-Weather/',
  '/Natgas-Weather/index.html',
  '/Natgas-Weather/manifest.json',
  '/Natgas-Weather/icon-192.png',
  '/Natgas-Weather/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(STATIC).catch(err => console.warn('SW install (non-fatal):', err))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('archive-api')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(cached =>
            cached || new Response(JSON.stringify({ error: 'offline' }), {
              headers: { 'Content-Type': 'application/json' }
            })
          )
        )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
