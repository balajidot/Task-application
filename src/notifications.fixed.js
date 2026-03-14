const isCapacitor = () =>
  typeof window !== 'undefined' && window.Capacitor !== undefined;

const MAX_NOTIFICATION_ID = 2147483647;
const NOTIFICATION_LOOKAHEAD_DAYS = 14;
const TASK_CHANNEL_ID = 'task-planner-reminders';
const TASK_CHANNEL_NAME = 'Task Planner Reminders';
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

async function ensureCapacitorNotificationAccess(LocalNotifications, options = {}) {
  const shouldPrompt = options.prompt === true;
  let permissionState = await LocalNotifications.checkPermissions();

  if (shouldPrompt && permissionState?.display === 'prompt') {
    permissionState = await LocalNotifications.requestPermissions();
  }

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

async function ensureNotificationChannel(LocalNotifications) {
  if (typeof LocalNotifications.createChannel !== 'function') return;

  try {
    await LocalNotifications.createChannel({
      id: TASK_CHANNEL_ID,
      name: TASK_CHANNEL_NAME,
      description: 'Task start and reminder alerts',
      importance: 5,
      visibility: 1,
    });
  } catch (error) {
    console.warn('Notification channel setup skipped:', error);
  }
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

function buildNotificationEntries(task, dateKey, exactAlarmEnabled = true) {
  const entries = [];
  const reminderTime = parseTaskTime(task.reminder, dateKey);
  const startTime = parseTaskTime(task.startTime, dateKey);

  if (reminderTime && reminderTime > new Date()) {
    entries.push({
      title: 'Task Reminder',
      body: task.endTime
        ? `${task.text} | ${task.startTime || task.reminder} - ${task.endTime}`
        : `${task.text} | ${task.startTime || task.reminder}`,
      id: toStableNotificationId(`${task.id}-${dateKey}-reminder`),
      schedule: {
        at: reminderTime,
        allowWhileIdle: true,
        exact: exactAlarmEnabled,
      },
      channelId: TASK_CHANNEL_ID,
      sound: 'default',
      autoCancel: true,
      extra: {
        taskId: task.id,
        taskDate: dateKey,
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
      id: toStableNotificationId(`${task.id}-${dateKey}-start`),
      schedule: {
        at: startTime,
        allowWhileIdle: true,
        exact: exactAlarmEnabled,
      },
      channelId: TASK_CHANNEL_ID,
      sound: 'default',
      autoCancel: true,
      extra: {
        taskId: task.id,
        taskDate: dateKey,
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
      const access = await ensureCapacitorNotificationAccess(LocalNotifications, { prompt: true });
      if (access.exactAlarm === 'denied' && typeof LocalNotifications.changeExactNotificationSetting === 'function') {
        await LocalNotifications.changeExactNotificationSetting();
      }
      await ensureNotificationChannel(LocalNotifications);
      const refreshedAccess = await ensureCapacitorNotificationAccess(LocalNotifications);
      return refreshedAccess.display === 'granted' && refreshedAccess.enabled ? 'granted' : 'denied';
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
    await ensureNotificationChannel(LocalNotifications);
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
      await ensureNotificationChannel(LocalNotifications);
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options.body || '',
            id: toStableNotificationId(options.id ?? Date.now()),
            channelId: TASK_CHANNEL_ID,
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
export async function updateLiveActivityNotification(task, countdown) {
  if (!isCapacitor()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const notificationId = 9999; // Fixed ID for live activity

    if (!task) {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `Active: ${task.text}`,
          body: countdown || 'Task in progress',
          id: notificationId,
          channelId: TASK_CHANNEL_ID,
          ongoing: true,
          autoCancel: false,
          silent: true,
          schedule: { at: new Date(Date.now() + 100) },
          extra: { taskId: task.id, type: 'live' }
        }
      ]
    });
  } catch (err) {
    console.error('Live activity update failed:', err);
  }
}

export async function clearAllNotifications() {
  if (!isCapacitor()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (err) {
    console.error('Clear all notifications failed:', err);
  }
}

export async function scheduleTaskNotifications(tasks) {
  if (!isNotificationsSupported()) return;

  const scheduleDates = getFutureDateKeys(NOTIFICATION_LOOKAHEAD_DAYS);
  const scheduledTaskEntries = buildUpcomingTaskEntries(tasks, scheduleDates);

  electronIpc?.send?.('schedule-reminders', tasks);

  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const access = await ensureCapacitorNotificationAccess(LocalNotifications);

      if (access.display !== 'granted' || !access.enabled) {
        console.warn('Local notifications are not enabled. Skipping scheduled reminder refresh.');
        return;
      }

      await ensureNotificationChannel(LocalNotifications);

      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        // Only cancel non-live notifications
        const toCancel = pending.notifications.filter(n => n.id !== 9999);
        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }
      }

      const notifications = scheduledTaskEntries.flatMap(({ task, dateKey }) =>
        buildNotificationEntries(task, dateKey, access.exactAlarm !== 'denied')
      );

      if (notifications.length > 0) {
        // Split into chunks of 50 to avoid OS limits
        for (let i = 0; i < notifications.length; i += 50) {
          await LocalNotifications.schedule({ notifications: notifications.slice(i, i + 50) });
        }
      }
    } catch (error) {
      console.error('Capacitor schedule failed:', error);
    }

    return;
  }

  if (electronIpc || Notification.permission !== 'granted') return;

  for (const { task, dateKey } of scheduledTaskEntries) {
    const entries = buildNotificationEntries(task, dateKey, true);
    entries.forEach((entry) => {
      const delay = entry.schedule.at.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => new Notification(entry.title, { body: entry.body }), delay);
      }
    });
  }
}

function buildUpcomingTaskEntries(tasks, dateKeys) {
  const entries = [];

  for (const dateKey of dateKeys) {
    for (const task of tasks) {
      if (!task || !goalVisibleOn(task, dateKey) || isTaskDone(task, dateKey)) continue;
      if (!task.reminder && !task.startTime) continue;
      entries.push({ task, dateKey });
    }
  }

  return entries;
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

function getFutureDateKeys(days) {
  const keys = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < days; offset += 1) {
    const next = new Date(base);
    next.setDate(base.getDate() + offset);
    keys.push(toDateKey(next));
  }

  return keys;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
