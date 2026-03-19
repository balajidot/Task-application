import { useState, useEffect } from 'react';

export function useTimeEngine() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1-second interval "Master Tick"
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return currentTime;
}
