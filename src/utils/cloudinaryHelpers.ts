import { ProjectFile, UserRole, FilePermissionLevel, AppFile } from '@/types';
import { FileCategory, FileMetadata, cloudinaryFolderService } from '@/services/cloudinaryFolderService';
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService';
import { fileMetadataService } from '@/services/fileMetadataService';

/**
 * Utility functions for Cloudinary integration and file management
 */

/**
 * Extract project ID from Cloudinary folder path
 */
export const extractProjectIdFromPath = (folderPath: string): string | undefined => {
  const match = folderPath.match(/projects\/([^\/]+)/);
  return match ? match[1] : undefined;
};

/**
 * Extract user ID from Cloudinary folder path
 */
export const extractUserIdFromPath = (folderPath: string): string | undefined => {
  const match = folderPath.match(/users\/([^\/]+)/);
  return match ? match[1] : undefined;
};

/**
 * Generate file metadata from existing ProjectFile
 */
export const generateMetadataFromAppFile = (
  file: AppFile,
  userRole: UserRole,
  userId?: string
): FileMetadata => {
  const projectFile = file as ProjectFile;
  return {
    userId: projectFile.uploaderId || userId || '',
    userName: projectFile.uploaderName || '',
    userRole,
    category: (file.category as FileCategory) || FileCategory.DOCUMENTS,
    projectId: projectFile.projectId,
    tags: file.tags || [],
    permissions: projectFile.permissions?.level || FilePermissionLevel.PROJECT_TEAM,
    description: `Migrated file: ${file.name}`
  };
};

/**
 * Validate file access for user
 */
export const validateFileAccess = (
  file: ProjectFile,
  userRole: UserRole,
  userId: string,
  projectMemberIds: string[] = []
): { canAccess: boolean; canDownload: boolean; canDelete: boolean; reason?: string } => {
  // Admin has full access
  if (userRole === UserRole.ADMIN) {
    return {
      canAccess: true,
      canDownload: true,
      canDelete: true
    };
  }

  // Check if user owns the file
  if (file.uploadedBy === userId || file.uploaderId === userId) {
    return {
      canAccess: true,
      canDownload: true,
      canDelete: userRole !== UserRole.CLIENT
    };
  }

  // Check project membership
  if (file.projectId && projectMemberIds.includes(userId)) {
    const permissions = file.permissions;
    
    if (permissions?.level === FilePermissionLevel.CLIENT_VISIBLE) {
      return {
        canAccess: true,
        canDownload: permissions.allowDownload !== false,
        canDelete: false
      };
    }
    
    if (permissions?.level === FilePermissionLevel.PROJECT_TEAM && userRole !== UserRole.CLIENT) {
      return {
        canAccess: true,
        canDownload: permissions.allowDownload !== false,
        canDelete: false
      };
    }
  }

  return {
    canAccess: false,
    canDownload: false,
    canDelete: false,
    reason: 'Insufficient permissions'
  };
};

/**
 * Generate secure download URL for file
 */
export const generateSecureDownloadUrl = (
  file: AppFile,
  userRole: UserRole,
  downloadName?: string
): string => {
  const projectFile = file as ProjectFile;
  const publicId = projectFile.cloudinaryPublicId || projectFile.id;

  // If it's a fallback URL, just return it
  if (file.url.includes('firebase')) {
    return file.url;
  }
  
  return cloudinaryManagementService.generateSignedUrl(publicId, userRole, {
    expiresIn: 3600, // 1 hour
    downloadName: downloadName || file.name
  });
};

/**
 * Generate preview URL for file
 */
