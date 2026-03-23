import React from 'react';
import { useTimer } from '../context/TimerContext';
import { formatCountdown, getTimeRemainingMs } from '../utils/helpers';

/**
 * Isolated Clock component that only re-renders on the 1s/10s tick.
 */
export const LiveClock = ({ className, style }) => {
  const { liveClockLabel } = useTimer();
  return <span className={className} style={style}>{liveClockLabel}</span>;
};

/**
 * Isolated Countdown component for the current live task.
 */
export const LiveCountdown = ({ endTime, className, style, showPrefix = true }) => {
  const { nowTick } = useTimer();
  
  const countdownText = React.useMemo(() => {
    if (!endTime) return null;
    const remaining = getTimeRemainingMs(endTime);
    if (remaining === null) return null;
    let txt = formatCountdown(remaining);
    if (!showPrefix) txt = txt.replace('⏱ ', '');
    return txt;
  }, [endTime, nowTick, showPrefix]);

  if (!countdownText) return null;
  
  return <span className={className} style={style}>{countdownText}</span>;
};

/**
 * Isolated "remaining" text component. 
 * E.g. "15 min left" or "ending now".
 */
export const LiveRemainingText = ({ endTime, language = 'en', className, style }) => {
  const { nowTick } = useTimer();
  const ta = language === 'ta';

  const text = React.useMemo(() => {
    if (!endTime) return null;
    const remaining = getTimeRemainingMs(endTime);
    if (remaining === null) return null;

    const mins = Math.max(0, Math.round(remaining / 60000));
    if (mins === 0) return ta ? 'கிட்டத்தட்ட முடிந்தது' : 'ending now';
    if (mins < 60) return ta ? `${mins} நிமிடம் மீதம்` : `${mins} min left`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return ta ? `${h}h ${m}m மீதம்` : `${h}h ${m}m left`;
  }, [endTime, nowTick, ta]);

  if (!text) return null;
  return <span className={className} style={style}>{text}</span>;
};
