import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PomodoroTimer from "./components/PomodoroTimer";
import TaskImportExport from "./components/TaskImportExport";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import { useMobileFeatures, triggerHaptic } from "./hooks/useMobileFeatures";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification,
  initializeNotifications,
  scheduleTaskNotifications,
} from "./notifications.fixed";

import './App.css';
import { LiveTaskPopup } from "./components/SharedUI";
import ShortcutsModal from "./components/ShortcutsModal";
import AchievementBadges from "./components/AchievementBadges";
import WeeklyPlannerWizard from "./components/WeeklyPlannerWizard";
import TaskTemplates from "./components/TaskTemplates";

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

import { REPEAT_OPTIONS, SESSION_OPTIONS, PRIORITY_OPTIONS, FONT_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES, QUOTES, PRIORITY_RANK, JOURNAL_KEY, HABITS_KEY, GOALS_KEY, APP_COPY } from "./utils/constants";
import {
  todayKey, toKey, timeToMinutes, hasSameStartEnd, isTimeLiveNow, formatTimeRange, goalTimeMinutes, matchesTimeFilter,
  getWeekDays, normalizeGoal, goalVisibleOn, isDoneOn, readStorage, writeStorage, readPrefs, writePrefs,
  readUiState, writeUiState, readPersist, writePersist, AudioPlayer, playSuccessTone, playTaskCompleteTone, weeklyStats, completionStreak,
  parseTaskLine, formatCountdown, getTimeRemainingMs
} from "./utils/helpers";

export default function DailyGoals() {
  const electronIpc = useMemo(() => {
    try {
      return window.require?.("electron")?.ipcRenderer ?? null;
    } catch {
      return null;
    }
  }, []);

  const [userName, setUserName] = useState("");
  const [showNameSetup, setShowNameSetup] = useState(false);
  const [tempName, setTempName] = useState("");

  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeDate, setActiveDate] = useState(todayKey());
  const [weekBase, setWeekBase] = useState(new Date());
  const [activeView, setActiveView] = useState("tasks");
  const [notifPerm, setNotifPerm] = useState("default");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All Times");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [themeMode, setThemeMode] = useState("dark");
  const [autoThemeMode, setAutoThemeMode] = useState("off");
  const [appLanguage, setAppLanguage] = useState("en");
  const [taskFontSize, setTaskFontSize] = useState(18);
  const [taskFontFamily, setTaskFontFamily] = useState(FONT_OPTIONS[0].value);
  const [uiScale, setUiScale] = useState(96);
  const [overdueEnabled, setOverdueEnabled] = useState(true);
  const [fontWeight, setFontWeight] = useState(500);
  const [soundTheme, setSoundTheme] = useState('default');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [liveHighlightEnabled, setLiveHighlightEnabled] = useState(true);
  
  const [reminderPopup, setReminderPopup] = useState(null);
  const [liveTaskPopup, setLiveTaskPopup] = useState(null);
  const [nextTaskAlert, setNextTaskAlert] = useState(null);
  const [form, setForm] = useState({ text: "", date: todayKey(), reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
  const [completedPulseId, setCompletedPulseId] = useState(null);
  const [celebratingGoalId, setCelebratingGoalId] = useState(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState([]);
  
  const [plannerView, setPlannerView] = useState("monthly");
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [upcomingTaskAlert, setUpUpcomingTaskAlert] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [nextUpcomingTask, setNextUpcomingTask] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  
  const [nowMinuteTick, setNowMinuteTick] = useState(Date.now());
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [journalEntries, setJournalEntries] = useState({});
  const [showWeeklyWizard, setShowWeeklyWizard] = useState(false);
  const [habitsData, setHabitsData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [tabSwitching, setTabSwitching] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const copy = useMemo(() => APP_COPY[appLanguage] || APP_COPY.en, [appLanguage]);

  useMobileFeatures({ themeMode, activeView, setActiveView, setShowForm, setShowMoreMenu });

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleGlobalTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleGlobalTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX  = e.changedTouches[0].clientX;
    const touchEndY  = e.changedTouches[0].clientY;
    const deltaX     = touchStartX.current - touchEndX;   // +ve = swipe left
    const deltaY     = touchStartY.current - touchEndY;
    const screenW    = window.innerWidth;
    const startX     = touchStartX.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // ✅ FIX 1 — EDGE ZONE: swipe must START from left/right 22% of screen only.
    // Middle swipes belong to task cards / scroll — must never switch tabs.
    const EDGE = screenW * 0.22;
    if (startX > EDGE && startX < screenW - EDGE) return;

    // ✅ FIX 2 — THRESHOLD: raised from 60 → 120px to prevent accidental switches
    const THRESHOLD = 120;
    if (Math.abs(deltaX) < THRESHOLD) return;

    // ✅ FIX 3 — DIRECTION: near-horizontal swipe only (deltaY must be < 35% of deltaX)
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.35) return;

    // ✅ FIX 4 — IGNORE interactive targets
    const t = e.target;
    if (t.closest('.goal-item') || t.closest('.swipeable-task-container') ||
        t.closest('.filters')   || t.closest('.modal')   || t.closest('.overlay') ||
        t.closest('.live-strip')|| t.closest('.tab-nav') ||
        t.closest('input')      || t.closest('textarea') ||
        t.closest('select')     || t.closest('button')) return;

    // ✅ SWITCH TAB
    const tabs = ["insights","tasks","planner","analytics","settings","career","tools","habits","journal","goals"];
    const idx = tabs.indexOf(activeView);
    if (idx === -1) return;

    if (deltaX > THRESHOLD && idx < tabs.length - 1) {
      triggerHaptic('light');
      setActiveView(tabs[idx + 1]);
    } else if (deltaX < -THRESHOLD && idx > 0) {
      triggerHaptic('light');
      setActiveView(tabs[idx - 1]);
    }
  };

  const pulseTimerRef = useRef(null);
  const celebrateTimerRef = useRef(null);
  const masterTimerRef = useRef(null);
  const searchRef = useRef(null);
  const liveTaskRef = useRef(undefined);
  const nextAlertShownRef = useRef({});
  const globalCelebrationTimerRef = useRef(null);
  const pendingWriteRef = useRef({ timer: null, last: "" });

  const quote = useMemo(() => QUOTES[Math.floor((Date.now() / 86400000) % QUOTES.length)], []);

  useEffect(() => {
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

  const isEOD = useMemo(() => {
    const now = new Date(nowMinuteTick);
    return (now.getHours() >= 22 && now.getMinutes() >= 30) || now.getHours() >= 23;
  }, [nowMinuteTick]);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);
  
  const visibleGoals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return goals
      .filter((g) => goalVisibleOn(g, activeDate))
      .filter((g) => (priorityFilter === "All" ? true : g.priority === priorityFilter))
      .filter((g) => matchesTimeFilter(g, timeFilter))
      .filter((g) => (term ? g.text.toLowerCase().includes(term) : true))
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || timeToMinutes(a.startTime) - timeToMinutes(b.startTime) || timeToMinutes(a.reminder) - timeToMinutes(b.reminder) || a.id - b.id);
  }, [goals, activeDate, priorityFilter, searchTerm, timeFilter]);

  const pendingGoals = useMemo(() => visibleGoals.filter((g) => !isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const completedGoals = useMemo(() => visibleGoals.filter((g) => isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const selectedSet = useMemo(() => new Set(selectedGoalIds), [selectedGoalIds]);
  
  const nowMinutes = useMemo(() => { const now = new Date(nowMinuteTick); return now.getHours() * 60 + now.getMinutes(); }, [nowMinuteTick]);
  
  const liveCurrentGoal = useMemo(() => (
    [...goals]
      .filter((g) => goalVisibleOn(g, todayKey()))
      .filter((g) => !isDoneOn(g, todayKey()))
      .sort((a, b) => goalTimeMinutes(a) - goalTimeMinutes(b))
      .find((g) => isTimeLiveNow(g.startTime, g.endTime, nowMinutes)) || null
  ), [goals, nowMinutes]);
  
  const nextUpcomingGoal = useMemo(() => {
    return [...goals]
      .filter((g) => goalVisibleOn(g, todayKey()))
      .filter((g) => !isDoneOn(g, todayKey()))
      .filter((g) => g.id !== liveCurrentGoal?.id) 
      .filter((g) => g.startTime && timeToMinutes(g.startTime) >= nowMinutes)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null;
  }, [goals, nowMinutes, liveCurrentGoal]);
  
  const liveCountdown = useMemo(() => {
    if (!liveCurrentGoal?.endTime) return null;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    return remaining !== null ? formatCountdown(remaining) : null;
  }, [liveCurrentGoal, nowTick]);

  const shouldShowNextAlert = useMemo(() => {
    if (!liveCurrentGoal?.endTime) return false;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    return remaining !== null && Math.floor(remaining / 60000) === 5;
  }, [liveCurrentGoal, nowTick]);

  const liveClockLabel = useMemo(() => new Date(nowTick).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase(), [nowTick]);
  const done = completedGoals.length;
  const total = visibleGoals.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const dueSoon = pendingGoals.filter((g) => timeToMinutes(g.reminder) < Number.MAX_SAFE_INTEGER).length;
  const weekly = useMemo(() => weeklyStats(goals), [goals]);
  const streakDays = useMemo(() => completionStreak(goals), [goals]);

  useEffect(() => {
    masterTimerRef.current = setInterval(() => setNowTick(Date.now()), 1000);
    const minuteTimer = setInterval(() => setNowMinuteTick(Date.now()), 60000);
    return () => { clearInterval(masterTimerRef.current); clearInterval(minuteTimer); };
  }, []);
  
  useEffect(() => { return () => { clearTimeout(pulseTimerRef.current); clearTimeout(celebrateTimerRef.current); clearTimeout(globalCelebrationTimerRef.current); if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer); }; }, []);
  useEffect(() => { setTabSwitching(true); const t = setTimeout(() => setTabSwitching(false), 200); return () => clearTimeout(t); }, [activeView]);

  useEffect(() => {
    const loadInitData = async () => {
      const [raw, uiState, prefs, journalRaw, habitsRaw, goalsRaw] = await Promise.all([
        readStorage(), readUiState(), readPrefs(), readPersist(JOURNAL_KEY), readPersist(HABITS_KEY), readPersist(GOALS_KEY)
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
      }
      if (journalRaw) { try { setJournalEntries(JSON.parse(journalRaw)); } catch{} }
      if (habitsRaw) { try { setHabitsData(JSON.parse(habitsRaw)); } catch{} }
      if (goalsRaw) { try { setGoalsData(JSON.parse(goalsRaw)); } catch{} }
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'tasks') setActiveView('tasks');
      setLoaded(true);
      
      initializeNotifications().then(setNotifPerm);
      if (getNotificationPermission() === "default") requestNotificationPermission().then(setNotifPerm);
    };
    loadInitData();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeUiState({ activeDate, activeView, searchTerm, priorityFilter, timeFilter, weekBase: weekBase instanceof Date ? weekBase.toISOString() : new Date().toISOString() });
    writePrefs({ themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled });
    scheduleTaskNotifications(goals); // ✅ Now strictly uses clean Local Notifications
  }, [activeDate, activeView, loaded, priorityFilter, searchTerm, timeFilter, weekBase, themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled, goals]);

  const save = useCallback((updated) => {
    setGoals(updated);
    let serialized = "[]";
    try { serialized = JSON.stringify(updated); } catch {}
    pendingWriteRef.current.last = serialized;
    if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer);
    pendingWriteRef.current.timer = setTimeout(() => { writeStorage(pendingWriteRef.current.last).catch(() => {}); }, 300);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (!loaded || !electronIpc?.send) return;
    electronIpc.send("schedule-reminders", goals);
  }, [electronIpc, goals, loaded]);

  useEffect(() => {
    if (!electronIpc?.send) return;
    electronIpc.send("update-tray-task", liveCurrentGoal?.text || "No live task right now");
  }, [electronIpc, liveCurrentGoal]);

  useEffect(() => {
    if (!electronIpc?.on) return undefined;
    const handler = (_event, payload) => setReminderPopup(payload);
    electronIpc.on("reminder-fired", handler);
    return () => electronIpc.removeListener?.("reminder-fired", handler);
  }, [electronIpc]);

  useEffect(() => {
    if (!liveHighlightEnabled) return;
    if (!liveCurrentGoal?.id) {
      liveTaskRef.current = undefined;
      return;
    }
    if (liveTaskRef.current === liveCurrentGoal.id) return;
    liveTaskRef.current = liveCurrentGoal.id;
    setLiveTaskPopup(liveCurrentGoal);
    electronIpc?.send?.("notify-task-shift", {
      text: liveCurrentGoal.text,
      startTime: liveCurrentGoal.startTime,
      endTime: liveCurrentGoal.endTime,
      session: liveCurrentGoal.session,
    });
  }, [electronIpc, liveCurrentGoal, liveHighlightEnabled]);

  useEffect(() => {
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

  useEffect(() => {
    if (!loaded) return undefined;

    const refreshNotifications = () => {
      scheduleTaskNotifications(goals);
      electronIpc?.send?.("schedule-reminders", goals);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") refreshNotifications();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    let cleanup = () => {};
    if (window.Capacitor) {
      import("@capacitor/app")
        .then(async ({ App }) => {
          const listener = await App.addListener("appStateChange", ({ isActive }) => {
            if (!isActive) refreshNotifications();
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

  const calculateNextUpcomingTask = useCallback(() => { 
    const currentTime = new Date().toTimeString().slice(0, 5); 
    return pendingGoals.filter(task => task.startTime && task.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null; 
  }, [pendingGoals]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTask = calculateNextUpcomingTask();
      if (nextTask) { 
        const timeUntilStart = new Date(`${nextTask.date}T${nextTask.startTime}`) - new Date(); 
        if (timeUntilStart <= 300000 && timeUntilStart > 0) { 
          if (!nextAlertShownRef.current[nextTask.id]) {
            setUpUpcomingTaskAlert(nextTask); 
            AudioPlayer.playReminder(); 
            nextAlertShownRef.current[nextTask.id] = true; 
          }
        }
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [calculateNextUpcomingTask]);

  useEffect(() => { setNextUpcomingTask(calculateNextUpcomingTask()); }, [calculateNextUpcomingTask]);

  const aiBriefing = useMemo(() => {
    const highPriority = pendingGoals.filter((goal) => goal.priority === "High").slice(0, 2);
    const untimed = pendingGoals.filter((goal) => !goal.startTime).slice(0, 2);
    const overdue = pendingGoals.filter((goal) => goal.endTime && timeToMinutes(goal.endTime) < nowMinutes);

    return {
      headline: liveCurrentGoal
        ? `Stay locked on "${liveCurrentGoal.text}" until ${liveCurrentGoal.endTime || liveCurrentGoal.startTime || "the next block"}.`
        : nextUpcomingGoal
          ? `Prep for "${nextUpcomingGoal.text}" before ${nextUpcomingGoal.startTime}.`
          : "Your board is open. Plan one focused block and keep the rest light.",
      risk: overdue.length
        ? `${overdue.length} task${overdue.length > 1 ? "s are" : " is"} overdue right now.`
        : highPriority.length
          ? `High priority waiting: ${highPriority.map((goal) => goal.text).join(", ")}.`
          : "No urgent blockers detected.",
      suggestion: untimed.length
        ? `Assign time slots to: ${untimed.map((goal) => goal.text).join(", ")}.`
        : pendingGoals.length
          ? "Good structure already. Keep only the next 1 or 2 priorities visible."
          : "Day looks clear. This is a good moment to plan tomorrow.",
    };
  }, [liveCurrentGoal, nextUpcomingGoal, nowMinutes, pendingGoals]);

  const aiWeeklyAnalysis = useMemo(() => {
    const bestDay = weekly.bestDay?.name || "N/A";
    const weakestDay = weekly.days.reduce((lowest, day) => (!lowest || day.pct < lowest.pct ? day : lowest), null)?.name || "N/A";
    const totalPending = goals.filter((goal) => !isDoneOn(goal, todayKey()) && goalVisibleOn(goal, todayKey())).length;
    const completionTrend = weekly.days.map((day) => day.pct < 0 ? 0 : day.pct);
    const trendDelta = completionTrend.length > 1 ? completionTrend[completionTrend.length - 1] - completionTrend[0] : 0;
    const predictedPct = Math.max(20, Math.min(100, Math.round(weekly.weekPct + trendDelta * 0.35)));
    const nextWeekPlan = [
      {
        title: "Protect your best day",
        detail: `Use ${bestDay} for deep work or hardest priorities.`,
      },
      {
        title: "Repair the weak slot",
        detail: `Keep ${weakestDay} lighter with only 2-3 must-do tasks.`,
      },
      {
        title: "Start earlier",
        detail: totalPending > 3 ? "Move one pending task into a fixed morning block." : "Keep the morning free for your biggest win.",
      },
    ];

    return {
      summary: weekly.weekTotal
        ? `You finished ${weekly.weekDone} of ${weekly.weekTotal} visible tasks this week, around ${weekly.weekPct}%.`
        : "This week has very little tracked data. Start logging tasks daily for stronger analysis.",
      momentum: streakDays >= 3
        ? `Your streak is ${streakDays} days. Protect it with a light but consistent tomorrow plan.`
        : "Momentum is still building. Small repeatable wins will help more than heavy one-day pushes.",
      pattern: `Best day: ${bestDay}. Lowest output day: ${weakestDay}. Pending today: ${totalPending}.`,
      advice: weekly.weekPct >= 80
        ? "You can now reduce overload and focus more on deep-work quality."
        : weekly.weekPct >= 50
          ? "Completion is decent, but time-blocking your top priorities earlier will help."
          : "Your board may be overfilled. Cut daily load and assign exact start times to the top 3 tasks.",
      trend: trendDelta >= 0 ? `Trend is improving by about ${Math.abs(trendDelta)} points from the start of the week.` : `Trend dipped by about ${Math.abs(trendDelta)} points during the week.`,
      predictedPct,
      chartPoints: completionTrend,
      nextWeekPlan,
    };
  }, [goals, streakDays, weekly]);

  useEffect(() => {
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

  const onTaskTextChange = useCallback((value) => {
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
      const fallback = [
        "09:00 - 10:30 - 🧠 Deep Work & Focus Session",
        "10:30 - 10:45 - ☕ Short Break & Stretch",
        "10:45 - 12:00 - 📧 Emails & Admin Tasks",
        "12:00 - 13:00 - 🥗 Lunch Break",
        "13:00 - 15:00 - 🤝 Meetings & Collaboration",
        "15:00 - 17:00 - ✅ Review & Wrap Up"
      ].join('\n');
      onTaskTextChange(fallback);
      window.alert('AI unavailable — showing smart default schedule instead!');
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
  const handleImportTasks = useCallback((importedTasks) => { save([...goals, ...importedTasks.map(task => ({ ...normalizeGoal(task), id: Date.now() + Math.random() }))]); }, [goals, save]);
  const markAllPendingDone = () => { const pendingIds = new Set(pendingGoals.map((g) => g.id)); save(goals.map((g) => { if (!pendingIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: true }; return { ...g, doneOn: { ...(g.doneOn || {}), [activeDate]: true } }; })); };
  const reopenAllCompleted = () => { const completedIds = new Set(completedGoals.map((g) => g.id)); save(goals.map((g) => { if (!completedIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: false }; const nextDoneOn = { ...(g.doneOn || {}) }; delete nextDoneOn[activeDate]; return { ...g, doneOn: nextDoneOn }; })); };
  const duplicatePendingToTomorrow = () => { const d = new Date(`${activeDate}T00:00:00`); d.setDate(d.getDate() + 1); const nextKey = toKey(d); const copies = pendingGoals.map((g, idx) => normalizeGoal({ ...g, id: Date.now() + idx, date: nextKey, done: false, doneOn: {}, repeat: "None" })); if (copies.length) save([...goals, ...copies]); };
  const handleApplyTemplate = useCallback((tasks) => { const today = todayKey(); const newGoals = tasks.map(text => ({ id: Date.now() + Math.random(), text: text.trim(), date: today, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium', doneOn: {} })); save([...goals, ...newGoals]); }, [goals, save]);

  const clearAppCache = useCallback(async () => {
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

  const openAndroidBatterySettings = useCallback(async () => {
    try {
      const plugin = window.Capacitor?.Plugins?.DeviceSettings;
      if (plugin?.openBatteryOptimizationSettings) {
        await plugin.openBatteryOptimizationSettings();
        return;
      }
      window.alert("Battery optimization settings shortcut is available in Android build.");
    } catch {
      window.alert("Unable to open battery optimization settings on this device.");
    }
  }, []);

  const openAndroidAppSettings = useCallback(async () => {
    try {
      const plugin = window.Capacitor?.Plugins?.DeviceSettings;
      if (plugin?.openAppSettings) {
        await plugin.openAppSettings();
        return;
      }
      window.alert("App settings shortcut is available in Android build.");
    } catch {
      window.alert("Unable to open app settings on this device.");
    }
  }, []);

  const clearLocalAppData = useCallback(async () => {
    await Promise.all([
      writeStorage("[]"),
      writePrefs({}),
      writeUiState({}),
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

  const generateMonthlyReport = useCallback(() => {
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
  ];
  const tabItems = [...mainTabItems.map(t => ({...t, icon: t.id === 'insights' ? '📊' : t.id === 'analytics' ? '📈' : t.icon})), ...moreTabItems];

  return (
    <div className={`page ${themeClass}${isPlannerIframeView ? " planner-mode" : ""}`} style={{ "--task-font-size": `${taskFontSize}px`, "--task-font-family": taskFontFamily, "--ui-scale": `${uiScale / 100}`, "--global-font-weight": fontWeight }} onTouchStart={handleGlobalTouchStart} onTouchEnd={handleGlobalTouchEnd}>
      <div className="app">
        <div className="tab-nav">
          {tabItems.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => setActiveView(tab.id)}>
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
              <div className="m-title">{editingGoal ? '✏️ Edit Task' : '➕ New Task'}</div>

              <div className="fg">
                <label className="fl">Task Description</label>
                <textarea
                  className="fi task-box"
                  placeholder="What needs to be done? (e.g. Meeting 9am-10am)"
                  value={form.text}
                  onChange={e => onTaskTextChange(e.target.value)}
                  autoFocus
                />
                <div className="form-hint">💡 Type "meeting 9am-10am" to auto-fill time fields</div>
              </div>

              <div className="fg">
                <label className="fl">AI Context</label>
                <textarea
                  className="fi task-box"
                  placeholder="Optional: tell AI your focus, energy level, or preferred schedule style"
                  value={aiContext}
                  onChange={e => setAiContext(e.target.value)}
                  style={{ minHeight: '78px' }}
                />
              </div>

              <div className="fg">
                <label className="fl">Date</label>
                <input type="date" className="fi" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg">
                  <label className="fl">Start Time</label>
                  <input type="time" className="fi" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="fg">
                  <label className="fl">End Time</label>
                  <input type="time" className="fi" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>

              <div className="fg">
                <label className="fl">🔔 Reminder Time</label>
                <input type="time" className="fi" value={form.reminder} onChange={e => setForm(p => ({ ...p, reminder: e.target.value }))} />
              </div>

              <div className="fg">
                <label className="fl">Priority</label>
                <select className="fs" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg">
                  <label className="fl">Session</label>
                  <select className="fs" value={form.session} onChange={e => setForm(p => ({ ...p, session: e.target.value }))}>
                    {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Repeat</label>
                  <select className="fs" value={form.repeat} onChange={e => setForm(p => ({ ...p, repeat: e.target.value }))}>
                    {REPEAT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="new-btn" style={{ flex: 2 }} onClick={submitForm}>
                  {editingGoal ? '💾 Save Changes' : '✅ Add Task'}
                </button>
                <button className="hero-btn" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>

              {!editingGoal && (
                <button className="tool-btn" style={{ width: '100%', marginTop: '10px', opacity: aiLoading ? 0.7 : 1 }} onClick={handleAiAutoSchedule} disabled={aiLoading}>
                  {aiLoading ? '⏳ AI is thinking...' : '🤖 AI Auto-Schedule'}
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
                <div className="toast-title">Next task starting soon!</div>
                <div className="toast-message">"{upcomingTaskAlert.text}" at {upcomingTaskAlert.startTime}</div>
              </div>
              <button className="toast-close" onClick={() => setUpUpcomingTaskAlert(null)}>✕</button>
            </div>
            <div className="toast-progress-bar"><div className="toast-progress-fill"></div></div>
          </div>
        )}

        {reminderPopup && (
          <div className="overlay" onClick={() => setReminderPopup(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">🔔 Task Reminder</div>
              <div className="fg"><div className="fl">Task</div><div className="fi">{reminderPopup.text}</div></div>
              {(reminderPopup.startTime || reminderPopup.endTime) && (<div className="fg"><div className="fl">Time</div><div className="fi">{formatTimeRange(reminderPopup.startTime, reminderPopup.endTime)}</div></div>)}
              {reminderPopup.session && (<div className="fg"><div className="fl">Session</div><div className="fi">{reminderPopup.session}</div></div>)}
              <div style={{ textAlign: 'center', marginTop: '16px' }}><button className="new-btn" onClick={() => setReminderPopup(null)}>Got it</button></div>
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

          {activeView === "insights" && <div key="insights" className="view-transition"><DashboardView userName={userName} quote={quote} setActiveView={setActiveView} done={done} total={total} pct={pct} weekly={weekly} streakDays={streakDays} dueSoon={dueSoon} goals={goals} journalEntries={journalEntries} generateMonthlyReport={generateMonthlyReport} /></div>}
          {activeView === "tasks" && (
            <div key="tasks" className="view-transition">
              <TasksView
                activeDate={activeDate} setActiveDate={setActiveDate} activeDateLabel={activeDateLabel} weekBase={weekBase} setWeekBase={setWeekBase} weekDays={weekDays}
                liveClockLabel={liveClockLabel} done={done} total={total} pct={pct} nextUpcomingGoal={nextUpcomingGoal} setForm={setForm} setEditingGoal={setEditingGoal} setShowForm={setShowForm}
                liveCurrentGoal={liveCurrentGoal} liveCountdown={liveCountdown} focusMode={focusMode} setFocusMode={setFocusMode} showCelebration={showCelebration} setShowCelebration={setShowCelebration}
                liveHighlightEnabled={liveHighlightEnabled} aiBriefing={aiBriefing} openAiPlanner={() => { setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" }); setEditingGoal(null); setAiContext(""); setShowForm(true); }}
                goals={goals} dotsFor={dotsFor} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchRef={searchRef} pendingGoals={pendingGoals} completedGoals={completedGoals} visibleGoals={visibleGoals}
                selectedGoalIds={selectedGoalIds} selectedSet={selectedSet} selectAllVisibleGoals={selectAllVisibleGoals} deleteSelectedGoals={deleteSelectedGoals} clearSelectedGoals={clearSelectedGoals}
                completedPulseId={completedPulseId} celebratingGoalId={celebratingGoalId} toggleDoneWithCelebration={toggleDoneWithCelebration} removeGoal={removeGoal} toggleSelectGoal={toggleSelectGoal}
                markAllPendingDone={markAllPendingDone} duplicatePendingToTomorrow={duplicatePendingToTomorrow} reopenAllCompleted={reopenAllCompleted}
              />
            </div>
          )}
          {activeView === "planner" && <div key="planner" className="view-transition"><PlannerView plannerView={plannerView} setPlannerView={setPlannerView} goals={goals} setActiveDate={setActiveDate} setActiveView={setActiveView} /></div>}
          {activeView === "analytics" && <div key="analytics" className="view-transition"><AnalyticsView setShowPomodoro={setShowPomodoro} setShowImportExport={setShowImportExport} setActiveView={setActiveView} goals={goals} weekly={weekly} aiWeeklyAnalysis={aiWeeklyAnalysis} appLanguage={appLanguage} copy={copy} /></div>}
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
          {mainTabItems.map(tab => (
            <button key={tab.id} className={`mobile-nav-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setActiveView(tab.id); setShowMoreMenu(false); }}>
              <span className="mobile-nav-icon">{tab.icon}</span><span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
          <button className={`mobile-nav-btn ${showMoreMenu ? 'active' : ''}`} onClick={() => { if(typeof triggerHaptic==='function') triggerHaptic('light'); setShowMoreMenu(!showMoreMenu); }}>
            <span className="mobile-nav-icon">⋯</span><span className="mobile-nav-label">{copy.tabs.more}</span>
          </button>
        </div>

        {showMoreMenu && (
          <div className="more-menu-overlay" onClick={() => setShowMoreMenu(false)}>
            <div className="more-menu" onClick={(e) => e.stopPropagation()}>
              <div className="more-menu-header"><h3>{copy.tabs.more}</h3><button className="more-menu-close" onClick={() => setShowMoreMenu(false)}>✕</button></div>
              <div className="more-menu-items">
                {moreTabItems.map(tab => (
                  <button key={tab.id} className={`more-menu-item ${activeView === tab.id ? 'active' : ''}`} onClick={() => { setActiveView(tab.id); setShowMoreMenu(false); }}>
                    <span className="more-menu-icon">{tab.icon}</span><span className="more-menu-label">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
