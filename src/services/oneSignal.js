// OneSignal Push Notification Service
const ONE_SIGNAL_APP_ID = 'f98c4786-2104-4f35-936c-7b810f1d13ca';
const ONE_SIGNAL_REST_API_KEY = 'PASTE_YOUR_REST_API_KEY_HERE'; // Get this from OneSignal dashboard → Settings → Keys & IDs
const PWA_URL = 'https://task-application-sigma.vercel.app';

// Initialize OneSignal with proper service worker configuration
export async function initializeOneSignal() {
  if (typeof window === 'undefined' || !window.OneSignal) {
    // OneSignal SDK not loaded
    return false;
  }

  try {
    await window.OneSignal.push([
      'init',
      {
        appId: ONE_SIGNAL_APP_ID,
        autoRegister: true,
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
        welcomeNotification: {
          disable: true,
        },
        serviceWorkerParam: {
          scope: '/OneSignalSDKWorker.js'
        },
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js'
      }
    ]);

    // Register for push notifications
    await window.OneSignal.push(['registerForPushNotifications']);
    
    // OneSignal initialized successfully
    return true;
  } catch (error) {
    // OneSignal initialization failed
    return false;
  }
}

// Get OneSignal player ID (user identifier)
export async function getOneSignalPlayerId() {
  if (!window.OneSignal) return null;
  
  try {
    const playerId = await window.OneSignal.push(['getUserId']);
    return playerId;
  } catch (error) {
    // Failed to get OneSignal player ID
    return null;
  }
}

// Schedule task notifications on OneSignal server
export async function scheduleTaskNotifications(tasks) {
  if (!window.OneSignal) {
    // OneSignal not available
    return false;
  }

  try {
    // Get today's date
    const today = new Date().toDateString();
    
    // Filter today's tasks with start times
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.date).toDateString();
      return taskDate === today && task.startTime;
    });

    // Cancel all existing scheduled notifications for this user
    await cancelAllScheduledNotifications();

    // Schedule each task
    for (const task of todayTasks) {
      await scheduleSingleTaskNotification(task);
    }

    // Scheduled X task notifications
    return true;
  } catch (error) {
    // Failed to schedule task notifications
    return false;
  }
}

// Schedule single task notification using OneSignal REST API
async function scheduleSingleTaskNotification(task) {
  if (!task.startTime) return;

  try {
    // Parse task start time
    const [hours, minutes] = task.startTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);

    // Only schedule if task is in the future
    if (taskTime <= new Date()) {
      // Task is in the past, skipping notification
      return;
    }

    // Create notification payload for OneSignal REST API
    const notificationData = {
      app_id: ONE_SIGNAL_APP_ID,
      contents: {
        en: `${task.text} (${task.startTime || "--:--"}-${task.endTime || "--:--"})`
      },
      headings: {
        en: "⏰ Task Starting Now!"
      },
      url: `${PWA_URL}?view=tasks&taskId=${task.id}`,
      send_after: taskTime.toISOString(),
      data: {
        taskId: task.id,
        taskText: task.text,
        startTime: task.startTime,
        endTime: task.endTime
      },
      buttons: [
        {
          text: "Open Task",
          url: `${PWA_URL}?view=tasks&taskId=${task.id}`
        }
      ]
    };

    // Send notification using OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(ONE_SIGNAL_REST_API_KEY + ':')}`
      },
      body: JSON.stringify(notificationData)
    });

    if (response.ok) {
      const result = await response.json();
      // Store notification ID for potential cancellation
      const scheduledIds = JSON.parse(localStorage.getItem('scheduledNotificationIds') || '[]');
      scheduledIds.push(result.id);
      localStorage.setItem('scheduledNotificationIds', JSON.stringify(scheduledIds));
    }
    
    // Scheduled notification for task at startTime
  } catch (error) {
    // Failed to schedule notification for task
  }
}

// Cancel all scheduled notifications
async function cancelAllScheduledNotifications() {
  try {
    // OneSignal doesn't have a direct way to cancel all scheduled notifications
    // We'll store scheduled notification IDs and cancel them individually
    const scheduledIds = localStorage.getItem('scheduledNotificationIds');
    if (scheduledIds) {
      const ids = JSON.parse(scheduledIds);
      for (const id of ids) {
        await window.OneSignal.push(['cancelNotification', id]);
      }
      localStorage.removeItem('scheduledNotificationIds');
    }
  } catch (error) {
    // Failed to cancel scheduled notifications
  }
}

// Handle notification click event
export function setupNotificationClickHandler() {
  if (!window.OneSignal) return;

  window.OneSignal.push([
    'addListenerForNotificationOpened',
    function (data) {
      // Notification clicked
      
      // Navigate to tasks tab if URL contains task info
      if (data.url && data.url.includes('view=tasks')) {
        // The URL will automatically open in the browser
        // The app will handle the navigation based on URL parameters
        window.location.href = data.url;
      }
    }
  ]);
}

// Request notification permission
export async function requestOneSignalPermission() {
  if (!window.OneSignal) return 'unsupported';

  try {
    const permission = await window.OneSignal.push(['getNotificationPermission']);
    if (permission === 'default') {
      const result = await window.OneSignal.push(['requestPermission']);
      return result;
    }
    return permission;
  } catch (error) {
    // Failed to request OneSignal permission
    return 'denied';
  }
}
