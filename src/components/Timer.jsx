import React from 'react';

const Timer = ({ onClose }) => {
  return (
    <div className="timer-modal">
      <div className="timer-content">
        <h3>Pomodoro Timer</h3>
        <div className="timer-display">25:00</div>
        <div className="timer-controls">
          <button className="timer-btn start">Start</button>
          <button className="timer-btn pause">Pause</button>
          <button className="timer-btn reset">Reset</button>
        </div>
        <button className="mini-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Timer;
