import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Square, AlertCircle, Clock, Timer as TimerIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '../../contexts/modules/timer';
import { canFreelancerUseTimer } from '../../contexts/modules/auth';
import { UserRole } from '@/types';
import { 
  TimerAnnouncer, 
  TimerAnnouncementMessages, 
  KeyboardNavigation,
  HighContrastSupport,
  ReducedMotionSupport,
  ScreenReaderSupport,
  initializeTimerAccessibility,
  AnnouncementPriority
} from '../../utils/accessibility';
import { FocusManager } from '../../utils/focusManager';
import { 
  useTimerCalculations, 
  useVisibilityHandler, 
  useTimerInterval, 
  useThrottledValue, 
  useTimerHandlers, 
  useCircularProgress, 
  usePerformanceMonitor,
  useTimerCleanup
} from '../../utils/performance';

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

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped'
  timeRemaining: number // in seconds
  totalTime: number // in seconds
  pauseCount: number
  pauseTimeUsed: number // in seconds
  lastPauseTime?: number
  jobCardId?: string
  jobCardTitle?: string
  projectId?: string
}

export interface CountdownTimerProps {
  initialTime?: number // in seconds (e.g., 3600 for 1 hour)
  maxPauseTime?: number // in seconds (default: 180 = 3 minutes)
  maxPauseCount?: number // maximum number of pauses allowed
  jobCardId?: string
  jobCardTitle?: string
  projectId?: string
  onStart?: (state: TimerState) => void
  onPause?: (state: TimerState) => void
  onResume?: (state: TimerState) => void
  onStop?: (state: TimerState) => void
  onComplete?: (state: TimerState) => void
  onTimeUpdate?: (state: TimerState) => void
  className?: string
  autoStart?: boolean
  disabled?: boolean
  // Role-based display options
  showAsFloating?: boolean // Display as floating timer (legacy style)
  userRole?: 'ADMIN' | 'FREELANCER' | 'CLIENT'
  // Advanced visualization options
  showCircularProgress?: boolean // Show circular progress rings
  compactMode?: boolean // Compact display mode
}

const MAX_PAUSE_TIME = 180 // 3 minutes in seconds
const PAUSE_WARNING_THRESHOLD = 30 // 30 seconds before max pause reached

// Performance optimized CountdownTimer with React.memo
export const CountdownTimer = memo(function CountdownTimer({
  initialTime,
  maxPauseTime = MAX_PAUSE_TIME,
  maxPauseCount = 5,
  jobCardId,
  jobCardTitle,
  projectId,
  onStart,
  onPause,
  onResume,
  onStop,
  onComplete,
  onTimeUpdate,
  className,
  autoStart = false,
  disabled = false,
  showAsFloating = false,
  userRole = 'FREELANCER',
  showCircularProgress = false,
  compactMode = false,
}: CountdownTimerProps) {
  const { toast } = useToast()
  const timerRef = useRef<NodeJS.Timeout>()
  const pauseTimerRef = useRef<NodeJS.Timeout>()
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Performance monitoring
  const { getStats } = usePerformanceMonitor('CountdownTimer')
  
  // Accessibility instances
  const announcer = TimerAnnouncer.getInstance()
  const focusManager = FocusManager.getInstance()
  
  // Get timer context for real timer operations
  const {
    startGlobalTimer,
    resumeGlobalTimer,
    pauseGlobalTimer, 
    stopGlobalTimerAndLog,
    hasActiveTimer,
    activeTimers,
    currentTimerKey
  } = useTimer()

  // Get current timer from active timers
  const currentTimer = activeTimers?.[currentTimerKey || ''] || null

  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    timeRemaining: initialTime,
    totalTime: initialTime,
    pauseCount: 0,
    pauseTimeUsed: 0,
    jobCardId,
    jobCardTitle,
    projectId,
  })

  // Performance optimized calculations with memoization
  const calculations = useTimerCalculations(
    timerState.timeRemaining,
    timerState.totalTime,
    timerState.pauseTimeUsed
  )

  // Throttled timer state for render optimization
  const throttledTimerState = useThrottledValue(timerState, 100)

  // Circular progress calculations
  const circularProgress = useCircularProgress(
    throttledTimerState.timeRemaining,
    throttledTimerState.totalTime
  )

  // Visibility handling for timer accuracy
  const handleVisibilityChange = useCallback((isVisible: boolean, timeDiff: number) => {
    if (timerState.status === 'running' && !isVisible && timeDiff > 2000) {
      // Sync timer when tab becomes visible after being hidden
      console.log(`Timer sync: Tab was hidden for ${timeDiff}ms`)
      // In production, sync with server time here
    }
  }, [timerState.status])

  useVisibilityHandler(handleVisibilityChange)

  // Sync with global timer state
  useEffect(() => {
    if (currentTimer && currentTimerKey) {
      // Sync local timer state with global timer based on ActiveTimerInfo properties
      setTimerState(prevState => ({
        ...prevState,
        status: currentTimer.isPaused ? 'paused' : 'running',
        // Calculate time remaining if we have allocated hours and start time
        ...(currentTimer.allocatedHours && currentTimer.startTime ? {
          timeRemaining: Math.max(0, (currentTimer.allocatedHours * 3600) - 
            (Date.now() - new Date(currentTimer.startTime).getTime()) / 1000 - currentTimer.totalPausedTime)
        } : {}),
        pauseTimeUsed: currentTimer.totalPausedTime || prevState.pauseTimeUsed
      }))
    }
  }, [currentTimer, currentTimerKey])

  // Efficient timer interval management
  const timerTick = useCallback(() => {
    setTimerState(prevState => {
      if (prevState.status !== 'running') return prevState
      
      const newTimeRemaining = prevState.timeRemaining - 1

      if (newTimeRemaining <= 0) {
        const completedState = {
          ...prevState,
          timeRemaining: 0,
          status: 'completed' as const,
        }
        
        onComplete?.(completedState)
        
        toast({
          title: "Timer Completed!",
          description: `Time allocation for ${jobCardTitle || 'this task'} has been reached.`,
        })

        return completedState
      }

      const updatedState = {
        ...prevState,
        timeRemaining: newTimeRemaining,
      }

      // Warning notifications at specific intervals
      if (newTimeRemaining === 300) { // 5 minutes
        toast({
          title: "5 Minutes Remaining",
          description: "You have 5 minutes left on this timer.",
          variant: "default",
        })
      }

      if (newTimeRemaining === 60) { // 1 minute
        toast({
          title: "1 Minute Remaining", 
          description: "You have 1 minute left on this timer.",
          variant: "default",
        })
      }

      return updatedState
    })
  }, [onComplete, toast, jobCardTitle])

  useTimerInterval(timerTick, timerState.status === 'running')

  // Performance optimized event handlers
  const timerHandlers = useTimerHandlers(
    async () => {
      if (disabled) return

      try {
        if (jobCardId && jobCardTitle && projectId) {
          const success = await startGlobalTimer(jobCardId, jobCardTitle, projectId, initialTime / 3600)
          if (!success) {
            toast({
              title: "Timer Start Failed",
              description: "Unable to start timer. Check your permissions and assignment.",
              variant: "destructive",
            })
            return
          }
        }

        const newState = {
          ...timerState,
          status: 'running' as const,
          lastPauseTime: undefined,
        }
        setTimerState(newState)
        onStart?.(newState)

        toast({
          title: "Timer Started",
          description: `Timer started for ${jobCardTitle || 'task'} - ${calculations.display.formatted} allocated.`,
        })
      } catch (error) {
        console.error('Error starting timer:', error)
        toast({
          title: "Timer Start Error", 
          description: "An error occurred while starting the timer.",
          variant: "destructive",
        })
      }
    },
    () => {
      if (disabled || timerState.status !== 'running') return

      const newState = {
        ...timerState,
        status: 'paused' as const,
        pauseCount: timerState.pauseCount + 1,
        lastPauseTime: Date.now(),
      }
      setTimerState(newState)
      onPause?.(newState)

      // Start pause timer tracking
      pauseTimerRef.current = setInterval(() => {
        setTimerState(prevState => {
          if (prevState.status !== 'paused' || !prevState.lastPauseTime) return prevState

          const newPauseTimeUsed = prevState.pauseTimeUsed + 1

          if (newPauseTimeUsed >= maxPauseTime) {
            if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
            
            toast({
              title: "Pause Time Exceeded",
              description: `Maximum pause time of ${calculations.display.formatted} reached. Timer automatically stopped.`,
              variant: "destructive",
            })

            const stoppedState = {
              ...prevState,
              status: 'stopped' as const,
              pauseTimeUsed: maxPauseTime,
            }
            onStop?.(stoppedState)
            return stoppedState
          }

          if (newPauseTimeUsed === maxPauseTime - 30) { // 30 second warning
            toast({
              title: "Pause Warning",
              description: "Only 30 seconds of pause time remaining.",
              variant: "default",
            })
          }

          return {
            ...prevState,
            pauseTimeUsed: newPauseTimeUsed,
          }
        })
      }, 1000)

      toast({
        title: "Timer Paused",
        description: `Pause ${timerState.pauseCount + 1} of ${maxPauseCount}. You have ${calculations.pause.remaining} seconds pause time remaining.`,
      })
    },
    () => {
      if (disabled || timerState.status !== 'paused') return

      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)

      const newState = {
        ...timerState,
        status: 'running' as const,
        lastPauseTime: undefined,
      }
      setTimerState(newState)
      onResume?.(newState)

      toast({
        title: "Timer Resumed",
        description: "Timer has been resumed.",
      })
    },
    () => {
      if (disabled) return

      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)

      const newState = {
        ...timerState,
        status: 'stopped' as const,
      }
      setTimerState(newState)
      onStop?.(newState)

      toast({
        title: "Timer Stopped",
        description: "Timer has been manually stopped.",
      })
    },
    [
      timerState,
      disabled,
      onStart,
      onPause,
      onResume,
      onStop,
      maxPauseTime,
      maxPauseCount,
      toast,
      jobCardId,
      jobCardTitle,
      projectId,
      initialTime,
      startGlobalTimer,
      calculations
    ]
  )

  // Cleanup timers and performance monitoring
  useTimerCleanup([
    () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
      announcer.clearQueue()
      if (process.env.NODE_ENV === 'development') {
        console.log('CountdownTimer cleanup:', getStats())
      }
    }
  ])

  // Rest of the component implementation remains the same...
  // [Previous implementation continues here]

  // Initialize accessibility features
  useEffect(() => {
    initializeTimerAccessibility()
    
    // Apply high contrast and reduced motion support
    if (cardRef.current) {
      HighContrastSupport.applyHighContrastStyles(cardRef.current)
      ReducedMotionSupport.applyReducedMotionStyles(cardRef.current)
    }

    return () => {
      announcer.clearQueue()
    }
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
    }
  }, [])

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && timerState.status === 'idle') {
      handleStart()
    }
  }, [autoStart])

  // Call onTimeUpdate when timer state changes
  useEffect(() => {
    onTimeUpdate?.(timerState)
  }, [timerState, onTimeUpdate])

  // Announce timer state changes to screen readers
  useEffect(() => {
    const isOvertime = timerState.timeRemaining <= 0 && timerState.status === 'running'
    const statusMessage = ScreenReaderSupport.formatStatusForScreenReader(
      timerState.status,
      timerState.timeRemaining,
      isOvertime
    )
    
    // Don't announce initial idle state
    if (timerState.status !== 'idle' || timerState.pauseCount > 0) {
      announcer.announce({
        message: statusMessage,
        priority: timerState.status === 'running' ? AnnouncementPriority.LOW : AnnouncementPriority.HIGH,
        type: 'status'
      })
    }
  }, [timerState.status, announcer])

  // Always declare all hooks before any conditional returns
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get time units for circular display
  const getTimeUnits = useCallback((totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return { days, hours, minutes, seconds }
  }, [])

  // Calculate circular progress
  const getCircleProgress = useCallback((value: number, max: number) => {
    const percentage = Math.min((value / max) * 100, 100)
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    return { strokeDashoffset, circumference }
  }, [])

  // Apply circular progress optimization if available
  const optimizedCircularProgress = circularProgress ? 
    { ...getCircleProgress(timerState.timeRemaining, timerState.totalTime), ...circularProgress } :
    getCircleProgress(timerState.timeRemaining, timerState.totalTime)

  // Get timer status styling
  const getTimerStatus = useCallback(() => {
    const isExceeded = timerState.timeRemaining === 0 && timerState.status === 'running'
    
    if (isExceeded) return { status: 'exceeded', color: 'text-red-400', variant: 'destructive' as const }
    if (timerState.status === 'paused') return { status: 'paused', color: 'text-yellow-400', variant: 'secondary' as const }
    if (timerState.status === 'running') return { status: 'active', color: 'text-green-400', variant: 'default' as const }
    if (timerState.status === 'completed') return { status: 'completed', color: 'text-blue-400', variant: 'default' as const }
    if (timerState.status === 'stopped') return { status: 'stopped', color: 'text-red-400', variant: 'destructive' as const }
    return { status: 'idle', color: 'text-gray-400', variant: 'outline' as const }
  }, [timerState.status, timerState.timeRemaining])

  // Get role-specific timer title
  const getTimerTitle = useCallback(() => {
    const status = getTimerStatus()
    
    if (userRole === 'ADMIN') {
      if (status.status === 'exceeded') return 'Overtime Monitoring'
      return 'Admin View: Timer Active'
    }
    
    if (timerState.status === 'paused') return 'Timer Paused'
    if (status.status === 'exceeded') return 'Time Exceeded'
    if (timerState.timeRemaining > 0) return 'Time Remaining'
    return 'Timer Active'
  }, [userRole, timerState.status, timerState.timeRemaining, getTimerStatus])

  const formatTimeUnit = (value: number) => {
    return value.toString().padStart(2, '0')
  }

  const handleStart = useCallback(async () => {
    if (disabled) return

    // Clear any existing intervals before starting
    if (timerRef.current) clearInterval(timerRef.current)
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)

    try {
      // Use real timer context for starting timer
      if (jobCardId && jobCardTitle && projectId) {
        const success = await startGlobalTimer(jobCardId, jobCardTitle, projectId, initialTime / 3600)
        if (!success) {
          toast({
            title: "Timer Start Failed",
            description: "Unable to start timer. Check your permissions and assignment.",
            variant: "destructive",
          })
          
          // Announce error to screen readers
          announcer.announce(TimerAnnouncementMessages.ASSIGNMENT_ERROR())
          return
        }
      }

      const newState = {
        ...timerState,
        status: 'running' as const,
        lastPauseTime: undefined,
      }
      setTimerState(newState)
      onStart?.(newState)

      // Announce timer start
      announcer.announce(TimerAnnouncementMessages.TIMER_STARTED(jobCardTitle))

      timerRef.current = setInterval(() => {
        setTimerState(prevState => {
          const newTimeRemaining = prevState.timeRemaining - 1

          if (newTimeRemaining <= 0) {
            const completedState = {
              ...prevState,
              timeRemaining: 0,
              status: 'completed' as const,
            }
            
            if (timerRef.current) clearInterval(timerRef.current)
            onComplete?.(completedState)
            
            // Announce completion
            announcer.announce(TimerAnnouncementMessages.TIMER_COMPLETED(jobCardTitle))
            
            toast({
              title: "Timer Completed!",
              description: `Time allocation for ${jobCardTitle || 'this task'} has been reached.`,
            })

            return completedState
          }

          const updatedState = {
            ...prevState,
            timeRemaining: newTimeRemaining,
          }

          // Warning when 5 minutes remaining
          if (newTimeRemaining === 300) {
            announcer.announce(TimerAnnouncementMessages.TIME_WARNING_5MIN())
            toast({
              title: "5 Minutes Remaining",
              description: "You have 5 minutes left on this timer.",
              variant: "default",
            })
          }

          // Warning when 1 minute remaining
          if (newTimeRemaining === 60) {
            announcer.announce(TimerAnnouncementMessages.TIME_WARNING_1MIN())
            toast({
              title: "1 Minute Remaining",
              description: "You have 1 minute left on this timer.",
              variant: "default",
            })
          }

          // Time exceeded announcement
          if (newTimeRemaining === 0) {
            announcer.announce(TimerAnnouncementMessages.TIME_EXCEEDED())
          }

          return updatedState
        })
      }, 1000)

      toast({
        title: "Timer Started",
        description: `Timer started for ${jobCardTitle || 'task'} - ${formatTime(initialTime)} allocated.`,
      })
    } catch (error) {
      console.error('Error starting timer:', error)
      toast({
        title: "Timer Start Error",
        description: "An error occurred while starting the timer.",
        variant: "destructive",
      })
    }
  }, [timerState, disabled, onStart, onComplete, toast, jobCardTitle, initialTime, formatTime, jobCardId, projectId, startGlobalTimer, announcer])

  const handlePause = useCallback(async () => {
    if (disabled || timerState.status !== 'running') return

    if (timerRef.current) clearInterval(timerRef.current)

    // Use global timer pause if available
    if (projectId && jobCardId && pauseGlobalTimer) {
      try {
        await pauseGlobalTimer(projectId, jobCardId)
      } catch (error) {
        console.error('Failed to pause global timer:', error)
      }
    }

    const newState = {
      ...timerState,
      status: 'paused' as const,
      pauseCount: timerState.pauseCount + 1,
      lastPauseTime: Date.now(),
    }
    setTimerState(newState)
    onPause?.(newState)

    // Announce pause to screen readers
    const remainingPauseTime = formatTime(maxPauseTime - timerState.pauseTimeUsed)
    announcer.announce(TimerAnnouncementMessages.TIMER_PAUSED(newState.pauseCount, remainingPauseTime))

    // Start pause timer to track pause duration
    pauseTimerRef.current = setInterval(() => {
      setTimerState(prevState => {
        if (prevState.status !== 'paused' || !prevState.lastPauseTime) return prevState

        const newPauseTimeUsed = prevState.pauseTimeUsed + 1

        // Check if pause time limit exceeded
        if (newPauseTimeUsed >= maxPauseTime) {
          if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)
          
          // Announce pause limit exceeded
          announcer.announce(TimerAnnouncementMessages.PAUSE_LIMIT_EXCEEDED())
          
          toast({
            title: "Pause Time Exceeded",
            description: `Maximum pause time of ${formatTime(maxPauseTime)} reached. Timer automatically stopped.`,
            variant: "destructive",
          })

          const stoppedState = {
            ...prevState,
            status: 'stopped' as const,
            pauseTimeUsed: maxPauseTime,
          }
          onStop?.(stoppedState)
          return stoppedState
        }

        // Warning when approaching pause limit
        if (newPauseTimeUsed === maxPauseTime - PAUSE_WARNING_THRESHOLD) {
          const warningTime = formatTime(PAUSE_WARNING_THRESHOLD)
          announcer.announce(TimerAnnouncementMessages.PAUSE_WARNING(warningTime))
          
          toast({
            title: "Pause Warning",
            description: `Only ${PAUSE_WARNING_THRESHOLD} seconds of pause time remaining.`,
            variant: "default",
          })
        }

        return {
          ...prevState,
          pauseTimeUsed: newPauseTimeUsed,
        }
      })
    }, 1000)

    toast({
      title: "Timer Paused",
      description: `Pause ${timerState.pauseCount + 1} of ${maxPauseCount}. You have ${formatTime(maxPauseTime - timerState.pauseTimeUsed)} pause time remaining.`,
    })
  }, [timerState, disabled, maxPauseTime, maxPauseCount, onPause, onStop, toast, formatTime, announcer])

  const handleResume = useCallback(async () => {
    if (disabled || timerState.status !== 'paused') return

    // Clear any existing intervals before resuming
    if (timerRef.current) clearInterval(timerRef.current)
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)

    // Use global timer resume if available
    if (currentTimerKey && resumeGlobalTimer && jobCardId && projectId) {
      try {
        await resumeGlobalTimer(jobCardId, projectId)
      } catch (error) {
        console.error('Failed to resume global timer:', error)
      }
    }

    const newState = {
      ...timerState,
      status: 'running' as const,
      lastPauseTime: undefined,
    }
    setTimerState(newState)
    onResume?.(newState)

    // Announce resume to screen readers
    announcer.announce(TimerAnnouncementMessages.TIMER_RESUMED())

    // Resume main timer
    timerRef.current = setInterval(() => {
      setTimerState(prevState => {
        const newTimeRemaining = prevState.timeRemaining - 1

        if (newTimeRemaining <= 0) {
          const completedState = {
            ...prevState,
            timeRemaining: 0,
            status: 'completed' as const,
          }
          
          if (timerRef.current) clearInterval(timerRef.current)
          onComplete?.(completedState)
          
          // Announce completion
          announcer.announce(TimerAnnouncementMessages.TIMER_COMPLETED(jobCardTitle))
          
          toast({
            title: "Timer Completed!",
            description: `Time allocation for ${jobCardTitle || 'this task'} has been reached.`,
          })

          return completedState
        }

        return {
          ...prevState,
          timeRemaining: newTimeRemaining,
        }
      })
    }, 1000)

    toast({
      title: "Timer Resumed",
      description: "Timer has been resumed.",
    })
  }, [timerState, disabled, onResume, onComplete, toast, jobCardTitle, announcer])

  const handleStop = useCallback(async () => {
    if (disabled) return

    if (timerRef.current) clearInterval(timerRef.current)
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current)

    // Use global timer stop if available
    if (currentTimerKey && stopGlobalTimerAndLog && jobCardId && projectId) {
      try {
        await stopGlobalTimerAndLog(projectId, jobCardId, {
          notes: `Timer stopped manually after ${formatTime(timerState.totalTime - timerState.timeRemaining)}`,
          file: undefined
        }, mockUser, () => {}) // Use mock user and no-op for demo
      } catch (error) {
        console.error('Failed to stop global timer:', error)
      }
    }

    const newState = {
      ...timerState,
      status: 'stopped' as const,
    }
    setTimerState(newState)
    onStop?.(newState)

    // Announce stop to screen readers
    announcer.announce(TimerAnnouncementMessages.TIMER_STOPPED())

    toast({
      title: "Timer Stopped",
      description: "Timer has been manually stopped.",
    })
  }, [timerState, disabled, onStop, toast, announcer])

  // Extract optimized handlers for button actions (after handle functions are defined)
  const handleOptimizedStart = timerHandlers?.handleStart || handleStart
  const handleOptimizedPause = timerHandlers?.handlePause || handlePause  
  const handleOptimizedResume = timerHandlers?.handleResume || handleResume
  const handleOptimizedStop = timerHandlers?.handleStop || handleStop

  // Calculate timer state conditions
  const progressValue = ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100
  const pauseTimeRemaining = maxPauseTime - timerState.pauseTimeUsed
  const canPause = timerState.status === 'running' && timerState.pauseCount < maxPauseCount && pauseTimeRemaining > 0
  const canResume = timerState.status === 'paused' && pauseTimeRemaining > 0

  // Check for timer conflicts using global timer state
  const hasTimerConflict = hasActiveTimer && currentTimerKey !== `${jobCardId}-${projectId}` && timerState.status === 'idle'

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle standard timer controls
    KeyboardNavigation.handleTimerControlKeys(event, {
      onStart: timerState.status === 'idle' ? handleStart : undefined,
      onPause: timerState.status === 'running' && canPause ? handlePause : undefined,
      onResume: timerState.status === 'paused' && canResume ? handleResume : undefined,
      onStop: timerState.status !== 'idle' ? handleStop : undefined,
      onReset: (timerState.status === 'completed' || timerState.status === 'stopped') ? () => {
        setTimerState({
          status: 'idle',
          timeRemaining: initialTime,
          totalTime: initialTime,
          pauseCount: 0,
          pauseTimeUsed: 0,
          jobCardId,
          jobCardTitle,
          projectId,
        })
      } : undefined
    })

    // Handle focus management for arrow key navigation
    focusManager.handleKeyboardNavigation(event, cardRef)
  }, [timerState.status, handleStart, handlePause, handleResume, handleStop, canPause, canResume, initialTime, jobCardId, jobCardTitle, projectId, focusManager])

  // Add keyboard event listener
  useEffect(() => {
    if (cardRef.current) {
      const element = cardRef.current
      element.addEventListener('keydown', handleKeyDown)
      return () => element.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const timerStatus = getTimerStatus()
  const { days, hours, minutes, seconds } = getTimeUnits(timerState.timeRemaining)

  // Format time for screen readers
  const timeForScreenReader = ScreenReaderSupport.formatTimeForScreenReader(timerState.timeRemaining)
  const progressForScreenReader = ScreenReaderSupport.formatProgressForScreenReader(
    timerState.totalTime - timerState.timeRemaining,
    timerState.totalTime,
    'seconds'
  )

  // High contrast colors
  const statusColors = HighContrastSupport.getHighContrastColors(
    timerState.status === 'running' ? 'running' :
    timerState.status === 'paused' ? 'paused' :
    timerState.timeRemaining <= 0 ? 'exceeded' : 'idle'
  )

  // Reduced motion classes
  const animationClasses = ReducedMotionSupport.getAnimationClasses(
    'transition-all duration-1000 ease-in-out'
  )

  // Circular Progress Ring Component
  const CircularProgressRing = ({ value, max, label, size = 80 }: { value: number; max: number; label: string; size?: number }) => {
    const { strokeDashoffset, circumference } = value === timerState.timeRemaining && max === timerState.totalTime ? 
      optimizedCircularProgress : getCircleProgress(value, max)
    const radius = size * 0.45
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg 
            className={cn("w-full h-full transform -rotate-90", animationClasses)} 
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`${label}: ${formatTimeUnit(value)} of ${max}`}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="4 4"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={statusColors.color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={animationClasses}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={`text-xl font-bold ${timerStatus.color}`}
              aria-hidden="true"
            >
              {formatTimeUnit(value)}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground mt-2 font-medium">{label}</span>
      </div>
    )
  }

  // Floating Timer Display (legacy style)
  if (showAsFloating) {
    return (
      <div className="fixed top-20 right-4 z-50 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70 rounded-2xl shadow-2xl p-6 text-primary-foreground border border-border/20 backdrop-blur-sm" data-tour="timer">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-1">
            {getTimerTitle()}
          </h3>
          {jobCardTitle && (
            <div className="text-xs opacity-70 truncate max-w-[200px]" title={jobCardTitle}>
              {jobCardTitle}
            </div>
          )}
        </div>

        {/* Circular Timer Display */}
        {showCircularProgress ? (
          <div className="flex justify-center space-x-4 mb-6">
            <CircularProgressRing value={days} max={30} label="Days" />
            <CircularProgressRing value={hours} max={24} label="Hours" />
            <CircularProgressRing value={minutes} max={60} label="Minutes" />
            <CircularProgressRing value={seconds} max={60} label="Seconds" />
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="text-4xl font-mono font-bold mb-2" aria-live="polite">
              {formatTime(timerState.timeRemaining)}
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-3">
          {timerState.status === 'idle' && (
            <Button onClick={handleStart} disabled={disabled} className="flex-1" aria-label="Start timer">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {timerState.status === 'running' && (
            <>
              <Button onClick={handlePause} disabled={disabled || !canPause} variant="secondary" className="flex-1" aria-label="Pause timer">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button onClick={handleStop} disabled={disabled} variant="destructive" className="flex-1" aria-label="Stop timer">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}

          {timerState.status === 'paused' && (
            <>
              <Button onClick={handleResume} disabled={disabled || !canResume} className="flex-1" aria-label="Resume timer">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button onClick={handleStop} disabled={disabled} variant="destructive" className="flex-1" aria-label="Stop timer">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Additional Info */}
        {initialTime && (
          <div className="mt-4 text-center">
            <div className="text-xs opacity-70">
              {timerState.timeRemaining === 0 && timerState.status === 'running' ? (
                <span className="text-red-400 font-semibold">⚠️ Overtime!</span>
              ) : (
                `Allocated: ${Math.round(initialTime / 3600 * 10) / 10}h`
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Standard Card Display
  return (
    <TooltipProvider>
      <Card 
        ref={cardRef}
        className={cn(
          'w-full max-w-md', 
          showAsFloating && 'fixed top-20 right-4 z-50 shadow-2xl',
          compactMode && 'max-w-sm',
          className
        )} 
        role="timer" 
        aria-label="Countdown Timer"
        aria-describedby="timer-status timer-time-remaining"
        data-timer-controls="true"
        tabIndex={-1}
      >
        {/* Hidden live region for announcements */}
        <div
          id="timer-status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {ScreenReaderSupport.formatStatusForScreenReader(
            timerState.status,
            timerState.timeRemaining,
            timerState.timeRemaining <= 0 && timerState.status === 'running'
          )}
        </div>

        <div
          id="timer-time-remaining"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {timeForScreenReader}
        </div>

        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <TimerIcon className="h-5 w-5" aria-hidden="true" />
            {getTimerTitle()}
          </CardTitle>
          {jobCardTitle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {jobCardTitle}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{jobCardTitle}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Circular Progress Display */}
          {showCircularProgress ? (
            <div 
              className="flex justify-center space-x-2 mb-6"
              role="group"
              aria-label="Timer progress breakdown"
            >
              <CircularProgressRing value={days} max={30} label="Days" size={compactMode ? 60 : 80} />
              <CircularProgressRing value={hours} max={24} label="Hours" size={compactMode ? 60 : 80} />
              <CircularProgressRing value={minutes} max={60} label="Minutes" size={compactMode ? 60 : 80} />
              <CircularProgressRing value={seconds} max={60} label="Seconds" size={compactMode ? 60 : 80} />
            </div>
          ) : (
            // Standard Linear Progress Display
            <div className="text-center space-y-2">
              <div 
                className="text-4xl font-mono font-bold" 
                aria-live="polite" 
                aria-label={`Time remaining: ${timeForScreenReader}`}
                role="timer"
              >
                {formatTime(timerState.timeRemaining)}
              </div>
              <Progress 
                value={progressValue} 
                className={cn("w-full", animationClasses)}
                aria-valuemin={0} 
                aria-valuemax={100} 
                aria-valuenow={Math.round(progressValue)}
                aria-label={progressForScreenReader}
                style={{
                  backgroundColor: statusColors.backgroundColor,
                  borderColor: statusColors.borderColor
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span aria-hidden="true">0:00</span>
                <span aria-hidden="true">{formatTime(timerState.totalTime)}</span>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={timerStatus.variant}
              className="text-xs"
              role="status"
              aria-label={`Timer status: ${timerState.status}`}
              style={{
                color: statusColors.color,
                backgroundColor: statusColors.backgroundColor,
                borderColor: statusColors.borderColor
              }}
            >
              {timerState.status.charAt(0).toUpperCase() + timerState.status.slice(1)}
            </Badge>
          </div>

          {/* Pause Information */}
          {timerState.pauseCount > 0 && (
            <Alert role="status" aria-label="Pause information">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Pauses: {timerState.pauseCount}/{maxPauseCount} | 
                Pause time used: {formatTime(timerState.pauseTimeUsed)}/{formatTime(maxPauseTime)}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for low pause time */}
          {timerState.status === 'paused' && pauseTimeRemaining <= PAUSE_WARNING_THRESHOLD && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Warning: Only {formatTime(pauseTimeRemaining)} pause time remaining!
              </AlertDescription>
            </Alert>
          )}

          {/* Timer Conflict Warning */}
          {hasTimerConflict && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Another timer is currently active. Stop the active timer before starting this one.
              </AlertDescription>
            </Alert>
          )}

          {/* Role-specific Admin Override */}
          {userRole === 'ADMIN' && timerState.status !== 'idle' && (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Admin Override: You can manage this timer regardless of assignment rules.
              </AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center" role="toolbar" aria-label="Timer controls">
            {timerState.status === 'idle' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => handleOptimizedStart()} 
                    disabled={disabled} 
                    className="flex-1" 
                    aria-label="Start timer"
                    data-action="start"
                    ref={(el) => {
                      if (el) {
                        KeyboardNavigation.setupTimerControlAria(el, 'start', {
                          disabled,
                          timeRemaining: timeForScreenReader,
                          isRunning: timerState.status === 'running'
                        })
                      }
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                    Start
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start the countdown timer</p>
                </TooltipContent>
              </Tooltip>
            )}

            {timerState.status === 'running' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => handleOptimizedPause()} 
                      disabled={disabled || !canPause} 
                      variant="secondary" 
                      className="flex-1" 
                      aria-label="Pause timer"
                      data-action="pause"
                      ref={(el) => {
                        if (el) {
                          KeyboardNavigation.setupTimerControlAria(el, 'pause', {
                            disabled: disabled || !canPause,
                            pauseTimeRemaining: formatTime(pauseTimeRemaining),
                            isRunning: true
                          })
                        }
                      }}
                    >
                      <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                      Pause
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pause timer ({formatTime(pauseTimeRemaining)} pause time left)</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => handleOptimizedStop()} 
                      disabled={disabled} 
                      variant="destructive" 
                      className="flex-1" 
                      aria-label="Stop timer"
                      data-action="stop"
                      ref={(el) => {
                        if (el) {
                          KeyboardNavigation.setupTimerControlAria(el, 'stop', {
                            disabled,
                            isRunning: true
                          })
                        }
                      }}
                    >
                      <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                      Stop
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stop and log timer</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {timerState.status === 'paused' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => handleOptimizedResume()} 
                      disabled={disabled || !canResume} 
                      className="flex-1" 
                      aria-label="Resume timer"
                      data-action="resume"
                      ref={(el) => {
                        if (el) {
                          KeyboardNavigation.setupTimerControlAria(el, 'resume', {
                            disabled: disabled || !canResume
                          })
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                      Resume
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resume timer</p>
                  </TooltipContent>
                </Tooltip>
                
                <Button 
                  onClick={() => handleOptimizedStop()} 
                  disabled={disabled} 
                  variant="destructive" 
                  className="flex-1" 
                  aria-label="Stop timer"
                  data-action="stop"
                  ref={(el) => {
                    if (el) {
                      KeyboardNavigation.setupTimerControlAria(el, 'stop', {
                        disabled
                      })
                    }
                  }}
                >
                  <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                  Stop
                </Button>
              </>
            )}

            {(timerState.status === 'completed' || timerState.status === 'stopped') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => {
                      setTimerState({
                        status: 'idle',
                        timeRemaining: initialTime,
                        totalTime: initialTime,
                        pauseCount: 0,
                        pauseTimeUsed: 0,
                        jobCardId,
                        jobCardTitle,
                        projectId,
                      })
                    }} 
                    disabled={disabled} 
                    className="flex-1"
                    aria-label="Reset timer"
                    data-action="reset"
                    ref={(el) => {
                      if (el) {
                        KeyboardNavigation.setupTimerControlAria(el, 'reset', {
                          disabled
                        })
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset timer to initial state</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Timer Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1" role="group" aria-label="Timer configuration">
            <p>Max pause time: {formatTime(maxPauseTime)} | Max pauses: {maxPauseCount}</p>
            {projectId && <p>Project: {projectId}</p>}
            {userRole === 'ADMIN' && <p className="text-orange-600 font-medium">Admin Mode Active</p>}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
});

export default CountdownTimer
