import React, { useState, useRef, useEffect } from 'react';
import { Clock, AlertCircle, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Progress,
  Badge,
  cn
} from '@/lib/shadcn';
import { useForm } from 'react-hook-form';
import {
  FocusManager,
  HighContrastSupport,
  ReducedMotionSupport,
  ScreenReaderSupport,
  initializeTimerAccessibility
} from '../../utils/accessibility';

export interface StopTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { notes: string; file: File }) => void;
  timeExceeded: boolean;
  allocatedHours?: number;
  actualHours: number;
  jobCardTitle?: string;
  projectName?: string;
  loading?: boolean;
}

interface FormData {
  notes: string;
  file: FileList | null;
}

export const StopTimerModal: React.FC<StopTimerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  timeExceeded,
  allocatedHours,
  actualHours,
  jobCardTitle = 'Current Task',
  projectName = 'Current Project',
  loading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accessibility instances
  const focusManager = FocusManager.getInstance();

  const form = useForm<FormData>({
    defaultValues: {
      notes: '',
      file: null
    }
  });

  const { watch, formState: { errors } } = form;
  const notesValue = watch('notes');

  // Initialize accessibility and focus management
  useEffect(() => {
    if (isOpen) {
      initializeTimerAccessibility();
      
      // Set focus trap when modal opens
      setTimeout(() => {
        if (modalRef.current) {
          focusManager.setFocusTrap(modalRef.current);
          HighContrastSupport.applyHighContrastStyles(modalRef.current);
          ReducedMotionSupport.applyReducedMotionStyles(modalRef.current);
        }
      }, 100);
    } else {
      // Remove focus trap when modal closes
      focusManager.removeFocusTrap();
    }

    return () => {
      if (!isOpen) {
        focusManager.removeFocusTrap();
      }
    };
  }, [isOpen, focusManager]);

  // Format progress for screen readers
  const progressForScreenReader = ScreenReaderSupport.formatProgressForScreenReader(
    actualHours,
    allocatedHours || 1,
    'hours'
  );

  // High contrast colors
  const progressColors = HighContrastSupport.getHighContrastColors(
    timeExceeded ? 'exceeded' : 'running'
  );

  // Reduced motion classes
  const animationClasses = ReducedMotionSupport.getAnimationClasses(
    'transition-all duration-300 ease-in-out'
  );

  // Helper functions
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  const calculateProgress = (): number => {
    if (!allocatedHours || allocatedHours <= 0) return 0;
    return Math.min(100, (actualHours / allocatedHours) * 100);
  };

  const getProgressVariant = () => {
    const progress = calculateProgress();
    if (timeExceeded || progress > 100) return 'destructive';
    if (progress > 90) return 'warning';
    return 'default';
  };

  const getRemainingTime = (): string => {
    if (!allocatedHours) return 'N/A';
    if (timeExceeded) return 'Exceeded';
    const remaining = Math.max(0, allocatedHours - actualHours);
    return formatTime(remaining);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Event handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setHasUnsavedChanges(true);

    // Create preview for images
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById('timer-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFormSubmit = (data: FormData) => {
    if (!selectedFile) return;
    
    onSubmit({
      notes: data.notes.trim(),
      file: selectedFile
    });

    // Reset form state
    form.reset();
    setSelectedFile(null);
    setFilePreview(null);
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges && (notesValue?.trim() || selectedFile)) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        form.reset();
        setSelectedFile(null);
        setFilePreview(null);
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        ref={modalRef}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="stop-timer-modal-title"
        aria-describedby="stop-timer-modal-description"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle 
            id="stop-timer-modal-title"
            className="flex items-center gap-2"
          >
            <Clock className="h-5 w-5" aria-hidden="true" />
            Complete Time Log Entry
          </DialogTitle>
          <DialogDescription id="stop-timer-modal-description">
            Log your work details for "{jobCardTitle}" in {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
                Time Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Stats Grid */}
              <div 
                className="grid grid-cols-3 gap-4 text-center"
                role="group"
                aria-label="Time allocation summary"
              >
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Allocated</p>
                  <p className="text-sm font-medium">
                    {allocatedHours ? formatTime(allocatedHours) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="text-sm font-medium">
                    {formatTime(actualHours)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={cn(
                    "text-sm font-medium",
                    timeExceeded ? "text-destructive" : "text-green-600"
                  )}>
                    {getRemainingTime()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {allocatedHours && allocatedHours > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress())}%</span>
                  </div>
                  <Progress
                    value={calculateProgress()}
                    className={cn("h-2", animationClasses)}
                    style={{
                      backgroundColor: progressColors.backgroundColor,
                      borderColor: progressColors.borderColor
                    }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(calculateProgress())}
                    aria-label={progressForScreenReader}
                  />
                  {timeExceeded && (
                    <Badge 
                      variant="destructive" 
                      className="text-xs"
                      role="status"
                      aria-label="Time allocation exceeded"
                    >
                      Time Exceeded
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning Alerts */}
          {timeExceeded && (
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <strong>Time allocation exceeded.</strong> Please provide detailed explanation for the additional time used.
              </AlertDescription>
            </Alert>
          )}

          <Alert role="status">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Both work description and substantiation file are required to complete the time log.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(handleFormSubmit)} 
              className="space-y-6"
              noValidate
            >
              {/* Work Description */}
              <FormField
                control={form.control}
                name="notes"
                rules={{
                  required: 'Work description is required',
                  minLength: {
                    value: 10,
                    message: 'Work description must be at least 10 characters'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Work Description <span className="text-destructive" aria-label="required">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the work completed during this timer period and results achieved..."
                        rows={4}
                        onChange={(e) => {
                          field.onChange(e);
                          setHasUnsavedChanges(true);
                        }}
                        aria-describedby="notes-help notes-count"
                        aria-invalid={!!errors.notes}
                      />
                    </FormControl>
                    <div 
                      id="notes-help"
                      className="flex justify-between items-center text-xs text-muted-foreground"
                    >
                      <span>Minimum 10 characters required</span>
                      <span id="notes-count" aria-live="polite">
                        Current: {notesValue?.length || 0}
                      </span>
                    </div>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <div className="space-y-3">
                <label htmlFor="timer-file-input" className="text-sm font-medium" id="file-upload-label">
                  Substantiation File <span className="text-destructive" aria-label="required">*</span>
                </label>
                
                {!selectedFile ? (
                  <div 
                    className={cn(
                      "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50",
                      animationClasses
                    )}
                    role="button"
                    tabIndex={0}
                    aria-labelledby="file-upload-label"
                    aria-describedby="file-upload-help"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a file that substantiates the work completed
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      aria-describedby="file-upload-help"
                    />
                    <p id="file-upload-help" className="text-xs text-muted-foreground mt-2">
                      Supports images, PDFs, documents (max 5MB)
                    </p>
                  </div>
                ) : (
                  <Card role="region" aria-label="Selected file">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getFileIcon(selectedFile)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-8 w-8 p-0"
                          aria-label="Remove selected file"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                      
                      {/* Image Preview */}
                      {filePreview && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                          <div className="rounded-md border bg-muted/10 p-2">
                            <img
                              src={filePreview}
                              alt="File preview"
                              className="max-h-40 max-w-full object-contain mx-auto rounded"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {!selectedFile && (
                  <p className="text-sm text-destructive" role="alert">
                    Substantiation file is required
                  </p>
                )}
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={form.handleSubmit(handleFormSubmit)}
            disabled={!notesValue?.trim() || !selectedFile || loading}
            className="min-w-[140px]"
            aria-describedby={loading ? "submit-status" : undefined}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div 
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" 
                  aria-hidden="true"
                />
                <span id="submit-status">Saving...</span>
              </div>
            ) : (
              'Complete Entry'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StopTimerModal;