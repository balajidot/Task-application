import React from 'react';
import { formatTimeRange, todayKey, timeToMinutes, isTimeLiveNow } from '../utils/helpers';

export function GoalItem({ goal, idx, doneHere, pulse, celebrate, liveNow, countdownText, selected, overdueEnabled = true, onToggleDone, onEdit, onDelete, onToggleSelect }) {
  
  // ✅ FIXED isOverdue logic — handles cross-midnight tasks correctly
  const isOverdue = (() => {
    if (!overdueEnabled) return false;
    if (doneHere) return false;
    if (liveNow) return false;
    if (!goal.startTime || !goal.endTime) return false;

    const today = todayKey();
    const isVisibleToday =
      goal.repeat !== "None" ? goal.date <= today : goal.date === today;
    if (!isVisibleToday) return false;

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = timeToMinutes(goal.startTime);
    const endMins = timeToMinutes(goal.endTime);

    // Guard: if either time is invalid, skip
    if (startMins === Number.MAX_SAFE_INTEGER || endMins === Number.MAX_SAFE_INTEGER) return false;

    // If the task is currently live (handles cross-midnight), it's NOT overdue
    if (isTimeLiveNow(goal.startTime, goal.endTime, nowMins)) return false;

    // Cross-midnight task (e.g. 10:45 PM → 7:30 AM): never mark as overdue
    // because we cannot determine whether the task ended this morning or starts tonight
    if (startMins > endMins) {
      return false;
    }

    // Normal task: overdue if start has passed AND end has passed
    return startMins <= nowMins && endMins < nowMins;
  })();

  const goalItemContent = (
    <div
      className={`goal-item${doneHere ? " done" : ""}${pulse ? " pulse" : ""}${celebrate ? " celebrate" : ""}${liveNow ? " live" : ""}`}
      style={{ animationDelay: `${idx * 35}ms` }}
    >
      <div className="goal-row">
        <button
          className={`pick-btn${selected ? " active" : ""}`}
          onClick={onToggleSelect}
        >
          {selected ? "Sel" : "Pick"}
        </button>
        <button className={`chk${doneHere ? " checked" : ""}`} onClick={onToggleDone}>
          {doneHere && <span className="checkmark">✓</span>}
        </button>
        <div className={`goal-text${doneHere ? " done" : ""}`}>
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
        <div className="goal-time-range">
          {formatTimeRange(goal.startTime, goal.endTime)}
        </div>
        {liveNow && <span className="live-pill-task">LIVE</span>}
        {liveNow && countdownText && (
          <span className="countdown-text">{countdownText}</span>
        )}
        <span className={`p-badge p-${goal.priority.toLowerCase()}`}>
          {goal.priority}
        </span>
        <button
          className="mini-btn"
          onClick={onEdit}
          disabled={liveNow && !doneHere}
          style={liveNow && !doneHere ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          title={liveNow && !doneHere ? "Strict Mode: Cannot edit an active task" : ""}
        >
          Edit
        </button>
        <button
          className="mini-btn warn"
          onClick={onDelete}
          disabled={liveNow && !doneHere}
          style={liveNow && !doneHere ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          title={liveNow && !doneHere ? "Strict Mode: Cannot delete an active task" : ""}
        >
          Delete
        </button>
      </div>
      <div className="badges">
        {goal.reminder && (
          <span className="badge rem">
            Reminder{" "}
            {new Date(`2000-01-01T${goal.reminder}:00`)
              .toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .toUpperCase()}
          </span>
        )}
        {goal.repeat !== "None" && (
          <span className="badge rep">Repeat {goal.repeat}</span>
        )}
      </div>
    </div>
  );

  if (isOverdue) {
    return (
      <div className="overdue-task-wrapper">
        <div className="overdue-badge">⚠️ OVERDUE - STRICT MODE</div>
        {goalItemContent}
      </div>
    );
  }

  return goalItemContent;
}

export function LiveTaskPopup({ task, onClose }) {
  if (!task) return null;
  return (
    <div className="live-task-popup" onClick={onClose}>
      <div className="live-popup-content">
        <div className="live-popup-header">
          <span className="live-dot"></span>
          <span className="live-popup-title">CURRENT TASK</span>
        </div>
        <div className="live-popup-task-name">{task.text}</div>
        <div className="live-popup-time">
          {task.startTime && `${task.startTime}`}
          {task.startTime && task.endTime && " - "}
          {task.endTime && `${task.endTime}`}
        </div>
      </div>
    </div>
  );
}

export function NextTaskAlert({ task, onClose }) {
  if (!task) return null;
  return (
    <div className="next-task-alert" onClick={onClose}>
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <div className="alert-title">Next: {task.text}</div>
        <div className="alert-time">at {task.startTime || "--:--"}</div>
      </div>
    </div>
  );
}