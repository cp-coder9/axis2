/**
 * Performance utilities for timer components
 * Provides optimization hooks, memoization helpers, and visibility management
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Timer accuracy constants
export const TIMER_INTERVAL = 1000; // 1 second
export const VISIBILITY_CHECK_INTERVAL = 5000; // 5 seconds
export const RENDER_THROTTLE_MS = 100; // Throttle renders to 10fps max

/**
 * Hook for optimized timer calculations with memoization
 */
export const useTimerCalculations = (
  timeRemaining: number,
  totalTime: number,
  pauseTimeUsed: number
) => {
  return useMemo(() => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const totalHours = Math.floor(totalTime / 3600);
    const totalMinutes = Math.floor((totalTime % 3600) / 60);
    
    const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
    const isOvertime = timeRemaining < 0;
    const overtimeAmount = isOvertime ? Math.abs(timeRemaining) : 0;
    
    const pauseProgress = (pauseTimeUsed / 180) * 100; // 180s = 3 minutes
    const isPauseWarning = pauseTimeUsed >= 170; // 2:50 warning
    const isPauseLimit = pauseTimeUsed >= 180; // 3:00 limit
    
    return {
      display: {
        hours,
        minutes,
        seconds,
        totalHours,
        totalMinutes,
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        overtimeFormatted: isOvertime ? `+${Math.floor(overtimeAmount / 3600).toString().padStart(2, '0')}:${Math.floor((overtimeAmount % 3600) / 60).toString().padStart(2, '0')}:${(overtimeAmount % 60).toString().padStart(2, '0')}` : null
      },
      progress: {
        percentage: Math.min(Math.max(progress, 0), 100),
        isOvertime,
        overtimePercentage: isOvertime ? (overtimeAmount / totalTime) * 100 : 0
      },
      pause: {
        timeUsed: pauseTimeUsed,
        progress: Math.min(pauseProgress, 100),
        isWarning: isPauseWarning,
        isAtLimit: isPauseLimit,
        remaining: Math.max(180 - pauseTimeUsed, 0)
      }
    };
  }, [timeRemaining, totalTime, pauseTimeUsed]);
};

/**
 * Hook for browser tab visibility handling
 * Maintains timer accuracy when tab is hidden/visible
 */
export const useVisibilityHandler = (
  onVisibilityChange: (isVisible: boolean, timeDiff: number) => void
) => {
  const lastVisibilityTime = useRef<number>(Date.now());
  const isVisible = useRef<boolean>(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      const wasVisible = isVisible.current;
      const currentlyVisible = !document.hidden;
      const timeDiff = now - lastVisibilityTime.current;

      isVisible.current = currentlyVisible;
      lastVisibilityTime.current = now;

      // Only call if visibility actually changed
      if (wasVisible !== currentlyVisible) {
        onVisibilityChange(currentlyVisible, timeDiff);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check visibility periodically for accuracy
    const intervalId = setInterval(() => {
      if (!document.hidden && !isVisible.current) {
        handleVisibilityChange();
      }
    }, VISIBILITY_CHECK_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [onVisibilityChange]);

  return isVisible.current;
};

/**
 * Hook for efficient timer interval management
 * Uses requestAnimationFrame for better performance
 */
export const useTimerInterval = (
  callback: () => void,
  isActive: boolean
) => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<number>();
  const lastTickRef = useRef<number>(Date.now());

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const timeSinceLastTick = now - lastTickRef.current;
      
      // Only call callback if enough time has passed (accuracy protection)
      if (timeSinceLastTick >= TIMER_INTERVAL - 50) { // 50ms tolerance
        lastTickRef.current = now;
        callbackRef.current();
      }
    };

    // Use setInterval for timer accuracy
    intervalRef.current = window.setInterval(tick, TIMER_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);
};

/**
 * Hook for throttled re-renders
 * Prevents excessive re-renders during rapid state changes
 */
export const useThrottledValue = <T>(value: T, delay: number = RENDER_THROTTLE_MS): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValue;
};

/**
 * Hook for memoized event handlers
 * Prevents unnecessary re-renders from inline functions
 */
