import React, { useState, useEffect } from 'react';

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

export default TaskProgressBar;
