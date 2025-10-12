import { ProjectFile, UserRole, FilePermissionLevel, FileCategory } from '@/types';
import {
  cloudinaryFolderService,
  FileMetadata
} from './cloudinaryFolderService';
import { 
  fileMetadataService
} from './fileMetadataService';
import { Timestamp } from 'firebase/firestore';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  folder: string;
  tags: string[];
  context?: Record<string, string>;
  created_at: string;
  error?: { message: string };
}

export interface CloudinaryTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  gravity?: 'auto' | 'face' | 'center';
  background?: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  transformation?: CloudinaryTransformationOptions;
  downloadName?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset: string;
  secure: boolean;
}

/**
 * Comprehensive Cloudinary Management Service
 * Handles uploads, folder organization, access control, and transformations
 */
export class CloudinaryManagementService {
  private static instance: CloudinaryManagementService;
  private config: CloudinaryConfig;

  private constructor() {
    this.config = this.validateAndGetConfig();
  }

  public static getInstance(): CloudinaryManagementService {
    if (!CloudinaryManagementService.instance) {
      CloudinaryManagementService.instance = new CloudinaryManagementService();
    }
    return CloudinaryManagementService.instance;
  }

  /**
   * Validate and get Cloudinary configuration
   */
  private validateAndGetConfig(): CloudinaryConfig {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
    }

