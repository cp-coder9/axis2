import { ProjectFile, UserRole, FilePermissionLevel } from '@/types';
import { FileCategory, FileMetadata, cloudinaryFolderService } from './cloudinaryFolderService';
import { Timestamp } from 'firebase/firestore';

export interface EnhancedFileMetadata extends FileMetadata {
  uploadedAt: Timestamp;
  lastModified: Timestamp;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  version: number;
  parentFileId?: string;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

export interface FileSearchCriteria {
  projectId?: string;
  userId?: string;
  userRole?: UserRole;
  category?: FileCategory;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  permissions?: FilePermissionLevel;
  includeDeleted?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  fileId?: string;
  error?: string;
  metadata?: EnhancedFileMetadata;
}

/**
 * File Metadata Management Service
 * Handles file metadata operations, search, and organization
 */
export class FileMetadataService {
  private static instance: FileMetadataService;

  private constructor() { }

  public static getInstance(): FileMetadataService {
    if (!FileMetadataService.instance) {
      FileMetadataService.instance = new FileMetadataService();
    }
    return FileMetadataService.instance;
  }

  /**
   * Create enhanced metadata for a new file
   */
  public createFileMetadata(
    file: File,
    metadata: FileMetadata,
    _cloudinaryResult: any
  ): EnhancedFileMetadata {
    const now = Timestamp.now();

    return {
      ...metadata,
      uploadedAt: now,
      lastModified: now,
      fileSize: file.size,
      mimeType: file.type,
      version: 1,
      isDeleted: false,
      tags: cloudinaryFolderService.generateTags(metadata)
    };
  }

  /**
   * Update file metadata
   */
  public updateFileMetadata(
    existingMetadata: EnhancedFileMetadata,
    updates: Partial<EnhancedFileMetadata>
  ): EnhancedFileMetadata {
    return {
      ...existingMetadata,
      ...updates,
      lastModified: Timestamp.now(),
      version: existingMetadata.version + 1
    };
  }

  /**
   * Mark file as deleted (soft delete)
   */
  public markFileAsDeleted(
    metadata: EnhancedFileMetadata,
    deletedBy: string
  ): EnhancedFileMetadata {
    return {
      ...metadata,
      isDeleted: true,
      deletedAt: Timestamp.now(),
      deletedBy,
      lastModified: Timestamp.now()
    };
  }

  /**
   * Categorize file based on MIME type and name
   */
  public categorizeFile(file: File, userRole: UserRole): FileCategory {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Profile images
    if (fileName.includes('avatar') || fileName.includes('profile')) {
      return FileCategory.PROFILE;
    }

    // Substantiation files (for freelancers)
    if (userRole === UserRole.FREELANCER &&
      (fileName.includes('proof') || fileName.includes('substantiation') || fileName.includes('evidence'))) {
      return FileCategory.SUBSTANTIATION;
    }

    // Images
    if (mimeType.startsWith('image/')) {
      return FileCategory.IMAGES;
    }

    // Archives
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') ||
      fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
      return FileCategory.ARCHIVES;
    }

    // Deliverables (common project file types)
    if (mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint') ||
      fileName.includes('deliverable') ||
      fileName.includes('final') ||
      fileName.includes('submission')) {
      return FileCategory.DELIVERABLES;
    }

    // Default to documents
    return FileCategory.DOCUMENTS;
  }

  /**
   * Generate automatic tags based on file content and metadata
   */
  public generateAutomaticTags(
    file: File,
    _metadata: FileMetadata,
    _cloudinaryResult?: any
  ): string[] {
    const tags: string[] = [];
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // File type tags
    if (mimeType.startsWith('image/')) {
      tags.push('image');
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) tags.push('jpeg');
      if (mimeType.includes('png')) tags.push('png');
      if (mimeType.includes('svg')) tags.push('vector');
    }

    if (mimeType.includes('pdf')) tags.push('pdf', 'document');
    if (mimeType.includes('word')) tags.push('word', 'document');
    if (mimeType.includes('excel')) tags.push('excel', 'spreadsheet');
    if (mimeType.includes('powerpoint')) tags.push('powerpoint', 'presentation');

    // Content-based tags
    if (fileName.includes('draft')) tags.push('draft');
    if (fileName.includes('final')) tags.push('final');
    if (fileName.includes('review')) tags.push('review');
    if (fileName.includes('approved')) tags.push('approved');
    if (fileName.includes('template')) tags.push('template');
    if (fileName.includes('backup')) tags.push('backup');

