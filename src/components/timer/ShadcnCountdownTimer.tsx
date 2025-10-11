import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { UserRole } from '../../types';
import { ShadcnStopTimerModal } from './ShadcnStopTimerModal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Progress,
  Alert,
  AlertDescription,
  cn
} from '../../lib/shadcn';
import {
  Play,
  Pause,
  Square,
  Clock,
  AlertTriangle,
  Timer
} from 'lucide-react';

interface ShadcnCountdownTimerProps {
  className?: string;
}

export const ShadcnCountdownTimer: React.FC<ShadcnCountdownTimerProps> = ({
  className = ''
}) => {
  const {
    activeTimers,
    currentTimerKey,
    pauseGlobalTimer,
    resumeGlobalTimer,
    stopGlobalTimerAndLog,
    user
  } = useAppContext();

  const activeTimerInfo = currentTimerKey ? activeTimers[currentTimerKey] : null;
  const [seconds, setSeconds] = useState(0);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [showPauseWarning, setShowPauseWarning] = useState(false);
  const [timeExceeded, setTimeExceeded] = useState(false);

  useEffect(() => {
    if (activeTimerInfo && !activeTimerInfo.isPaused) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeTimerInfo.startTime);
        const totalElapsed = now.getTime() - start.getTime() - activeTimerInfo.totalPausedTime;
        const elapsedSeconds = Math.floor(totalElapsed / 1000);

        // If allocated hours exist, show countdown, otherwise show count up
        if (activeTimerInfo.allocatedHours) {
          const allocatedSeconds = activeTimerInfo.allocatedHours * 3600;
          const remainingSeconds = Math.max(0, allocatedSeconds - elapsedSeconds);
          setSeconds(remainingSeconds);

          // Check if allocated time is exceeded
          if (remainingSeconds === 0 && !timeExceeded) {
            setTimeExceeded(true);
          }
        } else {
          // No allocated time, show elapsed time
          setSeconds(elapsedSeconds);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimerInfo, timeExceeded]);

  // Handle pause warning after 2 minutes and auto-resume after 5 minutes
  useEffect(() => {
    if (activeTimerInfo?.isPaused && !activeTimerInfo.pauseWarningShown) {
      const warningTimer = setTimeout(() => {
        setShowPauseWarning(true);
      }, 2 * 60 * 1000); // 2 minutes

      // Auto-resume after 5 minutes
      const autoResumeTimer = setTimeout(() => {
        if (currentTimerKey) {
          resumeGlobalTimer(currentTimerKey);
        }
        setShowPauseWarning(false);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        clearTimeout(warningTimer);
        clearTimeout(autoResumeTimer);
      };
    }
  }, [activeTimerInfo?.isPaused, activeTimerInfo?.pauseWarningShown, resumeGlobalTimer, currentTimerKey]);

  // Don't show timer for client users - moved after hooks
  if (user?.role === UserRole.CLIENT) return null;

  if (!activeTimerInfo) return null;

  const handleStop = async (details: { notes?: string; file?: File }) => {
    if (currentTimerKey) {
      const [projectId, jobCardId] = currentTimerKey.split('-');
      await stopGlobalTimerAndLog(projectId, jobCardId, details);
    }
    setIsStopModalOpen(false);
    setTimeExceeded(false);
  };

  const handlePause = () => {
    if (currentTimerKey) {
      pauseGlobalTimer(currentTimerKey);
    }
    setShowPauseWarning(false);
  };

  const handleResume = () => {
    if (currentTimerKey) {
      resumeGlobalTimer(currentTimerKey);
    }
    setShowPauseWarning(false);
  };

  const formatTimeUnit = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const getTimeUnits = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return { days, hours, minutes, seconds: secs };
  };

  const getTimerStatus = () => {
    if (timeExceeded) return {
      status: 'exceeded',
      variant: 'destructive' as const,
      icon: AlertTriangle,
      color: 'text-destructive'
    };
    if (activeTimerInfo.isPaused) return {
      status: 'paused',
      variant: 'secondary' as const,
      icon: Pause,
      color: 'text-yellow-600'
    };
    return {
      status: 'active',
      variant: 'default' as const,
      icon: Timer,
      color: 'text-primary'
    };
  };

  const getProgressValue = () => {
    if (activeTimerInfo.allocatedHours) {
      const allocatedSeconds = activeTimerInfo.allocatedHours * 3600;
      const elapsedSeconds = allocatedSeconds - seconds;
      return Math.min((elapsedSeconds / allocatedSeconds) * 100, 100);
    }
    return 0;
  };

  const { days, hours, minutes, seconds: secs } = getTimeUnits(seconds);
  const timerStatus = getTimerStatus();
  const StatusIcon = timerStatus.icon;

  return (
    <>
      <Card
        className={cn(
          "fixed top-20 right-4 z-50 w-80 shadow-2xl border-primary/20 backdrop-blur-sm",
          "bg-gradient-to-br from-background to-secondary/20",
          className
        )}
        data-tour="timer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <StatusIcon className={cn("h-5 w-5", timerStatus.color)} />
              {activeTimerInfo.isPaused ? 'Timer Paused' :
                timeExceeded ? 'Time Exceeded' :
                  activeTimerInfo.allocatedHours ? 'Countdown Timer' : 'Active Timer'}
            </CardTitle>
          </div>
          <CardDescription
            className="truncate max-w-full"
            title={activeTimerInfo.jobCardTitle}
          >
            {activeTimerInfo.jobCardTitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Time Display */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-mono font-bold tabular-nums",
                timerStatus.color
              )}>
                {formatTimeUnit(days)}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Days</div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-mono font-bold tabular-nums",
                timerStatus.color
              )}>
                {formatTimeUnit(hours)}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Hours</div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-mono font-bold tabular-nums",
                timerStatus.color
              )}>
                {formatTimeUnit(minutes)}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Mins</div>
            </div>
            <div className="space-y-1">
              <div className={cn(
                "text-2xl font-mono font-bold tabular-nums",
                timerStatus.color
              )}>
                {formatTimeUnit(secs)}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Secs</div>
            </div>
          </div>

          {/* Progress Bar */}
          {activeTimerInfo.allocatedHours && (
            <div className="space-y-2">
              <Progress
                value={getProgressValue()}
                className={cn(
                  "h-2",
                  timeExceeded && "bg-destructive/20"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0h</span>
                <span>{activeTimerInfo.allocatedHours}h allocated</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-2">
            {activeTimerInfo.isPaused ? (
              <Button
                onClick={handleResume}
                size="sm"
                className="flex items-center gap-2"
                aria-label="Resume Timer"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                aria-label="Pause Timer"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            <Button
              onClick={() => setIsStopModalOpen(true)}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Stop Timer"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>

          {/* Status Information */}
          {timeExceeded && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Overtime! You've exceeded the allocated time.
              </AlertDescription>
            </Alert>
          )}

          {activeTimerInfo.allocatedHours && !timeExceeded && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Allocated: {activeTimerInfo.allocatedHours}h
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause Warning Alert Dialog */}
      {showPauseWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Timer Paused Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your timer has been paused for 2 minutes. The timer will automatically resume in 3 minutes (5 minutes total pause time) if not manually resumed.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowPauseWarning(false)}
                  variant="outline"
                  size="sm"
                >
                  Acknowledge
                </Button>
                <Button
                  onClick={handleResume}
                  size="sm"
                >
                  Resume Timer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stop Timer Modal */}
      <ShadcnStopTimerModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onSubmit={handleStop}
        timeExceeded={timeExceeded}
        allocatedHours={activeTimerInfo.allocatedHours}
        actualHours={seconds / 3600}
      />
    </>
  );
};

export default ShadcnCountdownTimer;
