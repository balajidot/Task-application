import React, { useState, useCallback } from 'react';

const DraggableTask = ({ task, index, onMove, onDelete, onEdit, onToggleDone, doneHere }) => {
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
      className={`goal-item ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      {task.startTime && (
        <div className="task-time">
          🕐 {task.startTime} - {task.endTime || '--:--'}
        </div>
      )}
    </div>
  );
};

export default DraggableTask;
