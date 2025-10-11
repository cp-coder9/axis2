import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Trash2,
  Shield,
  HardDrive
} from 'lucide-react';
import { ProjectFile, UserRole, FilePermissionLevel } from '@/types';
import { useFileUploadManager } from '@/hooks/useCloudinaryUpload';
import { formatFileSize } from '@/utils/formatters';

interface RoleBasedFileUploadProps {
  projectId?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  onUploadComplete: (files: ProjectFile[]) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

export interface RoleBasedFileUploadHandle {
  upload: (files: File[]) => Promise<void>;
  clearUploads: () => void;
}

// Role-based configuration
const ROLE_CONFIGS = {
  [UserRole.ADMIN]: {
    maxFiles: 50,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    monthlyQuota: 10 * 1024 * 1024 * 1024, // 10GB
    acceptedFileTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'text/plain', 'text/csv',
      'application/json', 'application/xml',
      'video/mp4', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav'
    ],
    allowedCategories: ['DOCUMENTS', 'IMAGES', 'ARCHIVES', 'SUBSTANTIATION', 'DELIVERABLES', 'SYSTEM'],
    defaultPermissionLevel: FilePermissionLevel.PROJECT_TEAM,
    canSetPermissions: true,
    description: 'Full access - Upload any file type with complete permission control'
  },
  [UserRole.FREELANCER]: {
    maxFiles: 20,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    monthlyQuota: 2 * 1024 * 1024 * 1024, // 2GB
    acceptedFileTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed',
      'text/plain'
    ],
    allowedCategories: ['DOCUMENTS', 'IMAGES', 'SUBSTANTIATION', 'DELIVERABLES'],
    defaultPermissionLevel: FilePermissionLevel.PROJECT_TEAM,
    canSetPermissions: false,
    description: 'Project files - Upload work deliverables and substantiation documents'
  },
  [UserRole.CLIENT]: {
    maxFiles: 10,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    monthlyQuota: 500 * 1024 * 1024, // 500MB
    acceptedFileTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedCategories: ['DOCUMENTS', 'IMAGES'],
    defaultPermissionLevel: FilePermissionLevel.CLIENT_VISIBLE,
    canSetPermissions: false,
    description: 'Reference materials - Upload project requirements and reference documents'
  }
};

const FILE_CATEGORIES = {
  DOCUMENTS: { label: 'Documents', icon: FileText, color: 'text-blue-500' },
  IMAGES: { label: 'Images', icon: Image, color: 'text-green-500' },
  ARCHIVES: { label: 'Archives', icon: Archive, color: 'text-yellow-500' },
  SUBSTANTIATION: { label: 'Substantiation', icon: Shield, color: 'text-purple-500' },
  DELIVERABLES: { label: 'Deliverables', icon: CheckCircle2, color: 'text-emerald-500' },
  SYSTEM: { label: 'System Files', icon: HardDrive, color: 'text-gray-500' }
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return <Archive className="h-6 w-6 text-yellow-500" />;
  }
  return <File className="h-6 w-6 text-gray-500" />;
};

const getFileCategory = (fileType: string, fileName: string): string => {
  if (fileType.startsWith('image/')) return 'IMAGES';
  if (fileName.toLowerCase().includes('substantiation') || fileName.toLowerCase().includes('proof')) {
    return 'SUBSTANTIATION';
  }
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return 'ARCHIVES';
  }
  return 'DOCUMENTS';
};

