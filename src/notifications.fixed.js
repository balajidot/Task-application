const isCapacitor = () =>
  typeof window !== 'undefined' && window.Capacitor !== undefined;

const MAX_NOTIFICATION_ID = 2147483647;
const electronIpc = (() => {
  try {
    return window.require?.('electron')?.ipcRenderer ?? null;
  } catch {
    return null;
  }
})();

function toStableNotificationId(taskId) {
  const numericId = Number(taskId);
  if (Number.isInteger(numericId) && numericId !== 0) {
    return Math.abs(numericId) % MAX_NOTIFICATION_ID || 1;
  }

  const raw = String(taskId ?? '');
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % MAX_NOTIFICATION_ID || 1;
}

async function ensureCapacitorNotificationAccess(LocalNotifications) {
  const permissionState = await LocalNotifications.requestPermissions();
  const enabledState = await LocalNotifications.areEnabled();

  let exactAlarm = 'granted';
  if (typeof LocalNotifications.checkExactNotificationSetting === 'function') {
    const exactAlarmState = await LocalNotifications.checkExactNotificationSetting();
    exactAlarm = exactAlarmState?.exact_alarm ?? 'granted';
  }

  return {
    display: permissionState?.display ?? 'denied',
    enabled: enabledState?.value ?? false,
    exactAlarm,
  };
}

function goalVisibleOn(goal, key) {
  if (goal.repeat === 'Daily') return key >= goal.date;
  if (goal.repeat === 'Weekly') {
    return key >= goal.date && new Date(`${goal.date}T00:00:00`).getDay() === new Date(`${key}T00:00:00`).getDay();
  }
  if (goal.repeat === 'Monthly') {
    return key >= goal.date && new Date(`${goal.date}T00:00:00`).getDate() === new Date(`${key}T00:00:00`).getDate();
  }
  return (goal.date || key) === key;
}

function isTaskDone(goal, key) {
  return goal.repeat === 'None' ? !!goal.done : !!goal.doneOn?.[key];
}

function buildNotificationEntries(task, todayStr, exactAlarmEnabled = true) {
  const entries = [];
  const reminderTime = parseTaskTime(task.reminder, task.date || todayStr);
  const startTime = parseTaskTime(task.startTime, task.date || todayStr);

  if (reminderTime && reminderTime > new Date()) {
    entries.push({
      title: 'Task Reminder',
      body: task.endTime
        ? `${task.text} | ${task.startTime || task.reminder} - ${task.endTime}`
        : `${task.text} | ${task.startTime || task.reminder}`,
      id: toStableNotificationId(`${task.id}-reminder`),
      schedule: {
        at: reminderTime,
        allowWhileIdle: true,
        exact: exactAlarmEnabled,
      },
      sound: 'default',
      autoCancel: true,
      extra: {
        taskId: task.id,
        taskDate: task.date || todayStr,
        notificationType: 'reminder',
      },
    });
  }

  if (startTime && startTime > new Date() && (!reminderTime || startTime.getTime() !== reminderTime.getTime())) {
    entries.push({
      title: 'Task Starting Now',
      body: task.endTime
        ? `${task.text} | ${task.startTime} - ${task.endTime}`
        : `${task.text} | ${task.startTime}`,
      id: toStableNotificationId(`${task.id}-start`),
      schedule: {
        at: startTime,
        allowWhileIdle: true,
        exact: exactAlarmEnabled,
      },
      sound: 'default',
      autoCancel: true,
      extra: {
        taskId: task.id,
        taskDate: task.date || todayStr,
        notificationType: 'start',
      },
    });
  }

  return entries;
}

export function isNotificationsSupported() {
  if (isCapacitor()) return true;
  if (electronIpc) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (isCapacitor()) return 'capacitor';
  if (electronIpc) return 'granted';
  if (!isNotificationsSupported()) return 'unsupported';
  return typeof Notification !== 'undefined' ? Notification.permission : 'default';
}

export async function requestNotificationPermission() {
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const access = await ensureCapacitorNotificationAccess(LocalNotifications);
      if (access.exactAlarm === 'denied' && typeof LocalNotifications.changeExactNotificationSetting === 'function') {
        await LocalNotifications.changeExactNotificationSetting();
      }
      return access.display === 'granted' && access.enabled ? 'granted' : 'denied';
    } catch (error) {
      console.error('Local notification permission error:', error);
      return 'denied';
    }
  }

  if (electronIpc) return 'granted';
  if (!isNotificationsSupported()) return 'unsupported';

  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

export async function initializeNotifications() {
  if (electronIpc) return 'granted';
  if (!isCapacitor()) return requestNotificationPermission();

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const access = await ensureCapacitorNotificationAccess(LocalNotifications);

    if (access.exactAlarm === 'denied') {
      console.warn('Exact alarms are disabled in Android settings. Terminated-state reminders may not fire exactly on time.');
    }

    return access.display === 'granted' && access.enabled ? 'granted' : 'denied';
  } catch (error) {
    console.error('Notification initialization failed:', error);
    return 'denied';
  }
}

export async function showAppNotification(title, options = {}) {
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options.body || '',
            id: toStableNotificationId(options.id ?? Date.now()),
            sound: 'default',
            extra: options.data || {},
            schedule: {
              at: new Date(Date.now() + 250),
              allowWhileIdle: true,
              exact: true,
            },
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Capacitor notification failed:', error);
      return false;
    }
  }

  if (electronIpc) {
    electronIpc.send('notify-next-task', { text: title, time: options.body || '' });
    return true;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
    return true;
  }

  return false;
}

export async function scheduleTaskNotifications(tasks) {
  if (!isNotificationsSupported()) return;

  const todayStr = getTodayKey();
  const todayTasks = tasks.filter((task) => {
    if (!task || isTaskDone(task, todayStr)) return false;
    if (!goalVisibleOn(task, todayStr)) return false;
    return Boolean(task.reminder || task.startTime);
  });

  electronIpc?.send?.('schedule-reminders', todayTasks);

  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const access = await ensureCapacitorNotificationAccess(LocalNotifications);

      if (access.display !== 'granted' || !access.enabled) {
        console.warn('Local notifications are not enabled. Skipping scheduled reminder refresh.');
        return;
      }

      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const notifications = todayTasks.flatMap((task) => buildNotificationEntries(task, todayStr, access.exactAlarm !== 'denied'));

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.error('Capacitor schedule failed:', error);
    }

    return;
  }

  if (electronIpc || Notification.permission !== 'granted') return;

  for (const task of todayTasks) {
    const entries = buildNotificationEntries(task, todayStr, true);
    entries.forEach((entry) => {
      const delay = entry.schedule.at.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => new Notification(entry.title, { body: entry.body }), delay);
      }
    });
  }
}

function parseTaskTime(timeStr, dateKey = getTodayKey()) {
  if (!timeStr) return null;

  try {
    let hours;
    let minutes;
    const str = String(timeStr).trim().toUpperCase();

    if (str.includes('AM') || str.includes('PM')) {
      const [time, period] = str.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    } else {
      [hours, minutes] = str.split(':').map(Number);
    }

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const base = /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      ? new Date(`${dateKey}T00:00:00`)
      : new Date();
    base.setHours(hours, minutes, 0, 0);
    return base;
  } catch {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
