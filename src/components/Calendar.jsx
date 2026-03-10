import React from 'react';

const Calendar = ({ weekBase, setWeekBase, goals, activeDate, setActiveDate }) => {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayKey = () => new Date().toISOString().split('T')[0];
  const toKey = (date) => date.toISOString().split('T')[0];
  const goalVisibleOn = (goal, date) => goal.date === date || goal.repeat !== "None";
  const isDoneOn = (goal, date) => goal.done || (goal.doneOn && goal.doneOn[date]);

  const weekDays = React.useMemo(() => {
    const days = [];
    const start = new Date(weekBase);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekBase]);

  const dotsFor = (dateKey) => {
    const dayGoals = goals.filter(g => goalVisibleOn(g, dateKey));
    return dayGoals.slice(0, 5).map(g => isDoneOn(g, dateKey) ? 'done' : 'pending');
  };

  return (
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
                <div className="d-date">{day.getDate()}</div>
                <div className={`d-dots ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}>
                  {dots.map((dot, i) => (
                    <div key={i} className={`dot ${dot === 'done' ? 'done' : 'pending'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
