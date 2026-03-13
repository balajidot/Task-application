// ✅ Unified Notification Service (Cleaned: Local Notifications Only)
// Works for: PWA Browser + Capacitor Android APK

const isCapacitor = () => 
  typeof window !== 'undefined' && window.Capacitor !== undefined;

// ✅ 1. Check if notifications are supported
export function isNotificationsSupported() {
  if (isCapacitor()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

// ✅ 2. Get current permission state (FIXED: Missing function added)
export function getNotificationPermission() {
  if (isCapacitor()) return 'capacitor';
  if (!isNotificationsSupported()) return 'unsupported';
  return typeof Notification !== 'undefined' ? Notification.permission : 'default';
}

// ✅ 3. Request permission
export async function requestNotificationPermission() {
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permResult = await LocalNotifications.requestPermissions();
      return permResult.display === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.error('Local Notification Permission Error:', error);
      return 'denied';
    }
  }
  
  if (!isNotificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

// ✅ 4. Initialize on app load
export async function initializeNotifications() {
  const perm = await requestNotificationPermission();
  return perm;
}

// ✅ 5. Show immediate notification (FIXED: Missing function added)
export async function showAppNotification(title, options = {}) {
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
          schedule: { allowWhileIdle: true }
        }]
      });
      return true;
    } catch (error) {
      console.error('Capacitor notification failed:', error);
      return false;
    }
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
    return true;
  }
  return false;
}

// ✅ 6. Schedule daily task reminders
export async function scheduleTaskNotifications(tasks) {
  if (!isNotificationsSupported()) return;

  const todayStr = getTodayKey();
  const todayTasks = tasks.filter(task => {
    if (!task.startTime || task.done || (task.doneOn && task.doneOn[todayStr])) return false;
    const taskDateKey = task.date || todayStr;
    return taskDateKey === todayStr;
  });

  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const notifications = [];
      for (const task of todayTasks) {
        const taskTime = parseTaskTime(task.startTime);
        if (!taskTime || taskTime <= new Date()) continue;

        notifications.push({
          title: `⏰ ${task.text}`,
          body: `${task.startTime} - ${task.endTime || ''} | Starting Now!`,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: taskTime, allowWhileIdle: true },
          sound: 'default',
          extra: { taskId: task.id }
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`✅ Scheduled ${notifications.length} exact local notifications`);
      }
    } catch (error) {
      console.error('Capacitor schedule failed:', error);
    }
  } else {
    // PWA Fallback
    if (Notification.permission !== 'granted') return;
    for (const task of todayTasks) {
      const taskTime = parseTaskTime(task.startTime);
      if (!taskTime || taskTime <= new Date()) continue;
      const delay = taskTime.getTime() - Date.now();
      setTimeout(() => new Notification(`⏰ ${task.text}`, { body: 'Starting Now!' }), delay);
    }
  }
}

// Helpers
function parseTaskTime(timeStr) {
  if (!timeStr) return null;
  try {
    let [hours, minutes] = timeStr.trim().split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    return taskTime;
  } catch { return null; }
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}