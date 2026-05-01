// sw.js
const CACHE_NAME = 'recall-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/modules/haptics.js',
  '/modules/storage.js',
  '/modules/bridges.js',
  '/modules/parser.js',
  '/modules/recorder.js',
  '/modules/scheduler.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'send' && data && data.bridgeUrl) {
      // User clicked "Send", instantly open the deep link
      event.waitUntil(clients.openWindow(data.bridgeUrl));
      return;
  }

  const targetUrl = (data && data.url) ? data.url : '/#intents';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(client.url.split('#')[0] + targetUrl.replace('/', ''));
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
