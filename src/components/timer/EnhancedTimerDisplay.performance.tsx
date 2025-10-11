import React, { memo } from 'react';
import { Button } from '@/lib/shadcn';
import { Card, CardContent } from '@/lib/shadcn';
import { Badge } from '@/lib/shadcn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/shadcn';
import { Pause, Square, Play } from 'lucide-react';
import { UserRole } from '@/types';
import { 
  TimerAnnouncer, 
  KeyboardNavigation,
  HighContrastSupport,
  ScreenReaderSupport 
} from '@/utils/accessibility';
import { 
  useTimerCalculations, 
  useThrottledValue, 
  useTimerHandlers, 
  usePerformanceMonitor,
  useTimerCleanup
} from '@/utils/performance';

// Mock user context for demo - replace with real useAppContext in production
const mockUser = { 
  id: 'demo-user-1',
  name: 'Demo User',
  email: 'demo@example.com',
  role: UserRole.FREELANCER,
  title: 'Senior Architect',
  hourlyRate: 75,
  phone: '',
  company: '',
  avatarUrl: '',
  createdAt: new Date() as any,
  lastActive: new Date() as any
};

// Mock timer context
const mockTimerContext = {
  activeTimers: {},
  currentTimerKey: 'timer-1',
  pauseGlobalTimer: () => Promise.resolve(true),
  resumeGlobalTimer: () => Promise.resolve(true), 
  stopGlobalTimerAndLog: () => Promise.resolve(true),
  hasActiveTimer: () => false
};

// Mock RBAC functions
// Utility functions for role-based access control
const canFreelancerUseTimer = (user: any) => {
  if (!user) return false;
  // Freelancers can use timer if they're not clients and have active assignments
  return user?.role !== UserRole.CLIENT && user?.role !== undefined;
};

const canUserStartTimerOnJobCard = (_project: any, _jobCardId: string, _user: any) => {
  // In a real implementation, this would check:
  // - User assignment to project
  // - JobCard assignment to user
  // - Project status (active/inactive)
  // - User permissions
  return true; // Demo always allows access
};

export interface EnhancedTimerDisplayProps {
  // Display options
  compact?: boolean // Compact badge-only display
  floating?: boolean // Fixed positioning for non-intrusive display
  showControls?: boolean // Show pause/stop controls
  
  // Timer data
  jobCardId?: string
  jobCardTitle?: string
  projectId?: string
  userRole?: 'ADMIN' | 'FREELANCER' | 'CLIENT'
  
  // Event handlers
  onExpand?: () => void // Called when user clicks to expand timer
  onPause?: () => void
  onStop?: () => void
  
  // Styling
  className?: string
}

