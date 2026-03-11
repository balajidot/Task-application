importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Initialize OneSignal Service Worker
importScripts('https://cdn.onesignal.com/sdks/OneSignalPageSDKES6.js');

// Handle push notifications
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.contents ? data.contents.en : 'Task notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open Task'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.headings ? data.headings.en : 'Task Planner', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || 'https://task-application-sigma.vercel.app?view=tasks';
  
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // Focus on existing window if available
      for (const client of clientList) {
        if (client.url.includes('task-application') && 'focus' in client) {
          return client.focus().then(() => {
            client.postMessage({
              type: 'NAVIGATE_TO_TASKS',
              taskId: event.notification.data.taskId
            });
          });
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
