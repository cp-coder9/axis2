import React, { useRef, useState } from 'react';
import { Paperclip, X, Upload, File, Image, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';

interface FileUploadHandlerProps {
  onFileSelect: (files: File[]) => void;
  onFileUpload?: (file: File, progress: number) => Promise<string>;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
  onFileSelect,
  onFileUpload,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt'],
  multiple = false,
  disabled = false,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isAllowed) {
      return 'File type not allowed';
    }

    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // In a real app, show these errors to the user
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
      
      if (onFileUpload) {
        uploadFiles(validFiles);
      }
    }
  };

  const uploadFiles = async (files: File[]) => {
    const newUploads: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        if (onFileUpload) {
          // Simulate upload progress
          const uploadPromise = onFileUpload(file, 0);
          
          // Update progress
          const progressInterval = setInterval(() => {
            setUploadingFiles(prev => 
              prev.map(upload => 
                upload.file === file && upload.status === 'uploading'
                  ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
                  : upload
              )
            );
          }, 200);

          const url = await uploadPromise;
          
          clearInterval(progressInterval);
          
          setUploadingFiles(prev => 
            prev.map(upload => 
              upload.file === file
                ? { ...upload, progress: 100, status: 'completed', url }
                : upload
            )
          );
        }
      } catch (error) {
        setUploadingFiles(prev => 
          prev.map(upload => 
            upload.file === file
              ? { 
                  ...upload, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : upload
          )
        );
      }
    }
  };

  const removeUpload = (file: File) => {
    setUploadingFiles(prev => prev.filter(upload => upload.file !== file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('relative', className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={openFileDialog}
        disabled={disabled}
        className="h-10 w-10 shrink-0 touch-manipulation"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Paperclip className={cn(
          'h-5 w-5 transition-colors',
          dragOver && 'text-primary'
        )} />
      </Button>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 space-y-2 bg-background border rounded-lg p-3 shadow-lg z-50">
          <div className="text-sm font-medium">Uploading files...</div>
          
          {uploadingFiles.map((upload, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                {getFileIcon(upload.file)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{upload.file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(upload.file.size)}
                  </div>
                </div>
                
                {upload.status === 'uploading' && (
                  <div className="text-xs text-muted-foreground">
                    {upload.progress}%
                  </div>
                )}
                
                {upload.status === 'completed' && (
                  <div className="text-xs text-green-600">✓</div>
                )}
                
                {upload.status === 'error' && (
                  <div className="text-xs text-red-600">✗</div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(upload.file)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="h-1" />
              )}
              
              {upload.status === 'error' && upload.error && (
                <div className="text-xs text-red-600">{upload.error}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drag Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium text-primary">
              Drop files here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadHandler;