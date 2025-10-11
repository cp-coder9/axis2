import React from 'react';
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonForm,
  SkeletonAvatar,
  SkeletonText 
} from '@/components/ui/skeleton';

/**
 * Modal skeleton for loading modal content
 */
export function ModalSkeleton({ 
  title = true, 
  form = true, 
  actions = true 
}: {
  title?: boolean;
  form?: boolean;
  actions?: boolean;
}) {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {title && (
        <div className="space-y-2">
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="80%" height="1rem" />
        </div>
      )}
      
      {form && <SkeletonForm fields={4} />}
      
      {actions && (
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Skeleton width="80px" height="40px" />
          <Skeleton width="100px" height="40px" />
        </div>
      )}
    </div>
  );
}

/**
 * Navigation skeleton for sidebar/header loading
 */
export function NavigationSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-3 pb-4 border-b border-border">
        <Skeleton width="32px" height="32px" />
        <Skeleton width="120px" height="1.5rem" />
      </div>
      
      {/* Navigation items */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-2">
            <Skeleton width="16px" height="16px" />
            <Skeleton width="80%" height="1rem" />
          </div>
        ))}
      </div>
      
      {/* User section */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar size={32} />
          <div className="flex-1">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="50%" height="0.75rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Project card skeleton
 */
export function ProjectCardSkeleton() {
  return (
    <SkeletonCard
      showImage={false}
      headerHeight="1.5rem"
      bodyLines={2}
      showFooter={true}
      footerHeight="1rem"
      stagger={true}
      variant="shimmer"
    >
      <div className="p-4 space-y-3">
        {/* Project status badge */}
        <div className="flex justify-between items-start">
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="60px" height="20px" />
        </div>
        
        {/* Project description */}
        <SkeletonText lines={2} width={['100%', '80%']} />
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton width="40%" height="0.875rem" />
            <Skeleton width="30px" height="0.875rem" />
          </div>
          <Skeleton width="100%" height="8px" />
        </div>
        
        {/* Team avatars */}
        <div className="flex items-center space-x-2 pt-2">
          <div className="flex -space-x-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonAvatar key={index} size={24} />
            ))}
          </div>
          <Skeleton width="60px" height="0.875rem" />
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * User management table skeleton
 */
export function UserTableSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Table header with search and filters */}
      <div className="flex items-center justify-between">
        <Skeleton width="200px" height="40px" />
        <div className="flex gap-2">
          <Skeleton width="100px" height="40px" />
          <Skeleton width="80px" height="40px" />
        </div>
      </div>
      
      {/* Table */}
      <SkeletonTable 
        rows={8} 
        columns={5} 
        headerHeight="2.5rem"
        rowHeight="3rem"
      />
      
      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton width="150px" height="1rem" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="32px" />
          <Skeleton width="32px" height="32px" />
          <Skeleton width="32px" height="32px" />
          <Skeleton width="32px" height="32px" />
          <Skeleton width="80px" height="32px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Analytics chart skeleton
 */
export function ChartSkeleton({ 
  title = true, 
  height = '300px' 
}: {
  title?: boolean;
  height?: string;
}) {
  return (
    <SkeletonCard
      showImage={false}
      headerHeight={title ? "1.5rem" : undefined}
      bodyLines={0}
      showFooter={false}
    >
      <div className="p-6 space-y-4">
        {title && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton width="40%" height="1.5rem" />
              <Skeleton width="60%" height="1rem" />
            </div>
            <Skeleton width="100px" height="32px" />
          </div>
        )}
        
        {/* Chart area */}
        <div className="flex items-end justify-center space-x-2" style={{ height }}>
          {Array.from({ length: 12 }).map((_, index) => {
            const randomHeight = Math.floor(Math.random() * 80) + 20;
            return (
              <Skeleton
                key={index}
                width="20px"
                height={`${randomHeight}%`}
                delay={index * 50}
                variant="pulse"
              />
            );
          })}
        </div>
        
        {/* Chart legend */}
        <div className="flex items-center justify-center space-x-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton width="12px" height="12px" />
              <Skeleton width="60px" height="0.875rem" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * File manager skeleton
 */
export function FileManagerSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Skeleton width="32px" height="32px" />
          <Skeleton width="32px" height="32px" />
          <Skeleton width="32px" height="32px" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton width="200px" height="32px" />
          <Skeleton width="100px" height="32px" />
        </div>
      </div>
      
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 px-4">
        <Skeleton width="60px" height="1rem" />
        <span className="text-muted-foreground">/</span>
        <Skeleton width="80px" height="1rem" />
        <span className="text-muted-foreground">/</span>
        <Skeleton width="100px" height="1rem" />
      </div>
      
      {/* File grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton width="100%" height="80px" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="60%" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Message/Chat skeleton
 */
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {/* Chat header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-border">
        <SkeletonAvatar size={40} />
        <div className="flex-1">
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton width="30%" height="0.875rem" />
        </div>
        <Skeleton width="24px" height="24px" />
      </div>
      
      {/* Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: 6 }).map((_, index) => {
          const isOwn = index % 3 === 0;
          return (
            <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isOwn && <SkeletonAvatar size={32} />}
                <div className="space-y-1">
                  <Skeleton 
                    width={`${Math.floor(Math.random() * 100) + 100}px`} 
                    height="2.5rem" 
                    delay={index * 100}
                  />
                  <Skeleton width="60px" height="0.75rem" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Message input */}
      <div className="flex items-center space-x-2 pt-4 border-t border-border">
        <Skeleton width="100%" height="40px" />
        <Skeleton width="40px" height="40px" />
      </div>
    </div>
  );
}

/**
 * Timer component skeleton
 */
export function TimerSkeleton() {
  return (
    <SkeletonCard
      showImage={false}
      headerHeight="1.5rem"
      bodyLines={0}
      showFooter={false}
    >
      <div className="p-6 space-y-6 text-center">
        {/* Timer display */}
        <div className="space-y-2">
          <Skeleton width="200px" height="3rem" className="mx-auto" />
          <Skeleton width="120px" height="1rem" className="mx-auto" />
        </div>
        
        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Skeleton width="80px" height="40px" />
          <Skeleton width="80px" height="40px" />
          <Skeleton width="80px" height="40px" />
        </div>
        
        {/* Project selection */}
        <div className="space-y-2">
          <Skeleton width="100px" height="1rem" className="mx-auto" />
          <Skeleton width="200px" height="40px" className="mx-auto" />
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Settings page skeleton
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="200px" height="2rem" />
        <Skeleton width="300px" height="1.25rem" />
      </div>
      
      {/* Settings sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard
            key={index}
            headerHeight="1.5rem"
            bodyLines={0}
            showFooter={false}
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton width="40%" height="1.5rem" />
                <Skeleton width="80%" height="1rem" />
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, settingIndex) => (
                  <div key={settingIndex} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton width="60%" height="1rem" />
                      <Skeleton width="80%" height="0.875rem" />
                    </div>
                    <Skeleton width="44px" height="24px" />
                  </div>
                ))}
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}