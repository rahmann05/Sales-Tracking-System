import { useState, useEffect } from 'react';

/**
 * useLiveClock Hook
 * Single Responsibility: Manage a 1-second ticking live clock formatted in local time.
 */
export const useLiveClock = () => {
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return { currentTime };
};
