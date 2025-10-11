import { useEffect, useCallback, useRef, useState } from 'react';

export interface PullToRefreshConfig {
  threshold?: number; // Distance in pixels to trigger refresh
  resistance?: number; // Resistance factor (0-1)
  maxPullDistance?: number; // Maximum pull distance
  refreshTimeout?: number; // Minimum time to show refresh indicator
  enabled?: boolean;
}

export interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

const DEFAULT_CONFIG: Required<PullToRefreshConfig> = {
  threshold: 80,
  resistance: 0.5,
  maxPullDistance: 150,
  refreshTimeout: 1000,
  enabled: true
};

export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  config: PullToRefreshConfig = {}
) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const touchStartY = useRef<number>(0);
  const scrollTop = useRef<number>(0);
  const isEnabled = useRef<boolean>(mergedConfig.enabled);

  useEffect(() => {
    isEnabled.current = mergedConfig.enabled;
  }, [mergedConfig.enabled]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled.current || state.isRefreshing) return;

    const target = e.target as HTMLElement;
    const scrollableParent = findScrollableParent(target);
    scrollTop.current = scrollableParent?.scrollTop || 0;

    // Only enable pull-to-refresh if at the top of the scroll container
    if (scrollTop.current === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, [state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEnabled.current || state.isRefreshing || touchStartY.current === 0) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY.current;

    // Only pull down
    if (deltaY > 0) {
      // Apply resistance
      const pullDistance = Math.min(
        deltaY * mergedConfig.resistance,
        mergedConfig.maxPullDistance
      );

      setState({
        isPulling: true,
        pullDistance,
        isRefreshing: false,
        canRefresh: pullDistance >= mergedConfig.threshold
      });

      // Prevent default scroll behavior when pulling
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }, [state.isRefreshing, mergedConfig.resistance, mergedConfig.maxPullDistance, mergedConfig.threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isEnabled.current || state.isRefreshing) return;

    if (state.canRefresh) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false
      }));

      try {
        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        const startTime = Date.now();
        await onRefresh();

        // Ensure minimum refresh time for better UX
        const elapsed = Date.now() - startTime;
        if (elapsed < mergedConfig.refreshTimeout) {
          await new Promise(resolve => 
            setTimeout(resolve, mergedConfig.refreshTimeout - elapsed)
          );
        }
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
          canRefresh: false
        });
      }
    } else {
      // Reset state if threshold not met
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        canRefresh: false
      });
    }

    touchStartY.current = 0;
  }, [state.canRefresh, state.isRefreshing, onRefresh, mergedConfig.refreshTimeout]);

  const setupPullToRefresh = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    state,
    setupPullToRefresh,
    isRefreshing: state.isRefreshing
  };
};

// Helper function to find scrollable parent
function findScrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent);
    if (
      overflow === 'auto' ||
      overflow === 'scroll' ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
}
