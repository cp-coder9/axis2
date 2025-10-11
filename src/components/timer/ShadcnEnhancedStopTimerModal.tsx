import { useState } from 'react';
import { Clock, AlertCircle, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card,
  CardContent,
  CardHeader,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Alert,
  AlertDescription,
  Progress,
  Badge,
  Input
} from '../../lib/shadcn';

interface ShadcnEnhancedStopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { notes: string; file: File }) => void;
  timeExceeded: boolean;
  allocatedHours?: number;
  actualHours: number;
}

// Validation schema
const stopTimerSchema = z.object({
  notes: z.string()
    .min(10, 'Work description must be at least 10 characters')
    .max(1000, 'Work description must not exceed 1000 characters'),
  file: z.instanceof(File, { message: 'Substantiation file is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size exceeds 5MB limit')
    .refine(
      (file) => ['image/', 'application/pdf', 'application/msword', 'text/'].some(type => 
        file.type.startsWith(type)
      ),
      'File must be an image, PDF, document, or text file'
    )
});

type StopTimerFormData = z.infer<typeof stopTimerSchema>;

export const ShadcnEnhancedStopTimerModal: React.FC<ShadcnEnhancedStopTimerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  timeExceeded,
  allocatedHours,
  actualHours
}) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<StopTimerFormData>({
    resolver: zodResolver(stopTimerSchema),
    defaultValues: {
      notes: '',
      file: undefined
    }
  });

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  const calculateProgress = () => {
    if (!allocatedHours || allocatedHours <= 0) return 0;
    return Math.min(100, (actualHours / allocatedHours) * 100);
  };

  const getRemainingTime = () => {
    if (!allocatedHours) return 'N/A';
    if (timeExceeded) return 'Exceeded';
    return formatHours(Math.max(0, allocatedHours - actualHours));
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (timeExceeded) return 'bg-red-500';
    if (progress >= 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) {
      setFilePreview(null);
      return;
    }

    setHasChanges(true);
    
    // Create preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = (data: StopTimerFormData) => {
    onSubmit({ notes: data.notes.trim(), file: data.file });
    
    // Reset form
    form.reset();
    setFilePreview(null);
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges && (form.getValues('notes') || form.getValues('file'))) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        form.reset();
        setFilePreview(null);
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Complete Time Log Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-medium text-blue-800">Time Summary</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Allocated Hours</div>
                  <div className="text-sm font-medium">
                    {allocatedHours ? formatHours(allocatedHours) : 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Time Used</div>
                  <div className="text-sm font-medium">
                    {actualHours > 0 ? formatHours(actualHours) : '0h'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Remaining</div>
                  <div className={`text-sm font-medium ${timeExceeded ? 'text-red-600' : 'text-green-600'}`}>
                    {getRemainingTime()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {allocatedHours && allocatedHours > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress())}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={calculateProgress()} className="h-2" />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full ${getProgressColor()}`}
                      style={{ width: `${Math.min(100, calculateProgress())}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Time Status Badge */}
              <div className="flex justify-center">
                <Badge variant={timeExceeded ? "destructive" : "default"}>
                  {timeExceeded ? "Time Exceeded" : "Within Allocation"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {timeExceeded && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Time Allocation Exceeded</strong>
                <br />
                Please provide detailed explanation for the additional time used.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required Information</strong>
              <br />
              Both work description and substantiation file are mandatory to complete the time log.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Work Description */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Work Description 
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the work completed during this countdown period and results achieved..."
                        className="min-h-[100px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setHasChanges(true);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minimum 10 characters required</span>
                      <span>Current: {field.value?.length || 0}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Substantiation File 
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {value ? value.name : 'No file chosen'}
                          </span>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              onChange(file);
                              handleFileChange(file);
                            }}
                            {...field}
                          />
                        </div>

                        {/* File Preview */}
                        {filePreview && (
                          <Card>
                            <CardHeader className="pb-2">
                              <h4 className="text-sm font-medium">Preview</h4>
                            </CardHeader>
                            <CardContent>
                              <img 
                                src={filePreview} 
                                alt="File preview" 
                                className="max-h-40 max-w-full object-contain mx-auto rounded-md"
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Upload an image, document, or file that substantiates the work completed (max 5MB)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!form.formState.isValid}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Time Log Entry
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShadcnEnhancedStopTimerModal;
