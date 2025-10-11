import React from 'react';
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonWidget, 
  SkeletonText 
} from '@/components/ui/skeleton';

/**
 * Dashboard header skeleton with title and controls
 */
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton width="300px" height="2.25rem" />
        <Skeleton width="200px" height="1.25rem" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width="120px" height="1.5rem" />
        <div className="flex gap-1">
          <Skeleton width="40px" height="32px" />
          <Skeleton width="40px" height="32px" />
          <Skeleton width="40px" height="32px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Stats cards skeleton for dashboard metrics
 */
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="border border-border rounded-lg overflow-hidden bg-card p-6"
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="16px" height="16px" />
          </div>
          <div className="space-y-2">
            <Skeleton width="80px" height="2rem" />
            <Skeleton width="70%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Project progress skeleton
 */
export function ProjectProgressSkeleton() {
  return (
    <SkeletonCard
      headerHeight="1.5rem"
      bodyLines={0}
      showFooter={false}
      className="h-full"
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton width="40%" height="1rem" />
          <SkeletonText lines={1} width="100%" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton width="60%" height="0.875rem" />
                <Skeleton width="30px" height="0.875rem" />
              </div>
              <Skeleton width="100%" height="8px" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Team performance skeleton
 */
export function TeamPerformanceSkeleton() {
  return (
    <SkeletonCard
      headerHeight="1.5rem"
      bodyLines={0}
      showFooter={false}
      className="h-full"
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton width="40%" height="1rem" />
          <SkeletonText lines={1} width="100%" />
        </div>
        
        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Skeleton width="80px" height="32px" />
            <Skeleton width="80px" height="32px" />
          </div>
          
          {/* Tab content skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <Skeleton width="60%" height="0.875rem" />
                <Skeleton width="24px" height="20px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Recent activity skeleton
 */
export function RecentActivitySkeleton() {
  return (
    <SkeletonCard
      headerHeight="1.5rem"
      bodyLines={0}
      showFooter={false}
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton width="40%" height="1.5rem" />
          <Skeleton width="60%" height="1rem" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton width="8px" height="8px" circle />
              <div className="flex-1 space-y-1">
                <Skeleton width="70%" height="0.875rem" />
                <Skeleton width="50%" height="0.75rem" />
              </div>
              <Skeleton width="80px" height="20px" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Quick actions skeleton
 */
export function QuickActionsSkeleton() {
  return (
    <SkeletonCard
      headerHeight="1.5rem"
      bodyLines={0}
      showFooter={false}
      className="h-full"
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton width="40%" height="1.5rem" />
          <Skeleton width="60%" height="1rem" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index} 
              width="100%" 
              height="40px" 
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Complete dashboard skeleton layout
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <DashboardHeaderSkeleton />
      
      {/* Quick Links */}
      <div className="flex gap-2">
        <Skeleton width="120px" height="40px" />
        <Skeleton width="140px" height="40px" />
      </div>

      {/* Stats Cards */}
      <StatsCardsSkeleton />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProjectProgressSkeleton />
        <TeamPerformanceSkeleton />
      </div>

      {/* Recent Activity */}
      <RecentActivitySkeleton />
    </div>
  );
}

/**
 * Admin dashboard skeleton
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="200px" height="2.25rem" />
          <Skeleton width="300px" height="1.25rem" />
        </div>
        <Skeleton width="120px" height="24px" />
      </div>

      {/* Stats Cards */}
      <StatsCardsSkeleton />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionsSkeleton />
        <RecentActivitySkeleton />
      </div>
    </div>
  );
}

/**
 * Enhanced dashboard grid skeleton
 */
export function EnhancedDashboardGridSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Dashboard controls */}
      <div className="flex items-center justify-between">
        <Skeleton width="200px" height="32px" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="32px" />
          <Skeleton width="24px" height="32px" />
        </div>
      </div>
      
      {/* Widget grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonWidget 
            key={index} 
            height="200px"
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}