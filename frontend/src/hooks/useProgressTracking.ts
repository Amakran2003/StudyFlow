import { useRef, useEffect, useState } from 'react';

export const useProgressTracking = () => {
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const lastProgressTime = useRef<number>(Date.now());
  const lastProgressValue = useRef<number>(0);

  // Reset times and values on component mount or when progress is reset
  useEffect(() => {
    lastProgressTime.current = Date.now();
    lastProgressValue.current = progress;
  }, [progress === 0]);

  const updateProgress = (newProgress: number) => {
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastProgressTime.current) / 1000;
    const progressDiff = newProgress - lastProgressValue.current;
    
    if (timeDiff > 0) {
      const speed = progressDiff / timeDiff; // percent per second
      const remainingProgress = 100 - newProgress;
      const estimatedTime = speed > 0 ? remainingProgress / speed : 0;
      setEstimatedTimeRemaining(estimatedTime > 0 ? Math.round(estimatedTime) : null);
    }
    
    setProgress(newProgress);
    lastProgressTime.current = currentTime;
    lastProgressValue.current = newProgress;
  };

  return {
    progress,
    estimatedTimeRemaining,
    updateProgress,
    resetProgress: () => setProgress(0)
  };
};
