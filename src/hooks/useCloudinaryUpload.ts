import { useState, useCallback } from 'react';
import { ProjectFile, UserRole, FilePermissionLevel } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { 
  cloudinaryManagementService,
  CloudinaryManagementService 
} from '@/services/cloudinaryManagementService';
import { cspAwareCloudinaryService } from '@/utils/cspAwareCloudinaryService';

// Use Timestamp for file metadata
const createTimestamp = () => Timestamp.now();

// Use CloudinaryManagementService for advanced operations
const getManagementService = (): CloudinaryManagementService => cloudinaryManagementService;
import { 
  FileCategory, 
  FileMetadata 
} from '@/services/cloudinaryFolderService';

interface FileUploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  progressCallback?: (progress: number) => void;
  category?: FileCategory;
  projectId?: string;
  description?: string;
}

interface UseCloudinaryUploadOptions {
  onUploadStart?: (fileId: string, fileName: string) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, projectFile: ProjectFile) => void;
  onUploadError?: (fileId: string, error: string) => void;
}

interface UseCloudinaryUploadReturn {
  uploadFile: (
    file: File,
    userId: string,
    userName: string,
    userRole?: UserRole,
    options?: CloudinaryUploadOptions
  ) => Promise<ProjectFile>;
  uploadFiles: (
    files: File[],
    userId: string,
    userName: string,
    userRole?: UserRole,
    options?: CloudinaryUploadOptions
  ) => Promise<ProjectFile[]>;
  uploadProgress: Record<string, FileUploadProgress>;
  isUploading: boolean;
  cancelUpload: (fileId: string) => void;
  clearProgress: () => void;
  isConfigured: boolean;
}

// Cloudinary configuration validation
const validateCloudinaryConfig = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  return {
    isValid: !!(cloudName && uploadPreset),
    cloudName,
    uploadPreset,
  };
};

// Upload file to Cloudinary using CSP-aware service with fallback
const uploadToCloudinary = async (
  file: File,
  userId: string,
  userName: string,
  userRole: UserRole = UserRole.FREELANCER,
  options: CloudinaryUploadOptions = {}
): Promise<ProjectFile> => {
  // Try CSP-aware upload first with Firebase fallback enabled
  const result = await cspAwareCloudinaryService.uploadFile(
    file,
    userId,
    userName,
    userRole,
    {
      ...options,
      fallbackToFirebase: true,
      retryAttempts: 3
    }
  );

  if (!result.success || !result.projectFile) {
    throw new Error(result.error || 'Upload failed');
  }

  // Log if fallback was used
  if (result.usedFallback) {
    console.warn('⚠️ File uploaded using Firebase fallback due to CSP restrictions');
  }

  return result.projectFile;
};

export const useCloudinaryUpload = (
  options: UseCloudinaryUploadOptions = {}
): UseCloudinaryUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [abortControllers, setAbortControllers] = useState<Record<string, AbortController>>({});

  const { onUploadStart, onUploadProgress, onUploadComplete, onUploadError } = options;

  const generateFileId = useCallback(() => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const updateProgress = useCallback((fileId: string, updates: Partial<FileUploadProgress>) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...updates }
    }));
  }, []);

  const removeProgress = useCallback((fileId: string) => {
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers[fileId];
    if (controller) {
      controller.abort();
      setAbortControllers(prev => {
        const newControllers = { ...prev };
        delete newControllers[fileId];
        return newControllers;
      });
    }
    updateProgress(fileId, { status: 'error', error: 'Upload cancelled' });
    onUploadError?.(fileId, 'Upload cancelled');
  }, [abortControllers, updateProgress, onUploadError]);

  const clearProgress = useCallback(() => {
    setUploadProgress({});
    setAbortControllers({});
    setIsUploading(false);
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    userId: string,
    userName: string,
    userRole: UserRole = UserRole.FREELANCER,
    uploadOptions: CloudinaryUploadOptions = {}
  ): Promise<ProjectFile> => {
    const config = validateCloudinaryConfig();
    
    if (!config.isValid) {
      throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
    }

    const fileId = generateFileId();

    // Create abort controller for this upload
    const controller = new AbortController();
    setAbortControllers(prev => ({ ...prev, [fileId]: controller }));

    // Initialize progress tracking
    const initialProgress: FileUploadProgress = {
      id: fileId,
      name: file.name,
      progress: 0,
      status: 'uploading'
    };

    setUploadProgress(prev => ({ ...prev, [fileId]: initialProgress }));
    setIsUploading(true);

    onUploadStart?.(fileId, file.name);

    try {
      // Simulate progress updates (Cloudinary doesn't provide real-time progress for unsigned uploads)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId];
          if (current && current.progress < 90) {
            const newProgress = Math.min(current.progress + Math.random() * 20, 90);
            updateProgress(fileId, { progress: newProgress });
            onUploadProgress?.(fileId, newProgress);
          }
          return prev;
        });
      }, 500);

      // Upload to Cloudinary with enhanced options
      const enhancedOptions = {
        ...uploadOptions,
        progressCallback: (progress: number) => {
          updateProgress(fileId, { progress: Math.round(progress) });
          onUploadProgress?.(fileId, Math.round(progress));
        }
      };

      const projectFile = await uploadToCloudinary(
        file,
        userId,
        userName,
        userRole,
        enhancedOptions
      );

      clearInterval(progressInterval);

      // Mark as completed
      updateProgress(fileId, {
        progress: 100,
        status: 'completed'
      });

      onUploadComplete?.(fileId, projectFile);

      // Clean up after successful upload
      setTimeout(() => {
        removeProgress(fileId);
        setAbortControllers(prev => {
          const newControllers = { ...prev };
          delete newControllers[fileId];
          return newControllers;
        });
      }, 3000); // Keep success message for 3 seconds

      return projectFile;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      updateProgress(fileId, {
        status: 'error',
        error: errorMessage
      });

      onUploadError?.(fileId, errorMessage);

      throw error;
    } finally {
      // Check if any uploads are still in progress
      const remainingUploads = Object.values(uploadProgress).filter(
        upload => upload.status === 'uploading' && upload.id !== fileId
      );

      if (remainingUploads.length === 0) {
        setIsUploading(false);
      }
    }
  }, [
    generateFileId,
    updateProgress,
    removeProgress,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    uploadProgress
  ]);

  const uploadFiles = useCallback(async (
    files: File[],
    userId: string,
    userName: string,
    userRole: UserRole = UserRole.FREELANCER,
    uploadOptions: CloudinaryUploadOptions = {}
  ): Promise<ProjectFile[]> => {
    if (!validateCloudinaryConfig().isValid) {
      throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
    }

    if (files.length === 0) {
      return [];
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(file => 
        uploadFile(file, userId, userName, userRole, uploadOptions)
      );

      const results = await Promise.all(uploadPromises);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch upload failed';
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  return {
    uploadFile,
    uploadFiles,
    uploadProgress,
    isUploading,
    cancelUpload,
    clearProgress,
    isConfigured: cloudinaryManagementService.isConfigured()
  };
};

// Helper hook for component-level upload management
export const useFileUploadManager = () => {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);

  const cloudinaryUpload = useCloudinaryUpload({
    onUploadStart: (fileId, fileName) => {
      setUploads(prev => [...prev, {
        id: fileId,
        name: fileName,
        progress: 0,
        status: 'uploading'
      }]);
    },
    onUploadProgress: (fileId, progress) => {
      setUploads(prev => prev.map(upload =>
        upload.id === fileId
          ? { ...upload, progress }
          : upload
      ));
    },
    onUploadComplete: (fileId) => {
      setUploads(prev => prev.map(upload =>
        upload.id === fileId
          ? { ...upload, progress: 100, status: 'completed' }
          : upload
      ));
    },
    onUploadError: (fileId, error) => {
      setUploads(prev => prev.map(upload =>
        upload.id === fileId
          ? { ...upload, status: 'error', error }
          : upload
      ));
    }
  });

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const clearAllUploads = useCallback(() => {
    setUploads([]);
    cloudinaryUpload.clearProgress();
  }, [cloudinaryUpload]);

  return {
    ...cloudinaryUpload,
    uploads,
    removeUpload,
    clearAllUploads
  };
};