import { useState, useCallback, useEffect, useMemo } from 'react';
import { UserRole, FilePermissionLevel } from '@/types';
import { useAppContext } from '@/contexts/AppContext';

interface UploadQuota {
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
}

interface RoleUploadConfig {
  maxFiles: number;
  maxFileSize: number;
  monthlyQuota: number;
  acceptedFileTypes: string[];
  allowedCategories: string[];
  defaultPermissionLevel: FilePermissionLevel;
  canSetPermissions: boolean;
  description: string;
}

interface UseRoleBasedUploadReturn {
  config: RoleUploadConfig;
  quota: UploadQuota;
  canUpload: (files: File[]) => { allowed: boolean; errors: string[] };
  validateFile: (file: File) => string | null;
  validateFiles: (files: File[]) => string[];
  updateQuotaUsage: (bytesUploaded: number) => void;
  resetQuota: () => void;
  getUploadFolder: (projectId?: string, category?: string) => string;
  getUploadTags: (projectId?: string, category?: string) => string[];
}

// Role-based upload configurations
const ROLE_UPLOAD_CONFIGS: Record<UserRole, RoleUploadConfig> = {
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
      'text/plain', 'text/csv', 'application/json', 'application/xml',
      'video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav'
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

// File category detection
const getFileCategory = (fileType: string, fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();
  
  if (fileType.startsWith('image/')) return 'IMAGES';
  if (lowerFileName.includes('substantiation') || lowerFileName.includes('proof') || lowerFileName.includes('timesheet')) {
    return 'SUBSTANTIATION';
  }
  if (lowerFileName.includes('deliverable') || lowerFileName.includes('final') || lowerFileName.includes('completed')) {
    return 'DELIVERABLES';
  }
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
    return 'ARCHIVES';
  }
  if (lowerFileName.includes('system') || lowerFileName.includes('config') || lowerFileName.includes('backup')) {
    return 'SYSTEM';
  }
  return 'DOCUMENTS';
};

