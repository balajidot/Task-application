// ✅ Unified Notification Service
// Works for: PWA Browser + Capacitor Android APK

// ✅ Detect Capacitor (native APK)
const isCapacitor = () =>
  typeof window !== 'undefined' &&
  window.Capacitor !== undefined;

// ✅ Check support
export function isNotificationsSupported() {
  if (isCapacitor()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

// ✅ Get permission
export function getNotificationPermission() {
  if (isCapacitor()) return 'capacitor';
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission;
}

// ✅ Request permission - PWA + Capacitor
export async function requestNotificationPermission() {
  // --- CAPACITOR APK ---
  if (isCapacitor()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Request push permission
      const result = await PushNotifications.requestPermissions();

      if (result.receive === 'granted') {
        await PushNotifications.register();

        PushNotifications.addListener('registration', (token) => {
          console.log('✅ FCM Token:', token.value);
          localStorage.setItem('fcmToken', token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('FCM Registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('📱 Push received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const taskId = action.notification.data?.taskId;
          if (taskId) {
            window.dispatchEvent(new CustomEvent('navigateToTask', {
              detail: { taskId }
            }));
          }
        });

        // Also request local notification permission
        await LocalNotifications.requestPermissions();

        return 'granted';
      }
      return 'denied';
    } catch (error) {
      console.error('Capacitor notification setup failed:', error);
      return 'denied';
    }
  }

  // --- PWA BROWSER ---
  if (!isNotificationsSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

// ✅ Show notification - PWA + Capacitor
export async function showAppNotification(title, options = {}) {
  // --- CAPACITOR ---
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body: options.body || '',
          id: Math.floor(Math.random() * 100000),
          sound: 'default',
          extra: options.data || {},
          actionTypeId: '',
        }]
      });
      return true;
    } catch (error) {
      console.error('Capacitor local notification failed:', error);
      return false;
    }
  }

  // --- PWA BROWSER ---
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
    new Notification(title, finalOptions);
    return true;
  } catch {
    return false;
  }
}

// ✅ Parse time string - supports "08:30" and "08:30 AM"
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

// ✅ Get today's date key in YYYY-MM-DD (same format as app's todayKey())
function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ✅ Check if a task is done — handles both one-time (task.done) and repeat (task.doneOn)
function isTaskDoneToday(task, todayStr) {
  if (task.repeat && task.repeat !== 'None') {
    return !!(task.doneOn && task.doneOn[todayStr]);
  }
  return !!task.done;
}

// ✅ Schedule ALL today's task notifications
export async function scheduleTaskNotifications(tasks) {
  if (!isNotificationsSupported()) return;

  // 🔥 FIX 3: Use local YYYY-MM-DD key (no UTC timezone shift bug)
  const todayStr = getTodayKey();

  const todayTasks = tasks.filter(task => {
    if (!task.startTime) return false;
    // 🔥 FIX 2: Use task.done / task.doneOn — NOT task.completed (wrong field!)
    if (isTaskDoneToday(task, todayStr)) return false;
    // 🔥 FIX 3: Compare YYYY-MM-DD directly — no new Date() UTC parse bug
    const taskDateKey = task.date || todayStr;
    return taskDateKey === todayStr;
  });

  // --- CAPACITOR: Local Notifications ---
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Cancel pending
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const notifications = [];
      for (const task of todayTasks) {
        const taskTime = parseTaskTime(task.startTime);
        if (!taskTime || taskTime <= new Date()) continue;

        const idStr = (task.id || '').toString();
        const numId = Math.abs(
          idStr.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0)
        ) % 100000 || Math.floor(Math.random() * 100000);

        notifications.push({
          title: `⏰ ${task.text}`,
          body: `${task.startTime} - ${task.endTime || ''} | Starting Now!`,
          id: numId,
          schedule: { at: taskTime },
          sound: 'default',
          extra: { taskId: task.id },
          actionTypeId: '',
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`✅ Scheduled ${notifications.length} local notifications`);
      }
      return;
    } catch (error) {
      console.error('Capacitor schedule failed:', error);
    }
  }

  // --- PWA BROWSER: setTimeout ---
  if (Notification.permission !== 'granted') return;

  for (const task of todayTasks) {
    const taskTime = parseTaskTime(task.startTime);
    if (!taskTime || taskTime <= new Date()) continue;

    const delay = taskTime.getTime() - Date.now();
    setTimeout(() => showTaskNotification(task), delay);
  }
}

// ✅ Show individual task notification
export async function showTaskNotification(task) {
  const title = `⏰ ${task.text}`;
  const body = `${task.startTime || '--:--'} - ${task.endTime || '--:--'} | Starting Now!`;

  await showAppNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    tag: `task-${task.id}`,
    requireInteraction: true,
    data: { taskId: task.id, taskText: task.text }
  });
}

// ✅ Initialize on app load
export async function initializeNotifications() {
  if (!isNotificationsSupported()) return 'unsupported';

  if (isCapacitor()) {
    return await requestNotificationPermission();
  }

  const permission = getNotificationPermission();
  if (permission === 'default') {
    return await requestNotificationPermission();
  }
  return permission;
}