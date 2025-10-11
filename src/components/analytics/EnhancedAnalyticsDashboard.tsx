import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';

// Import unused analytics utilities
import { 
  generateBusinessIntelligence, 
  BusinessIntelligenceData,
  KPI,
  TrendData 
} from '@/utils/analyticsEngine';
import { 
  exportReportToPDF, 
  exportChartToPDF, 
  exportTrendDataToCSV 
} from '@/utils/exportHelpers';
import { useAppContext } from '@/contexts/AppContext';

/**
 * Enhanced Analytics Dashboard using shadcn/ui dashboard-01 block patterns
 * Integrates unused analyticsEngine and exportHelpers utilities
 */
export function EnhancedAnalyticsDashboard() {
  const { projects, users } = useAppContext();
  const [analyticsData, setAnalyticsData] = useState<BusinessIntelligenceData | null>(null);
  const [timeRange, setTimeRange] = useState('90d');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Load analytics data using the unused analytics engine
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // Use the previously unused generateBusinessIntelligence function
        const data = generateBusinessIntelligence(projects || [], users || []);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [projects, users, timeRange]);

  // Export handlers using unused export utilities
  const handleExportReport = async () => {
    if (!analyticsData) return;
    
    try {
      await exportReportToPDF(analyticsData, 'business-intelligence');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportChart = async (chartData: any, title: string) => {
    try {
      await exportChartToPDF(chartData, title);
    } catch (error) {
      console.error('Chart export failed:', error);
    }
  };

  const handleExportTrendData = (trendType: string) => {
    if (!analyticsData) return;
    
    try {
      exportTrendDataToCSV(analyticsData.trendData, trendType);
    } catch (error) {
      console.error('Trend data export failed:', error);
    }
  };

  const refreshData = () => {
    if (analyticsData) {
      const refreshedData = generateBusinessIntelligence(projects || [], users || []);
      setAnalyticsData(refreshedData);
    }
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Intelligence Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards using dashboard-01 section-cards pattern */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {analyticsData.kpis.map((kpi: KPI, index: number) => (
          <Card key={index} className="@container/card">
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {kpi.unit === '$' ? '$' : ''}{kpi.value.toLocaleString()}{kpi.unit && kpi.unit !== '$' ? kpi.unit : ''}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={
                  kpi.trend === 'up' ? 'text-green-600' : 
                  kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }>
                  {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                   kpi.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                  {kpi.change ? `${kpi.change > 0 ? '+' : ''}${kpi.change}%` : 'Stable'}
                </Badge>
              </CardAction>
            </CardHeader>
            {kpi.changeLabel && (
              <div className="px-6 pb-4">
                <p className="text-xs text-muted-foreground">{kpi.changeLabel}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Interactive Charts using dashboard-01 chart patterns */}
      <Tabs defaultValue="trends" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="predictions">Project Predictions</TabsTrigger>
            <TabsTrigger value="resources">Resource Utilization</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden md:flex"
            >
              <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
              <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
              <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
            </ToggleGroup>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 md:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Projection Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Projection</CardTitle>
                <CardDescription>Actual vs projected revenue trends</CardDescription>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportChart(analyticsData.trendData.revenueProjection, 'Revenue Projection')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    actual: { label: 'Actual', color: 'var(--primary)' },
                    projected: { label: 'Projected', color: 'var(--muted-foreground)' }
                  }}
                  className="h-[200px]"
                >
                  <AreaChart data={analyticsData.trendData.revenueProjection}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="actual"
                      type="natural"
                      fill="var(--color-actual)"
                      fillOpacity={0.6}
                      stroke="var(--color-actual)"
                    />
                    <Area
                      dataKey="projected"
                      type="natural"
                      fill="var(--color-projected)"
                      fillOpacity={0.3}
                      stroke="var(--color-projected)"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Team Productivity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Team Productivity</CardTitle>
                <CardDescription>Hours logged vs tasks completed</CardDescription>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportTrendData('team-productivity')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    hoursLogged: { label: 'Hours Logged', color: 'var(--primary)' },
                    tasksCompleted: { label: 'Tasks Completed', color: 'var(--secondary)' }
                  }}
                  className="h-[200px]"
                >
                  <AreaChart data={analyticsData.trendData.teamProductivityTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="hoursLogged"
                      type="natural"
                      fill="var(--color-hoursLogged)"
                      fillOpacity={0.6}
                      stroke="var(--color-hoursLogged)"
                    />
                    <Area
                      dataKey="tasksCompleted"
                      type="natural"
                      fill="var(--color-tasksCompleted)"
                      fillOpacity={0.4}
                      stroke="var(--color-tasksCompleted)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>On-Time Delivery</CardTitle>
                <CardDescription>Project completion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analyticsData.performanceMetrics.onTimeDeliveryRate * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average project duration: {analyticsData.performanceMetrics.averageProjectDuration} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Efficiency</CardTitle>
                <CardDescription>Productivity score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.performanceMetrics.teamEfficiency.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground">
                  Above industry average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Margin</CardTitle>
                <CardDescription>Current profitability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.performanceMetrics.profitMargin.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Budget variance: {analyticsData.performanceMetrics.budgetVariance.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {analyticsData.projectPredictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{prediction.projectTitle}</CardTitle>
                  <CardDescription>
                    Risk Level: 
                    <Badge 
                      variant={prediction.riskLevel === 'low' ? 'default' : 
                              prediction.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                      className="ml-2"
                    >
                      {prediction.riskLevel}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Completion Probability</span>
                      <span className="text-sm font-medium">
                        {(prediction.completionProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Estimated Completion</span>
                      <span className="text-sm font-medium">
                        {prediction.estimatedCompletionDate.toLocaleDateString()}
                      </span>
                    </div>
                    {prediction.delayRisk > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span className="text-sm">Delay Risk</span>
                        <span className="text-sm font-medium">
                          {prediction.delayRisk} days
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {analyticsData.resourceUtilization.map((resource, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{resource.userName}</CardTitle>
                  <CardDescription>{resource.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Utilization</span>
                      <span className="text-sm font-medium">
                        {resource.utilizationPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hours Logged</span>
                      <span className="text-sm font-medium">
                        {resource.hoursLogged}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projects</span>
                      <span className="text-sm font-medium">
                        {resource.projectCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency</span>
                      <span className="text-sm font-medium">
                        {(resource.efficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedAnalyticsDashboard;