/**
 * Dashboard Enhancement System - Integration Example
 * 
 * This example demonstrates how to integrate all dashboard enhancement features
 * into a complete dashboard page.
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, Share2, Layout } from 'lucide-react';

// Import dashboard components
import { DashboardCustomization } from '@/components/dashboard/DashboardCustomization';
import { WidgetConfigurationPanel } from '@/components/dashboard/WidgetConfigurationPanel';
import { DashboardAnalyticsPanel } from '@/components/dashboard/DashboardAnalyticsPanel';
import { DashboardSharingPanel } from '@/components/dashboard/DashboardSharingPanel';

// Import dashboard services
import {
  loadDashboardLayout,
  saveDashboardLayout,
  applyTemplate,
  startDashboardSession,
  trackWidgetInteraction
} from '@/services/dashboard';

// Import types
import { DashboardWidget, WidgetLayout, DashboardSettings } from '@/types/dashboard';
import { UserRole } from '@/types';

interface DashboardEnhancementExampleProps {
  userId: string;
  userName: string;
  userRole: UserRole;
}

export const DashboardEnhancementExample: React.FC<DashboardEnhancementExampleProps> = ({
  userId,
  userName,
  userRole
}) => {
  // State management
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize dashboard
  useEffect(() => {
    initializeDashboard();
  }, [userId]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Start analytics session
      const session = await startDashboardSession(userId, getDeviceType());
      setSessionId(session);

      // Load user's dashboard layout
      const dashboardLayout = await loadDashboardLayout(userId);

      if (dashboardLayout) {
        // User has existing layout
        setLayout(dashboardLayout.widgets);
        setSettings(dashboardLayout.settings);
      } else {
        // Apply default template for user's role
        await applyTemplate(userId, getDefaultTemplateId(userRole));
        
        // Reload layout
        const newLayout = await loadDashboardLayout(userId);
        if (newLayout) {
          setLayout(newLayout.widgets);
          setSettings(newLayout.settings);
        }
      }

      // Load available widgets (in real app, this would come from a service)
      setWidgets(getAvailableWidgets(userRole));
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle layout changes
  const handleLayoutChange = async (newLayout: WidgetLayout[]) => {
    setLayout(newLayout);
    
    if (settings) {
      await saveDashboardLayout(userId, newLayout, settings);
    }

    // Track layout change
    if (sessionId) {
      await trackWidgetInteraction(sessionId, {
        widgetId: 'layout',
        widgetTitle: 'Dashboard Layout',
        interactionType: 'move'
      });
    }
  };

  // Handle settings changes
  const handleSettingsChange = async (newSettings: Partial<DashboardSettings>) => {
    if (settings) {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await saveDashboardLayout(userId, layout, updatedSettings);
    }
  };

  // Handle widget visibility changes
  const handleWidgetVisibilityChange = async (widgetId: string, visible: boolean) => {
    if (settings) {
      const enabledWidgets = visible
        ? [...settings.enabledWidgets, widgetId]
        : settings.enabledWidgets.filter(id => id !== widgetId);

      await handleSettingsChange({ enabledWidgets });
    }

    // Track visibility change
    if (sessionId) {
      await trackWidgetInteraction(sessionId, {
        widgetId,
        widgetTitle: widgets.find(w => w.id === widgetId)?.title || 'Unknown',
        interactionType: visible ? 'view' : 'configure'
      });
    }
  };

  // Handle widget configuration
  const handleWidgetSave = async (widget: DashboardWidget) => {
    // Update widget in list
    setWidgets(prev => prev.map(w => w.id === widget.id ? widget : w));
    setSelectedWidget(null);

    // Track configuration change
    if (sessionId) {
      await trackWidgetInteraction(sessionId, {
        widgetId: widget.id,
        widgetTitle: widget.title,
        interactionType: 'configure'
      });
    }
  };

  // Helper functions
  const getDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const getDefaultTemplateId = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'admin-default';
      case UserRole.FREELANCER:
        return 'freelancer-default';
      case UserRole.CLIENT:
        return 'client-default';
      default:
        return 'admin-default';
    }
  };

  const getAvailableWidgets = (role: UserRole): DashboardWidget[] => {
    // In real app, this would come from a service
    // This is just example data
    return [
      {
        id: 'analytics-overview',
        title: 'Analytics Overview',
        type: 'analytics',
        component: React.lazy(() => import('@/components/dashboard/widgets/AnalyticsWidget')),
        permissions: [UserRole.ADMIN],
        description: 'Real-time analytics and metrics',
        category: 'analytics',
        minW: 4,
        maxW: 12,
        minH: 3,
        maxH: 6
      },
      {
        id: 'project-timeline',
        title: 'Project Timeline',
        type: 'timeline',
        component: React.lazy(() => import('@/components/dashboard/widgets/TimelineWidget')),
        permissions: [UserRole.ADMIN, UserRole.FREELANCER],
        description: 'Project progress timeline',
        category: 'projects',
        minW: 6,
        maxW: 12,
        minH: 4,
        maxH: 8
      },
      {
        id: 'time-tracker',
        title: 'Time Tracker',
        type: 'timer',
        component: React.lazy(() => import('@/components/dashboard/widgets/TimerWidget')),
        permissions: [UserRole.FREELANCER],
        description: 'Track time on projects',
        category: 'system',
        minW: 4,
        maxW: 8,
        minH: 3,
        maxH: 6
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => initializeDashboard()}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <Layout className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="customize">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="sharing">
            <Share2 className="h-4 w-4 mr-2" />
            Sharing
          </TabsTrigger>
        </TabsList>

        {/* Main Dashboard View */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {layout
              .filter(widget => settings?.enabledWidgets.includes(widget.id))
              .map(widget => {
                const widgetDef = widgets.find(w => w.id === widget.id);
                if (!widgetDef) return null;

                return (
                  <div
                    key={widget.id}
                    className="col-span-12 md:col-span-6 lg:col-span-4"
                    style={{
                      gridColumn: `span ${widget.w}`,
                      gridRow: `span ${widget.h}`
                    }}
                  >
                    {/* Widget content would go here */}
                    <div className="border rounded-lg p-4 h-full">
                      <h3 className="font-semibold mb-2">{widgetDef.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {widgetDef.description}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>

        {/* Customization Tab */}
        <TabsContent value="customize" className="space-y-4">
          {settings && (
            <DashboardCustomization
              widgets={widgets}
              layout={layout}
              settings={settings}
              onLayoutChange={handleLayoutChange}
              onSettingsChange={handleSettingsChange}
              onWidgetVisibilityChange={handleWidgetVisibilityChange}
              userRole={userRole}
            />
          )}

          {selectedWidget && (
            <WidgetConfigurationPanel
              widget={selectedWidget}
              onSave={handleWidgetSave}
              onCancel={() => setSelectedWidget(null)}
              userRole={userRole}
            />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <DashboardAnalyticsPanel
            userId={userId}
            currentLayout={layout}
          />
        </TabsContent>

        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-4">
          <DashboardSharingPanel
            dashboardId={`dashboard_${userId}`}
            userId={userId}
            userName={userName}
            isOwner={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardEnhancementExample;
