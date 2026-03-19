import React, { useState, useEffect, memo } from 'react';
import { formatTimeRange, timeToMinutes, todayKey } from '../utils/helpers';

const TaskCard = memo(({ 
  goal, 
  idx, 
  doneHere, 
  pulse, 
  celebrate, 
  liveNow, 
  countdownText, 
  selected,
  activeDate,
  onToggleDone, 
  onEdit, 
  onDelete, 
  onToggleSelect 
}) => {
  const [currentMins, setCurrentMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMins(now.getHours() * 60 + now.getMinutes());
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const startMins = timeToMinutes(goal.startTime);
  const endMins = timeToMinutes(goal.endTime);

  const isStarted = currentMins >= startMins;
  const isOverdue = !doneHere && activeDate === todayKey() && (endMins !== Number.MAX_SAFE_INTEGER) && (currentMins > endMins);

  const handleToggleDone = (e) => {
    e.stopPropagation();
    if (isStarted || doneHere) {
      onToggleDone();
    }
  };

  return (
    <div 
      className={`goal-item${doneHere ? " done" : ""}${pulse ? " pulse" : ""}${celebrate ? " celebrate" : ""}${liveNow ? " live" : ""}${isOverdue ? " overdue" : ""}`} 
      style={{ 
        animationDelay: `${idx * 35}ms`,
        position: 'relative',
        zIndex: 10,
        background: 'var(--card)', /* 🔥 Fixes the background bleeding issue 🔥 */
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* ROW 1: Controls + Title */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <button 
            className={`pick-btn${selected ? " active" : ""}`} 
            onClick={onToggleSelect}
          >
            {selected ? "Sel" : "Pick"}
          </button>
          <button 
            className={`chk${doneHere ? " checked" : ""}`} 
            onClick={handleToggleDone}
            disabled={!isStarted && !doneHere}
            style={(!isStarted && !doneHere) ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            title={(!isStarted && !doneHere) ? "Task hasn't started yet" : ""}
          >
            {doneHere && <span className="checkmark">✓</span>}
          </button>
        </div>
        
        <div className={`goal-text${doneHere ? " done" : ""}`} style={{ flex: 1, margin: 0 }}>
          {(() => {
            const match = goal.text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
            if (match) {
              return (
                <>
                  <span className="animated-emoji">{match[1]}</span>
                  {match[2]}
                </>
              );
            }
            return goal.text;
          })()}
        </div>

        {/* Desktop Edit/Delete Buttons */}
        <div className="action-buttons-desktop" style={{ display: 'flex', gap: '6px' }}>
          <button className="mini-btn" onClick={onEdit}>Edit</button>
          <button className="mini-btn warn" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {/* ROW 2: Metadata (Time, Priority, Badges) */}
      <div className="mobile-meta-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', paddingLeft: '80px' }}>
        <div className="goal-time-range">{formatTimeRange(goal.startTime, goal.endTime)}</div>
        
        {isOverdue && <span className="p-badge p-red" style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold' }}>LAGGING BEHIND</span>}
        {liveNow && <span className="live-pill-task">LIVE</span>}
        {liveNow && countdownText && <span className="countdown-text">{countdownText}</span>}
        
        <span className={`p-badge p-${(goal.priority || "Medium").toLowerCase()}`}>{goal.priority}</span>
        
        {goal.reminder && <span className="badge rem">Reminder {new Date(`2000-01-01T${goal.reminder}:00`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}</span>}
        {goal.repeat && goal.repeat !== "None" && <span className="badge rep">Repeat {goal.repeat}</span>}
      </div>

      {/* 🔥 Mobile Responsive Styles Injected Directly 🔥 */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .action-buttons-desktop {
            display: none !important;
          }
          .mobile-meta-row {
            padding-left: 0 !important;
            margin-top: 4px;
          }
        }
      `}} />
    </div>
  );
});

export default TaskCard;