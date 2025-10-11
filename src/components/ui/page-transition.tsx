import React from 'react';
import { usePageTransition, TransitionType } from '@/hooks/usePageTransition';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  enabled?: boolean;
  className?: string;
}

export function PageTransition({
  children,
  type = 'spring',
  duration = 300,
  enabled = true,
  className = ''
}: PageTransitionProps) {
  const { transitionClass } = usePageTransition({ type, duration, enabled });

  return (
    <div className={`page-transition ${transitionClass} ${className}`}>
      {children}
    </div>
  );
}

// Wrapper component for route-based transitions
export function RouteTransition({
  children,
  type = 'spring',
  className = ''
}: Omit<PageTransitionProps, 'duration' | 'enabled'>) {
  return (
    <PageTransition type={type} className={className}>
      {children}
    </PageTransition>
  );
}
