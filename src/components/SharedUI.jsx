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
      style={{ animationDelay: `${idx * 35}ms`, padding: '12px 14px' }}
    >
      {/* ── ROW 1: Checkbox + Task Text + Time ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%' }}>
        {/* Select + Checkbox stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, marginTop: '2px' }}>
          <button className={`chk${doneHere ? " checked" : ""}`} onClick={onToggleDone} style={{ width: 26, height: 26 }}>
            {doneHere && <span className="checkmark">✓</span>}
          </button>
        </div>

        {/* Task text — flex grow */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`goal-text${doneHere ? " done" : ""}`} style={{ marginBottom: 4 }}>
            {(() => {
              const match = goal.text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
              if (match) return <><span style={{ marginRight: 4 }}>{match[1]}</span>{match[2]}</>;
              return goal.text;
            })()}
          </div>

          {/* Time range */}
          {(goal.startTime || goal.endTime) && (
            <div className="goal-time-range" style={{ display: 'inline-flex', fontSize: '0.78rem', padding: '3px 10px' }}>
              {formatTimeRange(goal.startTime, goal.endTime)}
            </div>
          )}

          {/* LIVE badge + countdown */}
          {liveNow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="live-pill-task">🔴 LIVE</span>
              {countdownText && <span className="countdown-text" style={{ fontSize: '0.72rem' }}>{countdownText}</span>}
            </div>
          )}
        </div>

        {/* Edit + Delete buttons — right side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button
            className="mini-btn"
            onClick={onEdit}
            disabled={liveNow && !doneHere}
            style={liveNow && !doneHere ? { opacity: 0.4, cursor: "not-allowed", fontSize: '0.65rem' } : { fontSize: '0.65rem' }}
          >✏️</button>
          <button
            className="mini-btn warn"
            onClick={onDelete}
            disabled={liveNow && !doneHere}
            style={liveNow && !doneHere ? { opacity: 0.4, cursor: "not-allowed", fontSize: '0.65rem' } : { fontSize: '0.65rem' }}
          >🗑</button>
        </div>
      </div>

      {/* ── ROW 2: Priority + Reminder + Repeat badges ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap', paddingLeft: 36 }}>
        {/* Priority */}
        <span className={`p-badge p-${goal.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
          {goal.priority === 'High' ? '🔴' : goal.priority === 'Medium' ? '🟡' : '🟢'} {goal.priority}
        </span>

        {/* Reminder */}
        {goal.reminder && (
          <span className="badge rem" style={{ fontSize: '0.65rem' }}>
            ⏰ {new Date(`2000-01-01T${goal.reminder}:00`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
          </span>
        )}

        {/* Repeat */}
        {goal.repeat !== "None" && (
          <span className="badge rep" style={{ fontSize: '0.65rem' }}>🔁 {goal.repeat}</span>
        )}

        {/* Select button — small, at end */}
        <button
          className={`pick-btn${selected ? " active" : ""}`}
          onClick={onToggleSelect}
          style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '3px 8px' }}
        >
          {selected ? "✓ Sel" : "Select"}
        </button>
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