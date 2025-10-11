/**
 * Dashboard Sharing Service
 * Implements:
 * - Dashboard sharing with other users
 * - Collaborative dashboard editing
 * - Dashboard export and import functionality
 * - Dashboard version control
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { DashboardLayout } from './dashboardLayoutService';
import { WidgetLayout, DashboardSettings } from '../types/dashboard';
import { UserRole } from '../types';

export interface SharedDashboard {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description?: string;
  layout: WidgetLayout[];
  settings: DashboardSettings;
  sharedWith: SharedUser[];
  shareLink?: string;
  isPublic: boolean;
  allowEditing: boolean;
  allowCopying: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
  accessCount: number;
  versions: DashboardVersion[];
  currentVersion: number;
}

export interface SharedUser {
  userId: string;
  userName: string;
  userEmail: string;
  role: 'viewer' | 'editor' | 'admin';
  sharedAt: Timestamp;
  lastAccessed?: Timestamp;
}

export interface DashboardVersion {
  version: number;
  layout: WidgetLayout[];
  settings: DashboardSettings;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  changeDescription?: string;
  tags?: string[];
}

export interface SharePermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  canExport: boolean;
  canRestore: boolean;
}

/**
 * Shares dashboard with specific users
 */
export const shareDashboardWithUsers = async (
  dashboardId: string,
  ownerId: string,
  ownerName: string,
  users: Array<{ userId: string; userName: string; userEmail: string; role: 'viewer' | 'editor' }>,
  allowEditing: boolean = false
): Promise<string> => {
  try {
    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    const dashboardSnap = await getDoc(dashboardRef);

    const sharedUsers: SharedUser[] = users.map(user => ({
      ...user,
      sharedAt: Timestamp.now()
    }));

    if (dashboardSnap.exists()) {
      // Update existing shared dashboard
      await updateDoc(dashboardRef, {
        sharedWith: arrayUnion(...sharedUsers),
        allowEditing,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new shared dashboard
      const currentLayout = await loadDashboardLayout(ownerId);
      if (!currentLayout) {
        throw new Error('Dashboard layout not found');
      }

      const sharedDashboard: SharedDashboard = {
        id: dashboardId,
        ownerId,
        ownerName,
        name: currentLayout.name,
        description: currentLayout.description,
        layout: currentLayout.widgets,
        settings: currentLayout.settings,
        sharedWith: sharedUsers,
        isPublic: false,
        allowEditing,
        allowCopying: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        accessCount: 0,
        versions: [{
          version: 1,
          layout: currentLayout.widgets,
          settings: currentLayout.settings,
          createdBy: ownerId,
          createdByName: ownerName,
          createdAt: Timestamp.now(),
          changeDescription: 'Initial version'
        }],
        currentVersion: 1
      };

      await setDoc(dashboardRef, sharedDashboard);
    }

    console.log('Dashboard shared with users:', dashboardId);
    return dashboardId;
  } catch (error) {
    console.error('Error sharing dashboard:', error);
    throw error;
  }
};

/**
 * Creates public share link for dashboard
 */
export const createPublicShareLink = async (
  dashboardId: string,
  ownerId: string,
  ownerName: string,
  expiresInDays?: number,
  allowEditing: boolean = false
): Promise<string> => {
  try {
    const shareToken = generateShareToken();
    const shareLink = `${window.location.origin}/dashboard/shared/${shareToken}`;

    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    const dashboardSnap = await getDoc(dashboardRef);

    const expiresAt = expiresInDays 
      ? Timestamp.fromDate(new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000))
      : undefined;

    if (dashboardSnap.exists()) {
      await updateDoc(dashboardRef, {
        shareLink,
        isPublic: true,
        allowEditing,
        expiresAt,
        updatedAt: Timestamp.now()
      });
    } else {
      const currentLayout = await loadDashboardLayout(ownerId);
      if (!currentLayout) {
        throw new Error('Dashboard layout not found');
      }

      const sharedDashboard: SharedDashboard = {
        id: dashboardId,
        ownerId,
        ownerName,
        name: currentLayout.name,
        description: currentLayout.description,
        layout: currentLayout.widgets,
        settings: currentLayout.settings,
        sharedWith: [],
        shareLink,
        isPublic: true,
        allowEditing,
        allowCopying: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        expiresAt,
        accessCount: 0,
        versions: [{
          version: 1,
          layout: currentLayout.widgets,
          settings: currentLayout.settings,
          createdBy: ownerId,
          createdByName: ownerName,
          createdAt: Timestamp.now(),
          changeDescription: 'Initial version'
        }],
        currentVersion: 1
      };

      await setDoc(dashboardRef, sharedDashboard);
    }

    // Store share token mapping
    await setDoc(doc(db, 'shareTokens', shareToken), {
      dashboardId,
      createdAt: Timestamp.now(),
      expiresAt
    });

    console.log('Public share link created:', shareLink);
    return shareLink;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
};

/**
 * Gets shared dashboard by ID
 */
export const getSharedDashboard = async (
  dashboardId: string,
  userId?: string
): Promise<SharedDashboard | null> => {
  try {
    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    const dashboardSnap = await getDoc(dashboardRef);

    if (!dashboardSnap.exists()) {
      return null;
    }

    const dashboard = dashboardSnap.data() as SharedDashboard;

    // Check if user has access
    if (!dashboard.isPublic && userId) {
      const hasAccess = dashboard.ownerId === userId || 
        dashboard.sharedWith.some(u => u.userId === userId);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }
    }

    // Check if link has expired
    if (dashboard.expiresAt && dashboard.expiresAt.toDate() < new Date()) {
      throw new Error('Share link has expired');
    }

    // Increment access count
    await updateDoc(dashboardRef, {
      accessCount: dashboard.accessCount + 1
    });

    // Update last accessed time for user
    if (userId) {
      const userIndex = dashboard.sharedWith.findIndex(u => u.userId === userId);
      if (userIndex !== -1) {
        dashboard.sharedWith[userIndex].lastAccessed = Timestamp.now();
        await updateDoc(dashboardRef, {
          sharedWith: dashboard.sharedWith
        });
      }
    }

    return dashboard;
  } catch (error) {
    console.error('Error getting shared dashboard:', error);
    throw error;
  }
};

/**
 * Gets dashboard by share token
 */
export const getDashboardByShareToken = async (
  shareToken: string
): Promise<SharedDashboard | null> => {
  try {
    const tokenRef = doc(db, 'shareTokens', shareToken);
    const tokenSnap = await getDoc(tokenRef);

    if (!tokenSnap.exists()) {
      return null;
    }

    const tokenData = tokenSnap.data();
    
    // Check if token has expired
    if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
      throw new Error('Share link has expired');
    }

    return await getSharedDashboard(tokenData.dashboardId);
  } catch (error) {
    console.error('Error getting dashboard by token:', error);
    throw error;
  }
};

