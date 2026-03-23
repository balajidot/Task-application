import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getApiUrl } from "../utils/apiConfig";
import {
  getNotificationPermission,
  requestNotificationPermission,
  initializeNotifications,
  scheduleTaskNotifications,
  updateLiveActivityNotification,
} from "../notifications.fixed";
import {
  REPEAT_OPTIONS, SESSION_OPTIONS, PRIORITY_OPTIONS, FONT_OPTIONS,
  TIME_FILTER_OPTIONS, DAY_NAMES, QUOTES, PRIORITY_RANK,
  HABITS_KEY, GOALS_KEY, TOOLS_KEY, APP_COPY
} from "../utils/constants";
import {
  todayKey, toKey, timeToMinutes, hasSameStartEnd, isTimeLiveNow,
  formatTimeRange, goalTimeMinutes, matchesTimeFilter,
  getWeekDays, normalizeGoal, goalVisibleOn, isDoneOn,
  readStorage, writeStorage, readPrefs, writePrefs,
  readUiState, writeUiState, readPersist, writePersist,
  AudioPlayer, playSuccessTone, playTaskCompleteTone,
  weeklyStats, completionStreak, analyzeHabits,
  parseTaskLine, formatCountdown, getTimeRemainingMs
} from "../utils/helpers";
import { triggerHaptic } from "../hooks/useMobileFeatures";
import { DeviceSettings } from "../plugins/deviceSettings";

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// ✅ FIX 5: Storage keys — single source of truth
const STORAGE_KEYS = {
  XP:              'taskPlanner_xp',
  LEVEL:           'taskPlanner_level',
  PREMIUM:         'taskPlanner_premium',
  HABITS:          'taskPlanner_habits',
  CAREER:          'taskPlanner_career',
  JOURNAL:         'taskPlanner_journal',
  CHALLENGE_START: 'taskPlanner_challengeStart',
  TRIAL_START:     'taskPlanner_trialStart',
  MILESTONES:      'taskPlanner_milestonesAwarded',
  USER_GOAL:       'taskPlanner_userGoal',
  COACH_TONE:      'taskPlanner_coachTone',
};

