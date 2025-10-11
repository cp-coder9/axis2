import React, { memo, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/shadcn';
import { Button } from '@/lib/shadcn';
import { Progress } from '@/lib/shadcn';
import { Alert, AlertDescription } from '@/lib/shadcn';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/shadcn';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/lib/shadcn';
import { Input } from '@/lib/shadcn';
import { Textarea } from '@/lib/shadcn';
import { Clock, FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useTimerCalculations,
  useThrottledValue,
  usePerformanceMonitor,
  useTimerCleanup
} from '@/utils/performance';

// Form validation schema
const stopTimerSchema = z.object({
  notes: z.string().min(10, 'Work description must be at least 10 characters'),
  file: z.any().optional(),
});

type StopTimerFormData = z.infer<typeof stopTimerSchema>;

export interface StopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StopTimerFormData) => Promise<void>;

  // Timer data
  jobCardTitle?: string;
  projectName?: string;
  allocatedHours?: number;
  actualHours?: number;

  // UI state
  isLoading?: boolean;
  className?: string;
}

// Performance optimized StopTimerModal with React.memo
export const StopTimerModal = memo(function StopTimerModal({
  isOpen,
  onClose,
  onSubmit,
  jobCardTitle = 'UI Design Review',
  projectName = 'Client Portal Redesign',
  allocatedHours = 2.0,
  actualHours = 2.25,
  isLoading = false,
  className
}: StopTimerModalProps) {
  // Performance monitoring
  const { getStats } = usePerformanceMonitor('StopTimerModal');

  // Use the timer calculations hook
  const timerCalculations = useTimerCalculations(allocatedHours, actualHours, 0);

  // Memoized calculations for time summary
  const timeCalculations = useMemo(() => {
    const allocatedSeconds = (allocatedHours || 0) * 3600;
    const actualSeconds = (actualHours || 0) * 3600;
    const remainingSeconds = allocatedSeconds - actualSeconds;
    const isExceeded = remainingSeconds < 0;
    const progressPercentage = allocatedSeconds > 0 ? (actualSeconds / allocatedSeconds) * 100 : 0;

    return {
      allocated: allocatedSeconds,
      actual: actualSeconds,
      remaining: remainingSeconds,
      isExceeded,
      progressPercentage: Math.min(progressPercentage, 100),
      overtimeSeconds: isExceeded ? Math.abs(remainingSeconds) : 0
    };
  }, [allocatedHours, actualHours]);

  // Throttled time calculations to prevent excessive re-renders
  const throttledCalculations = useThrottledValue(timeCalculations, 200);

  // Form setup with validation
  const form = useForm<StopTimerFormData>({
    resolver: zodResolver(stopTimerSchema),
    defaultValues: {
      notes: '',
      file: undefined,
    },
  });

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Watch form changes for unsaved changes detection
  const watchedValues = form.watch();
  React.useEffect(() => {
    const hasChanges = watchedValues.notes.length > 0 || selectedFile !== null;
    setHasUnsavedChanges(hasChanges);
  }, [watchedValues.notes, selectedFile]);

  // Optimized file handling
  const handleFileSelection = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      form.setValue('file', undefined);
      return;
    }

    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      form.setError('file', { message: 'File size must be less than 5MB' });
      return;
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/markdown'
    ];

    if (!allowedTypes.includes(file.type)) {
      form.setError('file', { message: 'Invalid file type. Please select an image, PDF, or document.' });
      return;
    }

    setSelectedFile(file);
    form.setValue('file', file);
    form.clearErrors('file');

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [form]);

  // Optimized drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  // Optimized form submission
  const handleSubmit = useCallback(async (data: StopTimerFormData) => {
    try {
      await onSubmit(data);

      // Reset form on successful submission
      form.reset();
      setSelectedFile(null);
      setFilePreview(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Form submission error:', error);
      form.setError('root', {
        message: 'Failed to submit timer log. Please try again.'
      });
    }
  }, [onSubmit, form]);

  // Optimized close handler with unsaved changes protection
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !isLoading) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!shouldClose) return;
    }

    // Reset form state
    form.reset();
    setSelectedFile(null);
    setFilePreview(null);
    setHasUnsavedChanges(false);

    onClose();
  }, [hasUnsavedChanges, isLoading, form, onClose]);

  // Time formatting helper
  const formatTime = useCallback((hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }, []);

  // Cleanup and performance monitoring
  useTimerCleanup([
    () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('StopTimerModal cleanup:', getStats());
      }
    }
  ]);

  // Memoized time summary component
  const TimeSummary = memo(() => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Allocated</p>
            <p className="font-semibold">{formatTime(allocatedHours || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-semibold">{formatTime(actualHours || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {throttledCalculations.isExceeded ? 'Overtime' : 'Remaining'}
            </p>
            <p className={`font-semibold ${throttledCalculations.isExceeded ? 'text-red-600' : 'text-green-600'}`}>
              {throttledCalculations.isExceeded
                ? `+${formatTime(throttledCalculations.overtimeSeconds / 3600)}`
                : formatTime(Math.abs(throttledCalculations.remaining) / 3600)
              }
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(throttledCalculations.progressPercentage)}%</span>
          </div>
          <Progress
            value={throttledCalculations.progressPercentage}
            className={`h-2 ${throttledCalculations.isExceeded ? 'progress-destructive' : ''}`}
          />
        </div>

        {throttledCalculations.isExceeded && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Time allocation exceeded by {formatTime(throttledCalculations.overtimeSeconds / 3600)}.
              File upload required for documentation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  ));

  TimeSummary.displayName = 'TimeSummary';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl ${className}`} aria-describedby="timer-stop-description">
        <DialogHeader>
          <DialogTitle>Complete Timer Session</DialogTitle>
          <DialogDescription id="timer-stop-description">
            Log your work and stop the timer for "{jobCardTitle || 'Unnamed Task'}"
            in project "{projectName || 'Unnamed Project'}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <TimeSummary />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Work Description */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the work completed during this timer session..."
                        className="min-h-[100px] resize-y"
                        {...field}
                        aria-describedby="notes-character-count"
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <FormMessage />
                      <span id="notes-character-count">
                        {field.value.length}/1000 characters
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <FormField
                control={form.control}
                name="file"
                render={({ field: _field }) => (
                  <FormItem>
                    <FormLabel>
                      Supporting Documentation
                      {throttledCalculations.isExceeded && <span className="text-red-600"> *</span>}
                    </FormLabel>
                    <FormControl>
                      <div
                        className={`
                          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                          transition-all duration-200 hover:border-primary/50
                          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
                          ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Click or drag to upload file"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            document.getElementById('file-input')?.click();
                          }
                        }}
                      >
                        <Input
                          id="file-input"
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.md"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleFileSelection(file || null);
                          }}
                        />

                        {selectedFile ? (
                          <div className="space-y-3">
                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">
                                {selectedFile.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>

                            {filePreview && (
                              <div className="mt-3">
                                <img
                                  src={filePreview}
                                  alt="Preview"
                                  className="max-w-full h-32 object-cover rounded-md mx-auto"
                                />
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileSelection(null);
                              }}
                              className="mt-2"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove File
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                            <div>
                              <p className="font-medium">
                                {isDragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Images, PDFs, or documents (max 5MB)
                              </p>
                              {throttledCalculations.isExceeded && (
                                <p className="text-sm text-red-600 mt-1">
                                  File upload required for overtime documentation
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Errors */}
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading || (throttledCalculations.isExceeded && !selectedFile)}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Complete Timer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default StopTimerModal;