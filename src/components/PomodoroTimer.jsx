import React, { useState, useEffect } from 'react';

const PomodoroTimer = ({ onTaskComplete, onBreakComplete }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && (seconds > 0 || minutes > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            if (isBreak) {
              onBreakComplete?.();
              setMinutes(25);
              setIsBreak(false);
            } else {
              setCompletedPomodoros(prev => prev + 1);
              onTaskComplete?.(completedPomodoros + 1);
              setMinutes(5);
              setIsBreak(true);
            }
            setIsActive(false);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes, isBreak, completedPomodoros]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
    setIsActive(false);
  };

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-display">
        <div className="pomodoro-time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="pomodoro-status">
          {isBreak ? '🌿 Break Time' : '🍅 Focus Time'}
        </div>
        <div className="pomodoro-count">
          Completed: {completedPomodoros} pomodoros
        </div>
      </div>
      <div className="pomodoro-controls">
        <button 
          className={`pomodoro-btn ${isActive ? 'active' : ''}`}
          onClick={toggle}
        >
          {isActive ? '⏸️ Pause' : '▶️ Start'}
        </button>
        <button className="pomodoro-btn" onClick={reset}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
