import type { UserRole } from '../types';

/**
 * Dashboard Widget Configuration
 * Represents a configurable widget in the dashboard system
 */
export interface DashboardWidget {
  id: string;
  type: string;
  name: string;
  title: string;
  category: 'analytics' | 'projects' | 'time' | 'files' | 'team' | 'reports' | 'system';

  // Task 7.1: Enhanced widget properties
  description?: string; // Widget documentation and purpose

  // Size constraints for responsive layout
  minW?: number; // Minimum width in grid units
  maxW?: number; // Maximum width in grid units
  minH?: number; // Minimum height in grid units
  maxH?: number; // Maximum height in grid units

  // Default dimensions
  defaultW?: number;
  defaultH?: number;

  // Widget configuration
  config?: WidgetConfig;

  // Permission system
  permissions?: UserRole[];

  // Visibility and behavior
  isVisible?: boolean;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
  dataSource?: string; // Data source identifier

  // Metadata
  icon?: string;
  color?: string;
  tags?: string[];
}

/**
 * Widget Configuration
 * Stores widget-specific settings and preferences
 */
export interface WidgetConfig {
  // Display settings
  showHeader?: boolean;
  showFooter?: boolean;
  showBorder?: boolean;
  backgroundColor?: string;

  // Data settings
  dataLimit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterBy?: Record<string, any>;

  // Chart settings (for chart widgets)
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;

  // Custom settings
  customSettings?: Record<string, any>;
}

/**
 * Widget Layout
 * Defines the position and size of a widget in the grid
 */
export interface WidgetLayout {
  i: string; // Unique identifier for the widget (used by react-grid-layout)
  id: string;
  x: number; // Grid column position
  y: number; // Grid row position
  w: number; // Width in grid units
  h: number; // Height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  static?: boolean; // Cannot be moved or resized
}

/**
 * Dashboard Settings
 * User-specific dashboard configuration
 */
export interface DashboardSettings {
  userId: string;
  layout: WidgetLayout[];
  enabledWidgets: string[];
  refreshIntervals: Record<string, number>;
  autoRefresh: boolean;
  compactMode: boolean;
  lastUpdated: Date;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Widget Permission Configuration
 * Defines granular permissions for widget access
 */
export interface WidgetPermissions {
  roles: UserRole[]; // Roles that can view this widget
  users?: string[]; // Specific user IDs with access
  requiresFeature?: string; // Feature flag requirement
  customCheck?: (userId: string, userRole: UserRole) => boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowShare?: boolean;
  allowExport?: boolean;
}

/**
 * Widget Data Source
 * Defines how a widget fetches its data
 */
export interface WidgetDataSource {
  id: string;
  type: 'firestore' | 'api' | 'computed' | 'static';
  endpoint?: string;
  collection?: string;
  query?: any;
  transform?: (data: any) => any;
  cacheKey?: string;
  cacheDuration?: number;
}

/**
 * Widget Action
 * Defines actions that can be performed on a widget
 */
export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
  handler: (widgetId: string, config?: any) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Widget State
 * Runtime state of a widget
 */
export interface WidgetState {
  widgetId: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  data?: any;
  lastUpdated?: Date;
  lastRefreshed?: Date;
}

/**
 * Dashboard Layout Preset
 * Predefined dashboard layouts
 */
export interface DashboardLayoutPreset {
  id: string;
  name: string;
  description: string;
  layout: WidgetLayout[];
  enabledWidgets: string[];
  targetRole?: UserRole;
  isDefault?: boolean;
}

/**
 * Widget Registry Entry
 * Metadata for registering widgets in the system
 */
export interface WidgetRegistryEntry {
  widget: DashboardWidget;
  component: React.ComponentType<any>;
  previewComponent?: React.ComponentType<any>;
  configComponent?: React.ComponentType<any>;
}

/**
 * Widget Props
 * Standard props passed to widget components
 */
export interface WidgetProps {
  widgetId: string;
  onError?: (error: Error) => void;
  onRefresh?: () => void;
  isVisible?: boolean;
}

/**
 * Widget Error
 * Error information for widget failures
 */
export interface WidgetError {
  widgetId: string;
  error: Error;
  timestamp: Date;
  retryCount: number;
}
