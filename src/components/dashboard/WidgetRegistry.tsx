import React from 'react';
import { DashboardWidget, WidgetRegistryEntry } from '@/types/dashboard';
import { UserRole } from '@/types';
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Users, 
  TrendingUp, 
  Activity,
  Briefcase,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

/**
 * Widget Registry
 * Central registry for all dashboard widgets with their configurations
 * Task 7.1: Implements widget description, size constraints, and permissions
 */

// Default widget components (placeholders)
const DefaultWidgetComponent: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <div className="flex items-center justify-center h-full bg-muted rounded-lg">
    <div className="text-center">
      <p className="text-sm font-medium">{widget.title}</p>
      <p className="text-xs text-muted-foreground">{widget.type}</p>
    </div>
  </div>
);

/**
 * Widget Definitions
 * Task 7.1: Each widget includes description, size constraints, and permissions
 */
export const widgetDefinitions: DashboardWidget[] = [
  // Analytics Widgets
  {
    id: 'widget-active-projects',
    type: 'stat-card',
    name: 'Active Projects',
    title: 'Active Projects',
    category: 'analytics',
    description: 'Displays the count of currently active projects with trend indicators',
    minW: 2,
    maxW: 4,
    minH: 2,
    maxH: 3,
    defaultW: 3,
    defaultH: 2,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    isVisible: true,
    refreshInterval: 60000, // 1 minute
    dataSource: 'projects-active',
    icon: 'Briefcase',
    color: 'blue',
    config: {
      showHeader: true,
      showBorder: true,
      customSettings: {
        showTrend: true,
        showSparkline: true
      }
    }
  },
  {
    id: 'widget-total-hours',
    type: 'stat-card',
    name: 'Total Hours',
    title: 'Hours Tracked',
    category: 'time',
    description: 'Shows total hours tracked across all projects for the current period',
    minW: 2,
    maxW: 4,
    minH: 2,
    maxH: 3,
    defaultW: 3,
    defaultH: 2,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER],
    isVisible: true,
    refreshInterval: 30000, // 30 seconds
    dataSource: 'time-logs-total',
    icon: 'Clock',
    color: 'green',
    config: {
      showHeader: true,
      showBorder: true,
      customSettings: {
        showTrend: true,
        period: 'month'
      }
    }
  },
  {
    id: 'widget-team-members',
    type: 'stat-card',
    name: 'Team Members',
    title: 'Team Members',
    category: 'team',
    description: 'Displays the number of active team members and their availability status',
    minW: 2,
    maxW: 4,
    minH: 2,
    maxH: 3,
    defaultW: 3,
    defaultH: 2,
    permissions: [UserRole.ADMIN],
    isVisible: true,
    refreshInterval: 120000, // 2 minutes
    dataSource: 'users-active',
    icon: 'Users',
    color: 'purple',
    config: {
      showHeader: true,
      showBorder: true,
      customSettings: {
        showOnlineStatus: true
      }
    }
  },
  {
    id: 'widget-revenue',
    type: 'stat-card',
    name: 'Revenue',
    title: 'Total Revenue',
    category: 'analytics',
    description: 'Shows total revenue generated from completed projects and ongoing work',
    minW: 2,
    maxW: 4,
    minH: 2,
    maxH: 3,
    defaultW: 3,
    defaultH: 2,
    permissions: [UserRole.ADMIN],
    isVisible: true,
    refreshInterval: 300000, // 5 minutes
    dataSource: 'revenue-total',
    icon: 'DollarSign',
    color: 'emerald',
    config: {
      showHeader: true,
      showBorder: true,
      customSettings: {
        showTrend: true,
        currency: 'USD'
      }
    }
  },
  
  // Chart Widgets
  {
    id: 'widget-project-timeline',
    type: 'timeline-chart',
    name: 'Project Timeline',
    title: 'Project Timeline',
    category: 'projects',
    description: 'Visual timeline of project milestones and deadlines with progress tracking',
    minW: 4,
    maxW: 12,
    minH: 3,
    maxH: 6,
    defaultW: 6,
    defaultH: 4,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    isVisible: true,
    refreshInterval: 60000,
    dataSource: 'projects-timeline',
    icon: 'Activity',
    color: 'indigo',
    config: {
      showHeader: true,
      showBorder: true,
      chartType: 'line',
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      customSettings: {
        timeRange: '30d',
        groupBy: 'week'
      }
    }
  },
  {
    id: 'widget-time-distribution',
    type: 'pie-chart',
    name: 'Time Distribution',
    title: 'Time Distribution by Project',
    category: 'time',
    description: 'Pie chart showing how time is distributed across different projects',
    minW: 3,
    maxW: 6,
    minH: 3,
    maxH: 5,
    defaultW: 4,
    defaultH: 4,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER],
    isVisible: true,
    refreshInterval: 120000,
    dataSource: 'time-distribution',
    icon: 'BarChart3',
    color: 'orange',
    config: {
      showHeader: true,
      showBorder: true,
      chartType: 'pie',
      showLegend: true,
      showTooltip: true,
      customSettings: {
        showPercentages: true,
        minSlicePercentage: 5
      }
    }
  },
  {
    id: 'widget-performance-metrics',
    type: 'bar-chart',
    name: 'Performance Metrics',
    title: 'Team Performance Metrics',
    category: 'analytics',
    description: 'Bar chart displaying key performance indicators for team members',
    minW: 4,
    maxW: 12,
    minH: 3,
    maxH: 6,
    defaultW: 6,
    defaultH: 4,
    permissions: [UserRole.ADMIN],
    isVisible: true,
    refreshInterval: 180000,
    dataSource: 'performance-metrics',
    icon: 'TrendingUp',
    color: 'cyan',
    config: {
      showHeader: true,
      showBorder: true,
      chartType: 'bar',
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      customSettings: {
        metrics: ['productivity', 'quality', 'timeliness'],
        sortBy: 'productivity'
      }
    }
  },
  
  // List Widgets
  {
    id: 'widget-recent-activity',
    type: 'activity-list',
    name: 'Recent Activity',
    title: 'Recent Activity',
    category: 'system',
    description: 'List of recent system activities, updates, and notifications',
    minW: 3,
    maxW: 6,
    minH: 3,
    maxH: 8,
    defaultW: 4,
    defaultH: 5,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    isVisible: true,
    refreshInterval: 30000,
    dataSource: 'activity-recent',
    icon: 'Activity',
    color: 'slate',
    config: {
      showHeader: true,
      showBorder: true,
      dataLimit: 10,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      customSettings: {
        showTimestamps: true,
        showUserAvatars: true,
        groupByDate: true
      }
    }
  },
  {
    id: 'widget-upcoming-deadlines',
    type: 'deadline-list',
    name: 'Upcoming Deadlines',
    title: 'Upcoming Deadlines',
    category: 'projects',
    description: 'List of upcoming project deadlines and milestones with priority indicators',
    minW: 3,
    maxW: 6,
    minH: 3,
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    isVisible: true,
    refreshInterval: 60000,
    dataSource: 'deadlines-upcoming',
    icon: 'AlertCircle',
    color: 'red',
    config: {
      showHeader: true,
      showBorder: true,
      dataLimit: 8,
      sortBy: 'deadline',
      sortOrder: 'asc',
      customSettings: {
        showDaysRemaining: true,
        highlightUrgent: true,
        urgentThreshold: 3 // days
      }
    }
  },
  {
    id: 'widget-recent-files',
    type: 'file-list',
    name: 'Recent Files',
    title: 'Recent Files',
    category: 'files',
    description: 'List of recently uploaded or modified files with quick access',
    minW: 3,
    maxW: 6,
    minH: 3,
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT],
    isVisible: true,
    refreshInterval: 60000,
    dataSource: 'files-recent',
    icon: 'FileText',
    color: 'amber',
    config: {
      showHeader: true,
      showBorder: true,
      dataLimit: 10,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
      customSettings: {
        showThumbnails: true,
        showFileSize: true,
        showUploader: true
      }
    }
  },
  
  // Status Widgets
  {
    id: 'widget-project-status',
    type: 'status-grid',
    name: 'Project Status',
    title: 'Project Status Overview',
    category: 'projects',
    description: 'Grid view of all projects with their current status and progress',
    minW: 4,
    maxW: 12,
    minH: 3,
    maxH: 8,
    defaultW: 6,
    defaultH: 5,
    permissions: [UserRole.ADMIN, UserRole.FREELANCER],
    isVisible: true,
    refreshInterval: 60000,
    dataSource: 'projects-status',
    icon: 'CheckCircle',
    color: 'teal',
    config: {
      showHeader: true,
      showBorder: true,
      customSettings: {
        viewMode: 'grid',
        showProgress: true,
        showTeam: true,
        filterByStatus: []
      }
    }
  }
];

