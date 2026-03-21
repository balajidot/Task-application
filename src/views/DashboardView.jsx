// DashboardView.jsx — Adaptive AI System
// Architecture: trust-first, user-controlled, long-term supportive
// 7 evolutionary upgrades — not a redesign
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { todayKey, goalVisibleOn, isDoneOn, timeToMinutes } from '../utils/helpers';

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
export default function DashboardView({
  appLanguage, userName, setActiveView,
  done, total, pct, weekly, streakDays, dueSoon, goals,
  liveCurrentGoal, liveClockLabel, liveCountdown,
  isOffline,
  onAddTask, onPlanDay, onAutoSchedule, onStartFocus, onSkipTask,
}) {
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
  const undoTimer = React.useRef(null);

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

  // Remaining time
  const remainingLabel = useMemo(() => {
    if (liveCountdown != null) {
      const mins = Math.max(0, Math.round(liveCountdown / 60000));
      if (mins === 0) return ta ? 'கிட்டத்தட்ட முடிந்தது' : 'ending now';
      if (mins < 60) return ta ? `${mins} நிமிடம் மீதம்` : `${mins} min left`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return ta ? `${h}h ${m}m மீதம்` : `${h}h ${m}m left`;
    }
    if (liveCurrentGoal?.endTime) {
      const diff = Math.max(0, timeToMinutes(liveCurrentGoal.endTime) - nowMinsNow);
      if (diff === 0) return ta ? 'கிட்டத்தட்ட முடிந்தது' : 'ending now';
      if (diff < 60) return ta ? `${diff} நிமிடம் மீதம்` : `${diff} min left`;
      const h = Math.floor(diff / 60), m = diff % 60;
      return ta ? `${h}h ${m}m மீதம்` : `${h}h ${m}m left`;
    }
    return null;
  }, [liveCountdown, liveCurrentGoal, ta, nowMinsNow]);

  // ── FIX 5: Metrics — only in smart mode or high energy ─────
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
      // FIX 4: metric action — tied to weekly insight
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

  // ── FIX 5: Microcopy — toned down, supportive not pressuring ─
  const microcopy = useMemo(() => {
    if (!smart && energyMode !== 'high') return null; // simple mode = no microcopy
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

  // Pulsing dot
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (screenState !== 'in-progress') return;
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, [screenState]);

  // ── Style atoms ─────────────────────────────────────────────
  const card = { background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 13 };
  const chip = { background: 'var(--chip)', border: '1px solid var(--card-border)', borderRadius: 8 };
  const BP = (extra = {}) => ({
    width: '100%', padding: '14px', color: '#fff', border: 'none', borderRadius: 11,
    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'opacity 0.15s', WebkitTapHighlightColor: 'transparent',
    background: 'var(--accent)', ...extra,
  });
  const BS = (extra = {}) => ({
    padding: '10px 13px', background: 'var(--card)', color: 'var(--text)',
    border: '1px solid var(--card-border)', borderRadius: 10,
    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    WebkitTapHighlightColor: 'transparent', ...extra,
  });
  const GHOST = {
    background: 'none', border: 'none', padding: '3px 0',
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
    color: 'var(--muted)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  };

  const showMetrics = energyConfig.metricShow && (smart || energyMode === 'high');

  return (
    <div style={{ fontFamily: 'var(--font-body)', paddingBottom: 8 }}>

      {/* ── Offline ─────────────────────────────────────────── */}
      {isOffline && (
        <div style={{
          background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid rgba(245,158,11,0.12)',
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 12 }}>📵</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>
            {ta ? 'Offline — AI features இல்லை' : 'Offline — tasks still work'}
          </span>
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 3 }}>
            {new Date().toLocaleDateString(ta ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.1px' }}>
            {screenState === 'empty' && energyConfig.emptyMsg}
            {screenState === 'complete' && (ta ? '✓ முடிந்தது' : '✓ All done')}
            {screenState === 'paused' && (ta ? '⏸ நிறுத்தப்பட்டது' : '⏸ Paused')}
            {screenState === 'in-progress' && (ta ? `${doneCount}/${totalCount} — focused` : `${doneCount} of ${totalCount} — focused`)}
            {screenState === 'ready' && (ta ? `${doneCount}/${totalCount} முடிந்தது` : `${doneCount} of ${totalCount} done`)}
          </div>
          {microcopy && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontWeight: 500, fontStyle: 'italic' }}>
              {microcopy}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {totalCount > 0 && (
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, lineHeight: 1,
              color: pct >= 70 ? '#22C55E' : pct >= 40 ? 'var(--accent)' : 'var(--muted)'
            }}>
              {pct}%
            </div>
          )}
          {/* FIX 2: 'AI on/off' — immediately clear what it does */}
          <button onClick={toggleMode}
            style={{
              fontSize: 9, fontWeight: 700,
              color: smart ? 'var(--accent)' : 'var(--muted)',
              background: smart ? 'rgba(87,155,252,0.08)' : 'var(--chip)',
              border: `1px solid ${smart ? 'rgba(87,155,252,0.2)' : 'var(--card-border)'}`,
              borderRadius: 12, padding: '4px 9px', cursor: 'pointer',
              fontFamily: 'var(--font-body)', letterSpacing: '0.3px',
              WebkitTapHighlightColor: 'transparent'
            }}>
            {smart ? '✦ AI on' : '○ AI off'}
          </button>
        </div>
      </div>

      {totalCount > 0 && (
        <div style={{ height: 2, background: 'var(--card-border)', margin: '0 14px 12px', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width 0.8s ease',
            background: pct >= 70 ? '#22C55E' : 'var(--accent)'
          }} />
        </div>
      )}

      {/* ── FIX 3: Energy mode picker — shown only when not set ─ */}
      {/* FIX 1: Energy picker — minimal chips, non-blocking, optional */}
      {!energyMode && totalCount > 0 && screenState === 'ready' && (
        <div style={{ margin: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, flexShrink: 0, opacity: 0.8 }}>
            {ta ? 'இன்று:' : 'Today:'}
          </span>
          {['low', 'high'].map(m => (
            <button key={m} onClick={() => setEnergy(m)}
              style={{
                ...GHOST, fontSize: 11, color: 'var(--muted)', padding: '3px 9px',
                border: '1px solid var(--card-border)', borderRadius: 20
              }}>
              {m === 'low' ? '😴' : '⚡'} {m === 'low' ? (ta ? 'Low' : 'Low') : (ta ? 'High' : 'High')}
            </button>
          ))}
          <button onClick={() => setEnergy('normal')} style={{ marginLeft: 'auto', ...GHOST, fontSize: 10, opacity: 0.5 }}>✕</button>
        </div>
      )}
      {energyMode === 'low' && (
        <div style={{
          margin: '0 14px 10px', padding: '9px 13px', background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.1)', borderRadius: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
              😴 {ta ? 'Low energy — 3 tasks today' : 'Low energy — 3 tasks today'}
            </span>
            {/* FIX 5: undo energy mode change */}
            <button onClick={() => { const prev = energyMode; setEnergy('normal'); pushUndo('energy', { prev }, ta ? 'Energy mode changed' : 'Energy mode changed'); }}
              style={{ ...GHOST, fontSize: 10 }}>{ta ? 'மாற்று' : 'Change'}</button>
          </div>
          {/* FIX 4: Stagnation nudge after 3+ consecutive low days */}
          {intel.lowStreak?.count >= 3 && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
              {ta
                ? `${intel.lowStreak.count} நாட்களாக low energy. ஒரு small task try பண்ணலாமா?`
                : `${intel.lowStreak.count} low-energy days. Even one small task helps.`}
            </div>
          )}
        </div>
      )}

      {/* ── FIX 6: Overload — supportive framing, not alarming ── */}
      {isOverloaded && !focusTop3 && (
        <div style={{
          margin: '0 14px 11px', ...card, padding: '11px 14px',
          borderLeft: '3px solid var(--accent)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            {ta ? `${allPending.length} tasks — ${intel.avgCapacity}/day உங்கள் usual`
              : `${allPending.length} tasks — your usual pace is about ${intel.avgCapacity}/day`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 9, fontWeight: 500 }}>
            {ta ? 'Top 3-ல் focus பண்ணலாம், அல்லது எல்லாம் வைக்கலாம்.'
              : 'Focus on top 3, or keep everything — your call.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setFocusTop3(true); pushUndo('focus3', {}, ta ? 'Top 3 mode' : 'Focus mode on'); }}
              style={BS({ flex: 1, justifyContent: 'center', fontSize: 12 })}>
              {ta ? 'Top 3 மட்டும்' : 'Focus on 3'}
            </button>
            <button onClick={() => { }} style={{ ...GHOST, flex: 1, textAlign: 'center' }}>
              {ta ? 'எல்லாம் வேண்டும்' : 'Keep all'}
            </button>
          </div>
        </div>
      )}

      {focusTop3 && (
        <div style={{
          margin: '0 14px 11px', padding: '8px 13px',
          background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
          borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
            {ta ? 'Top 3 tasks — focused mode' : 'Showing top 3 — focused mode'}
          </span>
          <button onClick={() => setFocusTop3(false)} style={{ ...GHOST, fontSize: 10 }}>
            {ta ? 'எல்லாம் பார்' : 'Show all'}
          </button>
        </div>
      )}

      {/* ══ MAIN CARD ════════════════════════════════════════════ */}
      <div style={{ margin: '0 14px 12px' }}>

        {/* EMPTY */}
        {screenState === 'empty' && (
          <div style={{ ...card, padding: '18px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginBottom: 14, lineHeight: 1.55 }}>
              {energyConfig.emptyMsg}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => onAddTask?.()} style={BP({ fontSize: 13, padding: '12px 8px' })}>
                ＋ {ta ? 'சேர்' : 'Add Task'}
              </button>
              <button onClick={() => !isOffline && onAutoSchedule?.()}
                style={BP({
                  background: 'var(--card)', color: isOffline ? 'var(--muted)' : 'var(--text)',
                  border: '1px solid var(--card-border)', fontSize: 13, padding: '12px 8px',
                  opacity: isOffline ? 0.4 : 1, cursor: isOffline ? 'not-allowed' : 'pointer'
                })}>
                🤖 {ta ? 'AI திட்டம்' : 'AI Plan'}{isOffline ? ' ✕' : ''}
              </button>
            </div>
          </div>
        )}

        {/* IN-PROGRESS */}
        {screenState === 'in-progress' && (
          <div style={{ ...card, padding: '14px 16px', borderLeft: '3px solid #22C55E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0,
                opacity: pulse ? 1 : 0.4, transition: 'opacity 0.6s ease'
              }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: '#22C55E', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                {ta ? 'நடக்கிறது' : 'IN PROGRESS'}
              </div>
              {remainingLabel && (
                <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--text)', ...chip, padding: '3px 10px' }}>
                  {remainingLabel}
                </div>
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12, lineHeight: 1.3 }}>
              {liveCurrentGoal?.text}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <button onClick={() => setActiveView('tasks')} style={BP({ background: '#22C55E', fontSize: 14 })}>
                ✓ {ta ? 'முடிந்தது — தொடர்' : 'Done — next'}
              </button>
              <button onClick={handlePause} style={BS({ justifyContent: 'center' })}>
                ⏸ {ta ? 'Pause' : 'Pause'}
              </button>
            </div>
          </div>
        )}

        {/* PAUSED — FIX 3: time-aware, softened */}
        {screenState === 'paused' && (
          <div style={{
            ...card, padding: '14px 16px',
            borderLeft: `3px solid ${pauseContext?.urgency ? '#EF4444' : '#F59E0B'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase',
                color: pauseContext?.urgency ? '#EF4444' : '#F59E0B'
              }}>
                ⏸ {ta ? 'PAUSE' : 'PAUSED'}
              </div>
              {pauseContext && (
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', ...chip, padding: '3px 9px' }}>
                  {pauseContext.label}
                </div>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6, lineHeight: 1.3 }}>
              {nextTask?.text || liveCurrentGoal?.text}
            </div>
            {/* FIX 6: urgency softened — informative not alarming */}
            {pauseContext?.urgency && (
              <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginBottom: 9 }}>
                {pauseContext.urgency}
              </div>
            )}
            {!pauseContext?.urgency && remainingLabel && (
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 9 }}>
                {ta ? `${remainingLabel} மீதம்` : `${remainingLabel} remaining`}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <button onClick={handleResume}
                style={BP({ background: pauseContext?.urgency ? '#F59E0B' : 'var(--accent)', fontSize: 14 })}>
                ▶ {ta ? 'தொடர்' : 'Resume'}
              </button>
              <button onClick={() => { handleResume(); setActiveView('tasks'); }} style={BS({ justifyContent: 'center' })}>
                {ta ? 'Tasks' : 'Tasks'}
              </button>
            </div>
          </div>
        )}

        {/* READY — FIX 1 transparent reason + FIX 6 soft skip */}
        {screenState === 'ready' && nextTask && (
          <div style={{
            ...card, padding: '14px 16px',
            borderLeft: nextIsOverdue ? '3px solid #EF4444' : '1px solid var(--card-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase',
                color: nextIsOverdue ? '#EF4444' : 'var(--accent)'
              }}>
                {nextIsOverdue ? (ta ? 'தாமதம்' : 'OVERDUE') : (ta ? 'அடுத்தது' : 'NEXT UP')}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', ...chip, padding: '3px 9px' }}>
                {doneCount + 1} / {totalCount}
              </div>
            </div>

            {/* FIX 1: System explanation — only in smart mode, only when meaningful */}
            {nextReason && (
              <div style={{
                fontSize: 10, color: 'var(--muted)', fontStyle: 'italic',
                fontWeight: 500, marginBottom: 6, lineHeight: 1.4
              }}>
                {nextReason}
              </div>
            )}

            {nextTask.startTime && (
              <div style={{
                fontSize: 11, fontWeight: 600, marginBottom: 4,
                color: nextIsOverdue ? '#EF4444' : 'var(--muted)'
              }}>
                {nextTask.startTime}{nextTask.endTime ? ` – ${nextTask.endTime}` : ''}
              </div>
            )}

            <div style={{
              fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14,
              lineHeight: 1.3, letterSpacing: '-0.2px'
            }}>
              {nextTask.text}
            </div>

            <button onClick={() => { setActiveView('tasks'); onStartFocus?.(); }}
              style={BP({
                background: nextIsOverdue ? '#EF4444' : 'var(--accent)', marginBottom: 10,
                fontSize: 15
              })}>
              ▶ {energyConfig.ctaLabel}
            </button>

            {/* FIX 6: Skip — no consequence pressure, just next task preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <button onClick={handleSkip} style={GHOST}>{ta ? 'छोड़ें →' : 'Skip →'}</button>
                <button onClick={() => setActiveView('tasks')} style={GHOST}>{ta ? 'வேற task' : 'Pick another'}</button>
              </div>
              {skipConsequence && (
                <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  {skipConsequence}
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {screenState === 'complete' && completionSummary && (
          <div style={{ ...card, padding: '18px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                {ta ? `${completionSummary.count} tasks` : `${completionSummary.count} tasks done`}
                {completionSummary.effort && (
                  <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 13 }}>{' · '}{completionSummary.effort}</span>
                )}
              </div>
              {streakDays >= 2 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>
                  🔥 {ta ? `${streakDays} நாள்` : `${streakDays} days`}
                </div>
              )}
              {microcopy && (
                <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>
                  {microcopy}
                </div>
              )}
            </div>
            <button onClick={() => !isOffline && onAutoSchedule?.()}
              style={BP({ fontSize: 14, opacity: isOffline ? 0.5 : 1 })}>
              {ta ? 'நாளை திட்டமிடு' : 'Plan Tomorrow'}
            </button>
          </div>
        )}
      </div>

      {/* ── TASK PREVIEW ──────────────────────────────────────── */}
      {preview.length > 0 && screenState !== 'complete' && screenState !== 'empty' && (
        <div style={{ margin: '0 14px 12px' }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            {preview.map(g => {
              const urg = g.startTime ? (timeToMinutes(g.startTime) - nowMinsNow < 0 ? 'overdue' : timeToMinutes(g.startTime) - nowMinsNow <= 30 ? 'soon' : null) : null;
              const isActive = g.id === liveCurrentGoal?.id;
              return (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderBottom: '1px solid var(--card-border)',
                  background: isActive ? 'rgba(34,197,94,0.04)' : 'transparent'
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: urg === 'overdue' ? '#EF4444' : urg === 'soon' ? '#F59E0B' : 'var(--muted)',
                    opacity: urg ? 1 : 0.4
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{g.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {g.startTime ? `${g.startTime}${g.endTime ? ` – ${g.endTime}` : ''}` : ''}
                    </div>
                  </div>
                  {urg === 'overdue' && <div style={{ fontSize: 9, fontWeight: 800, color: '#EF4444', flexShrink: 0 }}>LATE</div>}
                  {urg === 'soon' && <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', flexShrink: 0 }}>SOON</div>}
                </div>
              );
            })}
            <button onClick={() => setActiveView('tasks')}
              style={{
                width: '100%', padding: '11px 14px', background: 'var(--chip)', border: 'none',
                color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{pending.length} {ta ? 'மீதம்' : 'remaining'}</span>
              <span>{ta ? 'View all →' : 'View all →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SECONDARY ACTIONS ─────────────────────────────────── */}
      {screenState !== 'empty' && screenState !== 'complete' && (
        <div style={{ margin: '0 14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={() => onAddTask?.()} style={BS()}>
            ＋ {ta ? 'Task சேர்' : 'Add Task'}
          </button>
          <button onClick={() => !isOffline && onPlanDay?.()}
            style={BS({ opacity: isOffline ? 0.4 : 1, cursor: isOffline ? 'not-allowed' : 'pointer' })}>
            🤖 {ta ? 'AI திட்டம்' : 'AI Schedule'}
          </button>
        </div>
      )}

      {/* ── FIX 4: Weekly insight — surfaced passively, dismissible */}
      {smart && weeklyInsight && (() => {
        // FIX 6: mark seen for this week
        const wk = (() => { const d = new Date(), j = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-W${Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7)}`; })();
        const sm = localStore.get(KEYS.insightShown) || {};
        if (!sm[wk]) localStore.set(KEYS.insightShown, { ...sm, [wk]: true });
        return true;
      })() && (
          <div style={{
            margin: '0 14px 12px', ...card, padding: '12px 14px',
            borderLeft: `3px solid ${weeklyInsight.tone === 'positive' ? '#22C55E' : 'var(--accent)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>
                {weeklyInsight.title}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, marginBottom: weeklyInsight.action ? 8 : 0 }}>
              {weeklyInsight.body}
            </div>
            {weeklyInsight.action && (
              <button onClick={weeklyInsight.action.tap}
                style={{
                  padding: '6px 12px', background: 'var(--chip)', border: '1px solid var(--card-border)',
                  borderRadius: 7, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 4
                }}>
                {weeklyInsight.action.label}
              </button>
            )}
          </div>
        )}

      {/* ── FIX 5: METRICS — hidden in low energy + simple mode ── */}
      {showMetrics && totalCount >= 0 && (
        <div style={{ margin: '0 14px 8px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            {
              v: `${metrics.rate}%`, l: ta ? 'வார முடிவு' : 'Week rate',
              c: metrics.rateColor, tap: () => setActiveView('analytics'), action: metrics.rateAction,
            },
            {
              v: metrics.avgPerDay || '—', l: ta ? 'நாள் சராசரி' : 'Avg / day',
              c: 'var(--text)', tap: () => setActiveView('analytics'), action: null,
            },
            {
              v: metrics.overdue > 0 ? `${metrics.overdue}` : '—',
              l: ta ? 'தாமதம்' : 'Overdue', c: metrics.overdueColor,
              tap: metrics.overdue > 0 ? () => setActiveView('tasks') : undefined,
              action: metrics.overdueAction,
            },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: '10px 6px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: s.c, lineHeight: 1 }}>
                {s.v}
              </div>
              <div style={{
                fontSize: 9, color: 'var(--muted)', fontWeight: 700, marginTop: 4,
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>{s.l}</div>
              {s.action ? (
                <button onClick={s.action.tap}
                  style={{
                    marginTop: 5, padding: '3px 8px', background: 'rgba(99,102,241,0.08)',
                    color: 'var(--accent)', border: 'none', borderRadius: 6, fontSize: 9,
                    fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>
                  {s.action.label}
                </button>
              ) : s.tap ? (
                <button onClick={s.tap}
                  style={{
                    marginTop: 5, padding: '3px 8px', background: 'transparent', color: 'var(--muted)',
                    border: 'none', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>
                  {ta ? 'பார்' : 'View →'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* FIX 1: Transparency footer — only in smart mode, only when learning */}
      {/* FIX 3: Transparency — one plain sentence, no numbers or jargon */}
      {smart && intel.dataAge >= 10 && (
        <div style={{
          margin: '0 14px 10px', padding: '7px 11px',
          borderRadius: 9, border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0, opacity: 0.6 }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>
            {ta
              ? (intel.peakHour !== null ? `${intel.peakHour}:00 உங்கள் most productive hour.` : 'உங்கள் patterns கற்றுக்கொள்கிறது.')
              : (intel.peakHour !== null ? `${intel.peakHour}:00 is your most productive hour.` : 'Still learning your patterns.')}
          </div>
          {isOffline && <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Local</div>}
        </div>
      )}
      {/* FIX 7: Undo toast — 5s, any major action */}
      {undoVisible && undoStack.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 'calc(80px + var(--safe-bottom,0px))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card)', border: '1px solid var(--card-border)',
          borderRadius: 20, padding: '8px 14px 8px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 999,
          fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            {undoStack[undoStack.length - 1]?.label}
          </span>
          <button onClick={popUndo}
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>
            Undo
          </button>
        </div>
      )}

      {/* FIX 8: Product identity — quiet, only on empty/complete */}
      {(screenState === 'empty' || screenState === 'complete') && (
        <div style={{ padding: '2px 14px 10px', textAlign: 'center' }}>
          <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 500, opacity: 0.45, letterSpacing: '0.5px' }}>
            Task Planner · AI productivity system
          </span>
        </div>
      )}
    </div>
  );
}