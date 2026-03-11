const CACHE_NAME = 'task-planner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Service Worker
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // Focus on existing window if available
      for (const client of clientList) {
        if (client.url.includes('task-application') && 'focus' in client) {
          // Navigate to Tasks tab and focus
          return client.focus().then(() => {
            // Send message to client to navigate to Tasks tab
            client.postMessage({
              type: 'NAVIGATE_TO_TASKS',
              taskId: event.notification.data?.taskId
            });
          });
        }
      }
      
      // Open new window with Tasks tab
      if (clients.openWindow) {
        return clients.openWindow('/?view=tasks');
      }
    })
  );
});

// Push Notification Handler (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New task notification!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Task Planner', options)
  );
});
