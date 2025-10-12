import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Files, 
  Grid3X3, 
  Palette, 
  Activity,
  TrendingUp
} from 'lucide-react';

// Import all the enhanced components that use previously unused utilities
import { EnhancedAnalyticsDashboard } from '@/components/analytics/EnhancedAnalyticsDashboard';
import { EnhancedFileManager } from '@/components/files/EnhancedFileManager';
import { EnhancedDashboardGrid } from '@/components/dashboard/EnhancedDashboardGrid';
import { ThemeSystemIntegration } from '@/components/theme/ThemeSystemIntegration';
import { useAppContext } from '@/contexts/AppContext';
import { WidgetLayout, DashboardWidget } from '@/types/dashboard';
import { UserRole } from '@/types';

/**
 * Enhanced Dashboard that integrates all previously unused utilities:
 * - Analytics Engine with Export Helpers
 * - File Audit Logger with Access Control
 * - Grid Layout System with Performance Monitoring
 * - Theme System Testing and Validation
 */
export function EnhancedDashboard() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('analytics');
  const [dashboardStats, setDashboardStats] = useState({
    totalWidgets: 0,
    activeFeatures: 0,
    performanceScore: 0
  });

  // Mock dashboard widgets for grid system
  const [widgets] = useState<DashboardWidget[]>([
    {
      id: 'analytics-overview',
      name: 'analytics-overview',
      title: 'Analytics Overview',
      description: 'Key performance indicators',
      type: 'analytics',
      category: 'analytics',
      defaultW: 6,
      defaultH: 4,
      minW: 4,
      minH: 3,
      maxW: 12,
      maxH: 6,
      permissions: [UserRole.ADMIN, UserRole.FREELANCER]
    },
    {
      id: 'project-timeline',
      name: 'project-timeline',
      title: 'Project Timeline',
      description: 'Current project progress',
      type: 'timeline',
      category: 'projects',
      defaultW: 6,
      defaultH: 4,
      minW: 4,
      minH: 3,
      maxW: 12,
      maxH: 8,
      permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT]
    },
    {
      id: 'team-performance',
      name: 'team-performance',
      title: 'Team Performance',
      description: 'Resource utilization metrics',
      type: 'metrics',
      category: 'analytics',
      defaultW: 4,
      defaultH: 3,
      minW: 3,
      minH: 2,
      maxW: 8,
      maxH: 6,
      permissions: [UserRole.ADMIN]
    },
    {
      id: 'recent-files',
      name: 'recent-files',
      title: 'Recent Files',
      description: 'Latest uploaded documents',
      type: 'files',
      category: 'files',
      defaultW: 4,
      defaultH: 3,
      minW: 3,
      minH: 2,
      maxW: 8,
      maxH: 6,
      permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT]
    },
    {
      id: 'notifications',
      name: 'notifications',
      title: 'Notifications',
      description: 'System alerts and updates',
      type: 'notifications',
      category: 'system',
      defaultW: 4,
      defaultH: 3,
      minW: 3,
      minH: 2,
      maxW: 6,
      maxH: 4,
      permissions: [UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT]
    },
    {
      id: 'quick-actions',
      name: 'quick-actions',
      title: 'Quick Actions',
      description: 'Frequently used tools',
      type: 'actions',
      category: 'system',
      defaultW: 4,
      defaultH: 2,
      minW: 3,
      minH: 2,
      maxW: 6,
      maxH: 3,
      permissions: [UserRole.ADMIN, UserRole.FREELANCER]
    }
  ]);

  // Default widget layout
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout[]>([
    { id: 'analytics-overview', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6, isDraggable: true, isResizable: true },
    { id: 'project-timeline', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 8, isDraggable: true, isResizable: true },
    { id: 'team-performance', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2, maxW: 8, maxH: 6, isDraggable: true, isResizable: true },
    { id: 'recent-files', x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 2, maxW: 8, maxH: 6, isDraggable: true, isResizable: true },
    { id: 'notifications', x: 8, y: 4, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 4, isDraggable: true, isResizable: true },
    { id: 'quick-actions', x: 0, y: 7, w: 4, h: 2, minW: 3, minH: 2, maxW: 6, maxH: 3, isDraggable: true, isResizable: true }
  ]);

  // Update dashboard stats
  useEffect(() => {
    setDashboardStats({
      totalWidgets: widgets.length,
      activeFeatures: 4, // Analytics, Files, Grid, Theme
      performanceScore: 95 // Mock performance score
    });
  }, [widgets]);

  const handleLayoutChange = (newLayout: WidgetLayout[]) => {
    setWidgetLayout(newLayout);
    // In a real app, this would save to user preferences
    console.log('Layout updated:', newLayout);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'files': return <Files className="h-4 w-4" />;
      case 'grid': return <Grid3X3 className="h-4 w-4" />;
      case 'theme': return <Palette className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive system utilizing all advanced features and utilities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{dashboardStats.totalWidgets}</div>
              <div className="text-xs text-muted-foreground">Widgets</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboardStats.activeFeatures}</div>
              <div className="text-xs text-muted-foreground">Features</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.performanceScore}%</div>
              <div className="text-xs text-muted-foreground">Performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('analytics')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <Badge variant={activeTab === 'analytics' ? 'default' : 'outline'}>
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Business Intelligence</CardTitle>
            <CardDescription className="text-sm">
              Advanced analytics with export capabilities
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('files')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Files className="h-5 w-5 text-green-600" />
              <Badge variant={activeTab === 'files' ? 'default' : 'outline'}>
                Secure
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">File Management</CardTitle>
            <CardDescription className="text-sm">
              Audit logging and access control
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('grid')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Grid3X3 className="h-5 w-5 text-purple-600" />
              <Badge variant={activeTab === 'grid' ? 'default' : 'outline'}>
                Interactive
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Dashboard Grid</CardTitle>
            <CardDescription className="text-sm">
              Drag-and-drop with performance monitoring
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('theme')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Palette className="h-5 w-5 text-orange-600" />
              <Badge variant={activeTab === 'theme' ? 'default' : 'outline'}>
                Validated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-base">Theme System</CardTitle>
            <CardDescription className="text-sm">
              Comprehensive testing and validation
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            {getTabIcon('analytics')}
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            {getTabIcon('files')}
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            {getTabIcon('grid')}
            <span className="hidden sm:inline">Grid</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            {getTabIcon('theme')}
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Intelligence Dashboard
              </CardTitle>
              <CardDescription>
                Utilizing previously unused analyticsEngine and exportHelpers utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Files className="h-5 w-5" />
                Enhanced File Management
              </CardTitle>
              <CardDescription>
                Integrating fileAuditLogger and fileAccessControl utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedFileManager projectId="demo-project" showAuditLog={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Interactive Dashboard Grid
              </CardTitle>
              <CardDescription>
                Using GridLayoutSystem and performance monitoring utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedDashboardGrid
                widgets={widgets}
                layout={widgetLayout}
                onLayoutChange={handleLayoutChange}
                userRole={user?.role || 'Admin'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme System Integration
              </CardTitle>
              <CardDescription>
                Comprehensive theme testing using ThemeSwitchingTester utility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSystemIntegration />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>✅ Analytics Engine: Active</span>
              <span>✅ File Audit Logger: Monitoring</span>
              <span>✅ Grid Layout System: Optimized</span>
              <span>✅ Theme System: Validated</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>All systems operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedDashboard;