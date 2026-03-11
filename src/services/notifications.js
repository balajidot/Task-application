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

// Schedule task notifications for today's tasks
export async function scheduleTaskNotifications(tasks) {
  if (!isNotificationsSupported()) return;
  if (Notification.permission !== 'granted') return;

  const today = new Date().toDateString();
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.date).toDateString();
    return taskDate === today && task.startTime;
  });

  for (const task of todayTasks) {
    if (!task.startTime) continue;

    const [hours, minutes] = task.startTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);

    // Only schedule if task is in the future
    if (taskTime > new Date()) {
      const delay = taskTime.getTime() - Date.now();
      
      setTimeout(() => {
        showTaskNotification(task);
      }, delay);
    }
  }
}

// Show individual task notification
export async function showTaskNotification(task) {
  const title = `⏰ ${task.text}`;
  const body = `${task.text} (${task.startTime || "--:--"}-${task.endTime || "--:--"}) Starting!`;
  
  await showAppNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    tag: `task-${task.id}`,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open Task'
      }
    ],
    data: {
      taskId: task.id,
      taskText: task.text
    }
  });
}

// Request notification permission on app load
export async function initializeNotifications() {
  if (!isNotificationsSupported()) return 'unsupported';
  
  const permission = getNotificationPermission();
  if (permission === 'default') {
    const result = await requestNotificationPermission();
    return result;
  }
  
  return permission;
}

