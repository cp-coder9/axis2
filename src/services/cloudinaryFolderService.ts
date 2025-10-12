import { UserRole, FilePermissionLevel, FileCategory } from '@/types';

// Re-export FileCategory for other services that depend on it
export { FileCategory };

export interface CloudinaryFolderStructure {
  projects: {
    [projectId: string]: {
      documents: string;
      images: string;
      archives: string;
      substantiation: string;
      deliverables: string;
    };
  };
  users: {
    [userId: string]: {
      profile: string;
      documents: string;
      temp: string;
    };
  };
  admin: {
    system: string;
    backups: string;
    templates: string;
    reports: string;
  };
}

export interface CloudinaryFolderConfig {
  basePath: string;
  structure: CloudinaryFolderStructure;
  accessRules: FolderAccessRules;
}

export interface FolderAccessRules {
  [folderPath: string]: {
    allowedRoles: UserRole[];
    permissions: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
  };
}

export interface FileMetadata {
  projectId?: string;
  userId: string;
  userRole: UserRole;
  category: FileCategory;
  tags: string[];
  permissions: FilePermissionLevel;
  description?: string;
}

/**
 * Cloudinary Folder Organization Service
 * Manages role-based folder structure and access control
 */
export class CloudinaryFolderService {
  private static instance: CloudinaryFolderService;
  private folderConfig: CloudinaryFolderConfig;

  private constructor() {
    this.folderConfig = this.initializeFolderStructure();
  }

  public static getInstance(): CloudinaryFolderService {
    if (!CloudinaryFolderService.instance) {
      CloudinaryFolderService.instance = new CloudinaryFolderService();
    }
    return CloudinaryFolderService.instance;
  }

  /**
   * Initialize the folder structure configuration
   */
  private initializeFolderStructure(): CloudinaryFolderConfig {
    return {
      basePath: 'architex-axis',
      structure: {
        projects: {},
        users: {},
        admin: {
          system: 'admin/system',
          backups: 'admin/backups',
          templates: 'admin/templates',
          reports: 'admin/reports'
        }
      },
      accessRules: {
        'admin/*': {
          allowedRoles: [UserRole.ADMIN],
          permissions: { read: true, write: true, delete: true }
        },
        'projects/*': {
          allowedRoles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
          permissions: { read: true, write: true, delete: false }
        },
        'users/*': {
          allowedRoles: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
          permissions: { read: true, write: true, delete: false }
        }
      }
    };
  }

  /**
   * Get the appropriate folder path for a file upload
   */
  public getFolderPath(metadata: FileMetadata): string {
    const { projectId, userId, userRole, category } = metadata;

    // Project-based files
    if (projectId) {
      return this.getProjectFolderPath(projectId, category);
    }

    // User-based files
    if (category === FileCategory.PROFILE) {
      return this.getUserProfileFolderPath(userId);
    }

    // Admin system files
    if (userRole === UserRole.ADMIN && category === FileCategory.SYSTEM) {
      return this.getAdminSystemFolderPath();
    }

    // Default user folder
    return this.getUserDocumentsFolderPath(userId, category);
  }

  /**
   * Get project-specific folder path
   */
  private getProjectFolderPath(projectId: string, category: FileCategory): string {
    const basePath = `${this.folderConfig.basePath}/projects/${projectId}`;

    switch (category) {
      case FileCategory.DOCUMENTS:
        return `${basePath}/documents`;
      case FileCategory.IMAGES:
        return `${basePath}/images`;
      case FileCategory.ARCHIVES:
        return `${basePath}/archives`;
      case FileCategory.SUBSTANTIATION:
        return `${basePath}/substantiation`;
      case FileCategory.DELIVERABLES:
        return `${basePath}/deliverables`;
      default:
        return `${basePath}/misc`;
    }
  }

  /**
   * Get user profile folder path
   */
  private getUserProfileFolderPath(userId: string): string {
    return `${this.folderConfig.basePath}/users/${userId}/profile`;
  }

  /**
   * Get user documents folder path
   */
  private getUserDocumentsFolderPath(userId: string, category: FileCategory): string {
    const basePath = `${this.folderConfig.basePath}/users/${userId}`;

    switch (category) {
      case FileCategory.DOCUMENTS:
        return `${basePath}/documents`;
      case FileCategory.IMAGES:
        return `${basePath}/images`;
      default:
        return `${basePath}/temp`;
    }
  }

  /**
   * Get admin system folder path
   */
  private getAdminSystemFolderPath(): string {
    return `${this.folderConfig.basePath}/admin/system`;
  }

  /**
   * Generate tags for file categorization
   */
  public generateTags(metadata: FileMetadata): string[] {
    const { projectId, userId, userRole, category, tags = [] } = metadata;

    const generatedTags = [
      `role:${userRole.toLowerCase()}`,
      `category:${category.toLowerCase()}`,
      `user:${userId}`,
      ...tags
    ];

    if (projectId) {
      generatedTags.push(`project:${projectId}`);
    }

    // Add timestamp tag for organization
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    generatedTags.push(`date:${timestamp}`);

    return generatedTags;
  }