/**
 * Updates shared dashboard (collaborative editing)
 */
export const updateSharedDashboard = async (
  dashboardId: string,
  userId: string,
  userName: string,
  layout: WidgetLayout[],
  settings: DashboardSettings,
  changeDescription?: string
): Promise<void> => {
  try {
    const dashboard = await getSharedDashboard(dashboardId, userId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Check if user has edit permission
    if (!dashboard.allowEditing) {
      throw new Error('Editing not allowed');
    }

    const userPermissions = getUserPermissions(dashboard, userId);
    if (!userPermissions.canEdit) {
      throw new Error('User does not have edit permission');
    }

    // Create new version
    const newVersion: DashboardVersion = {
      version: dashboard.currentVersion + 1,
      layout,
      settings,
      createdBy: userId,
      createdByName: userName,
      createdAt: Timestamp.now(),
      changeDescription
    };

    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    await updateDoc(dashboardRef, {
      layout,
      settings,
      versions: arrayUnion(newVersion),
      currentVersion: newVersion.version,
      updatedAt: Timestamp.now()
    });

    console.log('Shared dashboard updated:', dashboardId);
  } catch (error) {
    console.error('Error updating shared dashboard:', error);
    throw error;
  }
};

/**
 * Restores dashboard to previous version
 */
export const restoreDashboardVersion = async (
  dashboardId: string,
  userId: string,
  versionNumber: number
): Promise<void> => {
  try {
    const dashboard = await getSharedDashboard(dashboardId, userId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const userPermissions = getUserPermissions(dashboard, userId);
    if (!userPermissions.canRestore) {
      throw new Error('User does not have restore permission');
    }

    const version = dashboard.versions.find(v => v.version === versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }

    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    await updateDoc(dashboardRef, {
      layout: version.layout,
      settings: version.settings,
      currentVersion: versionNumber,
      updatedAt: Timestamp.now()
    });

    console.log('Dashboard restored to version:', versionNumber);
  } catch (error) {
    console.error('Error restoring dashboard version:', error);
    throw error;
  }
};

/**
 * Removes user from shared dashboard
 */
export const removeUserFromSharedDashboard = async (
  dashboardId: string,
  ownerId: string,
  userIdToRemove: string
): Promise<void> => {
  try {
    const dashboard = await getSharedDashboard(dashboardId, ownerId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== ownerId) {
      throw new Error('Only owner can remove users');
    }

    const userToRemove = dashboard.sharedWith.find(u => u.userId === userIdToRemove);
    if (!userToRemove) {
      throw new Error('User not found in shared list');
    }

    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    await updateDoc(dashboardRef, {
      sharedWith: arrayRemove(userToRemove),
      updatedAt: Timestamp.now()
    });

    console.log('User removed from shared dashboard:', userIdToRemove);
  } catch (error) {
    console.error('Error removing user:', error);
    throw error;
  }
};

/**
 * Revokes public share link
 */
export const revokePublicShareLink = async (
  dashboardId: string,
  ownerId: string
): Promise<void> => {
  try {
    const dashboard = await getSharedDashboard(dashboardId, ownerId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (dashboard.ownerId !== ownerId) {
      throw new Error('Only owner can revoke share link');
    }

    const dashboardRef = doc(db, 'sharedDashboards', dashboardId);
    await updateDoc(dashboardRef, {
      shareLink: null,
      isPublic: false,
      updatedAt: Timestamp.now()
    });

    console.log('Public share link revoked:', dashboardId);
  } catch (error) {
    console.error('Error revoking share link:', error);
    throw error;
  }
};

/**
 * Gets dashboards shared with user
 */
export const getSharedWithMeDashboards = async (
  userId: string
): Promise<SharedDashboard[]> => {
  try {
    const dashboardsRef = collection(db, 'sharedDashboards');
    const q = query(dashboardsRef, where('sharedWith', 'array-contains', { userId }));
    const querySnapshot = await getDocs(q);

    const dashboards: SharedDashboard[] = [];
    querySnapshot.forEach((doc) => {
      dashboards.push(doc.data() as SharedDashboard);
    });

    return dashboards;
  } catch (error) {
    console.error('Error getting shared dashboards:', error);
    throw error;
  }
};

/**
 * Gets dashboards owned by user
 */
export const getMySharedDashboards = async (
  userId: string
): Promise<SharedDashboard[]> => {
  try {
    const dashboardsRef = collection(db, 'sharedDashboards');
    const q = query(dashboardsRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);

    const dashboards: SharedDashboard[] = [];
    querySnapshot.forEach((doc) => {
      dashboards.push(doc.data() as SharedDashboard);
    });

    return dashboards;
  } catch (error) {
    console.error('Error getting my shared dashboards:', error);
    throw error;
  }
};

/**
 * Copies shared dashboard to user's own dashboard
 */
export const copySharedDashboard = async (
  dashboardId: string,
  userId: string,
  newName?: string
): Promise<void> => {
  try {
    const dashboard = await getSharedDashboard(dashboardId, userId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    if (!dashboard.allowCopying) {
      throw new Error('Copying not allowed');
    }

    const { saveDashboardLayout } = await import('./dashboardLayoutService');
    await saveDashboardLayout(
      userId,
      dashboard.layout,
      { ...dashboard.settings, userId },
      newName || `${dashboard.name} (Copy)`
    );

    console.log('Dashboard copied:', dashboardId);
  } catch (error) {
    console.error('Error copying dashboard:', error);
    throw error;
  }
};

/**
 * Gets user permissions for shared dashboard
 */
export const getUserPermissions = (
  dashboard: SharedDashboard,
  userId: string
): SharePermissions => {
  const isOwner = dashboard.ownerId === userId;
  const sharedUser = dashboard.sharedWith.find(u => u.userId === userId);

  if (isOwner) {
    return {
      canView: true,
      canEdit: true,
      canShare: true,
      canDelete: true,
      canExport: true,
      canRestore: true
    };
  }

  if (!sharedUser) {
    return {
      canView: dashboard.isPublic,
      canEdit: false,
      canShare: false,
      canDelete: false,
      canExport: dashboard.isPublic,
      canRestore: false
    };
  }

  return {
    canView: true,
    canEdit: sharedUser.role === 'editor' || sharedUser.role === 'admin',
    canShare: sharedUser.role === 'admin',
    canDelete: false,
    canExport: true,
    canRestore: sharedUser.role === 'admin'
  };
};

/**
 * Generates unique share token
 */
const generateShareToken = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper to load dashboard layout (imported from dashboardLayoutService)
 */
const loadDashboardLayout = async (userId: string): Promise<DashboardLayout | null> => {
  const { loadDashboardLayout: loadLayout } = await import('./dashboardLayoutService');
  return loadLayout(userId);
};

/**
 * Exports shared dashboard configuration
 */
export const exportSharedDashboard = (dashboard: SharedDashboard): string => {
  const exportData = {
    name: dashboard.name,
    description: dashboard.description,
    layout: dashboard.layout,
    settings: dashboard.settings,
    version: dashboard.currentVersion,
    exportDate: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
};
