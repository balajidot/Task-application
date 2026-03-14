import React, { Suspense, lazy } from "react";
import { getApiUrl } from "./utils/apiConfig";
import PomodoroTimer from "./components/PomodoroTimer";
import TaskImportExport from "./components/TaskImportExport";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useMobileFeatures, triggerHaptic, useSwipeTabSwitcher } from "./hooks/useMobileFeatures";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification,
  initializeNotifications,
  scheduleTaskNotifications,
  updateLiveActivityNotification,
} from "./notifications.fixed";

import './App.css';
import { LiveTaskPopup } from "./components/SharedUI";
import ShortcutsModal from "./components/ShortcutsModal";
import AchievementBadges from "./components/AchievementBadges";
import WeeklyPlannerWizard from "./components/WeeklyPlannerWizard";
import TaskTemplates from "./components/TaskTemplates";
import { DeviceSettings } from "./plugins/deviceSettings";
import BottomSheet from "./components/BottomSheet";
import SpeechToTask from "./components/SpeechToTask";

const DashboardView = lazy(() => import("./views/DashboardView"));
const TasksView = lazy(() => import("./views/TasksView"));
const PlannerView = lazy(() => import("./views/PlannerView"));
const AnalyticsView = lazy(() => import("./views/AnalyticsView"));
const SettingsView = lazy(() => import("./views/SettingsView"));
const CareerView = lazy(() => import("./views/CareerView"));
const ToolsView = lazy(() => import("./views/ToolsView"));
const HabitsView = lazy(() => import("./views/HabitsView"));
const JournalView = lazy(() => import("./views/JournalView"));
const GoalsView = lazy(() => import("./views/GoalsView"));
const ChatAssistantView = lazy(() => import("./views/ChatAssistantView"));

import { REPEAT_OPTIONS, SESSION_OPTIONS, PRIORITY_OPTIONS, FONT_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES, QUOTES, PRIORITY_RANK, JOURNAL_KEY, HABITS_KEY, GOALS_KEY, TOOLS_KEY, CAREER_KEY, APP_COPY } from "./utils/constants";
import {
  todayKey, toKey, timeToMinutes, hasSameStartEnd, isTimeLiveNow, formatTimeRange, goalTimeMinutes, matchesTimeFilter,
  getWeekDays, normalizeGoal, goalVisibleOn, isDoneOn, readStorage, writeStorage, readPrefs, writePrefs,
  readUiState, writeUiState, readPersist, writePersist, AudioPlayer, playSuccessTone, playTaskCompleteTone, weeklyStats, completionStreak,
  parseTaskLine, formatCountdown, getTimeRemainingMs
} from "./utils/helpers";