// Performance optimized EnhancedTimerDisplay with React.memo
export const EnhancedTimerDisplay = memo(function EnhancedTimerDisplay({
  compact = false,
  floating = false,
  showControls = true,
  jobCardId = 'job-123',
  jobCardTitle = 'UI Design Review',
  projectId = 'project-456',
  userRole = 'FREELANCER',
  onExpand,
  onPause,
  onStop,
  className
}: EnhancedTimerDisplayProps) {
  // Performance monitoring
  const { getStats } = usePerformanceMonitor('EnhancedTimerDisplay');
  
  // Accessibility instances
  const announcer = TimerAnnouncer.getInstance();

  // Mock timer state for demo
  const mockTimerState = {
    status: 'running' as 'running' | 'paused' | 'stopped',
    timeRemaining: 3450, // 57 minutes 30 seconds
    totalTime: 7200, // 2 hours
    pauseCount: 1,
    pauseTimeUsed: 45,
    jobCardId,
    jobCardTitle,
    projectId,
  };

  // Performance optimized calculations
  const calculations = useTimerCalculations(
    mockTimerState.timeRemaining,
    mockTimerState.totalTime,
    mockTimerState.pauseTimeUsed
  );

  // Throttled state for render optimization
  const throttledState = useThrottledValue(mockTimerState, 100);

  // Assignment validation
  const hasTimerAccess = canUserStartTimerOnJobCard(null, jobCardId, mockUser);
  const isAdmin = userRole === 'ADMIN';
  const canControl = hasTimerAccess || isAdmin;

  // Performance optimized event handlers
  const timerHandlers = useTimerHandlers(
    () => {}, // start - not used in this component
    async () => {
      if (!canControl) return;
      try {
        await mockTimerContext.pauseGlobalTimer();
        onPause?.();
      } catch (error) {
        console.error('Pause error:', error);
      }
    },
    () => {}, // resume - not used in this component
    async () => {
      if (!canControl) return;
      try {
        await mockTimerContext.stopGlobalTimerAndLog();
        onStop?.();
      } catch (error) {
        console.error('Stop error:', error);
      }
    },
    [canControl, onPause, onStop]
  );

  // Cleanup and performance monitoring
  useTimerCleanup([
    () => {
      announcer.clearQueue();
      if (process.env.NODE_ENV === 'development') {
        console.log('EnhancedTimerDisplay cleanup:', getStats());
      }
    }
  ]);

  // Time formatting
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Status determination
  const isOvertime = throttledState.timeRemaining <= 0;
  const isPaused = throttledState.status === 'paused';
  const isExceeded = isOvertime && throttledState.status === 'running';

  // Time display
  const timeDisplay = isOvertime 
    ? `+${formatTime(Math.abs(throttledState.timeRemaining))}` 
    : formatTime(throttledState.timeRemaining);

  // Status styling
  const getStatusStyling = () => {
    if (isExceeded) return { bg: 'bg-red-600', text: 'text-white', badge: 'destructive' as const };
    if (isPaused) return { bg: 'bg-yellow-600', text: 'text-white', badge: 'secondary' as const };
    return { bg: 'bg-green-600', text: 'text-white', badge: 'default' as const };
  };

  const statusStyle = getStatusStyling();

  // Role-based access control - moved after hooks
  if (userRole === 'CLIENT') return null;
  if (!canFreelancerUseTimer(mockUser)) return null;

  // Role-specific title and tooltip
  const getTimerTitle = () => {
    if (isAdmin) {
      return isExceeded ? 'Overtime Monitoring' : 'Admin View: Timer Active';
    }
    
    if (isPaused) return 'Timer Paused';
    if (isExceeded) return 'Time Exceeded';
    return 'Time Remaining';
  };

  const getTooltipContent = () => {
    if (isAdmin) return 'Admin view - override controls available';
    if (isPaused) return 'Timer is paused';
    if (isExceeded) return 'Time allocation exceeded';
    if (!hasTimerAccess) return 'You cannot access this timer - contact admin';
    return 'Click to expand timer controls';
  };

  // High contrast support
  const statusColors = HighContrastSupport.getHighContrastColors(
    isPaused ? 'paused' : isExceeded ? 'exceeded' : 'running'
  );

  // Screen reader content
  const screenReaderStatus = ScreenReaderSupport.formatStatusForScreenReader(
    throttledState.status,
    throttledState.timeRemaining,
    isExceeded
  );

  // Compact badge-only display
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusStyle.badge}
              className={`h-8 px-3 cursor-pointer transition-all duration-200 hover:scale-105 ${floating ? 'fixed top-4 right-4 z-50' : ''} ${className}`}
              onClick={onExpand}
              role="button"
              aria-label={`Timer status: ${screenReaderStatus}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onExpand?.();
                }
              }}
              style={{
                backgroundColor: statusColors.backgroundColor,
                color: statusColors.color,
                borderColor: statusColors.borderColor
              }}
            >
              <span className="font-mono text-sm">{timeDisplay}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full widget display
  return (
    <TooltipProvider>
      <Card 
        className={`
          ${floating ? 'fixed top-20 right-4 z-50 shadow-xl' : ''}
          ${statusStyle.bg} ${statusStyle.text}
          transition-all duration-300 hover:scale-102 cursor-pointer
          ${className}
        `}
        onClick={onExpand}
        role="button"
        aria-label={`Enhanced timer display: ${screenReaderStatus}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand?.();
          }
        }}
        style={{
          backgroundColor: statusColors.backgroundColor,
          borderColor: statusColors.borderColor
        }}
      >
        {/* Hidden screen reader content */}
        <div className="sr-only" aria-live="polite">
          {screenReaderStatus}
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            {/* Timer Info */}
            <div className="flex-1">
              <div className="text-xs sm:text-sm opacity-90 mb-1">
                {getTimerTitle()}
              </div>
              
              <div className="text-lg sm:text-xl font-mono font-bold mb-1">
                {timeDisplay}
              </div>
              
              <div className="text-xs opacity-75 hidden sm:inline truncate max-w-[150px]" title={jobCardTitle}>
                {jobCardTitle}
              </div>
              
              {/* Assignment validation warning */}
              {!hasTimerAccess && !isAdmin && (
                <div className="text-xs text-red-200 mt-1">
                  Access restricted
                </div>
              )}
              
              {/* Admin override notice */}
              {isAdmin && (
                <div className="text-xs text-blue-200 mt-1">
                  Admin Override
                </div>
              )}
            </div>

            {/* Control Buttons */}
            {showControls && canControl && (
              <div className="flex gap-1 ml-3">
                {isPaused ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Resume functionality - timerHandlers doesn't have resume, so implement here
                          onPause?.(); // For demo, toggle pause state
                        }}
                        aria-label="Resume timer"
                        disabled={!canControl}
                        ref={(el) => {
                          if (el) {
                            KeyboardNavigation.setupTimerControlAria(el, 'resume', {
                              disabled: !canControl
                            });
                          }
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resume Timer</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          timerHandlers.handlePause();
                        }}
                        aria-label="Pause timer"
                        disabled={!canControl}
                        ref={(el) => {
                          if (el) {
                            KeyboardNavigation.setupTimerControlAria(el, 'pause', {
                              disabled: !canControl
                            });
                          }
                        }}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pause Timer</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        timerHandlers.handleStop();
                      }}
                      aria-label="Stop timer"
                      disabled={!canControl}
                      ref={(el) => {
                        if (el) {
                          KeyboardNavigation.setupTimerControlAria(el, 'stop', {
                            disabled: !canControl
                          });
                        }
                      }}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stop & Log</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Status Badge */}
            <div className="ml-3">
              <Badge 
                variant="outline" 
                className="text-xs border-white/30 bg-white/10"
                role="status"
              >
                {isPaused ? 'Paused' : isExceeded ? 'Exceeded' : 'Running'}
              </Badge>
            </div>
          </div>

          {/* Progress indicator for mobile */}
          <div className="mt-3 sm:hidden">
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(calculations.progress.percentage, 100)}%` 
                }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(calculations.progress.percentage)}
                aria-label={`Progress: ${Math.round(calculations.progress.percentage)}% complete`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

export default EnhancedTimerDisplay;