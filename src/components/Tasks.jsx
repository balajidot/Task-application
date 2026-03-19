import React from 'react';
import { GoalItem } from './SharedUI'; // ✅ FIXED: GoalItem lives in SharedUI, not a separate file

const Tasks = ({
  activeDateLabel,
  liveClockLabel,
  done,
  total,
  liveCurrentGoal,
  liveCountdown,
  showForm,
  form,
  setForm,
  editingGoal,
  setEditingGoal,
  setShowForm,
  pendingGoals,
  completedGoals,
  searchTerm,
  setSearchTerm,
  selectedGoalIds,
  selectAllVisibleGoals,
  deleteSelectedGoals,
  clearSelectedGoals,
  markAllPendingDone,
  duplicatePendingToTomorrow,
  reopenAllCompleted,
  completedPulseId,
  celebratingGoalId,
  selectedSet,
  toggleDone,
  removeGoal,
  toggleSelectGoal,
  save,
  PRIORITY_OPTIONS,
  TIME_FILTER_OPTIONS,
  priorityFilter,
  setPriorityFilter,
  timeFilter,
  setTimeFilter,
  visibleGoals,
  searchRef,
  weekBase,
  setWeekBase,
  TaskProgressIndicator,
  EnhancedFocusMode,
  focusMode,
  setFocusMode,
  TaskCompletionCelebration,
  showCelebration,
  setShowCelebration,
  DailyProductivityScore,
  goals,
  todayKey
}) => {
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
              setForm({ text: "", date: activeDateLabel, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
              setEditingGoal(null);
              setShowForm(true);
            }}>
              ➕ New Task
            </button>
          </div>
        </div>
      </div>

      {/* Live Task Strip */}
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

      {/* Focus Mode */}
      {focusMode && liveCurrentGoal && (
        <EnhancedFocusMode 
          task={liveCurrentGoal}
          isActive={focusMode}
          onExit={() => setFocusMode(false)}
        />
      )}

      {/* Task Completion Celebration */}
      <TaskCompletionCelebration 
        isActive={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Daily Productivity Score */}
      <DailyProductivityScore 
        goals={goals}
        todayKey={todayKey()}
      />

      <div className="card">
        <div className="filter-row">
          <div className="filter-group">
            <div className="filter-label">Priority</div>
            <div className="filter-buttons">
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
            <div className="empty-state">
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
                  onToggleDone={() => toggleDone(goal)}
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
                  onToggleDone={() => toggleDone(goal)}
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
};

export default Tasks;