export const useRoleBasedUpload = (userRole: UserRole, userId: string): UseRoleBasedUploadReturn => {
  const { currentUser } = useAppContext();
  const [quotaUsed, setQuotaUsed] = useState<number>(0);

  // Use currentUser for additional validation and context
  const isCurrentUserValid = currentUser && currentUser.id === userId;

  const config = ROLE_UPLOAD_CONFIGS[userRole];

  // Calculate quota information
  const quota = useMemo((): UploadQuota => {
    const percentage = Math.min((quotaUsed / config.monthlyQuota) * 100, 100);
    const remaining = Math.max(config.monthlyQuota - quotaUsed, 0);
    
    return {
      used: quotaUsed,
      limit: config.monthlyQuota,
      percentage,
      remaining
    };
  }, [quotaUsed, config.monthlyQuota]);

  // Load user's current quota usage (in a real app, this would come from the backend)
  useEffect(() => {
    // Simulate loading quota from backend
    // In real implementation, this would be an API call
    const loadQuotaUsage = async () => {
      try {
        // Validate current user before loading quota
        if (!isCurrentUserValid) {
          console.warn('Current user validation failed for quota loading');
          setQuotaUsed(0);
          return;
        }
        
        // Placeholder for actual quota loading
        // const usage = await getUserQuotaUsage(userId);
        // setQuotaUsed(usage);
        setQuotaUsed(0); // Default to 0 for now
      } catch (error) {
        console.error('Failed to load quota usage:', error);
        setQuotaUsed(0);
      }
    };

    loadQuotaUsage();
  }, [userId, isCurrentUserValid]);

  // Validate individual file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > config.maxFileSize) {
      return `File "${file.name}" exceeds ${(config.maxFileSize / (1024 * 1024)).toFixed(0)}MB limit for ${userRole} role`;
    }

    // Check file type
    if (!config.acceptedFileTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed for ${userRole} role`;
    }

    // Check file category
    const category = getFileCategory(file.type, file.name);
    if (!config.allowedCategories.includes(category)) {
      return `File category "${category}" is not allowed for ${userRole} role`;
    }

    // Check quota
    if (quotaUsed + file.size > config.monthlyQuota) {
      const remainingMB = Math.max(config.monthlyQuota - quotaUsed, 0) / (1024 * 1024);
      return `Upload would exceed monthly quota. ${remainingMB.toFixed(1)}MB remaining`;
    }

    return null;
  }, [config, userRole, quotaUsed]);

  // Validate multiple files
  const validateFiles = useCallback((files: File[]): string[] => {
    const errors: string[] = [];

    // Check file count
    if (files.length > config.maxFiles) {
      errors.push(`Maximum ${config.maxFiles} files allowed for ${userRole} role`);
    }

    // Check total size against quota
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (quotaUsed + totalSize > config.monthlyQuota) {
      const remainingMB = Math.max(config.monthlyQuota - quotaUsed, 0) / (1024 * 1024);
      errors.push(`Upload would exceed monthly quota. ${remainingMB.toFixed(1)}MB remaining`);
    }

    // Validate each file
    files.forEach(file => {
      const error = validateFile(file);
      if (error && !errors.includes(error)) {
        errors.push(error);
      }
    });

    return errors;
  }, [config, userRole, quotaUsed, validateFile]);

  // Check if upload is allowed
  const canUpload = useCallback((files: File[]): { allowed: boolean; errors: string[] } => {
    const errors = validateFiles(files);
    return {
      allowed: errors.length === 0,
      errors
    };
  }, [validateFiles]);

  // Update quota usage
  const updateQuotaUsage = useCallback((bytesUploaded: number) => {
    setQuotaUsed(prev => prev + bytesUploaded);
    
    // In a real app, this would also update the backend
    // updateUserQuotaUsage(userId, bytesUploaded);
  }, []);

  // Reset quota (for testing or admin actions)
  const resetQuota = useCallback(() => {
    setQuotaUsed(0);
  }, []);

  // Get upload folder path based on role and context
  const getUploadFolder = useCallback((projectId?: string, category?: string): string => {
    const baseFolder = projectId ? `projects/${projectId}` : `users/${userId}`;
    const categoryFolder = category ? category.toLowerCase() : 'general';
    return `${baseFolder}/${categoryFolder}`;
  }, [userId]);

  // Get upload tags based on role and context
  const getUploadTags = useCallback((projectId?: string, category?: string): string[] => {
    const tags = [userRole.toLowerCase()];
    
    if (projectId) {
      tags.push(`project-${projectId}`);
    }
    
    if (category) {
      tags.push(category.toLowerCase());
    }
    
    tags.push(`user-${userId}`);
    
    return tags;
  }, [userRole, userId]);

  return {
    config,
    quota,
    canUpload,
    validateFile,
    validateFiles,
    updateQuotaUsage,
    resetQuota,
    getUploadFolder,
    getUploadTags
  };
};

// Helper hook for quota monitoring
export const useUploadQuotaMonitor = (userRole: UserRole, userId: string) => {
  const { quota, config } = useRoleBasedUpload(userRole, userId);

  const isNearLimit = quota.percentage > 80;
  const isAtLimit = quota.percentage >= 100;
  
  const getQuotaStatus = (): 'normal' | 'warning' | 'critical' => {
    if (isAtLimit) return 'critical';
    if (isNearLimit) return 'warning';
    return 'normal';
  };

  const getQuotaMessage = (): string => {
    const remainingMB = quota.remaining / (1024 * 1024);
    
    if (isAtLimit) {
      return 'Upload quota exceeded. Contact admin to increase limit.';
    }
    
    if (isNearLimit) {
      return `Approaching upload limit. ${remainingMB.toFixed(1)}MB remaining.`;
    }
    
    return `${remainingMB.toFixed(1)}MB remaining this month.`;
  };

  return {
    quota,
    config,
    isNearLimit,
    isAtLimit,
    status: getQuotaStatus(),
    message: getQuotaMessage()
  };
};