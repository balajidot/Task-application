import React from 'react';

const Dashboard = ({ 
  liveClockLabel, 
  done, 
  total, 
  weekly, 
  dotsFor, 
  weekDays, 
  DAY_NAMES, 
  todayKey, 
  activeDate, 
  setActiveDate,
  weekBase,
  setWeekBase 
}) => {
  return (
    <div>
      <div className="hero">
        <div className="topbar">
          <div>
            <div className="title">Dashboard</div>
            <div className="tip">
              {liveClockLabel} • {done} of {total} completed today
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="weekly-head">
          <div className="weekly-title">Weekly Overview</div>
          <div className="weekly-meta">{weekly.weekPct}% • {weekly.weekDone}/{weekly.weekTotal} done</div>
        </div>
        <div className="week-bars">
          {weekly.days.map((day, i) => (
            <div key={day.key} className="w-col">
              <div className="w-track">
                <div className="w-fill" style={{ height: `${day.pct}%` }}></div>
              </div>
              <div className="w-day">{day.name}</div>
            </div>
          ))}
        </div>
      </div>

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

      <div className="stats-row">
        <div className="pill">
          <div className="num">{done}</div>
          <div className="lbl">Done Today</div>
        </div>
        <div className="pill">
          <div className="num">{total - done}</div>
          <div className="lbl">Pending</div>
        </div>
        <div className="pill">
          <div className="num">{weekly.weekDone}</div>
          <div className="lbl">Week Done</div>
        </div>
        <div className="pill">
          <div className="num">{weekly.weekTotal - weekly.weekDone}</div>
          <div className="lbl">Week Left</div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const toKey = (date) => date.toISOString().split('T')[0];

export default Dashboard;
