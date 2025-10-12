import { FilePermissions, FilePermissionLevel, UserRole, User, ProjectFile } from '@/types';

/**
 * File Access Control Utilities
 * Handles role-based file permissions and access validation
 */

export interface FileAccessResult {
  canView: boolean;
  canDownload: boolean;
  canShare: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canComment: boolean;
  canManagePermissions: boolean;
  reason?: string;
}

/**
 * Check if a user can access a file based on permissions and role
 */
export const checkFileAccess = (
  file: ProjectFile,
  user: User,
  isProjectMember: boolean = false,
  isFileOwner: boolean = false
): FileAccessResult => {
  const permissions = file.permissions;
  const userRole = user.role;

  // File owner and admins have full access
  if (isFileOwner || userRole === UserRole.ADMIN) {
    return {
      canView: true,
      canDownload: permissions.allowDownload,
      canShare: permissions.allowShare,
      canDelete: permissions.allowDelete,
      canEdit: permissions.allowVersioning,
      canComment: permissions.allowComments,
      canManagePermissions: true,
    };
  }

  // Check access level permissions
  const hasAccessLevel = checkAccessLevel(permissions.level, userRole, isProjectMember);
  
  if (!hasAccessLevel.canAccess) {
    return {
      canView: false,
      canDownload: false,
      canShare: false,
      canDelete: false,
      canEdit: false,
      canComment: false,
      canManagePermissions: false,
      reason: hasAccessLevel.reason,
    };
  }

  // User has access, now check specific permissions
  // Note: ADMIN users already returned early, so this code handles FREELANCER and CLIENT
  const isFreelancer = userRole === UserRole.FREELANCER;
  const canDeleteFile = permissions.allowDelete && (isFileOwner || isFreelancer);
  
  return {
    canView: true,
    canDownload: permissions.allowDownload,
    canShare: permissions.allowShare,
    canDelete: canDeleteFile,
    canEdit: permissions.allowVersioning,
    canComment: permissions.allowComments,
    canManagePermissions: false, // Only owner and admin can manage permissions
  };
};

/**
 * Check if user meets the access level requirements
 */
export const checkAccessLevel = (
  level: FilePermissionLevel,
  userRole: UserRole,
  isProjectMember: boolean
): { canAccess: boolean; reason?: string } => {
  switch (level) {
    case FilePermissionLevel.ADMIN_ONLY:
      if (userRole !== UserRole.ADMIN) {
        return {
          canAccess: false,
          reason: 'This file is restricted to administrators only',
        };
      }
      break;

    case FilePermissionLevel.PROJECT_TEAM:
      if (userRole === UserRole.CLIENT) {
        return {
          canAccess: false,
          reason: 'This file is restricted to project team members',
        };
      }
      if (!isProjectMember && userRole !== UserRole.ADMIN) {
        return {
          canAccess: false,
          reason: 'You must be a project team member to access this file',
        };
      }
      break;

    case FilePermissionLevel.CLIENT_VISIBLE:
      if (!isProjectMember && userRole !== UserRole.ADMIN) {
        return {
          canAccess: false,
          reason: 'You must be associated with this project to access this file',
        };
      }
      break;

    default:
      return {
        canAccess: false,
        reason: 'Invalid permission level',
      };
  }

  return { canAccess: true };
};

/**
 * Filter files based on user access permissions
 */
export const filterAccessibleFiles = (
  files: ProjectFile[],
  user: User,
  projectMemberIds: string[] = [],
  fileOwnerIds: Record<string, string> = {}
): ProjectFile[] => {
  return files.filter(file => {
    const isProjectMember = projectMemberIds.includes(user.id);
    const isFileOwner = fileOwnerIds[file.id] === user.id || file.uploaderId === user.id;
    
    const access = checkFileAccess(file, user, isProjectMember, isFileOwner);
    return access.canView;
  });
};

/**
 * Get permission summary for display
 */
