import { Timestamp } from 'firebase/firestore';
import { UserRole, FilePermissions } from '@/types';

/**
 * File Audit Logging Utilities
 * Tracks file access, permission changes, and security events
 */

export enum FileAuditAction {
  // File operations
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_VIEWED = 'FILE_VIEWED',
  FILE_DELETED = 'FILE_DELETED',
  FILE_SHARED = 'FILE_SHARED',
  FILE_UNSHARED = 'FILE_UNSHARED',
  
  // Permission operations
  PERMISSIONS_CHANGED = 'PERMISSIONS_CHANGED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_REVOKED = 'ACCESS_REVOKED',
  
  // Security events
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SHARE_LINK_CREATED = 'SHARE_LINK_CREATED',
  SHARE_LINK_ACCESSED = 'SHARE_LINK_ACCESSED',
  SHARE_LINK_REVOKED = 'SHARE_LINK_REVOKED',
  
  // Version control
  VERSION_UPLOADED = 'VERSION_UPLOADED',
  VERSION_RESTORED = 'VERSION_RESTORED',
  
  // Comments and collaboration
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface FileAuditEntry {
  id: string;
  fileId: string;
  fileName: string;
  projectId?: string;
  action: FileAuditAction;
  severity: AuditSeverity;
  
  // User information
  userId: string;
  userName: string;
  userRole: UserRole;
  userEmail?: string;
  
  // Context information
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Action-specific data
  details: Record<string, any>;
  
  // Security context
  wasAuthorized: boolean;
  permissionLevel?: string;
  reason?: string;
  
  // Metadata
  metadata?: {
    fileSize?: number;
    fileType?: string;
    previousPermissions?: FilePermissions;
    newPermissions?: FilePermissions;
    shareRecipients?: string[];
    expirationDate?: Date;
  };
}

export interface AuditQueryOptions {
  fileId?: string;
  projectId?: string;
  userId?: string;
  action?: FileAuditAction;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * File Audit Logger Class
 */
export class FileAuditLogger {
  private static instance: FileAuditLogger;
  private auditEntries: FileAuditEntry[] = [];

  private constructor() {}

  public static getInstance(): FileAuditLogger {
    if (!FileAuditLogger.instance) {
      FileAuditLogger.instance = new FileAuditLogger();
    }
    return FileAuditLogger.instance;
  }

  /**
   * Log a file audit event
   */
  public async logEvent(
    action: FileAuditAction,
    fileId: string,
    fileName: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    options: {
      projectId?: string;
      wasAuthorized?: boolean;
      details?: Record<string, any>;
      metadata?: FileAuditEntry['metadata'];
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    } = {}
  ): Promise<void> {
    const severity = this.determineSeverity(action, options.wasAuthorized);
    
    const auditEntry: FileAuditEntry = {
      id: this.generateId(),
      fileId,
      fileName,
      projectId: options.projectId,
      action,
      severity,
      userId,
      userName,
      userRole,
      timestamp: Timestamp.now(),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      wasAuthorized: options.wasAuthorized ?? true,
      reason: options.reason,
      details: options.details || {},
      metadata: options.metadata,
    };

    // Store audit entry (in a real implementation, this would go to a database)
    this.auditEntries.push(auditEntry);

    // In production, you would send this to your audit logging service
    console.log('File Audit Event:', auditEntry);

    // Trigger alerts for critical events
    if (severity === AuditSeverity.CRITICAL) {
      await this.triggerSecurityAlert(auditEntry);
    }
  }