    // Size-based tags
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 50) tags.push('large-file');
    if (sizeInMB > 100) tags.push('very-large-file');

    // Date-based tags
    const now = new Date();
    tags.push(`year:${now.getFullYear()}`);
    tags.push(`month:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    return tags;
  }

  /**
   * Validate file metadata before upload
   */
  public validateFileMetadata(
    file: File,
    metadata: FileMetadata,
    userRole: UserRole
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!metadata.userId) errors.push('User ID is required');
    if (!metadata.userRole) errors.push('User role is required');
    if (!metadata.category) errors.push('File category is required');

    // File size validation based on role
    const maxSizes = {
      [UserRole.ADMIN]: 100 * 1024 * 1024, // 100MB
      [UserRole.FREELANCER]: 50 * 1024 * 1024, // 50MB
      [UserRole.CLIENT]: 25 * 1024 * 1024 // 25MB
    };

    if (file.size > maxSizes[userRole]) {
      errors.push(`File size exceeds limit for ${userRole} role`);
    }

    // File type validation
    const allowedTypes = this.getAllowedFileTypes(userRole);
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed for ${userRole} role`);
    }

    // Project validation
    if (metadata.projectId && userRole === UserRole.CLIENT) {
      // Additional validation for client uploads to projects
      if (metadata.category === FileCategory.SUBSTANTIATION) {
        errors.push('Clients cannot upload substantiation files');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get allowed file types for a user role
   */
  private getAllowedFileTypes(userRole: UserRole): string[] {
    const commonTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain'
    ];

    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const archiveTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    switch (userRole) {
      case UserRole.ADMIN:
        return [
          ...commonTypes,
          ...documentTypes,
          ...archiveTypes,
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/json',
          'application/xml',
          'video/mp4',
          'video/avi',
          'video/mov',
          'audio/mp3',
          'audio/wav',
          'text/csv'
        ];
      case UserRole.FREELANCER:
        return [
          ...commonTypes,
          ...documentTypes,
          ...archiveTypes
        ];
      case UserRole.CLIENT:
        return [
          ...commonTypes,
          ...documentTypes.slice(0, 2) // Only Word documents
        ];
      default:
        return commonTypes;
    }
  }

  /**
   * Search files by criteria
   */
  public async searchFiles(criteria: FileSearchCriteria): Promise<ProjectFile[]> {
    // In a real implementation, this would query Firestore with the search criteria
    // For now, return empty array as placeholder
    console.log('Searching files with criteria:', criteria);
    return [];
  }

  /**
   * Get file statistics for a user or project
   */
  public async getFileStatistics(
    _userId?: string,
    _projectId?: string
  ): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<FileCategory, number>;
    recentFiles: ProjectFile[];
  }> {
    // In a real implementation, this would aggregate file data from Firestore
    return {
      totalFiles: 0,
      totalSize: 0,
      filesByCategory: {
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
      },
      recentFiles: []
    };
  }

  /**
   * Create file version history entry
   */
  public createVersionEntry(
    originalFile: ProjectFile,
    newFile: ProjectFile,
    versionNote?: string
  ): {
    version: number;
    previousFileId: string;
    changes: string[];
    note?: string;
    createdAt: Timestamp;
  } {
    const changes: string[] = [];

    if (originalFile.name !== newFile.name) {
      changes.push(`Name changed from "${originalFile.name}" to "${newFile.name}"`);
    }

    if (originalFile.size !== newFile.size) {
      changes.push(`Size changed from ${originalFile.size} to ${newFile.size} bytes`);
    }

    return {
      version: (originalFile.version || 1) + 1,
      previousFileId: originalFile.id,
      changes,
      note: versionNote,
      createdAt: Timestamp.now()
    };
  }

  /**
   * Generate file access audit log entry
   */
  public createAccessLogEntry(
    fileId: string,
    userId: string,
    action: 'view' | 'download' | 'upload' | 'delete' | 'share',
    metadata?: any
  ): {
    fileId: string;
    userId: string;
    action: string;
    timestamp: Timestamp;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      fileId,
      userId,
      action,
      timestamp: Timestamp.now(),
      metadata,
      // In a real implementation, these would be captured from the request
      ipAddress: 'unknown',
      userAgent: 'unknown'
    };
  }
}

// Export singleton instance
export const fileMetadataService = FileMetadataService.getInstance();