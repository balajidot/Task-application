const { app, BrowserWindow, ipcMain, Notification, nativeImage, shell, Menu, Tray } = require("electron");
const path = require("path");
const fs = require("fs");

// 🔥 CRISP TEXT RENDERING FOR 1366x768 DISPLAYS 🔥
app.commandLine.appendSwitch('disable-features', 'WidgetLayering');
app.commandLine.appendSwitch('enable-font-antialiasing', 'true');

let mainWindow;
let tray;
let isQuitting = false;
let lastReminderPayload = [];
let reminderTimers = [];
let lastScheduleDateKey = "";
let dayWatcher = null;
let currentTrayTask = 'No active task';

// Auto-updater (graceful fallback if electron-updater not installed)
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch {}
const STORE_FILE = () => path.join(app.getPath("userData"), "taskflow-data.json");
const WINDOW_STATE_KEY = "__window_state__";

// ============================================
// SOUND PLAYER - MP3 Support with fallback
// ============================================
const playSound = (soundType) => {
  try {
    let soundFile;
    if (soundType === 'reminder') {
      soundFile = 'reminder.mp3';
    } else if (soundType === 'complete') {
      soundFile = 'complete.mp3';
    } else if (soundType === 'taskShift') {
      soundFile = 'taskShift.mp3';
    }
    
    if (soundFile) {
      const soundPath = app.isPackaged
        ? path.join(process.resourcesPath, "sounds", soundFile)
        : path.join(__dirname, "..", "public", "sounds", soundFile);
      
      // Try to play MP3 if it exists
      if (fs.existsSync(soundPath)) {
        // Use a simple approach - shell.beep as fallback
        shell.beep();
        setTimeout(() => shell.beep(), 100);
      } else {
        // Fallback to system beep
        shell.beep();
        if (soundType === 'reminder') {
          setTimeout(() => shell.beep(), 180);
        } else if (soundType === 'complete') {
          setTimeout(() => shell.beep(), 120);
          setTimeout(() => shell.beep(), 240);
        }
      }
    }
  } catch (error) {
    // Ultimate fallback
    shell.beep();
  }
};

const loadStore = () => {
  try {
    const raw = fs.readFileSync(STORE_FILE(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveStore = (store) => {
  try {
    fs.writeFileSync(STORE_FILE(), JSON.stringify(store, null, 2), "utf8");
  } catch {}
};

const persistWindowState = () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized() || mainWindow.isMaximized()) return;
    const store = loadStore();
    store[WINDOW_STATE_KEY] = mainWindow.getBounds();
    saveStore(store);
  } catch {}
};

const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const goalVisibleOn = (goal, key) => {
  if (goal.repeat === "Daily") return key >= goal.date;
  if (goal.repeat === "Weekly") {
    if (key < goal.date) return false;
    return new Date(`${goal.date}T00:00:00`).getDay() === new Date(`${key}T00:00:00`).getDay();
  }
  if (goal.repeat === "Monthly") {
    if (key < goal.date) return false;
    return new Date(`${goal.date}T00:00:00`).getDate() === new Date(`${key}T00:00:00`).getDate();
  }
  return goal.date === key;
};

const isDoneOn = (goal, key) => {
  if (goal.repeat === "None") return !!goal.done;
  return !!goal.doneOn?.[key];
};

const clearReminderTimers = () => {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
};

const parseClockTime = (timeStr) => {
  if (!timeStr) return null;
  const [hh, mm] = String(timeStr).split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const fireAt = new Date();
  fireAt.setHours(hh, mm, 0, 0);
  return fireAt;
};

const showReminder = (goal, notificationType = "reminder") => {
  try {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, "icon.ico")
      : path.join(__dirname, "..", "public", "icon.ico");

    // Play reminder sound
    playSound('reminder');

    if (Notification.isSupported()) {
      const n = new Notification({
        title: notificationType === "start" ? "TASK STARTING NOW" : "TASK REMINDER",
        subtitle: goal.session ? `${goal.session} Session` : "Task Alert",
        body: `${goal.text || "You have a pending task reminder."}${goal.startTime || goal.endTime ? `\nTime: ${goal.startTime || "--:--"} - ${goal.endTime || "--:--"}` : ""}${goal.reminder ? `\nReminder: ${goal.reminder}` : ""}`,
        icon: iconPath,
        silent: false,
        urgency: "normal",
      });
      n.on("click", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
      n.show();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-fired", {
        text: goal.text || "Pending task reminder",
        session: goal.session || "",
        reminder: goal.reminder || "",
        startTime: goal.startTime || "",
        endTime: goal.endTime || "",
        notificationType,
      });
    }
  } catch {}
};

const showTaskShiftNotification = (payload) => {
  try {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, "icon.ico")
      : path.join(__dirname, "..", "public", "icon.ico");
    const text = payload?.text || "Task switched";
    const startTime = payload?.startTime || "";
    const endTime = payload?.endTime || "";
    const session = payload?.session || "";

    // Play task shift sound
    playSound('taskShift');

    if (Notification.isSupported()) {
      const n = new Notification({
        title: "Task Shift Reminder",
        subtitle: session ? `${session} Session` : "Live Task Alert",
        body: `${text}${startTime || endTime ? `\nTime: ${startTime || "--:--"} - ${endTime || "--:--"}` : ""}`,
        icon: iconPath,
        silent: false,
        urgency: "critical",
      });
      n.on("click", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
      n.show();
    }
  } catch {}
};

