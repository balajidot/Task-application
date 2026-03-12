// ✅ OneSignal Push Notification Service
// No REST API Key needed - Client side only!

const ONE_SIGNAL_APP_ID = 'f98c4786-2104-4f35-936c-7b810f1d13ca';
const PWA_URL = 'https://task-application-sigma.vercel.app';

// ✅ Initialize OneSignal v16
export async function initializeOneSignal() {
  if (typeof window === 'undefined') return false;

  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        welcomeNotification: { disable: true },
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });

      // Auto request permission
      await OneSignal.Notifications.requestPermission();
      console.log('✅ OneSignal initialized!');
    });

    return true;
  } catch (error) {
    console.error('OneSignal init failed:', error);
    return false;
  }
}

// ✅ Schedule task notifications using setTimeout
export async function scheduleTaskNotifications(tasks) {
  if (typeof window === 'undefined') return false;

  try {
    const today = new Date().toDateString();

    const todayTasks = tasks.filter(task => {
      if (!task.startTime || task.completed) return false;
      const taskDate = task.date
        ? new Date(task.date).toDateString()
        : today;
      return taskDate === today;
    });

    let scheduled = 0;
    for (const task of todayTasks) {
      const taskTime = parseTaskTime(task.startTime);
      if (!taskTime || taskTime <= new Date()) continue;

      const delay = taskTime.getTime() - Date.now();
      setTimeout(() => {
        showOneSignalNotification(task);
      }, delay);

      scheduled++;
    }

    console.log(`✅ Scheduled ${scheduled} notifications`);
    return true;
  } catch (error) {
    console.error('Schedule failed:', error);
    return false;
  }
}

// ✅ Show notification via Service Worker
async function showOneSignalNotification(task) {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg?.showNotification) {
        await reg.showNotification(`⏰ ${task.text}`, {
          body: `${task.startTime} - ${task.endTime || ''} | Starting Now!`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `task-${task.id}`,
          requireInteraction: true,
          data: {
            taskId: task.id,
            url: `${PWA_URL}?taskId=${task.id}`
          },
          actions: [
            { action: 'open', title: '✅ Open Task' }
          ]
        });
      }
    }
  } catch (error) {
    console.error('Show notification failed:', error);
  }
}

// ✅ Parse time - supports "08:30" and "08:30 AM"
function parseTaskTime(timeStr) {
  if (!timeStr) return null;
  try {
    let hours, minutes;
    const str = timeStr.trim();

    if (str.includes('AM') || str.includes('PM')) {
      const [time, period] = str.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    } else {
      [hours, minutes] = str.split(':').map(Number);
    }

    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    return taskTime;
  } catch {
    return null;
  }
}

// ✅ Handle notification click → navigate to task
export function setupNotificationClickHandler() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function(OneSignal) {
    OneSignal.Notifications.addEventListener('click', function(event) {
      const data = event.notification.additionalData;
      if (data?.taskId) {
        window.location.href = `${PWA_URL}?taskId=${data.taskId}`;
      }
    });
  });
}

// ✅ Check if user subscribed
export async function isUserSubscribed() {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        const isSubscribed = OneSignal.User.PushSubscription.optedIn;
        resolve(!!isSubscribed);
      } catch {
        resolve(false);
      }
    });
  });
}

// ✅ Request permission manually
export async function requestOneSignalPermission() {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.Notifications.requestPermission();
        resolve('granted');
      } catch {
        resolve('denied');
      }
    });
  });
}
