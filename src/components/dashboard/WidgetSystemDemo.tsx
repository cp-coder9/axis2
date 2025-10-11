import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Play, 
  CheckCircle, 
  Info,
  Settings,
  Layout,
  Shield
} from 'lucide-react';
import { DashboardWidget, WidgetLayout, DashboardSettings } from '@/types/dashboard';
import { UserRole } from '@/types';
import { widgetManager } from '@/utils/WidgetManager';
import { widgetDefinitions } from './WidgetRegistry';
import { EnhancedDashboardGrid } from './EnhancedDashboardGrid';
import { DashboardCustomization } from './DashboardCustomization';

/**
 * Widget System Demo
 * Task 7.1: Demonstrates the complete widget system implementation
 * Shows widget description, size constraints, permissions, and drag-and-drop
 */

export function WidgetSystemDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [demoRole, setDemoRole] = useState<UserRole>(UserRole.ADMIN);
  const [demoLayout, setDemoLayout] = useState<WidgetLayout[]>([]);
  const [demoSettings, setDemoSettings] = useState<DashboardSettings>({
    userId: 'demo-user',
    layout: [],
    enabledWidgets: [],
    refreshIntervals: {},
    autoRefresh: true,
    compactMode: false,
    lastUpdated: new Date()
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize demo data
  useEffect(() => {
    // Register all widgets
    widgetDefinitions.forEach(widget => {
      widgetManager.registerWidget(widget);
    });

    // Generate default layout
    const layout = widgetManager.generateDefaultLayoutForUser('demo-user', demoRole);
    setDemoLayout(layout);

    // Set initial settings
    const enabledWidgets = layout.map(l => l.id);
    setDemoSettings(prev => ({
      ...prev,
      layout,
      enabledWidgets
    }));
  }, [demoRole]);

  // Handle layout change
  const handleLayoutChange = (newLayout: WidgetLayout[]) => {
    setDemoLayout(newLayout);
    widgetManager.saveLayout('demo-user', newLayout);
  };

  // Handle settings change
  const handleSettingsChange = (newSettings: Partial<DashboardSettings>) => {
    const updated = { ...demoSettings, ...newSettings, lastUpdated: new Date() };
    setDemoSettings(updated);
    widgetManager.saveSettings('demo-user', updated);
  };

  // Handle widget visibility change
  const handleWidgetVisibilityChange = (widgetId: string, visible: boolean) => {
    const updatedSettings = widgetManager.updateWidgetVisibility('demo-user', widgetId, visible);
    if (updatedSettings) {
      setDemoSettings(updatedSettings);
    }
  };

  // Get available widgets for current role
  const availableWidgets = widgetManager.getWidgetsByRole(demoRole);

  // Get statistics
  const stats = widgetManager.getWidgetStatistics('demo-user');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Widget System Demo
              </CardTitle>
              <CardDescription>
                Task 7.1: Widget enhancements with description, size constraints, permissions, and drag-and-drop
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Implemented
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Demo Role:</span>
              <div className="flex gap-1">
                {[UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT].map(role => (
                  <Button
                    key={role}
                    variant={demoRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDemoRole(role)}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Edit Mode:</span>
              <Button
                variant={isEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="code">Code Examples</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementation Summary</CardTitle>
              <CardDescription>Task 7.1 - Dashboard Widget Enhancements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Widget Description Support
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Each widget now includes a description property that documents its purpose and functionality.
                    Descriptions are displayed in tooltips and configuration panels.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Size Constraints
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Widgets support minW, maxW, minH, and maxH properties to define size boundaries.
                    The system automatically validates and adjusts widget dimensions.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permission System
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Role-based permissions control widget visibility. Widgets can be restricted to specific
                    user roles (Admin, Freelancer, Client).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Drag-and-Drop
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Full drag-and-drop support with collision detection, automatic layout compaction,
                    and resize handles. Enable edit mode to try it out.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Key Features Implemented</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Widget description and configuration support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Size constraints (minW, maxW, minH, maxH) with validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Role-based permission system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Drag-and-drop functionality with collision detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Widget configuration management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Layout persistence and presets</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgetDefinitions.slice(0, 6).map(widget => (
              <Card key={widget.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                  <CardDescription className="text-xs">{widget.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{widget.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Size Range:</span>
                      <span className="text-muted-foreground">
                        {widget.minW || 1}×{widget.minH || 1} to {widget.maxW || 12}×{widget.maxH || 8}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Permissions:</span>
                      <div className="flex gap-1">
                        {widget.permissions?.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {widget.refreshInterval && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Refresh:</span>
                        <span className="text-muted-foreground">
                          {widget.refreshInterval / 1000}s
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Demo Tab */}
        <TabsContent value="demo" className="space-y-4">
          {isEditMode && (
            <DashboardCustomization
              widgets={availableWidgets}
              layout={demoLayout}
              settings={demoSettings}
              onLayoutChange={handleLayoutChange}
              onSettingsChange={handleSettingsChange}
              onWidgetVisibilityChange={handleWidgetVisibilityChange}
              userRole={demoRole}
            />
          )}

          <EnhancedDashboardGrid
            widgets={availableWidgets}
            layout={demoLayout}
            onLayoutChange={handleLayoutChange}
            isEditMode={isEditMode}
            userRole={demoRole}
          />
        </TabsContent>

        {/* Code Examples Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />
                Usage Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Define a Widget with Constraints</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`const widget: DashboardWidget = {
  id: 'widget-example',
  type: 'stat-card',
  name: 'Example Widget',
  title: 'Example Widget',
  category: 'analytics',
  description: 'This widget demonstrates size constraints and permissions',
  minW: 2,  // Minimum 2 grid units wide
  maxW: 6,  // Maximum 6 grid units wide
  minH: 2,  // Minimum 2 grid units tall
  maxH: 4,  // Maximum 4 grid units tall
  permissions: [UserRole.ADMIN, UserRole.FREELANCER],
  config: {
    showHeader: true,
    customSettings: { theme: 'blue' }
  }
};`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Use Widget Manager</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { widgetManager } from '@/utils/WidgetManager';

// Register widget
widgetManager.registerWidget(widget);

// Get widgets by role
const widgets = widgetManager.getWidgetsByRole(UserRole.ADMIN);

// Validate size
const validation = widgetManager.validateSize('widget-id', 4, 3);

// Save layout
widgetManager.saveLayout('user-id', layout);`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Implement Drag-and-Drop</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<EnhancedDashboardGrid
  widgets={widgets}
  layout={layout}
  onLayoutChange={handleLayoutChange}
  isEditMode={true}
  userRole={UserRole.ADMIN}
/>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Widgets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalWidgets}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.enabledWidgets}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Available for Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{availableWidgets.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Object.keys(stats.widgetsByCategory).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Widgets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.widgetsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WidgetSystemDemo;
