import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Play,
  Pause,
  Square,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProjectFile, TimeLog, UserRole } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { TimerSubstantiationUpload } from '../file/FileUploadManager';
import { useAppContext } from '@/contexts/AppContext';
import { formatDuration } from '@/utils/formatters';
import { canFreelancerStartTimer } from '@/utils/timerSlotValidation';

interface TimerWithFileUploadProps {
  projectId: string;
  jobCardId: string;
  onTimeLogComplete: (timeLog: TimeLog, substantiationFiles?: ProjectFile[], description?: string) => void;
  className?: string;
}

export const TimerWithFileUpload: React.FC<TimerWithFileUploadProps> = ({
  projectId,
  jobCardId,
  onTimeLogComplete,
  className = ''
}) => {
  const { currentUser } = useAppContext();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [substantiationFiles, setSubstantiationFiles] = useState<ProjectFile[]>([]);
  const [substantiationDescription, setSubstantiationDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Timer interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime]);

  const handleStart = useCallback(() => {
    const start = async () => {
      if (!currentUser) return;

      const check = await canFreelancerStartTimer(currentUser.id, projectId, jobCardId);
      if (!check.canStart) {
        setUploadError(check.reason || 'No available time slots to start timer.');
        return;
      }

      const now = new Date();
      setStartTime(now);
      setIsRunning(true);
      setElapsedTime(0);
      setShowFileUpload(false);
      setSubstantiationFiles([]);
      setSubstantiationDescription('');
      setUploadError(null);
    }

    start();
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(() => {
    if (startTime) {
      const now = new Date();
      const newStartTime = new Date(now.getTime() - elapsedTime);
      setStartTime(newStartTime);
      setIsRunning(true);
    }
  }, [startTime, elapsedTime]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setShowFileUpload(true);
  }, []);

  const handleFileUploadComplete = useCallback((files: ProjectFile[], description: string) => {
    setSubstantiationFiles(files);
    setSubstantiationDescription(description);
    setUploadError(null);
  }, []);

  const handleFileUploadError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

  const handleCompleteTimeLog = useCallback(() => {
    if (!startTime || !currentUser) return;

    const endTime = new Date();
    const durationMinutes = Math.floor(elapsedTime / (1000 * 60));

    const timeLog: TimeLog = {
      id: `timelog_${Date.now()}`,
      userId: currentUser.id,
      startTime: startTime as any, // Convert to Timestamp in real implementation
      endTime: endTime as any, // Convert to Timestamp in real implementation
      durationMinutes,
      notes: substantiationDescription,
      manualEntry: false,
      projectId,
      jobCardId,
      loggedById: currentUser.id,
      loggedByName: currentUser.name,
      hourlyRate: currentUser.hourlyRate,
      earnings: (durationMinutes / 60) * currentUser.hourlyRate,
      substantiationFile: substantiationFiles.length > 0 ? {
        id: `sf-${Date.now()}`,
        name: substantiationFiles[0].name,
        url: substantiationFiles[0].url,
        projectId,
        uploadedBy: currentUser.id,
        uploadedAt: Timestamp.now()
      } : undefined
    };

    onTimeLogComplete(timeLog, substantiationFiles, substantiationDescription);

    // Reset timer state
    setStartTime(null);
    setElapsedTime(0);
    setShowFileUpload(false);
    setSubstantiationFiles([]);
    setSubstantiationDescription('');
    setUploadError(null);
  }, [startTime, currentUser, elapsedTime, substantiationDescription, projectId, jobCardId, substantiationFiles, onTimeLogComplete]);

  const handleSkipFileUpload = useCallback(() => {
    handleCompleteTimeLog();
  }, [handleCompleteTimeLog]);

  if (!currentUser || (currentUser.role !== UserRole.FREELANCER && currentUser.role !== UserRole.ADMIN)) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Timer access restricted to freelancers and admins.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timer Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracker
            </div>
            <Badge variant={isRunning ? 'default' : 'secondary'}>
              {isRunning ? 'Running' : 'Stopped'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-primary">
              {formatDuration(elapsedTime)}
            </div>
            {startTime && (
              <p className="text-sm text-muted-foreground mt-2">
                Started at {startTime.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-2">
            {!isRunning && !startTime && (
              <Button onClick={handleStart} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            )}

            {isRunning && (
              <Button onClick={handlePause} variant="outline" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            {!isRunning && startTime && !showFileUpload && (
              <Button onClick={handleResume} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}

            {startTime && !showFileUpload && (
              <Button onClick={handleStop} variant="destructive" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Stop & Log Time
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      {showFileUpload && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Substantiate Your Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Upload Proof of Work (Optional)
                </p>
                <p className="text-xs text-blue-700">
                  Upload files that demonstrate the work completed during this {formatDuration(elapsedTime)} session.
                  This helps validate your time log entry.
                </p>
              </div>
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <TimerSubstantiationUpload
              projectId={projectId}
              jobCardId={jobCardId}
              onUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
            />

            {substantiationFiles.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Files uploaded successfully!</p>
                    <p className="text-sm">
                      {substantiationFiles.length} file{substantiationFiles.length > 1 ? 's' : ''} attached to this time log.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleSkipFileUpload}
              >
                Skip & Complete
              </Button>
              <Button
                onClick={handleCompleteTimeLog}
                disabled={substantiationFiles.length === 0}
              >
                Complete Time Log
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Log Summary */}
      {startTime && !showFileUpload && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(elapsedTime)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Earnings</p>
                <p className="font-medium">
                  ${((elapsedTime / (1000 * 60 * 60)) * currentUser.hourlyRate).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};