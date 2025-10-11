/**
 * Advanced File Manager Service
 * Task 4.1: Comprehensive file management utilities
 */

import { 
  ProjectFile, 
  FileCategory, 
  FileShareLink, 
  FileVersion, 
  FileMetadata,
  FilePermissions,
  FilePermissionLevel,
  UserRole 
} from '../types';
import { Timestamp } from 'firebase/firestore';

export class AdvancedFileManager {
  /**
   * Organize files by category based on file type and name patterns
   */
  static categorizeFile(fileName: string, mimeType: string): FileCategory {
    const lowerName = fileName.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Drawings
    if (['dwg', 'dxf', 'rvt', 'skp', 'dgn'].includes(extension) ||
        lowerName.includes('drawing') || lowerName.includes('plan')) {
      return FileCategory.DRAWINGS;
    }

    // Specifications
    if (lowerName.includes('spec') || lowerName.includes('specification')) {
      return FileCategory.SPECIFICATIONS;
    }

    // Reports
    if (lowerName.includes('report') || lowerName.includes('analysis')) {
      return FileCategory.REPORTS;
    }

    // Contracts
    if (lowerName.includes('contract') || lowerName.includes('agreement') ||
        lowerName.includes('proposal')) {
      return FileCategory.CONTRACTS;
    }

    // Correspondence
    if (lowerName.includes('email') || lowerName.includes('letter') ||
        lowerName.includes('memo') || lowerName.includes('correspondence')) {
      return FileCategory.CORRESPONDENCE;
    }

    // Models
    if (['3ds', 'obj', 'fbx', 'blend', 'max', 'c4d'].includes(extension)) {
      return FileCategory.MODELS;
    }

    // Images
    if (mimeType.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return FileCategory.IMAGES;
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
      return FileCategory.DOCUMENTS;
    }

    return FileCategory.OTHER;
  }

  /**
   * Generate Cloudinary folder path for organized storage
   */
  static generateFolderPath(
    projectId: string,
    category: FileCategory,
    subFolder?: string
  ): string {
    const basePath = `projects/${projectId}/${category.toLowerCase()}`;
    return subFolder ? `${basePath}/${subFolder}` : basePath;
  }

  /**
   * Create a share link for a file
   */
  static createShareLink(
    fileId: string,
    createdBy: string,
    options: {
      expiresInDays?: number;
      maxAccessCount?: number;
      password?: string;
      canView?: boolean;
      canDownload?: boolean;
      canEdit?: boolean;
    } = {}
  ): FileShareLink {
    const now = Timestamp.now();
    const expiresAt = options.expiresInDays
      ? Timestamp.fromDate(new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000))
      : undefined;

