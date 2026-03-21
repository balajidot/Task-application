import React, { useState, useMemo } from 'react';

const WeeklyMonthlyPlanner = ({ view, goals, onTaskClick, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    let week = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    // Add remaining days of last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }
    
    return calendar;
  }, [currentDate]);

  const getTasksForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return goals.filter(g => g.date === dateStr);
  };

  const getWeekData = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const dayTasks = goals.filter(g => g.date === dateStr);
      
      weekDays.push({
        date: day,
        dateStr,
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: dayTasks,
        completed: dayTasks.filter(g => g.done).length,
        total: dayTasks.length
      });
    }
    
    return weekDays;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  if (view === 'weekly') {
    const weekData = getWeekData();
    
    return (
      <div className="weekly-planner base-card p-lg">
      <div className="planner-header base-card flex-between-center p-lg">
          <button 
            className="nav-btn"
            onClick={() => navigateWeek(-1)}
          >
            ◀
          </button>
          <h3>
            Week of {weekData[0]?.date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>
          <button 
            className="nav-btn"
            onClick={() => navigateWeek(1)}
          >
            ▶
          </button>
        </div>
        
        <div className="week-grid">
          {weekData.map((day, index) => (
            <div 
              key={day.dateStr}
              className="week-day-card"
              onClick={() => onTaskClick?.(day.dateStr)}
            >
              <div className="week-day-header flex-between-center">
                <div className="week-day-name">{day.dayName}</div>
                <div className="week-day-number">{day.date.getDate()}</div>
              </div>
              <div className="week-tasks">
                {day.tasks.slice(0, 3).map((task, i) => (
                  <div 
                    key={task.id}
                    className={`week-task ${task.done ? 'completed' : ''}`}
                  >
                    <div className={`task-priority bg-priority-${task.priority?.toLowerCase()}`}></div>
                    <span className="task-text">{task.text}</span>
                  </div>
                ))}
                {day.tasks.length > 3 && (
                  <div className="more-tasks">
                    +{day.tasks.length - 3} more
                  </div>
                )}
              </div>
              <div className="week-progress">
                {day.total > 0 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(day.completed / day.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-planner base-card p-lg">
      <div className="planner-header base-card flex-between-center p-lg">
        <button 
          className="nav-btn"
          onClick={() => navigateMonth(-1)}
        >
          ◀
        </button>
        <h3>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button 
          className="nav-btn"
          onClick={() => navigateMonth(1)}
        >
          ▶
        </button>
      </div>
      
      <div className="calendar-grid base-card p-lg">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        
        {calendarData.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              const dayTasks = getTasksForDate(day);
              const isToday = day === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <div 
                  key={dayIndex}
                  className={`calendar-day ${day ? '' : 'empty'} ${isToday ? 'today' : ''}`}
                  onClick={() => day && onTaskClick?.(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                >
                  {day && (
                    <>
                      <div className="calendar-day-number">{day}</div>
                      <div className="calendar-tasks">
                        {dayTasks.slice(0, 2).map((task, i) => (
                          <div 
                            key={task.id}
                            className={`calendar-task ${task.done ? 'completed' : ''}`}
                            title={task.text}
                          >
                            <div className={`calendar-task-priority bg-priority-${task.priority?.toLowerCase()}`}></div>
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="calendar-more-tasks">
                            +{dayTasks.length - 2}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyMonthlyPlanner;
