import React from 'react';
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  animate?: boolean;
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse';
  delay?: number;
  'aria-label'?: string;
}

function Skeleton({ 
  className, 
  width, 
  height, 
  circle = false,
  animate = true,
  variant = 'shimmer',
  delay = 0,
  'aria-label': ariaLabel,
  ...props 
}: SkeletonProps) {
  // Animation variants
  const animationClasses = {
    default: 'animate-pulse',
    shimmer: 'animate-shimmer',
    wave: 'animate-wave',
    pulse: 'animate-pulse-subtle'
  };

  // Base classes with enhanced styling
  const baseClasses = cn(
    "bg-accent relative overflow-hidden transition-opacity duration-300",
    circle ? "rounded-full" : "rounded-md",
    animate ? animationClasses[variant] : "",
    className
  );

  return (
    <div
      data-slot="skeleton"
      className={baseClasses}
      style={{ 
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        animationDelay: delay ? `${delay}ms` : undefined
      }}
      role="status"
      aria-label={ariaLabel || 'Loading content'}
      aria-live="polite"
      {...props}
    />
  )
}

/**
 * Enhanced text skeleton with staggered animations
 */
function SkeletonText({ 
  lines = 3,
  lineHeight = '1rem',
  width = ['100%', '80%', '60%'],
  className = '',
  gap = '0.5rem',
  stagger = true,
  variant = 'shimmer' as const
}: {
  lines?: number;
  lineHeight?: number | string;
  width?: string | number | (string | number)[];
  className?: string;
  gap?: number | string;
  stagger?: boolean;
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse';
}) {
  const lineHeightStyle = typeof lineHeight === 'number' ? `${lineHeight}px` : lineHeight;
  const gapStyle = typeof gap === 'number' ? `${gap}px` : gap;

  return (
    <div 
      className={cn("flex flex-col", className)} 
      style={{ gap: gapStyle }}
      role="status"
      aria-label={`Loading ${lines} lines of text`}
    >
      {Array.from({ length: lines }).map((_, index) => {
        let lineWidth: string | number = '100%';
        if (Array.isArray(width)) {
          lineWidth = width[index % width.length] || '100%';
        } else {
          lineWidth = width;
        }

        const delay = stagger ? index * 100 : 0;

        return (
          <Skeleton
            key={index}
            width={lineWidth}
            height={lineHeightStyle}
            variant={variant}
            delay={delay}
            aria-label={`Loading line ${index + 1} of ${lines}`}
          />
        );
      })}
    </div>
  );
}

/**
 * Avatar placeholder skeleton
 */
function SkeletonAvatar({ 
  size = 40, 
  className = '' 
}: {
  size?: number | string;
  className?: string;
}) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  return (
    <Skeleton
      width={sizeValue}
      height={sizeValue}
      circle
      className={className}
    />
  );
}

/**
 * Enhanced card skeleton with staggered content loading
 */
function SkeletonCard({
  headerHeight = '2rem',
  bodyLines = 3,
  footerHeight = '2rem',
  className = '',
  imageHeight = '200px',
  showImage = false,
  showFooter = true,
  variant = 'shimmer' as const,
  stagger = true,
  children
}: {
  headerHeight?: number | string;
  bodyLines?: number;
  footerHeight?: number | string;
  className?: string;
  imageHeight?: number | string;
  showImage?: boolean;
  showFooter?: boolean;
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse';
  stagger?: boolean;
  children?: React.ReactNode;
}) {
  // If children are provided, use them instead of the default skeleton content
  if (children) {
    return (
      <div 
        className={cn(
          "border border-border rounded-lg overflow-hidden bg-card",
          className
        )}
        role="status"
        aria-label="Loading card content"
      >
        {showImage && (
          <Skeleton
            height={imageHeight}
            className="w-full rounded-t-lg rounded-b-none"
            variant={variant}
          />
        )}
        {children}
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card",
        className
      )}
      role="status"
      aria-label="Loading card content"
    >
      {showImage && (
        <Skeleton
          height={imageHeight}
          className="w-full rounded-t-lg rounded-b-none"
          variant={variant}
        />
      )}
      <div className="p-4 space-y-4">
        <Skeleton 
          height={headerHeight} 
          variant={variant}
          delay={stagger ? (showImage ? 100 : 0) : 0}
          aria-label="Loading header"
        />
        <SkeletonText 
          lines={bodyLines} 
          variant={variant}
          stagger={stagger}
          aria-label="Loading body content"
        />
        {showFooter && (
          <Skeleton 
            height={footerHeight}
            variant={variant}
            delay={stagger ? (showImage ? 300 : 200) : 0}
            aria-label="Loading footer"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Table skeleton for displaying loading data tables
 */
function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
  headerHeight = '2rem',
  rowHeight = '1.5rem'
}: {
  rows?: number;
  columns?: number;
  className?: string;
  headerHeight?: number | string;
  rowHeight?: number | string;
}) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <div className="bg-muted border-b border-border p-4">
        <Skeleton height={headerHeight} />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 grid grid-cols-12 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                height={rowHeight}
                className={`col-span-${Math.floor(12 / columns)}`}
                delay={rowIndex * 50 + colIndex * 25}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard widget skeleton
 */
function SkeletonWidget({
  className = '',
  height = '200px',
  showHeader = true,
  style
}: {
  className?: string;
  height?: number | string;
  showHeader?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)} style={style}>
      {showHeader && (
        <div className="bg-muted border-b border-border p-4 flex items-center justify-between">
          <Skeleton width="40%" height="1.5rem" />
          <div className="flex space-x-2">
            <Skeleton width="24px" height="24px" circle />
            <Skeleton width="24px" height="24px" circle />
          </div>
        </div>
      )}
      <div className="p-4 flex items-center justify-center" style={{ height }}>
        <Skeleton width="80%" height="80%" />
      </div>
    </div>
  );
}

/**
 * Form skeleton for loading form states
 */
function SkeletonForm({
  fields = 4,
  className = '',
  buttonWidth = '120px'
}: {
  fields?: number;
  className?: string;
  buttonWidth?: string | number;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="40%" height="1.2rem" />
          <Skeleton height="2.5rem" delay={index * 100} />
        </div>
      ))}
      <div className="pt-4">
        <Skeleton width={buttonWidth} height="2.5rem" />
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonWidget, 
  SkeletonForm 
}
