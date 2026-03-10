export function isNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationsSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export async function showAppNotification(title, options = {}) {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const finalOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg?.showNotification) {
        await reg.showNotification(title, finalOptions);
        return true;
      }
    }
  } catch {}

  try {
    // Fallback for normal browser tabs.
    // (In some browsers, service worker notifications may not be available.)
    new Notification(title, finalOptions);
    return true;
  } catch {
    return false;
  }
}

