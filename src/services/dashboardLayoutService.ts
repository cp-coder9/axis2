/**
 * Dashboard Layout Management Service
 * Implements:
 * - Dashboard layout management
 * - Widget positioning and resizing
 * - Dashboard templates and presets
 * - User-specific dashboard configurations
 */

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { WidgetLayout, DashboardSettings } from '../types/dashboard';
import { UserRole } from '../types';

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  widgets: WidgetLayout[];
  settings: DashboardSettings;
  isDefault: boolean;
  isTemplate: boolean;
  templateRole?: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  thumbnail?: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  role: UserRole;
  widgets: WidgetLayout[];
  settings: Partial<DashboardSettings>;
  preview?: string;
  category?: 'productivity' | 'analytics' | 'minimal' | 'comprehensive';
}

/**
 * Saves dashboard layout for a user
 */
export const saveDashboardLayout = async (
  userId: string,
  layout: WidgetLayout[],
  settings: DashboardSettings,
  name?: string
): Promise<void> => {
  try {
    const layoutRef = doc(db, 'dashboardLayouts', userId);

    const layoutData: Partial<DashboardLayout> = {
      userId,
      name: name || 'My Dashboard',
      widgets: layout,
      settings,
      updatedAt: Timestamp.now()
    };

    const existingLayout = await getDoc(layoutRef);

    if (existingLayout.exists()) {
      await updateDoc(layoutRef, layoutData);
    } else {
      await setDoc(layoutRef, {
        ...layoutData,
        id: userId,
        isDefault: true,
        isTemplate: false,
        createdAt: Timestamp.now()
      });
    }

    console.log('Dashboard layout saved for user:', userId);
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    throw error;
  }
};

/**
 * Loads dashboard layout for a user
 */
export const loadDashboardLayout = async (
  userId: string
): Promise<DashboardLayout | null> => {
  try {
    const layoutRef = doc(db, 'dashboardLayouts', userId);
    const layoutSnap = await getDoc(layoutRef);

    if (!layoutSnap.exists()) {
      return null;
    }

    return layoutSnap.data() as DashboardLayout;
  } catch (error) {
    console.error('Error loading dashboard layout:', error);
    throw error;
  }
};

/**
 * Updates widget position in layout
 */
export const updateWidgetPosition = async (
  userId: string,
  widgetId: string,
  position: { x: number; y: number }
): Promise<void> => {
  try {
    const layout = await loadDashboardLayout(userId);
    if (!layout) {
      throw new Error('Dashboard layout not found');
    }

    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, x: position.x, y: position.y }
        : widget
    );

    await saveDashboardLayout(userId, updatedWidgets, layout.settings, layout.name);
    console.log('Widget position updated:', widgetId);
  } catch (error) {
    console.error('Error updating widget position:', error);
    throw error;
  }
};

/**
 * Updates widget size in layout
 */
export const updateWidgetSize = async (
  userId: string,
  widgetId: string,
  size: { w: number; h: number }
): Promise<void> => {
  try {
    const layout = await loadDashboardLayout(userId);
    if (!layout) {
      throw new Error('Dashboard layout not found');
    }

    const updatedWidgets = layout.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, w: size.w, h: size.h }
        : widget
    );

    await saveDashboardLayout(userId, updatedWidgets, layout.settings, layout.name);
    console.log('Widget size updated:', widgetId);
  } catch (error) {
    console.error('Error updating widget size:', error);
    throw error;
  }
};

/**
 * Adds widget to layout
 */
export const addWidgetToLayout = async (
  userId: string,
  widget: WidgetLayout
): Promise<void> => {
  try {
    const layout = await loadDashboardLayout(userId);
    if (!layout) {
      throw new Error('Dashboard layout not found');
    }

    // Check if widget already exists
    const existingWidget = layout.widgets.find(w => w.id === widget.id);
    if (existingWidget) {
      throw new Error('Widget already exists in layout');
    }

    const updatedWidgets = [...layout.widgets, widget];
    await saveDashboardLayout(userId, updatedWidgets, layout.settings, layout.name);
    console.log('Widget added to layout:', widget.id);
  } catch (error) {
    console.error('Error adding widget to layout:', error);
    throw error;
  }
};

/**
 * Removes widget from layout
 */
export const removeWidgetFromLayout = async (
  userId: string,
  widgetId: string
): Promise<void> => {
  try {
    const layout = await loadDashboardLayout(userId);
    if (!layout) {
      throw new Error('Dashboard layout not found');
    }

    const updatedWidgets = layout.widgets.filter(w => w.id !== widgetId);
    await saveDashboardLayout(userId, updatedWidgets, layout.settings, layout.name);
    console.log('Widget removed from layout:', widgetId);
  } catch (error) {
    console.error('Error removing widget from layout:', error);
    throw error;
  }
};

