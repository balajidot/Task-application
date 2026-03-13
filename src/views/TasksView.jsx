import React, { useEffect, useMemo, useRef, useState } from 'react';
import SwipeableTaskCard from '../components/SwipeableTaskCard';
import TaskProgressIndicator from '../components/TaskProgressIndicator';
import EnhancedFocusMode from '../components/EnhancedFocusMode';
import TaskCompletionCelebration from '../components/TaskCompletionCelebration';
import DailyProductivityScore from '../components/DailyProductivityScore';
import { PRIORITY_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES } from '../utils/constants';
import { todayKey, toKey } from '../utils/helpers';

export default function TasksView({
  activeDate, setActiveDate, activeDateLabel, weekBase, setWeekBase,
  liveClockLabel, done, total, pct, nextUpcomingGoal, setForm, setEditingGoal, setShowForm,
  liveCurrentGoal, liveCountdown, focusMode, setFocusMode,
  showCelebration, setShowCelebration, liveHighlightEnabled, aiBriefing, openAiPlanner, goals, dotsFor,
  priorityFilter, setPriorityFilter, timeFilter, setTimeFilter,
  searchTerm, setSearchTerm, searchRef,
  pendingGoals, completedGoals, visibleGoals, selectedGoalIds, selectedSet,
  selectAllVisibleGoals, deleteSelectedGoals, clearSelectedGoals,
  completedPulseId, celebratingGoalId, toggleDoneWithCelebration, removeGoal, toggleSelectGoal,
  markAllPendingDone, duplicatePendingToTomorrow, reopenAllCompleted
}) {
  const [completedTasksCollapsed, setCompletedTasksCollapsed] = useState(false);
  const [liveStripVisible, setLiveStripVisible] = useState(true);
  const [stripSwipeX, setStripSwipeX] = useState(0);
  const [actionTask, setActionTask] = useState(null);

  const stripStartX = useRef(0);
  const longPressTimer = useRef(null);

  const sevenDays = useMemo(() => {
    const base = new Date(weekBase);
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [weekBase]);

  useEffect(() => {
    setLiveStripVisible(true);
  }, [liveCurrentGoal?.id]);

  useEffect(() => {
    if (!liveHighlightEnabled || !liveCurrentGoal?.id || activeDate !== todayKey()) return;
    const timer = window.setTimeout(() => {
      const element = document.querySelector(`[data-task-id="${liveCurrentGoal.id}"]`);
      element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeDate, liveCurrentGoal, liveHighlightEnabled]);

  const handleStripTouchStart = (event) => {
    stripStartX.current = event.touches[0].clientX;
  };

  const handleStripTouchMove = (event) => {
    setStripSwipeX(event.touches[0].clientX - stripStartX.current);
  };

  const handleStripTouchEnd = () => {
    if (Math.abs(stripSwipeX) > 80) setLiveStripVisible(false);
    else setStripSwipeX(0);
  };

  const startLongPress = (goal) => {
    longPressTimer.current = setTimeout(() => {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      setActionTask(goal);
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const renderTaskItem = (goal, idx, isCompleted) => (
    <div
      key={goal.id}
      data-task-id={goal.id}
      style={{
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '16px',
        transform: liveCurrentGoal?.id === goal.id ? 'scale(1.01)' : 'none',
        boxShadow: liveCurrentGoal?.id === goal.id ? '0 0 0 2px rgba(16,185,129,0.45), 0 18px 38px rgba(16,185,129,0.18)' : 'none',
        transition: 'transform 0.2s ease',
      }}
      onTouchStart={() => startLongPress(goal)}
      onTouchMove={clearLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onMouseDown={() => startLongPress(goal)}
      onMouseMove={clearLongPress}
      onMouseUp={clearLongPress}
      onMouseLeave={clearLongPress}
    >
      <SwipeableTaskCard
        goal={goal}
        idx={idx}
        doneHere={isCompleted}
        pulse={completedPulseId === goal.id}
        celebrate={celebratingGoalId === goal.id}
        liveNow={liveCurrentGoal?.id === goal.id}
        countdownText={liveCurrentGoal?.id === goal.id ? liveCountdown : null}
        selected={selectedSet.has(goal.id)}
        activeDate={activeDate}
        onToggleDone={() => toggleDoneWithCelebration(goal)}
        onEdit={() => {
          setEditingGoal(goal.id);
          setForm({
            text: goal.text,
            date: goal.date,
            reminder: goal.reminder || '',
            startTime: goal.startTime || '',
            endTime: goal.endTime || '',
            repeat: goal.repeat || 'None',
            session: goal.session || 'Morning',
            priority: goal.priority || 'Medium',
          });
          setShowForm(true);
        }}
        onDelete={() => removeGoal(goal.id)}
        onToggleSelect={() => toggleSelectGoal(goal.id)}
      />
    </div>
  );

  return (
    <div className="view-transition tasks-shell" style={{ animation: 'smoothFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both', position: 'relative' }}>
      {actionTask && (
        <div className="overlay" onClick={() => setActionTask(null)} style={{ zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ width: '90%', maxWidth: '380px', padding: '24px', textAlign: 'center', borderRadius: '20px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text)' }}>
              Task Actions
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{actionTask.text}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="new-btn" style={{ background: 'var(--chip)', color: 'var(--text)', border: '1px solid var(--card-border)', boxShadow: 'none' }} onClick={() => {
                setEditingGoal(actionTask.id);
                setForm({
                  text: actionTask.text,
                  date: actionTask.date,
                  reminder: actionTask.reminder,
                  startTime: actionTask.startTime,
                  endTime: actionTask.endTime,
                  repeat: actionTask.repeat,
                  session: actionTask.session,
                  priority: actionTask.priority,
                });
                setShowForm(true);
                setActionTask(null);
              }}>
                Edit Task
              </button>

              <button className="new-btn" style={{ background: 'var(--chip)', color: 'var(--text)', border: '1px solid var(--card-border)', boxShadow: 'none' }} onClick={() => {
                toggleSelectGoal(actionTask.id);
                setActionTask(null);
              }}>
                {selectedSet.has(actionTask.id) ? 'Deselect Task' : 'Select Task'}
              </button>

              <button className="new-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'none' }} onClick={() => {
                removeGoal(actionTask.id);
                setActionTask(null);
              }}>
                Delete Task
              </button>

              <button className="new-btn" style={{ background: 'transparent', color: 'var(--muted)', marginTop: '4px', boxShadow: 'none' }} onClick={() => setActionTask(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title" style={{ transition: 'all 0.3s ease' }}>{activeDateLabel}</div>
            <div className="tip">{liveClockLabel} • {done} of {total} completed</div>
          </div>
          <div className="head-actions">
            <button
              className="hero-btn"
              onClick={() => setFocusMode(true)}
              style={{
                background: liveCurrentGoal ? 'linear-gradient(135deg,#10b981,#059669)' : 'var(--chip)',
                color: liveCurrentGoal ? '#fff' : 'var(--muted)',
                border: liveCurrentGoal ? 'none' : '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={liveCurrentGoal ? 'Enter Focus Mode for current task' : 'No active task right now'}
            >
              Focus
            </button>
            <button className="new-btn" onClick={() => {
              setForm({ text: '', date: activeDate, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium' });
              setEditingGoal(null);
              setShowForm(true);
            }}>
              New Task
            </button>
            <button className="hero-btn" onClick={openAiPlanner}>
              AI Plan
            </button>
          </div>
        </div>
      </div>

      <div className="card tasks-panel" style={{ marginTop: 12 }}>
        <div className="tasks-panel-head">
          <div className="focus-title">AI Coach</div>
          <div className="task-summary-chip">
            <span>Live Mode</span>
            <strong>{liveHighlightEnabled ? 'On' : 'Off'}</strong>
          </div>
        </div>
        <div className="ai-briefing-grid">
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Focus</div>
            <div className="ai-briefing-text">{aiBriefing.headline}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Risk</div>
            <div className="ai-briefing-text">{aiBriefing.risk}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Suggestion</div>
            <div className="ai-briefing-text">{aiBriefing.suggestion}</div>
          </div>
        </div>
        {activeDate !== todayKey() && liveCurrentGoal && (
          <button className="tool-btn" style={{ marginTop: 14 }} onClick={() => setActiveDate(todayKey())}>
            Jump to live task
          </button>
        )}
      </div>

      {liveCurrentGoal && liveStripVisible && (
        <div
          className="live-strip enhanced-live-strip"
          style={{ transform: `translateX(${stripSwipeX}px)`, opacity: 1 - (Math.abs(stripSwipeX) / 150), transition: stripSwipeX === 0 ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' : 'none', position: 'relative', touchAction: 'pan-y' }}
          onTouchStart={handleStripTouchStart}
          onTouchMove={handleStripTouchMove}
          onTouchEnd={handleStripTouchEnd}
        >
          <button onClick={() => setLiveStripVisible(false)} style={{ position: 'absolute', top: '8px', right: '12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '16px', padding: '4px', cursor: 'pointer', zIndex: 10 }}>×</button>
          <div>
            <div className="tag">CURRENT TASK</div>
            <div className="task">{liveCurrentGoal.text}</div>
            {liveCurrentGoal.startTime && liveCurrentGoal.endTime && (
              <TaskProgressIndicator
                startTime={liveCurrentGoal.startTime}
                endTime={liveCurrentGoal.endTime}
                currentTime={new Date().toTimeString().slice(0, 5)}
                variant="premium"
                taskText={liveCurrentGoal.text}
                timeText={`${liveCurrentGoal.startTime} - ${liveCurrentGoal.endTime || '--:--'}`}
                upNextText={nextUpcomingGoal?.text || ''}
                upNextTime={nextUpcomingGoal?.startTime || ''}
                dayDone={done}
                dayTotal={total}
                dayPct={pct}
              />
            )}
          </div>
          <div className="clock">{liveClockLabel}</div>
          <div className="countdown">{liveCountdown}</div>
        </div>
      )}

      {focusMode && <EnhancedFocusMode task={liveCurrentGoal} isActive={focusMode} onExit={() => setFocusMode(false)} />}
      <TaskCompletionCelebration isActive={showCelebration} onComplete={() => setShowCelebration(false)} />
      <DailyProductivityScore goals={goals} todayKey={todayKey()} />

      <div className="card tasks-panel">
        <div className="cal-header">
          <div className="cal-month" style={{ transition: 'all 0.3s ease' }}>{new Date(weekBase).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          <div className="cal-actions">
            <button className="cal-btn" onClick={() => { const nextWeek = new Date(weekBase); nextWeek.setDate(nextWeek.getDate() - 7); setWeekBase(nextWeek); }}>◀</button>
            <button className="today-btn" onClick={() => { setWeekBase(new Date()); setActiveDate(todayKey()); }}>Today</button>
            <button className="cal-btn" onClick={() => { const nextWeek = new Date(weekBase); nextWeek.setDate(nextWeek.getDate() + 7); setWeekBase(nextWeek); }}>▶</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', paddingBottom: '4px' }}>
          {sevenDays.map((day) => {
            const dots = dotsFor(toKey(day));
            const isToday = toKey(day) === todayKey();
            const isSelected = toKey(day) === activeDate;

            return (
              <div
                key={day.toISOString()}
                onClick={() => setActiveDate(toKey(day))}
                style={{
                  backgroundColor: isSelected ? 'var(--accent,#3b82f6)' : isToday ? 'rgba(59,130,246,0.1)' : 'var(--chip)',
                  border: isSelected ? '2px solid var(--accent,#3b82f6)' : isToday ? '1.5px solid rgba(59,130,246,0.45)' : '1.5px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '7px 2px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.18s ease',
                  minWidth: 0,
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.03em', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}>
                  {DAY_NAMES[day.getDay()].substring(0, 3)}
                </div>
                <div style={{
                  width: '26px',
                  height: '26px',
                  fontSize: '13px',
                  fontWeight: isToday || isSelected ? 900 : 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: isToday && !isSelected ? '50%' : '6px',
                  background: isToday && !isSelected ? '#3b82f6' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? '#fff' : 'var(--text)',
                }}>
                  {day.getDate()}
                </div>
                <div style={{ display: 'flex', gap: '2px', height: '5px', alignItems: 'center' }}>
                  {dots.done > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : '#10b981' }} />}
                  {dots.pending > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.6)' : '#f59e0b' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card tasks-panel">
        <div className="tasks-panel-head">
          <div className="tasks-filter-stack">
            <div className="focus-title">Today's Tasks</div>
            <div className="filters">
              <button className={`filter-btn ${priorityFilter === 'All' ? 'active' : ''}`} onClick={() => setPriorityFilter('All')}>All</button>
              {PRIORITY_OPTIONS.map((priority) => (
                <button key={priority} className={`filter-btn ${priorityFilter === priority ? 'active' : ''}`} onClick={() => setPriorityFilter(priority)}>
                  {priority}
                </button>
              ))}
              <button className={`filter-btn ${timeFilter === 'All Times' ? 'active' : ''}`} onClick={() => setTimeFilter('All Times')}>All Times</button>
              {TIME_FILTER_OPTIONS.slice(1).map((filter) => (
                <button key={filter} className={`filter-btn ${timeFilter === filter ? 'active' : ''}`} onClick={() => setTimeFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="task-summary-chip">
            <span>Focused Today</span>
            <strong>{total}</strong>
          </div>
        </div>

        <input ref={searchRef} type="text" className="search-input" placeholder="Search tasks..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />

        <div className="pending-tasks-section tasks-section">
          <div className="section-head"><div className="section-title-sm">Pending Tasks ({pendingGoals.length})</div></div>
          {pendingGoals.length === 0 ? (
            <div className="empty">{searchTerm ? 'No pending tasks found matching your search.' : 'No pending tasks for today. Great job!'}</div>
          ) : (
            <>
              {selectedGoalIds.length > 0 && (
                <div className="quick-tools compact">
                  <button className="tool-btn" onClick={selectAllVisibleGoals}>Select All ({visibleGoals.length})</button>
                  <button className="tool-btn warn" onClick={deleteSelectedGoals}>Delete Selected ({selectedGoalIds.length})</button>
                  <button className="tool-btn" onClick={clearSelectedGoals}>Clear Selection</button>
                </div>
              )}

              <div className="goal-list tasks-list" key={`pending-${activeDate}`} style={{ animation: 'smoothFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                {pendingGoals.map((goal, idx) => renderTaskItem(goal, idx, false))}
              </div>

              <div className="quick-tools compact">
                <button className="tool-btn" onClick={markAllPendingDone}>Mark All Done ({pendingGoals.length})</button>
                <button className="tool-btn" onClick={duplicatePendingToTomorrow}>Copy to Tomorrow ({pendingGoals.length})</button>
              </div>
            </>
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="completed-tasks-section compact" style={{ position: 'relative', transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
            <div className="section-head completed-tasks-head cursor-pointer" onClick={() => setCompletedTasksCollapsed(!completedTasksCollapsed)} style={{ userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title-sm" style={{ color: 'rgba(110, 231, 183, 0.95)' }}>Completed Tasks ({completedGoals.length})</div>
              <div className="collapse-icon" style={{ fontSize: '14px', color: 'rgba(22, 163, 74, 0.7)', transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)', transform: completedTasksCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▼</div>
            </div>

            {!completedTasksCollapsed && (
              <div className="goal-list tasks-list" key={`completed-${activeDate}`} style={{ opacity: '0.8', animation: 'smoothFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                {completedGoals.map((goal, idx) => renderTaskItem(goal, idx + pendingGoals.length, true))}
                <div className="quick-tools compact" style={{ paddingTop: '10px', borderTop: '1px solid rgba(34, 197, 94, 0.15)' }}>
                  <button className="tool-btn" onClick={reopenAllCompleted}>Reopen All ({completedGoals.length})</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
