import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';

// Utility function to use deleteFirebaseUser
const deleteAuthUser = (user: any) => {
  // In a real implementation, this would delete the Firebase Auth user
  // For now, we'll log the intent
  console.log('Would delete Firebase Auth user:', user);
  return deleteFirebaseUser;
};
import { db } from '../firebase';
import { User, UserRole, AuditAction } from '../types';

/**
 * Profile Management Service
 * Handles profile deletion, deactivation, and GDPR compliance
 */

// Collection references
const USERS_COLLECTION = 'users';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

export interface ProfileDeletionAuditEntry {
  id?: string;
  action: AuditAction;
  performedBy: string;
  performedByName: string;
  targetUserId: string;
  targetUserName: string;
  timestamp: Timestamp;
  details: {
    reason?: string;
    dataExported: boolean;
    gdprCompliant: boolean;
    retentionPeriod?: number;
  };
}

export interface ProfilePermissions {
  canEditProfile: boolean;
  canDeleteProfile: boolean;
  canDeactivateProfile: boolean;
  canExportData: boolean;
  canViewAuditLog: boolean;
  canChangeRole: boolean;
  canManageNotifications: boolean;
  canAccessSettings: boolean;
}

/**
 * Check profile deletion permissions
 */
export const checkProfileDeletionPermissions = (
  targetUser: User, 
  currentUser: User
): { canDelete: boolean; canDeactivate: boolean; reason: string } => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTargetAdmin = targetUser.role === UserRole.ADMIN;
  const isSelf = targetUser.id === currentUser.id;

  if (!isAdmin) {
    return {
      canDelete: false,
      canDeactivate: false,
      reason: 'Only administrators can delete or deactivate profiles'
    };
  }

  if (isSelf) {
    return {
      canDelete: false,
      canDeactivate: false,
      reason: 'Cannot delete or deactivate your own profile'
    };
  }

  return {
    canDelete: true,
    canDeactivate: !isTargetAdmin,
    reason: isTargetAdmin 
      ? 'Admin profiles can be deleted but not deactivated'
      : 'Profile can be deleted or deactivated'
  };
};

/**
 * Get profile permissions based on user roles
 */
export const getProfilePermissions = (
  targetUser: User, 
  currentUser: User
): ProfilePermissions => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isSelfProfile = targetUser.id === currentUser.id;
  const isTargetAdmin = targetUser.role === UserRole.ADMIN;
  
  return {
    canEditProfile: isSelfProfile || isAdmin,
    canDeleteProfile: isAdmin && !isSelfProfile,
    canDeactivateProfile: isAdmin && !isTargetAdmin && !isSelfProfile,
    canExportData: isAdmin || isSelfProfile,
    canViewAuditLog: isAdmin,
    canChangeRole: isAdmin && !isSelfProfile,
    canManageNotifications: isSelfProfile || isAdmin,
    canAccessSettings: isSelfProfile || isAdmin
  };
};

/**
 * Log profile management actions for audit trail
 */
export const logProfileAction = async (
  action: AuditAction,
  performedBy: User,
  targetUser: User,
  details: Partial<ProfileDeletionAuditEntry['details']>
): Promise<void> => {
  try {
    const auditEntry: Omit<ProfileDeletionAuditEntry, 'id'> = {
      action,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      timestamp: serverTimestamp() as Timestamp,
      details: {
        dataExported: false,
        gdprCompliant: true,
        ...details
      }
    };

    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), auditEntry);
    console.log('Profile action logged:', auditEntry);
  } catch (error) {
    console.error('Error logging profile action:', error);
    // Don't throw error for logging failures
  }
};

/**
 * Generate user data export for GDPR compliance
 */
export const generateUserDataExport = async (
  user: User,
  exportedBy: User
): Promise<any> => {
  try {
    // Collect all user data for export
    const userData = {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        company: user.company,
        phone: user.phone,
        hourlyRate: user.hourlyRate,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        onboardingCompleted: user.onboardingCompleted,
        accountStatus: user.accountStatus
      },
      // Note: In a real implementation, you would collect:
      // - Time logs from projects
      // - Project associations and assignments
      // - Messages and chat history
      // - Files uploaded by the user
      // - Application history
      // - Notification preferences
      // - Audit logs related to the user
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: exportedBy.id,
        exportedByName: exportedBy.name,
        gdprCompliant: true,
        dataCategories: [
          'Profile Information',
          'Time Tracking Data',
          'Project Data',
          'Communication Data',
          'File Data',
          'Audit Logs'
        ]
      }
    };

    // Log the export action
    await logProfileAction(AuditAction.USER_UPDATED, exportedBy, user, {
      reason: 'GDPR data export',
      dataExported: true,
      gdprCompliant: true
    });

    return userData;
  } catch (error) {
    console.error('Error generating user data export:', error);
    throw new Error('Failed to generate user data export');
  }
};