/**
 * Resets layout to default template
 */
export const resetToDefaultLayout = async (
  userId: string,
  userRole: UserRole
): Promise<void> => {
  try {
    const template = getDefaultTemplateForRole(userRole);
    if (!template) {
      throw new Error('No default template found for role');
    }

    const defaultSettings: DashboardSettings = {
      userId,
      layout: template.widgets,
      enabledWidgets: template.widgets.map(w => w.id),
      refreshIntervals: {},
      autoRefresh: true,
      compactMode: false,
      lastUpdated: new Date()
    };

    await saveDashboardLayout(userId, template.widgets, defaultSettings, template.name);
    console.log('Layout reset to default for role:', userRole);
  } catch (error) {
    console.error('Error resetting layout:', error);
    throw error;
  }
};

/**
 * Gets default template for user role
 */
export const getDefaultTemplateForRole = (role: UserRole): DashboardTemplate | null => {
  const templates: Record<UserRole, DashboardTemplate> = {
    [UserRole.ADMIN]: {
      id: 'admin-default',
      name: 'Admin Overview',
      description: 'Complete system overview with analytics and management tools',
      role: UserRole.ADMIN,
      category: 'comprehensive',
      widgets: [
        { i: 'analytics-overview', id: 'analytics-overview', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'user-management', id: 'user-management', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'project-timeline', id: 'project-timeline', x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3, maxW: 12, maxH: 8, isDraggable: true, isResizable: true },
        { i: 'system-health', id: 'system-health', x: 0, y: 8, w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 4, isDraggable: true, isResizable: true },
        { i: 'billing-summary', id: 'billing-summary', x: 6, y: 8, w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 4, isDraggable: true, isResizable: true }
      ],
      settings: {
        autoRefresh: true,
        compactMode: false
      }
    },
    [UserRole.FREELANCER]: {
      id: 'freelancer-default',
      name: 'Freelancer Workspace',
      description: 'Focus on time tracking and assigned projects',
      role: UserRole.FREELANCER,
      category: 'productivity',
      widgets: [
        { i: 'time-tracker', id: 'time-tracker', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'my-projects', id: 'my-projects', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'task-list', id: 'task-list', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'earnings-summary', id: 'earnings-summary', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true }
      ],
      settings: {
        autoRefresh: true,
        compactMode: false
      }
    },
    [UserRole.CLIENT]: {
      id: 'client-default',
      name: 'Client Dashboard',
      description: 'Project progress and communication tools',
      role: UserRole.CLIENT,
      category: 'minimal',
      widgets: [
        { i: 'project-overview', id: 'project-overview', x: 0, y: 0, w: 8, h: 4, minW: 6, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'messages', id: 'messages', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3, maxW: 6, maxH: 8, isDraggable: true, isResizable: true },
        { i: 'files', id: 'files', x: 0, y: 4, w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
        { i: 'billing-info', id: 'billing-info', x: 6, y: 4, w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 6, isDraggable: true, isResizable: true }
      ],
      settings: {
        autoRefresh: true,
        compactMode: false
      }
    }
  };

  return templates[role] || null;
};

/**
 * Gets all available templates
 */
export const getAllTemplates = (): DashboardTemplate[] => {
  return Object.values(UserRole).map(role => getDefaultTemplateForRole(role)).filter(Boolean) as DashboardTemplate[];
};

/**
 * Applies template to user dashboard
 */
export const applyTemplate = async (
  userId: string,
  templateId: string
): Promise<void> => {
  try {
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const settings: DashboardSettings = {
      userId,
      layout: template.widgets,
      enabledWidgets: template.widgets.map(w => w.id),
      refreshIntervals: {},
      autoRefresh: template.settings.autoRefresh ?? true,
      compactMode: template.settings.compactMode ?? false,
      lastUpdated: new Date()
    };

    await saveDashboardLayout(userId, template.widgets, settings, template.name);
    console.log('Template applied:', templateId);
  } catch (error) {
    console.error('Error applying template:', error);
    throw error;
  }
};

/**
 * Creates custom template from current layout
 */
export const createCustomTemplate = async (
  userId: string,
  name: string,
  description: string,
  role: UserRole
): Promise<string> => {
  try {
    const currentLayout = await loadDashboardLayout(userId);
    if (!currentLayout) {
      throw new Error('No layout found to create template from');
    }

    const templateRef = doc(collection(db, 'dashboardTemplates'));
    const templateId = templateRef.id;

    const template: DashboardLayout = {
      id: templateId,
      userId,
      name,
      description,
      widgets: currentLayout.widgets,
      settings: currentLayout.settings,
      isDefault: false,
      isTemplate: true,
      templateRole: role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(templateRef, template);
    console.log('Custom template created:', templateId);
    return templateId;
  } catch (error) {
    console.error('Error creating custom template:', error);
    throw error;
  }
};

/**
 * Gets user's custom templates
 */
export const getUserTemplates = async (userId: string): Promise<DashboardLayout[]> => {
  try {
    const templatesRef = collection(db, 'dashboardTemplates');
    const q = query(templatesRef, where('userId', '==', userId), where('isTemplate', '==', true));
    const querySnapshot = await getDocs(q);

    const templates: DashboardLayout[] = [];
    querySnapshot.forEach((doc) => {
      templates.push(doc.data() as DashboardLayout);
    });

    return templates;
  } catch (error) {
    console.error('Error getting user templates:', error);
    throw error;
  }
};

/**
 * Exports dashboard layout as JSON
 */
export const exportDashboardLayout = (layout: DashboardLayout): string => {
  const exportData = {
    name: layout.name,
    description: layout.description,
    widgets: layout.widgets,
    settings: layout.settings,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Imports dashboard layout from JSON
 */
export const importDashboardLayout = async (
  userId: string,
  layoutJson: string
): Promise<void> => {
  try {
    const importData = JSON.parse(layoutJson);

    if (!importData.widgets || !Array.isArray(importData.widgets)) {
      throw new Error('Invalid layout format: missing widgets array');
    }

    const settings: DashboardSettings = {
      userId,
      layout: importData.widgets,
      enabledWidgets: importData.settings?.enabledWidgets || importData.widgets.map((w: WidgetLayout) => w.id),
      refreshIntervals: importData.settings?.refreshIntervals || {},
      autoRefresh: importData.settings?.autoRefresh ?? true,
      compactMode: importData.settings?.compactMode ?? false,
      lastUpdated: new Date()
    };

    await saveDashboardLayout(userId, importData.widgets, settings, importData.name);
    console.log('Dashboard layout imported successfully');
  } catch (error) {
    console.error('Error importing dashboard layout:', error);
    throw error;
  }
};

/**
 * Optimizes layout by removing overlaps and gaps
 */
export const optimizeLayout = (widgets: WidgetLayout[]): WidgetLayout[] => {
  // Sort widgets by y position, then x position
  const sorted = [...widgets].sort((a, b) => {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  // Compact layout by moving widgets up
  const optimized: WidgetLayout[] = [];

  for (const widget of sorted) {
    let newY = 0;
    let collision = true;

    // Find the lowest y position without collision
    while (collision) {
      collision = false;
      for (const placed of optimized) {
        if (
          widget.x < placed.x + placed.w &&
          widget.x + widget.w > placed.x &&
          newY < placed.y + placed.h &&
          newY + widget.h > placed.y
        ) {
          collision = true;
          newY = placed.y + placed.h;
          break;
        }
      }
    }

    optimized.push({ ...widget, y: newY });
  }

  return optimized;
};

/**
 * Validates layout for conflicts
 */
export const validateLayout = (widgets: WidgetLayout[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for overlapping widgets
  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      const w1 = widgets[i];
      const w2 = widgets[j];

      if (
        w1.x < w2.x + w2.w &&
        w1.x + w1.w > w2.x &&
        w1.y < w2.y + w2.h &&
        w1.y + w1.h > w2.y
      ) {
        errors.push(`Widgets ${w1.id} and ${w2.id} overlap`);
      }
    }
  }

  // Check size constraints
  for (const widget of widgets) {
    if (widget.minW && widget.w < widget.minW) {
      errors.push(`Widget ${widget.id} width ${widget.w} is below minimum ${widget.minW}`);
    }
    if (widget.maxW && widget.w > widget.maxW) {
      errors.push(`Widget ${widget.id} width ${widget.w} exceeds maximum ${widget.maxW}`);
    }
    if (widget.minH && widget.h < widget.minH) {
      errors.push(`Widget ${widget.id} height ${widget.h} is below minimum ${widget.minH}`);
    }
    if (widget.maxH && widget.h > widget.maxH) {
      errors.push(`Widget ${widget.id} height ${widget.h} exceeds maximum ${widget.maxH}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
