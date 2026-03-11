import React, { useEffect, useMemo, useState } from 'react';

const TaskProgressBar = ({ startTime, endTime, currentTime }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    if (!startTime || !endTime) return { progress: 0, color: '#10b981' };

    const toBaseDate = (hh, mm, ss = 0) => new Date(2000, 0, 1, hh, mm, ss, 0);
    const parseTime = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
      if (!m) return null;
      let hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = m[3] ? Number(m[3]) : 0;
      const ampm = (m[4] || '').toUpperCase();
      if (Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss)) return null;
      if (mm < 0 || mm > 59 || ss < 0 || ss > 59) return null;
      if (ampm) {
        if (hh < 1 || hh > 12) return null;
        if (ampm === 'AM') hh = hh % 12;
        if (ampm === 'PM') hh = (hh % 12) + 12;
      } else {
        if (hh < 0 || hh > 23) return null;
      }
      return { hh, mm, ss };
    };

    const startParts = parseTime(startTime);
    const endParts = parseTime(endTime);
    const start = startParts ? toBaseDate(startParts.hh, startParts.mm, 0) : null;
    const end = endParts ? toBaseDate(endParts.hh, endParts.mm, 0) : null;
    if (!start || !end) return { progress: 0, color: '#10b981' };
    if (end <= start) end.setDate(end.getDate() + 1);

    const realNow = new Date();
    const now = toBaseDate(realNow.getHours(), realNow.getMinutes(), 0);
    if (now < start && end > start) now.setDate(now.getDate() + 1);

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const progress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
    const color = progress < 60 ? '#10b981' : progress < 85 ? '#f59e0b' : '#ef4444';
    return { progress, color };
  }, [startTime, endTime, currentTime, tick]);

  if (!startTime || !endTime) return null;

  return (
    <div className="task-progress-bar">
      <div className="progress-label">
        <span className="progress-percentage">{Math.round(computed.progress)}%</span>
        <span className="progress-text">elapsed</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{
            width: `${computed.progress}%`,
            background: computed.color,
            transition: 'width 1s linear, background-color 300ms ease',
          }}
        />
      </div>
    </div>
  );
};

export default TaskProgressBar;