export const RoleBasedFileUpload = forwardRef<RoleBasedFileUploadHandle, RoleBasedFileUploadProps>(
  ({
    projectId,
    userId,
    userName,
    userRole,
    onUploadComplete,
    onUploadError,
    className = '',
  }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [permissionLevel, setPermissionLevel] = useState<FilePermissionLevel>(
      ROLE_CONFIGS[userRole].defaultPermissionLevel
    );
    const [usedQuota, setUsedQuota] = useState(0); // This would come from user context in real app
    const fileInputRef = useRef<HTMLInputElement>(null);

    const roleConfig = ROLE_CONFIGS[userRole];

    const {
      uploadFiles,
      uploads,
      isUploading,
      removeUpload,
      clearAllUploads,
      isConfigured
    } = useFileUploadManager();

    const quotaPercentage = useMemo(() => {
      return Math.min((usedQuota / roleConfig.monthlyQuota) * 100, 100);
    }, [usedQuota, roleConfig.monthlyQuota]);

    const validateFile = useCallback((file: File): string | null => {
      if (file.size > roleConfig.maxFileSize) {
        return `File "${file.name}" exceeds ${formatFileSize(roleConfig.maxFileSize)} limit for ${userRole} role`;
      }

      if (!roleConfig.acceptedFileTypes.includes(file.type)) {
        return `File type "${file.type}" is not allowed for ${userRole} role`;
      }

      const category = getFileCategory(file.type, file.name);
      if (!roleConfig.allowedCategories.includes(category)) {
        return `File category "${category}" is not allowed for ${userRole} role`;
      }

      // Check quota
      const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0) + file.size;
      if (usedQuota + totalSize > roleConfig.monthlyQuota) {
        return `Upload would exceed monthly quota of ${formatFileSize(roleConfig.monthlyQuota)}`;
      }

      return null;
    }, [roleConfig, userRole, selectedFiles, usedQuota]);

    const validateFiles = useCallback((files: File[]): string[] => {
      const errors: string[] = [];

      if (files.length > roleConfig.maxFiles) {
        errors.push(`Maximum ${roleConfig.maxFiles} files allowed for ${userRole} role`);
      }

      files.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        }
      });

      return errors;
    }, [roleConfig, userRole, validateFile]);

    const handleFileSelect = useCallback((files: File[]) => {
      const errors = validateFiles(files);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setSelectedFiles(files);
        // Auto-select category based on first file if not already selected
        if (!selectedCategory && files.length > 0) {
          const autoCategory = getFileCategory(files[0].type, files[0].name);
          if (roleConfig.allowedCategories.includes(autoCategory)) {
            setSelectedCategory(autoCategory);
          }
        }
      }
    }, [validateFiles, selectedCategory, roleConfig.allowedCategories]);

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
      setSelectedCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);

    const handleUpload = useCallback(async (files?: File[]) => {
      const filesToUpload = files || selectedFiles;
      
      if (filesToUpload.length === 0 || !isConfigured) return;

      if (!selectedCategory) {
        setValidationErrors(['Please select a file category']);
        return;
      }

      try {
        const cloudinaryOptions = {
          category: selectedCategory as any,
          projectId: projectId,
          tags: [selectedCategory, userRole, ...(projectId ? [`project-${projectId}`] : [])],
          description: `${selectedCategory} file uploaded by ${userRole}`
        };

        const uploadedFiles = await uploadFiles(
          filesToUpload,
          userId,
          userName,
          userRole,
          cloudinaryOptions
        );

        // Set permissions based on role and selection
        const filesWithPermissions = uploadedFiles.map(file => ({
          ...file,
          permissions: {
            level: permissionLevel,
            allowDownload: true,
            allowShare: userRole === UserRole.ADMIN,
            allowDelete: userRole === UserRole.ADMIN || file.uploaderId === userId,
            allowVersioning: userRole !== UserRole.CLIENT,
            allowComments: true,
          }
        }));

        onUploadComplete(filesWithPermissions);
        clearSelectedFiles();
        
        // Update used quota (in real app, this would be fetched from backend)
        const uploadedSize = filesToUpload.reduce((sum, file) => sum + file.size, 0);
        setUsedQuota(prev => prev + uploadedSize);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError(errorMessage);
      }
    }, [selectedFiles, isConfigured, selectedCategory, projectId, userId, uploadFiles, userName, userRole, permissionLevel, onUploadComplete, onUploadError, clearSelectedFiles]);

    useImperativeHandle(ref, () => ({
      upload: handleUpload,
      clearUploads: () => {
        clearSelectedFiles();
        clearAllUploads();
      }
    }), [handleUpload, clearSelectedFiles, clearAllUploads]);

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Role Information and Quota */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              {userRole} Upload Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {roleConfig.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span>Max {roleConfig.maxFiles} files</span>
              </div>
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span>{formatFileSize(roleConfig.maxFileSize)} per file</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>{formatFileSize(roleConfig.monthlyQuota)} monthly</span>
              </div>
            </div>

            {/* Quota Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Quota Usage</span>
                <span>{formatFileSize(usedQuota)} / {formatFileSize(roleConfig.monthlyQuota)}</span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
              {quotaPercentage > 80 && (
                <p className="text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Approaching quota limit
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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
                  Maximum {roleConfig.maxFiles} files, {formatFileSize(roleConfig.maxFileSize)} each
                </p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {roleConfig.allowedCategories.map(category => {
                    const categoryInfo = FILE_CATEGORIES[category as keyof typeof FILE_CATEGORIES];
                    return (
                      <Badge key={category} variant="outline" className="text-xs">
                        {categoryInfo.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              accept={roleConfig.acceptedFileTypes.join(',')}
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

        {/* Selected Files and Upload Options */}
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

              {/* File Category Selection */}
              <div className="mb-4">
                <label htmlFor="file-category-select" className="text-sm font-medium mb-2 block">File Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="file-category-select" className="w-full">
                    <SelectValue placeholder="Select file category" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleConfig.allowedCategories.map(category => {
                      const categoryInfo = FILE_CATEGORIES[category as keyof typeof FILE_CATEGORIES];
                      const IconComponent = categoryInfo.icon;
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${categoryInfo.color}`} />
                            {categoryInfo.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Permission Level Selection (Admin only) */}
              {roleConfig.canSetPermissions && (
                <div className="mb-4">
                  <label htmlFor="permission-level-select" className="text-sm font-medium mb-2 block">Permission Level</label>
                  <Select value={permissionLevel} onValueChange={(value) => setPermissionLevel(value as FilePermissionLevel)}>
                    <SelectTrigger id="permission-level-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FilePermissionLevel.ADMIN_ONLY}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          Admin Only
                        </div>
                      </SelectItem>
                      <SelectItem value={FilePermissionLevel.PROJECT_TEAM}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Project Team
                        </div>
                      </SelectItem>
                      <SelectItem value={FilePermissionLevel.CLIENT_VISIBLE}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Client Visible
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                          <Badge variant="outline" className="text-xs">
                            {getFileCategory(file.type, file.name)}
                          </Badge>
                        </div>
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
                  disabled={isUploading || !isConfigured || validationErrors.length > 0 || !selectedCategory}
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

RoleBasedFileUpload.displayName = 'RoleBasedFileUpload';