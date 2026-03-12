import React, { useState, useRef, useEffect } from 'react';
import { formatTimeRange, todayKey, timeToMinutes } from '../utils/helpers';

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
  onToggleDone, 
  onEdit, 
  onDelete, 
  onToggleSelect 
}) => {
  const [currentMins, setCurrentMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  
  const cardRef = useRef(null);
  const longPressTimer = useRef(null);

  const SWIPE_THRESHOLD = 80;
  const BUTTON_WIDTH = 80; 

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMins(now.getHours() * 60 + now.getMinutes());
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const endMins = timeToMinutes(goal.endTime);
  const isPastDate = activeDate < todayKey();
  const isToday = activeDate === todayKey();
  const isOverdue = !doneHere && (isPastDate || (isToday && endMins !== Number.MAX_SAFE_INTEGER && currentMins > endMins));

  const handleToggleDone = (e) => {
    e.stopPropagation();
    onToggleDone();
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setSwipeOffset(0);

    longPressTimer.current = setTimeout(() => {
      onToggleSelect();
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    if (Math.abs(diff) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const maxSwipe = BUTTON_WIDTH + 20; 
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setSwipeOffset(0);

    longPressTimer.current = setTimeout(() => {
      onToggleSelect();
    }, 500);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;

    if (Math.abs(diff) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const maxSwipe = BUTTON_WIDTH + 20;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

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

  useEffect(() => {
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

  return (
    <div 
      className="swipeable-task-container" 
      style={{ 
        position: 'relative', 
        marginBottom: '12px',
        borderRadius: '12px',
        overflow: 'hidden', 
        boxShadow: selected ? '0 4px 15px rgba(59, 130, 246, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '24px', zIndex: 1 }}>
        <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{doneHere ? '✏️ Edit' : '✓ Complete'}</span>
      </div>

      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '24px', zIndex: 1 }}>
        <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>🗑️ Delete</span>
      </div>

      <div
        ref={cardRef}
        className={`goal-item ${pulse ? "pulse " : ""}${celebrate ? "celebrate " : ""}${isGlowingLive ? "live-glowing-card" : ""}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          animationDelay: `${idx * 35}ms`,
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'var(--card)', 
          backgroundImage: isOverdue 
            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)' 
            : (selected ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)' : 'none'),
          border: isOverdue ? '1.5px solid rgba(239, 68, 68, 0.5)' : (selected ? '1.5px solid #3b82f6' : '1px solid var(--card-border)'),
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        
        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-start' }}>
          
          <div style={{ display: 'flex', flexShrink: 0, marginTop: '2px' }}>
            <button 
              className={`chk${doneHere ? " checked" : ""}`} 
              onClick={handleToggleDone} 
              onPointerDown={(e) => e.stopPropagation()} 
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {doneHere && <span className="checkmark">✓</span>}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'hidden' }}>
            
            {/* ROW 1: Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div className={`goal-text${doneHere ? " done" : ""}`} style={{ margin: 0, fontSize: '16px', lineHeight: '1.3' }}>
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
              
              <div className="desktop-actions" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button className="mini-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit</button>
                <button className="mini-btn warn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</button>
              </div>
            </div>

            {/* ROW 2: Time Range & Live Status */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span className="goal-time-range" style={{ padding: '0 8px', fontSize: '0.75rem', height: '24px', display: 'inline-flex', alignItems: 'center', margin: 0, borderRadius: '6px', opacity: 0.9 }}>
                {formatTimeRange(goal.startTime, goal.endTime)}
              </span>
              
              {liveNow && !isOverdue && !doneHere && <span className="live-pill-task" style={{ fontSize: '0.7rem', padding: '0 8px', height: '24px', display: 'inline-flex', alignItems: 'center', margin: 0 }}>LIVE</span>}
              {liveNow && !isOverdue && !doneHere && countdownText && <span className="countdown-text" style={{ fontSize: '0.7rem', padding: '0 8px', height: '24px', display: 'inline-flex', alignItems: 'center', margin: 0 }}>{countdownText}</span>}
            </div>

            {/* ROW 3: PERFECTLY ALIGNED BADGES (Priority, Reminder, Repeat) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span className={`p-badge p-${(goal.priority || "Medium").toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0 10px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: 0, borderRadius: '6px' }}>
                {goal.priority || "Medium"}
              </span>
              
              {goal.reminder && (
                <span className="badge rem" style={{ fontSize: '0.7rem', padding: '0 10px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: 0, borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  ⏰ {new Date(`2000-01-01T${goal.reminder}:00`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
                </span>
              )}
              
              {goal.repeat && goal.repeat !== "None" && (
                <span className="badge rep" style={{ fontSize: '0.7rem', padding: '0 10px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: 0, borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  🔁 {goal.repeat}
                </span>
              )}
            </div>

          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulseGlowTask {
            0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
            50% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); border-color: rgba(16, 185, 129, 1); }
            100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
          }
          .live-glowing-card {
            animation: pulseGlowTask 2.5s infinite ease-in-out !important;
            background-image: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.01) 100%) !important;
          }
          @media (max-width: 768px) {
            .desktop-actions { display: none !important; }
          }
        `}} />
      </div>
    </div>
  );
};

export default SwipeableTaskCard;