  /**
   * Check if user has access to a specific folder
   */
  public checkFolderAccess(
    folderPath: string,
    userRole: UserRole,
    userId: string,
    projectMemberIds: string[] = []
  ): { hasAccess: boolean; permissions: { read: boolean; write: boolean; delete: boolean } } {
    // Admin has access to everything
    if (userRole === UserRole.ADMIN) {
      return {
        hasAccess: true,
        permissions: { read: true, write: true, delete: true }
      };
    }

    // Check if it's user's own folder
    if (folderPath.includes(`/users/${userId}/`)) {
      return {
        hasAccess: true,
        permissions: { read: true, write: true, delete: true }
      };
    }

    // Check project folder access
    const projectMatch = folderPath.match(/\/projects\/([^\/]+)\//);
    if (projectMatch) {
      const projectId = projectMatch[1];
      const isProjectMember = projectMemberIds.includes(userId);

      // Log project access check for audit purposes
      console.log(`Checking access for project ${projectId}, user ${userId}, isMember: ${isProjectMember}`);

      if (isProjectMember) {
        return {
          hasAccess: true,
          permissions: {
            read: true,
            write: userRole !== UserRole.CLIENT,
            delete: false
          }
        };
      }
    }

    // Default deny
    return {
      hasAccess: false,
      permissions: { read: false, write: false, delete: false }
    };
  }

  /**
   * Get file metadata from Cloudinary context
   */
  public parseFileMetadata(cloudinaryContext: string): Partial<FileMetadata> {
    const metadata: Partial<FileMetadata> = {};

    if (!cloudinaryContext) return metadata;

    const contextPairs = cloudinaryContext.split('|');
    contextPairs.forEach(pair => {
      const [key, value] = pair.split('=');
      switch (key) {
        case 'userId':
          metadata.userId = value;
          break;
        case 'userRole':
          metadata.userRole = value as UserRole;
          break;
        case 'projectId':
          metadata.projectId = value;
          break;
        case 'category':
          metadata.category = value as FileCategory;
          break;
        case 'permissions':
          metadata.permissions = value as FilePermissionLevel;
          break;
      }
    });

    return metadata;
  }

  /**
   * Create context string for Cloudinary upload
   */
  public createContextString(metadata: FileMetadata): string {
    const contextPairs = [
      `userId=${metadata.userId}`,
      `userRole=${metadata.userRole}`,
      `category=${metadata.category}`,
      `permissions=${metadata.permissions}`
    ];

    if (metadata.projectId) {
      contextPairs.push(`projectId=${metadata.projectId}`);
    }

    if (metadata.description) {
      contextPairs.push(`description=${encodeURIComponent(metadata.description)}`);
    }

    return contextPairs.join('|');
  }

  /**
   * Validate folder structure and create if necessary
   */
  public async validateFolderStructure(projectId?: string, userId?: string): Promise<boolean> {
    try {
      // In a real implementation, this would make API calls to Cloudinary
      // to ensure folders exist and have proper permissions

      if (projectId) {
        // Validate project folder structure
        const categories = Object.values(FileCategory);
        for (const category of categories) {
          const folderPath = this.getProjectFolderPath(projectId, category);
          console.log(`Validating project folder: ${folderPath}`);
        }
      }

      if (userId) {
        // Validate user folder structure
        const profilePath = this.getUserProfileFolderPath(userId);
        const docsPath = this.getUserDocumentsFolderPath(userId, FileCategory.DOCUMENTS);
        console.log(`Validating user folders: ${profilePath}, ${docsPath}`);
      }

      return true;
    } catch (error) {
      console.error('Error validating folder structure:', error);
      return false;
    }
  }

  /**
   * Get folder statistics for admin dashboard
   */
  public async getFolderStatistics(): Promise<{
    totalFiles: number;
    folderSizes: Record<string, number>;
    filesByCategory: Record<FileCategory, number>;
    filesByRole: Record<UserRole, number>;
  }> {
    // In a real implementation, this would query Cloudinary API
    // for folder statistics and file counts

    return {
      totalFiles: 0,
      folderSizes: {},
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
      filesByRole: {
        [UserRole.ADMIN]: 0,
        [UserRole.FREELANCER]: 0,
        [UserRole.CLIENT]: 0
      }
    };
  }

  /**
   * Clean up orphaned files and empty folders
   */
  public async cleanupOrphanedFiles(): Promise<{
    deletedFiles: number;
    deletedFolders: number;
    errors: string[];
  }> {
    // In a real implementation, this would:
    // 1. Find files without valid project/user references
    // 2. Remove empty folders
    // 3. Clean up expired temporary files

    return {
      deletedFiles: 0,
      deletedFolders: 0,
      errors: []
    };
  }
}

// Export singleton instance
export const cloudinaryFolderService = CloudinaryFolderService.getInstance();