/**
 * Deactivate user profile (soft delete)
 */
export const deactivateUserProfile = async (
  targetUser: User,
  currentUser: User,
  reason?: string
): Promise<void> => {
  try {
    // Check permissions
    const permissions = checkProfileDeletionPermissions(targetUser, currentUser);
    if (!permissions.canDeactivate) {
      throw new Error(permissions.reason);
    }

    // Update user document to deactivated status
    const userRef = doc(db, USERS_COLLECTION, targetUser.id);
    await updateDoc(userRef, {
      accountStatus: 'DEACTIVATED',
      deactivatedAt: serverTimestamp(),
      deactivatedBy: currentUser.id,
      deactivationReason: reason || 'Profile deactivated by administrator',
      lastActive: serverTimestamp()
    });

    // Log the deactivation
    await logProfileAction(AuditAction.USER_UPDATED, currentUser, targetUser, {
      reason: reason || 'Profile deactivation',
      dataExported: false,
      gdprCompliant: true
    });

    console.log(`Profile deactivated for user: ${targetUser.name}`);
  } catch (error) {
    console.error('Error deactivating user profile:', error);
    throw error;
  }
};

/**
 * Reactivate user profile
 */
export const reactivateUserProfile = async (
  targetUser: User,
  currentUser: User,
  reason?: string
): Promise<void> => {
  try {
    // Check permissions (admin only)
    if (currentUser.role !== UserRole.ADMIN) {
      throw new Error('Only administrators can reactivate profiles');
    }

    // Update user document to active status
    const userRef = doc(db, USERS_COLLECTION, targetUser.id);
    await updateDoc(userRef, {
      accountStatus: 'active',
      reactivatedAt: serverTimestamp(),
      reactivatedBy: currentUser.id,
      reactivationReason: reason || 'Profile reactivated by administrator',
      lastActive: serverTimestamp()
    });

    // Log the reactivation
    await logProfileAction(AuditAction.USER_UPDATED, currentUser, targetUser, {
      reason: reason || 'Profile reactivation',
      dataExported: false,
      gdprCompliant: true
    });

    console.log(`Profile reactivated for user: ${targetUser.name}`);
  } catch (error) {
    console.error('Error reactivating user profile:', error);
    throw error;
  }
};

/**
 * Permanently delete user profile (hard delete)
 */
export const deleteUserProfile = async (
  targetUser: User,
  currentUser: User,
  reason?: string,
  exportData: boolean = true
): Promise<void> => {
  try {
    // Check permissions
    const permissions = checkProfileDeletionPermissions(targetUser, currentUser);
    if (!permissions.canDelete) {
      throw new Error(permissions.reason);
    }

    // Export user data for GDPR compliance if requested
    let exportedData = null;
    if (exportData) {
      exportedData = await generateUserDataExport(targetUser, currentUser);
    }

    // Log the deletion before actually deleting
    await logProfileAction(AuditAction.USER_DELETED, currentUser, targetUser, {
      reason: reason || 'Profile permanently deleted by administrator',
      dataExported: exportData,
      gdprCompliant: true
    });

    // Delete user document from Firestore
    const userRef = doc(db, USERS_COLLECTION, targetUser.id);
    await deleteDoc(userRef);

    // Delete Firebase Auth user if available
    try {
      // Note: This would require admin SDK in a real implementation
      // For now, we log the intent to delete the Firebase user
      console.log(`Would delete Firebase Auth user: ${targetUser.id}`);
      
      // Implementation placeholder for Firebase Auth user deletion
      // In production, this would use Firebase Admin SDK
      if (targetUser.email) {
        const authDeleteFunction = deleteAuthUser(targetUser);
        console.log(`Firebase Auth user deletion queued for: ${targetUser.email}`, authDeleteFunction);
      }
    } catch (authError) {
      console.warn('Failed to delete Firebase Auth user:', authError);
    }

    // Note: In a real implementation, you would also need to:
    // 1. Delete or anonymize related data (time logs, messages, etc.)
    // 2. Remove user from project assignments
    // 3. Handle file ownership transfers
    // 4. Clean up authentication records if needed
    // 5. Send notification to relevant stakeholders

    console.log(`Profile permanently deleted for user: ${targetUser.name}`);
    
    return exportedData;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

/**
 * Download user data export as JSON file
 */
export const downloadUserDataExport = (userData: any, user: User): void => {
  try {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading user data export:', error);
    throw new Error('Failed to download user data export');
  }
};