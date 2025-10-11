import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

interface FileUploadProgressItem {
  id: string;
  name: string;
  fileName?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'paused';
  error?: string;
  size?: number;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

interface FileUploadProgressProps {
  uploads: FileUploadProgressItem[];
  onCancel?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onRemove?: (id: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${Math.round(remainingSeconds)}s`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) {
    return `${Math.round(bytesPerSecond)} B/s`;
  }
  if (bytesPerSecond < 1024 * 1024) {
    return `${Math.round(bytesPerSecond / 1024)} KB/s`;
  }
  return `${Math.round(bytesPerSecond / (1024 * 1024))} MB/s`;
};

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  uploads,
  onCancel,
  onPause,
  onResume,
  onRemove,
  showDetails = true,
  compact = false,
}) => {
  if (uploads.length === 0) {
    return null;
  }

  const getStatusIcon = (status: FileUploadProgressItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (upload: FileUploadProgressItem) => {
    switch (upload.status) {
      case 'completed':
        return <Badge variant="default">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="secondary">{upload.progress}%</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="flex items-center space-x-3 p-2 border rounded-lg">
            {getStatusIcon(upload.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.name}</p>
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="w-full h-1 mt-1" />
              )}
            </div>
            {getStatusBadge(upload)}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(upload.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Upload Progress ({uploads.length} file{uploads.length > 1 ? 's' : ''})
            </h4>
            {uploads.some(u => u.status === 'uploading') && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => uploads.forEach(u => u.status === 'uploading' && onCancel(u.id))}
              >
                Cancel All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{upload.name}</p>
                      {upload.error && (
                        <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                      )}
                      {showDetails && upload.status === 'uploading' && (
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          {upload.size && (
                            <span>{formatFileSize(upload.size)}</span>
                          )}
                          {upload.speed && (
                            <span>{formatSpeed(upload.speed)}</span>
                          )}
                          {upload.timeRemaining && (
                            <span>{formatTimeRemaining(upload.timeRemaining)} remaining</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(upload)}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1">
                      {upload.status === 'uploading' && onPause && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPause(upload.id)}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {upload.status === 'paused' && onResume && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResume(upload.id)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}

                      {upload.status === 'uploading' && onCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(upload.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}

                      {(upload.status === 'completed' || upload.status === 'error') && onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(upload.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="w-full" />
                )}
              </div>
            ))}
          </div>

          {/* Overall progress summary */}
          {uploads.length > 1 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploads.filter(u => u.status === 'completed').length} of {uploads.length} completed
                </span>
                <span className="text-muted-foreground">
                  {Math.round(uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length)}% overall
                </span>
              </div>
              <Progress
                value={uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length}
                className="w-full mt-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};