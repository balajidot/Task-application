import React from 'react';
import { GoalItem } from '../components/SharedUI';
import TaskProgressIndicator from '../components/TaskProgressIndicator';
import EnhancedFocusMode from '../components/EnhancedFocusMode';
import TaskCompletionCelebration from '../components/TaskCompletionCelebration';
import DailyProductivityScore from '../components/DailyProductivityScore';
import { PRIORITY_OPTIONS, TIME_FILTER_OPTIONS, DAY_NAMES } from '../utils/constants';
import { todayKey, toKey } from '../utils/helpers';

export default function TasksView({
  activeDate, setActiveDate, activeDateLabel, weekBase, setWeekBase, weekDays,
  liveClockLabel, done, total, setForm, setEditingGoal, setShowForm,
  liveCurrentGoal, liveCountdown, focusMode, setFocusMode,
  showCelebration, setShowCelebration, goals, dotsFor,
  priorityFilter, setPriorityFilter, timeFilter, setTimeFilter,
  searchTerm, setSearchTerm, searchRef,
  pendingGoals, completedGoals, visibleGoals, selectedGoalIds, selectedSet,
  selectAllVisibleGoals, deleteSelectedGoals, clearSelectedGoals,
  completedPulseId, celebratingGoalId, toggleDoneWithCelebration, removeGoal, toggleSelectGoal,
  markAllPendingDone, duplicatePendingToTomorrow, reopenAllCompleted
}) {
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

      {liveCurrentGoal && (
        <div className="live-strip enhanced-live-strip">
          <div>
            <div className="tag">CURRENT TASK</div>
            <div className="task">{liveCurrentGoal.text}</div>
            {liveCurrentGoal.startTime && liveCurrentGoal.endTime && (
              <TaskProgressIndicator 
                startTime={liveCurrentGoal.startTime}
                endTime={liveCurrentGoal.endTime}
                currentTime={new Date().toTimeString().slice(0, 5)}
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
        <div className="week-grid">
          {weekDays.map((day) => {
            const dots = dotsFor(toKey(day));
            const isToday = toKey(day) === todayKey();
            const isSelected = toKey(day) === activeDate;
            return (
              <div key={day.toISOString()} className="day-cell" onClick={() => setActiveDate(toKey(day))}>
                <div className="day-box">
                  <div className="d-name">{DAY_NAMES[day.getDay()]}</div>
                  <div className={`d-num ${isToday ? 'is-today' : ''} ${isSelected ? 'is-sel' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="d-dots">
                    {dots.total > 0 && (
                      <>
                        {dots.done > 0 && <div className="dot done"></div>}
                        {dots.pending > 0 && <div className="dot pending"></div>}
                      </>
                    )}
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
          <div className="count">{total}</div>
        </div>

        <input
          ref={searchRef}
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="goal-list">
          {pendingGoals.length === 0 && completedGoals.length === 0 ? (
            <div className="empty">
              {searchTerm ? "No tasks found matching your search." : "No tasks for today. Add one above!"}
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

              {pendingGoals.map((goal, idx) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  idx={idx}
                  doneHere={false}
                  pulse={completedPulseId === goal.id}
                  celebrate={celebratingGoalId === goal.id}
                  liveNow={liveCurrentGoal?.id === goal.id}
                  countdownText={liveCurrentGoal?.id === goal.id ? liveCountdown : null}
                  selected={selectedSet.has(goal.id)}
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

              {completedGoals.map((goal, idx) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  idx={idx + pendingGoals.length}
                  doneHere={true}
                  pulse={false}
                  celebrate={false}
                  liveNow={false}
                  countdownText={null}
                  selected={selectedSet.has(goal.id)}
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

              {pendingGoals.length > 0 && (
                <div className="quick-tools">
                  <button className="tool-btn" onClick={markAllPendingDone}>
                    ✅ Mark All Done ({pendingGoals.length})
                  </button>
                  <button className="tool-btn" onClick={duplicatePendingToTomorrow}>
                    📅 Copy to Tomorrow ({pendingGoals.length})
                  </button>
                </div>
              )}

              {completedGoals.length > 0 && (
                <div className="quick-tools">
                  <button className="tool-btn" onClick={reopenAllCompleted}>
                    🔄 Reopen All ({completedGoals.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}