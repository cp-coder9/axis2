"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  Square,
  Clock,
  Timer,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/AppContext"
import { useTimerSync } from "@/contexts/modules/timerSync"
import { cn } from "@/lib/utils"
import { ShadcnEnhancedStopTimerModal } from "@/components/timer/ShadcnEnhancedStopTimerModal"
import { useToast } from "@/components/ui/use-toast"
import { canFreelancerStartTimer } from '@/utils/timerSlotValidation'

interface FreelancerTimerWidgetProps {
  compact?: boolean
  className?: string
}

export function FreelancerTimerWidget({
  compact = false,
  className
}: FreelancerTimerWidgetProps) {
  const { user } = useAppContext()
  const { toast } = useToast()
  const {
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isLoading,
    syncStatus
  } = useTimerSync()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showStopModal, setShowStopModal] = useState(false)

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Format duration from milliseconds to HH:MM:SS
  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate elapsed time if timer is active
  const getElapsedTime = () => {
    if (!activeTimer?.startTime) return 0
    const startTime = new Date(activeTimer.startTime).getTime()
    return currentTime.getTime() - startTime
  }

  // Calculate progress percentage
  const getProgress = () => {
    if (!activeTimer?.allocatedHours) return 0
    const elapsedHours = getElapsedTime() / (1000 * 60 * 60)
    return Math.min((elapsedHours / activeTimer.allocatedHours) * 100, 100)
  }

  // Calculate current earnings
  const getCurrentEarnings = () => {
    if (!activeTimer || !user?.hourlyRate) return 0
    const elapsedHours = getElapsedTime() / (1000 * 60 * 60)
    return elapsedHours * user.hourlyRate
  }

  // Get timer status for display
  const getTimerStatus = () => {
    if (!activeTimer) return 'inactive'
    if (activeTimer.isPaused) return 'paused'
    if (activeTimer.isRunning) return 'running'
    return 'stopped'
  }

  const handleStopTimer = () => {
    if (!activeTimer) return
    setShowStopModal(true)
  }

  const handleStopTimerSubmit = async (details: { notes: string; file: File }) => {
    try {
      const success = await stopTimer(details.notes, "stopped")
      if (success) {
        setShowStopModal(false)
        toast({
          title: "Timer Stopped",
          description: "Time log entry has been saved with your file."
        })
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
      toast({
        title: "Error Stopping Timer",
        description: "Failed to stop the timer. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePauseTimer = async () => {
    if (!activeTimer) return

    try {
      if (activeTimer.isPaused) {
        await resumeTimer()
      } else {
        await pauseTimer()
      }
    } catch (error) {
      console.error('Failed to pause/resume timer:', error)
    }
  }

  // Handler for starting timer / navigating to timer page — validates slot availability first
  const handleStartNavigation = async (e?: React.MouseEvent) => {
    // Prevent default navigation for anchor if provided
    if (e) e.preventDefault()

    if (!user) {
      toast({ title: 'Not Authenticated', description: 'Please sign in to start a timer.', variant: 'destructive' })
      return
    }

    try {
      const result = await canFreelancerStartTimer(user.id, undefined, undefined)
      if (!result.canStart) {
        toast({
          title: 'Cannot Start Timer',
          description: result.reason || 'No available time slots for you on this project.',
          variant: 'destructive'
        })
        return
      }

      // If allowed, navigate to freelancer timer page
      window.location.href = '/freelancer/timer'
    } catch (error) {
      console.error('Error validating start:', error)
      toast({ title: 'Error', description: 'Unable to verify time slot availability.', variant: 'destructive' })
    }
  }

  if (compact) {
    return (
      <div className={cn("px-2 group-data-[collapsible=icon]:hidden", className)}>
        {activeTimer ? (
          <Card className={cn(
            "transition-colors",
            getTimerStatus() === 'running' && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
            getTimerStatus() === 'paused' && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
          )}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Timer className={cn(
                    "h-4 w-4",
                    getTimerStatus() === 'running' && "text-green-600",
                    getTimerStatus() === 'paused' && "text-yellow-600"
                  )} />
                  <Badge variant="secondary" className={cn(
                    getTimerStatus() === 'running' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    getTimerStatus() === 'paused' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  )}>
                    {getTimerStatus() === 'running' ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePauseTimer}
                    className="h-6 px-2 text-xs"
                    disabled={isLoading}
                  >
                    {activeTimer.isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStopTimer}
                    className="h-6 px-2 text-xs"
                    disabled={isLoading}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className={cn(
                  "text-lg font-mono font-bold",
                  getTimerStatus() === 'running' && "text-green-800 dark:text-green-200",
                  getTimerStatus() === 'paused' && "text-yellow-800 dark:text-yellow-200"
                )}>
                  {formatDuration(getElapsedTime())}
                </div>

                <div className="text-xs text-muted-foreground truncate">
                  {activeTimer.jobCardTitle}
                </div>

                {/* Earnings Display */}
                {user?.hourlyRate && (
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">
                    ${getCurrentEarnings().toFixed(2)} earned
                  </div>
                )}

                {activeTimer.allocatedHours && (
                  <div className="space-y-1">
                    <Progress value={getProgress()} className="h-1" />
                    <div className="text-xs text-muted-foreground">
                      {(getElapsedTime() / (1000 * 60 * 60)).toFixed(1)}h / {activeTimer.allocatedHours}h
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-3 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No active timer</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-6 px-2 text-xs"
                onClick={handleStartNavigation}
              >
                <Play className="h-3 w-3 mr-1" />
                Start Timer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Full widget version (for dashboard)
  return (
    <>
      <ShadcnEnhancedStopTimerModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onSubmit={handleStopTimerSubmit}
        timeExceeded={activeTimer ? (getProgress() > 100) : false}
        allocatedHours={activeTimer?.allocatedHours}
        actualHours={activeTimer ? getElapsedTime() / (1000 * 60 * 60) : 0}
      />

      <Card className={cn(
        activeTimer
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          : "border-dashed",
        className
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className={cn(
              "h-5 w-5",
              activeTimer ? "text-green-600" : "text-muted-foreground"
            )} />
            {activeTimer ? "Active Timer" : "Timer"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeTimer ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className={cn(
                    "text-2xl font-mono font-bold",
                    getTimerStatus() === 'running' && "text-green-800 dark:text-green-200",
                    getTimerStatus() === 'paused' && "text-yellow-800 dark:text-yellow-200"
                  )}>
                    {formatDuration(getElapsedTime())}
                  </div>
                  {user?.hourlyRate && (
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${getCurrentEarnings().toFixed(2)} earned
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePauseTimer}
                    disabled={isLoading}
                  >
                    {activeTimer.isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopTimer}
                    disabled={isLoading}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop & Log
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  {activeTimer.jobCardTitle}
                </div>

                {activeTimer.allocatedHours && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {(getElapsedTime() / (1000 * 60 * 60)).toFixed(1)} / {activeTimer.allocatedHours} hours
                      </span>
                    </div>
                    <Progress value={getProgress()} className="h-2" />

                    {getProgress() > 90 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        <span>Approaching allocated time limit</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No active timer. Start tracking time on a project.
              </p>
              <Button onClick={handleStartNavigation}>
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}