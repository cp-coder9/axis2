/**
 * Dashboard Analytics Panel
 * Displays dashboard usage analytics and optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertTriangle,
  Download,
  Lightbulb,
  Zap
} from 'lucide-react';
import {
  getDashboardAnalytics,
  generateOptimizationSuggestions,
  exportAnalyticsReport,
  DashboardAnalytics,
  OptimizationSuggestion
} from '../../services/dashboardAnalyticsService';
import { WidgetLayout } from '../../types/dashboard';

interface DashboardAnalyticsPanelProps {
  userId: string;
  currentLayout: WidgetLayout[];
}

export const DashboardAnalyticsPanel: React.FC<DashboardAnalyticsPanelProps> = ({
  userId,
  currentLayout
}) => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId, period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardAnalytics(userId, period);
      setAnalytics(data);
      
      const optimizations = generateOptimizationSuggestions(data, currentLayout);
      setSuggestions(optimizations);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const report = exportAnalyticsReport(analytics);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-analytics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Analytics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={33} />
            <p className="text-sm text-muted-foreground">Analyzing dashboard usage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Available</CardTitle>
          <CardDescription>Start using your dashboard to see analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Dashboard Analytics
            </CardTitle>
            <CardDescription>
              Usage insights and optimization recommendations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6 mt-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Sessions</CardDescription>
                  <CardTitle className="text-3xl">{analytics.totalSessions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Active usage
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg. Session Duration</CardDescription>
                  <CardTitle className="text-3xl">
                    {Math.floor(analytics.averageSessionDuration / 60)}m
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time spent
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Interactions</CardDescription>
                  <CardTitle className="text-3xl">{analytics.totalInteractions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    User engagement
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Widget Usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Widget Usage</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Most Used Widgets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Most Used Widgets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.mostUsedWidgets.map((widget, index) => (
                      <div key={widget.widgetId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {index + 1}. {widget.widgetTitle}
                          </span>
                          <span className="text-muted-foreground">
                            {widget.usageCount} uses
                          </span>
                        </div>
                        <Progress value={widget.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Least Used Widgets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      Least Used Widgets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.leastUsedWidgets.map((widget, index) => (
                      <div key={widget.widgetId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {index + 1}. {widget.widgetTitle}
                          </span>
                          <span className="text-muted-foreground">
                            {widget.usageCount} uses
                          </span>
                        </div>
                        <Progress value={widget.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Widget Performance</h3>
              
              <div className="space-y-2">
                {analytics.widgetPerformance.slice(0, 5).map((widget) => (
                  <Card key={widget.widgetId}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{widget.widgetTitle}</h4>
                        <Badge variant={widget.errorRate > 10 ? 'destructive' : 'secondary'}>
                          {widget.errorRate.toFixed(1)}% errors
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Load Time</p>
                          <p className="font-semibold">{widget.loadTime.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Render Time</p>
                          <p className="font-semibold">{widget.renderTime.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-semibold">{widget.viewCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Optimization Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Optimization Suggestions
                </h3>
                
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Alert key={index} variant={suggestion.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center gap-2">
                        {suggestion.title}
                        <Badge variant={getSeverityColor(suggestion.severity) as any}>
                          {suggestion.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>{suggestion.description}</p>
                        <p className="text-sm font-medium">
                          Recommendation: {suggestion.recommendation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Impact: {suggestion.estimatedImpact}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Usage Insights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usage Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Peak Usage Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {analytics.peakUsageHours.map((hour) => (
                        <Badge key={hour} variant="secondary">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Device Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Desktop</span>
                      <span className="font-semibold">{analytics.deviceDistribution.desktop}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Tablet</span>
                      <span className="font-semibold">{analytics.deviceDistribution.tablet}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Mobile</span>
                      <span className="font-semibold">{analytics.deviceDistribution.mobile}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
