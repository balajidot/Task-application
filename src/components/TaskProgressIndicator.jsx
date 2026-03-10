import React, { useState, useEffect } from 'react';

const TaskProgressIndicator = ({ startTime, endTime, currentTime }) => {
  const [progress, setProgress] = useState(0);
  const [remainingPercentage, setRemainingPercentage] = useState(100);

  useEffect(() => {
    if (!startTime || !endTime || !currentTime) return;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const now = new Date(`2000-01-01T${currentTime}`);
    
    const totalMs = end - start;
    const elapsedMs = now - start;
    const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const remainingPercent = Math.max(0, 100 - progressPercent);
    
    setProgress(progressPercent);
    setRemainingPercentage(remainingPercent);
  }, [startTime, endTime, currentTime]);

  if (!startTime || !endTime) return null;

  return (
    <div className="task-progress-indicator">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-text">
        {remainingPercentage}% remaining
      </div>
    </div>
  );
};

export default TaskProgressIndicator;
