import React, { useState, useEffect } from 'react';

const FocusMode = ({ task, isActive, onExit }) => {
  const [focusTime, setFocusTime] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setFocusTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="focus-mode">
      <div className="focus-header">
        <div className="focus-title">
          🎯 Focus Mode
        </div>
        <div className="focus-task">
          {task?.text}
        </div>
        <div className="focus-time">
          {formatTime(focusTime)}
        </div>
      </div>
      
      <div className="focus-content">
        <div className="focus-instructions">
          Stay focused on your current task. Avoid distractions.
        </div>
        
        <div className="focus-progress">
          <div className="focus-time-remaining">
            {task?.startTime && task?.endTime && (
              <TaskProgressBar 
                startTime={task.startTime}
                endTime={task.endTime}
                currentTime={new Date().toTimeString().slice(0, 5)}
              />
            )}
          </div>
        </div>
      </div>

      <button 
        className="focus-exit"
        onClick={() => onExit?.()}
      >
        Exit Focus Mode
      </button>
    </div>
  );
};

// Import TaskProgressBar locally
const TaskProgressBar = ({ startTime, endTime, currentTime }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!startTime || !endTime || !currentTime) return;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const now = new Date(`2000-01-01T${currentTime}`);
    
    const totalMs = end - start;
    const elapsedMs = now - start;
    const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    
    setProgress(progressPercent);
  }, [startTime, endTime, currentTime]);

  if (!startTime || !endTime) return null;

  return (
    <div className="task-progress-bar">
      <div className="progress-label">
        <span className="progress-percentage">{Math.round(progress)}%</span>
        <span className="progress-text">completed</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default FocusMode;