// ✅ FIX 5: Safe localStorage helpers — Capacitor-compatible
const safeGetItem = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
};
const safeSetItem = (key, value) => {
  try { localStorage.setItem(key, value); } catch {}
};
const safeGetJSON = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};
const safeSetJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const AppProvider = ({ children }) => {
  const electronIpc = useMemo(() => {
    try {
      return window.require?.("electron")?.ipcRenderer ?? null;
    } catch {
      return null;
    }
  }, []);

  // ─── User & Auth ───
  const [userName,          setUserName]          = useState("");
  const [showNameSetup,     setShowNameSetup]     = useState(false);
  const [onboardStep,       setOnboardStep]       = useState(1);
  const [onboardGoal,       setOnboardGoal]       = useState('');
  const [onboardFocus,      setOnboardFocus]      = useState('');
  const [trialDaysLeft,     setTrialDaysLeft]     = useState(null);
  const [showLoader,        setShowLoader]        = useState(true);
  const [isPremium,         setIsPremium]         = useState(false);
  const [showRatingPrompt,  setShowRatingPrompt]  = useState(false);
  const [isOffline,         setIsOffline]         = useState(!navigator.onLine);
  const [userXP,            setUserXP]            = useState(0);
  const [coachTone,         setCoachTone]         = useState('motivational');
  const [userLevel,         setUserLevel]         = useState(1);
  const [tempName,          setTempName]          = useState("");
  const [nowMinuteTick,     setNowMinuteTick]     = useState(Date.now());

  // ─── Tasks ───
  const [goals,             setGoals]             = useState([]);
  const [loaded,            setLoaded]            = useState(false);
  const [showForm,          setShowForm]          = useState(false);
  const [aiLoading,         setAiLoading]         = useState(false);
  const [editingGoal,       setEditingGoal]       = useState(null);
  const [activeDate,        setActiveDate]        = useState(todayKey());
  const [weekBase,          setWeekBase]          = useState(new Date());
  const [activeView,        setActiveView]        = useState("insights");
  const [notifPerm,         setNotifPerm]         = useState("default");
  const [habits,            setHabits]            = useState([]);
  const [career,            setCareer]            = useState({});
  const [journalEntries,    setJournalEntries]    = useState([]);
  const [challengeStart,    setChallengeStart]    = useState(null);
  const [priorityFilter,    setPriorityFilter]    = useState("All");
  const [timeFilter,        setTimeFilter]        = useState("All Times");
  const [searchTerm,        setSearchTerm]        = useState("");

  // ─── Theme & Display ───
  const [themeMode,              setThemeMode]              = useState("dark");
  const [autoThemeMode,          setAutoThemeMode]          = useState("off");
  const [appLanguage,            setAppLanguage]            = useState("en");
  const [taskFontSize,           setTaskFontSize]           = useState(18);
  const [taskFontFamily,         setTaskFontFamily]         = useState(FONT_OPTIONS[0].value);
  const [uiScale,                setUiScale]                = useState(96);
  const [overdueEnabled,         setOverdueEnabled]         = useState(true);
  const [fontWeight,             setFontWeight]             = useState(500);
  const [soundTheme,             setSoundTheme]             = useState('default');
  const [hapticEnabled,          setHapticEnabled]          = useState(true);
  const [liveHighlightEnabled,   setLiveHighlightEnabled]   = useState(true);
  const [bgTheme,                setBgTheme]                = useState('none');

  // ─── UI State ───
  const [reminderPopup,        setReminderPopup]        = useState(null);
  const [liveTaskPopup,        setLiveTaskPopup]        = useState(null);
  const [nextTaskAlert,        setNextTaskAlert]        = useState(null);
  const [form,                 setForm]                 = useState({
    text: "", date: todayKey(), reminder: "",
    startTime: "", endTime: "", repeat: "None",
    session: "Morning", priority: "Medium"
  });
  const [completedPulseId,     setCompletedPulseId]     = useState(null);
  const [celebratingGoalId,    setCelebratingGoalId]    = useState(null);
  const [selectedGoalIds,      setSelectedGoalIds]      = useState([]);
  const [plannerView,          setPlannerView]          = useState("monthly");
  const [showPomodoro,         setShowPomodoro]         = useState(false);
  const [showImportExport,     setShowImportExport]     = useState(false);
  const [focusMode,            setFocusMode]            = useState(false);
  const [upcomingTaskAlert,    setUpcomingTaskAlert]    = useState(null);
  const [showCelebration,      setShowCelebration]      = useState(false);
  const [nextUpcomingTask,     setNextUpcomingTask]     = useState(null);
  const [showShortcuts,        setShowShortcuts]        = useState(false);
  const [showWeeklyWizard,     setShowWeeklyWizard]     = useState(false);
  const [tabSwitching,         setTabSwitching]         = useState(false);
  const [showMoreMenu,         setShowMoreMenu]         = useState(false);
  const [aiContext,            setAiContext]            = useState("");
  const [aiPersonalCoach,      setAiPersonalCoach]     = useState("");
  const [isBriefingLoading,    setIsBriefingLoading]   = useState(false);
  const [smartNotice,          setSmartNotice]         = useState(null);

  // ✅ FIX 1: Custom confirm dialog — replaces window.confirm/window.alert
  const [confirmDialog, setConfirmDialog] = useState(null);

  // ─── Refs ───
  const pulseTimerRef               = useRef(null);
  const celebrateTimerRef           = useRef(null);
  const liveNotifLastUpdateRef      = useRef(0);
  const searchRef                   = useRef(null);
  const liveTaskRef                 = useRef(undefined);
  const nextAlertShownRef           = useRef({});
  const globalCelebrationTimerRef   = useRef(null);
  const pendingWriteRef             = useRef({ timer: null, last: "" });
  const isFirstRunRef               = useRef(true);

  // ✅ FIX 6: Timer cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(pulseTimerRef.current);
      clearTimeout(celebrateTimerRef.current);
      clearTimeout(globalCelebrationTimerRef.current);
      if (pendingWriteRef.current.timer) {
        clearTimeout(pendingWriteRef.current.timer);
      }
    };
  }, []);

  // ─── DERIVED STATE ───
  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const visibleGoals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return goals
      .filter(g => goalVisibleOn(g, activeDate))
      .filter(g => priorityFilter === "All" ? true : g.priority === priorityFilter)
      .filter(g => matchesTimeFilter(g, timeFilter))
      .filter(g => term ? g.text.toLowerCase().includes(term) : true)
      .sort((a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
        timeToMinutes(a.reminder) - timeToMinutes(b.reminder) ||
        a.id - b.id
      );
  }, [goals, activeDate, priorityFilter, searchTerm, timeFilter]);

  const pendingGoals   = useMemo(() => visibleGoals.filter(g => !isDoneOn(g, activeDate)),  [visibleGoals, activeDate]);
  const completedGoals = useMemo(() => visibleGoals.filter(g =>  isDoneOn(g, activeDate)),  [visibleGoals, activeDate]);
  const selectedSet    = useMemo(() => new Set(selectedGoalIds),                             [selectedGoalIds]);

  const streakDays = useMemo(() => completionStreak(goals), [goals]);
  const weekly     = useMemo(() => weeklyStats(goals),       [goals]);
  const done  = completedGoals.length;
  const total = visibleGoals.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const dueSoon = pendingGoals.filter(g => timeToMinutes(g.reminder) < Number.MAX_SAFE_INTEGER).length;

  const nowMinutes = useMemo(() => {
    const now = new Date(nowMinuteTick);
    return now.getHours() * 60 + now.getMinutes();
  }, [nowMinuteTick]);

  const copy  = useMemo(() => APP_COPY[appLanguage] || APP_COPY.en, [appLanguage]);
  const quote = useMemo(() => QUOTES[Math.floor((Date.now() / 86400000) % QUOTES.length)], []);

  const liveCurrentGoal = useMemo(() => (
    [...goals]
      .filter(g => goalVisibleOn(g, todayKey()))
      .filter(g => !isDoneOn(g, todayKey()))
      .sort((a, b) => goalTimeMinutes(a) - goalTimeMinutes(b))
      .find(g => isTimeLiveNow(g.startTime, g.endTime, nowMinutes)) || null
  ), [goals, nowMinutes]);

  const nextUpcomingGoal = useMemo(() => (
    [...goals]
      .filter(g => goalVisibleOn(g, todayKey()))
      .filter(g => !isDoneOn(g, todayKey()))
      .filter(g => g.id !== liveCurrentGoal?.id)
      .filter(g => g.startTime && timeToMinutes(g.startTime) >= nowMinutes)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null
  ), [goals, nowMinutes, liveCurrentGoal]);

  const aiBriefing = useMemo(() => {
    const highPriority = pendingGoals.filter(g => g.priority === "High").slice(0, 2);
    const untimed      = pendingGoals.filter(g => !g.startTime).slice(0, 2);
    const overdue      = pendingGoals.filter(g => g.endTime && timeToMinutes(g.endTime) < nowMinutes);
    return {
      headline: liveCurrentGoal
        ? `${copy.ai.stayLocked} "${liveCurrentGoal.text}" ${copy.ai.until} ${liveCurrentGoal.endTime || liveCurrentGoal.startTime || "the next block"}.`
        : nextUpcomingGoal
          ? `${copy.ai.prepFor} "${nextUpcomingGoal.text}" ${copy.ai.before} ${nextUpcomingGoal.startTime}.`
          : copy.ai.boardOpen,
      risk: overdue.length
        ? `${overdue.length} ${overdue.length > 1 ? copy.ai.overdueNow : copy.ai.overdueSingle}`
        : highPriority.length
          ? `${copy.ai.highPriorityWaiting} ${highPriority.map(g => g.text).join(", ")}.`
          : copy.ai.noUrgent,
      suggestion: untimed.length
        ? `${copy.ai.assignSlots} ${untimed.map(g => g.text).join(", ")}.`
        : pendingGoals.length ? copy.ai.goodStructure : copy.ai.dayClear,
    };
  }, [copy.ai, liveCurrentGoal, nextUpcomingGoal, nowMinutes, pendingGoals]);

  const activeDateLabel = useMemo(() => {
    return activeDate === todayKey()
      ? copy.common.todayFocus
      : new Date(`${activeDate}T00:00:00`).toLocaleDateString(
          appLanguage === "ta" ? "ta-IN" : "en-IN",
          { weekday: "long", month: "long", day: "numeric" }
        );
  }, [activeDate, copy.common.todayFocus, appLanguage]);

  const aiWeeklyAnalysis = useMemo(() => {
    const isTamil      = appLanguage === "ta";
    const bestDayName  = weekly.bestDay?.name || "N/A";
    const weakestDay   = weekly.days.reduce((low, d) => (!low || d.pct < low.pct ? d : low), null)?.name || "N/A";
    const totalPending = goals.filter(g => !isDoneOn(g, todayKey()) && goalVisibleOn(g, todayKey())).length;
    const trend        = weekly.days.map(d => d.pct < 0 ? 0 : d.pct);
    const trendDelta   = trend.length > 1 ? trend[trend.length - 1] - trend[0] : 0;
    const predictedPct = Math.max(20, Math.min(100, Math.round(weekly.weekPct + trendDelta * 0.35)));
    const overloaded   = weekly.days.filter(d => d.total >= 6);
    const burnoutRisk  = overloaded.length >= 3 || (weekly.weekPct < 45 && weekly.weekTotal >= 12)
      ? "high" : overloaded.length >= 1 ? "medium" : "low";
    const overdueTasks = goals.filter(g =>
      goalVisibleOn(g, todayKey()) && !isDoneOn(g, todayKey()) &&
      g.endTime && timeToMinutes(g.endTime) < nowMinutes
    );
    return {
      summary: weekly.weekTotal
        ? isTamil
          ? `இந்த வாரம் ${weekly.weekTotal} task-களில் ${weekly.weekDone} முடித்துள்ளீர்கள். சுமார் ${weekly.weekPct}%.`
          : `You finished ${weekly.weekDone} of ${weekly.weekTotal} tasks this week, around ${weekly.weekPct}%.`
        : "Low tracked data.",
      momentum:     streakDays >= 3 ? "Great streak!" : "Building momentum...",
      pattern:      `Best: ${bestDayName}. Pending today: ${totalPending}.`,
      predictedPct, burnoutRisk,
      overdueCount: overdueTasks.length,
      chartPoints:  trend,
      weeklyStory:  isTamil ? "உங்கள் வாரம் ஒரு தொடர் முயற்சி." : "Your week was a journey of consistent effort.",
      trend:        trendDelta > 5 ? 'up' : trendDelta < -5 ? 'down' : 'stable',
      advice:       isTamil ? "அடுத்த வாரம் இன்னும் சிறப்பாக செய்வோம்." : "Let's aim for even better focus next week.",
      forecast:     isTamil ? "நல்ல முன்னேற்றம்" : "Positive trajectory",
      nextWeekPlan: [
        {
          title:  isTamil ? "அதிகாலை வேலைகள்" : "Morning Focus",
          detail: isTamil ? "முக்கியமான வேலைகளை முதலில் முடிக்கவும்." : "Complete core tasks before 10 AM."
        },
        {
          title:  isTamil ? "இடைவேளை" : "Recovery",
          detail: isTamil ? "Burnout தவிர்க்க ஓய்வு எடுக்கவும்." : "Schedule recovery blocks to avoid burnout."
        }
      ],
      nextWeekTaskDrafts: []
    };
  }, [appLanguage, goals, nowMinutes, streakDays, weekly]);

  // ─── ACTIONS ───
  const save = useCallback((updated) => {
    setGoals(updated);
    let serialized = "[]";
    try { serialized = JSON.stringify(updated); } catch {}
    pendingWriteRef.current.last = serialized;
    if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer);
    pendingWriteRef.current.timer = setTimeout(() => {
      writeStorage(pendingWriteRef.current.last).catch(() => {});
    }, 150);
  }, []);

  const onRefreshNotifications = useCallback(() => {
    scheduleTaskNotifications(goals);
    setSmartNotice({
      id: 'notif-refresh',
      text: appLanguage === 'ta' ? "அறிவிப்புகள் புதுப்பிக்கப்பட்டன!" : "Notifications refreshed!",
      icon: '🔔',
      type: 'info'
    });
  }, [goals, appLanguage]);

  // ✅ FIX 1: Custom confirm — replaces window.confirm
  const showConfirm = useCallback((message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  }, []);

  const handleConfirmYes = useCallback(() => {
    confirmDialog?.onConfirm?.();
    setConfirmDialog(null);
  }, [confirmDialog]);

  const handleConfirmNo = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  // ─── EFFECTS ───

  // ✅ FIX 3: Smart context — interval cleanup correct
  useEffect(() => {
    if (!loaded) return;
    const checkSmartContext = () => {
      const now  = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const overdue = goals.filter(g =>
        goalVisibleOn(g, todayKey()) &&
        !isDoneOn(g, todayKey()) &&
        g.endTime &&
        timeToMinutes(g.endTime) < mins
      );
      if (overdue.length > 0) {
        setSmartNotice({
          id:   'overdue-' + overdue.length,
          text: appLanguage === 'ta'
            ? `${overdue.length} வேலைகள் தாமதமாகின்றன. இப்போதே முடிப்போம்!`
            : `${overdue.length} tasks are overdue. Let's finish them!`,
          icon: '⚠️', type: 'warning'
        });
        return;
      }
      const analyzedHabits = analyzeHabits(goals);
      const currentHabit   = analyzedHabits.find(h => Math.abs(h.avgMins - mins) < 20);
      if (currentHabit) {
        setSmartNotice({
          id:   'habit-' + currentHabit.text,
          text: appLanguage === 'ta'
            ? `வழக்கமான நேரமாகிய இப்போது "${currentHabit.text}" பணியைச் செய்யலாமா?`
            : `Time for your habit: "${currentHabit.text}". Start now?`,
          icon: '🤖', type: 'habit'
        });
      }
    };
    const iv    = setInterval(checkSmartContext, 15 * 60 * 1000);
    const timer = setTimeout(checkSmartContext, 5000);
    return () => { clearInterval(iv); clearTimeout(timer); };
  }, [loaded, goals, appLanguage]);

  // ✅ FIX 4: Challenge milestones — correct dependency array
  const checkChallengeMilestones = useCallback((currentStreak) => {
    const MILESTONES  = [1, 3, 7, 14, 21, 30];
    const XP_REWARDS  = { 1: 10, 3: 30, 7: 70, 14: 150, 21: 210, 30: 300 };
    const awarded     = safeGetJSON(STORAGE_KEYS.MILESTONES, []);
    MILESTONES.forEach(m => {
      if (currentStreak >= m && !awarded.includes(m)) {
        awarded.push(m);
        safeSetJSON(STORAGE_KEYS.MILESTONES, awarded);
        setUserXP(prev => {
          const newXP = prev + (XP_REWARDS[m] || 0);
          safeSetItem(STORAGE_KEYS.XP, newXP);
          return newXP;
        });
      }
    });
  }, []);

  // ✅ FIX 4: Correct dependency array — includes checkChallengeMilestones
  useEffect(() => {
    if (streakDays > 0) checkChallengeMilestones(streakDays);
  }, [streakDays, checkChallengeMilestones]);

  // Live task notifications
  useEffect(() => {
    if (!liveHighlightEnabled || !loaded) return;
    if (!liveCurrentGoal?.id) {
      if (liveTaskRef.current !== undefined) {
        updateLiveActivityNotification(null);
        liveTaskRef.current = undefined;
      }
      return;
    }
    const idChanged = liveTaskRef.current !== liveCurrentGoal.id;
    liveTaskRef.current = liveCurrentGoal.id;
    if (idChanged) {
      if (!isFirstRunRef.current) setLiveTaskPopup(liveCurrentGoal);
      isFirstRunRef.current = false;
      electronIpc?.send?.("notify-task-shift", {
        text:      liveCurrentGoal.text,
        startTime: liveCurrentGoal.startTime,
        endTime:   liveCurrentGoal.endTime,
        session:   liveCurrentGoal.session,
      });
    }
    const now        = Date.now();
    const lastUpdate = liveNotifLastUpdateRef.current || 0;
    if (now - lastUpdate >= 300000) {
      liveNotifLastUpdateRef.current = now;
      updateLiveActivityNotification(liveCurrentGoal, null);
    }
  }, [electronIpc, liveCurrentGoal, liveHighlightEnabled, loaded]);

  // Minute tick
  useEffect(() => {
    const iv = setInterval(() => setNowMinuteTick(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

  // ─── INIT ───
  useEffect(() => {
    const init = async () => {
      try {
        // Load goals
        const rawGoals = await readStorage();
        if (rawGoals) {
          try {
            const parsed = JSON.parse(rawGoals);
            if (Array.isArray(parsed) && parsed.length > 0) setGoals(parsed);
          } catch {}
        }

        // Load prefs
        const savedPrefs = await readPrefs();
        if (savedPrefs) {
          if (savedPrefs.userName)      setUserName(savedPrefs.userName);
          if (savedPrefs.themeMode)     setThemeMode(savedPrefs.themeMode);
          if (savedPrefs.appLanguage)   setAppLanguage(savedPrefs.appLanguage);
          if (savedPrefs.taskFontSize)  setTaskFontSize(savedPrefs.taskFontSize);
          if (savedPrefs.uiScale)       setUiScale(savedPrefs.uiScale);
          if (savedPrefs.fontWeight)    setFontWeight(savedPrefs.fontWeight);
          if (savedPrefs.soundTheme)    setSoundTheme(savedPrefs.soundTheme);
          if (savedPrefs.hapticEnabled !== undefined) setHapticEnabled(savedPrefs.hapticEnabled);
          if (savedPrefs.bgTheme)       setBgTheme(savedPrefs.bgTheme);
        }

        // ✅ FIX 2: All reads via safeGet helpers — no raw localStorage mix
        const premiumData = safeGetJSON(STORAGE_KEYS.PREMIUM, null);
        if (premiumData?.expiresAt && new Date(premiumData.expiresAt) > new Date()) {
          setIsPremium(true);
        }

        const savedXP    = parseInt(safeGetItem(STORAGE_KEYS.XP, '0'));
        const savedLevel = parseInt(safeGetItem(STORAGE_KEYS.LEVEL, '1'));
        setUserXP(isNaN(savedXP) ? 0 : savedXP);
        setUserLevel(isNaN(savedLevel) ? 1 : savedLevel);

        const savedHabits  = safeGetJSON(STORAGE_KEYS.HABITS,          []);
        const savedCareer  = safeGetJSON(STORAGE_KEYS.CAREER,          {});
        const savedJournal = safeGetJSON(STORAGE_KEYS.JOURNAL,         []);
        const savedChallenge = safeGetItem(STORAGE_KEYS.CHALLENGE_START, null);
        setHabits(savedHabits);
        setCareer(savedCareer);
        setJournalEntries(savedJournal);
        if (savedChallenge) setChallengeStart(savedChallenge);

        const trialStart = safeGetItem(STORAGE_KEYS.TRIAL_START, null);
        if (trialStart) {
          const daysPassed = Math.floor((Date.now() - parseInt(trialStart)) / 86400000);
          setTrialDaysLeft(Math.max(0, 30 - daysPassed));
        }
      } catch {}
      finally {
        setShowLoader(false);
        setLoaded(true);
      }
    };

    init();

    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ✅ FIX 3: Settings save — SPLIT into 2 focused effects
  // Effect A: Save display preferences + userName together
  // ✅ BUG #1 FIX: userName included — prevents welcome screen on every launch
  useEffect(() => {
    if (!loaded) return;
    writePrefs({
      userName,  // ← Critical: must be included!
      themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily,
      uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled,
      liveHighlightEnabled, bgTheme
    });

    const root = document.documentElement;
    root.style.setProperty('--task-font-size',      `${taskFontSize}px`);
    root.style.setProperty('--task-font-family',    taskFontFamily);
    root.style.setProperty('--global-font-weight',  fontWeight);
    root.style.setProperty('--ui-scale',            uiScale / 100);

    document.body.className = `theme-${themeMode}${bgTheme !== 'none' ? ` bg-anim-${bgTheme}` : ''}`;
  }, [
    loaded, userName, themeMode, autoThemeMode, appLanguage,
    taskFontSize, taskFontFamily, uiScale, overdueEnabled,
    fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled, bgTheme
  ]);

  // Effect B: Save habits/career/journal data
  useEffect(() => {
    if (!loaded) return;
    safeSetJSON(STORAGE_KEYS.HABITS,  habits);
    safeSetJSON(STORAGE_KEYS.CAREER,  career);
    safeSetJSON(STORAGE_KEYS.JOURNAL, journalEntries);
    if (challengeStart) safeSetItem(STORAGE_KEYS.CHALLENGE_START, challengeStart);
  }, [loaded, habits, career, journalEntries, challengeStart]);

  // Effect C: Schedule notifications when goals change
  useEffect(() => {
    if (!loaded) return;
    scheduleTaskNotifications(goals);
  }, [loaded, goals]);

  // ─── XP / LEVEL ───
  const addXP = useCallback((priority = 'medium') => {
    const XP_VALUES = { high: 30, medium: 20, low: 10 };
    const xpGain    = XP_VALUES[priority?.toLowerCase()] || 15;
    setUserXP(prev => {
      const newXP    = prev + xpGain;
      const newLevel = Math.floor(newXP / 100) + 1;
      safeSetItem(STORAGE_KEYS.XP,    newXP);
      safeSetItem(STORAGE_KEYS.LEVEL, newLevel);
      setUserLevel(newLevel);
      return newXP;
    });
  }, []);

  // ─── TASK ACTIONS ───
  const toggleDoneWithCelebration = useCallback((goal) => {
    const wasCompleted = goal.done || goal.doneOn?.[activeDate];
    if (goal.repeat === "None") {
      save(goals.map(g => g.id === goal.id ? { ...g, done: !goal.done } : g));
    } else {
      save(goals.map(g => {
        if (g.id !== goal.id) return g;
        const doneOn = { ...(g.doneOn || {}) };
        if (doneOn[activeDate]) delete doneOn[activeDate];
        else doneOn[activeDate] = true;
        return { ...g, doneOn };
      }));
    }
    if (!wasCompleted) {
      triggerHaptic('light');
      addXP(goal.priority);
      AudioPlayer.playComplete();
      setShowCelebration(true);
      clearTimeout(globalCelebrationTimerRef.current);
      globalCelebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 2500);
      setCompletedPulseId(goal.id);
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setCompletedPulseId(null), 400);
      setCelebratingGoalId(goal.id);
      clearTimeout(celebrateTimerRef.current);
      celebrateTimerRef.current = setTimeout(() => setCelebratingGoalId(null), 600);
    }
  }, [activeDate, goals, save, addXP]);

  const submitForm = useCallback(() => {
    if (!form.text.trim()) return;
    const g = normalizeGoal({ ...form });
    if (editingGoal) {
      save(goals.map(x => x.id === editingGoal ? { ...x, ...form } : x));
    } else {
      save([...goals, { ...g, id: Date.now() }]);
    }
    setShowForm(false);
    setEditingGoal(null);
    setForm({
      text: "", date: activeDate, reminder: "",
      startTime: "", endTime: "", repeat: "None",
      session: "Morning", priority: "Medium"
    });
    triggerHaptic('medium');
  }, [form, editingGoal, goals, activeDate, save]);

  const removeGoal = useCallback((id) => {
    save(goals.filter(g => g.id !== id));
    triggerHaptic('medium');
  }, [goals, save]);

  const handleImportTasks = useCallback((imported) => {
    save(imported);
    setShowImportExport(false);
    triggerHaptic('success');
  }, [save]);

  const selectAllVisibleGoals = useCallback(() =>
    setSelectedGoalIds(visibleGoals.map(g => g.id)),
  [visibleGoals]);

  const clearSelectedGoals = useCallback(() => setSelectedGoalIds([]), []);

  // ✅ FIX 1: No window.confirm — uses custom dialog
  const deleteSelectedGoals = useCallback(() => {
    showConfirm(
      appLanguage === 'ta' ? "தேர்ந்தெடுக்கப்பட்ட பணிகளை நீக்கவா?" : "Delete selected tasks?",
      () => {
        save(goals.filter(g => !selectedSet.has(g.id)));
        setSelectedGoalIds([]);
      }
    );
  }, [goals, selectedSet, save, showConfirm, appLanguage]);

  const markAllPendingDone = useCallback(() => {
    save(goals.map(g => {
      if (!goalVisibleOn(g, activeDate) || isDoneOn(g, activeDate)) return g;
      if (g.repeat === "None") return { ...g, done: true };
      const doneOn = { ...(g.doneOn || {}) };
      doneOn[activeDate] = true;
      return { ...g, doneOn };
    }));
  }, [goals, activeDate, save]);

  const duplicatePendingToTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomKey    = toKey(tomorrow);
    const duplicates = pendingGoals.map(g => ({
      ...normalizeGoal(g),
      id:     Date.now() + Math.random(),
      date:   tomKey,
      done:   false,
      doneOn: {}
    }));
    save([...goals, ...duplicates]);
  }, [goals, pendingGoals, save]);

  const reopenAllCompleted = useCallback(() => {
    save(goals.map(g => {
      if (!goalVisibleOn(g, activeDate) || !isDoneOn(g, activeDate)) return g;
      if (g.repeat === "None") return { ...g, done: false };
      const doneOn = { ...(g.doneOn || {}) };
      delete doneOn[activeDate];
      return { ...g, doneOn };
    }));
  }, [goals, activeDate, save]);

  const toggleSubtask = useCallback((goalId, subIdx) => {
    save(goals.map(g => {
      if (g.id !== goalId) return g;
      const subtasks = [...(g.subtasks || [])];
      if (subtasks[subIdx]) subtasks[subIdx].done = !subtasks[subIdx].done;
      return { ...g, subtasks };
    }));
  }, [goals, save]);

  const toggleSelectGoal = useCallback((id) => {
    setSelectedGoalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const dotsFor = useCallback((dateKey) => {
    const visible = goals.filter(g => goalVisibleOn(g, dateKey));
    return {
      done:    visible.filter(g =>  isDoneOn(g, dateKey)).length,
      pending: visible.filter(g => !isDoneOn(g, dateKey)).length,
    };
  }, [goals]);

  // ─── AI ACTIONS ───

  // ✅ FIX 7: isBriefingLoading added to dependency array
  const fetchAiBriefing = useCallback(async () => {
    if (!userName || !loaded || isBriefingLoading) return;
    setIsBriefingLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/briefing'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          language: appLanguage,
          appData: {
            total:       goals.length,
            done:        goals.filter(g => isDoneOn(g, todayKey())).length,
            streak:      streakDays,
            highPriority:goals.filter(g => g.priority === 'High' && !isDoneOn(g, todayKey())).length,
            weeklyPct:   weekly?.weekPct || 0,
            userGoal:    safeGetItem(STORAGE_KEYS.USER_GOAL, ''),
            coachTone:   safeGetItem(STORAGE_KEYS.COACH_TONE, 'motivational'),
            level:       parseInt(safeGetItem(STORAGE_KEYS.LEVEL, '1')),
          }
        })
      });
      const data = await response.json();
      if (data.briefing) setAiPersonalCoach(data.briefing);
    } catch {}
    finally { setIsBriefingLoading(false); }
  }, [userName, loaded, isBriefingLoading, appLanguage, goals, streakDays, weekly?.weekPct]);

  const handleOptimizeSchedule = useCallback(async (tasksToOptimize) => {
    if (!tasksToOptimize?.length) return;
    setAiLoading(true);
    triggerHaptic('heavy');
    try {
      const response = await fetch(getApiUrl('/api/optimize'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksToOptimize, language: appLanguage })
      });
      const data = await response.json();
      if (data.optimizedTasks) {
        const map     = new Map(data.optimizedTasks.map(t => [t.id, t]));
        const updated = goals.map(g => map.has(g.id) ? { ...g, ...map.get(g.id) } : g);
        save(updated);
        setSmartNotice({
          id:   'opt-success',
          text: appLanguage === 'ta' ? "✅ அட்டவணை மேம்படுத்தப்பட்டது!" : "✅ Schedule optimized!",
          icon: '✨', type: 'success'
        });
      }
    } catch {}
    finally { setAiLoading(false); }
  }, [goals, appLanguage, save]);

  const handleSmartTaskParse = useCallback(async (rawText) => {
    if (!rawText.trim()) return;
    setAiLoading(true);
    triggerHaptic('light');
    try {
      const response = await fetch(getApiUrl('/api/parse-task'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, language: appLanguage })
      });
      const data = await response.json();
      if (data.parsedTask) {
        const { text, startTime, endTime, priority, date } = data.parsedTask;
        setForm(p => ({
          ...p,
          text:      text      || rawText,
          startTime: startTime || p.startTime,
          endTime:   endTime   || p.endTime,
          priority:  priority  || p.priority,
          date:      date      || p.date,
        }));
      }
    } catch {
      setForm(p => ({ ...p, text: rawText }));
    }
    finally { setAiLoading(false); }
  }, [appLanguage]);

  const handleDecomposeTask = useCallback(async (id) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    setAiLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/decompose'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: g.text, language: appLanguage })
      });
      const data = await response.json();
      if (data.subtasks) {
        save(goals.map(x =>
          x.id === id
            ? { ...x, subtasks: data.subtasks.map(s => ({ text: s, done: false })) }
            : x
        ));
      }
    } catch {}
    finally { setAiLoading(false); }
  }, [goals, appLanguage, save]);

  const handleAiAutoSchedule = useCallback(async () => {
    setAiLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/autoschedule'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, goals, language: appLanguage })
      });
      const data = await response.json();
      if (data.newTasks) {
        save([...goals, ...data.newTasks.map(t =>
          normalizeGoal({ ...t, id: Date.now() + Math.random() })
        )]);
      }
    } catch {}
    finally { setAiLoading(false); }
  }, [userName, goals, appLanguage, save]);

  // ─── USER ACTIONS ───
  const handleSaveName = useCallback(async () => {
    if (tempName.trim()) {
      const name = tempName.trim();
      setUserName(name);
      setShowNameSetup(false);
      triggerHaptic('success');
      // ✅ BUG #1 FIX: Merge with existing prefs — don't overwrite!
      try {
        const existing = await readPrefs() || {};
        writePrefs({ ...existing, userName: name });
      } catch {
        writePrefs({ userName: name });
      }
    }
  }, [tempName]);

  // ─── HABITS ───
  const addHabit = useCallback((text) => {
    if (!text.trim()) return;
    const updated = [...habits, { id: Date.now(), text, checked: {}, createdOn: todayKey() }];
    setHabits(updated);
    triggerHaptic('medium');
  }, [habits]);

  const removeHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    triggerHaptic('medium');
  }, []);

  const toggleHabitDay = useCallback((id, dayKey) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const checked = { ...h.checked };
      checked[dayKey] = !checked[dayKey];
      return { ...h, checked };
    }));
    triggerHaptic('light');
  }, []);

  // ─── NAVIGATION SHORTCUTS ───
  const onAddTask     = useCallback(() => {
    setForm({ text: "", date: todayKey(), reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
    setShowForm(true);
  }, []);
  const onPlanDay         = useCallback(() => setActiveView('planner'),                   []);
  const onAutoSchedule    = useCallback(() => { setShowForm(true); handleAiAutoSchedule(); }, [handleAiAutoSchedule]);
  const onStartFocus      = useCallback(() => setFocusMode(true),                          []);
  const onReplaceGoals    = useCallback((gs) => save(gs),                                  [save]);

  // ✅ FIX 1: No window.alert / window.confirm
  const onCreateNextWeekPlan = useCallback(() => {
    setSmartNotice({
      id:   'next-week-plan',
      text: appLanguage === 'ta' ? "அடுத்த வாரத்திற்கான திட்டம் தயாராகிறது..." : "Creating next week's plan...",
      icon: '📅', type: 'info'
    });
  }, [appLanguage]);

  const onClearCache = useCallback(() => {
    showConfirm(
      appLanguage === 'ta' ? "அனைத்து தரவையும் அழிக்கவா?" : "Clear all data?",
      () => { try { localStorage.clear(); } catch {} window.location.reload(); }
    );
  }, [showConfirm, appLanguage]);

  const onClearLocalData = useCallback(() => {
    showConfirm(
      appLanguage === 'ta' ? "அனைத்தையும் நீக்கவா?" : "Delete everything?",
      () => { try { localStorage.clear(); } catch {} window.location.reload(); }
    );
  }, [showConfirm, appLanguage]);

  const onOpenBatterySettings = useCallback(() => electronIpc?.send('open-battery-settings'), [electronIpc]);
  const onOpenAppSettings     = useCallback(() => electronIpc?.send('open-app-settings'),     [electronIpc]);

  const handleChatAction = useCallback((action) => {
    if (!action) return;
    if (action.type === 'add_task') {
      const g = normalizeGoal(action.payload);
      save([...goals, { ...g, id: Date.now() }]);
      triggerHaptic('success');
    } else if (action.type === 'navigate') {
      setActiveView(action.payload.view);
    }
  }, [goals, save]);

  const calculateNextUpcomingTask = useCallback(() => {
    const currentTime = new Date().toTimeString().slice(0, 5);
    return pendingGoals
      .filter(t => t.startTime && t.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;
  }, [pendingGoals]);

  // ─── CONTEXT VALUE ───
  const value = {
    // Electron
    electronIpc,
    // User
    userName, setUserName, showNameSetup, setShowNameSetup,
    onboardStep, setOnboardStep, onboardGoal, setOnboardGoal,
    onboardFocus, setOnboardFocus, trialDaysLeft, setTrialDaysLeft,
    showLoader, setShowLoader, isPremium, setIsPremium,
    showRatingPrompt, setShowRatingPrompt, isOffline, setIsOffline,
    userXP, setUserXP, coachTone, setCoachTone, userLevel, setUserLevel,
    tempName, setTempName,
    // Tasks
    goals, setGoals, loaded, setLoaded, showForm, setShowForm,
    aiLoading, setAiLoading, editingGoal, setEditingGoal,
    activeDate, setActiveDate, weekBase, setWeekBase,
    activeView, setActiveView, notifPerm, setNotifPerm,
    priorityFilter, setPriorityFilter, timeFilter, setTimeFilter,
    searchTerm, setSearchTerm,
    // Theme
    themeMode, setThemeMode, autoThemeMode, setAutoThemeMode,
    appLanguage, setAppLanguage, taskFontSize, setTaskFontSize,
    taskFontFamily, setTaskFontFamily, uiScale, setUiScale,
    overdueEnabled, setOverdueEnabled, fontWeight, setFontWeight,
    soundTheme, setSoundTheme, hapticEnabled, setHapticEnabled,
    liveHighlightEnabled, setLiveHighlightEnabled, bgTheme, setBgTheme,
    // UI
    reminderPopup, setReminderPopup, liveTaskPopup, setLiveTaskPopup,
    nextTaskAlert, setNextTaskAlert, form, setForm,
    completedPulseId, setCompletedPulseId,
    celebratingGoalId, setCelebratingGoalId,
    selectedGoalIds, setSelectedGoalIds,
    plannerView, setPlannerView, showPomodoro, setShowPomodoro,
    showImportExport, setShowImportExport, focusMode, setFocusMode,
    upcomingTaskAlert, setUpcomingTaskAlert,
    showCelebration, setShowCelebration,
    nextUpcomingTask, setNextUpcomingTask,
    showShortcuts, setShowShortcuts,
    showWeeklyWizard, setShowWeeklyWizard,
    tabSwitching, setTabSwitching,
    showMoreMenu, setShowMoreMenu,
    aiContext, setAiContext,
    aiPersonalCoach, setAiPersonalCoach,
    isBriefingLoading, setIsBriefingLoading,
    smartNotice, setSmartNotice,
    // ✅ Custom confirm dialog
    confirmDialog, showConfirm, handleConfirmYes, handleConfirmNo,
    // Derived
    weekDays, visibleGoals, pendingGoals, completedGoals, selectedSet,
    streakDays, total, pct, done, dueSoon, weekly,
    copy, quote, aiBriefing, aiWeeklyAnalysis, activeDateLabel,
    liveCurrentGoal, nextUpcomingGoal,
    // Actions
    save, onRefreshNotifications,
    handleSaveName, toggleDoneWithCelebration,
    submitForm, removeGoal, handleImportTasks,
    selectAllVisibleGoals, clearSelectedGoals, deleteSelectedGoals,
    markAllPendingDone, duplicatePendingToTomorrow, reopenAllCompleted,
    handleDecomposeTask, toggleSubtask, handleAiAutoSchedule,
    handleOptimizeSchedule, handleSmartTaskParse, fetchAiBriefing,
    handleChatAction, dotsFor, toggleSelectGoal,
    calculateNextUpcomingTask,
    onAddTask, onPlanDay, onAutoSchedule, onStartFocus,
    onOptimizeSchedule: handleOptimizeSchedule,
    onCreateNextWeekPlan, onReplaceGoals,
    onClearCache, onClearLocalData,
    onOpenBatterySettings, onOpenAppSettings,
    // Habits
    habits, setHabits, addHabit, removeHabit, toggleHabitDay,
    // Other
    career, setCareer, journalEntries, setJournalEntries,
    challengeStart, setChallengeStart,
    addXP,
    onOpenPomodoro: () => { setActiveView('tasks'); setShowPomodoro(true); },
    requestNotifPerm: requestNotificationPermission,
    searchRef,
    masterTimerRef: null,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};