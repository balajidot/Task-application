import React, { useState, useRef, useEffect } from 'react';
import { GoalItem } from '../components/SharedUI';
import SwipeableTaskCard from '../components/SwipeableTaskCard';
import TaskProgressIndicator from '../components/TaskProgressIndicator';
import EnhancedFocusMode from '../components/EnhancedFocusMode';
import TaskCompletionCelebration from '../components/TaskCompletionCelebration';
import DailyProductivityScore from '../components/DailyProductivityScore';
import { PRIORITY_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES } from '../utils/constants';
import { todayKey, toKey } from '../utils/helpers';

export default function TasksView({
  activeDate, setActiveDate, activeDateLabel, weekBase, setWeekBase, weekDays,
  liveClockLabel, done, total, pct, nextUpcomingGoal, setForm, setEditingGoal, setShowForm,
  liveCurrentGoal, liveCountdown, focusMode, setFocusMode,
  showCelebration, setShowCelebration, goals, dotsFor,
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
  const stripStartX = useRef(0);

  useEffect(() => {
    setLiveStripVisible(true);
  }, [liveCurrentGoal?.id]);

  const handleStripTouchStart = (e) => { stripStartX.current = e.touches[0].clientX; };
  const handleStripTouchMove = (e) => { setStripSwipeX(e.touches[0].clientX - stripStartX.current); };
  const handleStripTouchEnd = () => {
    if (Math.abs(stripSwipeX) > 80) setLiveStripVisible(false); 
    else setStripSwipeX(0); 
  };

  return (
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

      {liveCurrentGoal && liveStripVisible && (
        <div 
          className="live-strip enhanced-live-strip"
          style={{
            transform: `translateX(${stripSwipeX}px)`,
            opacity: 1 - (Math.abs(stripSwipeX) / 150),
            transition: stripSwipeX === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
            position: 'relative',
            touchAction: 'pan-y'
          }}
          onTouchStart={handleStripTouchStart}
          onTouchMove={handleStripTouchMove}
          onTouchEnd={handleStripTouchEnd}
        >
          <button 
            onClick={() => setLiveStripVisible(false)}
            style={{ position: 'absolute', top: '8px', right: '12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '16px', padding: '4px', cursor: 'pointer', zIndex: 10 }}
          >✕</button>

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
                upNextText={nextUpcomingGoal?.text || ""}
                upNextTime={nextUpcomingGoal?.startTime || ""}
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

      {focusMode && liveCurrentGoal && (
        <EnhancedFocusMode 
          task={liveCurrentGoal}
          isActive={focusMode}
          onExit={() => setFocusMode(false)}
        />
      )}

      <TaskCompletionCelebration 
        isActive={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      <DailyProductivityScore 
        goals={goals}
        todayKey={todayKey()}
      />

      <div className="card">
        <div className="cal-header">
          <div className="cal-month">
            {new Date(weekBase).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </div>
          <div className="cal-actions">
            <button className="cal-btn" onClick={() => {
              const w = new Date(weekBase);
              w.setDate(w.getDate() - 7);
              setWeekBase(w);
            }}>◀</button>
            <button className="today-btn" onClick={() => setWeekBase(new Date())}>Today</button>
            <button className="cal-btn" onClick={() => {
              const w = new Date(weekBase);
              w.setDate(w.getDate() + 7);
              setWeekBase(w);
            }}>▶</button>
          </div>
        </div>
        
        {/* 🔥 STRICT 7-DAYS CSS INJECTED 🔥 */}
        <style dangerouslySetInnerHTML={{__html: `
          .force-7-days {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            gap: 2px !important;
            width: 100% !important;
            overflow-x: hidden !important; 
            padding-bottom: 8px !important;
            box-sizing: border-box !important;
          }
          .force-day-cell {
            min-width: 0 !important;
            width: 100% !important;
            padding: 6px 0 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
        `}} />

        <div className="force-7-days">
          {weekDays.map((day) => {
            const dots = dotsFor(toKey(day));
            const isToday = toKey(day) === todayKey();
            const isSelected = toKey(day) === activeDate;
            return (
              <div 
                key={day.toISOString()} 
                className="force-day-cell" 
                onClick={() => setActiveDate(toKey(day))}
                style={{ 
                  backgroundColor: isSelected ? 'var(--primary-glow)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>
                  {DAY_NAMES[day.getDay()].substring(0, 3).toUpperCase()}
                </div>
                <div 
                  className={`d-num ${isToday ? 'is-today' : ''} ${isSelected ? 'is-sel' : ''}`}
                  style={{ 
                    width: '28px', height: '28px', fontSize: '13px', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0'
                  }}
                >
                  {day.getDate()}
                </div>
                <div className="d-dots" style={{ marginTop: '4px', display: 'flex', gap: '2px', height: '4px' }}>
                  {dots.total > 0 && (
                    <>
                      {dots.done > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }}></div>}
                      {dots.pending > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b' }}></div>}
                    </>
                  )}
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
            <button className={`filter-btn ${priorityFilter === "All" ? 'active' : ''}`} onClick={() => setPriorityFilter("All")}>
              All
            </button>
            {PRIORITY_OPTIONS.map(priority => (
              <button
                key={priority}
                className={`filter-btn ${priorityFilter === priority ? 'active' : ''}`}
                onClick={() => setPriorityFilter(priority)}
              >
                {priority}
              </button>
            ))}
            <button className={`filter-btn ${timeFilter === "All Times" ? 'active' : ''}`} onClick={() => setTimeFilter("All Times")}>
              All Times
            </button>
            {TIME_FILTER_OPTIONS.slice(1).map(filter => (
              <button
                key={filter}
                className={`filter-btn ${timeFilter === filter ? 'active' : ''}`}
                onClick={() => setTimeFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', marginTop: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#60a5fa',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.1)'
          }}>
            <span style={{ fontSize: '16px' }}>🎯</span> Total Tasks Today: <span style={{ color: 'white', fontSize: '15px' }}>{total}</span>
          </div>
        </div>

        <input
          ref={searchRef}
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="pending-tasks-section">
          <div className="section-head mb-4">
            <div className="focus-title text-xl">📋 Pending Tasks ({pendingGoals.length})</div>
          </div>

          {pendingGoals.length === 0 ? (
            <div className="empty">
              {searchTerm ? "No pending tasks found matching your search." : "No pending tasks for today. Great job!"}
            </div>
          ) : (
            <>
              {selectedGoalIds.length > 0 && (
                <div className="quick-tools">
                  <button className="tool-btn" onClick={selectAllVisibleGoals}>
                    Select All ({visibleGoals.length})
                  </button>
                  <button className="tool-btn warn" onClick={deleteSelectedGoals}>
                    Delete Selected ({selectedGoalIds.length})
                  </button>
                  <button className="tool-btn" onClick={clearSelectedGoals}>
                    Clear Selection
                  </button>
                </div>
              )}

              <div className="goal-list">
                {pendingGoals.map((goal, idx) => (
                  <SwipeableTaskCard
                    key={goal.id}
                    goal={goal}
                    idx={idx}
                    doneHere={false}
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
                        reminder: goal.reminder,
                        startTime: goal.startTime,
                        endTime: goal.endTime,
                        repeat: goal.repeat,
                        session: goal.session,
                        priority: goal.priority,
                      });
                      setShowForm(true);
                    }}
                    onDelete={() => removeGoal(goal.id)}
                    onToggleSelect={() => toggleSelectGoal(goal.id)}
                  />
                ))}
              </div>

              <div className="quick-tools" style={{ marginBottom: "20px" }}>
                <button className="tool-btn" onClick={markAllPendingDone}>
                  ✅ Mark All Done ({pendingGoals.length})
                </button>
                <button className="tool-btn" onClick={duplicatePendingToTomorrow}>
                  📅 Copy to Tomorrow ({pendingGoals.length})
                </button>
              </div>
            </>
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="completed-tasks-section" style={{ 
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.05) 100%)', 
            borderRadius: '12px', padding: '16px', marginTop: '24px', border: '2px solid rgba(34, 197, 94, 0.2)', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)', position: 'relative'
          }}>
            <div 
              className="section-head mb-4 cursor-pointer" 
              onClick={() => setCompletedTasksCollapsed(!completedTasksCollapsed)}
              style={{ userSelect: 'none', borderBottom: '1px solid rgba(34, 197, 94, 0.15)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div className="focus-title text-xl" style={{ color: 'rgba(22, 163, 74, 0.9)', fontWeight: '600', textDecoration: 'none' }}>
                ✅ Completed Tasks ({completedGoals.length})
              </div>
              <div className="collapse-icon" style={{ fontSize: '14px', color: 'rgba(22, 163, 74, 0.7)', transition: 'transform 0.2s ease', transform: completedTasksCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                ▼
              </div>
            </div>
            
            {!completedTasksCollapsed && (
              <div className="goal-list" style={{ opacity: '0.8' }}>
                {completedGoals.map((goal, idx) => (
                  <SwipeableTaskCard
                    key={goal.id}
                    goal={goal}
                    idx={idx + pendingGoals.length}
                    doneHere={true}
                    pulse={false}
                    celebrate={false}
                    liveNow={false}
                    countdownText={null}
                    selected={selectedSet.has(goal.id)}
                    activeDate={activeDate}
                    onToggleDone={() => toggleDoneWithCelebration(goal)}
                    onEdit={() => {
                      setEditingGoal(goal.id);
                      setForm({
                        text: goal.text,
                        date: goal.date,
                        reminder: goal.reminder,
                        startTime: goal.startTime,
                        endTime: goal.endTime,
                        repeat: goal.repeat,
                        session: goal.session,
                        priority: goal.priority,
                      });
                      setShowForm(true);
                    }}
                    onDelete={() => removeGoal(goal.id)}
                    onToggleSelect={() => toggleSelectGoal(goal.id)}
                  />
                ))}

                <div className="quick-tools" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(34, 197, 94, 0.15)' }}>
                  <button className="tool-btn" onClick={reopenAllCompleted}>
                    🔄 Reopen All ({completedGoals.length})
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