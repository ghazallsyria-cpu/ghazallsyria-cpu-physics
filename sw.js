
const CACHE_NAME = 'ssc-pwa-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap',
  'https://cdn-icons-png.flaticon.com/512/3209/3209120.png'
];

const SENSITIVE_PATHS = ['/billing', '/certificates', '/bank-digitizer', '/admin-financials', '/api/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Pre-cache warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
  );
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'المركز السوري للعلوم', body: 'تنبيه جديد من المساعد الذكي.' };
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3209/3209120.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3209/3209120.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './dashboard' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip sensitive or non-GET requests
  if (event.request.method !== 'GET' || SENSITIVE_PATHS.some(path => url.pathname.includes(path))) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return a basic offline fallback if possible
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});