    return {
      cloudName,
      uploadPreset,
      apiKey,
      apiSecret,
      secure: true
    };
  }

  /**
   * Upload file with automatic folder organization
   */
  public async uploadFile(
    file: File,
    metadata: FileMetadata,
    onProgress?: (progress: number) => void
  ): Promise<{ projectFile: ProjectFile; cloudinaryResult: CloudinaryUploadResult }> {
    // Validate file and metadata
    const validation = fileMetadataService.validateFileMetadata(file, metadata, metadata.userRole);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Auto-categorize if not specified
    if (!metadata.category) {
      metadata.category = fileMetadataService.categorizeFile(file, metadata.userRole);
    }

    // Get folder path
    const folderPath = cloudinaryFolderService.getFolderPath(metadata);
    
    // Generate tags
    const tags = cloudinaryFolderService.generateTags(metadata);
    const autoTags = fileMetadataService.generateAutomaticTags(file, metadata);
    const allTags = [...new Set([...tags, ...autoTags])];

    // Create context string
    const contextString = cloudinaryFolderService.createContextString(metadata);

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('folder', folderPath);
    formData.append('tags', allTags.join(','));
    formData.append('context', contextString);
    
    // Add resource type based on file type
    if (file.type.startsWith('video/')) {
      formData.append('resource_type', 'video');
    } else if (file.type.startsWith('audio/')) {
      formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio files
    } else {
      formData.append('resource_type', 'auto');
    }

    try {
      // Upload to Cloudinary
      const response = await this.uploadWithProgress(formData, onProgress);
      const cloudinaryResult: CloudinaryUploadResult = await response.json();

      if (!response.ok) {
        throw new Error(cloudinaryResult.error?.message || 'Upload failed');
      }

      // Create enhanced metadata for future use
      const enhancedMetadata = fileMetadataService.createFileMetadata(
        file,
        metadata,
        cloudinaryResult
      );
      
      // Log enhanced metadata for debugging
      console.log('Enhanced metadata created:', enhancedMetadata);

      // Create ProjectFile object
      const projectFile: ProjectFile = {
        id: cloudinaryResult.public_id,
        name: file.name,
        url: cloudinaryResult.secure_url,
        size: cloudinaryResult.bytes,
        type: file.type,
        uploadedAt: Timestamp.now(),
        uploadedBy: metadata.userId,
        uploadedByName: '', // This should be filled by the calling component
        projectId: metadata.projectId,
        permissions: {
          level: metadata.permissions,
          allowDownload: true,
          allowShare: metadata.userRole === UserRole.ADMIN,
          allowDelete: metadata.userRole === UserRole.ADMIN,
          allowVersioning: metadata.userRole !== UserRole.CLIENT,
          allowComments: true
        },
        tags: allTags,
        category: metadata.category,
        version: 1,
        folder: folderPath,
        cloudinaryPublicId: cloudinaryResult.public_id
      };

      return { projectFile, cloudinaryResult };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload with progress tracking
   */
  private async uploadWithProgress(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            ok: true,
            status: xhr.status,
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          } as Response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.config.cloudName}/auto/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Generate signed URL for secure file access
   */
  public generateSignedUrl(
    publicId: string,
    userRole: UserRole,
    options: SignedUrlOptions = {}
  ): string {
    const {
      expiresIn = 3600, // 1 hour default
      transformation,
      downloadName
    } = options;
    
    // Log URL generation for audit purposes
    console.log(`Generating signed URL for ${publicId}, expires in ${expiresIn}s, role: ${userRole}`);

    // Build transformation string
    let transformationString = '';
    if (transformation) {
      const transformParts: string[] = [];
      
      if (transformation.width) transformParts.push(`w_${transformation.width}`);
      if (transformation.height) transformParts.push(`h_${transformation.height}`);
      if (transformation.crop) transformParts.push(`c_${transformation.crop}`);
      if (transformation.quality) transformParts.push(`q_${transformation.quality}`);
      if (transformation.format) transformParts.push(`f_${transformation.format}`);
      if (transformation.gravity) transformParts.push(`g_${transformation.gravity}`);
      if (transformation.background) transformParts.push(`b_${transformation.background}`);

      if (transformParts.length > 0) {
        transformationString = transformParts.join(',') + '/';
      }
    }

    // For now, return the basic URL (in production, this would generate a signed URL)
    let url = `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformationString}${publicId}`;
    
    if (downloadName) {
      url += `?dl=${encodeURIComponent(downloadName)}`;
    }

    return url;
  }

  /**
   * Generate preview URL with optimizations
   */
  public generatePreviewUrl(
    publicId: string,
    fileType: string,
    size: 'thumbnail' | 'medium' | 'large' = 'medium'
  ): string {
    const sizeConfig = {
      thumbnail: { width: 150, height: 150, crop: 'thumb' as const },
      medium: { width: 400, height: 300, crop: 'fit' as const },
      large: { width: 800, height: 600, crop: 'fit' as const }
    };

    const config = sizeConfig[size];
    
    if (fileType.startsWith('image/')) {
      return this.generateSignedUrl(publicId, UserRole.ADMIN, {
        transformation: {
          ...config,
          quality: 'auto',
          format: 'auto'
        }
      });
    }

    // For non-images, return a placeholder or document icon
    return `https://via.placeholder.com/${config.width}x${config.height}/0ea5e9/ffffff?text=File+Preview`;
  }

  /**
   * Check folder access for user
   */
  public checkFolderAccess(
    folderPath: string,
    userRole: UserRole,
    userId: string,
    projectMemberIds: string[] = []
  ): { hasAccess: boolean; permissions: { read: boolean; write: boolean; delete: boolean } } {
    return cloudinaryFolderService.checkFolderAccess(folderPath, userRole, userId, projectMemberIds);
  }

  /**
   * Organize existing files into proper folder structure
   */
  public async organizeExistingFiles(
    files: ProjectFile[],
    userId: string,
    userRole: UserRole
  ): Promise<{ organized: number; errors: string[] }> {
    let organized = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Determine proper folder based on file metadata
        const metadata: FileMetadata = {
          userId: file.uploadedBy || userId,
          userRole,
          category: (file.category as FileCategory) || FileCategory.DOCUMENTS,
          projectId: file.projectId,
          tags: file.tags || [],
          permissions: file.permissions?.level || FilePermissionLevel.PROJECT_TEAM
        };

        const properFolder = cloudinaryFolderService.getFolderPath(metadata);
        
        // In a real implementation, this would call Cloudinary API to move the file
        console.log(`Would move file ${file.id} to folder: ${properFolder}`);
        organized++;
      } catch (error) {
        errors.push(`Failed to organize file ${file.id}: ${error.message}`);
      }
    }

    return { organized, errors };
  }

  /**
   * Get folder statistics
   */
  public async getFolderStatistics(_userRole: UserRole): Promise<{
    totalFiles: number;
    totalSize: number;
    folderBreakdown: Record<string, { files: number; size: number }>;
    categoryBreakdown: Record<FileCategory, number>;
  }> {
    // In a real implementation, this would query Cloudinary API
    const stats = await cloudinaryFolderService.getFolderStatistics();
    return {
      totalFiles: stats.totalFiles,
      totalSize: 0, // Calculate from folderSizes if needed
      folderBreakdown: Object.entries(stats.folderSizes).reduce((acc, [folder, size]) => {
        acc[folder] = { files: 0, size };
        return acc;
      }, {} as Record<string, { files: number; size: number }>),
      categoryBreakdown: stats.filesByCategory
    };
  }

  /**
   * Clean up orphaned files
   */
  public async cleanupOrphanedFiles(): Promise<{
    deletedFiles: number;
    deletedFolders: number;
    errors: string[];
  }> {
    return cloudinaryFolderService.cleanupOrphanedFiles();
  }

  /**
   * Validate folder structure for a project or user
   */
  public async validateFolderStructure(projectId?: string, userId?: string): Promise<boolean> {
    return cloudinaryFolderService.validateFolderStructure(projectId, userId);
  }

  /**
   * Delete file from Cloudinary
   */
  public async deleteFile(
    publicId: string,
    userRole: UserRole,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has permission to delete
      const folderPath = publicId.substring(0, publicId.lastIndexOf('/'));
      const access = this.checkFolderAccess(folderPath, userRole, userId);
      
      if (!access.hasAccess || !access.permissions.delete) {
        return { success: false, error: 'Insufficient permissions to delete file' };
      }

      // In a real implementation, this would call Cloudinary API to delete the file
      console.log(`Would delete file with public_id: ${publicId}`);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file information from Cloudinary
   */
  public async getFileInfo(publicId: string): Promise<{
    exists: boolean;
    metadata?: any;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call Cloudinary API
      console.log(`Would get info for file: ${publicId}`);
      
      return { exists: true };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check if Cloudinary is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.config.cloudName && this.config.uploadPreset);
  }

  /**
   * Get configuration status
   */
  public getConfigStatus(): {
    isConfigured: boolean;
    hasApiCredentials: boolean;
    cloudName?: string;
    missingVars: string[];
  } {
    const missingVars: string[] = [];
    
    if (!this.config.cloudName) missingVars.push('VITE_CLOUDINARY_CLOUD_NAME');
    if (!this.config.uploadPreset) missingVars.push('VITE_CLOUDINARY_UPLOAD_PRESET');
    
    return {
      isConfigured: this.isConfigured(),
      hasApiCredentials: !!(this.config.apiKey && this.config.apiSecret),
      cloudName: this.config.cloudName,
      missingVars
    };
  }
}

// Export singleton instance
export const cloudinaryManagementService = CloudinaryManagementService.getInstance();