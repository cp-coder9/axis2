import { 
  DashboardWidget, 
  WidgetLayout, 
  DashboardSettings,
  WidgetPermissions,
  WidgetConfig,
  DashboardLayoutPreset
} from '@/types/dashboard';
import { UserRole } from '@/types';
import { 
  validateWidgetSize, 
  checkWidgetPermission,
  getDefaultLayoutForRole 
} from '@/components/dashboard/WidgetRegistry';
import { 
  compactLayout, 
  generateDefaultLayout,
  validateLayout 
} from '@/components/dashboard/GridLayoutSystem';

/**
 * Widget Manager Service
 * Task 7.1: Centralized service for managing dashboard widgets
 * Handles widget configuration, permissions, and layout management
 */

export class WidgetManager {
  private static instance: WidgetManager;
  private widgets: Map<string, DashboardWidget> = new Map();
  private layouts: Map<string, WidgetLayout[]> = new Map();
  private settings: Map<string, DashboardSettings> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  /**
   * Register a widget
   */
  registerWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
  }

  /**
   * Unregister a widget
   */
  unregisterWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
  }

  /**
   * Get widget by ID
   */
  getWidget(widgetId: string): DashboardWidget | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * Get all widgets
   */
  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by role with permission filtering
   */
  getWidgetsByRole(role: UserRole, userId?: string): DashboardWidget[] {
    return this.getAllWidgets().filter(widget => 
      this.checkPermission(widget, role, userId)
    );
  }

  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category: DashboardWidget['category']): DashboardWidget[] {
    return this.getAllWidgets().filter(widget => widget.category === category);
  }

  /**
   * Check widget permission
   */
  checkPermission(
    widget: DashboardWidget,
    userRole: UserRole,
    userId?: string
  ): boolean {
    return checkWidgetPermission(widget, userRole, userId);
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(
    widgetId: string,
    config: Partial<WidgetConfig>
  ): DashboardWidget | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const updatedWidget: DashboardWidget = {
      ...widget,
      config: {
        ...widget.config,
        ...config
      }
    };

    this.widgets.set(widgetId, updatedWidget);
    return updatedWidget;
  }

  /**
   * Update widget permissions
   */
  updateWidgetPermissions(
    widgetId: string,
    permissions: UserRole[]
  ): DashboardWidget | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const updatedWidget: DashboardWidget = {
      ...widget,
      permissions
    };

    this.widgets.set(widgetId, updatedWidget);
    return updatedWidget;
  }

  /**
   * Update widget size constraints
   */
  updateWidgetSizeConstraints(
    widgetId: string,
    constraints: {
      minW?: number;
      maxW?: number;
      minH?: number;
      maxH?: number;
    }
  ): DashboardWidget | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const updatedWidget: DashboardWidget = {
      ...widget,
      ...constraints
    };

    this.widgets.set(widgetId, updatedWidget);
    return updatedWidget;
  }

  /**
   * Validate widget size
   */
  validateSize(
    widgetId: string,
    width: number,
    height: number
  ): { valid: boolean; adjustedWidth: number; adjustedHeight: number } {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      return { valid: false, adjustedWidth: width, adjustedHeight: height };
    }

    return validateWidgetSize(widget, width, height);
  }

  /**
   * Save user layout
   */
  saveLayout(userId: string, layout: WidgetLayout[]): void {
    this.layouts.set(userId, layout);
    
    // In production, this would save to a database
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `dashboard-layout-${userId}`,
        JSON.stringify(layout)
      );
    }
  }

  /**
   * Load user layout
   */
  loadLayout(userId: string): WidgetLayout[] | null {
    // Try memory first
    const memoryLayout = this.layouts.get(userId);
    if (memoryLayout) return memoryLayout;

    // Try localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`dashboard-layout-${userId}`);
      if (stored) {
        try {
          const layout = JSON.parse(stored);
          this.layouts.set(userId, layout);
          return layout;
        } catch (error) {
          console.error('Failed to parse stored layout:', error);
        }
      }
    }

    return null;
  }

  /**
   * Generate default layout for user
   */
  generateDefaultLayoutForUser(
    userId: string,
    userRole: UserRole
  ): WidgetLayout[] {
    const widgets = getDefaultLayoutForRole(userRole);
    const layout = generateDefaultLayout(widgets);
    this.saveLayout(userId, layout);
    return layout;
  }

  /**
   * Compact layout
   */
  compactUserLayout(userId: string): WidgetLayout[] | null {
    const layout = this.loadLayout(userId);
    if (!layout) return null;

    const compacted = compactLayout(layout);
    this.saveLayout(userId, compacted);
    return compacted;
  }

  /**
   * Validate layout
   */
  validateUserLayout(
    userId: string,
    gridCols: number = 12
  ): { valid: boolean; errors: string[] } {
    const layout = this.loadLayout(userId);
    if (!layout) {
      return { valid: false, errors: ['No layout found'] };
    }

    return validateLayout(layout, gridCols);
  }

  /**
   * Save user settings
   */
  saveSettings(userId: string, settings: DashboardSettings): void {
    this.settings.set(userId, settings);
    
    // In production, this would save to a database
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `dashboard-settings-${userId}`,
        JSON.stringify(settings)
      );
    }
  }

  /**
   * Load user settings
   */
  loadSettings(userId: string): DashboardSettings | null {
    // Try memory first
    const memorySettings = this.settings.get(userId);
    if (memorySettings) return memorySettings;

    // Try localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`dashboard-settings-${userId}`);
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          this.settings.set(userId, settings);
          return settings;
        } catch (error) {
          console.error('Failed to parse stored settings:', error);
        }
      }
    }

    return null;
  }

  /**
   * Update widget visibility
   */
  updateWidgetVisibility(
    userId: string,
    widgetId: string,
    visible: boolean
  ): DashboardSettings | null {
    const settings = this.loadSettings(userId);
    if (!settings) return null;

    const enabledWidgets = visible
      ? [...settings.enabledWidgets, widgetId]
      : settings.enabledWidgets.filter(id => id !== widgetId);

    const updatedSettings: DashboardSettings = {
      ...settings,
      enabledWidgets,
      lastUpdated: new Date()
    };

    this.saveSettings(userId, updatedSettings);
    return updatedSettings;
  }

  /**
   * Update widget refresh interval
   */
  updateWidgetRefreshInterval(
    userId: string,
    widgetId: string,
    interval: number
  ): DashboardSettings | null {
    const settings = this.loadSettings(userId);
    if (!settings) return null;

    const updatedSettings: DashboardSettings = {
      ...settings,
      refreshIntervals: {
        ...settings.refreshIntervals,
        [widgetId]: interval
      },
      lastUpdated: new Date()
    };

    this.saveSettings(userId, updatedSettings);
    return updatedSettings;
  }

  /**
   * Reset to default layout
   */
  resetToDefaultLayout(userId: string, userRole: UserRole): WidgetLayout[] {
    const layout = this.generateDefaultLayoutForUser(userId, userRole);
    return layout;
  }

  /**
   * Export dashboard configuration
   */
  exportDashboardConfig(userId: string): string {
    const layout = this.loadLayout(userId);
    const settings = this.loadSettings(userId);

    const config = {
      layout,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import dashboard configuration
   */
  importDashboardConfig(userId: string, configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);

      if (config.layout) {
        this.saveLayout(userId, config.layout);
      }

      if (config.settings) {
        this.saveSettings(userId, {
          ...config.settings,
          userId,
          lastUpdated: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import dashboard config:', error);
      return false;
    }
  }

  /**
   * Create layout preset
   */
  createLayoutPreset(
    preset: DashboardLayoutPreset
  ): void {
    if (typeof localStorage !== 'undefined') {
      const presets = this.loadLayoutPresets();
      presets.push(preset);
      localStorage.setItem('dashboard-presets', JSON.stringify(presets));
    }
  }

  /**
   * Load layout presets
   */
  loadLayoutPresets(): DashboardLayoutPreset[] {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('dashboard-presets');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse presets:', error);
        }
      }
    }
    return [];
  }

  /**
   * Apply layout preset
   */
  applyLayoutPreset(userId: string, presetId: string): boolean {
    const presets = this.loadLayoutPresets();
    const preset = presets.find(p => p.id === presetId);

    if (!preset) return false;

    this.saveLayout(userId, preset.layout);

    const settings = this.loadSettings(userId);
    if (settings) {
      this.saveSettings(userId, {
        ...settings,
        enabledWidgets: preset.enabledWidgets,
        lastUpdated: new Date()
      });
    }

    return true;
  }

  /**
   * Get widget statistics
   */
  getWidgetStatistics(userId: string): {
    totalWidgets: number;
    enabledWidgets: number;
    widgetsByCategory: Record<string, number>;
    averageRefreshInterval: number;
  } {
    const settings = this.loadSettings(userId);
    const allWidgets = this.getAllWidgets();

    const widgetsByCategory = allWidgets.reduce((acc, widget) => {
      acc[widget.category] = (acc[widget.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const refreshIntervals = Object.values(settings?.refreshIntervals || {});
    const averageRefreshInterval = refreshIntervals.length > 0
      ? refreshIntervals.reduce((sum, interval) => sum + interval, 0) / refreshIntervals.length
      : 0;

    return {
      totalWidgets: allWidgets.length,
      enabledWidgets: settings?.enabledWidgets.length || 0,
      widgetsByCategory,
      averageRefreshInterval
    };
  }

  /**
   * Clear all user data
   */
  clearUserData(userId: string): void {
    this.layouts.delete(userId);
    this.settings.delete(userId);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`dashboard-layout-${userId}`);
      localStorage.removeItem(`dashboard-settings-${userId}`);
    }
  }
}

// Export singleton instance
export const widgetManager = WidgetManager.getInstance();

export default widgetManager;
