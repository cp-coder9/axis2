/**
 * Lazy loading configuration for timer components
 * Optimizes bundle size and initial page load performance
 */

import { lazy, ComponentType } from 'react';
import { CountdownTimerProps } from './CountdownTimer';
import { EnhancedTimerDisplayProps } from './EnhancedTimerDisplay';
import { StopTimerModalProps } from './StopTimerModal';

// Lazy load timer components for better performance
export const LazyCountdownTimer = lazy(() => 
  import('./CountdownTimer').then(module => ({ 
    default: module.CountdownTimer 
  }))
);

export const LazyEnhancedTimerDisplay = lazy(() => 
  import('./EnhancedTimerDisplay').then(module => ({ 
    default: module.default 
  }))
);

export const LazyStopTimerModal = lazy(() => 
  import('./StopTimerModal').then(module => ({ 
    default: module.StopTimerModal 
  }))
);

// Performance optimized versions
export const LazyPerformanceCountdownTimer = lazy(() => 
  import('./CountdownTimer').then(module => ({ 
    default: module.CountdownTimer 
  }))
);

export const LazyPerformanceEnhancedTimerDisplay = lazy(() => 
  import('./EnhancedTimerDisplay.performance').then(module => ({ 
    default: module.EnhancedTimerDisplay 
  }))
);

export const LazyPerformanceStopTimerModal = lazy(() => 
  import('./StopTimerModal.performance').then(module => ({ 
    default: module.StopTimerModal 
  }))
);

// Component bundle analysis
export const TIMER_COMPONENT_SIZES = {
  CountdownTimer: '~45KB',
  EnhancedTimerDisplay: '~25KB', 
  StopTimerModal: '~35KB',
  Total: '~105KB'
} as const;

// Preload functions for better UX
export const preloadTimerComponents = {
  countdown: () => import('./CountdownTimer'),
  enhanced: () => import('./EnhancedTimerDisplay'),
  modal: () => import('./StopTimerModal'),
  all: () => Promise.all([
    import('./CountdownTimer'),
    import('./EnhancedTimerDisplay'), 
    import('./StopTimerModal')
  ])
};

// Dynamic component loader with error boundaries
export function createTimerComponentLoader<T extends ComponentType<any>>(
  componentPromise: Promise<{ default: T }>,
  fallback?: ComponentType<any>
) {
  return lazy(async () => {
    try {
      return await componentPromise;
    } catch (error) {
      console.error('Failed to load timer component:', error);
      return { default: fallback || (() => null) };
    }
  });
}

// Bundle optimization constants
export const OPTIMIZATION_CONFIG = {
  enableLazyLoading: true,
  enableCodeSplitting: true,
  preloadOnHover: true,
  preloadDelay: 300, // ms
  chunkNames: {
    timer: 'timer-components',
    performance: 'timer-performance',
    utilities: 'timer-utils'
  }
} as const;