import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PomodoroTimer from "./components/PomodoroTimer";
import TaskImportExport from "./components/TaskImportExport";
import TaskProgressIndicator from "./components/TaskProgressIndicator";
import EnhancedFocusMode from "./components/EnhancedFocusMode";
import TaskCompletionCelebration from "./components/TaskCompletionCelebration";
import DailyProductivityScore from "./components/DailyProductivityScore";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

// --- IMPORTS ---
import './App.css';
import { GoalItem, LiveTaskPopup, NextTaskAlert } from "./components/SharedUI";
import DashboardView from "./views/DashboardView";
import PlannerView from "./views/PlannerView";
import AnalyticsView from "./views/AnalyticsView";
import SettingsView from "./views/SettingsView";
import CareerView from "./views/CareerView";
import ToolsView from "./views/ToolsView";
import HabitsView from "./views/HabitsView";
import JournalView from "./views/JournalView";
import GoalsView from "./views/GoalsView";
import ShortcutsModal from "./components/ShortcutsModal";
import AchievementBadges from "./components/AchievementBadges";
import WeeklyPlannerWizard from "./components/WeeklyPlannerWizard";
import TaskTemplates from "./components/TaskTemplates";

import { REPEAT_OPTIONS, SESSION_OPTIONS, PRIORITY_OPTIONS, FONT_OPTIONS, THEME_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES, QUOTES, PRIORITY_RANK, JOURNAL_KEY, HABITS_KEY, GOALS_KEY } from "./utils/constants";
import {
  ipc, todayKey, toKey, timeToMinutes, hasSameStartEnd, isTimeLiveNow, formatTimeRange, goalTimeMinutes, matchesTimeFilter,
  getWeekDays, normalizeGoal, goalVisibleOn, isDoneOn, readStorage, writeStorage, readPrefs, writePrefs,
  readUiState, writeUiState, AudioPlayer, playSuccessTone, playTaskCompleteTone, weeklyStats, completionStreak,
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
  const [draftSettings, setDraftSettings] = useState({ taskFontSize: 18, taskFontFamily: FONT_OPTIONS[0].value, uiScale: 96, themeMode: "dark" });
  
  const [reminderPopup, setReminderPopup] = useState(null);
  const [liveTaskPopup, setLiveTaskPopup] = useState(null);
  const [nextTaskAlert, setNextTaskAlert] = useState(null);
  const [form, setForm] = useState({ text: "", date: todayKey(), reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
  const [completedPulseId, setCompletedPulseId] = useState(null);
  const [celebratingGoalId, setCelebratingGoalId] = useState(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState([]);
  
  const [plannerView, setPlannerView] = useState("monthly");
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [upcomingTaskAlert, setUpcomingTaskAlert] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [nextUpcomingTask, setNextUpcomingTask] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [soundTheme, setSoundTheme] = useState('default');
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [journalEntries, setJournalEntries] = useState({});
  const [showWeeklyWizard, setShowWeeklyWizard] = useState(false);
  const [timeTracking, setTimeTracking] = useState({}); // { goalId: { startedAt, elapsed } }
  const [habitsData, setHabitsData] = useState([]);
  const [goalsData, setGoalsData] = useState([]);

  // 🍅 MINI POMODORO STATE
  const [miniPomoActive, setMiniPomoActive] = useState(false);
  const [miniPomoSeconds, setMiniPomoSeconds] = useState(25 * 60);
  const [miniPomoPhase, setMiniPomoPhase] = useState('work'); // 'work' | 'break'
  const miniPomoRef = useRef(null);
  
  const pulseTimerRef = useRef(null);
  const celebrateTimerRef = useRef(null);
  const masterTimerRef = useRef(null);
  const searchRef = useRef(null);
  const liveTaskRef = useRef(undefined);
  const nextAlertShownRef = useRef({});
  const globalCelebrationTimerRef = useRef(null);
  const quote = QUOTES[Math.floor((Date.now() / 86400000) % QUOTES.length)];

  // 🍅 MINI POMODORO TIMER EFFECT
  useEffect(() => {
    if (!miniPomoActive) { clearInterval(miniPomoRef.current); return; }
    miniPomoRef.current = setInterval(() => {
      setMiniPomoSeconds(prev => {
        if (prev <= 1) {
          AudioPlayer.playComplete();
          if (miniPomoPhase === 'work') {
            setMiniPomoPhase('break');
            return 5 * 60;
          } else {
            setMiniPomoPhase('work');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(miniPomoRef.current);
  }, [miniPomoActive, miniPomoPhase]);

  const toggleMiniPomo = () => {
    if (!miniPomoActive) {
      setMiniPomoPhase('work');
      setMiniPomoSeconds(25 * 60);
    }
    setMiniPomoActive(!miniPomoActive);
  };

  const miniPomoLabel = useMemo(() => {
    const m = Math.floor(miniPomoSeconds / 60);
    const s = miniPomoSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [miniPomoSeconds]);

  // 🌙 EOD REFLECTION CHECK
  const isEOD = useMemo(() => {
    const now = new Date(nowTick);
    return now.getHours() >= 22 && now.getMinutes() >= 30 || now.getHours() >= 23;
  }, [nowTick]);

  // ============================================
  // DERIVED STATE & MEMOS
  // ============================================
  const weekDays = getWeekDays(weekBase);
  const visibleGoals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return goals
      .filter((g) => goalVisibleOn(g, activeDate))
      .filter((g) => (priorityFilter === "All" ? true : g.priority === priorityFilter))
      .filter((g) => matchesTimeFilter(g, timeFilter))
      .filter((g) => (term ? g.text.toLowerCase().includes(term) : true))
      .sort((a, b) => {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
          || timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
          || timeToMinutes(a.reminder) - timeToMinutes(b.reminder)
          || a.id - b.id;
      });
  }, [goals, activeDate, priorityFilter, searchTerm, timeFilter]);

  const pendingGoals = useMemo(() => visibleGoals.filter((g) => !isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const completedGoals = useMemo(() => visibleGoals.filter((g) => isDoneOn(g, activeDate)), [visibleGoals, activeDate]);
  const selectedSet = useMemo(() => new Set(selectedGoalIds), [selectedGoalIds]);
  const nowMinutes = useMemo(() => { const now = new Date(nowTick); return now.getHours() * 60 + now.getMinutes(); }, [nowTick]);
  
  const liveCurrentGoal = useMemo(() => (
    [...goals].filter((g) => goalVisibleOn(g, todayKey())).filter((g) => !isDoneOn(g, todayKey())).sort((a, b) => goalTimeMinutes(a) - goalTimeMinutes(b)).find((g) => isTimeLiveNow(g.startTime, g.endTime, nowMinutes)) || null
  ), [goals, nowMinutes]);
  
  // 🔥 FIND STRICTLY NEXT UPCOMING TASK 🔥
  const nextUpcomingGoal = useMemo(() => {
    const now = new Date(nowTick); 
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return [...goals]
      .filter((g) => goalVisibleOn(g, todayKey()))
      .filter((g) => !isDoneOn(g, todayKey()))
      .filter((g) => g.id !== liveCurrentGoal?.id) 
      .filter((g) => g.startTime && timeToMinutes(g.startTime) >= currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null;
  }, [goals, nowTick, liveCurrentGoal]);
  
  const liveCountdown = useMemo(() => {
    if (!liveCurrentGoal?.endTime) return null;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    return remaining !== null ? formatCountdown(remaining) : null;
  }, [liveCurrentGoal, nowTick]);

  // 🔥 CALCULATE PROGRESS PERCENTAGE 🔥
  const livePercent = useMemo(() => {
    if (!liveCurrentGoal || !liveCurrentGoal.startTime || !liveCurrentGoal.endTime) return 0;
    const startMins = timeToMinutes(liveCurrentGoal.startTime);
    const endMins = timeToMinutes(liveCurrentGoal.endTime);
    const totalMins = endMins - startMins;
    if (totalMins <= 0) return 0;
    const elapsedMins = nowMinutes - startMins;
    if (elapsedMins <= 0) return 0;
    const pct = Math.round((elapsedMins / totalMins) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [liveCurrentGoal, nowMinutes]);
  
  const shouldShowNextAlert = useMemo(() => {
    if (!liveCurrentGoal?.endTime) return false;
    const remaining = getTimeRemainingMs(liveCurrentGoal.endTime);
    if (remaining === null) return false;
    return Math.floor(remaining / 60000) === 5;
  }, [liveCurrentGoal, nowTick]);

  const liveClockLabel = useMemo(() => new Date(nowTick).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase(), [nowTick]);
  const done = completedGoals.length;
  const total = visibleGoals.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const dueSoon = pendingGoals.filter((g) => timeToMinutes(g.reminder) < Number.MAX_SAFE_INTEGER).length;
  const weekly = useMemo(() => weeklyStats(goals), [goals]);
  const streakDays = useMemo(() => completionStreak(goals), [goals]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => { masterTimerRef.current = setInterval(() => setNowTick(Date.now()), 1000); return () => clearInterval(masterTimerRef.current); }, []);
  useEffect(() => { return () => { clearTimeout(pulseTimerRef.current); clearTimeout(celebrateTimerRef.current); clearTimeout(globalCelebrationTimerRef.current); }; }, []);

  useEffect(() => {
    const loadPrefs = async () => {
      const saved = await readPrefs();
      if (saved) {
        setThemeMode(saved.themeMode || (saved.darkMode ? "dark" : "sunset-light"));
        setTaskFontSize(Number(saved.taskFontSize) || 18);
        setTaskFontFamily(saved.taskFontFamily || FONT_OPTIONS[0].value);
        setUiScale(Number(saved.uiScale) || 96);
        if (typeof saved.overdueEnabled === 'boolean') setOverdueEnabled(saved.overdueEnabled);
        if (saved.fontWeight) setFontWeight(Number(saved.fontWeight) || 500);
        if (saved.soundTheme) setSoundTheme(saved.soundTheme);
        if (typeof saved.autoStartEnabled === 'boolean') setAutoStartEnabled(saved.autoStartEnabled);
      }
    };
    loadPrefs();
  }, []);

  useEffect(() => { writePrefs({ themeMode, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, autoStartEnabled }); }, [themeMode, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, autoStartEnabled]);

  // Load journal entries for dashboard mood trend
  useEffect(() => {
    const loadJournal = async () => {
      try {
        const raw = await readPersist(JOURNAL_KEY);
        if (raw) setJournalEntries(JSON.parse(raw));
      } catch {}
    };
    loadJournal();
  }, [activeView]);

  // Load habits/goals data for badges
  useEffect(() => {
    const loadBadgeData = async () => {
      try {
        const hRaw = await readPersist(HABITS_KEY);
        if (hRaw) setHabitsData(JSON.parse(hRaw));
        const gRaw = await readPersist(GOALS_KEY);
        if (gRaw) setGoalsData(JSON.parse(gRaw));
      } catch {}
    };
    loadBadgeData();
  }, [activeView]);

  // Badge stats computation
  const badgeStats = useMemo(() => {
    const allDates = new Set();
    goals.forEach(g => { if (g.date) allDates.add(g.date); });
    let totalDone = 0;
    let hadPerfectDay = false;
    allDates.forEach(dateKey => {
      const vis = goals.filter(g => g.date === dateKey || (g.repeat !== 'None' && g.date <= dateKey));
      const dn = vis.filter(g => g.doneOn?.[dateKey]).length;
      totalDone += dn;
      if (vis.length > 0 && dn === vis.length) hadPerfectDay = true;
    });
    const journalCount = Object.keys(journalEntries).filter(k => journalEntries[k]?.mood || journalEntries[k]?.wellText).length;
    const habitCount = habitsData.length;
    const goalCount = goalsData.length;
    const goalCompleted = goalsData.some(g => g.milestones?.length > 0 && g.milestones.every(m => m.done));
    return { totalDone, streak: streakDays, hadPerfectDay, earlyBird: false, journalCount, habitCount, goalCount, goalCompleted };
  }, [goals, streakDays, journalEntries, habitsData, goalsData]);

  // Time tracking toggle
  const toggleTimeTracking = useCallback((goalId) => {
    setTimeTracking(prev => {
      const entry = prev[goalId];
      if (entry?.startedAt) {
        // Stop tracking
        const elapsed = (entry.elapsed || 0) + (Date.now() - entry.startedAt);
        return { ...prev, [goalId]: { startedAt: null, elapsed } };
      } else {
        // Start tracking
        return { ...prev, [goalId]: { startedAt: Date.now(), elapsed: entry?.elapsed || 0 } };
      }
    });
  }, []);

  // Monthly PDF Report
  const generateMonthlyReport = useCallback(() => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    if (!reportWindow) return;
    let totalTasks = 0, totalDone = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = toKey(d);
      const vis = goals.filter(g => g.date === key || (g.repeat !== 'None' && g.date <= key));
      const dn = vis.filter(g => g.doneOn?.[key]).length;
      totalTasks += vis.length; totalDone += dn;
    }
    const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    reportWindow.document.write(`
      <html><head><title>Monthly Report - ${monthName}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:700px;margin:0 auto;color:#1a1a2e}
      h1{color:#2563eb}h2{color:#6366f1;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
      .stat{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;background:#f0f4ff;text-align:center}
      .stat .num{font-size:2rem;font-weight:900;color:#2563eb}.stat .lbl{font-size:.85rem;color:#666}
      .bar{height:12px;border-radius:999px;background:#e5e7eb;margin:8px 0}
      .bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#6366f1)}
      </style></head><body>
      <h1>📊 Monthly Productivity Report</h1><p style="color:#666">${monthName} • Generated ${now.toLocaleDateString('en-IN')}</p>
      <h2>Overview</h2>
      <div class="stat"><div class="num">${totalDone}</div><div class="lbl">Tasks Done</div></div>
      <div class="stat"><div class="num">${totalTasks}</div><div class="lbl">Total Tasks</div></div>
      <div class="stat"><div class="num">${overallPct}%</div><div class="lbl">Completion</div></div>
      <div class="stat"><div class="num">${streakDays}d</div><div class="lbl">Streak</div></div>
      <div class="bar"><div class="bar-fill" style="width:${overallPct}%"></div></div>
      <h2>Achievements</h2><p>${badgeStats.totalDone} total tasks completed • Level ${Math.floor(Object.values(badgeStats).filter(Boolean).length / 3) + 1}</p>
      <h2>Habits</h2><p>${habitsData.length} habits tracked</p>
      <h2>Journal</h2><p>${badgeStats.journalCount} journal entries</p>
      <h2>Goals</h2><p>${goalsData.length} goals set</p>
      <script>setTimeout(()=>window.print(),500)</script></body></html>`);
  }, [goals, streakDays, badgeStats, habitsData, goalsData]);

  // Template apply handler
  const handleApplyTemplate = useCallback((tasks) => {
    const today = todayKey();
    const newGoals = tasks.map(text => ({
      id: Date.now() + Math.random(),
      text: text.trim(),
      date: today,
      reminder: '',
      startTime: '',
      endTime: '',
      repeat: 'None',
      session: 'Morning',
      priority: 'Medium',
      doneOn: {},
    }));
    setGoals(prev => [...prev, ...newGoals]);
  }, []);

  useKeyboardShortcuts([
    { key: '1', ctrl: true, action: () => setActiveView('insights') },
    { key: '2', ctrl: true, action: () => setActiveView('tasks') },
    { key: '3', ctrl: true, action: () => setActiveView('planner') },
    { key: '4', ctrl: true, action: () => setActiveView('settings') },
    { key: 'n', ctrl: true, action: () => { setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" }); setEditingGoal(null); setShowForm(true); }},
    { key: 'p', ctrl: true, action: () => setShowPomodoro(prev => !prev) },
    { key: 'a', ctrl: true, action: () => setShowAnalytics(prev => !prev) },
    { key: 'e', ctrl: true, action: () => setShowImportExport(prev => !prev) },
    { key: 'w', ctrl: true, action: () => setPlannerView(prev => prev === 'monthly' ? 'weekly' : 'monthly') },
    { key: '?', action: () => setShowShortcuts(s => !s) },
  ]);

  useEffect(() => {
    const load = async () => {
      const [raw, uiState] = await Promise.all([readStorage(), readUiState()]);
      if (raw) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setGoals(parsed.map(normalizeGoal)); } catch {} }
      if (uiState && typeof uiState === "object") {
        if (uiState.activeDate) setActiveDate(uiState.activeDate);
        if (uiState.activeView) setActiveView(uiState.activeView);
        if (uiState.searchTerm) setSearchTerm(uiState.searchTerm);
        if (uiState.priorityFilter) setPriorityFilter(uiState.priorityFilter);
        if (uiState.timeFilter) setTimeFilter(uiState.timeFilter);
        if (uiState.weekBase) { const parsedWeekBase = new Date(uiState.weekBase); if (!Number.isNaN(parsedWeekBase.getTime())) setWeekBase(parsedWeekBase); }
      }
      setLoaded(true);
    };
    load();
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeUiState({ activeDate, activeView, searchTerm, priorityFilter, timeFilter, weekBase: weekBase instanceof Date ? weekBase.toISOString() : new Date().toISOString() });
  }, [activeDate, activeView, loaded, priorityFilter, searchTerm, timeFilter, weekBase]);

  const save = useCallback(async (updated) => { await writeStorage(JSON.stringify(updated)); setGoals(updated); }, []);

  useEffect(() => {
    if (!loaded) return;
    if (ipc) { ipc.send("schedule-reminders", goals); return; }
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date(); const today = todayKey();
    const timers = goals.filter((g) => g.reminder && goalVisibleOn(g, today) && !isDoneOn(g, today)).map((g) => {
      const [hh, mm] = g.reminder.split(":").map(Number); if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      const fire = new Date(); fire.setHours(hh, mm, 0, 0); const diff = fire - now;
      if (diff <= 0 || diff >= 86400000) return null;
      return setTimeout(() => new Notification("Task Reminder", { body: g.text }), diff);
    }).filter(Boolean);
    return () => timers.forEach(clearTimeout);
  }, [goals, loaded]);

  useEffect(() => {
    if (!ipc?.on) return undefined;
    const onReminder = (_event, payload) => { setReminderPopup({ text: payload?.text || "Pending task reminder", session: payload?.session || "", reminder: payload?.reminder || "", startTime: payload?.startTime || "", endTime: payload?.endTime || "" }); AudioPlayer.playReminder(); };
    ipc.on("reminder-fired", onReminder);
    return () => { try { ipc.removeListener("reminder-fired", onReminder); } catch {} };
  }, []);

  useEffect(() => {
    if (!reminderPopup) return undefined;
    const timer = setTimeout(() => setReminderPopup(null), 12000); return () => clearTimeout(timer);
  }, [reminderPopup]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" }); setEditingGoal(null); setShowForm(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) { e.preventDefault(); setUiScale((s) => Math.min(130, s + 4)); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") { e.preventDefault(); setUiScale((s) => Math.max(80, s - 4)); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") { e.preventDefault(); setUiScale(100); return; }
      if (showForm && e.key === "Escape") { e.preventDefault(); setShowForm(false); }
      if (showForm && e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitForm(); }
      if (showForm && e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); submitForm(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [showForm, activeDate, form, editingGoal, goals]);

  // ============================================
  // HANDLERS
  // ============================================
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
      "01:00 PM - 02:30 PM - 🤝 Meetings & Syncs",
      "02:30 PM - 04:00 PM - 🚀 Project Advancement",
      "04:00 PM - 05:00 PM - 📝 Daily Review / Plan Tomorrow"
    ].join("\n");
    onTaskTextChange(suggestions);
  };

  const toggleDone = (goal) => {
    if (goal.repeat === "None") return save(goals.map((g) => (g.id === goal.id ? { ...g, done: !goal.done } : g)));
    save(goals.map((g) => { if (g.id !== goal.id) return g; const doneOn = { ...(g.doneOn || {}) }; if (doneOn[activeDate]) delete doneOn[activeDate]; else doneOn[activeDate] = true; return { ...g, doneOn }; }));
  };

  const toggleDoneWithCelebration = (goal) => {
    const wasCompleted = goal.done || goal.doneOn?.[activeDate];
    toggleDone(goal);
    if (!wasCompleted) {
      AudioPlayer.playComplete(); setShowCelebration(true); setCompletedPulseId(goal.id);
      clearTimeout(pulseTimerRef.current); pulseTimerRef.current = setTimeout(() => setCompletedPulseId(null), 360);
      setCelebratingGoalId(goal.id); clearTimeout(celebrateTimerRef.current); celebrateTimerRef.current = setTimeout(() => setCelebratingGoalId(null), 1200);
      clearTimeout(globalCelebrationTimerRef.current); globalCelebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 3500); 
    }
  };

  const removeGoal = (id) => save(goals.filter((g) => g.id !== id));
  const toggleSelectGoal = (id) => setSelectedGoalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelectedGoals = () => setSelectedGoalIds([]);
  const selectAllVisibleGoals = () => setSelectedGoalIds(visibleGoals.map((g) => g.id));
  const deleteSelectedGoals = () => { if (!selectedGoalIds.length) return; const selected = new Set(selectedGoalIds); save(goals.filter((g) => !selected.has(g.id))); clearSelectedGoals(); };
  const dotsFor = (key) => { const dayGoals = goals.filter((g) => goalVisibleOn(g, key)); return { total: dayGoals.length, done: dayGoals.filter((g) => isDoneOn(g, key)).length }; };

  const handleImportTasks = useCallback((importedTasks) => {
    save([...goals, ...importedTasks.map(task => ({ ...normalizeGoal(task), id: Date.now() + Math.random() }))]);
  }, [goals, save]);

  const handleUpcomingTaskAlert = useCallback((task) => { setUpcomingTaskAlert(task); new Audio('/sounds/reminder.mp3').play().catch(() => {}); }, []);
  const calculateNextUpcomingTask = useCallback(() => { const currentTime = new Date().toTimeString().slice(0, 5); return pendingGoals.filter(task => task.startTime && task.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null; }, [pendingGoals]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTask = calculateNextUpcomingTask();
      if (nextTask) { const timeUntilStart = new Date(`${nextTask.date}T${nextTask.startTime}`) - new Date(); if (timeUntilStart <= 300000 && timeUntilStart > 0) handleUpcomingTaskAlert(nextTask); }
    }, 30000); 
    return () => clearInterval(interval);
  }, [calculateNextUpcomingTask, handleUpcomingTaskAlert]);

  useEffect(() => { setNextUpcomingTask(calculateNextUpcomingTask()); }, [calculateNextUpcomingTask]);

  const markAllPendingDone = () => { const pendingIds = new Set(pendingGoals.map((g) => g.id)); save(goals.map((g) => { if (!pendingIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: true }; return { ...g, doneOn: { ...(g.doneOn || {}), [activeDate]: true } }; })); };
  const reopenAllCompleted = () => { const completedIds = new Set(completedGoals.map((g) => g.id)); save(goals.map((g) => { if (!completedIds.has(g.id)) return g; if (g.repeat === "None") return { ...g, done: false }; const nextDoneOn = { ...(g.doneOn || {}) }; delete nextDoneOn[activeDate]; return { ...g, doneOn: nextDoneOn }; })); };
  const duplicatePendingToTomorrow = () => { const d = new Date(`${activeDate}T00:00:00`); d.setDate(d.getDate() + 1); const nextKey = toKey(d); const copies = pendingGoals.map((g, idx) => normalizeGoal({ ...g, id: Date.now() + idx, date: nextKey, done: false, doneOn: {}, repeat: "None" })); if (copies.length) save([...goals, ...copies]); };

  useEffect(() => { const allIds = new Set(goals.map((g) => g.id)); setSelectedGoalIds((prev) => prev.filter((id) => allIds.has(id))); }, [goals]);

  useEffect(() => {
    const currentId = liveCurrentGoal?.id ?? null;
    if (liveTaskRef.current === undefined) { liveTaskRef.current = currentId; return; }
    if (currentId && currentId !== liveTaskRef.current) {
      playSuccessTone(); setReminderPopup({ text: `Task Shift Alert: ${liveCurrentGoal.text}`, session: liveCurrentGoal.session || "", reminder: liveCurrentGoal.reminder || "", startTime: liveCurrentGoal.startTime || "", endTime: liveCurrentGoal.endTime || "", priority: "High" });
      if (ipc?.send) ipc.send("notify-task-shift", { text: liveCurrentGoal.text || "Task switched", session: liveCurrentGoal.session || "", startTime: liveCurrentGoal.startTime || "", endTime: liveCurrentGoal.endTime || "", priority: "High" });
      else if ("Notification" in window && Notification.permission === "granted") try { new Notification("Task Shift Reminder", { body: `${liveCurrentGoal.text} (${liveCurrentGoal.startTime || "--:--"} - ${liveCurrentGoal.endTime || "--:--"})` }); } catch {}
    }
    liveTaskRef.current = currentId;
  }, [liveCurrentGoal, ipc]);

  useEffect(() => {
    if (!liveCurrentGoal || !shouldShowNextAlert) return setNextTaskAlert(null);
    const alertKey = `${liveCurrentGoal.id}-${activeDate}`;
    if (nextAlertShownRef.current[alertKey]) return;
    nextAlertShownRef.current[alertKey] = true;
    const nextTask = nextUpcomingGoal;
    if (nextTask) {
      setNextTaskAlert(nextTask); AudioPlayer.playReminder();
      if (ipc?.send) ipc.send("notify-next-task", { text: nextTask.text || "Next task", startTime: nextTask.startTime || "", time: nextTask.startTime || "--:--" });
      else if ("Notification" in window && Notification.permission === "granted") try { new Notification("⚠️ Next Task Alert", { body: `Next: ${nextTask.text} at ${nextTask.startTime || "--:--"}` }); } catch {}
      const timer = setTimeout(() => setNextTaskAlert(null), 10000); return () => clearTimeout(timer);
    }
  }, [liveCurrentGoal, shouldShowNextAlert, nextUpcomingGoal, activeDate, ipc]);

  useEffect(() => { setLiveTaskPopup(liveCurrentGoal || null); }, [liveCurrentGoal]);

  const activeDateLabel = activeDate === todayKey() ? "Today's Focus" : new Date(`${activeDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
  const themeClass = `theme-${themeMode}`;
  const tabItems = [
    { id: "insights", label: "Dashboard", icon: "📊" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "planner", label: "Planner", icon: "📅" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "career", label: "Career", icon: "🚀" },
    { id: "tools", label: "Tools", icon: "🛠" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "habits", label: "Habits", icon: "🔁" },
    { id: "journal", label: "Journal", icon: "📓" },
    { id: "goals", label: "Goals", icon: "🎯" },
  ];
  const isPlannerIframeView = activeView === "tasks";

  return (
    <div className={`page ${themeClass}${isPlannerIframeView ? " planner-mode" : ""}`} style={{ "--task-font-size": `${taskFontSize}px`, "--task-font-family": taskFontFamily, "--ui-scale": `${uiScale / 100}`, "--global-font-weight": fontWeight }}>
      <div className="app">
        <div className="tab-nav">
          {tabItems.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeView === tab.id ? 'active' : ''}`} onClick={() => setActiveView(tab.id)}>
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {liveTaskPopup && <LiveTaskPopup task={liveTaskPopup} onClose={() => setLiveTaskPopup(null)} />}
        
        {upcomingTaskAlert && (
          <div className="toast-notification">
            <div className="toast-accent-bar"></div>
            <div className="toast-body">
              <div className="toast-icon-wrap">
                <span className="toast-icon">⏰</span>
              </div>
              <div className="toast-content">
                <div className="toast-title">Next task starting soon!</div>
                <div className="toast-message">"{upcomingTaskAlert.text}" at {upcomingTaskAlert.startTime || 'scheduled time'}</div>
              </div>
              <button className="toast-close" onClick={() => setUpcomingTaskAlert(null)}>✕</button>
            </div>
            <div className="toast-progress-bar">
              <div className="toast-progress-fill"></div>
            </div>
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

        {activeView === "insights" && <div key="insights" className="view-transition"><DashboardView quote={quote} setActiveView={setActiveView} done={done} total={total} pct={pct} weekly={weekly} streakDays={streakDays} dueSoon={dueSoon} goals={goals} journalEntries={journalEntries} generateMonthlyReport={generateMonthlyReport} /></div>}
        
        {activeView === "tasks" && (
          <div>
            <div className="hero">
              <div className="topbar">
                <div>
                  <div className="title">{activeDateLabel}</div>
                  <div className="tip">
                    {liveClockLabel} • {done} of {total} completed
                  </div>
                </div>
                <div className="head-actions">
                  <button className="new-btn" onClick={() => {
                    setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
                    setEditingGoal(null);
                    setShowForm(true);
                  }}>
                    ➕ New Task
                  </button>
                </div>
              </div>
            </div>

            {/* 🔥 LIVE STRIP WITH PROGRESS & UP NEXT 🔥 */}
            {liveCurrentGoal && (
              <div className="card live-strip enhanced-live-strip">
                <div className="live-task-main">
                  <div className="task-info">
                    <div className="tag">CURRENT TASK</div>
                    <div className="task">{liveCurrentGoal.text}</div>
                    {liveCurrentGoal.startTime && liveCurrentGoal.endTime && (
                      <div className="session-badge">
                        {formatTimeRange(liveCurrentGoal.startTime, liveCurrentGoal.endTime)}
                      </div>
                    )}
                  </div>
                  <div className="clock-area">
                    <div className="clock">{liveClockLabel}</div>
                  </div>
                </div>

                {liveCurrentGoal.startTime && liveCurrentGoal.endTime && (
                  <div className="easy-analysis-card">
                    <div className="easy-analysis-header">
                      <div className="easy-analysis-title">
                        <span className="easy-analysis-icon">📊</span>
                        <span>EASY ANALYSIS</span>
                      </div>
                      <div className="easy-analysis-stats">
                        <span className="easy-analysis-pct">{livePercent}% done</span>
                        <span className="easy-analysis-sep">•</span>
                        <span className="easy-analysis-time">{liveCountdown}</span>
                      </div>
                    </div>
                    <div className="easy-analysis-track">
                      <div 
                        className="easy-analysis-fill"
                        style={{ width: `${Math.max(livePercent, 5)}%` }}
                      >
                        <span className="easy-analysis-fill-label">{livePercent}%</span>
                        <div className="easy-analysis-shimmer"></div>
                      </div>
                      <div className="easy-analysis-markers">
                        {[25, 50, 75].map(m => (
                          <div key={m} className={`easy-analysis-marker ${livePercent >= m ? 'reached' : ''}`} style={{ left: `${m}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="easy-analysis-footer">
                      {/* 🍅 MINI POMODORO INLINE */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          className="new-btn"
                          style={{
                            padding: '8px 16px', fontSize: '0.85rem',
                            background: miniPomoActive
                              ? (miniPomoPhase === 'work'
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #10b981, #059669)')
                              : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            minWidth: '140px',
                          }}
                          onClick={toggleMiniPomo}
                        >
                          {miniPomoActive ? `⏸ ${miniPomoLabel}` : '🍅 Start Pomodoro'}
                        </button>
                        {miniPomoActive && (
                          <span style={{
                            fontSize: '.75rem', fontWeight: 900, textTransform: 'uppercase',
                            color: miniPomoPhase === 'work' ? '#ef4444' : '#10b981',
                            background: miniPomoPhase === 'work' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            padding: '4px 10px', borderRadius: '999px',
                            border: `1px solid ${miniPomoPhase === 'work' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            animation: 'pulseGlow 2s infinite',
                          }}>
                            {miniPomoPhase === 'work' ? '🔥 FOCUS' : '☕ BREAK'}
                          </span>
                        )}
                      </div>
                       <button className="new-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setFocusMode(true)}>🧠 Enter Deep Focus</button>
                    </div>
                  </div>
                )}

                {/* UP NEXT BANNER */}
                {nextUpcomingGoal && (
                  <div className="up-next-banner">
                    <span className="up-next-icon">⏭</span>
                    <span className="up-next-label">Up next:</span>
                    <span className="up-next-text">
                      {nextUpcomingGoal.text} <span>at {nextUpcomingGoal.startTime}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {focusMode && liveCurrentGoal && (
              <EnhancedFocusMode task={liveCurrentGoal} isActive={focusMode} onExit={() => setFocusMode(false)} />
            )}

            <TaskCompletionCelebration isActive={showCelebration} onComplete={() => setShowCelebration(false)} />
            <DailyProductivityScore goals={goals} todayKey={todayKey()} />

            <div className="card">
              <div className="cal-header">
                <div className="cal-month">
                  {new Date(weekBase).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </div>
                <div className="cal-actions">
                  <button className="cal-btn" onClick={() => { const w = new Date(weekBase); w.setDate(w.getDate() - 7); setWeekBase(w); }}>◀</button>
                  <button className="today-btn" onClick={() => setWeekBase(new Date())}>Today</button>
                  <button className="cal-btn" onClick={() => { const w = new Date(weekBase); w.setDate(w.getDate() + 7); setWeekBase(w); }}>▶</button>
                </div>
              </div>
              <div className="week-grid">
                {weekDays.map((day) => {
                  const dots = dotsFor(toKey(day));
                  const isToday = toKey(day) === todayKey();
                  const isSelected = toKey(day) === activeDate;
                  return (
                    <div key={day.toISOString()} className="day-cell" onClick={() => setActiveDate(toKey(day))}>
                      <div className="day-box">
                        <div className="d-name">{DAY_NAMES[day.getDay()]}</div>
                        <div className={`d-num ${isToday ? 'is-today' : ''} ${isSelected ? 'is-sel' : ''}`}>{day.getDate()}</div>
                        <div className="d-dots">
                          {dots.total > 0 && (<> {dots.done > 0 && <div className="dot done"></div>} {dots.pending > 0 && <div className="dot pending"></div>} </>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="section-head">
                <div className="focus-title">Today's Tasks</div>
                <div className="filters">
                  <button className={`filter-btn ${priorityFilter === "All" ? 'active' : ''}`} onClick={() => setPriorityFilter("All")}>All</button>
                  {PRIORITY_OPTIONS.map(priority => (<button key={priority} className={`filter-btn ${priorityFilter === priority ? 'active' : ''}`} onClick={() => setPriorityFilter(priority)}>{priority}</button>))}
                  <button className={`filter-btn ${timeFilter === "All Times" ? 'active' : ''}`} onClick={() => setTimeFilter("All Times")}>All Times</button>
                  {TIME_FILTER_OPTIONS.slice(1).map(filter => (<button key={filter} className={`filter-btn ${timeFilter === filter ? 'active' : ''}`} onClick={() => setTimeFilter(filter)}>{filter}</button>))}
                </div>
                <div className="count">{total}</div>
              </div>

              <input ref={searchRef} type="text" className="search-input" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

              <div className="goal-list">
                {pendingGoals.length === 0 && completedGoals.length === 0 ? (
                  <div className="empty">{searchTerm ? "No tasks found matching your search." : "No tasks for today. Add one above!"}</div>
                ) : (
                  <>
                    {selectedGoalIds.length > 0 && (
                      <div className="quick-tools">
                        <button className="tool-btn" onClick={selectAllVisibleGoals}>Select All ({visibleGoals.length})</button>
                        <button className="tool-btn warn" onClick={deleteSelectedGoals}>Delete Selected ({selectedGoalIds.length})</button>
                        <button className="tool-btn" onClick={clearSelectedGoals}>Clear Selection</button>
                      </div>
                    )}

                    {pendingGoals.map((goal, idx) => (
                      <GoalItem
                        key={goal.id} goal={goal} idx={idx} doneHere={false} pulse={completedPulseId === goal.id} celebrate={celebratingGoalId === goal.id} liveNow={liveCurrentGoal?.id === goal.id} countdownText={liveCurrentGoal?.id === goal.id ? liveCountdown : null} selected={selectedSet.has(goal.id)} overdueEnabled={overdueEnabled} onToggleDone={() => toggleDoneWithCelebration(goal)}
                        onEdit={() => { setEditingGoal(goal.id); setForm({ text: goal.text, date: goal.date, reminder: goal.reminder, startTime: goal.startTime, endTime: goal.endTime, repeat: goal.repeat, session: goal.session, priority: goal.priority }); setShowForm(true); }}
                        onDelete={() => removeGoal(goal.id)} onToggleSelect={() => toggleSelectGoal(goal.id)}
                      />
                    ))}

                    {pendingGoals.length > 0 && (
                      <div className="quick-tools" style={{ marginBottom: "20px" }}>
                        <button className="tool-btn" onClick={markAllPendingDone}>✅ Mark All Done ({pendingGoals.length})</button>
                        <button className="tool-btn" onClick={duplicatePendingToTomorrow}>📅 Copy to Tomorrow ({pendingGoals.length})</button>
                      </div>
                    )}

                    {completedGoals.length > 0 && (
                      <div className="completed-tasks-container mt-6">
                        <div className="section-head mb-4">
                           <div className="focus-title text-xl opacity-80" style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>Completed Tasks ({completedGoals.length})</div>
                        </div>
                        <div className="goal-list">
                          {completedGoals.map((goal, idx) => (
                            <GoalItem
                              key={goal.id} goal={goal} idx={idx + pendingGoals.length} doneHere={true} pulse={false} celebrate={false} liveNow={false} countdownText={null} selected={selectedSet.has(goal.id)} onToggleDone={() => toggleDoneWithCelebration(goal)}
                              onEdit={() => { setEditingGoal(goal.id); setForm({ text: goal.text, date: goal.date, reminder: goal.reminder, startTime: goal.startTime, endTime: goal.endTime, repeat: goal.repeat, session: goal.session, priority: goal.priority }); setShowForm(true); }}
                              onDelete={() => removeGoal(goal.id)} onToggleSelect={() => toggleSelectGoal(goal.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {completedGoals.length > 0 && (
                      <div className="quick-tools">
                        <button className="tool-btn" onClick={reopenAllCompleted}>🔄 Reopen All ({completedGoals.length})</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 🌙 EOD DAILY SUMMARY CARD */}
            {isEOD && activeDate === todayKey() && (
              <div className="card eod-card" style={{
                background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1.5px solid rgba(139, 92, 246, 0.3)',
                padding: '20px 24px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🌙</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)' }}>Daily Summary</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600 }}>End-of-day reflection</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--chip)', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)' }}>{total}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700, marginTop: '4px' }}>Total Tasks</div>
                  </div>
                  <div style={{ background: 'var(--chip)', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{done}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700, marginTop: '4px' }}>Completed</div>
                  </div>
                  <div style={{ background: 'var(--chip)', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: pct >= 70 ? '#10b981' : '#f59e0b' }}>{pct}%</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700, marginTop: '4px' }}>Score</div>
                  </div>
                </div>
                <div style={{
                  background: pct >= 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${pct >= 70 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                    {pct >= 90 ? '🏆 Outstanding performance!' : pct >= 70 ? '💪 Great work today!' : pct >= 40 ? '📈 Solid effort, keep building!' : total === 0 ? '📝 Add tasks to track your day.' : '🚀 Let\'s push harder tomorrow!'}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600 }}>
                    {pct >= 70 ? 'Rest well — you earned it.' : 'Every day is a new opportunity to grow.'}
                  </div>
                </div>
              </div>
            )}
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
        {activeView === "achievements" && <div key="achievements" className="view-transition"><AchievementBadges stats={badgeStats} /></div>}

        {/* Focus Mode Overlay */}
        {focusMode && activeView === "tasks" && <div className="focus-overlay" onClick={() => setFocusMode(false)} />}

        {/* Focus Mode Toggle */}
        {activeView === "tasks" && (
          <button className={`focus-toggle-btn ${focusMode ? 'active' : ''}`} onClick={() => setFocusMode(f => !f)}>
            {focusMode ? '🔓 Exit Focus' : '🧊 Focus Mode'}
          </button>
        )}

        {/* Weekly Planning Wizard */}
        {showWeeklyWizard && <WeeklyPlannerWizard goals={goals} onClose={() => setShowWeeklyWizard(false)} />}

        {/* Achievement Badges (accessible from Dashboard) */}

        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">{editingGoal ? "✏️ Edit Task" : "➕ Add New Task"}</div>
              <div className="fg">
                <div className="fl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Task Description</span>
                  {!editingGoal && (
                    <button className="mini-btn" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', border: 'none' }} onClick={handleAiAutoSchedule}>✨ AI Auto-Plan</button>
                  )}
                </div>
                <textarea className="fi task-box" placeholder="Enter your task..." value={form.text} onChange={(e) => onTaskTextChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); submitForm(); } }} autoFocus />
                <div className="form-hint">💡 You can paste multiple tasks, one per line. Use format: "9:00 AM - 10:00 AM - Task description"</div>
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
                <button className="new-btn" onClick={submitForm}>{editingGoal ? "💾 Update Task" : "➕ Add Task"}</button>
              </div>
            </div>
          </div>
        )}

        {showPomodoro && (
          <div className="overlay" onClick={() => setShowPomodoro(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="m-title">🍅 Pomodoro Focus Timer</div>
              <PomodoroTimer onTaskComplete={(count) => { console.log(`Completed ${count} pomodoros!`); playTaskCompleteTone(); }} onBreakComplete={() => { console.log('Break completed!'); playSuccessTone(); }} />
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

        {/* 🔥 FOCUS WALL (ONE THING) OVERLAY 🔥 */}
        {focusMode && liveCurrentGoal && (
          <div className="focus-wall-overlay">
            <button className="focus-wall-exit" onClick={() => setFocusMode(false)}>Exit Focus Mode</button>
            <div className="focus-wall-content">
              <div className="focus-wall-label">CURRENT FOCUS</div>
              <div className="focus-wall-task">
                 {(() => {
                  const match = liveCurrentGoal.text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
                  return match ? (
                    <><span className="animated-emoji" style={{ fontSize: '1.5em' }}>{match[1]}</span>{match[2]}</>
                  ) : liveCurrentGoal.text;
                })()}
              </div>
              <div className="focus-wall-time">
                {liveCurrentGoal.startTime} - {liveCurrentGoal.endTime}
              </div>
              <div className="focus-wall-countdown">
                {liveCountdown || "00:00"}
              </div>
              <button className="focus-wall-done-btn" onClick={() => {
                toggleDoneWithCelebration(liveCurrentGoal);
                setFocusMode(false);
              }}>
                MARK MISSION COMPLETE
              </button>
            </div>
          </div>
        )}

        {/* 🔥 BOTTOM STATUS BAR 🔥 */}
        <div className="status-bar">
          <div className="status-bar-left">
            <span className="status-clock">{liveClockLabel}</span>
            <span className="status-divider">•</span>
            <span className="status-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="status-bar-center">
            {liveCurrentGoal ? (
              <>
                <span className="status-live-dot"></span>
                <span className="status-task-name">{liveCurrentGoal.text}</span>
                {liveCountdown && <span className="status-countdown">{liveCountdown}</span>}
              </>
            ) : (
              <span className="status-idle">No active task</span>
            )}
          </div>
          <div className="status-bar-right">
            <div className="status-progress-wrap">
              <div className="status-progress-bar">
                <div className="status-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="status-progress-text">{done}/{total} ({pct}%)</span>
            </div>
            <span className="status-streak">🔥 {streakDays}d</span>
          </div>
        </div>
      </div>
    </div>
  );
}