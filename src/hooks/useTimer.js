import { useState, useEffect } from 'react';

export const useTimer = (initialTime, onTimeUp, active = false) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    let timer;
    if (active && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && active) {
      onTimeUp();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, active, onTimeUp]);

  const resetTimer = (newTime = initialTime) => {
    setTimeLeft(newTime);
  };

  return { timeLeft, resetTimer };
};