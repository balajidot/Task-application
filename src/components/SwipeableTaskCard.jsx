import React from 'react';
import { formatTimeRange, todayKey, timeToMinutes } from '../utils/helpers';
import { triggerHaptic } from '../hooks/useMobileFeatures';

const SwipeableTaskCard = ({
  goal,
  idx,
  doneHere,
  pulse,
  celebrate,
  liveNow,
  countdownText,
  selected,
  activeDate,
  overdueEnabled,
  onToggleDone,
  onEdit,
  onDelete,
  onToggleSelect,
  onToggleSubtask,
  showCardDot = true
}) => {
  const [currentMins, setCurrentMins] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);

  const cardRef = React.useRef(null);

  const SWIPE_THRESHOLD = 80;
  const BUTTON_WIDTH = 100;

  React.useEffect(() => {
    // ✅ PERF FIX: Increased interval to 1 min to reduce battery drain & heat
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMins(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const endMins = timeToMinutes(goal.endTime);
  const isPastDate = activeDate < todayKey();
  const isToday = activeDate === todayKey();
  const isOverdue = !doneHere && (isPastDate || (isToday && endMins !== Number.MAX_SAFE_INTEGER && currentMins > endMins));

  const handleToggleDone = (e) => {
    e.stopPropagation();
    if (typeof triggerHaptic === 'function') triggerHaptic('medium');
    onToggleDone();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const Diff = currentX - startX;
    const friction = 0.4;
    const diff = Diff * friction;
    const maxSwipe = BUTTON_WIDTH + 40;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset < 0) {
        if (typeof triggerHaptic === 'function') triggerHaptic('medium');
        onDelete();
      } else {
        if (doneHere) {
          if (typeof triggerHaptic === 'function') triggerHaptic('light');
          onEdit();
        } else {
          if (typeof triggerHaptic === 'function') triggerHaptic('medium');
          onToggleDone();
        }
      }
    }
    setSwipeOffset(0);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setSwipeOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    const maxSwipe = BUTTON_WIDTH + 20;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      if (swipeOffset < 0) {
        onDelete();
      } else {
        if (doneHere) {
          onEdit();
        } else {
          onToggleDone();
        }
      }
    }
    setSwipeOffset(0);
  };

  React.useEffect(() => {
    const preventDefault = (e) => {
      if (isDragging && Math.abs(swipeOffset) > 10) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isDragging, swipeOffset]);

  const isGlowingLive = liveNow && !doneHere && !isOverdue;

  // PREMIUM THEME LOGIC (Fixed Default)
  const priorityColor = goal.priority === 'High' ? '#ff3b30' : goal.priority === 'Medium' ? '#ff9500' : '#34c759';
  const accent = '#3b82f6'; // Default Blue Accent

  let appliedBorder = '1px solid var(--glass-border)';
  let appliedShadow = 'var(--card-shadow)';
  let appliedBg = 'var(--glass-bg)';

  // Override for status states
  if (isGlowingLive) {
    appliedBorder = `1.5px solid ${accent}`;
    appliedShadow = `0 12px 40px color-mix(in srgb, ${accent} 30%, transparent)`;
    appliedBg = 'var(--card)';
  } else if (selected) {
    appliedBorder = `2px solid ${accent}`;
    appliedShadow = `0 12px 40px color-mix(in srgb, ${accent} 20%, transparent)`;
    appliedBg = 'var(--card)';
  } else if (isOverdue && overdueEnabled) {
    appliedBorder = '1.5px solid #ef4444';
    appliedShadow = 'inset 0 0 20px rgba(239, 68, 68, 0.08), 0 8px 32px rgba(239, 68, 68, 0.15)';
  }

  return (
    <div
      className="swipeable-task-container"
      style={{
        position: 'relative',
        marginBottom: '12px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      {/* Action Backgrounds (Revealed on Swipe) */}
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: 'linear-gradient(90deg, #34c759, #28a745)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '40px', zIndex: 1, opacity: Math.min(1, swipeOffset / 40) }}
      >
        <span style={{ fontSize: '28px' }}>{doneHere ? '✏️' : '✅'}</span>
      </div>

      <div
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', background: 'linear-gradient(270deg, #ff3b30, #d63031)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '40px', zIndex: 1, opacity: Math.min(1, -swipeOffset / 40) }}
      >
        <span style={{ fontSize: '28px' }}>🗑️</span>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`premium-slate-card glass-card glass-shimmer-effect ${pulse ? "pulse " : ""}${celebrate ? "celebrate " : ""}${isGlowingLive ? "live-glowing " : ""}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          position: 'relative',
          background: appliedBg,
          borderRadius: '24px',
          border: appliedBorder,
          padding: '16px 18px',
          display: 'flex',
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 2,
          alignItems: 'center',
          boxShadow: appliedShadow,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Left Section: Dot + Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '14px', flexShrink: 0 }}>
          {showCardDot && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: priorityColor,
              marginRight: '12px',
              boxShadow: `0 0 10px ${priorityColor}88`
            }} />
          )}
          <button
            className={`chk${doneHere ? " checked" : ""}${liveNow ? " live-chk" : ""}`}
            onClick={handleToggleDone}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '28px', height: '28px',
              borderWidth: '2px',
              borderColor: doneHere ? accent : 'var(--card-border)',
              background: doneHere ? accent : 'transparent'
            }}
          >
            {doneHere && <span className="checkmark" style={{ fontSize: '14px', animation: 'chk-bounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>{liveNow ? '🔥' : '✓'}</span>}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '4px' }}>
          {/* Title Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div
              className={`goal-text${doneHere ? " done" : ""}`}
              style={{
                margin: 0,
                fontSize: 'var(--task-font-size, 1.1rem)',
                lineHeight: '1.2',
                fontWeight: 'var(--global-font-weight, 800)',
                color: doneHere ? 'var(--muted)' : 'var(--text)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {(() => {
                const match = goal.text.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(.*)/u);
                if (match) {
                  return (
                    <>
                      <span className={isGlowingLive ? "animated-emoji-v6" : ""} style={{ marginRight: '10px', display: 'inline-block' }}>{match[1]}</span>
                      {match[2]}
                    </>
                  );
                }
                return goal.text;
              })()}
            </div>
          </div>

          {/* Metadata Area: Time + Reminder */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 900,
              borderRadius: '10px',
              background: 'var(--accent-alpha)',
              color: 'var(--accent)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              {formatTimeRange(goal.startTime, goal.endTime)}
            </div>

            {goal.reminder && (
              <div style={{
                display: 'inline-flex',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 900,
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase'
              }}>
                <span style={{ fontSize: '12px' }}>🔔</span>
                {new Date(`2000-01-01T${goal.reminder}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </div>
            )}
          </div>

          {/* 🔥 NEW: Sub-tasks Checklist 🔥 */}
          {goal.subtasks && goal.subtasks.length > 0 && (
            <div style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingLeft: '4px',
              borderLeft: '2px solid var(--card-border)'
            }}>
              {goal.subtasks.map((st, sidx) => (
                <div 
                  key={sidx}
                  onClick={(e) => { e.stopPropagation(); onToggleSubtask?.(sidx); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: st.done ? 'var(--muted)' : 'var(--text)',
                    opacity: st.done ? 0.6 : 1,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${st.done ? accent : 'var(--card-border)'}`,
                    background: st.done ? accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {st.done && <span style={{ fontSize: '10px', color: '#fff' }}>✓</span>}
                  </div>
                  <span style={{ textDecoration: st.done ? 'line-through' : 'none', fontWeight: 600 }}>{st.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Area: Live Badge + Edit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {isGlowingLive && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 1000,
              padding: '6px 12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              letterSpacing: '0.05em'
            }}>
              LIVE <span className="live-dot-pulse" />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="card-edit-btn-v6"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '14px',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--text)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>✏️</span>
          </button>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .chk.live-chk.checked {
            animation: live-tik-bounce 0.6s ease;
          }
          @keyframes live-tik-bounce {
            0% { transform: scale(1); }
            30% { transform: scale(1.4) rotate(-10deg); }
            60% { transform: scale(0.9) rotate(5deg); }
            100% { transform: scale(1) rotate(0); }
          }
          @keyframes chk-bounce {
            from { transform: scale(0) rotate(-45deg); opacity: 0; }
            to { transform: scale(1) rotate(0); opacity: 1; }
          }
          .live-dot-pulse {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #fff;
            animation: live-blink 1s infinite;
          }
          @keyframes live-blink {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }
          .animated-emoji-v6 {
            animation: emoji-bounce-v6 2s infinite ease-in-out;
            display: inline-block;
          }
          @keyframes emoji-bounce-v6 {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-3px) rotate(5deg); }
          }
          .premium-slate-card.pulse { animation: card-pulse 0.4s ease; }
          @keyframes card-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          .card-edit-btn-v6:active { transform: scale(0.9); }
          .card-edit-btn-v6:hover { background: var(--card-border); }
        `}} />
      </div>
    </div>
  );
};

export default SwipeableTaskCard;