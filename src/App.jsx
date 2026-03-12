import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import OneSignal from 'react-onesignal'; 
import PomodoroTimer from "./components/PomodoroTimer";
import TaskImportExport from "./components/TaskImportExport";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification,
  initializeNotifications,
  scheduleTaskNotifications,
} from "./services/notifications";
import { scheduleTaskNotifications as scheduleOneSignalNotifications } from "./services/oneSignal";

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

import { REPEAT_OPTIONS, SESSION_OPTIONS, PRIORITY_OPTIONS, FONT_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES, QUOTES, PRIORITY_RANK, JOURNAL_KEY, HABITS_KEY, GOALS_KEY } from "./utils/constants";
import {
  todayKey, toKey, timeToMinutes, hasSameStartEnd, isTimeLiveNow, formatTimeRange, goalTimeMinutes, matchesTimeFilter,
  getWeekDays, normalizeGoal, goalVisibleOn, isDoneOn, readStorage, writeStorage, readPrefs, writePrefs,
  readUiState, writeUiState, readPersist, writePersist, AudioPlayer, playSuccessTone, playTaskCompleteTone, weeklyStats, completionStreak,
  parseTaskLine, formatCountdown, getTimeRemainingMs
} from "./utils/helpers";

export default function DailyGoals() {
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeDate, setActiveDate] = useState(todayKey());
  const [weekBase, setWeekBase] = useState(new Date());
  const [activeView, setActiveView] = useState("tasks");
  const [notifPerm, setNotifPerm] = useState("default");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All Times");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [themeMode, setThemeMode] = useState("dark");
  const [taskFontSize, setTaskFontSize] = useState(18);
  const [taskFontFamily, setTaskFontFamily] = useState(FONT_OPTIONS[0].value);
  const [uiScale, setUiScale] = useState(96);
  const [overdueEnabled, setOverdueEnabled] = useState(true);
  const [fontWeight, setFontWeight] = useState(500);
  const [soundTheme, setSoundTheme] = useState('default');
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  
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
  const [upcomingTaskAlert, setUpcomingTaskAlert] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [nextUpcomingTask, setNextUpcomingTask] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [journalEntries, setJournalEntries] = useState({});
  const [showWeeklyWizard, setShowWeeklyWizard] = useState(false);
  const [habitsData, setHabitsData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [tabSwitching, setTabSwitching] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
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
    const initOneSignal = async () => {
      try {
        await OneSignal.init({ appId: "f98c4786-2104-4f35-936c-7b810f1d13ca", allowLocalhostAsSecureOrigin: true });
        OneSignal.Slidedown.promptPush();
      } catch (error) { console.error("OneSignal Initialization Error:", error); }
    };
    initOneSignal();
  }, []);

  const isEOD = useMemo(() => {
    const now = new Date(nowTick);
    return (now.getHours() >= 22 && now.getMinutes() >= 30) || now.getHours() >= 23;
  }, [nowTick]);

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
  const nowMinutes = useMemo(() => { const now = new Date(nowTick); return now.getHours() * 60 + now.getMinutes(); }, [nowTick]);
  
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

  useEffect(() => { masterTimerRef.current = setInterval(() => setNowTick(Date.now()), 1000); return () => clearInterval(masterTimerRef.current); }, []);
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
        setTaskFontSize(Number(prefs.taskFontSize) || 18);
        setTaskFontFamily(prefs.taskFontFamily || FONT_OPTIONS[0].value);
        setUiScale(Number(prefs.uiScale) || 96);
        if (typeof prefs.overdueEnabled === 'boolean') setOverdueEnabled(prefs.overdueEnabled);
        if (prefs.fontWeight) setFontWeight(Number(prefs.fontWeight) || 500);
        if (prefs.soundTheme) setSoundTheme(prefs.soundTheme);
        if (typeof prefs.autoStartEnabled === 'boolean') setAutoStartEnabled(prefs.autoStartEnabled);
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
    writePrefs({ themeMode, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, autoStartEnabled });
    scheduleTaskNotifications(goals);
    scheduleOneSignalNotifications(goals);
  }, [activeDate, activeView, loaded, priorityFilter, searchTerm, timeFilter, weekBase, themeMode, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, autoStartEnabled, goals]);

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
    if (!reminderPopup) return;
    const timer = setTimeout(() => setReminderPopup(null), 12000); return () => clearTimeout(timer);
  }, [reminderPopup]);

  const calculateNextUpcomingTask = useCallback(() => { 
    const currentTime = new Date().toTimeString().slice(0, 5); 
    return pendingGoals.filter(task => task.startTime && task.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null; 
  }, [pendingGoals]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTask = calculateNextUpcomingTask();
      if (nextTask) { 
        const timeUntilStart = new Date(`${nextTask.date}T${nextTask.startTime}`) - new Date(); 
        if (timeUntilStart <= 300000 && timeUntilStart > 0) { setUpcomingTaskAlert(nextTask); AudioPlayer.playReminder(); }
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [calculateNextUpcomingTask]);

  useEffect(() => { setNextUpcomingTask(calculateNextUpcomingTask()); }, [calculateNextUpcomingTask]);

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

  const onTaskTextChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, text: value };
      const cleaned = value.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
      if (cleaned.length === 1) { const parsed = parseTaskLine(cleaned[0], prev); if (parsed.matchedRange) { next.text = parsed.text; next.startTime = parsed.startTime; next.endTime = parsed.endTime; next.reminder = parsed.reminder; next.session = parsed.session; } }
      return next;
    });
  };

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

  const handleAiAutoSchedule = () => {
    const suggestions = [
      "09:00 AM - 10:30 AM - 🧠 Deep Work & Strategy",
      "10:30 AM - 10:45 AM - 🚶‍♂️ Quick Stretch & Hydrate",
      "10:45 AM - 12:00 PM - 📧 Clear Inbox & Admin",
      "12:00 PM - 01:00 PM - 🥗 Healthy Lunch Break",
      "01:00 PM - 02:30 PM - 🤝 Meetings & Syncs"
    ].join("\n");
    onTaskTextChange(suggestions);
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
  const handleApplyTemplate = useCallback((tasks) => { const today = todayKey(); const newGoals = tasks.map(text => ({ id: Date.now() + Math.random(), text: text.trim(), date: today, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium', doneOn: {} })); save(prev => [...prev, ...newGoals]); }, [save]);

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
  const activeDateLabel = activeDate === todayKey() ? "Today's Focus" : new Date(`${activeDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

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
    <div className={`page ${themeClass}${isPlannerIframeView ? " planner-mode" : ""}`} style={{ "--task-font-size": `${taskFontSize}px`, "--task-font-family": taskFontFamily, "--ui-scale": `${uiScale / 100}`, "--global-font-weight": fontWeight }}>
      <div className="app">
        <div className="tab-nav">
          {tabItems.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => setActiveView(tab.id)}>
              <span className="tab-icon">{tab.icon}</span><span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

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
              <button className="toast-close" onClick={() => setUpcomingTaskAlert(null)}>✕</button>
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

          {activeView === "insights" && <div key="insights" className="view-transition"><DashboardView quote={quote} setActiveView={setActiveView} done={done} total={total} pct={pct} weekly={weekly} streakDays={streakDays} dueSoon={dueSoon} goals={goals} journalEntries={journalEntries} generateMonthlyReport={generateMonthlyReport} /></div>}
          {activeView === "tasks" && (
            <div key="tasks" className="view-transition">
              <TasksView
                activeDate={activeDate} setActiveDate={setActiveDate} activeDateLabel={activeDateLabel} weekBase={weekBase} setWeekBase={setWeekBase} weekDays={weekDays}
                liveClockLabel={liveClockLabel} done={done} total={total} pct={pct} nextUpcomingGoal={nextUpcomingGoal} setForm={setForm} setEditingGoal={setEditingGoal} setShowForm={setShowForm}
                liveCurrentGoal={liveCurrentGoal} liveCountdown={liveCountdown} focusMode={focusMode} setFocusMode={setFocusMode} showCelebration={showCelebration} setShowCelebration={setShowCelebration}
                goals={goals} dotsFor={dotsFor} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchRef={searchRef} pendingGoals={pendingGoals} completedGoals={completedGoals} visibleGoals={visibleGoals}
                selectedGoalIds={selectedGoalIds} selectedSet={selectedSet} selectAllVisibleGoals={selectAllVisibleGoals} deleteSelectedGoals={deleteSelectedGoals} clearSelectedGoals={clearSelectedGoals}
                completedPulseId={completedPulseId} celebratingGoalId={celebratingGoalId} toggleDoneWithCelebration={toggleDoneWithCelebration} removeGoal={removeGoal} toggleSelectGoal={toggleSelectGoal}
                markAllPendingDone={markAllPendingDone} duplicatePendingToTomorrow={duplicatePendingToTomorrow} reopenAllCompleted={reopenAllCompleted}
              />
            </div>
          )}
          {activeView === "planner" && <div key="planner" className="view-transition"><PlannerView plannerView={plannerView} setPlannerView={setPlannerView} goals={goals} setActiveDate={setActiveDate} setActiveView={setActiveView} /></div>}
          {activeView === "analytics" && <div key="analytics" className="view-transition"><AnalyticsView setShowPomodoro={setShowPomodoro} setShowImportExport={setShowImportExport} setActiveView={setActiveView} goals={goals} weekly={weekly} /></div>}
          {activeView === "career" && <div key="career" className="view-transition"><CareerView /></div>}
          {activeView === "tools" && <div key="tools" className="view-transition"><ToolsView onOpenPomodoro={() => setShowPomodoro(true)} /><div style={{ padding: '0 20px', maxWidth: '900px', margin: '0 auto' }}><TaskTemplates onApplyTemplate={handleApplyTemplate} /></div></div>}
          {activeView === "settings" && <div key="settings" className="view-transition"><SettingsView setActiveView={setActiveView} themeMode={themeMode} setThemeMode={setThemeMode} taskFontFamily={taskFontFamily} setTaskFontFamily={setTaskFontFamily} taskFontSize={taskFontSize} setTaskFontSize={setTaskFontSize} uiScale={uiScale} setUiScale={setUiScale} overdueEnabled={overdueEnabled} setOverdueEnabled={setOverdueEnabled} fontWeight={fontWeight} setFontWeight={setFontWeight} soundTheme={soundTheme} setSoundTheme={setSoundTheme} autoStartEnabled={autoStartEnabled} setAutoStartEnabled={setAutoStartEnabled} /></div>}
          {activeView === "habits" && <div key="habits" className="view-transition"><HabitsView /></div>}
          {activeView === "journal" && <div key="journal" className="view-transition"><JournalView /></div>}
          {activeView === "goals" && <div key="goals" className="view-transition"><GoalsView /></div>}
        </Suspense>

        {focusMode && activeView === "tasks" && <div className="focus-overlay" onClick={() => setFocusMode(false)} style={{ backdropFilter: 'blur(4px)' }} />}

        {showWeeklyWizard && <WeeklyPlannerWizard goals={goals} onClose={() => setShowWeeklyWizard(false)} />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">{editingGoal ? "✏️ Edit Task" : "➕ Add New Task"}</div>
              <div className="fg">
                <div className="fl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Task Description</span>
                  {!editingGoal && <button className="mini-btn" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', border: 'none' }} onClick={handleAiAutoSchedule}>✨ AI Auto-Plan</button>}
                </div>
                <textarea className="fi task-box" placeholder="Enter your task..." value={form.text} onChange={(e) => onTaskTextChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); submitForm(); } }} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg"><div className="fl">Date</div><input type="date" className="fi" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="fg"><div className="fl">Priority</div><select className="fi" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITY_OPTIONS.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg"><div className="fl">Start Time</div><input type="time" className="fi" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
                <div className="fg"><div className="fl">End Time</div><input type="time" className="fi" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg"><div className="fl">Reminder</div><input type="time" className="fi" value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })} /></div>
                <div className="fg"><div className="fl">Session</div><select className="fi" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>{SESSION_OPTIONS.map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
              </div>
              <div className="fg"><div className="fl">Repeat</div><select className="fi" value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>{REPEAT_OPTIONS.map(r => (<option key={r} value={r}>{r}</option>))}</select></div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="mini-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="new-btn" onClick={submitForm}>{editingGoal ? "💾 Update" : "➕ Add Task"}</button>
              </div>
            </div>
          </div>
        )}

        {showPomodoro && (
          <div className="overlay" onClick={() => setShowPomodoro(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">🍅 Pomodoro Timer</div>
              <PomodoroTimer onTaskComplete={playTaskCompleteTone} onBreakComplete={playSuccessTone} />
              <div style={{ textAlign: 'center', marginTop: '16px' }}><button className="mini-btn" onClick={() => setShowPomodoro(false)}>Close</button></div>
            </div>
          </div>
        )}

        {showImportExport && (
          <div className="overlay" onClick={() => setShowImportExport(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">📥 Import/Export Tasks</div>
              <TaskImportExport goals={goals} onImport={handleImportTasks} />
              <div style={{ textAlign: 'center', marginTop: '16px' }}><button className="mini-btn" onClick={() => setShowImportExport(false)}>Close</button></div>
            </div>
          </div>
        )}

        {focusMode && liveCurrentGoal && (
          <div className="focus-wall-overlay" style={{ zIndex: 10000 }}>
            <button className="focus-wall-exit" onClick={() => setFocusMode(false)}>Exit Focus Mode</button>
            <div className="focus-wall-content">
              <div className="focus-wall-label">CURRENT FOCUS</div>
              <div className="focus-wall-task">
                 {(() => {
                  const match = liveCurrentGoal.text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
                  return match ? <><span className="animated-emoji" style={{ fontSize: '1.5em' }}>{match[1]}</span>{match[2]}</> : liveCurrentGoal.text;
                })()}
              </div>
              <div className="focus-wall-time">{liveCurrentGoal.startTime} - {liveCurrentGoal.endTime}</div>
              <div className="focus-wall-countdown">{liveCountdown || "00:00"}</div>
              <button className="focus-wall-done-btn" onClick={() => { toggleDoneWithCelebration(liveCurrentGoal); setFocusMode(false); }}>MARK MISSION COMPLETE</button>
            </div>
          </div>
        )}

        {/* 🔥 PERFECT INLINE STATUS BAR 🔥 */}
        <div className="status-bar custom-mobile-status-bar">
          <div className="status-bar-left">
            <span className="status-clock">{liveClockLabel}</span>
            <span className="status-divider hidden-mobile">•</span>
            <span className="status-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          
          <div className="status-bar-center">
            {liveCurrentGoal ? (
              <div className="live-task-wrapper">
                <div className="task-title-row">
                  <span className="status-live-dot"></span>
                  <span className="status-task-name">{liveCurrentGoal.text}</span>
                </div>
                {liveCountdown && <span className="status-countdown">{liveCountdown}</span>}
              </div>
            ) : (
              <span className="status-idle">No active task at the moment</span>
            )}
          </div>
          
          <div className="status-bar-right">
            <div className="status-progress-wrap">
              <div className="status-progress-bar">
                <div className="status-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="status-progress-text">{done}/{total} ({pct}%)</span>
            </div>
            
            {/* 🔥 BUTTON MOVED INSIDE THE BOX 🔥 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span className="status-streak hidden-mobile" style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold' }}>🔥 {streakDays}d</span>
              {activeView === "tasks" && (
                <button className={`status-focus-btn ${focusMode ? 'active' : ''}`} onClick={() => setFocusMode(f => !f)}>
                  {focusMode ? '🔓 Exit Focus' : '🧊 Focus'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 CSS FOR PERFECT SPACING (NO OVERLAP, NO GAPS) 🔥 */}
        <style dangerouslySetInnerHTML={{__html: `
          /* 🌟 NEW INLINE FOCUS BUTTON 🌟 */
          .status-focus-btn {
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
            transition: all 0.2s ease;
            margin: 0 !important; /* Removes floating margins */
          }
          .status-focus-btn.active {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          }

          @media (max-width: 768px) {
            .custom-mobile-status-bar {
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              gap: 12px !important;
              /* 🔥 PERFECT PADDING, NO EXTRA SPACE AT BOTTOM 🔥 */
              padding: 14px 16px !important; 
              height: auto !important;
              min-height: auto !important;
              border-top: 1px solid rgba(255,255,255,0.1);
              position: relative !important;
            }
            .custom-mobile-status-bar .status-bar-left {
              width: 100% !important;
              justify-content: space-between !important;
              font-size: 0.85rem !important;
              opacity: 0.8;
              font-weight: 600;
            }
            .custom-mobile-status-bar .status-divider.hidden-mobile { display: none !important; }
            .custom-mobile-status-bar .status-bar-center {
              width: 100% !important;
              justify-content: flex-start !important;
            }
            
            .custom-mobile-status-bar .live-task-wrapper {
              display: flex !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 8px !important;
              width: 100% !important;
            }
            .custom-mobile-status-bar .task-title-row {
              display: flex !important;
              align-items: flex-start !important;
              gap: 8px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .custom-mobile-status-bar .status-live-dot {
              margin-top: 6px !important; 
              flex-shrink: 0 !important;
            }
            .custom-mobile-status-bar .status-task-name {
              flex: 1 !important;
              white-space: normal !important; /* 🔥 TEXT WRAP ENABLED 🔥 */
              font-size: 0.95rem !important;
              font-weight: 700 !important;
              line-height: 1.3 !important;
              color: var(--text) !important;
            }
            .custom-mobile-status-bar .status-countdown {
              font-size: 0.75rem !important;
              padding: 4px 8px !important;
              background: rgba(16, 185, 129, 0.15) !important;
              color: #10b981 !important;
              border-radius: 6px !important;
              margin-left: 20px !important; 
            }
            
            .custom-mobile-status-bar .status-bar-right {
              width: 100% !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              gap: 8px !important;
              /* 🔥 NO MORE RIGHT PADDING FOR FLOATING BUTTON 🔥 */
              padding-right: 0 !important; 
              padding-top: 4px !important;
              box-sizing: border-box !important;
            }
            .custom-mobile-status-bar .status-progress-wrap {
              flex: 1 !important;
              min-width: 100px;
            }
            .status-focus-btn {
              padding: 8px 16px !important;
              font-size: 0.8rem !important;
            }
          }
        `}} />

        <div className="mobile-bottom-nav">
          {mainTabItems.map(tab => (
            <button key={tab.id} className={`mobile-nav-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => { setActiveView(tab.id); setShowMoreMenu(false); }}>
              <span className="mobile-nav-icon">{tab.icon}</span><span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
          <button className={`mobile-nav-btn ${showMoreMenu ? 'active' : ''}`} onClick={() => setShowMoreMenu(!showMoreMenu)}>
            <span className="mobile-nav-icon">⋯</span><span className="mobile-nav-label">More</span>
          </button>
        </div>

        {showMoreMenu && (
          <div className="more-menu-overlay" onClick={() => setShowMoreMenu(false)}>
            <div className="more-menu" onClick={(e) => e.stopPropagation()}>
              <div className="more-menu-header"><h3>More Options</h3><button className="more-menu-close" onClick={() => setShowMoreMenu(false)}>✕</button></div>
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