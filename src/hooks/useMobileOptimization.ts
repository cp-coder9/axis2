import { useState, useEffect, useCallback } from 'react';

export interface MobileOptimizationConfig {
  enableTouchGestures: boolean;
  optimizeImages: boolean;
  enableOfflineMode: boolean;
  reducedAnimations: boolean;
  compactLayout: boolean;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  deltaX?: number;
  deltaY?: number;
  scale?: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

const detectDevice = (): DeviceInfo => {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  
  return {
    isMobile,
    isTablet,
    isTouchDevice: 'ontouchstart' in window,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  };
};

export const useMobileOptimization = (config: Partial<MobileOptimizationConfig> = {}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [touchGesture, setTouchGesture] = useState<TouchGesture | null>(null);

  const defaultConfig: MobileOptimizationConfig = {
    enableTouchGestures: true,
    optimizeImages: true,
    enableOfflineMode: true,
    reducedAnimations: false,
    compactLayout: true,
    ...config
  };

  // Update device info on orientation change or resize
  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Haptic feedback utility
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator && deviceInfo.isMobile) {
      const patterns = {
        light: [10],
        medium: [20, 15, 20], // Double buzz for medium
        heavy: [30, 20, 30, 20, 30] // Triple buzz for heavy
      };
      navigator.vibrate(patterns[type]);
    }
  }, [deviceInfo.isMobile]);

  // Touch gesture detection
  const setupTouchGestures = useCallback((element: HTMLElement) => {
    if (!defaultConfig.enableTouchGestures || !deviceInfo.isTouchDevice) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let initialDistance = 0;
    let longPressTimeout: number;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();

        // Setup longpress detection
        longPressTimeout = window.setTimeout(() => {
          setTouchGesture({ type: 'longpress' });
          triggerHapticFeedback('medium');
        }, 500);
      } else if (e.touches.length === 2) {
        // Calculate initial distance for pinch
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      clearTimeout(longPressTimeout);

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const deltaTime = Date.now() - startTime;

        // Detect swipe with velocity
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
          const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
          const direction = Math.abs(deltaX) > Math.abs(deltaY)
            ? deltaX > 0 ? 'right' : 'left'
            : deltaY > 0 ? 'down' : 'up';

          setTouchGesture({
            type: 'swipe',
            direction,
            deltaX,
            deltaY
          });

          if (velocity > 0.5) {
            triggerHapticFeedback('light');
          }
        }
      } else if (e.touches.length === 2) {
        // Calculate current distance for pinch
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const scale = currentDistance / initialDistance;
        if (Math.abs(1 - scale) > 0.1) {
          setTouchGesture({
            type: 'pinch',
            scale
          });
          triggerHapticFeedback('light');
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      clearTimeout(longPressTimeout);

      const deltaTime = Date.now() - startTime;
      if (deltaTime < 300) {
        setTouchGesture({ type: 'tap' });
        triggerHapticFeedback('light');
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(longPressTimeout);
    };
  }, [defaultConfig.enableTouchGestures, deviceInfo.isTouchDevice, triggerHapticFeedback]);

  // Clear touch gesture
  const clearTouchGesture = useCallback(() => {
    setTouchGesture(null);
  }, []);

  // Mobile optimization utilities
  const getLayoutConfig = useCallback(() => ({
    useMobileLayout: deviceInfo.isMobile || defaultConfig.compactLayout,
    useReducedAnimations: defaultConfig.reducedAnimations || deviceInfo.isMobile,
    useHardwareAcceleration: deviceInfo.isMobile,
    optimizeScrolling: deviceInfo.isTouchDevice
  }), [deviceInfo, defaultConfig]);

  // Performance optimization
  useEffect(() => {
    if (deviceInfo.isMobile) {
      // Enable hardware acceleration
      document.documentElement.style.setProperty('--transform-style', 'preserve-3d');
      document.documentElement.style.setProperty('--backface-visibility', 'hidden');
      
      // Optimize touch response
      document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
      
      // Reduce animation duration
      if (defaultConfig.reducedAnimations) {
        document.documentElement.style.setProperty('--animation-duration', '150ms');
      }
    }
  }, [deviceInfo.isMobile, defaultConfig.reducedAnimations]);

  // Viewport optimization utilities
  const optimizeViewport = useCallback(() => {
    // Set viewport meta tag for mobile
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
    );
  }, []);

  // Touch target validation
  const validateTouchTargets = useCallback((container: HTMLElement) => {
    const MIN_TOUCH_TARGET = 44; // WCAG 2.1 AA minimum
    const issues: Array<{ element: HTMLElement; size: { width: number; height: number } }> = [];

    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [onclick]'
    );

    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < MIN_TOUCH_TARGET || rect.height < MIN_TOUCH_TARGET) {
        issues.push({
          element: element as HTMLElement,
          size: { width: rect.width, height: rect.height }
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      totalChecked: interactiveElements.length
    };
  }, []);

  // Optimize scrolling performance
  const optimizeScrolling = useCallback((element: HTMLElement) => {
    element.style.setProperty('-webkit-overflow-scrolling', 'touch');
    element.style.setProperty('overscroll-behavior', 'contain');
    element.style.setProperty('contain', 'layout style paint');
    element.style.setProperty('will-change', 'scroll-position');
  }, []);

  // Initialize viewport optimizations
  useEffect(() => {
    if (deviceInfo.isMobile) {
      optimizeViewport();
    }
  }, [deviceInfo.isMobile, optimizeViewport]);

  return {
    deviceInfo,
    isOnline,
    touchGesture,
    layoutConfig: getLayoutConfig(),
    setupTouchGestures,
    clearTouchGesture,
    triggerHapticFeedback,
    optimizeViewport,
    validateTouchTargets,
    optimizeScrolling
  };
};