/**
 * React Hook for CSS Performance Optimization
 * 
 * Provides React-friendly interface for CSS performance optimizations
 */

import { useEffect, useRef, RefObject } from 'react';
import {
  applyContainment,
  ContainmentType,
  willChangeManager,
} from '../utils/performance/cssOptimization';

/**
 * Hook to apply CSS containment to a component
 * 
 * @param type - Type of containment to apply
 * @returns Ref to attach to the component
 * 
 * @example
 * ```tsx
 * function DashboardCard() {
 *   const ref = useCSSContainment('layout paint');
 *   return <div ref={ref}>...</div>;
 * }
 * ```
 */
export function useCSSContainment<T extends HTMLElement = HTMLDivElement>(
  type: ContainmentType
): RefObject<T> {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    if (ref.current) {
      applyContainment(ref.current, type);
    }
  }, [type]);
  
  return ref;
}

/**
 * Hook to manage will-change property for animations
 * 
 * @param properties - CSS properties that will change
 * @param enabled - Whether will-change should be active
 * @returns Ref to attach to the component
 * 
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const [isAnimating, setIsAnimating] = useState(false);
 *   const ref = useWillChange(['transform', 'opacity'], isAnimating);
 *   return <div ref={ref}>...</div>;
 * }
 * ```
 */
export function useWillChange<T extends HTMLElement = HTMLDivElement>(
  properties: string[],
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    if (ref.current && enabled) {
      willChangeManager.add(ref.current, properties);
      
      return () => {
        if (ref.current) {
          willChangeManager.remove(ref.current);
        }
      };
    }
  }, [properties, enabled]);
  
  return ref;
}

/**
 * Hook to temporarily apply will-change during an animation
 * 
 * @param properties - CSS properties that will change
 * @param duration - Duration in milliseconds
 * @returns Function to trigger the temporary will-change
 * 
 * @example
 * ```tsx
 * function Button() {
 *   const ref = useRef<HTMLButtonElement>(null);
 *   const applyWillChange = useTemporaryWillChange(ref, ['transform'], 300);
 *   
 *   const handleClick = () => {
 *     applyWillChange();
 *     // Trigger animation
 *   };
 *   
 *   return <button ref={ref} onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useTemporaryWillChange<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T>,
  properties: string[],
  duration: number = 1000
): () => void {
  return () => {
    if (ref.current) {
      willChangeManager.temporary(ref.current, properties, duration);
    }
  };
}

/**
 * Hook to apply performance optimizations to a component
 * 
 * @param options - Optimization options
 * @returns Ref to attach to the component
 * 
 * @example
 * ```tsx
 * function OptimizedCard() {
 *   const ref = usePerformanceOptimization({
 *     containment: 'layout paint',
 *     willChange: ['transform', 'opacity'],
 *   });
 *   return <div ref={ref}>...</div>;
 * }
 * ```
 */
export interface PerformanceOptimizationOptions {
  containment?: ContainmentType;
  willChange?: string[];
  willChangeEnabled?: boolean;
}

export function usePerformanceOptimization<T extends HTMLElement = HTMLDivElement>(
  options: PerformanceOptimizationOptions = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const { containment, willChange, willChangeEnabled = true } = options;
  
  useEffect(() => {
    if (!ref.current) return;
    
    // Apply containment
    if (containment) {
      applyContainment(ref.current, containment);
    }
    
    // Apply will-change
    if (willChange && willChangeEnabled) {
      willChangeManager.add(ref.current, willChange);
      
      return () => {
        if (ref.current) {
          willChangeManager.remove(ref.current);
        }
      };
    }
  }, [containment, willChange, willChangeEnabled]);
  
  return ref;
}

/**
 * Hook to detect if an element is in the viewport (for lazy loading)
 * 
 * @param options - Intersection observer options
 * @returns [ref, isIntersecting]
 * 
 * @example
 * ```tsx
 * function LazyComponent() {
 *   const [ref, isVisible] = useIntersectionObserver();
 *   return (
 *     <div ref={ref}>
 *       {isVisible && <ExpensiveComponent />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(ref.current);
    
    return () => {
      observer.disconnect();
    };
  }, [options]);
  
  return [ref, isIntersecting];
}

/**
 * Hook to measure component render performance
 * 
 * @param componentName - Name of the component for logging
 * 
 * @example
 * ```tsx
 * function ExpensiveComponent() {
 *   useRenderPerformance('ExpensiveComponent');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderPerformance(componentName: string): void {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }
    
    startTime.current = performance.now();
  });
}

import { useState } from 'react';
