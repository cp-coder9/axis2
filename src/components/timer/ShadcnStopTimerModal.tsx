import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Input,
  Alert,
  AlertDescription,
  cn
} from '../../lib/shadcn';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Upload, AlertTriangle } from 'lucide-react';

interface ShadcnStopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { notes?: string; file?: File }) => Promise<void>;
  timeExceeded?: boolean;
  allocatedHours?: number;
  actualHours?: number;
  className?: string;
}

const stopTimerSchema = z.object({
  notes: z.string().optional(),
  file: z.any().optional(),
});

type StopTimerFormData = z.infer<typeof stopTimerSchema>;

export const ShadcnStopTimerModal: React.FC<ShadcnStopTimerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  timeExceeded = false,
  allocatedHours,
  actualHours,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { activeTimers, currentTimerKey } = useAppContext();

  const timer = currentTimerKey ? activeTimers[currentTimerKey] : null;

  const form = useForm<StopTimerFormData>({
    resolver: zodResolver(stopTimerSchema),
    defaultValues: {
      notes: '',
    },
  });

  const handleSubmit = async (data: StopTimerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ 
        notes: data.notes || undefined, 
        file: selectedFile || undefined 
      });
      form.reset();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Error stopping timer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!timer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-lg", className)} aria-describedby="stop-timer-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Stop Timer
          </DialogTitle>
          <DialogDescription id="stop-timer-description">
            Complete your work session and provide details about your progress
          </DialogDescription>
        </DialogHeader>

        {/* Timer Information */}
        <div className="space-y-3 py-4">
          <div className="space-y-1">
            <h3 className="font-medium text-sm">Project Task</h3>
            <p className="text-sm text-muted-foreground">{timer.jobCardTitle}</p>
          </div>

          {/* Time Summary */}
          {allocatedHours && actualHours && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold">{allocatedHours.toFixed(1)}h</div>
                <div className="text-xs text-muted-foreground">Allocated</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-lg font-semibold",
                  timeExceeded ? "text-destructive" : "text-foreground"
                )}>
                  {actualHours.toFixed(1)}h
                </div>
                <div className="text-xs text-muted-foreground">Actual</div>
              </div>
            </div>
          )}

          {/* Overtime Warning */}
          {timeExceeded && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You've exceeded the allocated time for this task. Please provide notes explaining the additional work required.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Work Notes {timeExceeded && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you accomplished during this session..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormItem>
              <FormLabel>Supporting File (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-auto p-1"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
            </FormItem>

            <DialogFooter>
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
                variant="destructive"
                disabled={isSubmitting || (timeExceeded && !form.watch('notes'))}
              >
                {isSubmitting ? 'Stopping...' : 'Stop Timer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ShadcnStopTimerModal.displayName = 'ShadcnStopTimerModal';

export default ShadcnStopTimerModal;
