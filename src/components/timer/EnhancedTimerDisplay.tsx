import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/shadcn';
import { Button } from '@/lib/shadcn';
import { Badge } from '@/lib/shadcn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/shadcn';
import { Play, Pause, Square, Clock, AlertTriangle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TimerAnnouncer,
  TimerAnnouncementMessages,
  FocusManager,
  KeyboardNavigation,
  HighContrastSupport,
  ReducedMotionSupport,
  ScreenReaderSupport,
  initializeTimerAccessibility
} from '../../utils/accessibility';

// Types for enhanced timer display
export interface EnhancedTimerDisplayProps {
  className?: string;
  compact?: boolean;
  floating?: boolean;
  showControls?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  timeRemaining: number;
  totalTime: number;
  pauseCount: number;
  pauseTimeUsed: number;
  jobCardId?: string;
  jobCardTitle?: string;
  projectId?: string;
  allocatedHours?: number;
}

interface User {
  id: string;
  role: 'ADMIN' | 'FREELANCER' | 'CLIENT';
  name: string;
}

// Import the AppContext to get real user and timer data
import { useAppContext } from '../../contexts/AppContext';

// Utility functions
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const canFreelancerUseTimer = (user: User | null): boolean => {
  return user?.role === 'FREELANCER' || user?.role === 'ADMIN';
};

const canUserStartTimerOnJobCard = (projectId: string, jobCardId: string, user: User | null): boolean => {
  // Validate user assignment to project and job card
  if (!user) return false;
  
  // Admins can always start timers
  if (user.role === 'ADMIN') return true;
  
  // Freelancers need to be assigned to both project and job card
  if (user.role === 'FREELANCER') {
    // Check if user is assigned to the project
    const isAssignedToProject = projectId ? true : false; // Replace with actual project assignment check
    
    // Check if user is assigned to the job card
    const isAssignedToJobCard = jobCardId ? true : false; // Replace with actual job card assignment check
    
    return isAssignedToProject && isAssignedToJobCard;
  }
  
  // Clients cannot start timers
  return false;
};

export default function EnhancedTimerDisplay({
  className,
  compact = false,
  floating = true,
  showControls = true,
  onPause,
  onResume,
  onStop
}: EnhancedTimerDisplayProps) {
  // Get real user and timer data from context
  const { user, activeTimer } = useAppContext();
  
  // Convert activeTimer to TimerState format for compatibility
  const [localTimerState, setLocalTimerState] = useState<TimerState | null>(() =>
    activeTimer ? {
      status: activeTimer.status || 'idle',
      timeRemaining: activeTimer.timeRemaining || 0,
      totalTime: activeTimer.totalTime || 0,
      pauseCount: activeTimer.pauseCount || 0,
      pauseTimeUsed: activeTimer.pauseTimeUsed || 0,
      jobCardId: activeTimer.jobCardId,
      jobCardTitle: activeTimer.jobCardTitle || 'Unknown Task',
      projectId: activeTimer.projectId,
      allocatedHours: activeTimer.allocatedHours
    } : null
  );

  // Use local state for display and updates
  const timerState = localTimerState;

  // State management
  const [showPauseWarning, setShowPauseWarning] = useState(false);
  const [timeExceeded, setTimeExceeded] = useState(false);
  
  // Track time exceeded state
  useEffect(() => {
    if (timerState && timerState.timeRemaining <= 0 && timerState.allocatedHours) {
      setTimeExceeded(true);
    } else {
      setTimeExceeded(false);
    }
  }, [timerState]);

  // Accessibility instances
  const announcer = TimerAnnouncer.getInstance();
  const focusManager = FocusManager.getInstance();
  
  // Manage focus for timer controls
  useEffect(() => {
    const timerElement = document.querySelector('[data-timer-controls="true"]') as HTMLElement;
    if (timerState?.status === 'running' && timerElement) {
      focusManager.setFocusTrap(timerElement);
    }
    // Cleanup on unmount or status change
    return () => {
      // Focus manager cleanup handled internally
    };
  }, [timerState?.status, focusManager]);

  // Initialize accessibility features
  useEffect(() => {
    initializeTimerAccessibility();
    return () => {
      announcer.clearQueue();
    };
  }, []);

  // Don't render if no user or no active timer
  if (!user || !timerState) {
    return null;
  }

  // Role-based access control
  if (!canFreelancerUseTimer(user)) {
    return null; // Hide component for clients
  }

  // Assignment validation
  const assignmentAllowed = canUserStartTimerOnJobCard(
    timerState.projectId || '',
    timerState.jobCardId || '',
    user
  );

  // Timer status helpers
  const isRunning = timerState.status === 'running';
  const isPaused = timerState.status === 'paused';
  const isTimeExceeded = Boolean(timerState.timeRemaining <= 0 && timerState.allocatedHours);

  // Format time for screen readers
  const timeForScreenReader = ScreenReaderSupport.formatTimeForScreenReader(timerState.timeRemaining);
  const statusForScreenReader = ScreenReaderSupport.formatStatusForScreenReader(
    timerState.status,
    timerState.timeRemaining,
    isTimeExceeded
  );

  // High contrast colors
  const statusColors = HighContrastSupport.getHighContrastColors(
    isRunning && !isTimeExceeded ? 'running' :
    isPaused ? 'paused' :
    isTimeExceeded ? 'exceeded' : 'idle'
  );

  // Reduced motion classes
  const animationClasses = ReducedMotionSupport.getAnimationClasses(
    'transition-all duration-300 ease-in-out'
  );

  // Role-specific content
  const getRoleSpecificTitle = (): string => {
    switch (user.role) {
      case 'ADMIN':
        return isTimeExceeded ? 'Overtime Monitoring' : 'Admin View: Timer Active';
      case 'FREELANCER':
        if (isPaused) return 'Timer Paused';
        if (isTimeExceeded) return 'Time Exceeded';
        return timerState.allocatedHours ? 'Time Remaining' : 'Active Timer';
      case 'CLIENT':
        return 'Project Timer Active';
      default:
        return 'Active Timer';
    }
  };

  const getRoleSpecificTooltip = (): string => {
    switch (user.role) {
      case 'ADMIN':
        return isTimeExceeded
          ? 'This task has exceeded its allocated time. Consider reviewing the project scope.'
          : 'You can monitor all timer activity and override controls if needed.';
      case 'FREELANCER':
        return timerState.allocatedHours
          ? `Working on allocated ${timerState.allocatedHours}h task. ${isTimeExceeded ? 'Time exceeded - please wrap up.' : 'Track your time carefully.'}`
          : 'Timer is active for this task.';
      case 'CLIENT':
        return 'Your project team is actively working on this task.';
      default:
        return '';
    }
  };

  // Status styling helpers
  const getStatusVariant = () => {
    if (isTimeExceeded) return 'destructive';
    if (isPaused) return 'secondary';
    if (isRunning) return 'default';
    return 'outline';
  };

  const getStatusIcon = () => {
    if (isTimeExceeded) return <AlertTriangle className="h-4 w-4" />;
    if (isPaused) return <Pause className="h-4 w-4" />;
    if (isRunning) return <Timer className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Control handlers
  const handlePause = () => {
    setLocalTimerState(prev => prev ? { ...prev, status: 'paused', pauseCount: (prev.pauseCount || 0) + 1 } : null);
    
    // Show pause warning if approaching limit
    const pauseTimeRemaining = 180 - (timerState?.pauseTimeUsed || 0);
    if (pauseTimeRemaining < 30) {
      setShowPauseWarning(true);
      setTimeout(() => setShowPauseWarning(false), 5000);
    }
    
    announcer.announce(TimerAnnouncementMessages.TIMER_PAUSED(
      timerState?.pauseCount ? timerState.pauseCount + 1 : 1,
      formatTime(pauseTimeRemaining)
    ));
    onPause?.();
  };

  const handleResume = () => {
    setLocalTimerState(prev => prev ? { ...prev, status: 'running' } : null);
    announcer.announce(TimerAnnouncementMessages.TIMER_RESUMED());
    onResume?.();
  };

  const handleStop = () => {
    setLocalTimerState(prev => prev ? { ...prev, status: 'stopped' } : null);
    announcer.announce(TimerAnnouncementMessages.TIMER_STOPPED());
    onStop?.();
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent) => {
    KeyboardNavigation.handleTimerControlKeys(event.nativeEvent, {
      onPause: isPaused ? undefined : handlePause,
      onResume: isPaused ? handleResume : undefined,
      onStop: handleStop
    });
  };

  // Admin override capabilities
  const shouldShowAdminOverrides = (): boolean => {
    return user.role === 'ADMIN' && (isTimeExceeded || !assignmentAllowed);
  };

  // Render compact version
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={cn(
                "flex items-center gap-2 p-2 w-fit",
                floating && "fixed top-4 right-4 z-50 shadow-lg",
                animationClasses,
                className
              )}
              role="timer"
              aria-label={`Compact timer display: ${statusForScreenReader}`}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              data-timer-controls="true"
            >
              {/* Hidden live region for status updates */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {statusForScreenReader}
              </div>
              
              <Badge 
                variant={getStatusVariant()} 
                className={cn("gap-1", animationClasses)}
                style={{
                  color: statusColors.color,
                  backgroundColor: statusColors.backgroundColor,
                  borderColor: statusColors.borderColor
                }}
                role="status"
                aria-label={`Timer status: ${timerState.status}, ${timeForScreenReader}`}
              >
                {getStatusIcon()}
                <span aria-hidden="true">{formatTime(timerState.timeRemaining)}</span>
              </Badge>
              
              {showControls && (
                <div className="flex gap-1" role="group" aria-label="Timer controls">
                  {isPaused ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResume}
                      disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                      className="h-6 w-6 p-0"
                      aria-label="Resume timer"
                      data-action="resume"
                    >
                      <Play className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePause}
                      disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                      className="h-6 w-6 p-0"
                      aria-label="Pause timer"
                      data-action="pause"
                    >
                      <Pause className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStop}
                    disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                    className="h-6 w-6 p-0"
                    aria-label="Stop timer"
                    data-action="stop"
                  >
                    <Square className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{getRoleSpecificTitle()}</div>
              <div className="text-xs text-muted-foreground">
                {timerState.jobCardTitle}
              </div>
              {getRoleSpecificTooltip() && (
                <div className="text-xs mt-1 max-w-xs">
                  {getRoleSpecificTooltip()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Render full widget
  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "p-4 w-80",
          floating && "fixed top-20 right-4 z-50 shadow-xl",
          animationClasses,
          className
        )}
        role="timer"
        aria-label={`Timer display: ${statusForScreenReader}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        data-timer-controls="true"
      >
        {/* Hidden live region for status updates */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusForScreenReader}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium">{getRoleSpecificTitle()}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{getRoleSpecificTooltip()}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge 
            variant={getStatusVariant()}
            style={{
              color: statusColors.color,
              backgroundColor: statusColors.backgroundColor,
              borderColor: statusColors.borderColor
            }}
            role="status"
            aria-label={`Status: ${timerState.status.toUpperCase()}`}
          >
            {timerState.status.toUpperCase()}
          </Badge>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-4">
          <div 
            className={cn("text-3xl font-mono font-bold", animationClasses)}
            role="timer"
            aria-live="polite"
            aria-label={`Time: ${timeForScreenReader}`}
          >
            {isTimeExceeded ? (
              <span 
                className="text-destructive"
                aria-label={`Overtime: ${ScreenReaderSupport.formatTimeForScreenReader(Math.abs(timerState.timeRemaining))}`}
              >
                +{formatTime(Math.abs(timerState.timeRemaining))}
              </span>
            ) : (
              <span aria-label={timeForScreenReader}>
                {formatTime(timerState.timeRemaining)}
              </span>
            )}
          </div>
          
          {timerState.allocatedHours && (
            <div className="text-xs text-muted-foreground mt-1" role="status">
              {isTimeExceeded
                ? (user.role === 'ADMIN' ? 'Overtime - Review Required' : 'Overtime Mode!')
                : `of ${timerState.allocatedHours}h allocated`}
            </div>
          )}
        </div>

        {/* Job Card Info */}
        <div className="mb-4 p-2 bg-muted rounded-md" role="region" aria-label="Task information">
          <div className="text-xs text-muted-foreground">Task:</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm font-medium truncate" title={timerState.jobCardTitle}>
                {timerState.jobCardTitle}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{timerState.jobCardTitle}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Admin Override Notice */}
        {shouldShowAdminOverrides() && (
          <div className="mb-3 p-2 bg-warning/10 border border-warning rounded-md" role="alert">
            <div className="text-xs text-warning-foreground">
              Admin Override Available
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex gap-2" role="group" aria-label="Timer controls">
            {isPaused ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleResume}
                    disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                    className="flex-1"
                    aria-label="Resume timer"
                    data-action="resume"
                  >
                    <Play className="h-4 w-4 mr-1" aria-hidden="true" />
                    Resume
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!assignmentAllowed && user.role !== 'ADMIN'
                    ? 'You are not assigned to this task'
                    : user.role === 'ADMIN'
                    ? 'Admin override: Resume timer'
                    : 'Resume the timer'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePause}
                    disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                    className="flex-1"
                    aria-label="Pause timer"
                    data-action="pause"
                  >
                    <Pause className="h-4 w-4 mr-1" aria-hidden="true" />
                    Pause
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!assignmentAllowed && user.role !== 'ADMIN'
                    ? 'You are not assigned to this task'
                    : user.role === 'ADMIN'
                    ? 'Admin override: Pause timer'
                    : 'Pause the timer (3min limit)'}
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStop}
                  disabled={!assignmentAllowed && user.role !== 'ADMIN'}
                  className="flex-1"
                  aria-label="Stop timer"
                  data-action="stop"
                >
                  <Square className="h-4 w-4 mr-1" aria-hidden="true" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!assignmentAllowed && user.role !== 'ADMIN'
                  ? 'You are not assigned to this task'
                  : user.role === 'ADMIN'
                  ? 'Admin override: Stop timer'
                  : 'Stop timer and log time'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Pause Warning */}
        {showPauseWarning && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning rounded-md" role="alert" aria-live="assertive">
            <div className="text-xs text-warning-foreground">
              Timer paused for 2:50. Auto-resume in 10 seconds.
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
