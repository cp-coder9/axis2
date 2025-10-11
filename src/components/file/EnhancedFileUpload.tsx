import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  File,
  Image,
  FileText,
  Archive,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { ProjectFile } from '@/types';
import { useFileUploadManager } from '@/hooks/useCloudinaryUpload';
import { formatFileSize } from '@/utils/formatters';

interface EnhancedFileUploadProps {
  projectId?: string;
  userId: string;
  userName: string;
  onUploadComplete: (files: ProjectFile[]) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export interface EnhancedFileUploadHandle {
  upload: (files: File[]) => Promise<void>;
  clearUploads: () => void;
}

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className="h-6 w-6 text-yellow-500" />;
  }
  return <File className="h-6 w-6 text-gray-500" />;
};

export const EnhancedFileUpload = forwardRef<EnhancedFileUploadHandle, EnhancedFileUploadProps>(
  ({
    projectId,
    userId,
    userName,
    onUploadComplete,
    onUploadError,
    maxFiles = MAX_FILES,
    maxFileSize = MAX_FILE_SIZE,
    acceptedFileTypes = ACCEPTED_FILE_TYPES,
    className = '',
  }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
      uploadFiles,
      uploads,
      isUploading,
      removeUpload,
      clearAllUploads,
      isConfigured
    } = useFileUploadManager();

    const validateFile = useCallback((file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File "${file.name}" exceeds ${formatFileSize(maxFileSize)} limit`;
      }

      if (!acceptedFileTypes.includes(file.type)) {
        return `File type "${file.type}" is not supported`;
      }

      return null;
    }, [maxFileSize, acceptedFileTypes]);

    const validateFiles = useCallback((files: File[]): string[] => {
      const errors: string[] = [];

      if (files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
      }

      files.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        }
      });

      return errors;
    }, [maxFiles, validateFile]);

    const handleFileSelect = useCallback((files: File[]) => {
      const errors = validateFiles(files);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setSelectedFiles(files);
      }
    }, [validateFiles]);

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files) {
        const files = Array.from(e.dataTransfer.files);
        handleFileSelect(files);
      }
    }, [handleFileSelect]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFileSelect(files);
      }
    }, [handleFileSelect]);

    const removeSelectedFile = useCallback((index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      setValidationErrors([]);
    }, []);

    const clearSelectedFiles = useCallback(() => {
      setSelectedFiles([]);
      setValidationErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);

    const handleUpload = useCallback(async (files?: File[]) => {
      const filesToUpload = files || selectedFiles;
      
      if (filesToUpload.length === 0 || !isConfigured) return;

      try {
        const cloudinaryOptions = {
          projectId: projectId,
          category: 'DOCUMENTS' as any,
          tags: projectId ? [`project-${projectId}`] : [`user-${userId}`],
          description: 'File uploaded via enhanced upload component'
        };

        const uploadedFiles = await uploadFiles(
          filesToUpload,
          userId,
          userName,
          undefined,
          cloudinaryOptions
        );

        onUploadComplete(uploadedFiles);
        clearSelectedFiles();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError(errorMessage);
      }
    }, [selectedFiles, isConfigured, projectId, userId, uploadFiles, userName, onUploadComplete, onUploadError, clearSelectedFiles]);

    useImperativeHandle(ref, () => ({
      upload: handleUpload,
      clearUploads: () => {
        clearSelectedFiles();
        clearAllUploads();
      }
    }), [handleUpload, clearSelectedFiles, clearAllUploads]);

    return (
      <div className={`space-y-4 ${className}`}>
        {/* File Selection Area */}
        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              role="button"
              tabIndex={0}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports images, PDFs, documents, and archives
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              accept={acceptedFileTypes.join(',')}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Warning */}
        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cloudinary is not configured. Please check your environment variables.
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedFiles}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  onClick={() => handleUpload()}
                  disabled={isUploading || !isConfigured || validationErrors.length > 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-4">Upload Progress</h4>
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {upload.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : upload.status === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{upload.name}</p>
                          {upload.error && (
                            <p className="text-xs text-red-500">{upload.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          upload.status === 'completed' ? 'default' :
                          upload.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {upload.status === 'completed' ? 'Complete' :
                           upload.status === 'error' ? 'Failed' : `${upload.progress}%`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUpload(upload.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

EnhancedFileUpload.displayName = 'EnhancedFileUpload';