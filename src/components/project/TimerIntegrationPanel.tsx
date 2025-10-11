import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  MinimizeIcon,
  MaximizeIcon,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowProject } from './ProjectWorkflow'

interface ActiveTimer {
  taskId: string
  taskTitle: string
  projectId: string
  projectTitle: string
  startTime: Date
  isPaused: boolean
  pausedDuration: number // in milliseconds
  totalElapsed: number // in milliseconds
}

interface TimerIntegrationPanelProps {
  activeTimers: Record<string, any>
  projects: WorkflowProject[]
  className?: string
  onTimerStart?: (taskId: string, projectId: string) => void
  onTimerPause?: (taskId: string) => void
  onTimerResume?: (taskId: string) => void
  onTimerStop?: (taskId: string) => void
}

/**
 * TimerIntegrationPanel - Floating timer panel for active task timing
 * Shows active timers with controls and elapsed time tracking
 */
export const TimerIntegrationPanel: React.FC<TimerIntegrationPanelProps> = ({
  activeTimers,
  projects,
  className,
  onTimerStart,
  onTimerPause,
  onTimerResume,
  onTimerStop
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTimersList, setActiveTimersList] = useState<ActiveTimer[]>([])

  // Update current time every second for elapsed time calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Mock active timers for demonstration
  useEffect(() => {
    // In real implementation, this would come from props or context
    const mockTimers: ActiveTimer[] = [
      {
        taskId: 't1',
        taskTitle: 'Conceptual Design',
        projectId: '1',
        projectTitle: 'Modern Office Building Design',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isPaused: false,
        pausedDuration: 15 * 60 * 1000, // 15 minutes paused
        totalElapsed: 2 * 60 * 60 * 1000 - 15 * 60 * 1000 // 1h 45m
      }
    ]
    setActiveTimersList(mockTimers)
  }, [])

  const formatElapsedTime = (timer: ActiveTimer): string => {
    const now = currentTime.getTime()
    const startTime = timer.startTime.getTime()
    const elapsed = timer.isPaused 
      ? timer.totalElapsed 
      : now - startTime - timer.pausedDuration

    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimerProgress = (timer: ActiveTimer): number => {
    // Assuming 8 hours as a standard work day for progress calculation
    const standardWorkDay = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    const elapsed = timer.isPaused 
      ? timer.totalElapsed 
      : currentTime.getTime() - timer.startTime.getTime() - timer.pausedDuration
    
    return Math.min(100, (elapsed / standardWorkDay) * 100)
  }

  const handleTimerAction = (timer: ActiveTimer, action: 'pause' | 'resume' | 'stop') => {
    switch (action) {
      case 'pause':
        onTimerPause?.(timer.taskId)
        setActiveTimersList(prev => prev.map(t => 
          t.taskId === timer.taskId 
            ? { ...t, isPaused: true, totalElapsed: currentTime.getTime() - t.startTime.getTime() - t.pausedDuration }
            : t
        ))
        break
      case 'resume':
        onTimerResume?.(timer.taskId)
        setActiveTimersList(prev => prev.map(t => 
          t.taskId === timer.taskId 
            ? { ...t, isPaused: false }
            : t
        ))
        break
      case 'stop':
        onTimerStop?.(timer.taskId)
        setActiveTimersList(prev => prev.filter(t => t.taskId !== timer.taskId))
        break
    }
  }

  // Don't render if no active timers
  if (activeTimersList.length === 0) {
    return null
  }

  return (
    <Card className={cn(
      'timer-integration-panel shadow-lg border-2',
      isMinimized ? 'w-64' : 'w-80',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4" />
            Active Timers ({activeTimersList.length})
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? (
                <MaximizeIcon className="w-3 h-3" />
              ) : (
                <MinimizeIcon className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="pt-0 space-y-3">
          {activeTimersList.map((timer) => (
            <div
              key={timer.taskId}
              className="border rounded-lg p-3 space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              {/* Timer Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium text-sm leading-tight">
                    {timer.taskTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {timer.projectTitle}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTimerAction(timer, 'stop')}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Timer Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {formatElapsedTime(timer)}
                  </span>
                </div>
                
                <Badge variant={timer.isPaused ? "secondary" : "default"}>
                  {timer.isPaused ? 'Paused' : 'Running'}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={getTimerProgress(timer)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress today</span>
                  <span>{Math.round(getTimerProgress(timer))}%</span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                {timer.isPaused ? (
                  <Button
                    size="sm"
                    onClick={() => handleTimerAction(timer, 'resume')}
                    className="h-7 px-3 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTimerAction(timer, 'pause')}
                    className="h-7 px-3 text-xs"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTimerAction(timer, 'stop')}
                  className="h-7 px-3 text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          ))}

          {/* Timer Statistics */}
          <div className="border-t pt-3 mt-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Total Active:</span>
                <span className="font-medium">{activeTimersList.length} timer(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Running:</span>
                <span className="font-medium text-green-600">
                  {activeTimersList.filter(t => !t.isPaused).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paused:</span>
                <span className="font-medium text-yellow-600">
                  {activeTimersList.filter(t => t.isPaused).length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {/* Minimized View */}
      {isMinimized && activeTimersList.length > 0 && (
        <CardContent className="pt-0 pb-3">
          <div className="text-center">
            <div className="font-mono text-lg font-bold text-blue-600">
              {formatElapsedTime(activeTimersList[0])}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {activeTimersList[0].taskTitle}
            </p>
            {activeTimersList.length > 1 && (
              <p className="text-xs text-muted-foreground">
                +{activeTimersList.length - 1} more
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default TimerIntegrationPanel
