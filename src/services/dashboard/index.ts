/**
 * Dashboard Services Index
 * Central export point for all dashboard-related services
 */

// Widget Management
export {
  validateWidgetSize,
  checkWidgetPermission,
  checkWidgetAction,
  createWidget,
  updateWidgetConfig,
  updateWidgetPermissions,
  updateWidgetSizeConstraints,
  getWidget,
  getUserWidgets,
  deleteWidget,
  cloneWidget,
  configureWidgetDragDrop,
  exportWidgetConfig,
  importWidgetConfig
} from '../dashboardWidgetService';

export type {
  WidgetConfig,
  WidgetPermissions,
  EnhancedDashboardWidget,
  WidgetDragDropConfig
} from '../dashboardWidgetService';

// Layout Management
export {
  saveDashboardLayout,
  loadDashboardLayout,
  updateWidgetPosition,
  updateWidgetSize,
  addWidgetToLayout,
  removeWidgetFromLayout,
  resetToDefaultLayout,
  getDefaultTemplateForRole,
  getAllTemplates,
  applyTemplate,
  createCustomTemplate,
  getUserTemplates,
  exportDashboardLayout,
  importDashboardLayout,
  optimizeLayout,
  validateLayout
} from '../dashboardLayoutService';

export type {
  DashboardLayout,
  DashboardTemplate
} from '../dashboardLayoutService';

// Analytics
export {
  startDashboardSession,
  endDashboardSession,
  trackWidgetInteraction,
  trackWidgetPerformance,
  getDashboardAnalytics,
  generateOptimizationSuggestions,
  exportAnalyticsReport,
  getWidgetAnalytics
} from '../dashboardAnalyticsService';

export type {
  DashboardUsageMetrics,
  WidgetInteraction,
  WidgetPerformanceMetrics,
  DashboardAnalytics,
  OptimizationSuggestion
} from '../dashboardAnalyticsService';

// Sharing
export {
  shareDashboardWithUsers,
  createPublicShareLink,
  getSharedDashboard,
  getDashboardByShareToken,
  updateSharedDashboard,
  restoreDashboardVersion,
  removeUserFromSharedDashboard,
  revokePublicShareLink,
  getSharedWithMeDashboards,
  getMySharedDashboards,
  copySharedDashboard,
  getUserPermissions,
  exportSharedDashboard
} from '../dashboardSharingService';

export type {
  SharedDashboard,
  SharedUser,
  DashboardVersion,
  SharePermissions
} from '../dashboardSharingService';
