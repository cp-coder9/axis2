import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Clock, 
  Users, 
  FolderOpen, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  FileText
} from 'lucide-react';

// Lazy load heavy dashboard widgets
const ProjectOverviewWidget = lazy(() => import('./widgets/ProjectOverviewWidget'));
const TimerAnalyticsWidget = lazy(() => import('./widgets/TimerAnalyticsWidget'));
const TeamPerformanceWidget = lazy(() => import('./widgets/TeamPerformanceWidget'));
const RecentActivityWidget = lazy(() => import('./widgets/RecentActivityWidget'));
const ProjectCalendarWidget = lazy(() => import('./widgets/ProjectCalendarWidget'));
const FileActivityWidget = lazy(() => import('./widgets/FileActivityWidget'));

// Loading skeleton for widgets
const WidgetSkeleton: React.FC<{ height?: string }> = ({ height = "h-96" }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className={`w-full ${height}`} />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

// Error boundary for widgets
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Widget failed to load</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Widget wrapper with lazy loading
const LazyWidget: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string;
}> = ({ children, fallback, height }) => (
  <WidgetErrorBoundary>
    <Suspense fallback={fallback || <WidgetSkeleton height={height} />}>
      {children}
    </Suspense>
  </WidgetErrorBoundary>
);

// Dashboard widget configuration
interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  category: 'overview' | 'analytics' | 'activity';
  minHeight?: string;
}

const widgetConfigs: DashboardWidget[] = [
  {
    id: 'project-overview',
    title: 'Project Overview',
    description: 'Current project status and progress',
    icon: FolderOpen,
    component: ProjectOverviewWidget,
    priority: 'high',
    category: 'overview',
    minHeight: 'h-80'
  },
  {
    id: 'timer-analytics',
    title: 'Timer Analytics',
    description: 'Time tracking insights and trends',
    icon: Clock,
    component: TimerAnalyticsWidget,
    priority: 'high',
    category: 'analytics',
    minHeight: 'h-96'
  },
  {
    id: 'team-performance',
    title: 'Team Performance',
    description: 'Team productivity metrics',
    icon: Users,
    component: TeamPerformanceWidget,
    priority: 'medium',
    category: 'analytics',
    minHeight: 'h-80'
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Latest updates and changes',
    icon: TrendingUp,
    component: RecentActivityWidget,
    priority: 'high',
    category: 'activity',
    minHeight: 'h-64'
  },
  {
    id: 'project-calendar',
    title: 'Project Calendar',
    description: 'Upcoming deadlines and milestones',
    icon: Calendar,
    component: ProjectCalendarWidget,
    priority: 'medium',
    category: 'overview',
    minHeight: 'h-80'
  },
  {
    id: 'file-activity',
    title: 'File Activity',
    description: 'Recent file uploads and changes',
    icon: FileText,
    component: FileActivityWidget,
    priority: 'low',
    category: 'activity',
    minHeight: 'h-64'
  }
];

interface DashboardWidgetsProps {
  userRole?: 'admin' | 'freelancer' | 'client';
  selectedWidgets?: string[];
  className?: string;
}

/**
 * Lazy-loaded Dashboard Widgets Container
 * 
 * Features:
 * - Lazy loading of heavy widgets for better performance
 * - Error boundaries to prevent widget failures from crashing the dashboard
 * - Tabbed organization by widget category
 * - Role-based widget filtering
 * - Priority-based loading order
 * - Responsive grid layout
 */
export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  userRole = 'admin',
  selectedWidgets,
  className = ''
}) => {
  // Filter widgets based on user role and selection
  const getAvailableWidgets = () => {
    let filtered = widgetConfigs;

    // Role-based filtering
    if (userRole === 'client') {
      filtered = filtered.filter(w => 
        ['project-overview', 'recent-activity', 'project-calendar'].includes(w.id)
      );
    } else if (userRole === 'freelancer') {
      filtered = filtered.filter(w => 
        w.id !== 'team-performance'
      );
    }

    // Selected widgets filtering
    if (selectedWidgets && selectedWidgets.length > 0) {
      filtered = filtered.filter(w => selectedWidgets.includes(w.id));
    }

    return filtered;
  };

  const availableWidgets = getAvailableWidgets();
  
  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  // Sort widgets by priority within each category
  Object.keys(widgetsByCategory).forEach(category => {
    widgetsByCategory[category].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  const renderWidget = (widget: DashboardWidget) => {
    const Component = widget.component;
    const Icon = widget.icon;

    return (
      <div key={widget.id} className="min-h-fit">
        <LazyWidget height={widget.minHeight}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {widget.title}
              </CardTitle>
              <CardDescription>{widget.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Component userRole={userRole} />
            </CardContent>
          </Card>
        </LazyWidget>
      </div>
    );
  };

  const renderCategoryGrid = (widgets: DashboardWidget[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {widgets.map(renderWidget)}
    </div>
  );

  if (Object.keys(widgetsByCategory).length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>No widgets available for your role</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {Object.keys(widgetsByCategory).includes('overview') && (
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Overview
            </TabsTrigger>
          )}
          {Object.keys(widgetsByCategory).includes('analytics') && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
          {Object.keys(widgetsByCategory).includes('activity') && (
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activity
            </TabsTrigger>
          )}
        </TabsList>

        {widgetsByCategory.overview && (
          <TabsContent value="overview" className="space-y-6">
            {renderCategoryGrid(widgetsByCategory.overview)}
          </TabsContent>
        )}

        {widgetsByCategory.analytics && (
          <TabsContent value="analytics" className="space-y-6">
            {renderCategoryGrid(widgetsByCategory.analytics)}
          </TabsContent>
        )}

        {widgetsByCategory.activity && (
          <TabsContent value="activity" className="space-y-6">
            {renderCategoryGrid(widgetsByCategory.activity)}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DashboardWidgets;
