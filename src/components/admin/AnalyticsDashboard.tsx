import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { generateAnalytics, BusinessIntelligenceData } from '../../utils/analyticsEngine';
import ShadcnAnalyticsCharts, { LegacyChartData } from '../charts/ShadcnAnalyticsCharts';
import { exportReportToPDF, exportChartToPDF, exportTrendDataToCSV } from '../../utils/exportHelpers';
import { UserRole } from '../../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Progress,
  Alert,
  AlertDescription,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn
} from '../../lib/shadcn';
import { TrendingUp, TrendingDown, Minus, Download, FileText, FileSpreadsheet, BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { projects, users, user } = useAppContext();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  // All hooks must be called before any early returns
  const analyticsData: BusinessIntelligenceData = useMemo(() => {
    return generateAnalytics(projects, users);
  }, [projects, users]);

  // Generate chart data for KPIs
  const kpiChartData: LegacyChartData = useMemo(() => {
    return {
      labels: analyticsData.kpis.map(kpi => kpi.label),
      datasets: [{
        label: 'KPI Values',
        data: analyticsData.kpis.map(kpi => kpi.value),
        backgroundColor: [
          'hsl(var(--primary) / 0.6)',
          'hsl(var(--success) / 0.6)',
          'hsl(var(--secondary) / 0.6)',
          'hsl(var(--warning) / 0.6)',
          'hsl(var(--info) / 0.6)'
        ],
        borderColor: [
          'hsl(var(--primary))',
          'hsl(var(--success))',
          'hsl(var(--secondary))',
          'hsl(var(--warning))',
          'hsl(var(--info))'
        ],
        borderWidth: 1
      }]
    };
  }, [analyticsData]);

  // Generate chart data for resource utilization
  const resourceUtilizationData: LegacyChartData = useMemo(() => {
    return {
      labels: analyticsData.resourceUtilization.map((resource: any) => resource.userName),
      datasets: [{
        label: 'Utilization %',
        data: analyticsData.resourceUtilization.map((resource: any) => resource.utilizationPercent),
        backgroundColor: 'hsl(var(--secondary) / 0.6)',
        borderColor: 'hsl(var(--secondary))',
        borderWidth: 2
      }]
    };
  }, [analyticsData.resourceUtilization]);

  // Generate chart data for project completion trend
  const projectTrendData: LegacyChartData = useMemo(() => {
    return {
      labels: analyticsData.trendData.projectCompletionTrend.map((item: any) => item.date),
      datasets: [
        {
          label: 'Projects Completed',
          data: analyticsData.trendData.projectCompletionTrend.map((item: any) => item.completed),
          backgroundColor: 'hsl(var(--success) / 0.6)',
          borderColor: 'hsl(var(--success))',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Projects Started',
          data: analyticsData.trendData.projectCompletionTrend.map((item: any) => item.started),
          backgroundColor: 'hsl(var(--primary) / 0.6)',
          borderColor: 'hsl(var(--primary))',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }, [analyticsData.trendData]);

  // Generate chart data for revenue projection
  const revenueProjectionData: LegacyChartData = useMemo(() => {
    return {
      labels: analyticsData.trendData.revenueProjection.map((item: any) => item.month),
      datasets: [
        {
          label: 'Actual Revenue',
          data: analyticsData.trendData.revenueProjection.map((item: any) => item.actual),
          backgroundColor: 'hsl(var(--success) / 0.6)',
          borderColor: 'hsl(var(--success))',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Projected Revenue',
          data: analyticsData.trendData.revenueProjection.map((item: any) => item.projected),
          backgroundColor: 'hsl(var(--warning) / 0.6)',
          borderColor: 'hsl(var(--warning))',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    };
  }, [analyticsData.trendData]);

  // Generate chart data for client satisfaction
  const clientSatisfactionData: LegacyChartData = useMemo(() => {
    return {
      labels: analyticsData.clientSatisfaction.map((client: any) => client.clientName),
      datasets: [{
        label: 'Satisfaction Score',
        data: analyticsData.clientSatisfaction.map((client: any) => client.satisfactionScore),
        backgroundColor: [
          'hsl(var(--success) / 0.6)',
          'hsl(var(--primary) / 0.6)',
          'hsl(var(--secondary) / 0.6)',
          'hsl(var(--warning) / 0.6)',
          'hsl(var(--info) / 0.6)'
        ],
        borderColor: [
          'hsl(var(--success))',
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--warning))',
          'hsl(var(--info))'
        ],
        borderWidth: 2
      }]
    };
  }, [analyticsData.clientSatisfaction]);

  // Only show analytics to admins and freelancers (after all hooks)
  if (user?.role === UserRole.CLIENT) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Analytics dashboard is not available for client accounts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Export handler functions
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportReportToPDF(analyticsData, 'Business Intelligence');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportChartPDF = async (type: string, title: string) => {
    let chartData: LegacyChartData;
    switch (type) {
      case 'kpi':
        chartData = kpiChartData;
        break;
      case 'resource':
        chartData = resourceUtilizationData;
        break;
      case 'project':
        chartData = projectTrendData;
        break;
      case 'revenue':
        chartData = revenueProjectionData;
        break;
      case 'satisfaction':
        chartData = clientSatisfactionData;
        break;
      default:
        console.error('Invalid chart type for export');
        return;
    }
    try {
      await exportChartToPDF(chartData, title);
    } catch (error) {
      console.error(`Error exporting ${type} chart PDF:`, error);
    }
  };

  const handleExportTrendCSV = (trendType: string) => {
    exportTrendDataToCSV(analyticsData.trendData, trendType);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getKpiVariant = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'default';
      case 'down':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Business Intelligence Dashboard</CardTitle>
              <CardDescription>
                Comprehensive analytics and performance insights
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Report'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsData.kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">
                    {kpi.value}{kpi.unit && ` ${kpi.unit}`}
                  </p>
                  {kpi.change !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <span className={cn(
                        'text-sm',
                        kpi.trend === 'up' && 'text-green-600',
                        kpi.trend === 'down' && 'text-red-600',
                        kpi.trend === 'stable' && 'text-muted-foreground'
                      )}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change}{kpi.changeLabel && ` ${kpi.changeLabel}`}
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant={getKpiVariant(kpi.trend)} className="h-12 w-12 rounded-full flex items-center justify-center p-0">
                  <BarChart3 className="h-5 w-5" />
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPI Overview Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>KPI Overview</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportChartPDF('kpi', 'KPI Overview')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <ShadcnAnalyticsCharts 
                  data={kpiChartData} 
                  title="Key Performance Indicators" 
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Resource Utilization Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Utilization</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportChartPDF('resource', 'Team Utilization')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <ShadcnAnalyticsCharts 
                  data={resourceUtilizationData} 
                  title="Resource Utilization %" 
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key performance metrics across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {analyticsData.performanceMetrics.averageProjectDuration}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Project Duration (days)</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(analyticsData.performanceMetrics.onTimeDeliveryRate * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">On-time Delivery Rate</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {analyticsData.performanceMetrics.teamEfficiency.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Team Efficiency (tasks/hour)</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-amber-600">
                    {analyticsData.performanceMetrics.budgetVariance.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Budget Variance</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round(analyticsData.performanceMetrics.clientRetentionRate * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Client Retention Rate</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {analyticsData.performanceMetrics.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Profit Margin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Completion Trend */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Trends</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportTrendCSV('project-completion')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportChartPDF('project', 'Project Completion Trend')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <ShadcnAnalyticsCharts 
                  data={projectTrendData} 
                  title="Project Completion Trend" 
                  type="line"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Revenue Projection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenue Analysis</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportTrendCSV('revenue-projection')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportChartPDF('revenue', 'Revenue Projection')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <ShadcnAnalyticsCharts 
                  data={revenueProjectionData} 
                  title="Revenue Actual vs Projected" 
                  type="line"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Client Satisfaction */}
          {analyticsData.clientSatisfaction.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Client Satisfaction</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportChartPDF('satisfaction', 'Client Satisfaction')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Chart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ShadcnAnalyticsCharts 
                      data={clientSatisfactionData} 
                      title="Client Satisfaction Scores" 
                      type="doughnut"
                      height={300}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Client Details</h4>
                    {analyticsData.clientSatisfaction.map((client, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{client.clientName}</h5>
                            <Badge 
                              variant={
                                client.satisfactionScore >= 80 ? 'default' :
                                client.satisfactionScore >= 60 ? 'secondary' :
                                'destructive'
                              }
                            >
                              {client.satisfactionScore}/100
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Projects:</span> {client.projectsCompleted}
                            </div>
                            <div>
                              <span className="font-medium">Avg Duration:</span> {client.averageProjectDuration} days
                            </div>
                            <div>
                              <span className="font-medium">On-time Rate:</span> {Math.round(client.onTimeDeliveryRate * 100)}%
                            </div>
                            <div>
                              <span className="font-medium">Budget Adherence:</span> {Math.round(client.budgetAdherence * 100)}%
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Predictions */}
          {analyticsData.projectPredictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Completion Predictions</CardTitle>
                <CardDescription>AI-powered predictions for project success</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Completion Probability</TableHead>
                      <TableHead>Est. Completion</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Delay Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.projectPredictions.map((prediction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {prediction.projectTitle}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={prediction.completionProbability * 100} 
                              className="w-16 h-2"
                            />
                            <span className="text-sm font-medium">
                              {Math.round(prediction.completionProbability * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prediction.estimatedCompletionDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              prediction.riskLevel === 'low' ? 'default' :
                              prediction.riskLevel === 'medium' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {prediction.riskLevel.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {prediction.delayRisk} days
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
