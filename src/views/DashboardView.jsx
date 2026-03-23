// DashboardView.jsx — Adaptive AI System
// Architecture: trust-first, user-controlled, long-term supportive
// 7 evolutionary upgrades — not a redesign
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { todayKey, goalVisibleOn, isDoneOn, timeToMinutes, getTimeRemainingMs } from '../utils/helpers';
import { LiveClock, LiveCountdown, LiveRemainingText } from '../components/LiveTimeComponents';
import { useApp } from '../context/AppContext';

// ── Helpers ────────────────────────────────────────────────────
function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// STORAGE LAYER — abstracted for future backend sync (FIX 7)
// Drop-in replace: swap localStore with API calls when ready
// ═══════════════════════════════════════════════════════════════
const STORE_VERSION = 'v4';
const KEYS = {
  behavior: `tp_behavior_${STORE_VERSION}`,
  session: `tp_session_${STORE_VERSION}`,
  mode: `tp_mode_${STORE_VERSION}`,
  weekly: `tp_weekly_${STORE_VERSION}`,
  insightShown: `tp_insight_${STORE_VERSION}`,
};

// FIX 7: Storage abstraction — ready for backend sync
const localStore = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
  merge: (key, patch) => { localStore.set(key, { ...(localStore.get(key) || {}), ...patch }); },
  // FIX 7: sync stub — replace with real API when backend is ready
  syncToBackend: async (userId, payload) => {
    // await fetch('/api/sync', { method:'POST', body: JSON.stringify({ userId, ...payload }) });
    // For now: no-op. Data lives locally until backend is ready.
  },
};

// ═══════════════════════════════════════════════════════════════
// BEHAVIOR ENGINE — learns from usage, explains itself (FIX 1)
// ═══════════════════════════════════════════════════════════════
function readBehavior() {
  return localStore.get(KEYS.behavior) || {};
}

function recordCompletion() {
  const b = readBehavior();
  const hour = new Date().getHours();
  localStore.merge(KEYS.behavior, {
    completionHours: [...(b.completionHours || []).slice(-99), hour],
    totalCompleted: (b.totalCompleted || 0) + 1,
  });
}

function recordSkip(taskKey) {
  const b = readBehavior();
  const sc = b.skipCounts || {};
  localStore.merge(KEYS.behavior, {
    skipCounts: { ...sc, [taskKey]: (sc[taskKey] || 0) + 1 },
  });
}

function recordPause(durationMins) {
  const b = readBehavior();
  localStore.merge(KEYS.behavior, {
    pauseDurations: [...(b.pauseDurations || []).slice(-19), durationMins],
  });
}

// FIX 4: Record weekly snapshot for long-term feedback loops
function recordWeeklySnapshot(weekPct, weekDone, weekTotal) {
  const key = KEYS.weekly;
  const history = localStore.get(key) || [];
  const weekStr = (() => {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
  })();
  const already = history.find(h => h.week === weekStr);
  if (!already) {
    const updated = [...history.slice(-11), { week: weekStr, pct: weekPct, done: weekDone, total: weekTotal }];
    localStore.set(key, updated);
    localStore.syncToBackend(null, { weeklyHistory: updated });
  }
}