export const generatePreviewUrl = (
  file: AppFile,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string => {
  const projectFile = file as ProjectFile;
  const publicId = projectFile.cloudinaryPublicId || projectFile.id;

  // If it's a fallback URL, we might not have a preview
  if (file.url.includes('firebase')) {
    return file.url;
  }
  
  return cloudinaryManagementService.generatePreviewUrl(publicId, file.type, size);
};

/**
 * Check if file needs organization
 */
export const needsOrganization = (file: ProjectFile): boolean => {
  return !file.folder || 
         !file.category || 
         !file.tags || 
         file.tags.length === 0 ||
         !file.cloudinaryPublicId;
};

/**
 * Organize a single file
 */
export const organizeFile = async (
  file: AppFile,
  userRole: UserRole,
  userId: string
): Promise<{ success: boolean; error?: string; newPath?: string }> => {
  try {
    const metadata = generateMetadataFromAppFile(file, userRole, userId);
    const newPath = cloudinaryFolderService.getFolderPath(metadata);
    
    // This is a mock implementation. In a real scenario, this would
    // call the Cloudinary API to move/rename the file.
    console.log(`Simulating move of ${file.id} to ${newPath}`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async operation

    // We can't actually modify the file, so we'll just return success
    // In a real app, you'd update the file record in your database.
    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Batch organize multiple files
 */
export const batchOrganizeFiles = async (
  files: ProjectFile[],
  userRole: UserRole,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ organized: number; failed: number; errors: string[] }> => {
  let organized = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await organizeFile(files[i], userRole, userId);
      if (result.success) {
        organized++;
      } else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    } catch (error) {
      failed++;
      errors.push(`Failed to organize ${files[i].name}: ${error.message}`);
    }
    
    onProgress?.(((i + 1) / files.length) * 100);
  }
  
  return { organized, failed, errors };
};

/**
 * Get file category from MIME type
 */
export const getCategoryFromMimeType = (mimeType: string, fileName: string): FileCategory => {
  return fileMetadataService.categorizeFile(
    { type: mimeType, name: fileName } as File,
    UserRole.FREELANCER // Default role for categorization
  );
};

/**
 * Validate file upload permissions
 */
export const validateUploadPermissions = (
  userRole: UserRole,
  fileSize: number,
  _mimeType: string,
  _projectId?: string
): { canUpload: boolean; reason?: string } => {
  const maxSizes = {
    [UserRole.ADMIN]: 100 * 1024 * 1024, // 100MB
    [UserRole.FREELANCER]: 50 * 1024 * 1024, // 50MB
    [UserRole.CLIENT]: 25 * 1024 * 1024 // 25MB
  };

  if (fileSize > maxSizes[userRole]) {
    return {
      canUpload: false,
      reason: `File size exceeds ${maxSizes[userRole] / (1024 * 1024)}MB limit for ${userRole} role`
    };
  }

  // Additional validation can be added here
  return { canUpload: true };
};

/**
 * Get folder statistics for a user
 */
export const getUserFolderStats = async (
  userId: string,
  userRole: UserRole
): Promise<{
  totalFiles: number;
  totalSize: number;
  quotaUsed: number;
  quotaLimit: number;
  categoryBreakdown: Record<FileCategory, number>;
}> => {
  try {
    const stats = await fileMetadataService.getFileStatistics(userId);
    
    const quotaLimits = {
      [UserRole.ADMIN]: 10 * 1024 * 1024 * 1024, // 10GB
      [UserRole.FREELANCER]: 2 * 1024 * 1024 * 1024, // 2GB
      [UserRole.CLIENT]: 500 * 1024 * 1024 // 500MB
    };
    
    return {
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      quotaUsed: stats.totalSize,
      quotaLimit: quotaLimits[userRole],
      categoryBreakdown: stats.filesByCategory
    };
  } catch (error) {
    console.error('Failed to get user folder stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      quotaUsed: 0,
      quotaLimit: 0,
      categoryBreakdown: {
        [FileCategory.DRAWINGS]: 0,
        [FileCategory.SPECIFICATIONS]: 0,
        [FileCategory.REPORTS]: 0,
        [FileCategory.CONTRACTS]: 0,
        [FileCategory.CORRESPONDENCE]: 0,
        [FileCategory.MODELS]: 0,
        [FileCategory.IMAGES]: 0,
        [FileCategory.PRESENTATIONS]: 0,
        [FileCategory.SPREADSHEETS]: 0,
        [FileCategory.VIDEOS]: 0,
        [FileCategory.AUDIO]: 0,
        [FileCategory.DOCUMENTS]: 0,
        [FileCategory.ARCHIVES]: 0,
        [FileCategory.SUBSTANTIATION]: 0,
        [FileCategory.DELIVERABLES]: 0,
        [FileCategory.PROFILE]: 0,
        [FileCategory.SYSTEM]: 0,
        [FileCategory.OTHER]: 0
      }
    };
  }
};

/**
 * Check Cloudinary configuration status
 */
export const getCloudinaryStatus = (): {
  isConfigured: boolean;
  hasApiCredentials: boolean;
  cloudName?: string;
  missingVars: string[];
} => {
  return cloudinaryManagementService.getConfigStatus();
};

/**
 * Format folder path for display
 */
export const formatFolderPath = (path: string): string => {
  return path
    .split('/')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' > ');
};

/**
 * Get file icon based on type and category
 */
export const getFileIcon = (file: ProjectFile): string => {
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type.includes('pdf')) return '📄';
  if (file.type.includes('word')) return '📝';
  if (file.type.includes('excel')) return '📊';
  if (file.type.includes('powerpoint')) return '📈';
  if (file.type.includes('zip') || file.type.includes('rar')) return '📦';
  if (file.type.startsWith('video/')) return '🎥';
  if (file.type.startsWith('audio/')) return '🎵';
  
  return '📄'; // Default document icon
};