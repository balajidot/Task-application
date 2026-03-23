import React from 'react';
import SwipeableTaskCard from '../components/SwipeableTaskCard';
import TaskProgressIndicator from '../components/TaskProgressIndicator';
import TaskCompletionCelebration from '../components/TaskCompletionCelebration';
import DailyProductivityScore from '../components/DailyProductivityScore';
import { PRIORITY_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES } from '../utils/constants';
import { todayKey, toKey } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { useTaskForm } from '../context/TaskFormContext';
import { LiveClock, LiveCountdown } from '../components/LiveTimeComponents';

export default function TasksView() {
  const appBase = useApp();
  const formState = useTaskForm();
  const app = { ...appBase, ...formState };
  const {
    activeDate, setActiveDate, activeDateLabel, weekBase, setWeekBase,
    done, total, pct, nextUpcomingGoal, setForm, setEditingGoal, setShowForm,
    liveCurrentGoal, focusMode, setFocusMode,
    showCelebration, setShowCelebration, liveHighlightEnabled, aiBriefing, copy,
    goals, dotsFor,
    priorityFilter, setPriorityFilter, timeFilter, setTimeFilter,
    searchTerm, setSearchTerm, searchRef,
    pendingGoals, completedGoals, visibleGoals,
    selectedGoalIds, selectedSet, selectAllVisibleGoals,
    deleteSelectedGoals, clearSelectedGoals,
    completedPulseId, celebratingGoalId, toggleDoneWithCelebration,
    removeGoal, toggleSelectGoal,
    markAllPendingDone, duplicatePendingToTomorrow, reopenAllCompleted,
    overdueEnabled, appLanguage, onOptimizeSchedule,
    handleDecomposeTask, toggleSubtask
  } = app;

  const [completedCollapsed, setCompletedCollapsed] = React.useState(false);
  const [liveStripVisible,   setLiveStripVisible]   = React.useState(true);
  const [stripSwipeX,        setStripSwipeX]        = React.useState(0);
  const [actionTask,         setActionTask]         = React.useState(null);

  const stripStartX    = React.useRef(0);
  const longPressTimer = React.useRef(null);

  // Seven-day calendar
  const sevenDays = React.useMemo(() => {
    const base = new Date(weekBase);
    const day  = base.getDay();
    const mon  = new Date(base);
    mon.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [weekBase]);

  React.useEffect(() => { setLiveStripVisible(true); }, [liveCurrentGoal?.id]);

  // Strip swipe
  const handleStripTouchStart = (e) => { stripStartX.current = e.touches[0].clientX; };
  const handleStripTouchMove  = (e) => { setStripSwipeX(e.touches[0].clientX - stripStartX.current); };
  const handleStripTouchEnd   = () => {
    if (Math.abs(stripSwipeX) > 80) setLiveStripVisible(false);
    else setStripSwipeX(0);
  };

  // Long press
  const startLongPress = (e, goal) => {
    longPressTimer.current = setTimeout(() => {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      toggleSelectGoal(goal.id);
    }, 450);
  };
  const clearLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // Render single task item
  const renderTaskItem = (goal, idx, isCompleted) => (
    <div
      key={goal.id}
      className={`task-item-wrap${liveCurrentGoal?.id === goal.id ? ' task-item-live' : ''}`}
      onTouchStart={e => startLongPress(e, goal)}
      onTouchMove={clearLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onMouseDown={e => startLongPress(e, goal)}
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
        selected={selectedSet.has(goal.id)}
        activeDate={activeDate}
        overdueEnabled={overdueEnabled}
        onToggleDone={() => toggleDoneWithCelebration(goal)}
        onEdit={() => {
          setEditingGoal(goal.id);
          setForm({
            text:      goal.text,
            date:      goal.date,
            reminder:  goal.reminder  || '',
            startTime: goal.startTime || '',
            endTime:   goal.endTime   || '',
            repeat:    goal.repeat    || 'None',
            session:   goal.session   || 'Morning',
            priority:  goal.priority  || 'Medium',
          });
          setShowForm(true);
        }}
        onDelete={() => removeGoal(goal.id)}
        onToggleSelect={() => toggleSelectGoal(goal.id)}
        onToggleSubtask={subIdx => toggleSubtask(goal.id, subIdx)}
      />
    </div>
  );

  return (
    <div className="view-transition tasks-shell">

      {/* ── Celebration ── */}
      {showCelebration && (
        <TaskCompletionCelebration onComplete={() => setShowCelebration(false)} />
      )}

      {/* ── Live Strip ── */}
      {liveCurrentGoal && liveStripVisible && liveHighlightEnabled && (
        <div
          className="live-strip enhanced-live-strip"
          style={{ transform: `translateX(${stripSwipeX}px)`, opacity: Math.max(0, 1 - Math.abs(stripSwipeX) / 200) }}
          onTouchStart={handleStripTouchStart}
          onTouchMove={handleStripTouchMove}
          onTouchEnd={handleStripTouchEnd}
        >
          <div className="live-task-main">
            <div className="task-info">
              <div className="tag">🔴 LIVE NOW</div>
              <div className="task">{liveCurrentGoal.text}</div>
              {liveCurrentGoal.session && (
                <div className="session-badge">{liveCurrentGoal.session}</div>
              )}
            </div>
            <div className="clock">
              <LiveClock />
              {liveCurrentGoal.endTime && (
                <LiveCountdown endTime={liveCurrentGoal.endTime} />
              )}
            </div>
          </div>
          {nextUpcomingGoal && (
            <div className="up-next-banner">
              <span className="up-next-icon">⏭</span>
              <span className="up-next-label">Up next:</span>
              <span className="up-next-text">
                <span>{nextUpcomingGoal.startTime}</span> — {nextUpcomingGoal.text}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Progress ── */}
      <TaskProgressIndicator done={done} total={total} pct={pct} />

      {/* ── AI Briefing ── */}
      {aiBriefing && (
        <div className="card tasks-briefing-card">
          <div className="ai-briefing-grid">
            <div className="ai-briefing-card">
              <div className="ai-briefing-label">🧠 Focus</div>
              <div className="ai-briefing-text">{aiBriefing.headline}</div>
            </div>
            <div className="ai-briefing-card">
              <div className="ai-briefing-label">⚠️ Risk</div>
              <div className="ai-briefing-text">{aiBriefing.risk}</div>
            </div>
            <div className="ai-briefing-card" style={{ gridColumn: '1 / -1' }}>
              <div className="ai-briefing-label">💡 Suggestion</div>
              <div className="ai-briefing-text">{aiBriefing.suggestion}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Productivity Score ── */}
      <DailyProductivityScore
        goals={goals || []}
        todayKey={activeDate}
      />

      {/* ── Tasks Panel ── */}
      <div className="card tasks-panel">

        {/* Week Calendar */}
        <div className="tasks-week-cal">
          <div className="week-cal-header">
            <button className="cal-btn" onClick={() => {
              const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d);
            }}>‹</button>
            <span className="cal-month">
              {sevenDays[0] && new Date(sevenDays[0]).toLocaleDateString(
                appLanguage === 'ta' ? 'ta-IN' : 'en-IN',
                { month: 'short', year: 'numeric' }
              )}
            </span>
            <button className="cal-btn" onClick={() => {
              const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d);
            }}>›</button>
            <button className="today-btn" onClick={() => {
              setActiveDate(todayKey()); setWeekBase(new Date());
            }}>Today</button>
          </div>

          <div className="week-grid">
            {sevenDays.map(date => {
              const key     = toKey(date);
              const isToday = key === todayKey();
              const isSel   = key === activeDate;
              const dots    = dotsFor(key);
              const dname   = DAY_NAMES?.[date.getDay()] || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
              return (
                <div key={key} className="day-cell" onClick={() => setActiveDate(key)}>
                  <div className="day-box">
                    <div className="d-name">{dname?.slice(0, 3)}</div>
                    <div className={`d-num${isToday ? ' is-today' : ''}${isSel ? ' is-sel' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="d-dots">
                      {dots.done    > 0 && <span className="dot done" />}
                      {dots.pending > 0 && <span className="dot pending" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Label */}
        <div className="tasks-date-label">
          <span className="section-title-sm">{activeDateLabel}</span>
          <span className="count">{total} tasks</span>
        </div>

        {/* Filters */}
        <div className="tasks-filters no-scrollbar">
          <button className={`filter-btn ${priorityFilter === 'All' ? 'active' : ''}`}
            onClick={() => setPriorityFilter('All')}>All</button>
          {PRIORITY_OPTIONS.map(p => (
            <button key={p} className={`filter-btn ${priorityFilter === p ? 'active' : ''}`}
              onClick={() => setPriorityFilter(p)}>
              {p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} {p}
            </button>
          ))}
          <div className="filter-divider" />
          {TIME_FILTER_OPTIONS.map(f => (
            <button key={f} className={`filter-btn ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}>{f}</button>
          ))}
        </div>

        {/* Search */}
        <div className="tasks-search-wrap">
          <span className="tasks-search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            className="search-input tasks-search-input"
            placeholder={copy.tasksView?.searchPlaceholder || 'Search tasks...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="tasks-search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        {/* Bulk actions */}
        {selectedGoalIds.length > 0 && (
          <div className="quick-tools compact tasks-bulk-actions">
            <button className="tool-btn" onClick={selectAllVisibleGoals}>
              Select All ({visibleGoals.length})
            </button>
            <button className="tool-btn warn" onClick={deleteSelectedGoals}>
              Delete ({selectedGoalIds.length})
            </button>
            <button className="tool-btn" onClick={clearSelectedGoals}>Clear</button>
          </div>
        )}

        {/* Pending Tasks */}
        <div className="tasks-section">
          <div className="section-head">
            <div className="section-title-sm">
              📋 {copy.tasksView?.pendingTasks || 'Pending'} ({pendingGoals.length})
            </div>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">
                {searchTerm
                  ? (copy.tasksView?.noPendingSearch || 'No results')
                  : (copy.tasksView?.noPending || 'All done!')}
              </div>
              {!searchTerm && (
                <div className="empty-state-sub">Add a new task to get started</div>
              )}
              {!searchTerm && (
                <button className="empty-state-btn" onClick={() => {
                  setForm({ text: '', date: activeDate, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium' });
                  setEditingGoal(null);
                  setShowForm(true);
                }}>+ Add Task</button>
              )}
            </div>
          ) : (
            <div className="goal-list tasks-list">
              {pendingGoals.map((goal, idx) => renderTaskItem(goal, idx, false))}

              {/* Ghost add card */}
              <div
                className="task-ghost-add"
                onClick={() => {
                  setForm({ text: '', date: activeDate, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium' });
                  setEditingGoal(null);
                  setShowForm(true);
                }}
              >
                <span className="task-ghost-icon">+</span>
                <span className="task-ghost-label">
                  {copy.tasksView?.newTask || 'Add new task'}
                </span>
              </div>
            </div>
          )}

          {/* Quick tools */}
          {pendingGoals.length > 0 && (
            <div className="quick-tools compact">
              <button className="tool-btn" onClick={markAllPendingDone}>
                ✅ {copy.tasksView?.markAllDone || 'Mark All Done'}
              </button>
              <button className="tool-btn" onClick={duplicatePendingToTomorrow}>
                📋 {copy.tasksView?.copyTomorrow || 'Copy to Tomorrow'}
              </button>
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedGoals.length > 0 && (
          <div className="tasks-completed-section">
            <div
              className="tasks-completed-head"
              onClick={() => setCompletedCollapsed(!completedCollapsed)}
            >
              <div className="section-title-sm tasks-completed-title">
                ✅ {copy.tasksView?.completedTasks || 'Completed'} ({completedGoals.length})
              </div>
              <div className={`tasks-collapse-icon${completedCollapsed ? '' : ' open'}`}>▼</div>
            </div>

            {!completedCollapsed && (
              <div className="goal-list tasks-list tasks-completed-list">
                {completedGoals.map((goal, idx) =>
                  renderTaskItem(goal, idx + pendingGoals.length, true)
                )}
                <div className="quick-tools compact">
                  <button className="tool-btn" onClick={reopenAllCompleted}>
                    🔄 {copy.tasksView?.reopenAll || 'Reopen All'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}