// ═══════════════════════════════════════════════════════════════
// INTELLIGENCE COMPUTE — lean, transparent (FIX 2)
// FIX 2: Only fires insights when data is confident (n >= threshold)
// ═══════════════════════════════════════════════════════════════
function computeIntelligence(goals, behavior) {
  const nowHour = new Date().getHours();
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  // Peak hour — needs ≥10 data points to be reliable (FIX 2: avoid over-inference)
  const hours = behavior.completionHours || [];
  let peakHour = null, isPeakNow = false;
  if (hours.length >= 10) {
    const buckets = Array(24).fill(0);
    hours.forEach(h => { if (h >= 0 && h < 24) buckets[h]++; });
    const max = Math.max(...buckets);
    // Only call it "peak" if that hour has meaningfully more completions (>30% of avg)
    const avg = hours.length / 24;
    peakHour = buckets.indexOf(max);
    isPeakNow = max > avg * 1.3 && Math.abs(nowHour - peakHour) <= 1;
  }

  // Capacity — needs ≥5 active days of data (FIX 2: honest uncertainty)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i - 1);
    const k = todayKey(d);
    const vis = goals.filter(g => goalVisibleOn(g, k));
    return { done: vis.filter(g => isDoneOn(g, k)).length, total: vis.length };
  });
  const activeDays = last14.filter(d => d.done > 0);
  const avgCapacity = activeDays.length >= 5
    ? Math.round(activeDays.reduce((a, b) => a + b.done, 0) / activeDays.length)
    : null; // null = not enough data

  const skipCounts = behavior.skipCounts || {};
  const pauseList = behavior.pauseDurations || [];
  const avgPause = pauseList.length >= 3
    ? Math.round(pauseList.reduce((a, b) => a + b, 0) / pauseList.length)
    : null;

  // FIX 4: Weekly trend from stored history
  const weeklyHistory = localStore.get(KEYS.weekly) || [];
  const trend = weeklyHistory.length >= 3
    ? (() => {
      const recent = weeklyHistory.slice(-3).map(w => w.pct);
      const delta = recent[recent.length - 1] - recent[0];
      return delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable';
    })()
    : null;

  // FIX 4: Low-energy consecutive days for stagnation detection
  const lowStreakData = (() => {
    try { return localStore.get(`tp_lowstreak_${STORE_VERSION}`) || { count: 0, lastDate: null }; }
    catch { return { count: 0 }; }
  })();
  return { peakHour, isPeakNow, avgCapacity, skipCounts, avgPause, trend, weeklyHistory, dataAge: hours.length, lowStreak: lowStreakData };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DashboardView() {
  const app = useApp();
  const {
    appLanguage, userName, setActiveView,
    done, total, pct, weekly, streakDays, dueSoon, goals,
    liveCurrentGoal, isOffline,
    onAddTask, onPlanDay, onAutoSchedule, onStartFocus, removeGoal: onSkipTask,
  } = app;
  const ta = appLanguage === 'ta';
  const today = todayKey();

  // ── FIX 5: Smart / Simple mode — user controls AI depth ────
  const [aiMode, setAiMode] = useState(() => localStore.get(KEYS.mode)?.aiMode ?? 'smart');
  const toggleMode = useCallback(() => {
    const next = aiMode === 'smart' ? 'simple' : 'smart';
    setAiMode(next);
    localStore.merge(KEYS.mode, { aiMode: next });
  }, [aiMode]);
  const smart = aiMode === 'smart'; // shorthand

  // ── FIX 3: Energy mode — user sets their state for the day ─
  const [energyMode, setEnergyMode] = useState(() => {
    const stored = localStore.get(KEYS.session);
    return stored?.energyDate === today ? stored.energyMode : null;
  });
  const setEnergy = useCallback(mode => {
    setEnergyMode(mode);
    localStore.merge(KEYS.session, { energyMode: mode, energyDate: today });
    // FIX 4: Track consecutive low-energy days
    const lk = `tp_lowstreak_${STORE_VERSION}`;
    if (mode === 'low') {
      const prev = localStore.get(lk) || { count: 0, lastDate: null };
      const count = prev.lastDate === yesterday() ? prev.count + 1 : 1;
      localStore.set(lk, { count, lastDate: today });
    } else {
      localStore.set(lk, { count: 0, lastDate: today });
    }
  }, [today]);

  // ── FIX 7: Persistent session (localStorage with sync stub) ─
  const sess = localStore.get(KEYS.session) || {};
  const [paused, setPaused] = useState(sess.paused ?? false);
  const [pausedAt, setPausedAt] = useState(sess.pausedAt ?? null);
  const [skipped, setSkipped] = useState(sess.skippedDate === today ? (sess.skipped || []) : []);
  const [focusTop3, setFocusTop3] = useState(sess.focusDate === today ? (sess.focusTop3 || false) : false);
  // FIX 7: Undo system — in-memory, not persisted (intentional)
  const [undoStack, setUndoStack] = useState([]);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimer = useRef(null);

  const pushUndo = useCallback((type, payload, label) => {
    setUndoStack(prev => [...prev.slice(-4), { type, payload, label }]);
    setUndoVisible(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoVisible(false), 5000);
  }, []);

  const popUndo = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    if (last.type === 'skip') setSkipped(prev => prev.filter(id => id !== last.payload.id));
    if (last.type === 'focus3') setFocusTop3(false);
    if (last.type === 'energy') setEnergyMode(last.payload.prev);
    if (last.type === 'pause') { setPaused(false); setPausedAt(null); }
    setUndoStack(prev => prev.slice(0, -1));
    setUndoVisible(false);
  }, [undoStack]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  useEffect(() => {
    localStore.merge(KEYS.session, { paused, pausedAt, skipped, skippedDate: today, focusTop3, focusDate: today });
    localStore.syncToBackend(null, { session: { paused, skipped, focusTop3, date: today } });
  }, [paused, pausedAt, skipped, today, focusTop3]);

  // ── Intelligence ────────────────────────────────────────────
  const [intel, setIntel] = useState(() => computeIntelligence(goals || [], readBehavior()));
  useEffect(() => { setIntel(computeIntelligence(goals || [], readBehavior())); }, [goals]);

  // Record completion hours
  useEffect(() => { if (done > 0) recordCompletion(); }, [done]);

  // FIX 4: Record weekly snapshot on mount
  useEffect(() => {
    if (weekly?.weekPct != null) recordWeeklySnapshot(weekly.weekPct, weekly.weekDone, weekly.weekTotal);
  }, []); // once on mount

  // ── Task data ───────────────────────────────────────────────
  const todayGoals = useMemo(() => (goals || []).filter(g => goalVisibleOn(g, today)), [goals, today]);
  const nowMinsNow = useMemo(() => timeToMinutes(new Date().toTimeString().slice(0, 5)), []);

  const allPending = useMemo(() => {
    return todayGoals.filter(g => !isDoneOn(g, today)).sort((a, b) => {
      const aS = timeToMinutes(a.startTime || '');
      const bS = timeToMinutes(b.startTime || '');
      const aLate = aS && aS < nowMinsNow - 5;
      const bLate = bS && bS < nowMinsNow - 5;
      if (aLate && !bLate) return -1;
      if (!aLate && bLate) return 1;
      if (aS && bS) return aS - bS;
      if (aS) return -1; if (bS) return 1;
      const rank = { High: 0, Medium: 1, Low: 2 };
      return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
    });
  }, [todayGoals, today, nowMinsNow]);

  // FIX 3: Low-energy mode shows fewer tasks (max 3)
  const pending = useMemo(() => {
    const base = allPending.filter(g => !skipped.includes(g.id));
    const cap = (focusTop3 || energyMode === 'low') ? 3 : Infinity;
    return base.slice(0, cap);
  }, [allPending, skipped, focusTop3, energyMode]);

  const nextTask = pending[0] || null;
  const doneCount = todayGoals.filter(g => isDoneOn(g, today)).length;
  const totalCount = todayGoals.length;
  const preview = pending.slice(0, 3);

  const nextIsOverdue = nextTask?.startTime
    ? timeToMinutes(nextTask.startTime) < nowMinsNow - 5 : false;

  // FIX 6: Overload — only show when data is confident
  const isOverloaded = smart
    && intel.avgCapacity !== null
    && allPending.length > intel.avgCapacity * 1.5
    && allPending.length >= 6;

  // ── FIX 1: Transparent system explanation ──────────────────
  // Shows WHY and (when learning) HOW CONFIDENT the system is
  const nextReason = useMemo(() => {
    if (!nextTask || !smart) return null;

    const taskKey = nextTask.text.slice(0, 20).toLowerCase().replace(/\s/g, '_');
    const skipCount = intel.skipCounts?.[taskKey] || 0;

    // Overdue: precise, no dramatisation (FIX 6)
    if (nextIsOverdue) {
      const lateMins = Math.round(nowMinsNow - timeToMinutes(nextTask.startTime));
      return ta
        ? `${lateMins} நிமிடம் கடந்துவிட்டது`
        : `${lateMins} min past start time`;
    }
    // Repeated skip — gentle observation, not accusation (FIX 6)
    if (skipCount >= 2)
      return ta
        ? `இதை சில முறை தள்ளிப்போட்டீர்கள்`
        : `You've deferred this a few times`;
    // Peak hour — only when data is confident AND meaningful
    if (intel.isPeakNow && intel.dataAge >= 10)
      return ta
        ? `இது உங்கள் productive நேரம்`
        : `This tends to be a productive hour for you`;
    // Starting soon
    if (nextTask.startTime) {
      const diff = timeToMinutes(nextTask.startTime) - nowMinsNow;
      if (diff <= 5) return ta ? 'இப்போது தொடங்க வேண்டியது' : 'Starting now';
      if (diff <= 20) return ta ? `${diff} நிமிடத்தில் தொடங்கும்` : `Starts in ${diff} min`;
      return ta ? `${nextTask.startTime} க்கு scheduled` : `Scheduled for ${nextTask.startTime}`;
    }
    if (nextTask.priority === 'High')
      return ta ? 'High priority' : 'High priority';
    return null; // say nothing rather than say something generic
  }, [nextTask, nextIsOverdue, intel, ta, nowMinsNow, smart]);

  // FIX 2: Skip consequence — honest, not dramatic (FIX 6 softened)
  const skipConsequence = useMemo(() => {
    if (!nextTask) return null;
    const remaining = pending.length - 1;
    if (remaining > 0)
      return ta
        ? `அடுத்தது: "${pending[1]?.text?.slice(0, 24)}..."`
        : `Next: "${pending[1]?.text?.slice(0, 30)}..."`;
    if (remaining === 0)
      return ta ? 'இன்றைய list முடியும்' : "That's the last one for today";
    return null;
  }, [nextTask, pending, ta]);

  // ── FIX 3: Energy-adaptive content ─────────────────────────
  const energyConfig = useMemo(() => {
    if (energyMode === 'low') return {
      maxTasks: 3,
      nudgeStyle: 'gentle',   // no urgency language
      ctaLabel: ta ? 'மெதுவாக தொடங்கு' : 'Take it easy — start',
      emptyMsg: ta ? 'இன்று 3 tasks மட்டும் போதும்' : 'Three tasks is plenty today',
      metricShow: false,       // hide metrics — not useful when low energy
    };
    if (energyMode === 'high') return {
      maxTasks: Infinity,
      nudgeStyle: 'direct',
      ctaLabel: ta ? 'தொடங்கு' : 'Start',
      emptyMsg: ta ? 'நாளை திட்டமிடலாம்' : 'Ready to plan?',
      metricShow: true,
    };
    return { maxTasks: Infinity, nudgeStyle: 'direct', ctaLabel: ta ? 'தொடங்கு' : 'Start', emptyMsg: ta ? 'இன்றைய பணிகள் இல்லை' : 'No tasks yet today', metricShow: true };
  }, [energyMode, ta]);

  // ── FIX 4: Weekly feedback loop ────────────────────────────
  // FIX 6: Show weekly insight at most once per calendar week
  const weeklyInsight = useMemo(() => {
    const h = intel.weeklyHistory;
    if (!h || h.length < 3) return null;
    const weekKey = (() => {
      const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
      return `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
    })();
    const shownMap = localStore.get(KEYS.insightShown) || {};
    if (shownMap[weekKey]) return null;
    const recent = h.slice(-4);
    const avg = Math.round(recent.reduce((a, b) => a + b.pct, 0) / recent.length);
    const last = recent[recent.length - 1]?.pct ?? 0;
    const prev = recent[recent.length - 2]?.pct ?? 0;
    const diff = last - prev;

    if (intel.trend === 'up')
      return {
        title: ta ? 'கடந்த சில வாரங்களாக நல்ல trend' : `${avg}% avg — trending up`,
        body: ta ? 'இந்த வேகம் தொடர்ந்தால் மாதாந்திர இலக்கு எட்டலாம்' : 'Keep this pace and your monthly goal is reachable',
        action: null,
        tone: 'positive',
      };
    if (intel.trend === 'down' && diff < -10)
      return {
        title: ta ? 'வாரம் வாரமாக குறைந்து வருகிறது' : `Completion dropping week-over-week`,
        body: ta ? 'Tasks அதிகமா இருக்கா? Schedule பார்க்கலாம்' : "Too many tasks? Let's look at your schedule",
        action: { label: ta ? 'Schedule பார்' : 'Review schedule', tap: () => setActiveView('planner') },
        tone: 'neutral', // not negative — neutral and constructive
      };
    if (avg >= 75)
      return {
        title: ta ? `${avg}% — consistent week` : `${avg}% consistency`,
        body: ta ? 'நல்ல rhythm கிடைத்திருக்கிறது' : "You've found a good rhythm",
        action: null,
        tone: 'positive',
      };
    return null;
  }, [intel, ta]);

  // ── Pause context ────────────────────────────────────────────
  const pauseContext = useMemo(() => {
    if (!paused || !pausedAt) return null;
    const pausedMins = Math.round((Date.now() - pausedAt) / 60000);
    const taskEndMins = liveCurrentGoal?.endTime ? timeToMinutes(liveCurrentGoal.endTime) : null;
    const minsLeft = taskEndMins ? taskEndMins - nowMinsNow : null;
    return {
      pausedMins,
      label: pausedMins < 2 ? (ta ? 'இப்போது நிறுத்தினீர்கள்' : 'Just paused') : (ta ? `${pausedMins} நிமிடம்` : `${pausedMins} min`),
      urgency: minsLeft !== null && minsLeft <= 5 ? (ta ? 'Task window மூடுகிறது' : 'Task window closing soon') : null,
    };
  }, [paused, pausedAt, liveCurrentGoal, nowMinsNow, ta]);

  // ── Metrics ──────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const weekDone = weekly?.weekDone || 0;
    const weekTotal = weekly?.weekTotal || 0;
    const rate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
    const days = (weekly?.days || []).filter(d => d.total > 0);
    const avgPerDay = days.length > 0 ? Math.round(weekDone / days.length) : 0;
    const overdue = dueSoon || 0;
    return {
      rate, avgPerDay, overdue,
      rateColor: rate >= 70 ? '#22C55E' : rate >= 40 ? 'var(--accent)' : '#EF4444',
      overdueColor: overdue > 0 ? '#EF4444' : 'var(--muted)',
      rateAction: rate < 50
        ? { label: ta ? 'ஏன்?' : 'Why?', hint: ta ? 'schedule பார்' : 'review schedule', tap: () => setActiveView('planner') }
        : rate >= 80
          ? { label: ta ? 'Push' : 'Push', hint: ta ? 'harder task' : 'add challenge', tap: () => onAddTask?.() }
          : null,
      overdueAction: overdue > 0
        ? { label: ta ? 'Start' : 'Start', tap: () => setActiveView('tasks') }
        : null,
    };
  }, [weekly, dueSoon, ta]);

  // ── Microcopy ───────────────────────────────────────────────
  const microcopy = useMemo(() => {
    if (!smart && energyMode !== 'high') return null;
    if (energyMode === 'low') return ta ? 'இன்று மெதுவாக போகலாம்.' : 'A slower day is still a day.';
    if (doneCount === 0 && totalCount > 0 && intel.isPeakNow && intel.dataAge >= 10)
      return ta ? 'இது உங்கள் productive நேரம்.' : 'Good time to get started.';
    if (doneCount === 1 && totalCount > 2)
      return ta ? 'முதல் task முடிந்தது.' : 'First one done.';
    if (totalCount > 0 && doneCount === Math.floor(totalCount / 2))
      return ta ? 'பாதி முடிந்தது.' : 'Halfway there.';
    if (doneCount === totalCount - 1 && totalCount > 1)
      return ta ? 'கடைசி ஒன்று மட்டும்.' : 'One left.';
    if (streakDays >= 5 && doneCount === totalCount)
      return ta ? `${streakDays} நாள் தொடர்.` : `${streakDays} days in a row.`;
    return null;
  }, [smart, energyMode, doneCount, totalCount, intel, streakDays, ta]);

  const completionSummary = useMemo(() => {
    if (totalCount === 0 || doneCount < totalCount) return null;
    let mins = 0;
    todayGoals.forEach(g => {
      if (g.startTime && g.endTime) mins += Math.max(0, timeToMinutes(g.endTime) - timeToMinutes(g.startTime));
    });
    return { count: totalCount, effort: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : mins > 0 ? `${mins}m` : null };
  }, [todayGoals, totalCount, doneCount]);

  // Screen state
  const screenState = useMemo(() => {
    if (totalCount === 0) return 'empty';
    if (doneCount === totalCount) return 'complete';
    if (paused) return 'paused';
    if (liveCurrentGoal) return 'in-progress';
    if (nextTask) return 'ready';
    return 'empty';
  }, [totalCount, doneCount, paused, liveCurrentGoal, nextTask]);

  // Handlers
  const handleSkip = useCallback(() => {
    if (!nextTask) return;
    const taskKey = nextTask.text.slice(0, 20).toLowerCase().replace(/\s/g, '_');
    recordSkip(taskKey);
    setSkipped(prev => [...prev, nextTask.id]);
    onSkipTask?.(nextTask.id);
    setIntel(computeIntelligence(goals || [], readBehavior()));
    pushUndo('skip', { id: nextTask.id }, ta ? `Skipped` : `Skipped "${nextTask.text.slice(0, 22)}"`);
  }, [nextTask, goals, onSkipTask, pushUndo, ta]);

  const handlePause = useCallback(() => {
    const ts = Date.now();
    setPaused(true); setPausedAt(ts);
    pushUndo('pause', {}, ta ? 'Session paused' : 'Session paused');
  }, [pushUndo, ta]);

  const handleResume = useCallback(() => {
    if (pausedAt) {
      const mins = Math.round((Date.now() - pausedAt) / 60000);
      if (mins > 0) recordPause(mins);
    }
    setPaused(false); setPausedAt(null);
  }, [pausedAt]);

  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (screenState !== 'in-progress') return;
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, [screenState]);

  const showMetrics = energyConfig.metricShow && (smart || energyMode === 'high');
  const activeDateLabel = new Date().toLocaleDateString(ta ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  if (!userName) {
    return (
      <div className="animate-fade-in view-transition" style={{ opacity: 0.5, pointerEvents: 'none', filter: 'blur(4px)' }}>
        <div className="hero mobile-hero-v6">
          <h1 className="title v6">{ta ? 'வரவேற்பு' : 'Welcome'}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in view-transition">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="dashboard-header-v2">
        <div className="header-main-stack">
          <span className="header-greeting">{ta ? 'இன்றைய கவனம்' : "Today's Focus"}</span>
          <div className="header-sub-text">
            <LiveClock /> <span>•</span> {doneCount}/{totalCount} {ta ? 'முடிந்தது' : 'Done'}
          </div>
        </div>
        
        <div className="header-stat-capsule">
          <div className="capsule-value">{pct}%</div>
          <div className="capsule-label">{ta ? 'முடிவு' : 'DONE'}</div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
      <div className="quick-actions-grid-v6" style={{ margin: '0 14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button className="v6-action-btn focus" onClick={() => onStartFocus?.()} style={{ 
          background: 'var(--chip)', border: '1px solid var(--card-border)', borderRadius: '18px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' 
        }}>
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>{ta ? 'கவனம்' : 'Focus'}</span>
        </button>
        <button className="v6-action-btn new" onClick={() => onAddTask?.()} style={{ 
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '18px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>＋</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{ta ? 'சேர்' : 'New Task'}</span>
        </button>
        <button className="v6-action-btn plan" onClick={() => !isOffline && onAutoSchedule?.()} style={{ 
          background: 'var(--chip)', border: '1px solid var(--card-border)', borderRadius: '18px', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: isOffline ? 0.5 : 1
        }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>{ta ? 'திட்டம்' : 'AI Plan'}</span>
        </button>
      </div>

      {/* ── OPTIMIZE CTA ─────────────────────────────────────────── */}
      <div style={{ margin: '0 14px 20px' }}>
        <button 
          onClick={() => !isOffline && onPlanDay?.()} 
          className="optimize-btn-v6"
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #a855f7, #6366f1)', 
            color: '#fff', 
            border: 'none', 
            fontWeight: 800, 
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)'
          }}
        >
          ✨ {ta ? 'அட்டவணையைச் சீராக்கு' : 'Optimize Schedule'}
        </button>
      </div>

      {/* ── AI COACH ─────────────────────────────────────────────── */}
      <div className="section-container-v2">
        <h2 className="section-title-v2">
          <span>🤖</span> AI Coach
        </h2>
        
        <div className="ai-briefing-grid-v2">
          <div className="ai-card-v2">
            <div className="ai-card-label">{ta ? 'நிலை' : 'LIVE MODE'}</div>
            <div className="ai-card-value live">
               <div className="pulse-dot-v2" /> On
            </div>
          </div>

          <div className="ai-card-v2">
            <div className="ai-card-label">{ta ? 'கவனம்' : 'FOCUS'}</div>
            <div className="ai-card-value">
              {nextTask ? `${ta ? 'தயார்' : 'Prep'} "${nextTask.text.substring(0, 15)}..."` : (ta ? 'தீர்வு இல்லை' : 'No tasks')}
            </div>
          </div>

          <div className="ai-card-v2">
            <div className="ai-card-label">{ta ? 'அபாயம்' : 'RISK'}</div>
            <div className="ai-card-value" style={{ color: isOverloaded ? 'var(--error)' : 'var(--text)' }}>
              {isOverloaded ? (ta ? 'அதிகம்' : 'High') : (ta ? 'குறைவு' : 'Low')}
            </div>
          </div>

          <div className="ai-card-v2">
            <div className="ai-card-label">{ta ? 'ஆலோசனை' : 'SUGGESTION'}</div>
            <div className="ai-card-value">
              {nextReason ? (nextReason.length > 20 ? nextReason.substring(0, 18) + '..' : nextReason) : (ta ? 'வேகம்' : 'Momentum')}
            </div>
          </div>
        </div>
      </div>

      {/* ── PRODUCTIVITY METRICS ──────────────────────────────────── */}
      <div className="section-container-v2">
        <div className="section-header-row-v2">
          <h2 className="section-title-v2">
            <span>📊</span> {ta ? 'உற்பத்தித்திறன்' : "Productivity"}
          </h2>
          <span className="section-date-label">{activeDateLabel}</span>
        </div>

        <div className="productivity-grid-v2">
          <div className="stat-card-v2 success">
            <div className="stat-value">{doneCount}/{totalCount}</div>
            <div className="stat-label">{ta ? 'முடிந்தவை' : 'TASKS DONE'}</div>
          </div>
          <div className="stat-card-v2 primary">
            <div className="stat-value">{Math.round(streakDays)}</div>
            <div className="stat-label">{ta ? 'தொடர் நாள்' : 'DAY STREAK'}</div>
          </div>
        </div>
      </div>

      {/* ── NEXT UP AREA ─────────────────────────────────────────── */}
      {nextTask && (
        <div style={{ margin: '0 14px 20px' }}>
          <div className="card next-up-card-v6" style={{ 
            padding: '20px', 
            borderRadius: '24px', 
            background: 'var(--card)', 
            border: '2px solid var(--accent)',
            boxShadow: '0 12px 32px rgba(59, 130, 246, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="ai-briefing-label" style={{ color: 'var(--accent)', margin: 0 }}>
                {nextIsOverdue ? (ta ? 'தாமதம்' : 'OVERDUE') : (ta ? 'அடுத்தது' : 'NEXT UP')}
              </div>
              <LiveCountdown endTime={nextTask.endTime} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.2 }}>
              {nextTask.text}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600, marginBottom: '20px' }}>
              {nextTask.startTime} {nextTask.endTime ? ` — ${nextTask.endTime}` : ''}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={() => { setActiveView('tasks'); onStartFocus?.(); }}
                style={{ 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '14px', 
                  borderRadius: '14px', 
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                ▶ {ta ? 'தொடங்கு' : 'Start Focus'}
              </button>
              <button 
                onClick={handleSkip}
                style={{ 
                  background: 'var(--chip)', 
                  color: 'var(--text)', 
                  border: '1px solid var(--card-border)', 
                  padding: '14px', 
                  borderRadius: '14px', 
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                {ta ? 'தவிர்' : 'Skip →'}
              </button>
            </div>

            {/* Background Decor */}
            <div style={{ position: 'absolute', bottom: '-20px', right: '-10px', fontSize: '6rem', opacity: 0.03, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>
              🎯
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 14px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Life OS · AI Productivity System
        </p>
      </div>

      {/* ── VIEW SPECIFIC STYLES ──────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-header-v2 {
          padding: calc(24px + var(--safe-top)) 20px 20px !important;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-main-stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .header-greeting {
          font-size: 1.8rem !important;
          font-weight: 900 !important;
          letter-spacing: -0.04em !important;
          color: var(--text);
          display: block;
        }
        .header-sub-text {
          font-size: 0.85rem !important;
          font-weight: 700 !important;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .header-stat-capsule {
          background: var(--chip);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .capsule-value {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text);
          line-height: 1;
        }
        .capsule-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .section-container-v2 {
          margin: 0 16px 28px;
        }
        .section-title-v2 {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 4px;
        }
        .ai-briefing-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ai-card-v2 {
          background: var(--chip);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 16px;
          transition: 0.2s;
        }
        .ai-card-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .ai-card-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-card-value.live { color: var(--success); }
        .pulse-dot-v2 {
          width: 6px; height: 6px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse-dot 2s infinite ease-in-out;
        }
        
        .section-header-row-v2 {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 14px;
          padding: 0 4px;
        }
        .section-date-label {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .productivity-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-card-v2 {
          border-radius: 24px;
          padding: 24px 16px;
          text-align: center;
          border: 1px solid var(--card-border);
        }
        .stat-card-v2.success {
          background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
          border-color: rgba(16, 185, 129, 0.2);
        }
        .stat-card-v2.primary {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02));
          border-color: rgba(99, 102, 241, 0.2);
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .stat-card-v2.success .stat-value { color: var(--success); }
        .stat-card-v2.primary .stat-value { color: var(--accent); }
        .stat-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .v6-action-btn:active, .ai-card-v2:active {
          transform: scale(0.96);
          transition: transform 0.1s ease;
        }
      `}} />
    </div>
  );
}