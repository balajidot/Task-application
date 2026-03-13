import React, { useState, useEffect } from 'react';

const EnhancedFocusMode = ({ task, isActive, onExit }) => {
  const [focusTime, setFocusTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // ✅ Elapsed focus time counter
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setFocusTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // ✅ Task time progress bar
  useEffect(() => {
    if (!task?.startTime || !task?.endTime) return;
    const calc = () => {
      const toMins = (t) => {
        if (!t) return 0;
        const [h, m] = t.replace(/ AM| PM/i, '').split(':').map(Number);
        const isPM = /PM/i.test(t) && h !== 12;
        const isAM = /AM/i.test(t) && h === 12;
        return (isPM ? h + 12 : isAM ? 0 : h) * 60 + (m || 0);
      };
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const start = toMins(task.startTime);
      const end = toMins(task.endTime);
      const total = end - start;
      if (total <= 0) return;
      const pct = Math.min(100, Math.max(0, ((nowMins - start) / total) * 100));
      setProgress(pct);
    };
    calc();
    const iv = setInterval(calc, 30000);
    return () => clearInterval(iv);
  }, [task]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="focus-wall-overlay" style={{ zIndex: 10000 }}>
      {/* Exit button */}
      <button className="focus-wall-exit" onClick={onExit}>✕ Exit Focus Mode</button>

      <div className="focus-wall-content">
        {task ? (
          <>
            {/* Label */}
            <div className="focus-wall-label">🎯 CURRENT FOCUS</div>

            {/* Task name */}
            <div className="focus-wall-task">
              {(() => {
                const match = task.text?.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
                return match
                  ? <><span style={{ fontSize: '1.4em', marginRight: 8 }}>{match[1]}</span>{match[2]}</>
                  : task.text;
              })()}
            </div>

            {/* Time range */}
            {task.startTime && (
              <div className="focus-wall-time">
                {task.startTime} {task.endTime ? `→ ${task.endTime}` : ''}
              </div>
            )}

            {/* Progress bar */}
            {task.startTime && task.endTime && (
              <div style={{ width: '100%', maxWidth: 380, margin: '16px auto 0' }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: 'linear-gradient(90deg,#10b981,#3b82f6)',
                    borderRadius: 999, transition: 'width 1s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>{task.startTime}</span>
                  <span style={{ color: '#10b981', fontWeight: 800 }}>{Math.round(progress)}% done</span>
                  <span>{task.endTime}</span>
                </div>
              </div>
            )}

            {/* Focus elapsed time */}
            <div className="focus-wall-countdown" style={{ marginTop: 24 }}>
              ⏱ {formatTime(focusTime)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: -8, marginBottom: 24 }}>
              focused so far
            </div>

            {/* Instruction */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '12px 20px', marginBottom: 28,
              fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', maxWidth: 340
            }}>
              🔕 Stay focused. Avoid distractions. You can do this!
            </div>

            <button className="focus-wall-done-btn" onClick={onExit}>
              ✅ Mark Complete & Exit
            </button>
          </>
        ) : (
          <>
            <div className="focus-wall-label">🧘 FOCUS MODE</div>
            <div className="focus-wall-task" style={{ fontSize: '1.4rem', opacity: 0.7 }}>
              No active task right now
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: '0.9rem' }}>
              Add a task with a start time to use focus mode
            </div>
            <button className="focus-wall-done-btn" style={{ marginTop: 32, background: 'rgba(255,255,255,0.1)' }} onClick={onExit}>
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedFocusMode;
