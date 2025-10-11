/**
 * Dashboard Widget Service
 * Implements widget enhancements including:
 * - Widget description and configuration support
 * - Widget size constraints (minW, maxW, minH, maxH)
 * - Widget permission system
 * - Widget drag-and-drop functionality
 */

import { DashboardWidget, UserRole } from '../types';
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
  Timestamp
} from 'firebase/firestore';

export interface WidgetConfig {
  refreshInterval?: number;
  dataSource?: string;
  filters?: Record<string, any>;
  displayOptions?: {
    showHeader?: boolean;
    showFooter?: boolean;
    compactMode?: boolean;
    colorScheme?: string;
  };
  customSettings?: Record<string, any>;
}

export interface WidgetPermissions {
  roles: UserRole[];
  users?: string[];
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowShare?: boolean;
  allowExport?: boolean;
}

export interface EnhancedDashboardWidget extends Omit<DashboardWidget, 'config' | 'permissions'> {
  description?: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  config?: WidgetConfig;
  permissions?: WidgetPermissions;
  isVisible?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  tags?: string[];
  category?: 'analytics' | 'projects' | 'communication' | 'files' | 'system' | 'custom';
}

export interface WidgetDragDropConfig {
  isDraggable: boolean;
  isResizable: boolean;
  dragHandle?: string;
  resizeHandles?: ('n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw')[];
  bounds?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };
  onDragStart?: (widgetId: string) => void;
  onDragStop?: (widgetId: string, position: { x: number; y: number }) => void;
  onResizeStart?: (widgetId: string) => void;
  onResizeStop?: (widgetId: string, size: { w: number; h: number }) => void;
}

/**
 * Validates widget size constraints
 */
export const validateWidgetSize = (
  widget: EnhancedDashboardWidget,
  width: number,
  height: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (widget.minW && width < widget.minW) {
    errors.push(`Width ${width} is below minimum ${widget.minW}`);
  }

  if (widget.maxW && width > widget.maxW) {
    errors.push(`Width ${width} exceeds maximum ${widget.maxW}`);
  }

  if (widget.minH && height < widget.minH) {
    errors.push(`Height ${height} is below minimum ${widget.minH}`);
  }

  if (widget.maxH && height > widget.maxH) {
    errors.push(`Height ${height} exceeds maximum ${widget.maxH}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Checks if user has permission to access widget
 */
export const checkWidgetPermission = (
  widget: EnhancedDashboardWidget,
  userRole: UserRole,
  userId?: string
): boolean => {
  if (!widget.permissions) {
    return true; // No restrictions
  }

  // Check role-based permissions
  if (widget.permissions.roles.includes(userRole)) {
    return true;
  }

  // Check user-specific permissions
  if (userId && widget.permissions.users?.includes(userId)) {
    return true;
  }

  return false;
};

/**
 * Checks if user can perform specific action on widget
 */
export const checkWidgetAction = (
  widget: EnhancedDashboardWidget,
  action: 'edit' | 'delete' | 'share' | 'export',
  userRole: UserRole
): boolean => {
  if (!widget.permissions) {
    return userRole === UserRole.ADMIN;
  }

  const actionMap = {
    edit: widget.permissions.allowEdit,
    delete: widget.permissions.allowDelete,
    share: widget.permissions.allowShare,
    export: widget.permissions.allowExport
  };

  // Admin always has permission
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  return actionMap[action] ?? false;
};

/**
 * Creates a new widget with enhanced properties
 */
export const createWidget = async (
  widget: Omit<EnhancedDashboardWidget, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> => {
  try {
    const widgetRef = doc(collection(db, 'widgets'));
    const widgetId = widgetRef.id;

    const widgetData: EnhancedDashboardWidget = {
      ...widget,
      id: widgetId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      isVisible: widget.isVisible ?? true
    };

    await setDoc(widgetRef, widgetData);

    console.log('Widget created successfully:', widgetId);
    return widgetId;
  } catch (error) {
    console.error('Error creating widget:', error);
    throw error;
  }
};

/**
 * Updates widget configuration
 */
export const updateWidgetConfig = async (
  widgetId: string,
  config: Partial<WidgetConfig>
): Promise<void> => {
  try {
    const widgetRef = doc(db, 'widgets', widgetId);
    await updateDoc(widgetRef, {
      config: config,
      updatedAt: Timestamp.now()
    });

    console.log('Widget config updated:', widgetId);
  } catch (error) {
    console.error('Error updating widget config:', error);
    throw error;
  }
};

/**
 * Updates widget permissions
 */
export const updateWidgetPermissions = async (
  widgetId: string,
  permissions: WidgetPermissions
): Promise<void> => {
  try {
    const widgetRef = doc(db, 'widgets', widgetId);
    await updateDoc(widgetRef, {
      permissions: permissions,
      updatedAt: Timestamp.now()
    });

    console.log('Widget permissions updated:', widgetId);
  } catch (error) {
    console.error('Error updating widget permissions:', error);
    throw error;
  }
};

/**
 * Updates widget size constraints
 */
export const updateWidgetSizeConstraints = async (
  widgetId: string,
  constraints: {
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
  }
): Promise<void> => {
  try {
    const widgetRef = doc(db, 'widgets', widgetId);
    await updateDoc(widgetRef, {
      ...constraints,
      updatedAt: Timestamp.now()
    });

    console.log('Widget size constraints updated:', widgetId);
  } catch (error) {
    console.error('Error updating widget size constraints:', error);
    throw error;
  }
};

/**
 * Gets widget by ID
 */
export const getWidget = async (widgetId: string): Promise<EnhancedDashboardWidget | null> => {
  try {
    const widgetRef = doc(db, 'widgets', widgetId);
    const widgetSnap = await getDoc(widgetRef);

    if (!widgetSnap.exists()) {
      return null;
    }

    return widgetSnap.data() as EnhancedDashboardWidget;
  } catch (error) {
    console.error('Error getting widget:', error);
    throw error;
  }
};

/**
 * Gets all widgets accessible by user
 */
export const getUserWidgets = async (
  userId: string,
  userRole: UserRole
): Promise<EnhancedDashboardWidget[]> => {
  try {
    const widgetsRef = collection(db, 'widgets');
    const widgetsSnap = await getDocs(widgetsRef);

    const widgets: EnhancedDashboardWidget[] = [];

    widgetsSnap.forEach((doc) => {
      const widget = doc.data() as EnhancedDashboardWidget;
      if (checkWidgetPermission(widget, userRole, userId)) {
        widgets.push(widget);
      }
    });

    return widgets;
  } catch (error) {
    console.error('Error getting user widgets:', error);
    throw error;
  }
};

/**
 * Deletes a widget
 */
export const deleteWidget = async (widgetId: string): Promise<void> => {
  try {
    const widgetRef = doc(db, 'widgets', widgetId);
    await deleteDoc(widgetRef);

    console.log('Widget deleted:', widgetId);
  } catch (error) {
    console.error('Error deleting widget:', error);
    throw error;
  }
};

/**
 * Clones a widget
 */
export const cloneWidget = async (
  widgetId: string,
  userId: string,
  newTitle?: string
): Promise<string> => {
  try {
    const originalWidget = await getWidget(widgetId);
    if (!originalWidget) {
      throw new Error('Widget not found');
    }

    const { id, createdAt, updatedAt, createdBy, ...widgetData } = originalWidget;

    const clonedWidget: Omit<EnhancedDashboardWidget, 'id' | 'createdAt' | 'updatedAt'> = {
      ...widgetData,
      title: newTitle || `${originalWidget.title} (Copy)`,
      createdBy: userId
    };

    return await createWidget(clonedWidget, userId);
  } catch (error) {
    console.error('Error cloning widget:', error);
    throw error;
  }
};

/**
 * Configures drag-and-drop for a widget
 */
export const configureWidgetDragDrop = (
  widget: EnhancedDashboardWidget,
  userRole: UserRole
): WidgetDragDropConfig => {
  const canEdit = checkWidgetAction(widget, 'edit', userRole);

  return {
    isDraggable: canEdit,
    isResizable: canEdit,
    dragHandle: '.widget-drag-handle',
    resizeHandles: ['se', 's', 'e'],
    bounds: {
      left: 0,
      top: 0
    },
    onDragStart: (widgetId) => {
      console.log('Drag started:', widgetId);
    },
    onDragStop: async (widgetId, position) => {
      console.log('Drag stopped:', widgetId, position);
      // Save position to database
      try {
        const widgetRef = doc(db, 'widgets', widgetId);
        await updateDoc(widgetRef, {
          x: position.x,
          y: position.y,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error saving widget position:', error);
      }
    },
    onResizeStart: (widgetId) => {
      console.log('Resize started:', widgetId);
    },
    onResizeStop: async (widgetId, size) => {
      console.log('Resize stopped:', widgetId, size);
      
      // Validate size constraints
      const widget = await getWidget(widgetId);
      if (widget) {
        const validation = validateWidgetSize(widget, size.w, size.h);
        if (!validation.valid) {
          console.error('Invalid widget size:', validation.errors);
          return;
        }

        // Save size to database
        try {
          const widgetRef = doc(db, 'widgets', widgetId);
          await updateDoc(widgetRef, {
            w: size.w,
            h: size.h,
            updatedAt: Timestamp.now()
          });
        } catch (error) {
          console.error('Error saving widget size:', error);
        }
      }
    }
  };
};

/**
 * Exports widget configuration
 */
export const exportWidgetConfig = (widget: EnhancedDashboardWidget): string => {
  const exportData = {
    title: widget.title,
    description: widget.description,
    type: widget.type,
    config: widget.config,
    permissions: widget.permissions,
    minW: widget.minW,
    maxW: widget.maxW,
    minH: widget.minH,
    maxH: widget.maxH,
    category: widget.category,
    tags: widget.tags
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Imports widget configuration
 */
export const importWidgetConfig = async (
  configJson: string,
  userId: string
): Promise<string> => {
  try {
    const config = JSON.parse(configJson);
    return await createWidget(config, userId);
  } catch (error) {
    console.error('Error importing widget config:', error);
    throw error;
  }
};
