/**
 * Dashboard Analytics Demo
 * 
 * Demonstrates the complete dashboard analytics system including:
 * - Dashboard usage analytics
 * - Widget performance metrics
 * - Dashboard interaction tracking
 * - Dashboard optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardAnalyticsPanel } from '@/components/dashboard/DashboardAnalyticsPanel';
import {
  startDashboardSession,
  endDashboardSession,
  trackWidgetInteraction,
  trackWidgetPerformance,
  getDashboardAnalytics,
  generateOptimizationSuggestions,
  getWidgetAnalytics
} from '@/services/dashboardAnalyticsService';
import {
  calculateDashboardHealthScore,
  identifyProblematicWidgets,
  generatePlacementRecommendations,
  formatAnalyticsForChart,
  generateAnalyticsSummary,
  exportAnalyticsToCSV
} from '@/utils/DashboardAnalytics';
import { WidgetLayout } from '@/types/dashboard';
import { BarChart, Activity, TrendingUp, Download, RefreshCw } from 'lucide-react';

interface DashboardAnalyticsDemoProps {
  userId: string;
}

export const DashboardAnalyticsDemo: React.FC<DashboardAnalyticsDemoProps> = ({ userId }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Mock layout for demo
  const mockLayout: WidgetLayout[] = [
    { i: 'widget-1', x: 0, y: 0, w: 6, h: 4 },
    { i: 'widget-2', x: 6, y: 0, w: 6, h: 4 },
    { i: 'widget-3', x: 0, y: 4, w: 4, h: 3 },
    { i: 'widget-4', x: 4, y: 4, w: 8, h: 3 }
  ];

  // Start analytics session
  const handleStartSession = async () => {
    try {
      const session = await startDashboardSession(userId, 'desktop');
      setSessionId(session);
      setIsSessionActive(true);
      console.log('Analytics session started:', session);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // End analytics session
  const handleEndSession = async () => {
    if (!sessionId) return;
    
    try {
      await endDashboardSession(sessionId);
      setIsSessionActive(false);
      console.log('Analytics session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Simulate widget interaction
  const handleSimulateInteraction = async (widgetId: string, type: string) => {
    if (!sessionId) {
      alert('Please start a session first');
      return;
    }

    try {
      await trackWidgetInteraction(sessionId, {
        widgetId,
        widgetTitle: `Widget ${widgetId}`,
        interactionType: type as any,
        duration: Math.random() * 1000
      });
      console.log(`Tracked ${type} interaction for ${widgetId}`);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  // Simulate widget performance tracking
  const handleSimulatePerformance = async (widgetId: string) => {
    try {
      await trackWidgetPerformance(widgetId, `Widget ${widgetId}`, {
        loadTime: Math.random() * 3000,
        renderTime: Math.random() * 500,
        hasError: Math.random() > 0.9
      });
      console.log(`Tracked performance for ${widgetId}`);
    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  };

  // Load analytics data
  const handleLoadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardAnalytics(userId, 'week');
      setAnalytics(data);
      
      const score = calculateDashboardHealthScore(data);
      setHealthScore(score);
      
      console.log('Analytics loaded:', data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and display optimization suggestions
  const handleGenerateSuggestions = () => {
    if (!analytics) {
      alert('Please load analytics first');
      return;
    }

    const suggestions = generateOptimizationSuggestions(analytics, mockLayout);
    console.log('Optimization suggestions:', suggestions);
    alert(`Generated ${suggestions.length} optimization suggestions. Check console for details.`);
  };

  // Export analytics report
  const handleExportCSV = () => {
    if (!analytics) {
      alert('Please load analytics first');
      return;
    }

    const csv = exportAnalyticsToCSV(analytics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-analytics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate summary report
  const handleGenerateSummary = () => {
    if (!analytics) {
      alert('Please load analytics first');
      return;
    }

    const summary = generateAnalyticsSummary(analytics);
    console.log('Analytics Summary:\n', summary);
    alert('Summary generated. Check console for details.');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Analytics Demo</h1>
          <p className="text-muted-foreground">
            Test and explore the dashboard analytics system
          </p>
        </div>
        <Badge variant={isSessionActive ? 'default' : 'secondary'}>
          {isSessionActive ? 'Session Active' : 'No Active Session'}
        </Badge>
      </div>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Panel</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Start and stop analytics tracking sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleStartSession} 
                  disabled={isSessionActive}
                  className="flex-1"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
                <Button 
                  onClick={handleEndSession} 
                  disabled={!isSessionActive}
                  variant="outline"
                  className="flex-1"
                >
                  End Session
                </Button>
              </div>
              {sessionId && (
                <p className="text-sm text-muted-foreground">
                  Session ID: {sessionId}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simulate Widget Interactions</CardTitle>
              <CardDescription>Generate test interaction data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleSimulateInteraction('widget-1', 'view')}
                  variant="outline"
                  size="sm"
                >
                  View Widget 1
                </Button>
                <Button 
                  onClick={() => handleSimulateInteraction('widget-1', 'click')}
                  variant="outline"
                  size="sm"
                >
                  Click Widget 1
                </Button>
                <Button 
                  onClick={() => handleSimulateInteraction('widget-2', 'refresh')}
                  variant="outline"
                  size="sm"
                >
                  Refresh Widget 2
                </Button>
                <Button 
                  onClick={() => handleSimulateInteraction('widget-3', 'configure')}
                  variant="outline"
                  size="sm"
                >
                  Configure Widget 3
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simulate Widget Performance</CardTitle>
              <CardDescription>Generate test performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['widget-1', 'widget-2', 'widget-3', 'widget-4'].map((widgetId) => (
                  <Button
                    key={widgetId}
                    onClick={() => handleSimulatePerformance(widgetId)}
                    variant="outline"
                    size="sm"
                  >
                    Track {widgetId}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics Actions</CardTitle>
              <CardDescription>Load and analyze dashboard data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleLoadAnalytics}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Load Analytics
                </Button>
                <Button 
                  onClick={handleGenerateSuggestions}
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Get Suggestions
                </Button>
                <Button 
                  onClick={handleExportCSV}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  onClick={handleGenerateSummary}
                  variant="outline"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Panel Tab */}
        <TabsContent value="analytics">
          <DashboardAnalyticsPanel userId={userId} currentLayout={mockLayout} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {analytics ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Health Score</CardTitle>
                  <CardDescription>Overall dashboard performance rating</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-6xl font-bold">{healthScore}</div>
                    <div className="flex-1">
                      <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            healthScore >= 80 ? 'bg-green-500' :
                            healthScore >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {healthScore >= 80 ? 'Excellent' :
                         healthScore >= 60 ? 'Good' :
                         healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Problematic Widgets</CardTitle>
                  <CardDescription>Widgets that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {identifyProblematicWidgets(analytics).length > 0 ? (
                    <div className="space-y-2">
                      {identifyProblematicWidgets(analytics).map((widget) => (
                        <div key={widget.widgetId} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{widget.widgetTitle}</h4>
                          <div className="flex gap-2 mt-2">
                            {widget.issues.map((issue, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No problematic widgets found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Placement Recommendations</CardTitle>
                  <CardDescription>Suggested widget repositioning</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatePlacementRecommendations(analytics, mockLayout).length > 0 ? (
                    <div className="space-y-2">
                      {generatePlacementRecommendations(analytics, mockLayout).map((rec, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium">{rec.recommendation}</p>
                          <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Current layout is optimal</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Load analytics data to see insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