/**
 * Widget Registry Map
 * Maps widget IDs to their full registry entries
 */
export const widgetRegistry: Map<string, WidgetRegistryEntry> = new Map(
  widgetDefinitions.map(widget => [
    widget.id,
    {
      widget,
      component: DefaultWidgetComponent,
      previewComponent: DefaultWidgetComponent,
      configComponent: undefined
    }
  ])
);

/**
 * Get widgets by role
 * Filters widgets based on user role permissions
 */
export function getWidgetsByRole(role: UserRole): DashboardWidget[] {
  return widgetDefinitions.filter(widget => 
    !widget.permissions || widget.permissions.includes(role)
  );
}

/**
 * Get widgets by category
 * Filters widgets by their category
 */
export function getWidgetsByCategory(category: DashboardWidget['category']): DashboardWidget[] {
  return widgetDefinitions.filter(widget => widget.category === category);
}

/**
 * Get widget by ID
 * Retrieves a specific widget by its ID
 */
export function getWidgetById(id: string): DashboardWidget | undefined {
  return widgetDefinitions.find(widget => widget.id === id);
}

/**
 * Validate widget size constraints
 * Ensures widget dimensions are within allowed bounds
 */
export function validateWidgetSize(
  widget: DashboardWidget,
  width: number,
  height: number
): { valid: boolean; adjustedWidth: number; adjustedHeight: number } {
  const minW = widget.minW || 1;
  const maxW = widget.maxW || 12;
  const minH = widget.minH || 1;
  const maxH = widget.maxH || 8;
  
  const adjustedWidth = Math.max(minW, Math.min(maxW, width));
  const adjustedHeight = Math.max(minH, Math.min(maxH, height));
  
  return {
    valid: adjustedWidth === width && adjustedHeight === height,
    adjustedWidth,
    adjustedHeight
  };
}

