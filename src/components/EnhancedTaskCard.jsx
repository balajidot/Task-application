import React, { useState, useCallback } from 'react';

const EnhancedTaskCard = ({ task, index, isLive, isUpcoming, onMove, onToggleDone, onEdit, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ task, index }));
  }, [task, index]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.index !== index) {
      onMove?.(data.index, index, data.task);
    }
  }, [index, onMove]);

  return (
    <div
      className={`goal-item enhanced-goal-item ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''} ${isLive ? 'live-active' : ''} ${isUpcoming ? 'upcoming-active' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Live Task Highlight */}
      <LiveTaskHighlight isActive={isLive} />
      
      <div className="goal-row">
        <button 
          className={`chk ${task.done ? 'checked' : ''}`}
          onClick={() => onToggleDone?.(task)}
        />
        <div className="goal-text">{task.text}</div>
        {task.priority && (
          <span className={`p-badge p-${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
        )}
        <div className="goal-actions">
          <button 
            className="mini-btn"
            onClick={() => onEdit?.(task)}
            title="Edit task"
          >
            ✏️
          </button>
          <button 
            className="mini-btn warn"
            onClick={() => onDelete?.(task.id)}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Task Progress Indicator */}
      {isLive && task.startTime && task.endTime && (
        <TaskProgressIndicator 
          startTime={task.startTime}
          endTime={task.endTime}
          currentTime={new Date().toTimeString().slice(0, 5)}
        />
      )}
      
      {/* Task Time */}
      {task.startTime && (
        <div className="task-time">
          🕐 {task.startTime} - {task.endTime || '--:--'}
          {isLive && (
            <span className="live-indicator">LIVE</span>
          )}
        </div>
      )}
    </div>
  );
};

// Import required components locally
const LiveTaskHighlight = ({ isActive }) => {
  if (!isActive) return null;
  return <div className="live-task-highlight"><div className="live-task-glow"></div></div>;
};

const TaskProgressIndicator = ({ startTime, endTime, currentTime }) => {
  const [progress, setProgress] = useState(0);
  const [remainingPercentage, setRemainingPercentage] = useState(100);

  React.useEffect(() => {
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

export default EnhancedTaskCard;
