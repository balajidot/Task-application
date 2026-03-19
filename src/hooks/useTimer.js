import { useState, useEffect, useRef } from 'react';

export const useTimer = () => {
  const [nowTick, setNowTick] = useState(Date.now());
  const masterTimerRef = useRef(null);

  useEffect(() => {
    masterTimerRef.current = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(masterTimerRef.current);
  }, []);

  return nowTick;
};