export const getPermissionSummary = (permissions: FilePermissions): string[] => {
  const summary: string[] = [];

  // Access level
  switch (permissions.level) {
    case FilePermissionLevel.ADMIN_ONLY:
      summary.push('Admin only access');
      break;
    case FilePermissionLevel.PROJECT_TEAM:
      summary.push('Project team access');
      break;
    case FilePermissionLevel.CLIENT_VISIBLE:
      summary.push('Client visible');
      break;
  }

  // Specific permissions
  const actions: string[] = [];
  if (permissions.allowDownload) actions.push('download');
  if (permissions.allowShare) actions.push('share');
  if (permissions.allowDelete) actions.push('delete');
  if (permissions.allowVersioning) actions.push('versioning');
  if (permissions.allowComments) actions.push('comments');

  if (actions.length > 0) {
    summary.push(`Allows: ${actions.join(', ')}`);
  }

  return summary;
};

/**
 * Validate permission changes
 */
export const validatePermissionChange = (
  _currentPermissions: FilePermissions,
  newPermissions: FilePermissions,
  userRole: UserRole,
  isFileOwner: boolean
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Only admins and file owners can change permissions
  if (!isFileOwner && userRole !== UserRole.ADMIN) {
    errors.push('You do not have permission to modify file permissions');
  }

  // Validate permission combinations
  if (newPermissions.level === FilePermissionLevel.ADMIN_ONLY) {
    if (newPermissions.allowShare) {
      errors.push('Admin-only files cannot be shared');
    }
  }

  // Validate that delete permission is restricted
  if (newPermissions.allowDelete && userRole !== UserRole.ADMIN && !isFileOwner) {
    errors.push('Only administrators and file owners can grant delete permissions');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get default permissions based on user role and context
 */
export const getDefaultPermissions = (
  uploaderRole: UserRole,
  _projectContext: boolean = true
): FilePermissions => {
  const basePermissions: FilePermissions = {
    level: FilePermissionLevel.PROJECT_TEAM,
    allowDownload: true,
    allowShare: false,
    allowDelete: false,
    allowVersioning: true,
    allowComments: true,
  };

  // Adjust based on uploader role
  switch (uploaderRole) {
    case UserRole.ADMIN:
      return {
        ...basePermissions,
        allowShare: true,
        allowDelete: true,
      };

    case UserRole.CLIENT:
      return {
        ...basePermissions,
        level: FilePermissionLevel.CLIENT_VISIBLE,
        allowVersioning: false,
      };

    case UserRole.FREELANCER:
    default:
      return basePermissions;
  }
};

/**
 * Audit log entry for permission changes
 */
export interface PermissionAuditEntry {
  fileId: string;
  fileName: string;
  userId: string;
  userName: string;
  action: 'PERMISSION_CHANGED' | 'ACCESS_GRANTED' | 'ACCESS_DENIED';
  oldPermissions?: FilePermissions;
  newPermissions?: FilePermissions;
  timestamp: Date;
  reason?: string;
}

/**
 * Create audit log entry for permission changes
 */
export const createPermissionAuditEntry = (
  fileId: string,
  fileName: string,
  userId: string,
  userName: string,
  action: PermissionAuditEntry['action'],
  oldPermissions?: FilePermissions,
  newPermissions?: FilePermissions,
  reason?: string
): PermissionAuditEntry => {
  return {
    fileId,
    fileName,
    userId,
    userName,
    action,
    oldPermissions,
    newPermissions,
    timestamp: new Date(),
    reason,
  };
};

/**
 * Check if permission change is significant (for audit purposes)
 */
export const isSignificantPermissionChange = (
  oldPermissions: FilePermissions,
  newPermissions: FilePermissions
): boolean => {
  // Level change is always significant
  if (oldPermissions.level !== newPermissions.level) {
    return true;
  }

  // Check for permission escalation
  const escalations = [
    oldPermissions.allowShare !== newPermissions.allowShare,
    oldPermissions.allowDelete !== newPermissions.allowDelete,
    (!oldPermissions.allowDownload && newPermissions.allowDownload),
  ];

  return escalations.some(Boolean);
};