  /**
   * Log file access event
   */
  public async logFileAccess(
    fileId: string,
    fileName: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    accessType: 'VIEW' | 'DOWNLOAD',
    wasAuthorized: boolean,
    options: {
      projectId?: string;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    const action = accessType === 'VIEW' ? FileAuditAction.FILE_VIEWED : FileAuditAction.FILE_DOWNLOADED;
    
    await this.logEvent(action, fileId, fileName, userId, userName, userRole, {
      ...options,
      wasAuthorized,
      details: {
        accessType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log permission change event
   */
  public async logPermissionChange(
    fileId: string,
    fileName: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    oldPermissions: FilePermissions,
    newPermissions: FilePermissions,
    options: {
      projectId?: string;
      reason?: string;
    } = {}
  ): Promise<void> {
    await this.logEvent(
      FileAuditAction.PERMISSIONS_CHANGED,
      fileId,
      fileName,
      userId,
      userName,
      userRole,
      {
        ...options,
        wasAuthorized: true,
        details: {
          changeType: 'PERMISSION_UPDATE',
          changedFields: this.getPermissionChanges(oldPermissions, newPermissions),
        },
        metadata: {
          previousPermissions: oldPermissions,
          newPermissions: newPermissions,
        },
      }
    );
  }

  /**
   * Log file sharing event
   */
  public async logFileShare(
    fileId: string,
    fileName: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    recipients: string[],
    shareType: 'USER_SHARE' | 'LINK_SHARE',
    options: {
      projectId?: string;
      expirationDate?: Date;
      message?: string;
    } = {}
  ): Promise<void> {
    await this.logEvent(
      FileAuditAction.FILE_SHARED,
      fileId,
      fileName,
      userId,
      userName,
      userRole,
      {
        ...options,
        wasAuthorized: true,
        details: {
          shareType,
          recipientCount: recipients.length,
          message: options.message,
        },
        metadata: {
          shareRecipients: recipients,
          expirationDate: options.expirationDate,
        },
      }
    );
  }

  /**
   * Log unauthorized access attempt
   */
  public async logUnauthorizedAccess(
    fileId: string,
    fileName: string,
    userId: string,
    userName: string,
    userRole: UserRole,
    attemptedAction: string,
    reason: string,
    options: {
      projectId?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    await this.logEvent(
      FileAuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
      fileId,
      fileName,
      userId,
      userName,
      userRole,
      {
        ...options,
        wasAuthorized: false,
        reason,
        details: {
          attemptedAction,
          denialReason: reason,
        },
      }
    );
  }

  /**
   * Query audit logs
   */
  public queryAuditLogs(options: AuditQueryOptions = {}): FileAuditEntry[] {
    let results = [...this.auditEntries];

    // Apply filters
    if (options.fileId) {
      results = results.filter(entry => entry.fileId === options.fileId);
    }
    if (options.projectId) {
      results = results.filter(entry => entry.projectId === options.projectId);
    }
    if (options.userId) {
      results = results.filter(entry => entry.userId === options.userId);
    }
    if (options.action) {
      results = results.filter(entry => entry.action === options.action);
    }
    if (options.severity) {
      results = results.filter(entry => entry.severity === options.severity);
    }
    if (options.startDate) {
      results = results.filter(entry => entry.timestamp.toDate() >= options.startDate!);
    }
    if (options.endDate) {
      results = results.filter(entry => entry.timestamp.toDate() <= options.endDate!);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get audit summary for a file
   */
  public getFileSummary(fileId: string): {
    totalEvents: number;
    lastAccessed?: Date;
    accessCount: number;
    downloadCount: number;
    shareCount: number;
    unauthorizedAttempts: number;
    permissionChanges: number;
  } {
    const fileEvents = this.auditEntries.filter(entry => entry.fileId === fileId);
    
    return {
      totalEvents: fileEvents.length,
      lastAccessed: fileEvents.length > 0 
        ? fileEvents.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0].timestamp.toDate()
        : undefined,
      accessCount: fileEvents.filter(e => e.action === FileAuditAction.FILE_VIEWED).length,
      downloadCount: fileEvents.filter(e => e.action === FileAuditAction.FILE_DOWNLOADED).length,
      shareCount: fileEvents.filter(e => e.action === FileAuditAction.FILE_SHARED).length,
      unauthorizedAttempts: fileEvents.filter(e => !e.wasAuthorized).length,
      permissionChanges: fileEvents.filter(e => e.action === FileAuditAction.PERMISSIONS_CHANGED).length,
    };
  }

  /**
   * Generate unique ID for audit entries
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine severity based on action and authorization status
   */
  private determineSeverity(action: FileAuditAction, wasAuthorized?: boolean): AuditSeverity {
    if (wasAuthorized === false) {
      return AuditSeverity.HIGH;
    }

    switch (action) {
      case FileAuditAction.UNAUTHORIZED_ACCESS_ATTEMPT:
        return AuditSeverity.CRITICAL;
      
      case FileAuditAction.PERMISSIONS_CHANGED:
      case FileAuditAction.FILE_DELETED:
      case FileAuditAction.ACCESS_REVOKED:
        return AuditSeverity.HIGH;
      
      case FileAuditAction.FILE_SHARED:
      case FileAuditAction.SHARE_LINK_CREATED:
      case FileAuditAction.ACCESS_GRANTED:
        return AuditSeverity.MEDIUM;
      
      default:
        return AuditSeverity.LOW;
    }
  }

  /**
   * Get changes between permission objects
   */
  private getPermissionChanges(
    oldPermissions: FilePermissions,
    newPermissions: FilePermissions
  ): string[] {
    const changes: string[] = [];

    if (oldPermissions.level !== newPermissions.level) {
      changes.push(`level: ${oldPermissions.level} → ${newPermissions.level}`);
    }
    if (oldPermissions.allowDownload !== newPermissions.allowDownload) {
      changes.push(`allowDownload: ${oldPermissions.allowDownload} → ${newPermissions.allowDownload}`);
    }
    if (oldPermissions.allowShare !== newPermissions.allowShare) {
      changes.push(`allowShare: ${oldPermissions.allowShare} → ${newPermissions.allowShare}`);
    }
    if (oldPermissions.allowDelete !== newPermissions.allowDelete) {
      changes.push(`allowDelete: ${oldPermissions.allowDelete} → ${newPermissions.allowDelete}`);
    }
    if (oldPermissions.allowVersioning !== newPermissions.allowVersioning) {
      changes.push(`allowVersioning: ${oldPermissions.allowVersioning} → ${newPermissions.allowVersioning}`);
    }
    if (oldPermissions.allowComments !== newPermissions.allowComments) {
      changes.push(`allowComments: ${oldPermissions.allowComments} → ${newPermissions.allowComments}`);
    }

    return changes;
  }

  /**
   * Trigger security alert for critical events
   */
  private async triggerSecurityAlert(auditEntry: FileAuditEntry): Promise<void> {
    // In a real implementation, this would send alerts to security team
    console.warn('SECURITY ALERT:', {
      action: auditEntry.action,
      file: auditEntry.fileName,
      user: auditEntry.userName,
      timestamp: auditEntry.timestamp.toDate(),
      reason: auditEntry.reason,
    });
  }
}

// Export singleton instance
export const fileAuditLogger = FileAuditLogger.getInstance();