/**
 * Check widget permission
 * Verifies if a user has permission to access a widget
 */
export function checkWidgetPermission(
  widget: DashboardWidget,
  userRole: UserRole,
  userId?: string
): boolean {
  // If no permissions specified, widget is accessible to all
  if (!widget.permissions || widget.permissions.length === 0) {
    return true;
  }
  
  // Check role-based permissions
  return widget.permissions.includes(userRole);
}

/**
 * Get default layout for role
 * Returns a default widget layout based on user role
 */
export function getDefaultLayoutForRole(role: UserRole): DashboardWidget[] {
  const widgets = getWidgetsByRole(role);
  
  // Return a curated set of widgets based on role
  switch (role) {
    case UserRole.ADMIN:
      return widgets.filter(w => 
        ['widget-active-projects', 'widget-total-hours', 'widget-team-members', 
         'widget-revenue', 'widget-project-timeline', 'widget-performance-metrics',
         'widget-recent-activity', 'widget-project-status'].includes(w.id)
      );
    
    case UserRole.FREELANCER:
      return widgets.filter(w => 
        ['widget-active-projects', 'widget-total-hours', 'widget-time-distribution',
         'widget-recent-activity', 'widget-upcoming-deadlines', 'widget-recent-files'].includes(w.id)
      );
    
    case UserRole.CLIENT:
      return widgets.filter(w => 
        ['widget-active-projects', 'widget-project-timeline', 'widget-recent-activity',
         'widget-upcoming-deadlines', 'widget-recent-files'].includes(w.id)
      );
    
    default:
      return [];
  }
}

export default widgetRegistry;
