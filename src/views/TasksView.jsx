import React from 'react';
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
  showCelebration, setShowCelebration, liveHighlightEnabled, aiBriefing, copy, openAiPlanner, goals, dotsFor,
  priorityFilter, setPriorityFilter, timeFilter, setTimeFilter,
  searchTerm, setSearchTerm, searchRef,
  pendingGoals, completedGoals, visibleGoals, selectedGoalIds, selectedSet,
  selectAllVisibleGoals, deleteSelectedGoals, clearSelectedGoals,
  completedPulseId, celebratingGoalId, toggleDoneWithCelebration, removeGoal, toggleSelectGoal,
  markAllPendingDone, duplicatePendingToTomorrow, reopenAllCompleted
}) {
  const [completedTasksCollapsed, setCompletedTasksCollapsed] = React.useState(false);
  const [liveStripVisible, setLiveStripVisible] = React.useState(true);
  const [stripSwipeX, setStripSwipeX] = React.useState(0);
  const [actionTask, setActionTask] = React.useState(null);
  const [modalPos, setModalPos] = React.useState({ x: 0, y: 0 });

  const stripStartX = React.useRef(0);
  const longPressTimer = React.useRef(null);
  const touchCoords = React.useRef({ x: 0, y: 0 });

  const sevenDays = React.useMemo(() => {
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

  React.useEffect(() => {
    setLiveStripVisible(true);
  }, [liveCurrentGoal?.id]);

  React.useEffect(() => {
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

  const startLongPress = (event, goal) => {
    const touch = event.touches ? event.touches[0] : event;
    const coords = { x: touch.clientX, y: touch.clientY };
    touchCoords.current = coords;

    longPressTimer.current = setTimeout(() => {
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      setModalPos(coords);
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
        borderRadius: '18px',
        transform: liveCurrentGoal?.id === goal.id ? 'scale(1.02)' : 'none',
        transition: 'transform 0.4s cubic-bezier(0.2, 1, 0.2, 1)',
      }}
      onTouchStart={(e) => startLongPress(e, goal)}
      onTouchMove={clearLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onMouseDown={(e) => startLongPress(e, goal)}
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
    <div className="view-transition tasks-shell" style={{ animation: 'viewFadeIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both', position: 'relative' }}>
      {actionTask && (
        <div className="overlay" onClick={() => setActionTask(null)} style={{ zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ 
            width: '90%', 
            maxWidth: '340px', 
            padding: '20px', 
            textAlign: 'center', 
            borderRadius: '24px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'absolute',
            left: `${Math.min(window.innerWidth - 350, Math.max(10, modalPos.x - 170))}px`,
            top: `${Math.min(window.innerHeight - 400, Math.max(10, modalPos.y - 100))}px`,
            animation: 'modalSlideUp 0.3s cubic-bezier(0.2, 1, 0.2, 1)'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 1000, marginBottom: '6px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {copy.tasksView.taskActions}
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
                {copy.common.edit}
              </button>

              <button className="new-btn" style={{ background: 'var(--chip)', color: 'var(--text)', border: '1px solid var(--card-border)', boxShadow: 'none' }} onClick={() => {
                toggleSelectGoal(actionTask.id);
                setActionTask(null);
              }}>
                {selectedSet.has(actionTask.id) ? copy.tasksView.deselectTask : copy.tasksView.selectTask}
              </button>

              <button className="new-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'none' }} onClick={() => {
                removeGoal(actionTask.id);
                setActionTask(null);
              }}>
                {copy.common.delete}
              </button>

              <button className="new-btn" style={{ background: 'transparent', color: 'var(--muted)', marginTop: '4px', boxShadow: 'none' }} onClick={() => setActionTask(null)}>
                {copy.common.cancel}
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
              {copy.tasksView.focus}
            </button>
            <button className="new-btn" onClick={() => {
              setForm({ text: '', date: activeDate, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium' });
              setEditingGoal(null);
              setShowForm(true);
            }}>
              {copy.tasksView.newTask}
            </button>
            <button className="hero-btn" onClick={openAiPlanner}>
              {copy.tasksView.aiPlan}
            </button>
          </div>
        </div>
      </div>

      <div className="card tasks-panel" style={{ marginTop: 8 }}>
        <div className="tasks-panel-head">
          <div className="focus-title">{copy.tasksView.aiCoach}</div>
          <div className="task-summary-chip">
            <span>{copy.tasksView.liveMode}</span>
            <strong>{liveHighlightEnabled ? copy.common.on : copy.common.off}</strong>
          </div>
        </div>
        <div className="ai-briefing-grid-v6">
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Focus</div>
            <div className="ai-briefing-text" style={{ fontSize: '0.85rem' }}>{aiBriefing.headline}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Risk</div>
            <div className="ai-briefing-text" style={{ fontSize: '0.85rem' }}>{aiBriefing.risk}</div>
          </div>
          <div className="ai-briefing-card">
            <div className="ai-briefing-label">Suggestion</div>
            <div className="ai-briefing-text" style={{ fontSize: '0.85rem' }}>{aiBriefing.suggestion}</div>
          </div>
          <div className="ai-briefing-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <div className="ai-briefing-label" style={{ color: '#3b82f6' }}>Progress</div>
            <div className="ai-briefing-text" style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text)' }}>
              {pct}% <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.6 }}>Day Done</span>
            </div>
          </div>
        </div>
        {activeDate !== todayKey() && liveCurrentGoal && (
          <button className="tool-btn" style={{ marginTop: 14 }} onClick={() => setActiveDate(todayKey())}>
            {copy.tasksView.jumpToLive}
          </button>
        )}
      </div>

      {liveCurrentGoal && liveStripVisible && (
        <div
          className="live-strip enhanced-live-strip"
          style={{ transform: `translateX(${stripSwipeX}px)`, opacity: 1 - (Math.abs(stripSwipeX) / 150), transition: stripSwipeX === 0 ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' : 'none', position: 'relative', touchAction: 'pan-y', marginTop: '4px' }}
          onTouchStart={handleStripTouchStart}
          onTouchMove={handleStripTouchMove}
          onTouchEnd={handleStripTouchEnd}
        >
          <button onClick={() => setLiveStripVisible(false)} style={{ position: 'absolute', top: '8px', right: '12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '16px', padding: '4px', cursor: 'pointer', zIndex: 10 }}>×</button>
          <div>
            <div className="tag">{copy.tasksView.currentTask}</div>
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
            <button className="today-btn" onClick={() => { setWeekBase(new Date()); setActiveDate(todayKey()); }}>{copy.common.today}</button>
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
        <div className="tasks-panel-head" style={{ marginBottom: '16px', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="focus-title" style={{ margin: 0 }}>{copy.tasksView.todayTasks}</div>
            <div className="task-summary-chip-v6" style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{copy.tasksView.focusedToday}</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{total}</strong>
            </div>
          </div>
          
          <div className="filters-scroll-v6" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <button className={`filter-btn ${priorityFilter === 'All' ? 'active' : ''}`} onClick={() => setPriorityFilter('All')}>All</button>
            {PRIORITY_OPTIONS.map((priority) => (
              <button key={priority} className={`filter-btn ${priorityFilter === priority ? 'active' : ''}`} onClick={() => setPriorityFilter(priority)}>
                {priority}
              </button>
            ))}
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />
            <button className={`filter-btn ${timeFilter === 'All Times' ? 'active' : ''}`} onClick={() => setTimeFilter('All Times')}>All Times</button>
            {TIME_FILTER_OPTIONS.slice(1).map((filter) => (
              <button key={filter} className={`filter-btn ${timeFilter === filter ? 'active' : ''}`} onClick={() => setTimeFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              ref={searchRef} 
              type="text" 
              className="search-input-v6" 
              placeholder={copy.tasksView.searchPlaceholder} 
              value={searchTerm} 
              onChange={(event) => setSearchTerm(event.target.value)} 
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '12px 14px 12px 40px',
                color: 'var(--text)',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
          </div>
        </div>

        <div className="pending-tasks-section tasks-section">
          <div className="section-head"><div className="section-title-sm">{copy.tasksView.pendingTasks} ({pendingGoals.length})</div></div>
          {pendingGoals.length === 0 ? (
            <div className="empty">{searchTerm ? copy.tasksView.noPendingSearch : copy.tasksView.noPending}</div>
          ) : (
            <>
              {selectedGoalIds.length > 0 && (
                <div className="quick-tools compact">
                  <button className="tool-btn" onClick={selectAllVisibleGoals}>{copy.tasksView.selectAll} ({visibleGoals.length})</button>
                  <button className="tool-btn warn" onClick={deleteSelectedGoals}>{copy.tasksView.deleteSelected} ({selectedGoalIds.length})</button>
                  <button className="tool-btn" onClick={clearSelectedGoals}>{copy.tasksView.clearSelection}</button>
                </div>
              )}

              <div className="goal-list tasks-list" key={`pending-${activeDate}`} style={{ animation: 'viewFadeIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                {pendingGoals.map((goal, idx) => renderTaskItem(goal, idx, false))}
                
                {/* Ghost Card for New Task */}
                <div 
                  onClick={() => {
                    setForm({ text: '', date: activeDate, reminder: '', startTime: '', endTime: '', repeat: 'None', session: 'Morning', priority: 'Medium' });
                    setEditingGoal(null);
                    setShowForm(true);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '18px',
                    border: '2px dashed rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'all 0.2s'
                  }}
                  className="ghost-add-task-v2"
                >
                  <span style={{ fontSize: '20px', color: 'var(--muted)' }}>+</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.02em' }}>
                    {copy.tasksView.newTask}
                  </span>
                </div>
              </div>

              <div className="quick-tools compact">
                <button className="tool-btn" onClick={markAllPendingDone}>{copy.tasksView.markAllDone} ({pendingGoals.length})</button>
                <button className="tool-btn" onClick={duplicatePendingToTomorrow}>{copy.tasksView.copyTomorrow} ({pendingGoals.length})</button>
              </div>
            </>
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="completed-tasks-section compact" style={{ position: 'relative', transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
            <div className="section-head completed-tasks-head cursor-pointer" onClick={() => setCompletedTasksCollapsed(!completedTasksCollapsed)} style={{ userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title-sm" style={{ color: 'rgba(110, 231, 183, 0.95)' }}>{copy.tasksView.completedTasks} ({completedGoals.length})</div>
              <div className="collapse-icon" style={{ fontSize: '14px', color: 'rgba(22, 163, 74, 0.7)', transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)', transform: completedTasksCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▼</div>
            </div>

            {!completedTasksCollapsed && (
              <div className="goal-list tasks-list" key={`completed-${activeDate}`} style={{ opacity: '0.8', animation: 'viewFadeIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
                {completedGoals.map((goal, idx) => renderTaskItem(goal, idx + pendingGoals.length, true))}
                <div className="quick-tools compact" style={{ paddingTop: '10px', borderTop: '1px solid rgba(34, 197, 94, 0.15)' }}>
                  <button className="tool-btn" onClick={reopenAllCompleted}>{copy.tasksView.reopenAll} ({completedGoals.length})</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .ai-briefing-grid-v6 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 10px;
        }
        .ai-briefing-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ai-briefing-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ai-briefing-text {
          color: var(--text);
          font-weight: 700;
          line-height: 1.3;
        }
        
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(-20px); opacity: 1; }
        }

        .filter-btn {
          white-space: nowrap;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 800;
          background: rgba(255,255,255,0.03);
          color: var(--muted);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }
        .filter-btn.active {
          background: var(--accent, #3b82f6);
          color: #fff;
          border-color: transparent;
        }
        
        .search-input-v6:focus {
          border-color: var(--accent, #3b82f6) !important;
          background: rgba(255,255,255,0.05) !important;
        }
      `}} />
    </div>
  );
}
