import React, { useState, useMemo } from 'react';

const WeeklyMonthlyPlanner = ({ view, goals, onTaskClick, onDateChange }) => {
  const [currentDate,    setCurrentDate]    = useState(new Date());
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [selectedTasks,  setSelectedTasks]  = useState([]);
  const [showDateSheet,  setShowDateSheet]  = useState(false);

  // ─── Calendar Data ────────────────────────────────────────────────────────
  const calendarData = useMemo(() => {
    const year        = currentDate.getFullYear();
    const month       = currentDate.getMonth();
    const firstDay    = new Date(year, month, 1);
    const lastDay     = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // ✅ FIX: startingDay — use Sunday (0) as week start
    const startingDay = firstDay.getDay();

    const calendar = [];
    let week = [];

    for (let i = 0; i < startingDay; i++) week.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) { calendar.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      calendar.push(week);
    }
    return calendar;
  }, [currentDate]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getDateStr = (day) =>
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getTasksForDate = (day) => {
    if (!day) return [];
    return (goals || []).filter(g => g.date === getDateStr(day));
  };

  const getWeekData = () => {
    const today      = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day     = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const tasks   = (goals || []).filter(g => g.date === dateStr);
      return {
        date: day, dateStr,
        dayName:   day.toLocaleDateString('en-US', { weekday: 'short' }),
        tasks,
        completed: tasks.filter(g => g.done).length,
        total:     tasks.length,
      };
    });
  };

  // ─── Date Click Handler ───────────────────────────────────────────────────
  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr  = getDateStr(day);
    const tasks    = getTasksForDate(day);
    setSelectedDate(dateStr);
    setSelectedTasks(tasks);
    setShowDateSheet(true);
  };

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + dir);
    setCurrentDate(d);
  };
  const navigateWeek = (dir) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const today       = new Date();
  const todayStr    = today.toISOString().split('T')[0];
  const isThisMonth = currentDate.getMonth() === today.getMonth() &&
                      currentDate.getFullYear() === today.getFullYear();

  // ─── WEEKLY VIEW ──────────────────────────────────────────────────────────
  if (view === 'weekly') {
    const weekData = getWeekData();
    return (
      <div className="weekly-planner">
        <div className="planner-header">
          <button className="nav-btn" onClick={() => navigateWeek(-1)}>◀</button>
          <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
            Week of {weekData[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h3>
          <button className="nav-btn" onClick={() => navigateWeek(1)}>▶</button>
        </div>

        {/* ✅ FIX: week-grid uses fixed 7 columns, no overflow */}
        <div className="planner-week-grid">
          {weekData.map((day) => {
            const isToday = day.dateStr === todayStr;
            return (
              <div
                key={day.dateStr}
                className={`planner-week-day${isToday ? ' today' : ''}`}
                onClick={() => {
                  setSelectedDate(day.dateStr);
                  setSelectedTasks(day.tasks);
                  setShowDateSheet(true);
                }}
              >
                <div className="planner-week-dayname">{day.dayName}</div>
                <div className={`planner-week-daynum${isToday ? ' today' : ''}`}>
                  {day.date.getDate()}
                </div>
                {day.total > 0 && (
                  <div className="planner-week-dots">
                    {day.completed > 0 && <span className="dot done" />}
                    {day.total - day.completed > 0 && <span className="dot pending" />}
                  </div>
                )}
                {day.total > 0 && (
                  <div className="planner-week-count">{day.total}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Date Task Sheet */}
        {showDateSheet && (
          <DateTaskSheet
            dateStr={selectedDate}
            tasks={selectedTasks}
            onClose={() => setShowDateSheet(false)}
            onGoToTasks={() => { onTaskClick?.(selectedDate); setShowDateSheet(false); }}
          />
        )}
      </div>
    );
  }

  // ─── MONTHLY VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="monthly-planner">

      {/* Month Navigation */}
      <div className="planner-month-header">
        <button className="nav-btn" onClick={() => navigateMonth(-1)}>◀</button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>
        <button className="nav-btn" onClick={() => navigateMonth(1)}>▶</button>
      </div>

      {/* ✅ FIX: Calendar grid — proper 7 equal columns, no cut-off */}
      <div className="planner-month-grid">

        {/* Day headers */}
        <div className="planner-month-weekdays">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="planner-month-weekday">{d}</div>
          ))}
        </div>

        {/* Calendar weeks */}
        {calendarData.map((week, wi) => (
          <div key={wi} className="planner-month-week">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="planner-month-day empty" />;
              const dayStr   = getDateStr(day);
              const tasks    = getTasksForDate(day);
              const isToday  = isThisMonth && day === today.getDate();
              const done     = tasks.filter(t => t.done).length;
              const pending  = tasks.length - done;

              return (
                <div
                  key={di}
                  className={`planner-month-day${isToday ? ' today' : ''}${tasks.length > 0 ? ' has-tasks' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`planner-month-daynum${isToday ? ' today' : ''}`}>
                    {day}
                  </div>
                  {tasks.length > 0 && (
                    <div className="planner-month-dots">
                      {done    > 0 && <span className="dot done"    />}
                      {pending > 0 && <span className="dot pending" />}
                    </div>
                  )}
                  {tasks.length > 2 && (
                    <div className="planner-month-more">+{tasks.length - 2}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Date Task Sheet */}
      {showDateSheet && (
        <DateTaskSheet
          dateStr={selectedDate}
          tasks={selectedTasks}
          onClose={() => setShowDateSheet(false)}
          onGoToTasks={() => { onTaskClick?.(selectedDate); setShowDateSheet(false); }}
        />
      )}
    </div>
  );
};

// ─── Date Task Bottom Sheet ────────────────────────────────────────────────
function DateTaskSheet({ dateStr, tasks, onClose, onGoToTasks }) {
  const displayDate = dateStr
    ? new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
    : '';

  const done    = tasks.filter(t => t.done).length;
  const pending = tasks.length - done;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet date-sheet" onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-handle" />
        </div>

        {/* Date title */}
        <div className="date-sheet-header">
          <div className="date-sheet-title">📅 {displayDate}</div>
          <div className="date-sheet-stats">
            <span className="date-sheet-stat done">✅ {done}</span>
            <span className="date-sheet-stat pending">⏳ {pending}</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="date-sheet-tasks">
          {tasks.length === 0 ? (
            <div className="date-sheet-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, color: 'var(--muted)' }}>
                No tasks for this day
              </div>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`date-sheet-task${task.done ? ' done' : ''}`}>
                <div className={`date-sheet-task-dot priority-${task.priority?.toLowerCase() || 'medium'}`} />
                <div className="date-sheet-task-content">
                  <div className="date-sheet-task-text">{task.text}</div>
                  {task.startTime && (
                    <div className="date-sheet-task-time">
                      🕐 {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                    </div>
                  )}
                </div>
                {task.done && <span className="date-sheet-done-badge">✅</span>}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="date-sheet-actions">
          <button className="new-btn btn-block" onClick={onGoToTasks}>
            📋 View & Manage Tasks
          </button>
          <button className="hero-btn btn-block" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default WeeklyMonthlyPlanner;