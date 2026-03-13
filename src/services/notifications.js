// ✅ Unified Notification Service (Cleaned: Local Notifications Only)
const isCapacitor = () => typeof window !== 'undefined' && window.Capacitor !== undefined;

export function isNotificationsSupported() {
  if (isCapacitor()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

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
  return await Notification.requestPermission();
}

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
      
      // பழைய Notifications-ஐ நீக்குதல் (Clear pending)
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
          id: Math.floor(Math.random() * 100000), // Random ID
          schedule: { at: taskTime, allowWhileIdle: true }, // allowWhileIdle: true என்பது Doze mode-ஐத் தாண்டி அலாரம் அடிக்க வைக்கும்
          sound: 'default',
          extra: { taskId: task.id }
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`✅ Scheduled ${notifications.length} exact local notifications`);
      }
    } catch (error) {
      console.error('Capacitor exact schedule failed:', error);
    }
  } else {
    // PWA Browser Fallback Logic
    if (Notification.permission !== 'granted') return;
    for (const task of todayTasks) {
      const taskTime = parseTaskTime(task.startTime);
      if (!taskTime || taskTime <= new Date()) continue;
      const delay = taskTime.getTime() - Date.now();
      setTimeout(() => new Notification(`⏰ ${task.text}`, { body: 'Starting Now!' }), delay);
    }
  }
}

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

export async function initializeNotifications() {
  return await requestNotificationPermission();
}