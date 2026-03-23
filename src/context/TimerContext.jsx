import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { formatCountdown, getTimeRemainingMs } from '../utils/helpers';
import { useApp } from './AppContext';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const { focusMode, showPomodoro } = useApp();
  const [nowTick, setNowTick] = useState(Date.now());
  const [nowMinuteTick, setNowMinuteTick] = useState(Date.now());
  const masterTimerRef = useRef(null);

  useEffect(() => {
    const updateTick = () => setNowTick(Date.now());
    
    // PERF FIX: Dynamic interval based on precision needs
    const isMobile = window.innerWidth <= 768;
    const intervalTime = isMobile && !focusMode && !showPomodoro ? 10000 : 1000;
    
    masterTimerRef.current = setInterval(updateTick, intervalTime);
    const minuteTimer = setInterval(() => setNowMinuteTick(Date.now()), 60000);
    
    return () => { 
      clearInterval(masterTimerRef.current); 
      clearInterval(minuteTimer); 
    };
  }, [focusMode, showPomodoro]);

  const liveClockLabel = useMemo(() => 
    new Date(nowTick).toLocaleTimeString("en-IN", { 
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true 
    }).toUpperCase(), 
  [nowTick]);

  const value = {
    nowTick,
    nowMinuteTick,
    liveClockLabel,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