export default function App() {
  const electronIpc = React.useMemo(() => {
    try {
      return window.require?.("electron")?.ipcRenderer ?? null;
    } catch {
      return null;
    }
  }, []);

  const [userName, setUserName] = React.useState("");
  const [showNameSetup, setShowNameSetup] = React.useState(false);
  const [tempName, setTempName] = React.useState("");

  const [goals, setGoals] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState(null);
  const [activeDate, setActiveDate] = React.useState(todayKey());
  const [weekBase, setWeekBase] = React.useState(new Date());
  const [activeView, setActiveView] = React.useState("tasks");
  const [notifPerm, setNotifPerm] = React.useState("default");
  const [priorityFilter, setPriorityFilter] = React.useState("All");
  const [timeFilter, setTimeFilter] = React.useState("All Times");
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [themeMode, setThemeMode] = React.useState("dark");
  const [autoThemeMode, setAutoThemeMode] = React.useState("off");
  const [appLanguage, setAppLanguage] = React.useState("en");
  const [taskFontSize, setTaskFontSize] = React.useState(18);
  const [taskFontFamily, setTaskFontFamily] = React.useState(FONT_OPTIONS[0].value);
  const [uiScale, setUiScale] = React.useState(96);
  const [overdueEnabled, setOverdueEnabled] = React.useState(true);
  const [fontWeight, setFontWeight] = React.useState(500);
  const [soundTheme, setSoundTheme] = React.useState('default');
  const [hapticEnabled, setHapticEnabled] = React.useState(true);
  const [liveHighlightEnabled, setLiveHighlightEnabled] = React.useState(true);
  
  // NEW: Card & Board Themes
  const [cardTheme, setCardTheme] = React.useState('glow'); // glow, border, minimal, colored-shadow
  const [cardBorderColor, setCardBorderColor] = React.useState('#3b82f6');
  const [showCardDot, setShowCardDot] = React.useState(true);
  
  const [reminderPopup, setReminderPopup] = React.useState(null);
  const [liveTaskPopup, setLiveTaskPopup] = React.useState(null);
  const [nextTaskAlert, setNextTaskAlert] = React.useState(null);
  const [form, setForm] = React.useState({ text: "", date: todayKey(), reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
  const [completedPulseId, setCompletedPulseId] = React.useState(null);
  const [celebratingGoalId, setCelebratingGoalId] = React.useState(null);
  const [selectedGoalIds, setSelectedGoalIds] = React.useState([]);
  
  const [plannerView, setPlannerView] = React.useState("monthly");
  const [showPomodoro, setShowPomodoro] = React.useState(false);
  const [showImportExport, setShowImportExport] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [upcomingTaskAlert, setUpcomingTaskAlert] = React.useState(null);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [nextUpcomingTask, setNextUpcomingTask] = React.useState(null);
  const [nowTick, setNowTick] = React.useState(Date.now());
  
  const [nowMinuteTick, setNowMinuteTick] = React.useState(Date.now());
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  
  const [journalEntries, setJournalEntries] = React.useState({});
  const [showWeeklyWizard, setShowWeeklyWizard] = React.useState(false);
  const [habitsData, setHabitsData] = React.useState([]);
  const [goalsData, setGoalsData] = React.useState([]);
  const [careerData, setCareerData] = React.useState({});
  const [tabSwitching, setTabSwitching] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [aiContext, setAiContext] = React.useState("");
  const [aiPersonalCoach, setAiPersonalCoach] = React.useState("");
  const [isBriefingLoading, setIsBriefingLoading] = React.useState(false);

  // Refs
  const pulseTimerRef = React.useRef(null);
  const celebrateTimerRef = React.useRef(null);
  const masterTimerRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const liveTaskRef = React.useRef(undefined);
  const nextAlertShownRef = React.useRef({});
  const globalCelebrationTimerRef = React.useRef(null);
  const pendingWriteRef = React.useRef({ timer: null, last: "" });

  const save = React.useCallback((updated) => {
    setGoals(updated);
    let serialized = "[]";
    try { serialized = JSON.stringify(updated); } catch {}
    pendingWriteRef.current.last = serialized;
    if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer);
    pendingWriteRef.current.timer = setTimeout(() => { writeStorage(pendingWriteRef.current.last).catch(() => {}); }, 300);
  }, []);

  const isEOD = React.useMemo(() => {
    const now = new Date(nowMinuteTick);
    return (now.getHours() >= 22 && now.getMinutes() >= 30) || now.getHours() >= 23;
  }, [nowMinuteTick]);

  const weekDays = React.useMemo(() => getWeekDays(weekBase), [weekBase]);
  
  const visibleGoals = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return goals
      .filter((g) => goalVisibleOn(g, activeDate))
      .filter((g) => (priorityFilter === "All" ? true : g.priority === priorityFilter))
      .filter((g) => matchesTimeFilter(g, timeFilter))
      .filter((g) => (term ? g.text.toLowerCase().includes(term) : true))
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || timeToMinutes(a.reminder) - timeToMinutes(b.reminder) || a.id - b.id);
  }, [goals, activeDate, priorityFilter, searchTerm, timeFilter]);

  const pendingGoals = React.useMemo(() => visibleGoals.filter((g) => !isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const completedGoals = React.useMemo(() => visibleGoals.filter((g) => isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const selectedSet = React.useMemo(() => new Set(selectedGoalIds), [selectedGoalIds]);
  
  const nowMinutes = React.useMemo(() => { const now = new Date(nowMinuteTick); return now.getHours() * 60 + now.getMinutes(); }, [nowMinuteTick]);
  
  const liveCurrentGoal = React.useMemo(() => (
    [...goals]
      .filter((g) => goalVisibleOn(g, todayKey()))
      .filter((g) => !isDoneOn(g, todayKey()))
      .sort((a, b) => goalTimeMinutes(a) - goalTimeMinutes(b))
      .find((g) => isTimeLiveNow(g.startTime, g.endTime, nowMinutes)) || null
  ), [goals, nowMinutes]);
  
  const nextUpcomingGoal = React.useMemo(() => {
    return [...goals]
      .filter((g) => goalVisibleOn(g, todayKey()))
      .filter((g) => !isDoneOn(g, todayKey()))
      .filter((g) => g.id !== liveCurrentGoal?.id) 
      .filter((g) => g.startTime && timeToMinutes(g.startTime) >= nowMinutes)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null;
  }, [goals, nowMinutes, liveCurrentGoal]);
  
  const liveCountdown = React.useMemo(() => {
    if (!liveCurrentGoal?.endTime) return null;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    return remaining !== null ? formatCountdown(remaining) : null;
  }, [liveCurrentGoal, nowTick]);

  const shouldShowNextAlert = React.useMemo(() => {
    if (!liveCurrentGoal?.endTime) return false;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    return remaining !== null && Math.floor(remaining / 60000) === 5;
  }, [liveCurrentGoal, nowTick]);

  const liveClockLabel = React.useMemo(() => new Date(nowTick).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase(), [nowTick]);
  const done = completedGoals.length;
  const total = visibleGoals.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const dueSoon = pendingGoals.filter((g) => timeToMinutes(g.reminder) < Number.MAX_SAFE_INTEGER).length;
  const weekly = React.useMemo(() => weeklyStats(goals), [goals]);
  const streakDays = React.useMemo(() => completionStreak(goals), [goals]);

  const fetchAiBriefing = React.useCallback(async () => {
    if (!userName || !loaded || isBriefingLoading) return;
    setIsBriefingLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/briefing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          language: appLanguage,
          appData: {
            total: goals.length,
            done: goals.filter(g => isDoneOn(g, todayKey())).length,
            streakDays,
            highPriorityCount: goals.filter(g => g.priority === 'High' && !isDoneOn(g, todayKey())).length,
            recentMood: Object.values(journalEntries).flat().slice(-1)[0]?.mood
          }
        })
      });
      const data = await response.json();
      if (data.briefing) setAiPersonalCoach(data.briefing);
    } catch (e) {
      console.error('Briefing error:', e);
    } finally {
      setIsBriefingLoading(false);
    }
  }, [userName, loaded, appLanguage, goals, streakDays, journalEntries]);

  React.useEffect(() => {
    if (loaded && userName) {
      const timer = setTimeout(fetchAiBriefing, 3000);
      return () => clearTimeout(timer);
    }
  }, [loaded, userName, goals.length]);
  const handleOptimizeSchedule = React.useCallback(async (tasksToOptimize) => {
    if (!tasksToOptimize || tasksToOptimize.length === 0) return;
    setAiLoading(true);
    triggerHaptic('heavy');
    try {
      const response = await fetch(getApiUrl('/api/optimize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksToOptimize, language: appLanguage })
      });
      const data = await response.json();
      if (data.optimizedTasks) {
        // Merge optimized tasks back into full goals list
        const optimizedMap = new Map(data.optimizedTasks.map(t => [t.id, t]));
        const updatedGoals = goals.map(g => optimizedMap.has(g.id) ? { ...g, ...optimizedMap.get(g.id) } : g);
        save(updatedGoals);
        window.alert(appLanguage === 'ta' ? "✅ அட்டவணை மேம்படுத்தப்பட்டது!" : "✅ Schedule optimized for maximum impact!");
      }
    } catch (e) {
      console.error('Optimization error:', e);
      window.alert('failed to optimize');
    } finally {
      setAiLoading(false);
    }
  }, [goals, appLanguage, save]);

  const handleSmartTaskParse = React.useCallback(async (rawText) => {
    if (!rawText.trim()) return;
    setAiLoading(true);
    triggerHaptic('medium');
    try {
      const response = await fetch(getApiUrl('/api/parse-task'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, language: appLanguage })
      });
      const data = await response.json();
      if (data.parsedTask) {
        const { text, startTime, endTime, priority, date } = data.parsedTask;
        setForm(p => ({
          ...p,
          text: text || rawText,
          startTime: startTime || p.startTime,
          endTime: endTime || p.endTime,
          priority: priority || p.priority,
          date: date || p.date
        }));
      }
    } catch (e) {
      console.error('Parse error:', e);
      setForm(p => ({ ...p, text: rawText }));
    } finally {
      setAiLoading(false);
    }
  }, [appLanguage]);

  const copy = React.useMemo(() => APP_COPY[appLanguage] || APP_COPY.en, [appLanguage]);

  useMobileFeatures({ themeMode, activeView, setActiveView, setShowForm, setShowMoreMenu });

  const { handleTouchStart, handleTouchEnd } = useSwipeTabSwitcher(activeView, setActiveView);



  const quote = React.useMemo(() => QUOTES[Math.floor((Date.now() / 86400000) % QUOTES.length)], []);

  React.useEffect(() => {
    const storedName = localStorage.getItem("taskPlanner_userName");
    if (storedName) setUserName(storedName);
    else setShowNameSetup(true);
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      localStorage.setItem("taskPlanner_userName", tempName.trim());
      setUserName(tempName.trim());
      setShowNameSetup(false);
      playSuccessTone();
    }
  };


  React.useEffect(() => {
    masterTimerRef.current = setInterval(() => setNowTick(Date.now()), 1000);
    const minuteTimer = setInterval(() => setNowMinuteTick(Date.now()), 60000);
    return () => { clearInterval(masterTimerRef.current); clearInterval(minuteTimer); };
  }, []);
  
  React.useEffect(() => { return () => { clearTimeout(pulseTimerRef.current); clearTimeout(celebrateTimerRef.current); clearTimeout(globalCelebrationTimerRef.current); if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer); }; }, []);
  React.useEffect(() => { setTabSwitching(true); const t = setTimeout(() => setTabSwitching(false), 200); return () => clearTimeout(t); }, [activeView]);

  React.useEffect(() => {
    const loadInitData = async () => {
      const [raw, uiState, prefs, journalRaw, habitsRaw, goalsRaw, careerRaw] = await Promise.all([
        readStorage(), readUiState(), readPrefs(), readPersist(JOURNAL_KEY), readPersist(HABITS_KEY), readPersist(GOALS_KEY), readPersist(CAREER_KEY)
      ]);
      if (raw) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setGoals(parsed.map(normalizeGoal)); } catch {} }
      if (uiState && typeof uiState === "object") {
        setActiveDate(todayKey());
        if (uiState.activeView) setActiveView(uiState.activeView);
        if (uiState.searchTerm) setSearchTerm(uiState.searchTerm);
        if (uiState.priorityFilter) setPriorityFilter(uiState.priorityFilter);
        if (uiState.timeFilter) setTimeFilter(uiState.timeFilter);
        setWeekBase(new Date());
      }
      if (prefs) {
        setThemeMode(prefs.themeMode || (prefs.darkMode ? "dark" : "sunset-light"));
        if (prefs.autoThemeMode) setAutoThemeMode(prefs.autoThemeMode);
        if (prefs.appLanguage) setAppLanguage(prefs.appLanguage);
        setTaskFontSize(Number(prefs.taskFontSize) || 18);
        setTaskFontFamily(prefs.taskFontFamily || FONT_OPTIONS[0].value);
        setUiScale(Number(prefs.uiScale) || 96);
        if (typeof prefs.overdueEnabled === 'boolean') setOverdueEnabled(prefs.overdueEnabled);
        if (prefs.fontWeight) setFontWeight(Number(prefs.fontWeight) || 500);
        if (prefs.soundTheme) setSoundTheme(prefs.soundTheme);
        if (typeof prefs.hapticEnabled === 'boolean') setHapticEnabled(prefs.hapticEnabled);
        if (typeof prefs.liveHighlightEnabled === "boolean") setLiveHighlightEnabled(prefs.liveHighlightEnabled);
        
        // Load NEW Card themes
        if (prefs.cardTheme) setCardTheme(prefs.cardTheme);
        if (prefs.cardBorderColor) setCardBorderColor(prefs.cardBorderColor);
        if (typeof prefs.showCardDot === 'boolean') setShowCardDot(prefs.showCardDot);
      }
      if (journalRaw) { try { setJournalEntries(JSON.parse(journalRaw)); } catch{} }
      if (habitsRaw) { try { setHabitsData(JSON.parse(habitsRaw)); } catch{} }
      if (goalsRaw) { try { setGoalsData(JSON.parse(goalsRaw)); } catch{} }
      if (careerRaw) { try { setCareerData(JSON.parse(careerRaw)); } catch{} }
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'tasks') setActiveView('tasks');
      setLoaded(true);
      
      // EXPLICIT PERMISSION REQUEST ON FIRST LAUNCH
      const currentPerm = getNotificationPermission();
      if (currentPerm === 'default' || currentPerm === 'denied') {
        const result = await initializeNotifications();
        setNotifPerm(result);
        if (result !== 'granted' && currentPerm === 'default') {
          requestNotificationPermission().then(setNotifPerm);
        }
      } else {
        setNotifPerm(currentPerm);
      }
    };
    loadInitData();
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    writePrefs({ 
      themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, 
      overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled,
      cardTheme, cardBorderColor, showCardDot
    });
    
    // Inject CSS variables for global typography & Themes
    const root = document.documentElement;
    root.style.setProperty('--task-font-size', `${taskFontSize}px`);
    root.style.setProperty('--task-font-family', taskFontFamily);
    root.style.setProperty('--global-font-weight', fontWeight);
    root.style.setProperty('--card-glow-color', cardBorderColor);
    
    scheduleTaskNotifications(goals); 
  }, [activeDate, activeView, loaded, priorityFilter, searchTerm, timeFilter, weekBase, themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled, goals, cardTheme, cardBorderColor, showCardDot]);


  React.useEffect(() => {
    if (!loaded || getNotificationPermission() !== "granted") return;
    const now = new Date(); const today = todayKey();
    const timers = goals.filter((g) => g.reminder && goalVisibleOn(g, today) && !isDoneOn(g, today)).map((g) => {
      const [hh, mm] = g.reminder.split(":").map(Number); 
      if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      const fire = new Date(); fire.setHours(hh, mm, 0, 0); const diff = fire - now;
      if (diff <= 0 || diff >= 86400000) return null;
      return setTimeout(() => {
        setReminderPopup({ text: g.text || "Pending task reminder", session: g.session || "", reminder: g.reminder || "", startTime: g.startTime || "", endTime: g.endTime || "" });
        AudioPlayer.playReminder();
        showAppNotification("Task Reminder", { body: g.text || "You have a task reminder", tag: `reminder-${g.id}` });
      }, diff);
    }).filter(Boolean);
    return () => timers.forEach(clearTimeout);
  }, [goals, loaded]);

  React.useEffect(() => {
    if (!loaded || !electronIpc?.send) return;
    electronIpc.send("schedule-reminders", goals);
  }, [electronIpc, goals, loaded]);

  React.useEffect(() => {
    if (!electronIpc?.send) return;
    electronIpc.send("update-tray-task", liveCurrentGoal?.text || "No live task right now");
  }, [electronIpc, liveCurrentGoal]);

  React.useEffect(() => {
    if (!electronIpc?.on) return undefined;
    const handler = (_event, payload) => setReminderPopup(payload);
    electronIpc.on("reminder-fired", handler);
    return () => electronIpc.removeListener?.("reminder-fired", handler);
  }, [electronIpc]);

  React.useEffect(() => {
    if (!liveHighlightEnabled) return;
    if (!liveCurrentGoal?.id) {
      if (liveTaskRef.current !== undefined) {
        updateLiveActivityNotification(null);
        liveTaskRef.current = undefined;
      }
      return;
    }
    
    // Update ref if ID changed
    const idChanged = liveTaskRef.current !== liveCurrentGoal.id;
    liveTaskRef.current = liveCurrentGoal.id;
    
    if (idChanged) {
      setLiveTaskPopup(liveCurrentGoal);
      electronIpc?.send?.("notify-task-shift", {
        text: liveCurrentGoal.text,
        startTime: liveCurrentGoal.startTime,
        endTime: liveCurrentGoal.endTime,
        session: liveCurrentGoal.session,
      });
    }

    // Update the notification body with the countdown
    updateLiveActivityNotification(liveCurrentGoal, liveCountdown);
  }, [electronIpc, liveCurrentGoal, liveHighlightEnabled, liveCountdown]);

  React.useEffect(() => {
    if (autoThemeMode === "off") return undefined;

    const applyTheme = () => {
      if (autoThemeMode === "time") {
        const hour = new Date().getHours();
        setThemeMode(hour >= 18 || hour < 6 ? "dark" : "sunset-light");
        return;
      }

      const media = window.matchMedia?.("(prefers-color-scheme: dark)");
      setThemeMode(media?.matches ? "dark" : "sunset-light");
    };

    applyTheme();

    if (autoThemeMode === "system" && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener?.("change", applyTheme);
      return () => media.removeEventListener?.("change", applyTheme);
    }

    const timer = autoThemeMode === "time" ? setInterval(applyTheme, 60000) : null;
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoThemeMode]);

  React.useEffect(() => {
    if (!loaded) return undefined;

    const refreshNotifications = () => {
      scheduleTaskNotifications(goals);
      electronIpc?.send?.("schedule-reminders", goals);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" || document.visibilityState === "visible") {
        refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    let cleanup = () => {};
    if (window.Capacitor) {
      import("@capacitor/app")
        .then(async ({ App }) => {
          const listener = await App.addListener("appStateChange", ({ isActive }) => {
            refreshNotifications();
            if (isActive) initializeNotifications().then(setNotifPerm);
          });
          cleanup = () => listener.remove();
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cleanup();
    };
  }, [electronIpc, goals, loaded]);

  const calculateNextUpcomingTask = React.useCallback(() => { 
    const currentTime = new Date().toTimeString().slice(0, 5); 
    return pendingGoals.filter(task => task.startTime && task.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null; 
  }, [pendingGoals]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const nextTask = calculateNextUpcomingTask();
      if (nextTask) { 
        const timeUntilStart = new Date(`${nextTask.date}T${nextTask.startTime}`) - new Date(); 
        if (timeUntilStart <= 300000 && timeUntilStart > 0) { 
          if (!nextAlertShownRef.current[nextTask.id]) {
            setUpcomingTaskAlert(nextTask); 
            AudioPlayer.playReminder(); 
            nextAlertShownRef.current[nextTask.id] = true; 
          }
        }
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [calculateNextUpcomingTask]);

  React.useEffect(() => { setNextUpcomingTask(calculateNextUpcomingTask()); }, [calculateNextUpcomingTask]);

  const aiBriefing = React.useMemo(() => {
    const highPriority = pendingGoals.filter((goal) => goal.priority === "High").slice(0, 2);
    const untimed = pendingGoals.filter((goal) => !goal.startTime).slice(0, 2);
    const overdue = pendingGoals.filter((goal) => goal.endTime && timeToMinutes(goal.endTime) < nowMinutes);

    return {
      headline: liveCurrentGoal
        ? `${copy.ai.stayLocked} "${liveCurrentGoal.text}" ${copy.ai.until} ${liveCurrentGoal.endTime || liveCurrentGoal.startTime || "the next block"}.`
        : nextUpcomingGoal
          ? `${copy.ai.prepFor} "${nextUpcomingGoal.text}" ${copy.ai.before} ${nextUpcomingGoal.startTime}.`
          : copy.ai.boardOpen,
      risk: overdue.length
        ? `${overdue.length} ${overdue.length > 1 ? copy.ai.overdueNow : copy.ai.overdueSingle}`
        : highPriority.length
          ? `${copy.ai.highPriorityWaiting} ${highPriority.map((goal) => goal.text).join(", ")}.`
          : copy.ai.noUrgent,
      suggestion: untimed.length
        ? `${copy.ai.assignSlots} ${untimed.map((goal) => goal.text).join(", ")}.`
        : pendingGoals.length
          ? copy.ai.goodStructure
          : copy.ai.dayClear,
    };
  }, [copy.ai, liveCurrentGoal, nextUpcomingGoal, nowMinutes, pendingGoals]);

  const aiWeeklyAnalysis = React.useMemo(() => {
    const isTamil = appLanguage === "ta";
    const bestDay = weekly.bestDay?.name || "N/A";
    const weakestDay = weekly.days.reduce((lowest, day) => (!lowest || day.pct < lowest.pct ? day : lowest), null)?.name || "N/A";
    const totalPending = goals.filter((goal) => !isDoneOn(goal, todayKey()) && goalVisibleOn(goal, todayKey())).length;
    const completionTrend = weekly.days.map((day) => day.pct < 0 ? 0 : day.pct);
    const trendDelta = completionTrend.length > 1 ? completionTrend[completionTrend.length - 1] - completionTrend[0] : 0;
    const predictedPct = Math.max(20, Math.min(100, Math.round(weekly.weekPct + trendDelta * 0.35)));
    const overloadedDays = weekly.days.filter((day) => day.total >= 6);
    const burnoutRisk = overloadedDays.length >= 3 || (weekly.weekPct < 45 && weekly.weekTotal >= 12) ? "high" : overloadedDays.length >= 1 ? "medium" : "low";
    const overdueTasks = goals.filter((goal) => goalVisibleOn(goal, todayKey()) && !isDoneOn(goal, todayKey()) && goal.endTime && timeToMinutes(goal.endTime) < nowMinutes);
    const untimedPending = goals.filter((goal) => goalVisibleOn(goal, todayKey()) && !isDoneOn(goal, todayKey()) && !goal.startTime);
    const pendingPriority = goals
      .filter((goal) => goalVisibleOn(goal, todayKey()) && !isDoneOn(goal, todayKey()))
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    const recurringSource = goals.filter((goal) => goal.repeat !== "None").slice(0, 3);
    const sourceTitles = [
      ...pendingPriority.map((goal) => goal.text),
      ...recurringSource.map((goal) => goal.text),
      "Deep work block",
      "Weekly review and planning",
      "Admin cleanup",
      "Learning sprint",
      "Recovery buffer",
    ].filter(Boolean);
    const nextWeekDates = buildNextWeekDates();
    const preferredSlots = [
      { startTime: "08:30", endTime: "10:00", priority: "High", session: "Morning" },
      { startTime: "10:30", endTime: "11:30", priority: "Medium", session: "Morning" },
      { startTime: "13:00", endTime: "14:30", priority: "High", session: "Afternoon" },
      { startTime: "15:30", endTime: "16:30", priority: "Medium", session: "Afternoon" },
      { startTime: "17:00", endTime: "17:30", priority: "Low", session: "Evening" },
    ];
    const nextWeekTaskDrafts = nextWeekDates.map((dateKey, index) => {
      const slot = preferredSlots[index % preferredSlots.length];
      const text = sourceTitles[index % sourceTitles.length];
      return normalizeGoal({
        id: Date.now() + index,
        text: text.includes("block") || text.includes("review") || text.includes("cleanup") || text.includes("sprint") || text.includes("buffer")
          ? text
          : `${text} focus block`,
        date: dateKey,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reminder: shiftTime(slot.startTime, -15),
        priority: slot.priority,
        session: slot.session,
        repeat: "None",
      });
    });
    const nextWeekPlan = [
      {
        title: copy.analytics.workloadBalance,
        detail: isTamil
          ? `${bestDay} நாளை deep work க்கும், ${weakestDay} நாளை admin, review, recovery மாதிரி லேசான பணிகளுக்கும் வையுங்கள்.`
          : `Use ${bestDay} for deep work and keep ${weakestDay} lighter with admin, review, or recovery tasks.`,
      },
      {
        title: copy.analytics.focusTime,
        detail: untimedPending.length
          ? isTamil
            ? `${Math.min(untimedPending.length, 3)} untimed task-களை அடுத்த வாரம் காலை focus block-ஆக மாற்றுங்கள்.`
            : `Convert ${Math.min(untimedPending.length, 3)} untimed task${untimedPending.length > 1 ? "s" : ""} into morning focus blocks next week.`
          : isTamil
            ? "அடுத்த வாரம் மதியத்திற்கு முன் குறைந்தது மூன்று 90 நிமிட focus blocks பாதுகாக்கவும்."
            : "Protect at least three 90-minute focus blocks next week before noon.",
      },
      {
        title: copy.analytics.burnoutRisk,
        detail: burnoutRisk === "high"
          ? isTamil
            ? "சோர்வு அபாயம் அதிகம். ஒரு buffer evening வையுங்கள், கடின பணிகளை குறையுங்கள், தினமும் 2 heavy blocks க்கு மேல் சேர்க்காதீர்கள்."
            : "Burnout risk is high. Add one buffer evening, reduce hard tasks, and avoid stacking more than 2 heavy blocks a day."
          : burnoutRisk === "medium"
            ? isTamil
              ? "சோர்வு அபாயம் நடுத்தரமாக உள்ளது. கடின பணிகளுக்கு நடுவில் லேசான review அல்லது admin blocks வையுங்கள்."
              : "Burnout risk is moderate. Space demanding work with lighter review or admin blocks."
            : isTamil
              ? "சோர்வு அபாயம் குறைவாக உள்ளது. நல்ல நாட்களை கூட அதிகமாக நிரப்பாமல் steady pace வைத்திருங்கள்."
              : "Burnout risk looks low. Keep the pace steady without overfilling strong days.",
      },
      {
        title: copy.analytics.cleanup,
        detail: overdueTasks.length
          ? isTamil
            ? `புதிய வேலை சேர்ப்பதற்கு முன் ${overdueTasks.length} overdue task-களை clear அல்லது reschedule செய்யுங்கள்.`
            : `Clear or reschedule ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} before adding new work.`
          : isTamil
            ? "இப்போது overdue cleanup அழுத்தம் இல்லை. அடுத்த வாரத்தை clean board உடன் தொடங்கலாம்."
            : "No overdue cleanup pressure right now. You can start next week with a clean board.",
      },
    ];

    const weeklyStory = (() => {
      if (!weekly.weekTotal) return isTamil ? "இந்த வாரத்தில் போதுமான தரவு இல்லை." : "Not enough data for a story this week.";
      
      const pct = weekly.weekPct;
      const best = bestDay;
      const streak = streakDays;

      if (isTamil) {
        let intro = `இந்த வாரம் நீங்கள் ${pct}% இலக்குகளை அடைந்துள்ளீர்கள். `;
        if (pct >= 85) intro += `நீங்கள் ஒரு 'Lion' போல சீறிப்பாய்ந்து வேலை செய்துள்ளீர்கள்! 🦁 `;
        else if (pct >= 60) intro += `நீங்கள் ஒரு 'Achiever' ஆக சீராக முன்னேறியுள்ளீர்கள். 📈 `;
        else intro += `இந்த வாரம் ஒரு மெதுவான தொடக்கம், ஆனால் முன்னேற இன்னும் வாய்ப்பு உள்ளது. 🌱 `;

        let middle = `${best} அன்று உங்களின் வேகம் உச்சத்தில் இருந்தது. `;
        if (streak >= 3) middle += `உங்கள் ${streak} நாட்கள் streak உங்களின் அர்ப்பணிப்பைக் காட்டுகிறது! 🔥 `;

        let conclusion = pct >= 80 
          ? "அடுத்த வாரமும் இதே வேகத்தைத் தொடருங்கள், வெற்றி நிச்சயம்!" 
          : "அடுத்த வாரம் சிறிய இலக்குகளுடன் தொடங்கி பெரிய வெற்றிகளை அடைய வாழ்த்துகள்!";
        
        return intro + middle + conclusion;
      } else {
        let intro = `You've achieved ${pct}% of your goals this week. `;
        if (pct >= 85) intro += `You worked like a 'Lion' - fierce and focused! 🦁 `;
        else if (pct >= 60) intro += `You moved steadily like an 'Achiever'. 📈 `;
        else intro += `A bit of a slow start, but there's plenty of room to grow. 🌱 `;

        let middle = `Your momentum peaked on ${best}. `;
        if (streak >= 3) middle += `Maintaining a ${streak}-day streak shows great discipline! 🔥 `;

        let conclusion = pct >= 80 
          ? "Keep this heat going next week, you're unstoppable!" 
          : "Try smaller chunks next week to build bigger wins. You've got this!";
        
        return intro + middle + conclusion;
      }
    })();

    return {
      summary: weekly.weekTotal
        ? isTamil
          ? `இந்த வாரம் ${weekly.weekTotal} visible task-களில் ${weekly.weekDone} முடித்துள்ளீர்கள். சுமார் ${weekly.weekPct}%.`
          : `You finished ${weekly.weekDone} of ${weekly.weekTotal} visible tasks this week, around ${weekly.weekPct}%.`
        : isTamil
          ? "இந்த வாரத்திற்கு tracked data குறைவு. தினசரி task logging செய்தால் analysis இன்னும் நல்லதாகும்."
          : "This week has very little tracked data. Start logging tasks daily for stronger analysis.",
      momentum: streakDays >= 3
        ? isTamil
          ? `உங்கள் streak ${streakDays} நாட்கள். இதை காப்பாற்ற நாளைக்கு லேசான ஆனால் consistent திட்டம் வையுங்கள்.`
          : `Your streak is ${streakDays} days. Protect it with a light but consistent tomorrow plan.`
        : isTamil
          ? "Momentum இன்னும் build ஆகிறது. ஒரு நாளில் அதிகம் push செய்வதற்குப் பதிலாக சிறிய consistent wins உதவும்."
          : "Momentum is still building. Small repeatable wins will help more than heavy one-day pushes.",
      pattern: isTamil
        ? `சிறந்த நாள்: ${bestDay}. குறைந்த output நாள்: ${weakestDay}. இன்று pending: ${totalPending}.`
        : `Best day: ${bestDay}. Lowest output day: ${weakestDay}. Pending today: ${totalPending}.`,
      advice: weekly.weekPct >= 80
        ? isTamil
          ? "இப்போது overload குறைத்து deep-work quality மீது கவனம் செலுத்தலாம்."
          : "You can now reduce overload and focus more on deep-work quality."
        : weekly.weekPct >= 50
          ? isTamil
            ? "Completion நல்ல நிலையில் உள்ளது. ஆனால் top priorities-ஐ இன்னும் முன்பே time-block செய்தால் உதவும்."
            : "Completion is decent, but time-blocking your top priorities earlier will help."
          : isTamil
            ? "உங்கள் board அதிகமாக நிரம்பியிருக்கலாம். தினசரி load குறைத்து top 3 tasks-க்கு exact start time கொடுக்கவும்."
            : "Your board may be overfilled. Cut daily load and assign exact start times to the top 3 tasks.",
      trend: trendDelta >= 0
        ? isTamil
          ? `வாரத்தின் தொடக்கம் முதல் சுமார் ${Math.abs(trendDelta)} points முன்னேற்றம் காணப்படுகிறது.`
          : `Trend is improving by about ${Math.abs(trendDelta)} points from the start of the week.`
        : isTamil
          ? `வாரத்தின் போது சுமார் ${Math.abs(trendDelta)} points குறைவு ஏற்பட்டது.`
          : `Trend dipped by about ${Math.abs(trendDelta)} points during the week.`,
      predictedPct,
      chartPoints: completionTrend,
      nextWeekPlan,
      burnoutRisk,
      overdueCount: overdueTasks.length,
      overloadedDays: overloadedDays.length,
      nextWeekTaskDrafts,
      weeklyStory,
    };
  }, [appLanguage, copy.analytics, goals, nowMinutes, streakDays, weekly]);

  const createNextWeekPlan = React.useCallback(() => {
    const draftTasks = aiWeeklyAnalysis.nextWeekTaskDrafts || [];
    if (!draftTasks.length) return;

    const existingSignatures = new Set(
      goals.map((goal) => `${goal.date}|${goal.startTime || ""}|${String(goal.text || "").trim().toLowerCase()}`)
    );

    const freshTasks = draftTasks
      .filter((goal) => !existingSignatures.has(`${goal.date}|${goal.startTime || ""}|${String(goal.text || "").trim().toLowerCase()}`))
      .map((goal, index) => normalizeGoal({ ...goal, id: Date.now() + index }));

    if (!freshTasks.length) {
      window.alert(copy.analytics.planReady);
      return;
    }

    save([...goals, ...freshTasks]);
    setActiveView("planner");
    setWeekBase(new Date(`${freshTasks[0].date}T00:00:00`));
    setActiveDate(freshTasks[0].date);
    window.alert(copy.analytics.planCreated);
  }, [aiWeeklyAnalysis.nextWeekTaskDrafts, copy.analytics, goals, save]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" }); setEditingGoal(null); setShowForm(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) { e.preventDefault(); setUiScale((s) => Math.min(130, s + 4)); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") { e.preventDefault(); setUiScale((s) => Math.max(80, s - 4)); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); setUiScale(100); return; }
      if (showForm && e.key === "Escape") { e.preventDefault(); setShowForm(false); }
      if (showForm && e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); submitForm(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [showForm, activeDate, form, editingGoal, goals]);

  useKeyboardShortcuts([
    { key: '1', ctrl: true, action: () => setActiveView('insights') },
    { key: '2', ctrl: true, action: () => setActiveView('tasks') },
    { key: '3', ctrl: true, action: () => setActiveView('planner') },
    { key: '4', ctrl: true, action: () => setActiveView('settings') },
    { key: 'w', ctrl: true, action: () => setPlannerView(prev => prev === 'monthly' ? 'weekly' : 'monthly') },
    { key: '?', action: () => setShowShortcuts(s => !s) },
  ]);

  const onTaskTextChange = React.useCallback((value) => {
    setForm((prev) => {
      const next = { ...prev, text: value };
      const cleaned = value.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
      if (cleaned.length === 1) { const parsed = parseTaskLine(cleaned[0], prev); if (parsed.matchedRange) { next.text = parsed.text; next.startTime = parsed.startTime; next.endTime = parsed.endTime; next.reminder = parsed.reminder; next.session = parsed.session; } }
      return next;
    });
  }, []);

  const submitForm = () => {
    if (!form.text.trim()) return;
    const cleaned = form.text.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
    const parsedEntries = cleaned.map((line) => parseTaskLine(line, form));
    if (parsedEntries.some((entry) => entry.startTime && entry.endTime && hasSameStartEnd(entry.startTime, entry.endTime))) return window.alert("Start and end time cannot be same.");
    
    if (editingGoal) {
      const parsed = parsedEntries[0] || parseTaskLine(cleaned[0] || form.text.trim(), form);
      save(goals.map((g) => (g.id === editingGoal ? { ...g, ...form, text: parsed.text || cleaned[0] || form.text.trim(), startTime: parsed.startTime || form.startTime, endTime: parsed.endTime || form.endTime, reminder: parsed.reminder || form.reminder || parsed.startTime || "", session: parsed.session || (parsed.startTime ? "Morning" : form.session) } : g)));
    } else if (cleaned.length > 1) {
      save([...goals, ...parsedEntries.map((entry, idx) => normalizeGoal({ id: Date.now() + idx, ...form, text: entry.text || cleaned[idx], startTime: entry.startTime || form.startTime, endTime: entry.endTime || form.endTime, reminder: entry.reminder || form.reminder || entry.startTime || "", session: entry.session || (entry.startTime ? "Morning" : form.session) }))]);
    } else {
      const parsed = parsedEntries[0] || parseTaskLine(cleaned[0] || form.text.trim(), form);
      save([...goals, normalizeGoal({ id: Date.now(), ...form, text: parsed.text || cleaned[0] || form.text.trim(), startTime: parsed.startTime || form.startTime, endTime: parsed.endTime || form.endTime, reminder: parsed.reminder || form.reminder || parsed.startTime || "", session: parsed.session || (parsed.startTime ? "Morning" : form.session) })]);
    }
    setShowForm(false);
  };

  const handleAiAutoSchedule = async () => {
    setAiLoading(true);
    try {
      const API_URL = (typeof window !== 'undefined' && window.Capacitor)
        ? 'https://task-application-sigma.vercel.app/api/gemini'
        : '/api/gemini';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName || 'Friend',
          existingTasks: pendingGoals.slice(0, 5),
          recentTasks: goals.slice(-8),
          date: activeDate,
          language: appLanguage,
          context: aiContext.trim(),
        })
      });

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();

      if (data.schedule) {
        onTaskTextChange(data.schedule);  
      } else {
        throw new Error(data.error || 'No schedule returned');
      }
    } catch (err) {
      console.error('AI schedule error:', err);
      const fallback = (appLanguage === "ta"
        ? [
            "09:00 - 10:30 - முக்கிய வேலை கவன அமர்வு",
            "10:30 - 10:45 - சிறிய இடைவேளை மற்றும் நீட்டிப்பு",
            "10:45 - 12:00 - மின்னஞ்சல் மற்றும் admin வேலை",
            "12:00 - 13:00 - மதிய உணவு இடைவேளை",
            "13:00 - 15:00 - கூட்டங்கள் மற்றும் ஒத்துழைப்பு",
            "15:00 - 17:00 - நாள் மதிப்பாய்வு மற்றும் முடிப்பு"
          ]
        : [
            "09:00 - 10:30 - Deep Work and Focus Session",
            "10:30 - 10:45 - Short Break and Stretch",
            "10:45 - 12:00 - Emails and Admin Tasks",
            "12:00 - 13:00 - Lunch Break",
            "13:00 - 15:00 - Meetings and Collaboration",
            "15:00 - 17:00 - Review and Wrap Up"
          ]).join('\n');
      onTaskTextChange(fallback);
      window.alert(appLanguage === "ta" ? 'AI கிடைக்கவில்லை. smart default schedule காட்டப்படுகிறது!' : 'AI unavailable - showing smart default schedule instead!');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleDoneWithCelebration = (goal) => {
    const wasCompleted = goal.done || goal.doneOn?.[activeDate];
    if (goal.repeat === "None") save(goals.map((g) => (g.id === goal.id ? { ...g, done: !goal.done } : g)));
    else save(goals.map((g) => { if (g.id !== goal.id) return g; const doneOn = { ...(g.doneOn || {}) }; if (doneOn[activeDate]) delete doneOn[activeDate]; else doneOn[activeDate] = true; return { ...g, doneOn }; }));
    
    if (!wasCompleted) {
      AudioPlayer.playComplete(); setShowCelebration(true); setCompletedPulseId(goal.id);
      clearTimeout(pulseTimerRef.current); pulseTimerRef.current = setTimeout(() => setCompletedPulseId(null), 360);
      setCelebratingGoalId(goal.id); clearTimeout(celebrateTimerRef.current); celebrateTimerRef.current = setTimeout(() => setCelebratingGoalId(null), 1200);
      clearTimeout(globalCelebrationTimerRef.current); globalCelebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 2000); 
    }
  };

  const removeGoal = (id) => save(goals.filter((g) => g.id !== id));
  const toggleSelectGoal = (id) => setSelectedGoalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelectedGoals = () => setSelectedGoalIds([]);
  const selectAllVisibleGoals = () => setSelectedGoalIds(visibleGoals.map((g) => g.id));
  const deleteSelectedGoals = () => { if (!selectedGoalIds.length) return; const selected = new Set(selectedGoalIds); save(goals.filter((g) => !selected.has(g.id))); clearSelectedGoals(); };
  const dotsFor = (key) => { const dayGoals = goals.filter((g) => goalVisibleOn(g, key)); return { total: dayGoals.length, done: dayGoals.filter((g) => isDoneOn(g, key)).length }; };
  const handleImportTasks = React.useCallback((importedTasks) => { save([...goals, ...importedTasks.map(task => ({ ...normalizeGoal(task), id: Date.now() + Math.random() }))]); }, [goals, save]);
  const markAllPendingDone = () => { const pendingIds = new Set(pendingGoals.map((g) => g.id)); save(goals.map((g) => { if (!pendingIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: true }; return { ...g, doneOn: { ...(g.doneOn || {}), [activeDate]: true } }; })); };
  const reopenAllCompleted = () => { const completedIds = new Set(completedGoals.map((g) => g.id)); save(goals.map((g) => { if (!completedIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: false }; const nextDoneOn = { ...(g.doneOn || {}) }; delete nextDoneOn[activeDate]; return { ...g, doneOn: nextDoneOn }; })); };
  const duplicatePendingToTomorrow = () => { const d = new Date(`${activeDate}T00:00:00`); d.setDate(d.getDate() + 1); const nextKey = toKey(d); const copies = pendingGoals.map((g, idx) => normalizeGoal({ ...g, id: Date.now() + idx, date: nextKey, done: false, doneOn: {}, repeat: "None" })); if (copies.length) save([...goals, ...copies]); };
  const handleApplyTemplate = React.useCallback((tasks) => { const today = todayKey(); const newGoals = tasks.map(text => ({ id: Date.now() + Math.random(), text: text.trim(), date: today, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium', doneOn: {} })); save([...goals, ...newGoals]); }, [goals, save]);

  const clearAppCache = React.useCallback(async () => {
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      window.alert("App cache cleared successfully.");
    } catch {
      window.alert("Unable to clear cache on this device.");
    }
  }, []);

  const openAndroidBatterySettings = React.useCallback(async () => {
    try {
      if (DeviceSettings?.openBatteryOptimizationSettings) {
        await DeviceSettings.openBatteryOptimizationSettings();
        return;
      }
      window.alert("Battery optimization settings shortcut is available in Android build.");
    } catch {
      window.alert("Unable to open battery optimization settings on this device.");
    }
  }, []);

  const openAndroidAppSettings = React.useCallback(async () => {
    try {
      if (DeviceSettings?.openAppSettings) {
        await DeviceSettings.openAppSettings();
        return;
      }
      window.alert("App settings shortcut is available in Android build.");
    } catch {
      window.alert("Unable to open app settings on this device.");
    }
  }, []);

  const clearLocalAppData = React.useCallback(async () => {
    await Promise.all([
      writeStorage("[]"),
      writePrefs({}),
      writeUiState({}),
      writePersist(TOOLS_KEY, JSON.stringify({})),
      writePersist(CAREER_KEY, JSON.stringify({})),
      writePersist(JOURNAL_KEY, "{}"),
      writePersist(HABITS_KEY, "[]"),
      writePersist(GOALS_KEY, "[]"),
    ]);
    localStorage.removeItem("taskPlanner_userName");
    setGoals([]);
    setJournalEntries({});
    setHabitsData([]);
    setGoalsData([]);
    setSelectedGoalIds([]);
    setSearchTerm("");
    setPriorityFilter("All");
    setTimeFilter("All Times");
    setThemeMode("dark");
    setAutoThemeMode("off");
    setAppLanguage("en");
    setTaskFontSize(18);
    setTaskFontFamily(FONT_OPTIONS[0].value);
    setUiScale(96);
    setOverdueEnabled(true);
    setFontWeight(500);
    setSoundTheme("default");
    setHapticEnabled(true);
    setLiveHighlightEnabled(true);
    setUserName("");
    setAiContext("");
    setShowNameSetup(true);
  }, []);

  const generateMonthlyReport = React.useCallback(() => {
    const now = new Date(); const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    if (!reportWindow) return;
    let totalTasks = 0, totalDone = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i); const key = toKey(d);
      const vis = goals.filter(g => g.date === key || (g.repeat !== 'None' && g.date <= key));
      totalTasks += vis.length; totalDone += vis.filter(g => g.doneOn?.[key]).length;
    }
    const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    reportWindow.document.write(`
      <html><head><title>Monthly Report</title>
      <style>body{font-family:system-ui;padding:40px;max-width:700px;margin:0 auto;color:#1a1a2e} h1{color:#2563eb} .stat{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;background:#f0f4ff;text-align:center} .stat .num{font-size:2rem;font-weight:900;color:#2563eb} .bar-fill{height:12px;border-radius:999px;background:linear-gradient(90deg,#2563eb,#6366f1)}</style>
      </head><body><h1>📊 Monthly Report</h1><div class="stat"><div class="num">${totalDone}</div><div class="lbl">Done</div></div><div class="stat"><div class="num">${totalTasks}</div><div class="lbl">Total</div></div>
      <script>setTimeout(()=>window.print(),500)</script></body></html>`);
  }, [goals, streakDays]);

  const themeClass = `theme-${themeMode}`;
  const isPlannerIframeView = activeView === "tasks";
  function buildNextWeekDates() {
    const today = new Date();
    const start = new Date(today);
    const currentDay = start.getDay() || 7;
    start.setDate(start.getDate() + (8 - currentDay));
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return toKey(date);
    });
  }
  function shiftTime(time, minutes) {
    if (!time) return "";
    const [hours, mins] = String(time).split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(mins)) return "";
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  const activeDateLabel = activeDate === todayKey() ? copy.common.todayFocus : new Date(`${activeDate}T00:00:00`).toLocaleDateString(appLanguage === "ta" ? "ta-IN" : "en-IN", { weekday: "long", month: "long", day: "numeric" });

  const mainTabItems = [
    { id: "insights", label: "Dashboard", icon: "🏠" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "planner", label: "Planner", icon: "📅" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  const moreTabItems = [
    { id: "career", label: "Career", icon: "🚀" },
    { id: "tools", label: "Tools", icon: "🛠" },
    { id: "habits", label: "Habits", icon: "🔁" },
    { id: "journal", label: "Journal", icon: "📓" },
    { id: "goals", label: "Goals", icon: "🎯" },
    { id: "chat", label: "AI Chat", icon: "🤖" },
  ];
  const tabItems = [...mainTabItems.map(t => ({...t, icon: t.id === 'insights' ? '📊' : t.id === 'analytics' ? '📈' : t.icon})), ...moreTabItems];

  const localizedMainTabItems = mainTabItems.map((tab) => ({ ...tab, label: copy.tabs[tab.id] || tab.label }));
  const localizedMoreTabItems = moreTabItems.map((tab) => ({ ...tab, label: copy.tabs[tab.id] || tab.label }));
  const localizedTabItems = [...localizedMainTabItems, ...localizedMoreTabItems];

  return (
    <div className={`page ${themeClass}${isPlannerIframeView ? " planner-mode" : ""}`} style={{ "--task-font-size": `${taskFontSize}px`, "--task-font-family": taskFontFamily, "--ui-scale": `${uiScale / 100}`, "--global-font-weight": fontWeight }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="app">
        <div className="tab-nav">
          {localizedTabItems.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setActiveView(tab.id); }}>
              <span className="tab-icon">{tab.icon}</span><span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {showNameSetup && (
          <div className="overlay" style={{ zIndex: 99999, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}>
            <div className="modal" style={{ 
              textAlign: 'center', padding: '30px 20px', background: 'var(--card)', 
              border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              transform: 'scale(1)', transition: 'all 0.3s ease-out'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '10px', animation: 'pulse 2s infinite' }}>👋</div>
              <h2 style={{ margin: '0 0 10px 0', color: 'var(--text)', fontSize: '1.5rem', fontWeight: '800' }}>Welcome to Task Planner!</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.4' }}>
                Let's make today productive. <br/>What should I call you?
              </p>
              <input
                type="text"
                placeholder="Enter your name..."
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                autoFocus
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '10px', 
                  border: '2px solid rgba(99, 102, 241, 0.3)', background: 'var(--chip)', 
                  color: 'var(--text)', fontSize: '1.1rem', marginBottom: '20px', 
                  textAlign: 'center', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={!tempName.trim()}
                style={{ 
                  width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 'bold',
                  borderRadius: '10px', color: '#fff', border: 'none', cursor: tempName.trim() ? 'pointer' : 'not-allowed',
                  background: tempName.trim() ? 'linear-gradient(135deg, #a855f7, #6366f1)' : '#475569',
                  opacity: tempName.trim() ? 1 : 0.5, transition: 'all 0.2s'
                }}
              >
                Start Planning 🚀
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="m-title">{editingGoal ? copy.taskForm.editTask : copy.taskForm.newTask}</div>

                            <div className="fg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="fl" style={{ margin: 0 }}>{copy.taskForm.taskDescription}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="mini-btn" 
                      onClick={() => handleSmartTaskParse(form.text)}
                      disabled={!form.text.trim() || aiLoading}
                      style={{ fontSize: '0.75rem', padding: '6px 10px', height: 'fit-content' }}
                    >
                      {aiLoading ? '...' : '✨ AI Auto-Fill'}
                    </button>
                    <SpeechToTask onSpeechResult={handleSmartTaskParse} />
                  </div>
                </div>
                <textarea
                  className="fi task-box"
                  placeholder={copy.taskForm.taskPlaceholder}
                  value={form.text}
                  onChange={e => onTaskTextChange(e.target.value)}
                  autoFocus
                />
                <div className="form-hint">💡 Type "meeting 9am-10am" to auto-fill time fields</div>
              </div>

              <div className="fg">
                <label className="fl">{copy.taskForm.aiContext}</label>
                <textarea
                  className="fi task-box"
                  placeholder={copy.taskForm.aiContextPlaceholder}
                  value={aiContext}
                  onChange={e => setAiContext(e.target.value)}
                  style={{ minHeight: '78px' }}
                />
              </div>

              <div className="fg">
                <label className="fl">{copy.taskForm.date}</label>
                <input type="date" className="fi" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg">
                  <label className="fl">{copy.taskForm.startTime}</label>
                  <input type="time" className="fi" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="fg">
                  <label className="fl">{copy.taskForm.endTime}</label>
                  <input type="time" className="fi" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>

              <div className="fg">
                <label className="fl">{copy.taskForm.reminderTime}</label>
                <input type="time" className="fi" value={form.reminder} onChange={e => setForm(p => ({ ...p, reminder: e.target.value }))} />
              </div>

              <div className="fg">
                <label className="fl">{copy.taskForm.priority}</label>
                <select className="fs" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg">
                  <label className="fl">{copy.taskForm.session}</label>
                  <select className="fs" value={form.session} onChange={e => setForm(p => ({ ...p, session: e.target.value }))}>
                    {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">{copy.taskForm.repeat}</label>
                  <select className="fs" value={form.repeat} onChange={e => setForm(p => ({ ...p, repeat: e.target.value }))}>
                    {REPEAT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="new-btn" style={{ flex: 2 }} onClick={submitForm}>
                  {editingGoal ? copy.common.saveChanges : copy.common.addTask}
                </button>
                <button className="hero-btn" style={{ flex: 1 }} onClick={() => setShowForm(false)}>{copy.common.cancel}</button>
              </div>

              {!editingGoal && (
                <button className="tool-btn" style={{ width: '100%', marginTop: '10px', opacity: aiLoading ? 0.7 : 1 }} onClick={handleAiAutoSchedule} disabled={aiLoading}>
                  {aiLoading ? copy.taskForm.aiThinking : copy.taskForm.aiAutoSchedule}
                </button>
              )}
            </div>
          </div>
        )}

        {liveTaskPopup && <LiveTaskPopup task={liveTaskPopup} onClose={() => setLiveTaskPopup(null)} />}
        
        {upcomingTaskAlert && (
          <div className="toast-notification">
            <div className="toast-accent-bar"></div>
            <div className="toast-body">
              <div className="toast-icon-wrap"><span className="toast-icon">⏰</span></div>
              <div className="toast-content">
                <div className="toast-title">{copy.alerts.nextTaskSoon}</div>
                <div className="toast-message">"{upcomingTaskAlert.text}" at {upcomingTaskAlert.startTime}</div>
              </div>
              <button className="toast-close" onClick={() => setUpcomingTaskAlert(null)}>✕</button>
            </div>
            <div className="toast-progress-bar"><div className="toast-progress-fill"></div></div>
          </div>
        )}

        {reminderPopup && (
          <div className="overlay" onClick={() => setReminderPopup(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">{copy.alerts.taskReminder}</div>
              <div className="fg"><div className="fl">{copy.common.task}</div><div className="fi">{reminderPopup.text}</div></div>
              {(reminderPopup.startTime || reminderPopup.endTime) && (<div className="fg"><div className="fl">{copy.common.time}</div><div className="fi">{formatTimeRange(reminderPopup.startTime, reminderPopup.endTime)}</div></div>)}
              {reminderPopup.session && (<div className="fg"><div className="fl">{copy.common.session}</div><div className="fi">{reminderPopup.session}</div></div>)}
              <div style={{ textAlign: 'center', marginTop: '16px' }}><button className="new-btn" onClick={() => setReminderPopup(null)}>{copy.common.gotIt}</button></div>
            </div>
          </div>
        )}

        <Suspense fallback={<div style={{ display: "grid", placeItems: "center", padding: "40px" }}><span style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #94a3b8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}/></div>}>
          {tabSwitching && (
            <div style={{ display: "grid", placeItems: "center", padding: "18px", opacity: 0.8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #94a3b8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}/> Switching…
              </div>
            </div>
          )}

          {activeView === "insights" && <div key="insights" className="view-transition"><DashboardView appLanguage={appLanguage} copy={copy} userName={userName} quote={quote} setActiveView={setActiveView} done={done} total={total} pct={pct} weekly={weekly} streakDays={streakDays} dueSoon={dueSoon} goals={goals} journalEntries={journalEntries} generateMonthlyReport={generateMonthlyReport} aiPersonalCoach={aiPersonalCoach} /></div>}
          {activeView === "chat" && <div key="chat" className="view-transition">
            <ChatAssistantView 
              appLanguage={appLanguage} 
              goals={goals} 
              habits={habitsData} 
              career={careerData} 
              journalEntries={Object.values(journalEntries).flat()} 
              onExecuteAction={(action) => {
                if (!action) return;
                switch (action.type) {
                  case 'SET_LANGUAGE':
                    if (action.value) setAppLanguage(action.value);
                    break;
                  case 'SET_THEME':
                    if (action.value) setThemeMode(action.value);
                    break;
                  case 'SET_VIEW':
                    if (action.value) setActiveView(action.value);
                    break;
                  case 'ADD_TASKS':
                    if (action.tasks && Array.isArray(action.tasks)) {
                      const tasksWithIds = action.tasks.map(t => ({
                        ...t,
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        done: false
                      }));
                      const updated = [...goals, ...tasksWithIds];
                      save(updated);
                      setActiveView('tasks');
                    }
                    break;
                  default:
                    console.log('Unknown AI action:', action);
                }
              }}
            />
          </div>}
          {activeView === "tasks" && (
            <div key="tasks" className="view-transition">
              <TasksView
                activeDate={activeDate} setActiveDate={setActiveDate} activeDateLabel={activeDateLabel} weekBase={weekBase} setWeekBase={setWeekBase} weekDays={weekDays}
                liveClockLabel={liveClockLabel} done={done} total={total} pct={pct} nextUpcomingGoal={nextUpcomingGoal} setForm={setForm} setEditingGoal={setEditingGoal} setShowForm={setShowForm}
                liveCurrentGoal={liveCurrentGoal} liveCountdown={liveCountdown} focusMode={focusMode} setFocusMode={setFocusMode} showCelebration={showCelebration} setShowCelebration={setShowCelebration}
                liveHighlightEnabled={liveHighlightEnabled} aiBriefing={aiBriefing} copy={copy} openAiPlanner={() => { setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" }); setEditingGoal(null); setAiContext(""); setShowForm(true); }}
                onOptimizeSchedule={handleOptimizeSchedule}
                appLanguage={appLanguage}
                goals={goals} dotsFor={dotsFor} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchRef={searchRef} pendingGoals={pendingGoals} completedGoals={completedGoals} visibleGoals={visibleGoals}
                selectedGoalIds={selectedGoalIds} selectedSet={selectedSet} selectAllVisibleGoals={selectAllVisibleGoals} deleteSelectedGoals={deleteSelectedGoals} clearSelectedGoals={clearSelectedGoals}
                overdueEnabled={overdueEnabled}
                cardTheme={cardTheme} cardBorderColor={cardBorderColor} showCardDot={showCardDot}
                completedPulseId={completedPulseId}
                celebratingGoalId={celebratingGoalId} toggleDoneWithCelebration={toggleDoneWithCelebration} removeGoal={removeGoal} toggleSelectGoal={toggleSelectGoal}
                markAllPendingDone={markAllPendingDone} duplicatePendingToTomorrow={duplicatePendingToTomorrow} reopenAllCompleted={reopenAllCompleted}
              />
            </div>
          )}
          {activeView === "planner" && <div key="planner" className="view-transition"><PlannerView plannerView={plannerView} setPlannerView={setPlannerView} goals={goals} setActiveDate={setActiveDate} setActiveView={setActiveView} /></div>}
          {activeView === "analytics" && <div key="analytics" className="view-transition"><AnalyticsView setShowPomodoro={setShowPomodoro} setShowImportExport={setShowImportExport} setActiveView={setActiveView} goals={goals} weekly={weekly} aiWeeklyAnalysis={aiWeeklyAnalysis} onCreateNextWeekPlan={createNextWeekPlan} appLanguage={appLanguage} copy={copy} /></div>}
          {activeView === "career" && <div key="career" className="view-transition"><CareerView /></div>}
          {activeView === "tools" && (
            <div key="tools" className="view-transition">
              <ToolsView onOpenPomodoro={() => setShowPomodoro(true)} appLanguage={appLanguage} copy={copy} />
              <div style={{ padding: '0 16px 20px', maxWidth: '600px', margin: '0 auto' }}>
                <TaskTemplates onApplyTemplate={handleApplyTemplate} />
              </div>
            </div>
          )}
          {activeView === "settings" && (
            <div key="settings" className="view-transition">
              <SettingsView
                setActiveView={setActiveView}
                themeMode={themeMode} setThemeMode={setThemeMode}
                taskFontFamily={taskFontFamily} setTaskFontFamily={setTaskFontFamily}
                taskFontSize={taskFontSize} setTaskFontSize={setTaskFontSize}
                uiScale={uiScale} setUiScale={setUiScale}
                overdueEnabled={overdueEnabled} setOverdueEnabled={setOverdueEnabled}
                fontWeight={fontWeight} setFontWeight={setFontWeight}
                soundTheme={soundTheme} setSoundTheme={setSoundTheme}
                hapticEnabled={hapticEnabled} setHapticEnabled={setHapticEnabled}
                autoThemeMode={autoThemeMode} setAutoThemeMode={setAutoThemeMode}
                liveHighlightEnabled={liveHighlightEnabled} setLiveHighlightEnabled={setLiveHighlightEnabled}
                appLanguage={appLanguage} setAppLanguage={setAppLanguage}
                copy={copy}
                userName={userName} setUserName={setUserName}
                notifPerm={notifPerm}
                requestNotifPerm={() => requestNotificationPermission().then(setNotifPerm)}
                goals={goals} onReplaceGoals={save}
                onClearCache={clearAppCache}
                onClearLocalData={clearLocalAppData}
                onRefreshNotifications={() => scheduleTaskNotifications(goals)}
                onOpenBatterySettings={openAndroidBatterySettings}
                onOpenAppSettings={openAndroidAppSettings}
                cardTheme={cardTheme} setCardTheme={setCardTheme}
                cardBorderColor={cardBorderColor} setCardBorderColor={setCardBorderColor}
                showCardDot={showCardDot} setShowCardDot={setShowCardDot}
              />
            </div>
          )}
          {activeView === "habits" && <div key="habits" className="view-transition"><HabitsView /></div>}
          {activeView === "journal" && <div key="journal" className="view-transition"><JournalView /></div>}
          {activeView === "goals" && <div key="goals" className="view-transition"><GoalsView /></div>}
        </Suspense>

        {showPomodoro && (
          <div className="overlay" onClick={() => setShowPomodoro(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="m-title" style={{ margin: 0 }}>🍅 Pomodoro Timer</h2>
                <button className="mini-btn" onClick={() => setShowPomodoro(false)}>✕ Close</button>
              </div>
              <PomodoroTimer
                onTaskComplete={() => showAppNotification('Pomodoro Complete! 🎉', { body: 'Take a 5-minute break!' })}
                onBreakComplete={() => showAppNotification('Break Over!', { body: 'Time to focus again!' })}
              />
            </div>
          </div>
        )}

        {showImportExport && (
          <div className="overlay" onClick={() => setShowImportExport(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="m-title" style={{ margin: 0 }}>📦 Import / Export Tasks</h2>
                <button className="mini-btn" onClick={() => setShowImportExport(false)}>✕ Close</button>
              </div>
              <TaskImportExport
                goals={goals}
                onImport={(imported) => {
                  const merged = [...goals, ...imported.filter(t => !goals.find(g => g.id === t.id))];
                  save(merged);
                  setShowImportExport(false);
                  window.alert(`✅ ${imported.length} tasks imported!`);
                }}
              />
            </div>
          </div>
        )}

        <div className="mobile-bottom-nav">
          {localizedMainTabItems.map(tab => (
            <button key={tab.id} className={`mobile-nav-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setActiveView(tab.id); setShowMoreMenu(false); }}>
              <span className="mobile-nav-icon">{tab.icon}</span><span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
          <button className={`mobile-nav-btn ${showMoreMenu ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setShowMoreMenu(!showMoreMenu); }}>
            <span className="mobile-nav-icon">⋯</span><span className="mobile-nav-label">{copy.tabs.more}</span>
          </button>
        </div>

        <BottomSheet title={copy.tabs.more} isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)}>
          <div className="more-menu-items">
            {localizedMoreTabItems.map(tab => (
              <button key={tab.id} className={`more-menu-item ${activeView === tab.id ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setActiveView(tab.id); setShowMoreMenu(false); }}>
                <span className="more-menu-icon">{tab.icon}</span><span className="more-menu-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </BottomSheet>

        {activeView !== 'chat' && !focusMode && (
          <div 
            className="floating-ai-btn" 
            onClick={() => {
              if (typeof triggerHaptic === 'function') triggerHaptic('medium');
              setActiveView('chat');
            }}
          >
            🤖
            {aiPersonalCoach && <div className="ai-badge">NEW</div>}
          </div>
        )}
      </div>
    </div>
  );
}
