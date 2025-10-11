import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Upload, AlertTriangle, Clock, CheckCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { notes?: string; file?: File }) => Promise<void>;
  timeExceeded?: boolean;
  allocatedHours?: number;
  actualHours?: number;
  projectName?: string;
  taskName?: string;
  className?: string;
}

const stopTimerSchema = z.object({
  notes: z.string().min(1, "Please provide notes about your work").max(1000, "Notes must be less than 1000 characters"),
  file: z.any().optional(),
});

type StopTimerFormData = z.infer<typeof stopTimerSchema>;

export const EnhancedStopTimerModal: React.FC<EnhancedStopTimerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  timeExceeded = false,
  allocatedHours,
  actualHours,
  projectName = "Current Project",
  taskName = "Current Task",
  className,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StopTimerFormData>({
    resolver: zodResolver(stopTimerSchema),
  });

  const notes = watch('notes', '');
  const remainingChars = 1000 - (notes?.length || 0);

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  const handleFormSubmit = async (data: StopTimerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        notes: data.notes,
        file: selectedFile || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Error submitting timer stop:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      dialogVariant="glass"
      overlayVariant="glass"
      dialogSize="xl"
      bottomSheetVariant="glass"
      bottomSheetHeight="full"
      className={className}
    >
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Complete Timer Session
        </ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Provide details about your work session and optionally attach supporting files
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="space-y-6">
        {/* Session Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Project</span>
                </div>
                <p className="text-sm text-muted-foreground">{projectName}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Task</span>
                </div>
                <p className="text-sm text-muted-foreground">{taskName}</p>
              </div>
            </div>

            {(allocatedHours || actualHours) && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Summary</span>
                  </div>
                  {timeExceeded && (
                    <Badge variant="destructive" className="text-xs">
                      Over Budget
                    </Badge>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  {allocatedHours && (
                    <div>
                      <span className="text-muted-foreground">Allocated: </span>
                      <span className="font-medium">{formatDuration(allocatedHours)}</span>
                    </div>
                  )}
                  {actualHours && (
                    <div>
                      <span className="text-muted-foreground">Actual: </span>
                      <span className={cn(
                        "font-medium",
                        timeExceeded ? "text-destructive" : "text-foreground"
                      )}>
                        {formatDuration(actualHours)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Exceeded Warning */}
        {timeExceeded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This session has exceeded the allocated time budget. Please provide additional notes 
              explaining the extra time required.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Work Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Work Notes {timeExceeded && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder="Describe what you accomplished during this session..."
              className="min-h-[120px] resize-none"
              {...register('notes')}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {errors.notes ? (
                  <span className="text-destructive">{errors.notes.message}</span>
                ) : (
                  "Provide details about your work for better project tracking"
                )}
              </span>
              <span className={cn(
                remainingChars < 100 && "text-warning",
                remainingChars < 0 && "text-destructive"
              )}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supporting Files (Optional)</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary/50 hover:bg-primary/5"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Upload screenshots, documents, or other supporting materials
                    </p>
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF (Max 10MB)
            </p>
          </div>
        </form>
      </div>

      <ResponsiveModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </div>
          ) : (
            "Complete Session"
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};