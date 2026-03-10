import React from 'react';

const LiveTaskHighlight = ({ task, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="live-task-highlight">
      <div className="live-task-glow"></div>
      <div className="live-task-pulse"></div>
    </div>
  );
};

export default LiveTaskHighlight;