    return {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId,
      url: `${window.location.origin}/shared/${fileId}/${Math.random().toString(36).substr(2, 16)}`,
      createdAt: now,
      createdBy,
      expiresAt,
      accessCount: 0,
      maxAccessCount: options.maxAccessCount,
      password: options.password,
      permissions: {
        canView: options.canView ?? true,
        canDownload: options.canDownload ?? true,
        canEdit: options.canEdit ?? false,
      },
    };
  }

  /**
   * Create a new file version
   */
  static createFileVersion(
    fileId: string,
    versionNumber: number,
    url: string,
    size: number,
    uploadedBy: string,
    uploadedByName: string,
    changeDescription?: string,
    cloudinaryPublicId?: string
  ): FileVersion {
    return {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId,
      versionNumber,
      url,
      size,
      uploadedAt: Timestamp.now(),
      uploadedBy,
      uploadedByName,
      changeDescription,
      cloudinaryPublicId,
    };
  }

  /**
   * Extract metadata from file
   */
  static async extractMetadata(file: File): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      format: file.type,
    };

    // Extract image metadata
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await this.getImageDimensions(file);
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      } catch (error) {
        console.error('Failed to extract image dimensions:', error);
      }
    }

    // Extract PDF metadata
    if (file.type === 'application/pdf') {
      // PDF metadata extraction would require a library like pdf.js
      // Placeholder for now
      metadata.pageCount = undefined;
    }

    return metadata;
  }

  /**
   * Get image dimensions
   */
  private static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Check if user has permission to access file
   */
  static canUserAccessFile(
    file: ProjectFile,
    userRole: UserRole,
    userId: string,
    projectTeamIds: string[]
  ): boolean {
    const { permissions } = file;

    // Check specific user permissions
    if (permissions.specificUsers?.includes(userId)) {
      return true;
    }

    // Check specific role permissions
    if (permissions.specificRoles?.includes(userRole)) {
      return true;
    }

    // Check permission level
    switch (permissions.level) {
      case FilePermissionLevel.ADMIN_ONLY:
        return userRole === UserRole.ADMIN;
      
      case FilePermissionLevel.PROJECT_TEAM:
        return userRole === UserRole.ADMIN || projectTeamIds.includes(userId);
      
      case FilePermissionLevel.CLIENT_VISIBLE:
        return true; // All authenticated users can view
      
      default:
        return false;
    }
  }

  /**
   * Bulk file operations
   */
  static async bulkMove(
    files: ProjectFile[],
    newFolder: string
  ): Promise<ProjectFile[]> {
    return files.map(file => ({
      ...file,
      folder: newFolder,
    }));
  }

  static async bulkCategorize(
    files: ProjectFile[]
  ): Promise<ProjectFile[]> {
    return files.map(file => ({
      ...file,
      category: this.categorizeFile(file.name, file.type),
    }));
  }

  static async bulkDelete(
    files: ProjectFile[]
  ): Promise<ProjectFile[]> {
    return files.map(file => ({
      ...file,
      isDeleted: true,
    }));
  }

  /**
   * Search files by metadata
   */
  static searchFiles(
    files: ProjectFile[],
    query: string,
    filters?: {
      category?: FileCategory;
      uploadedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
      tags?: string[];
    }
  ): ProjectFile[] {
    let results = files.filter(file => !file.isDeleted);

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(file =>
        file.name.toLowerCase().includes(lowerQuery) ||
        file.description?.toLowerCase().includes(lowerQuery) ||
        file.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Category filter
    if (filters?.category) {
      results = results.filter(file => file.category === filters.category);
    }

    // Uploader filter
    if (filters?.uploadedBy) {
      results = results.filter(file => file.uploaderId === filters.uploadedBy);
    }

    // Date range filter
    if (filters?.dateFrom) {
      results = results.filter(file =>
        file.uploadedAt.toDate() >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      results = results.filter(file =>
        file.uploadedAt.toDate() <= filters.dateTo!
      );
    }

    // Tags filter
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(file =>
        filters.tags!.some(tag => file.tags?.includes(tag))
      );
    }

    return results;
  }

  /**
   * Get file statistics
   */
  static getFileStatistics(files: ProjectFile[]): {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<FileCategory, number>;
    byUploader: Record<string, number>;
  } {
    const activeFiles = files.filter(file => !file.isDeleted);

    const stats = {
      totalFiles: activeFiles.length,
      totalSize: activeFiles.reduce((sum, file) => sum + file.size, 0),
      byCategory: {} as Record<FileCategory, number>,
      byUploader: {} as Record<string, number>,
    };

    // Count by category
    activeFiles.forEach(file => {
      if (file.category) {
        stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1;
      }
    });

    // Count by uploader
    activeFiles.forEach(file => {
      stats.byUploader[file.uploaderId] = (stats.byUploader[file.uploaderId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validate file name
   */
  static validateFileName(fileName: string): { valid: boolean; error?: string } {
    if (!fileName || fileName.trim().length === 0) {
      return { valid: false, error: 'File name cannot be empty' };
    }

    if (fileName.length > 255) {
      return { valid: false, error: 'File name is too long (max 255 characters)' };
    }

    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(fileName)) {
      return { valid: false, error: 'File name contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