export const useTimerHandlers = (
  startTimer: (jobCardId?: string, jobCardTitle?: string, projectId?: string) => void,
  pauseTimer: () => void,
  resumeTimer: () => void,
  stopTimer: () => void,
  dependencies: React.DependencyList = []
) => {
  const handleStart = useCallback(startTimer, [startTimer, ...dependencies]);
  const handlePause = useCallback(pauseTimer, [pauseTimer, ...dependencies]);
  const handleResume = useCallback(resumeTimer, [resumeTimer, ...dependencies]);
  const handleStop = useCallback(stopTimer, [stopTimer, ...dependencies]);

  return { handleStart, handlePause, handleResume, handleStop };
};

/**
 * Hook for circular progress calculations
 * Optimized for smooth animations with memoization
 */
export const useCircularProgress = (
  timeRemaining: number,
  totalTime: number
) => {
  return useMemo(() => {
    if (totalTime <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) : 0;
    const totalSeconds = Math.max(timeRemaining, 0);
    
    const days = Math.floor(totalSeconds / 86400); // 24 * 60 * 60
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Calculate progress for each ring
    const dayProgress = totalTime >= 86400 ? (days / Math.floor(totalTime / 86400)) * 100 : 100;
    const hourProgress = totalTime >= 3600 ? (hours / Math.floor((totalTime % 86400) / 3600)) * 100 : 100;
    const minuteProgress = totalTime >= 60 ? (minutes / Math.floor((totalTime % 3600) / 60)) * 100 : 100;
    const secondProgress = (seconds / 60) * 100;

    return {
      days: Math.min(Math.max(dayProgress, 0), 100),
      hours: Math.min(Math.max(hourProgress, 0), 100),
      minutes: Math.min(Math.max(minuteProgress, 0), 100),
      seconds: Math.min(Math.max(secondProgress, 0), 100),
      overall: Math.min(Math.max(progress * 100, 0), 100),
      display: { days, hours, minutes, seconds: Math.floor(seconds) }
    };
  }, [timeRemaining, totalTime]);
};

/**
 * Hook for component performance monitoring
 * Tracks render counts and performance metrics
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender < 16) { // Less than 16ms (60fps)
        console.warn(`${componentName}: Fast re-render detected (${timeSinceLastRender}ms)`);
      }
      
      if (renderCount.current % 100 === 0) {
        console.info(`${componentName}: ${renderCount.current} renders`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    getStats: () => ({
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current
    })
  };
};

/**
 * Memory cleanup utility for timer components
 */
export const useTimerCleanup = (
  cleanupFunctions: (() => void)[]
) => {
  useEffect(() => {
    return () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Timer cleanup error:', error);
        }
      });
    };
  }, [cleanupFunctions]);
};

/**
 * Bundle size optimization - lazy load utilities
 */
export const lazyImports = {
  // Heavy components for lazy loading
  CountdownTimer: () => import('../components/timer/CountdownTimer'),
  EnhancedTimerDisplay: () => import('../components/timer/EnhancedTimerDisplay'),
  StopTimerModal: () => import('../components/timer/StopTimerModal'),
  
  // Heavy utilities
  accessibility: () => import('./accessibility'),
  firebaseHelpers: () => import('./firebaseHelpers'),
  offlineSync: () => import('./offlineSync')
};

/**
 * Performance optimization constants
 */
export const PERFORMANCE_CONFIG = {
  // Timer intervals
  TIMER_TICK: TIMER_INTERVAL,
  VISIBILITY_CHECK: VISIBILITY_CHECK_INTERVAL,
  RENDER_THROTTLE: RENDER_THROTTLE_MS,
  
  // Memory limits
  MAX_RENDER_COUNT: 1000,
  MAX_CACHE_SIZE: 100,
  
  // Performance thresholds
  SLOW_RENDER_THRESHOLD: 16, // 60fps
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB
  
  // Optimization flags
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_RENDER_THROTTLING: true,
  ENABLE_MEMORY_CLEANUP: true
} as const;