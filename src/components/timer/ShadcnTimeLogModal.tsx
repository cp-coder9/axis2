import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Alert,
  AlertDescription,
  cn
} from '../../lib/shadcn';
import { Clock, FileText, Upload, CalendarClock } from 'lucide-react';
import { ManualLogData } from '../../types';

// Validation schema
const timeLogSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
  file: z.instanceof(FileList).optional()
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true; // Let field validation handle empty values
  
  // Parse times to compare
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  
  const startTimeMinutes = startHours * 60 + startMinutes;
  const endTimeMinutes = endHours * 60 + endMinutes;
  
  // Allow end time to be earlier (next day scenario) or later same day
  return startTimeMinutes !== endTimeMinutes;
}, {
  message: "End time must be different from start time",
  path: ["endTime"]
});

type TimeLogFormData = z.infer<typeof timeLogSchema>;

interface ShadcnTimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logData: ManualLogData) => void;
  jobCardTitle: string;
  className?: string;
}

export const ShadcnTimeLogModal: React.FC<ShadcnTimeLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobCardTitle,
  className
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimeLogFormData>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
      notes: '',
    }
  });

  const handleSubmit = async (data: TimeLogFormData) => {
    setIsSubmitting(true);
    
    try {
      if (!data.startTime || !data.endTime) {
        throw new Error("Please enter both start and end times.");
      }
      
      // Use a fixed date to correctly calculate duration across midnight
      const today = new Date().toISOString().split('T')[0];
      const start = new Date(`${today}T${data.startTime}:00`);
      let end = new Date(`${today}T${data.endTime}:00`);

      if (end <= start) {
        // Assume it's the next day if end time is earlier
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }

      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      const logData: ManualLogData = {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes,
        notes: data.notes || '',
        manualEntry: true,
        file: selectedFile || undefined,
      };
      
      await onSubmit(logData);
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Error submitting time log:', error);
      // Toast notification would be handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const calculateDuration = () => {
    const { startTime, endTime } = form.getValues();
    if (!startTime || !endTime) return null;

    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}:00`);
    let end = new Date(`${today}T${endTime}:00`);

    if (end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return { hours, minutes, totalMinutes: durationMinutes };
  };

  const duration = calculateDuration();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn("sm:max-w-lg", className)}
        aria-describedby="time-log-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Manual Time Entry
          </DialogTitle>
          <DialogDescription id="time-log-description">
            Log time for: <span className="font-medium">{jobCardTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Time Input Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="08:00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Trigger duration recalculation
                          form.trigger(['startTime', 'endTime']);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="17:00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Trigger duration recalculation
                          form.trigger(['startTime', 'endTime']);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Display */}
            {duration && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Duration: <span className="font-medium">
                    {duration.hours > 0 && `${duration.hours}h `}
                    {duration.minutes}m
                  </span>
                  {duration.totalMinutes >= 480 && (
                    <span className="text-amber-600 ml-2">
                      (Long session - consider breaks)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Work Notes
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what was accomplished during this time..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <div className="space-y-2">
              <label 
                htmlFor="substantiation-file" 
                className="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Upload className="h-4 w-4" />
                Substantiation File
                <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                id="substantiation-file"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer file:cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isValid}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Logging...
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    Log Time
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ShadcnTimeLogModal;
