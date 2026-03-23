// DashboardView.jsx — Connected to AppContext
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { todayKey, goalVisibleOn, isDoneOn, timeToMinutes } from '../utils/helpers';

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORE_VERSION = 'v4';
const KEYS = {
  behavior: `tp_behavior_${STORE_VERSION}`,
  session: `tp_session_${STORE_VERSION}`,
  mode: `tp_mode_${STORE_VERSION}`,
  weekly: `tp_weekly_${STORE_VERSION}`,
  insightShown: `tp_insight_${STORE_VERSION}`,
};

const localStore = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
  merge: (key, patch) => { localStore.set(key, { ...(localStore.get(key) || {}), ...patch }); },
};

// ─── Behavior Tracking ────────────────────────────────────────────────────────
function readBehavior() { return localStore.get(KEYS.behavior) || {}; }
function recordCompletion() {
  const b = readBehavior();
  localStore.merge(KEYS.behavior, {
    completionHours: [...(b.completionHours || []).slice(-99), new Date().getHours()],
    totalCompleted: (b.totalCompleted || 0) + 1,
  });
}
function recordSkip(taskKey) {
  const b = readBehavior(); const sc = b.skipCounts || {};
  localStore.merge(KEYS.behavior, { skipCounts: { ...sc, [taskKey]: (sc[taskKey] || 0) + 1 } });
}
function recordPause(mins) {
  const b = readBehavior();
  localStore.merge(KEYS.behavior, { pauseDurations: [...(b.pauseDurations || []).slice(-19), mins] });
}
function recordWeeklySnapshot(weekPct, weekDone, weekTotal) {
  const history = localStore.get(KEYS.weekly) || [];
  const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekStr = `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
  if (!history.find(h => h.week === weekStr)) {
    localStore.set(KEYS.weekly, [...history.slice(-11), { week: weekStr, pct: weekPct, done: weekDone, total: weekTotal }]);
  }
}

// ─── Intelligence ─────────────────────────────────────────────────────────────
function computeIntelligence(goals, behavior) {
  const nowHour = new Date().getHours();
  const nowMins = nowHour * 60 + new Date().getMinutes();
  const hours = behavior.completionHours || [];
  let peakHour = null, isPeakNow = false;
  if (hours.length >= 10) {
    const buckets = Array(24).fill(0);
    hours.forEach(h => { if (h >= 0 && h < 24) buckets[h]++; });
    const max = Math.max(...buckets);
    const avg = hours.length / 24;
    peakHour = buckets.indexOf(max);
    isPeakNow = max > avg * 1.3 && Math.abs(nowHour - peakHour) <= 1;
  }
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i - 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const vis = (goals || []).filter(g => goalVisibleOn(g, k));
    return { done: vis.filter(g => isDoneOn(g, k)).length, total: vis.length };
  });
  const activeDays = last14.filter(d => d.done > 0);
  const avgCapacity = activeDays.length >= 5
    ? Math.round(activeDays.reduce((a, b) => a + b.done, 0) / activeDays.length) : null;
  const pauseList = behavior.pauseDurations || [];
  const avgPause = pauseList.length >= 3
    ? Math.round(pauseList.reduce((a, b) => a + b, 0) / pauseList.length) : null;
  const weeklyHistory = localStore.get(KEYS.weekly) || [];
  const trend = weeklyHistory.length >= 3 ? (() => {
    const recent = weeklyHistory.slice(-3).map(w => w.pct);
    const delta = recent[recent.length - 1] - recent[0];
    return delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable';
  })() : null;
  return { peakHour, isPeakNow, avgCapacity, skipCounts: behavior.skipCounts || {}, avgPause, trend, weeklyHistory, dataAge: hours.length };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardView() {
  // ✅ FIX: Connected to AppContext — no more missing props!
  const app = useApp();
  const {
    appLanguage, userName, setActiveView,
    done, total, pct, weekly, streakDays, dueSoon,
    goals = [],
    liveCurrentGoal,
    isOffline,
    onAddTask, onPlanDay, onAutoSchedule, onStartFocus,
    aiBriefing,
    pendingGoals,
    completedGoals,
    activeDate,
  } = app;

  const ta = appLanguage === 'ta';
  const today = todayKey();

  // ─── AI Mode ──────────────────────────────────────────────────────────────
  const [aiMode, setAiMode] = useState(() => localStore.get(KEYS.mode)?.aiMode ?? 'smart');
  const toggleMode = useCallback(() => {
    const next = aiMode === 'smart' ? 'simple' : 'smart';
    setAiMode(next);
    localStore.merge(KEYS.mode, { aiMode: next });
  }, [aiMode]);
  const smart = aiMode === 'smart';

  // ─── Energy Mode ──────────────────────────────────────────────────────────
  const [energyMode, setEnergyMode] = useState(() => {
    const stored = localStore.get(KEYS.session);
    return stored?.energyDate === today ? stored.energyMode : null;
  });
  const setEnergy = useCallback(mode => {
    setEnergyMode(mode);
    localStore.merge(KEYS.session, { energyMode: mode, energyDate: today });
  }, [today]);

  // ─── Session State ────────────────────────────────────────────────────────
  const sess = localStore.get(KEYS.session) || {};
  const [paused, setPaused] = useState(sess.paused ?? false);
  const [pausedAt, setPausedAt] = useState(sess.pausedAt ?? null);
  const [skipped, setSkipped] = useState(sess.skippedDate === today ? (sess.skipped || []) : []);
  const [focusTop3, setFocusTop3] = useState(sess.focusDate === today ? (sess.focusTop3 || false) : false);
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
  }, [paused, pausedAt, skipped, today, focusTop3]);

  // ─── Intelligence ─────────────────────────────────────────────────────────
  const [intel, setIntel] = useState(() => computeIntelligence(goals, readBehavior()));
  useEffect(() => { setIntel(computeIntelligence(goals, readBehavior())); }, [goals]);
  useEffect(() => { if (done > 0) recordCompletion(); }, [done]);
  useEffect(() => {
    if (weekly?.weekPct != null) recordWeeklySnapshot(weekly.weekPct, weekly.weekDone, weekly.weekTotal);
  }, []); // eslint-disable-line

  // ─── Task Data ────────────────────────────────────────────────────────────
  const nowMins = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const todayGoals = useMemo(() =>
    (goals || []).filter(g => goalVisibleOn(g, today)), [goals, today]);

  const allPending = useMemo(() => {
    return todayGoals.filter(g => !isDoneOn(g, today)).sort((a, b) => {
      const aS = timeToMinutes(a.startTime || '');
      const bS = timeToMinutes(b.startTime || '');
      const aLate = aS && aS < nowMins - 5;
      const bLate = bS && bS < nowMins - 5;
      if (aLate && !bLate) return -1;
      if (!aLate && bLate) return 1;
      if (aS && bS) return aS - bS;
      if (aS) return -1; if (bS) return 1;
      const rank = { High: 0, Medium: 1, Low: 2 };
      return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
    });
  }, [todayGoals, today, nowMins]);

  const pending = useMemo(() => {
    const base = allPending.filter(g => !skipped.includes(g.id));
    const cap = (focusTop3 || energyMode === 'low') ? 3 : Infinity;
    return base.slice(0, cap);
  }, [allPending, skipped, focusTop3, energyMode]);

  const nextTask = pending[0] || null;
  const doneCount = todayGoals.filter(g => isDoneOn(g, today)).length;
  const totalCount = todayGoals.length;
  const nextIsOverdue = nextTask?.startTime ? timeToMinutes(nextTask.startTime) < nowMins - 5 : false;
  const isOverloaded = smart && intel.avgCapacity !== null && allPending.length > intel.avgCapacity * 1.5 && allPending.length >= 6;

  // ─── Screen State ─────────────────────────────────────────────────────────
  const screenState = useMemo(() => {
    if (totalCount === 0) return 'empty';
    if (doneCount === totalCount) return 'complete';
    if (paused) return 'paused';
    if (liveCurrentGoal) return 'in-progress';
    if (nextTask) return 'ready';
    return 'empty';
  }, [totalCount, doneCount, paused, liveCurrentGoal, nextTask]);

  // ─── Microcopy ────────────────────────────────────────────────────────────
  const microcopy = useMemo(() => {
    if (!smart && energyMode !== 'high') return null;
    if (energyMode === 'low') return ta ? 'இன்று மெதுவாக போகலாம்.' : 'A slower day is still a day.';
    if (doneCount === 1 && totalCount > 2) return ta ? 'முதல் task முடிந்தது.' : 'First one done.';
    if (totalCount > 0 && doneCount === Math.floor(totalCount / 2)) return ta ? 'பாதி முடிந்தது.' : 'Halfway there.';
    if (doneCount === totalCount - 1 && totalCount > 1) return ta ? 'கடைசி ஒன்று மட்டும்.' : 'One left.';
    if (streakDays >= 5 && doneCount === totalCount) return ta ? `${streakDays} நாள் தொடர்.` : `${streakDays} days in a row.`;
    return null;
  }, [smart, energyMode, doneCount, totalCount, streakDays, ta]);

  // ─── Next Task Reason ────────────────────────────────────────────────────
  const nextReason = useMemo(() => {
    if (!nextTask || !smart) return null;
    if (nextIsOverdue) {
      const lateMins = Math.round(nowMins - timeToMinutes(nextTask.startTime));
      return ta ? `${lateMins} நிமிடம் கடந்துவிட்டது` : `${lateMins} min past start time`;
    }
    const taskKey = nextTask.text.slice(0, 20).toLowerCase().replace(/\s/g, '_');
    const skipCnt = intel.skipCounts?.[taskKey] || 0;
    if (skipCnt >= 2) return ta ? 'இதை சில முறை தள்ளிப்போட்டீர்கள்' : "You've deferred this a few times";
    if (intel.isPeakNow && intel.dataAge >= 10) return ta ? 'இது உங்கள் productive நேரம்' : 'This tends to be a productive hour for you';
    if (nextTask.startTime) {
      const diff = timeToMinutes(nextTask.startTime) - nowMins;
      if (diff <= 5) return ta ? 'இப்போது தொடங்க வேண்டியது' : 'Starting now';
      if (diff <= 20) return ta ? `${diff} நிமிடத்தில் தொடங்கும்` : `Starts in ${diff} min`;
      return ta ? `${nextTask.startTime} க்கு scheduled` : `Scheduled for ${nextTask.startTime}`;
    }
    if (nextTask.priority === 'High') return ta ? 'High priority' : 'High priority';
    return null;
  }, [nextTask, nextIsOverdue, intel, ta, nowMins, smart]);

  // ─── Metrics ─────────────────────────────────────────────────────────────
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
    };
  }, [weekly, dueSoon]);

  // ─── Weekly Insight ───────────────────────────────────────────────────────
  const weeklyInsight = useMemo(() => {
    const h = intel.weeklyHistory;
    if (!h || h.length < 3) return null;
    const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekKey = `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
    const shownMap = localStore.get(KEYS.insightShown) || {};
    if (shownMap[weekKey]) return null;
    const recent = h.slice(-4);
    const avg = Math.round(recent.reduce((a, b) => a + b.pct, 0) / recent.length);
    const last = recent[recent.length - 1]?.pct ?? 0;
    const prev = recent[recent.length - 2]?.pct ?? 0;
    if (intel.trend === 'up') return { title: ta ? `${avg}% — nalla trend` : `${avg}% avg — trending up`, body: ta ? 'இந்த வேகம் தொடர்ந்தால் மாதாந்திர இலக்கு எட்டலாம்' : 'Keep this pace and your monthly goal is reachable', tone: 'positive', action: null };
    if (intel.trend === 'down' && last - prev < -10) return { title: ta ? 'வாரம் குறைந்து வருகிறது' : 'Completion dropping', body: ta ? 'Schedule பார்க்கலாம்' : "Let's review your schedule", tone: 'neutral', action: { label: ta ? 'Schedule பார்' : 'Review', tap: () => setActiveView('planner') } };
    if (avg >= 75) return { title: ta ? `${avg}% — consistent` : `${avg}% consistency`, body: ta ? 'நல்ல rhythm கிடைத்திருக்கிறது' : "You've found a good rhythm", tone: 'positive', action: null };
    return null;
  }, [intel, ta]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (screenState !== 'in-progress') return;
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, [screenState]);

  const handleSkip = useCallback(() => {
    if (!nextTask) return;
    const taskKey = nextTask.text.slice(0, 20).toLowerCase().replace(/\s/g, '_');
    recordSkip(taskKey);
    setSkipped(prev => [...prev, nextTask.id]);
    setIntel(computeIntelligence(goals, readBehavior()));
    pushUndo('skip', { id: nextTask.id }, ta ? 'Skipped' : `Skipped "${nextTask.text.slice(0, 22)}"`);
  }, [nextTask, goals, pushUndo, ta]);

  const handlePause = useCallback(() => {
    setPaused(true); setPausedAt(Date.now());
    pushUndo('pause', {}, ta ? 'Paused' : 'Session paused');
  }, [pushUndo, ta]);

  const handleResume = useCallback(() => {
    if (pausedAt) { const mins = Math.round((Date.now() - pausedAt) / 60000); if (mins > 0) recordPause(mins); }
    setPaused(false); setPausedAt(null);
  }, [pausedAt]);

  const showMetrics = smart || energyMode === 'high';
  const greetHour = new Date().getHours();
  const greetEmoji = greetHour < 12 ? '🌅' : greetHour < 17 ? '☀️' : greetHour < 21 ? '🌆' : '🌙';
  const greetWord = ta
    ? (greetHour < 12 ? 'காலை வணக்கம்' : greetHour < 17 ? 'மதிய வணக்கம்' : 'மாலை வணக்கம்')
    : (greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening');

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-view">

      {/* Offline Banner */}
      {isOffline && (
        <div className="dashboard-offline">
          <span>📵</span>
          <span>{ta ? 'Offline — AI features இல்லை' : 'Offline — tasks still work'}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-date">
            {new Date().toLocaleDateString(ta ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <div className="dashboard-greeting">
            {greetEmoji} {greetWord}{userName ? `, ${userName}` : ''}!
          </div>
          <div className="dashboard-status">
            {screenState === 'empty' && (ta ? '📋 இன்று பணிகள் இல்லை' : '📋 No tasks yet today')}
            {screenState === 'complete' && (ta ? '✅ எல்லாமே முடிந்தது!' : '✅ All done today!')}
            {screenState === 'paused' && (ta ? '⏸ நிறுத்தப்பட்டது' : '⏸ Session paused')}
            {screenState === 'in-progress' && (ta ? `${doneCount}/${totalCount} — கவனத்தில்` : `${doneCount} of ${totalCount} — focused`)}
            {screenState === 'ready' && (ta ? `${doneCount}/${totalCount} முடிந்தது` : `${doneCount} of ${totalCount} done`)}
          </div>
          {microcopy && <div className="dashboard-microcopy">{microcopy}</div>}
        </div>
        <div className="dashboard-header-right">
          {totalCount > 0 && (
            <div className="dashboard-pct" style={{ color: pct >= 70 ? '#22C55E' : pct >= 40 ? 'var(--accent)' : 'var(--muted)' }}>
              {pct}%
            </div>
          )}
          <button className={`dashboard-ai-toggle ${smart ? 'active' : ''}`} onClick={toggleMode}>
            {smart ? '✦ AI on' : '○ AI off'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="dashboard-progress-track">
          <div className="dashboard-progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? '#22C55E' : 'var(--accent)' }} />
        </div>
      )}

      {/* ── Energy Mode Picker ── */}
      {!energyMode && totalCount > 0 && screenState === 'ready' && (
        <div className="dashboard-energy-row">
          <span className="dashboard-energy-label">{ta ? 'இன்று:' : 'Today:'}</span>
          {['low', 'high'].map(m => (
            <button key={m} className="dashboard-energy-chip" onClick={() => setEnergy(m)}>
              {m === 'low' ? (ta ? '😴 சோர்வு' : '😴 Low') : (ta ? '⚡ சக்தி' : '⚡ High')}
            </button>
          ))}
        </div>
      )}

      {/* ── LIVE / NEXT TASK CARD ── */}
      {(screenState === 'in-progress' || screenState === 'ready' || screenState === 'paused') && nextTask && (
        <div className={`dashboard-task-card${nextIsOverdue ? ' overdue' : ''}`}>

          {/* Task label */}
          <div className="dashboard-task-label">
            {screenState === 'in-progress'
              ? (ta ? '🔴 இப்போது' : '🔴 NOW')
              : nextIsOverdue
                ? (ta ? '⚠️ தாமதம்' : '⚠️ OVERDUE')
                : (ta ? '▶ அடுத்தது' : '▶ NEXT')}
            {nextReason && <span className="dashboard-task-reason">{nextReason}</span>}
          </div>

          {/* Task text */}
          <div className="dashboard-task-text">{nextTask.text}</div>

          {/* Time */}
          {nextTask.startTime && (
            <div className="dashboard-task-time">
              🕐 {nextTask.startTime}{nextTask.endTime ? ` – ${nextTask.endTime}` : ''}
            </div>
          )}

          {/* Priority chip */}
          {nextTask.priority && nextTask.priority !== 'Medium' && (
            <span className={`p-badge p-${nextTask.priority.toLowerCase()}`}>{nextTask.priority}</span>
          )}

          {/* Actions */}
          <div className="dashboard-task-actions">
            {screenState === 'paused' ? (
              <button className="new-btn" onClick={handleResume}>
                ▶ {ta ? 'தொடர்' : 'Resume'}
              </button>
            ) : (
              <>
                <button className="new-btn" onClick={() => { onStartFocus?.(); }}>
                  🎯 {ta ? 'கவனம்' : 'Focus'}
                </button>
                <button className="new-btn dashboard-task-done-btn"
                  onClick={() => { setActiveView('tasks'); }}>
                  ✅ {ta ? 'முடித்தது' : 'Done'}
                </button>
              </>
            )}
          </div>

          {/* Skip / Pause */}
          {screenState !== 'paused' && (
            <div className="dashboard-task-ghost-row">
              <button className="dashboard-ghost-btn" onClick={handleSkip}>
                {ta ? 'தள்ளிப்போடு' : 'Skip for now'}
              </button>
              <button className="dashboard-ghost-btn" onClick={handlePause}>
                {ta ? 'நிறுத்து' : 'Pause session'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── COMPLETE STATE ── */}
      {screenState === 'complete' && (
        <div className="dashboard-complete-card">
          <div className="dashboard-complete-emoji">🎉</div>
          <div className="dashboard-complete-title">
            {ta ? 'அனைத்தும் முடிந்தது!' : 'All tasks done!'}
          </div>
          <div className="dashboard-complete-sub">
            {ta ? `${totalCount} பணிகள் முடிந்தன` : `${totalCount} tasks completed today`}
            {streakDays > 0 && ` · ${streakDays} ${ta ? 'நாள் தொடர்' : 'day streak'} 🔥`}
          </div>
          <button className="new-btn" onClick={() => setActiveView('analytics')}>
            📊 {ta ? 'பகுப்பாய்வு பார்' : 'View Analytics'}
          </button>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {screenState === 'empty' && (
        <div className="empty-state dashboard-empty">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">{ta ? 'இன்று பணிகள் இல்லை' : 'No tasks for today'}</div>
          <div className="empty-state-sub">{ta ? 'புதிய பணி சேர்க்கவும்' : 'Add your first task to get started'}</div>
          <button className="empty-state-btn" onClick={() => onAddTask?.()}>
            + {ta ? 'Task சேர்' : 'Add Task'}
          </button>
        </div>
      )}

      {/* ── TASK PREVIEW LIST ── */}
      {pending.length > 1 && (
        <div className="card dashboard-preview-card">
          <div className="dashboard-preview-header">
            <span className="section-title-sm">
              {ta ? '📋 இன்றைய பணிகள்' : '📋 Today\'s Tasks'}
            </span>
            <span className="count">{pending.length}</span>
          </div>
          {pending.slice(1, 4).map(g => {
            const urg = g.endTime && timeToMinutes(g.endTime) < nowMins ? 'overdue'
              : g.startTime && timeToMinutes(g.startTime) - nowMins <= 30 ? 'soon' : null;
            return (
              <div key={g.id} className={`dashboard-preview-item${g.id === liveCurrentGoal?.id ? ' active' : ''}`}
                onClick={() => setActiveView('tasks')}>
                <div className={`dashboard-preview-dot${urg === 'overdue' ? ' overdue' : urg === 'soon' ? ' soon' : ''}`} />
                <div className="dashboard-preview-text">{g.text}</div>
                {g.startTime && <div className="dashboard-preview-time">{g.startTime}</div>}
                {urg === 'overdue' && <span className="dashboard-badge-late">LATE</span>}
                {urg === 'soon' && <span className="dashboard-badge-soon">SOON</span>}
              </div>
            );
          })}
          <button className="dashboard-preview-footer" onClick={() => setActiveView('tasks')}>
            <span className="dashboard-preview-remaining">{pending.length} {ta ? 'மீதம்' : 'remaining'}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {ta ? 'எல்லாம் பார் →' : 'View all →'}
            </span>
          </button>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      {screenState !== 'empty' && screenState !== 'complete' && (
        <div className="dashboard-quick-actions">
          <button className="dashboard-quick-btn" onClick={() => onAddTask?.()}>
            ＋ {ta ? 'Task சேர்' : 'Add Task'}
          </button>
          <button
            className="dashboard-quick-btn"
            onClick={() => !isOffline && onPlanDay?.()}
            disabled={isOffline}
          >
            🤖 {ta ? 'AI திட்டம்' : 'AI Schedule'}
          </button>
        </div>
      )}

      {/* ── METRICS ── */}
      {showMetrics && totalCount > 0 && (
        <div className="dashboard-metrics-row">
          {[
            { v: `${metrics.rate}%`, l: ta ? 'வார முடிவு' : 'Week rate', c: metrics.rateColor, tap: () => setActiveView('analytics') },
            { v: metrics.avgPerDay || '—', l: ta ? 'நாள் சராசரி' : 'Avg/day', c: 'var(--text)', tap: () => setActiveView('analytics') },
            { v: metrics.overdue > 0 ? `${metrics.overdue}` : '✓', l: ta ? 'தாமதம்' : 'Overdue', c: metrics.overdueColor, tap: metrics.overdue > 0 ? () => setActiveView('tasks') : undefined },
          ].map((s, i) => (
            <div key={i} className="dashboard-metric-card" onClick={s.tap}>
              <div className="dashboard-metric-num" style={{ color: s.c }}>{s.v}</div>
              <div className="dashboard-metric-label">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI BRIEFING ── */}
      {smart && aiBriefing && (
        <div className="card dashboard-briefing-card">
          <div className="section-title-sm" style={{ marginBottom: 10 }}>
            🧠 {ta ? 'AI பகுப்பாய்வு' : 'AI Briefing'}
          </div>
          <div className="ai-briefing-grid">
            <div className="ai-briefing-card">
              <div className="ai-briefing-label">{ta ? 'கவனம்' : 'Focus'}</div>
              <div className="ai-briefing-text">{aiBriefing.headline}</div>
            </div>
            {aiBriefing.risk && (
              <div className="ai-briefing-card">
                <div className="ai-briefing-label">{ta ? 'ஆபத்து' : 'Risk'}</div>
                <div className="ai-briefing-text">{aiBriefing.risk}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WEEKLY INSIGHT ── */}
      {smart && weeklyInsight && (
        <div className="card dashboard-insight-card" style={{ borderLeft: `3px solid ${weeklyInsight.tone === 'positive' ? '#22C55E' : 'var(--accent)'}` }}>
          <div className="dashboard-insight-title">{weeklyInsight.title}</div>
          <div className="dashboard-insight-body">{weeklyInsight.body}</div>
          {weeklyInsight.action && (
            <button className="dashboard-insight-action" onClick={weeklyInsight.action.tap}>
              {weeklyInsight.action.label}
            </button>
          )}
        </div>
      )}

      {/* ── STREAK ── */}
      {streakDays >= 2 && (
        <div className="card dashboard-streak-card">
          <div className="dashboard-streak-num">🔥 {streakDays}</div>
          <div className="dashboard-streak-label">{ta ? 'நாள் தொடர்ச்சி' : 'day streak'}</div>
        </div>
      )}

      {/* ── AI TRANSPARENCY ── */}
      {smart && intel.dataAge >= 10 && (
        <div className="dashboard-transparency">
          <div className="dashboard-transparency-dot" />
          <div className="dashboard-transparency-text">
            {ta
              ? (intel.peakHour !== null ? `${intel.peakHour}:00 உங்கள் productive hour.` : 'உங்கள் patterns கற்றுக்கொள்கிறது.')
              : (intel.peakHour !== null ? `${intel.peakHour}:00 is your most productive hour.` : 'Still learning your patterns.')}
          </div>
        </div>
      )}

      {/* ── UNDO TOAST ── */}
      {undoVisible && undoStack.length > 0 && (
        <div className="dashboard-undo-toast">
          <span className="dashboard-undo-label">{undoStack[undoStack.length - 1]?.label}</span>
          <button className="dashboard-undo-btn" onClick={popUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}