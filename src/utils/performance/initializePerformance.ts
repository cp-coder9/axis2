/**
 * Performance Initialization
 * 
 * Initializes all performance optimizations when the app loads
 */

import { initializeCSSOptimizations } from './cssOptimization';

/**
 * Initialize all performance optimizations
 * 
 * This should be called once when the app starts
 */
export function initializePerformance(): void {
  // Initialize CSS optimizations
  initializeCSSOptimizations();
  
  // Add performance observer for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(
              `[Performance] Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`
            );
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask', 'measure'] });
    } catch (e) {
      // PerformanceObserver not supported or longtask not available
      console.log('[Performance] PerformanceObserver not fully supported');
    }
  }
  
  // Monitor CSS animation performance
  if (import.meta.env.DEV) {
    monitorAnimationPerformance();
  }
  
  // Add resource hints for critical assets
  addResourceHints();
  
  console.log('[Performance] All optimizations initialized');
}

/**
 * Monitor animation performance
 */
function monitorAnimationPerformance(): void {
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;
  
  function measureFPS() {
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
      
      if (fps < 30) {
        console.warn(`[Performance] Low FPS detected: ${fps}`);
      }
    }
    
    requestAnimationFrame(measureFPS);
  }
  
  requestAnimationFrame(measureFPS);
}

/**
 * Add resource hints for critical assets
 */
function addResourceHints(): void {
  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];
  
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // DNS prefetch for other domains
  const dnsPrefetchDomains = [
    'https://firebasestorage.googleapis.com',
    'https://res.cloudinary.com',
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Measure and log initial page load performance
 */
export function logPageLoadPerformance(): void {
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP Connection': navigation.connectEnd - navigation.connectStart,
            'Request Time': navigation.responseStart - navigation.requestStart,
            'Response Time': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domComplete - navigation.domInteractive,
            'Load Complete': navigation.loadEventEnd - navigation.loadEventStart,
            'Total Time': navigation.loadEventEnd - navigation.fetchStart,
          };
          
          console.group('[Performance] Page Load Metrics');
          Object.entries(metrics).forEach(([key, value]) => {
            console.log(`${key}: ${value.toFixed(2)}ms`);
          });
          console.groupEnd();
          
          // Check for performance issues
          if (metrics['Total Time'] > 3000) {
            console.warn('[Performance] Slow page load detected (>3s)');
          }
        }
        
        // Log paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        if (paintEntries.length > 0) {
          console.group('[Performance] Paint Metrics');
          paintEntries.forEach(entry => {
            console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          });
          console.groupEnd();
        }
      }, 0);
    });
  }
}

/**
 * Create a performance mark
 * 
 * @param name - Name of the mark
 */
export function mark(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 * 
 * @param name - Name of the measure
 * @param startMark - Start mark name
 * @param endMark - End mark name (optional, defaults to now)
 */
export function measure(name: string, startMark: string, endMark?: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    } catch (e) {
      console.warn(`[Performance] Could not measure ${name}:`, e);
    }
  }
  return 0;
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceData(): void {
  if ('performance' in window) {
    performance.clearMarks();
    performance.clearMeasures();
  }
}
