import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ShadcnStopTimerModal } from './ShadcnStopTimerModal';
import { UserRole, Project } from '../../types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  cn
} from '../../lib/shadcn';
import {
  Play,
  Pause,
  Square,
  Minus,
  Clock,
  AlertTriangle,
  Timer,
  GripVertical
} from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

export const ShadcnPersistentTimerPopup: React.FC = () => {
  const {
    activeTimers,
    currentTimerKey,
    pauseGlobalTimer,
    resumeGlobalTimer,
    stopGlobalTimerAndLog,
    user,
    projects
  } = useAppContext();

  const activeTimerInfo = currentTimerKey ? activeTimers[currentTimerKey] : null;
  const [seconds, setSeconds] = useState(0);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [showPauseWarning, setShowPauseWarning] = useState(false);
  const [timeExceeded, setTimeExceeded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: window.innerWidth - 320, y: 20 });
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // Assignment check for current timer
  const assignmentAllowed = (() => {
    try {
      if (!user || !currentTimerKey || !projects || projects.length === 0) return false;
      const [projectId] = currentTimerKey.split('-');
      const project = projects.find((p: any) => p.id === projectId);
      // Mock assignment validation - replace with actual logic
      return user.role === UserRole.ADMIN || (user.role === UserRole.FREELANCER && project);
    } catch {
      return false;
    }
  })();

  // Timer update effect
  useEffect(() => {
    if (activeTimerInfo && !activeTimerInfo.isPaused) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeTimerInfo.startTime);
        const totalElapsed = now.getTime() - start.getTime() - (activeTimerInfo.totalPausedTime || 0);
        const elapsedSeconds = Math.floor(totalElapsed / 1000);

        if (activeTimerInfo.allocatedHours && activeTimerInfo.allocatedHours > 0) {
          const allocatedSeconds = activeTimerInfo.allocatedHours * 3600;
          const remainingSeconds = Math.max(0, allocatedSeconds - elapsedSeconds);
          setSeconds(remainingSeconds);

          if (remainingSeconds === 0 && !timeExceeded) {
            setTimeExceeded(true);

            // Show browser notification when time is exceeded
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⚠️ Time Exceeded!', {
                body: `Allocated time for "${activeTimerInfo.jobCardTitle}" has been exceeded!`,
                icon: '/favicon.ico',
                tag: 'timer-exceeded'
              });
            }
          }
        } else {
          setSeconds(elapsedSeconds);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimerInfo, timeExceeded]);

  // Pause warning effect - 5 minute limit
  useEffect(() => {
    if (activeTimerInfo?.isPaused && !showPauseWarning) {
      const pauseStartTime = activeTimerInfo.pausedAt ? new Date(activeTimerInfo.pausedAt).getTime() : Date.now();
      const warningTime = 4 * 60 * 1000; // 4 minutes warning
      const timeUntilWarning = warningTime - (Date.now() - pauseStartTime);

      if (timeUntilWarning > 0) {
        const warningTimer = setTimeout(() => {
          setShowPauseWarning(true);
        }, timeUntilWarning);

        return () => clearTimeout(warningTimer);
      } else {
        setShowPauseWarning(true);
      }
    }
  }, [activeTimerInfo?.isPaused, activeTimerInfo?.pausedAt, showPauseWarning]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 200;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Don't show timer for client users - moved after hooks
  if (!user || user.role === UserRole.CLIENT) return null;

  if (!activeTimerInfo) return null;

  const formatTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStop = async (details: { notes?: string; file?: File }) => {
    if (currentTimerKey) {
      const [projectId, jobCardId] = currentTimerKey.split('-');
      await stopGlobalTimerAndLog(projectId, jobCardId, {
        notes: details.notes || '',
        file: details.file
      });
    }
    setIsStopModalOpen(false);
    setTimeExceeded(false);
  };

  const handlePause = async () => {
    if (currentTimerKey) {
      await pauseGlobalTimer(currentTimerKey);
    }
    setShowPauseWarning(false);
  };

  const handleResume = async () => {
    if (currentTimerKey) {
      await resumeGlobalTimer(currentTimerKey);
    }
    setShowPauseWarning(false);
  };

  const getStatusVariant = () => {
    if (timeExceeded) return 'destructive';
    if (activeTimerInfo.isPaused) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (timeExceeded) return <AlertTriangle className="h-4 w-4" />;
    if (activeTimerInfo.isPaused) return <Pause className="h-4 w-4" />;
    return <Timer className="h-4 w-4 animate-pulse" />;
  };

  return (
    <>
      {/* Always-on-top draggable timer popup */}
      <Card
        ref={dragRef}
        className={cn(
          "fixed z-[9999] shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          isMinimized ? "w-12 h-12 p-0" : "w-80",
          timeExceeded && "border-destructive bg-destructive/5",
          activeTimerInfo.isPaused && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
        )}
        style={{
          left: position.x,
          top: position.y,
        }}
        onMouseDown={handleMouseDown}
        role="dialog"
        aria-label="Persistent timer popup"
        aria-live="polite"
      >
        {isMinimized ? (
          // Minimized view
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => setIsMinimized(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsMinimized(false);
              }
            }}
            title="Click to expand timer"
            role="button"
            aria-label="Expand timer display"
            tabIndex={0}
          >
            {getStatusIcon()}
          </div>
        ) : (
          // Full view
          <>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm truncate">
                    {activeTimerInfo.isPaused ? 'Timer Paused' :
                      timeExceeded ? 'Time Exceeded' :
                        'Active Timer'}
                  </CardTitle>
                  <Badge variant={getStatusVariant()} className="gap-1">
                    {getStatusIcon()}
                    {activeTimerInfo.isPaused ? 'Paused' :
                      timeExceeded ? 'Overtime' : 'Active'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 p-0"
                  title="Minimize"
                  aria-label="Minimize timer display"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Task title */}
              <div className="text-xs text-muted-foreground truncate" title={activeTimerInfo.jobCardTitle}>
                <Clock className="h-3 w-3 inline mr-1" />
                {activeTimerInfo.jobCardTitle}
              </div>

              {/* Timer display */}
              <div className="text-center">
                <div
                  className={cn(
                    "text-2xl font-mono font-bold",
                    timeExceeded && "text-destructive animate-pulse"
                  )}
                  role="timer"
                  aria-live="polite"
                  aria-label={`Timer: ${formatTime(seconds)}`}
                >
                  {formatTime(seconds)}
                </div>
                {activeTimerInfo.allocatedHours && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {timeExceeded ? (
                      <span className="text-destructive font-semibold flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overtime!
                      </span>
                    ) : (
                      `Allocated: ${activeTimerInfo.allocatedHours}h`
                    )}
                  </div>
                )}
              </div>

              {/* Control buttons */}
              <div className="flex gap-2" role="group" aria-label="Timer controls">
                {activeTimerInfo.isPaused ? (
                  <Button
                    onClick={handleResume}
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={!assignmentAllowed && user?.role !== UserRole.ADMIN}
                    title={!assignmentAllowed && user?.role !== UserRole.ADMIN ? 'You are not assigned to this task' : 'Resume timer'}
                    aria-label="Resume timer"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={!assignmentAllowed && user?.role !== UserRole.ADMIN}
                    title={!assignmentAllowed && user?.role !== UserRole.ADMIN ? 'You are not assigned to this task' : 'Pause timer (5 min limit)'}
                    aria-label="Pause timer"
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={() => setIsStopModalOpen(true)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={!assignmentAllowed && user?.role !== UserRole.ADMIN}
                  title={!assignmentAllowed && user?.role !== UserRole.ADMIN ? 'You are not assigned to this task' : 'Stop timer and log work'}
                  aria-label="Stop timer"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </div>

              {/* Pause warning */}
              {showPauseWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Pause Warning!</strong><br />
                    Timer will auto-resume in 1 minute (5 min limit)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Stop timer modal */}
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

export default ShadcnPersistentTimerPopup;
