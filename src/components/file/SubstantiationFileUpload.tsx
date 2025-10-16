import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Upload,
  File,
  Image,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Shield
} from 'lucide-react';
import { ProjectFile, UserRole, FilePermissionLevel } from '@/types';
import { useFileUploadManager } from '@/hooks/useCloudinaryUpload';
import { useRoleBasedUpload } from '@/hooks/useRoleBasedUpload';
import { formatFileSize } from '@/utils/formatters';

interface SubstantiationFileUploadProps {
  projectId: string;
  jobCardId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  onUploadComplete: (files: ProjectFile[], description: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

// Substantiation-specific file types
const SUBSTANTIATION_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_SUBSTANTIATION_FILES = 5;
const MAX_SUBSTANTIATION_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

export const SubstantiationFileUpload: React.FC<SubstantiationFileUploadProps> = ({
  projectId,
  jobCardId,
  userId,
  userName,
  userRole,
  onUploadComplete,
  onUploadError,
  className = '',
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validateFile, validateFiles } = useRoleBasedUpload(userRole, userId);
  const {
    uploadFiles,
    uploads,
    isUploading,
    removeUpload,
    clearAllUploads,
    isConfigured
  } = useFileUploadManager();

  const validateSubstantiationFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_SUBSTANTIATION_FILE_SIZE) {
      return `File "${file.name}" exceeds ${formatFileSize(MAX_SUBSTANTIATION_FILE_SIZE)} limit for substantiation files`;
    }

    // Check file type
    if (!SUBSTANTIATION_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported for substantiation files`;
    }

    // Use role-based validation as well
    const roleError = validateFile(file);
    if (roleError) {
      return roleError;
    }

    return null;
  }, [validateFile]);

  const validateSubstantiationFiles = useCallback((files: File[]): string[] => {
    const errors: string[] = [];

    if (files.length > MAX_SUBSTANTIATION_FILES) {
      errors.push(`Maximum ${MAX_SUBSTANTIATION_FILES} substantiation files allowed`);
    }

    files.forEach(file => {
      const error = validateSubstantiationFile(file);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }, [validateSubstantiationFile]);

  const handleFileSelect = useCallback((files: File[]) => {
    const errors = validateSubstantiationFiles(files);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setSelectedFiles(files);
    }
  }, [validateSubstantiationFiles]);

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

    if (e.dataTransfer.files && !disabled) {
      const files = Array.from(e.dataTransfer.files);
      handleFileSelect(files);
    }
  }, [handleFileSelect, disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled) {
      const files = Array.from(e.target.files);
      handleFileSelect(files);
    }
  }, [handleFileSelect, disabled]);

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setValidationErrors([]);
  }, []);

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
    setValidationErrors([]);
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || !isConfigured || disabled) return;

    if (!description.trim()) {
      setValidationErrors(['Please provide a description for the substantiation files']);
      return;
    }

    try {
      const cloudinaryOptions = {
        folder: `projects/${projectId}/substantiation/${jobCardId}`,
        tags: ['substantiation', 'timer', userRole.toLowerCase(), `project-${projectId}`, `job-${jobCardId}`],
      };

      const uploadedFiles = await uploadFiles(
        selectedFiles,
        userId,
        userName,
        userRole,
        cloudinaryOptions
      );

      // Set substantiation-specific permissions
      const filesWithPermissions = uploadedFiles.map(file => ({
        ...file,
        permissionLevel: FilePermissionLevel.PROJECT_TEAM,
        uploadedBy: userId,
        permissions: {
          level: FilePermissionLevel.PROJECT_TEAM,
          allowView: true,
          allowEdit: false,
          allowDownload: true,
          allowShare: false,
          allowDelete: userRole === UserRole.ADMIN || file.uploaderId === userId,
          allowVersioning: false, // Substantiation files shouldn't be versioned
          allowComments: true,
        }
      }));

      onUploadComplete(filesWithPermissions, description.trim());
      clearSelectedFiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError(errorMessage);
    }
  }, [selectedFiles, isConfigured, disabled, description, projectId, jobCardId, uploadFiles, userId, userName, userRole, onUploadComplete, onUploadError, clearSelectedFiles]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Substantiation Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload proof of work documents to substantiate your time log entry.
            Accepted formats: Images, PDFs, and documents up to {formatFileSize(MAX_SUBSTANTIATION_FILE_SIZE)} each.
          </p>
        </CardContent>
      </Card>

      {/* File Selection Area */}
      <Card>
        <CardContent className="p-6">
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${disabled
                ? 'border-muted-foreground/10 bg-muted/20 cursor-not-allowed'
                : dragActive
                  ? 'border-primary bg-primary/5 cursor-pointer'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer'
              }`}
            onDragEnter={!disabled ? handleDrag : undefined}
            onDragLeave={!disabled ? handleDrag : undefined}
            onDragOver={!disabled ? handleDrag : undefined}
            onDrop={!disabled ? handleDrop : undefined}
            onClick={!disabled ? () => fileInputRef.current?.click() : undefined}
            onKeyDown={!disabled ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            } : undefined}
            aria-label={disabled ? "File upload disabled" : "Click to select substantiation files or drag and drop files here"}
          >
            <Upload className={`h-10 w-10 mx-auto mb-3 ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
            <div className="space-y-2">
              <p className={`text-base font-medium ${disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                {disabled ? 'Upload disabled' : 'Drop substantiation files here or click to browse'}
              </p>
              <p className={`text-sm ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                Maximum {MAX_SUBSTANTIATION_FILES} files, {formatFileSize(MAX_SUBSTANTIATION_FILE_SIZE)} each
              </p>
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs">Images</Badge>
                <Badge variant="outline" className="text-xs">PDFs</Badge>
                <Badge variant="outline" className="text-xs">Documents</Badge>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            accept={SUBSTANTIATION_FILE_TYPES.join(',')}
            className="hidden"
            disabled={disabled}
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

      {/* Selected Files and Description */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelectedFiles}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Selected Files List */}
            <div className="space-y-2 mb-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.type}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="substantiation-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="substantiation-description"
                placeholder="Describe the work performed and how these files substantiate your time log..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={disabled}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide details about the work completed and how the uploaded files serve as proof.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !isConfigured || validationErrors.length > 0 || !description.trim() || disabled}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Substantiation Files
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
                        <X className="h-4 w-4" />
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
};