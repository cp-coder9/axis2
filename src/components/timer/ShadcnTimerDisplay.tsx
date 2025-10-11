import { useState, useEffect } from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { UserRole } from '../../types';
import { Button, Badge, Card, CardContent } from '../../lib/shadcn';
import { ShadcnStopTimerModal } from './ShadcnStopTimerModal';

interface TimerState {
  [key: string]: number;
}

interface ActiveTimer {
  startTime: Date | string;
  jobCardTitle: string;
  allocatedHours?: number;
  isPaused: boolean;
  totalPausedTime?: number;
  pausedAt?: Date | null;
}

interface ShadcnTimerDisplayProps {
  className?: string;
  position?: 'fixed' | 'relative';
  variant?: 'default' | 'compact' | 'minimal';
  activeTimers?: Record<string, ActiveTimer>;
  user?: { role: UserRole };
  onPause?: (projectId: string, jobCardId: string) => void;
  onResume?: (projectId: string, jobCardId: string) => void;
  onStop?: (projectId: string, jobCardId: string, details?: any) => void;
}

export const ShadcnTimerDisplay: React.FC<ShadcnTimerDisplayProps> = ({
  className,
  position = 'fixed',
  variant = 'default',
  activeTimers = {},
  user,
  onPause,
  onResume,
  onStop
}) => {
  const [seconds, setSeconds] = useState<TimerState>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTimerKey, setCurrentTimerKey] = useState('');

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    Object.entries(activeTimers).forEach(([key, timer]) => {
      const interval = setInterval(() => {
        setSeconds(prev => {
          const now = new Date();
          const start = new Date(timer.startTime);
          const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
          return { ...prev, [key]: elapsed };
        });
      }, 1000);
      intervals.push(interval);
    });

    return () => intervals.forEach(interval => clearInterval(interval));
  }, [activeTimers]);

  // Don't show timer for client users - moved after hooks
  if (user?.role === UserRole.CLIENT) return null;

  if (Object.keys(activeTimers).length === 0) return null;

  const handleStop = async (details: { notes?: string; file?: File }) => {
    const [projectId, jobCardId] = currentTimerKey.split('-');
    if (onStop) {
      await onStop(projectId, jobCardId, details);
    }
    setIsModalOpen(false);
  };

  const handlePause = (timerKey: string) => {
    const [projectId, jobCardId] = timerKey.split('-');
    if (onPause) {
      onPause(projectId, jobCardId);
    }
  };

  const handleResume = (timerKey: string) => {
    const [projectId, jobCardId] = timerKey.split('-');
    if (onResume) {
      onResume(projectId, jobCardId);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getTimerVariant = (isPaused: boolean) => {
    return isPaused ? 'secondary' : 'destructive';
  };

  const getPositionStyles = () => {
    if (position === 'fixed') {
      return 'fixed top-4 right-4 z-[200]';
    }
    return 'relative';
  };

  const TimerCard = ({ timerKey, timer }: { timerKey: string; timer: ActiveTimer }) => {
    const isActive = !timer.isPaused;
    
    if (variant === 'minimal') {
      return (
        <Card className={`border-2 transition-all duration-200 ${
          isActive ? 'border-red-500 bg-red-50 shadow-lg animate-pulse shadow-red-200' : 'border-orange-400 bg-orange-50'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`h-4 w-4 ${isActive ? 'text-red-600' : 'text-orange-600'}`} />
                <div className="font-mono text-lg font-bold">
                  {formatTime(seconds[timerKey] || 0)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => timer.isPaused ? handleResume(timerKey) : handlePause(timerKey)}
                  className="h-6 w-6 p-0"
                >
                  {timer.isPaused ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCurrentTimerKey(timerKey);
                    setIsModalOpen(true);
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border-2 transition-all duration-200 min-w-[280px] ${
        isActive ? 'border-red-500 bg-red-50 shadow-xl animate-pulse shadow-red-200' : 'border-orange-400 bg-orange-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Timer Icon */}
            <div className={`flex-shrink-0 p-2 rounded-full ${
              isActive ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <Timer className={`h-6 w-6 ${
                isActive ? 'text-red-600' : 'text-orange-600'
              }`} />
            </div>

            {/* Timer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getTimerVariant(timer.isPaused)}>
                  {timer.isPaused ? 'PAUSED' : 'ACTIVE'}
                </Badge>
              </div>
              
              <div className="font-mono text-2xl font-bold text-gray-900 mb-1">
                {formatTime(seconds[timerKey] || 0)}
              </div>
              
              <div 
                className="text-xs text-gray-600 truncate max-w-[150px] sm:max-w-[200px]" 
                title={timer.jobCardTitle}
              >
                Task: {timer.jobCardTitle}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant={timer.isPaused ? "default" : "secondary"}
                onClick={() => timer.isPaused ? handleResume(timerKey) : handlePause(timerKey)}
                className="flex items-center gap-1 min-w-[80px]"
              >
                {timer.isPaused ? (
                  <>
                    <Play className="h-3 w-3" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setCurrentTimerKey(timerKey);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1 min-w-[80px]"
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className={`${getPositionStyles()} space-y-3 ${className || ''}`}>
        {Object.entries(activeTimers).map(([key, timer]) => (
          <TimerCard key={key} timerKey={key} timer={timer} />
        ))}
      </div>
      
      <ShadcnStopTimerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleStop}
      />
    </>
  );
};

export default ShadcnTimerDisplay;
