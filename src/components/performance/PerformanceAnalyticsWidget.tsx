/**
 * Performance Analytics Widget
 * Displays role-based performance metrics for admin dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  performanceTracker,
  getRolePerformanceMetrics,
  trackRolePerformance,
  analyzeBundleSize,
  analyzeNetworkPerformance,
  usePerformanceMonitor,
  PERFORMANCE_CONFIG,
} from '@/utils/performance/performanceOptimizer';

interface RoleMetrics {
  role: 'admin' | 'freelancer' | 'client';
  dashboardLoadTime: number;
  componentCount: number;
  averageRenderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export function PerformanceAnalyticsWidget() {
  const [roleMetrics, setRoleMetrics] = useState<RoleMetrics[]>([]);
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [networkMetrics, setNetworkMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  usePerformanceMonitor('PerformanceAnalyticsWidget');

  useEffect(() => {
    refreshMetrics();
  }, []);

  const refreshMetrics = async () => {
    setIsRefreshing(true);

    try {
      // Get role-based metrics
      const metrics = getRolePerformanceMetrics() as RoleMetrics[];
      setRoleMetrics(metrics);

      // Analyze bundle size
      const bundle = analyzeBundleSize();
      setBundleAnalysis(bundle);

      // Analyze network performance
      const network = analyzeNetworkPerformance();
      setNetworkMetrics(network);

      // Simulate role metrics if none exist (for demo)
      if (metrics.length === 0) {
        const mockMetrics: RoleMetrics[] = [
          {
            role: 'admin',
            dashboardLoadTime: 1200 + Math.random() * 300,
            componentCount: 45,
            averageRenderTime: 12 + Math.random() * 4,
            memoryUsage: 45 + Math.random() * 10,
            bundleSize: 2.8,
          },
          {
            role: 'freelancer',
            dashboardLoadTime: 900 + Math.random() * 200,
            componentCount: 28,
            averageRenderTime: 10 + Math.random() * 3,
            memoryUsage: 35 + Math.random() * 8,
            bundleSize: 1.9,
          },
          {
            role: 'client',
            dashboardLoadTime: 700 + Math.random() * 150,
            componentCount: 18,
            averageRenderTime: 8 + Math.random() * 2,
            memoryUsage: 28 + Math.random() * 6,
            bundleSize: 1.4,
          },
        ];
        setRoleMetrics(mockMetrics);
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', variant: 'default' as const, color: 'text-green-600' };
    if (value <= thresholds.warning) return { status: 'warning', variant: 'secondary' as const, color: 'text-yellow-600' };
    return { status: 'critical', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Users className="h-4 w-4" />;
      case 'freelancer':
        return <Clock className="h-4 w-4" />;
      case 'client':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'freelancer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Role-based dashboard performance metrics and optimization insights
            </CardDescription>
          </div>
          <Button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Role Metrics</TabsTrigger>
            <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          {/* Role-based metrics */}
          <TabsContent value="roles" className="space-y-4">
            {roleMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No performance data available yet</p>
                <Button onClick={refreshMetrics} variant="outline" size="sm" className="mt-4">
                  Load Metrics
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {roleMetrics.map((metric) => {
                  const loadTimeStatus = getPerformanceStatus(metric.dashboardLoadTime, {
                    good: 1000,
                    warning: 2000,
                  });
                  const renderTimeStatus = getPerformanceStatus(metric.averageRenderTime, {
                    good: 16,
                    warning: 32,
                  });
                  const memoryStatus = getPerformanceStatus(metric.memoryUsage, {
                    good: 50,
                    warning: 70,
                  });

                  return (
                    <Card key={metric.role} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(metric.role)}
                            <CardTitle className="text-lg capitalize">{metric.role} Dashboard</CardTitle>
                          </div>
                          <Badge className={getRoleColor(metric.role)}>
                            {metric.componentCount} components
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Load Time */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Dashboard Load Time
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{metric.dashboardLoadTime.toFixed(0)}ms</span>
                              <Badge variant={loadTimeStatus.variant} className="text-xs">
                                {loadTimeStatus.status}
                              </Badge>
                            </div>
                          </div>
                          <Progress
                            value={Math.min((metric.dashboardLoadTime / 3000) * 100, 100)}
                            className="h-2"
                          />
                        </div>

                        {/* Render Time */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              Average Render Time
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{metric.averageRenderTime.toFixed(1)}ms</span>
                              <Badge variant={renderTimeStatus.variant} className="text-xs">
                                {renderTimeStatus.status}
                              </Badge>
                            </div>
                          </div>
                          <Progress
                            value={Math.min((metric.averageRenderTime / 32) * 100, 100)}
                            className="h-2"
                          />
                        </div>

                        {/* Memory Usage */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4" />
                              Memory Usage
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{metric.memoryUsage.toFixed(1)}%</span>
                              <Badge variant={memoryStatus.variant} className="text-xs">
                                {memoryStatus.status}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={metric.memoryUsage} className="h-2" />
                        </div>

                        {/* Bundle Size */}
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Bundle Size
                          </span>
                          <span className="font-mono">{metric.bundleSize.toFixed(2)} MB</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Bundle analysis */}
          <TabsContent value="bundle" className="space-y-4">
            {bundleAnalysis ? (
              <div className="space-y-4">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bundle Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Scripts</span>
                      <Badge>{bundleAnalysis.scripts.count} files</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Styles</span>
                      <Badge>{bundleAnalysis.styles.count} files</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Size</span>
                      <Badge variant="secondary">{formatBytes(bundleAnalysis.total)}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {bundleAnalysis.warnings.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                    <CardHeader>
                      <CardTitle className="text-base text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Optimization Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {bundleAnalysis.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-sm text-orange-700 dark:text-orange-300">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Top Scripts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Largest Scripts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {bundleAnalysis.scripts.files
                        .sort((a: any, b: any) => b.size - a.size)
                        .slice(0, 5)
                        .map((file: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1 font-mono text-xs">{file.name}</span>
                            <Badge variant="outline">{formatBytes(file.size)}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Bundle analysis not available</p>
              </div>
            )}
          </TabsContent>

          {/* Network metrics */}
          <TabsContent value="network" className="space-y-4">
            {networkMetrics ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Network Performance</CardTitle>
                  <CardDescription>Page load timing breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">DNS Lookup</span>
                    <span className="font-mono text-sm">{networkMetrics.dns.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">TCP Connection</span>
                    <span className="font-mono text-sm">{networkMetrics.tcp.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Request Time</span>
                    <span className="font-mono text-sm">{networkMetrics.request.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="font-mono text-sm">{networkMetrics.response.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">DOM Processing</span>
                    <span className="font-mono text-sm">{networkMetrics.domProcessing.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t font-semibold">
                    <span className="text-sm">Total Load Time</span>
                    <span className="font-mono text-sm">{networkMetrics.total.toFixed(0)}ms</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Network metrics not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PerformanceAnalyticsWidget;