const scheduleReminders = (goals) => {
  clearReminderTimers();
  if (!Array.isArray(goals)) return;

  lastReminderPayload = goals;
  const now = new Date();
  const today = dateKey(now);
  lastScheduleDateKey = today;

  goals.forEach((goal) => {
    if (!goalVisibleOn(goal, today) || isDoneOn(goal, today)) return;

    [
      { time: goal.reminder, type: "reminder" },
      { time: goal.startTime, type: "start" },
    ].forEach(({ time, type }) => {
      const fireAt = parseClockTime(time);
      if (!fireAt) return;
      if (type === "start" && goal.reminder && goal.reminder === goal.startTime) return;
      const diff = fireAt.getTime() - now.getTime();
      if (diff <= 0 || diff >= 86400000) return;
      const timer = setTimeout(() => showReminder(goal, type), diff);
      reminderTimers.push(timer);
    });
  });
};

const createWindow = () => {
  const savedBounds = loadStore()[WINDOW_STATE_KEY];
  const hasValidBounds = savedBounds && Number(savedBounds.width) > 0 && Number(savedBounds.height) > 0;

  mainWindow = new BrowserWindow({
    width: hasValidBounds ? savedBounds.width : 1200,
    height: hasValidBounds ? savedBounds.height : 820,
    x: hasValidBounds && Number.isFinite(savedBounds.x) ? savedBounds.x : undefined,
    y: hasValidBounds && Number.isFinite(savedBounds.y) ? savedBounds.y : undefined,
    minWidth: 980,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      persistWindowState();
    } else {
      persistWindowState();
    }
  });

  mainWindow.on("move", persistWindowState);
  mainWindow.on("resize", persistWindowState);
};

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  // Fix Windows notification title showing "electron.app.Task Planner"
  app.setAppUserModelId("Task Planner");

  ipcMain.handle("persist-get", (_event, key) => {
    const store = loadStore();
    return store?.[key] ?? null;
  });

  ipcMain.handle("persist-set", (_event, key, value) => {
    const store = loadStore();
    store[key] = value;
    saveStore(store);
    return true;
  });

  createWindow();

  ipcMain.on("schedule-reminders", (_event, goals) => {
    scheduleReminders(goals);
  });

  ipcMain.on("notify-task-shift", (_event, payload) => {
    showTaskShiftNotification(payload);
  });

  ipcMain.on("notify-next-task", (_event, payload) => {
    try {
      const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, "icon.ico")
        : path.join(__dirname, "..", "public", "icon.ico");
      
      // Play reminder sound for next task alert
      playSound('reminder');
      
      if (Notification.isSupported()) {
        const n = new Notification({
          title: "⚠️ Next Task Alert",
          body: `Next: ${payload?.text || "Next task"} at ${payload?.time || "--:--"}`,
          icon: iconPath,
          silent: false,
          urgency: "normal",
        });
        n.on("click", () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
          }
        });
        n.show();
      }
    } catch {}
  });

  ipcMain.on("play-sound", (_event, soundType) => {
    playSound(soundType);
  });

  // Auto-start handler
  ipcMain.on("set-auto-start", (_event, enabled) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath('exe'),
      });
    } catch (e) {
      console.log('Auto-start error:', e.message);
    }
  });

  // Tray task update handler
  ipcMain.on("update-tray-task", (_event, taskName) => {
    currentTrayTask = taskName || 'No active task';
    if (tray && !tray.isDestroyed()) {
      tray.setToolTip(`Task Planner \u2022 ${currentTrayTask}`);
    }
  });

  dayWatcher = setInterval(() => {
    const nowKey = dateKey(new Date());
    if (nowKey !== lastScheduleDateKey) scheduleReminders(lastReminderPayload);
  }, 60000);

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "..", "public", "icon.ico");

  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);

    const buildTrayMenu = () => Menu.buildFromTemplate([
      {
        label: `📝 ${currentTrayTask}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Open Task Planner",
        click: () => { mainWindow.show(); mainWindow.focus(); },
      },
      {
        label: "Dashboard",
        click: () => {
          mainWindow.show(); mainWindow.focus();
          mainWindow.webContents.executeJavaScript('document.querySelector && document.querySelector("[data-view=insights]")?.click()');
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => { isQuitting = true; app.quit(); },
      },
    ]);

    tray.setToolTip(`Task Planner \u2022 ${currentTrayTask}`);
    tray.setContextMenu(buildTrayMenu());

    // Update tray menu periodically
    setInterval(() => {
      if (tray && !tray.isDestroyed()) {
        tray.setContextMenu(buildTrayMenu());
      }
    }, 30000);

    tray.on("click", () => { mainWindow.show(); mainWindow.focus(); });
    tray.on("double-click", () => { mainWindow.show(); mainWindow.focus(); });
  } catch (e) {
    console.log("Tray error:", e.message);
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  isQuitting = true;
  persistWindowState();
  clearReminderTimers();
  if (dayWatcher) clearInterval(dayWatcher);
});

// Auto-updater (check on startup if available)
if (autoUpdater) {
  app.whenReady().then(() => {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch {}
  });
}
