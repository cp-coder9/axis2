/**
 * Performance Optimized Card Component
 * 
 * Demonstrates CSS performance optimizations including:
 * - CSS containment
 * - Will-change optimization
 * - Intersection observer for lazy loading
 */

import React, { ReactNode } from 'react';
import { useCSSContainment, useIntersectionObserver } from '../../hooks/useCSSOptimization';
import { cn } from '../../lib/utils';
import { ContainmentType } from '../../utils/performance/cssOptimization';

export interface PerformanceOptimizedCardProps {
  children: ReactNode;
  className?: string;
  lazyLoad?: boolean;
  containment?: ContainmentType;
  onVisible?: () => void;
}

/**
 * A card component optimized for performance with CSS containment
 * and optional lazy loading
 */
export function PerformanceOptimizedCard({
  children,
  className,
  lazyLoad = false,
  containment = 'layout',
  onVisible,
}: PerformanceOptimizedCardProps) {
  const containmentRef = useCSSContainment(containment);
  const [intersectionRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });
  
  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    (containmentRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
    (intersectionRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
  };
  
  // Call onVisible callback when element becomes visible
  React.useEffect(() => {
    if (isVisible && onVisible) {
      onVisible();
    }
  }, [isVisible, onVisible]);
  
  return (
    <div
      ref={setRefs}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        'transition-all duration-200',
        className
      )}
      data-component="dashboard-card"
    >
      {lazyLoad ? (isVisible ? children : <CardSkeleton />) : children}
    </div>
  );
}

/**
 * Skeleton loader for lazy-loaded cards
 */
function CardSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-20 bg-muted rounded"></div>
    </div>
  );
}

/**
 * Performance Optimized List Component
 * 
 * Demonstrates CSS containment for lists with many items
 */
export interface PerformanceOptimizedListProps {
  children: ReactNode;
  className?: string;
}

export function PerformanceOptimizedList({
  children,
  className,
}: PerformanceOptimizedListProps) {
  const ref = useCSSContainment('content');
  
  return (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      role="list"
    >
      {children}
    </div>
  );
}

/**
 * Performance Optimized Modal Content
 * 
 * Demonstrates CSS containment for modal dialogs
 */
export interface PerformanceOptimizedModalProps {
  children: ReactNode;
  className?: string;
}

export function PerformanceOptimizedModal({
  children,
  className,
}: PerformanceOptimizedModalProps) {
  const ref = useCSSContainment('layout');
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-background rounded-lg shadow-lg',
        'max-w-2xl w-full p-6',
        className
      )}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

/**
 * Performance Optimized Table
 * 
 * Demonstrates strict CSS containment for tables
 */
export interface PerformanceOptimizedTableProps {
  children: ReactNode;
  className?: string;
}

export function PerformanceOptimizedTable({
  children,
  className,
}: PerformanceOptimizedTableProps) {
  const ref = useCSSContainment('strict');
  
  return (
    <div
      ref={ref}
      className={cn('overflow-auto', className)}
    >
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}
