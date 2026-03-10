import React, { useState, useCallback } from 'react';

const EnhancedDraggableTask = ({ task, index, onMove, onDelete, onEdit, onToggleDone, doneHere, isActive, isNext }) => {
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
      className={`goal-item enhanced-goal-item ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''} ${isActive ? 'live-active' : ''} ${isNext ? 'next-upcoming' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Live Task Highlight */}
      {isActive && <LiveTaskHighlight task={task} />}
      
      <div className="goal-row">
        <button 
          className={`chk ${doneHere ? 'checked' : ''}`}
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
      
      {/* Task Progress Bar */}
      {task.startTime && task.endTime && (
        <TaskProgressBar 
          startTime={task.startTime}
          endTime={task.endTime}
          currentTime={new Date().toTimeString().slice(0, 5)}
        />
      )}
      
      {/* Remaining Time Percentage */}
      {task.startTime && task.endTime && (
        <div className="remaining-time">
          <span className="remaining-label">Time Remaining:</span>
          <span className="remaining-percentage">
            {calculateRemainingPercentage(task.startTime, task.endTime)}%
          </span>
        </div>
      )}
      
      {task.startTime && (
        <div className="task-time">
          🕐 {task.startTime} - {task.endTime || '--:--'}
        </div>
      )}
    </div>
  );
};

const calculateRemainingPercentage = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const now = new Date();
  const nowTime = new Date(`2000-01-01T${now.toTimeString().slice(0, 5)}`);
  
  const totalMs = end - start;
  const elapsedMs = nowTime - start;
  const remainingMs = totalMs - elapsedMs;
  const remainingPercentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  
  return Math.round(remainingPercentage);
};

// Import required components
import LiveTaskHighlight from './LiveTaskHighlight';
import TaskProgressBar from './TaskProgressBar';

export default EnhancedDraggableTask;
