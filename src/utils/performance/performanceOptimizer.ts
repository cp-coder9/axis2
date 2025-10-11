/**
 * Performance Optimization Utilities
 * Provides comprehensive performance monitoring and optimization for the multi-role dashboard system
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Timing thresholds
  TIMER_TICK: 1000,
  VISIBILITY_CHECK: 5000,
  RENDER_THROTTLE: 100,
  DEBOUNCE_DELAY: 300,
  
  // Memory limits
  MAX_RENDER_COUNT: 1000,
  MAX_CACHE_SIZE: 100,
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB
  
  // Feature flags
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_RENDER_THROTTLING: true,
  ENABLE_MEMORY_CLEANUP: true,
  ENABLE_LAZY_LOADING: true,
  
  // Bundle optimization
  CHUNK_SIZE_WARNING: 500 * 1024, // 500KB
  BUNDLE_SIZE_WARNING: 3 * 1024 * 1024, // 3MB
};

// Performance metrics interface
export interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage: number;
  timestamp: number;
}

// Global performance tracker
class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Set<(metrics: PerformanceMetrics[]) => void> = new Set();

  track(componentName: string, renderTime: number) {
    const existing = this.metrics.get(componentName);
    
    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newAverage = 
        (existing.averageRenderTime * existing.renderCount + renderTime) / newRenderCount;
      
      this.metrics.set(componentName, {
        ...existing,
        renderCount: newRenderCount,
        averageRenderTime: newAverage,
        lastRenderTime: renderTime,
        timestamp: Date.now(),
      });
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        memoryUsage: this.getMemoryUsage(),
        timestamp: Date.now(),
      });
    }

    this.notifyObservers();
  }

  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      const metric = this.metrics.get(componentName);
      return metric ? [metric] : [];
    }
    return Array.from(this.metrics.values());
  }

  subscribe(callback: (metrics: PerformanceMetrics[]) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers() {
    const metrics = this.getMetrics();
    this.observers.forEach(callback => callback(metrics));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  clear() {
    this.metrics.clear();
    this.notifyObservers();
  }

  getReport() {
    const metrics = this.getMetrics();
    const totalRenders = metrics.reduce((sum, m) => sum + m.renderCount, 0);
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / metrics.length;
    
    return {
      totalComponents: metrics.length,
      totalRenders,
      averageRenderTime: avgRenderTime || 0,
      slowestComponent: metrics.reduce((slowest, m) => 
        m.averageRenderTime > (slowest?.averageRenderTime || 0) ? m : slowest
      , metrics[0]),
      memoryUsage: this.getMemoryUsage(),
    };
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Hook to monitor component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (PERFORMANCE_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
        const renderTime = performance.now() - renderStartTime.current;
        performanceTracker.track(componentName, renderTime);
      }
    };
  });

  const getStats = useCallback(() => {
    const metrics = performanceTracker.getMetrics(componentName);
    return metrics[0] || {
      componentName,
      renderCount: renderCount.current,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      timestamp: Date.now(),
    };
  }, [componentName]);

  return { getStats, renderCount: renderCount.current };
}

/**
 * Hook for throttled values to reduce re-renders
 */
export function useThrottledValue<T>(value: T, delay: number = PERFORMANCE_CONFIG.RENDER_THROTTLE): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef<number>(Date.now());

  useEffect(() => {
    if (!PERFORMANCE_CONFIG.ENABLE_RENDER_THROTTLING) {
      setThrottledValue(value);
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to handle visibility changes for performance optimization
 */
export function useVisibilityHandler(
  onVisibilityChange: (isVisible: boolean, timeDiff: number) => void
) {
  const lastVisibleTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      const isVisible = document.visibilityState === 'visible';
      const timeDiff = now - lastVisibleTime.current;

      if (isVisible) {
        onVisibilityChange(true, timeDiff);
      } else {
        lastVisibleTime.current = now;
        onVisibilityChange(false, 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange]);
}

/**
 * Timer calculation utilities for performance-optimized timer displays
 */
export function useTimerCalculations(
  remainingSeconds: number,
  totalSeconds: number,
  pauseSeconds: number
) {
  return {
    display: {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
      formatted: formatDuration(remainingSeconds),
    },
    progress: {
      percentage: totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0,
      elapsed: totalSeconds - remainingSeconds,
      remaining: remainingSeconds,
    },
    pause: {
      remaining: pauseSeconds,
      progress: pauseSeconds > 0 ? (pauseSeconds / 180) * 100 : 0,
      isWarning: pauseSeconds < 60,
    },
  };
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Memory cleanup utility
 */
export function useMemoryCleanup(interval: number = 60000) {
  useEffect(() => {
    if (!PERFORMANCE_CONFIG.ENABLE_MEMORY_CLEANUP) return;

    const cleanupInterval = setInterval(() => {
      // Clear old performance entries
      if (performance.clearMarks) {
        performance.clearMarks();
      }
      if (performance.clearMeasures) {
        performance.clearMeasures();
      }

      // Suggest garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }, interval);

    return () => clearInterval(cleanupInterval);
  }, [interval]);
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const scripts = resources.filter(r => r.name.endsWith('.js'));
  const styles = resources.filter(r => r.name.endsWith('.css'));
  
  const totalScriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalStyleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  
  return {
    scripts: {
      count: scripts.length,
      totalSize: totalScriptSize,
      files: scripts.map(s => ({
        name: s.name.split('/').pop() || s.name,
        size: s.transferSize || 0,
        duration: s.duration,
      })),
    },
    styles: {
      count: styles.length,
      totalSize: totalStyleSize,
      files: styles.map(s => ({
        name: s.name.split('/').pop() || s.name,
        size: s.transferSize || 0,
        duration: s.duration,
      })),
    },
    total: totalScriptSize + totalStyleSize,
    warnings: [
      ...(totalScriptSize > PERFORMANCE_CONFIG.BUNDLE_SIZE_WARNING 
        ? ['Script bundle size exceeds recommended limit'] 
        : []),
      ...(scripts.some(s => (s.transferSize || 0) > PERFORMANCE_CONFIG.CHUNK_SIZE_WARNING)
        ? ['Some script chunks are too large']
        : []),
    ],
  };
}

/**
 * Network performance analyzer
 */
export function analyzeNetworkPerformance() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    domProcessing: navigation.domComplete - navigation.domInteractive,
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Role-based performance metrics
 */
export interface RolePerformanceMetrics {
  role: 'admin' | 'freelancer' | 'client';
  dashboardLoadTime: number;
  componentCount: number;
  averageRenderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

const roleMetricsStore = new Map<string, RolePerformanceMetrics>();

export function trackRolePerformance(
  role: 'admin' | 'freelancer' | 'client',
  metrics: Partial<RolePerformanceMetrics>
) {
  const existing = roleMetricsStore.get(role);
  roleMetricsStore.set(role, {
    role,
    dashboardLoadTime: metrics.dashboardLoadTime || existing?.dashboardLoadTime || 0,
    componentCount: metrics.componentCount || existing?.componentCount || 0,
    averageRenderTime: metrics.averageRenderTime || existing?.averageRenderTime || 0,
    memoryUsage: metrics.memoryUsage || existing?.memoryUsage || 0,
    bundleSize: metrics.bundleSize || existing?.bundleSize || 0,
  });
}

export function getRolePerformanceMetrics(role?: 'admin' | 'freelancer' | 'client') {
  if (role) {
    return roleMetricsStore.get(role);
  }
  return Array.from(roleMetricsStore.values());
}

export function clearRolePerformanceMetrics() {
  roleMetricsStore.clear();
}
