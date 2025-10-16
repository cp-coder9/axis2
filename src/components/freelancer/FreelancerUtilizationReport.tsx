import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, UserRole } from '../../types';
import { format, subDays } from 'date-fns';
import { TimerAnalytics, DateRange, FreelancerUtilizationMetrics } from '../../utils/TimerAnalytics';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Progress,
    Alert,
    AlertDescription,
    Separator,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    cn
} from '../../lib/shadcn';
import {
    TrendingUp,
    Clock,
    DollarSign,
    Target,
    Calendar,
    Download,
    BarChart3,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface FreelancerUtilizationReportProps {
    freelancerId?: string; // Optional - if not provided, uses current user
    className?: string;
}

export const FreelancerUtilizationReport: React.FC<FreelancerUtilizationReportProps> = ({
    freelancerId,
    className = ''
}) => {
    const {
        user,
        users,
        projects,
        timeLogs,
        allocations,
        timeSlots,
        purchases
    } = useAppContext();

    const [metrics, setMetrics] = useState<FreelancerUtilizationMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    const targetFreelancerId = freelancerId || user?.id;
    const targetFreelancer = users.find(u => u.id === targetFreelancerId);

    // Load freelancer metrics
    useEffect(() => {
        loadFreelancerMetrics();
    }, [selectedPeriod, targetFreelancerId]);

    const loadFreelancerMetrics = async () => {
        if (!targetFreelancerId) return;

        try {
            setLoading(true);

            let period: DateRange;
            switch (selectedPeriod) {
                case '7d':
                    period = { startDate: subDays(new Date(), 7), endDate: new Date() };
                    break;
                case '30d':
                    period = { startDate: subDays(new Date(), 30), endDate: new Date() };
                    break;
                case '90d':
                    period = { startDate: subDays(new Date(), 90), endDate: new Date() };
                    break;
            }

            const freelancerMetrics = TimerAnalytics.calculateFreelancerUtilization(
                allocations,
                timeSlots,
                purchases,
                timeLogs,
                period
            ).find(m => m.freelancerId === targetFreelancerId);

            setMetrics(freelancerMetrics);
        } catch (error) {
            console.error('Error loading freelancer metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const utilizationTrendsData = useMemo(() => {
        if (!metrics) return [];

        // Generate daily utilization data for the selected period
        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

            // Calculate daily metrics (simplified - in real app would use actual daily data)
            const dailyAllocations = allocations.filter(a =>
                a.freelancerId === targetFreelancerId &&
                new Date(a.startDate.toDate()) <= dayEnd &&
                new Date(a.endDate.toDate()) >= dayStart
            );

            const dailyTimeLogs = timeLogs.filter(t =>
                t.userId === targetFreelancerId &&
                new Date(t.startTime.toDate()) >= dayStart &&
                new Date(t.startTime.toDate()) < dayEnd
            );

            const dailyUtilizedHours = dailyTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60; // Convert minutes to hours
            const dailyAllocatedHours = dailyAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
            const dailyUtilization = dailyAllocatedHours > 0 ? (dailyUtilizedHours / dailyAllocatedHours) * 100 : 0;

            data.push({
                date: format(date, 'MM/dd'),
                allocated: dailyAllocatedHours,
                utilized: dailyUtilizedHours,
                utilization: Math.round(dailyUtilization)
            });
        }

        return data;
    }, [metrics, selectedPeriod, targetFreelancerId, allocations, timeLogs]);

    const projectBreakdownData = useMemo(() => {
        if (!metrics) return [];

        return metrics.projectBreakdown.map(p => ({
            name: p.projectTitle.length > 20 ? p.projectTitle.substring(0, 20) + '...' : p.projectTitle,
            allocated: p.allocatedHours,
            utilized: p.utilizedHours,
            utilization: Math.round(p.utilizationRate)
        }));
    }, [metrics]);

    const exportReport = () => {
        if (!metrics) return;

        const reportData = {
            freelancer: metrics.freelancerName,
            period: selectedPeriod,
            metrics: metrics,
            generatedAt: new Date().toISOString()
        };

        const jsonReport = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `freelancer-utilization-${metrics.freelancerName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Check permissions
    const canViewReport = user?.role === UserRole.ADMIN ||
        user?.role === UserRole.FREELANCER ||
        (user?.role === UserRole.CLIENT && freelancerId === user.id);

    if (!canViewReport) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        You do not have permission to view this report.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!targetFreelancer) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Freelancer not found.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <BarChart3 className="h-6 w-6" />
                                Utilization Report
                            </CardTitle>
                            <CardDescription>
                                {targetFreelancer.name}'s time utilization and performance metrics
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedPeriod(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" onClick={exportReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Key Metrics */}
                {metrics && (
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {metrics.utilizationRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Utilization Rate</div>
                                <Progress value={metrics.utilizationRate} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {metrics.totalAllocatedHours.toFixed(1)}h
                                </div>
                                <div className="text-sm text-muted-foreground">Allocated Hours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {metrics.totalUtilizedHours.toFixed(1)}h
                                </div>
                                <div className="text-sm text-muted-foreground">Utilized Hours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    ${metrics.revenueGenerated.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Revenue Generated</div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {loading ? (
                <Card>
                    <CardContent className="py-8">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            ) : metrics ? (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Utilization Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Utilization Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Overall Utilization</span>
                                        <Badge variant={metrics.utilizationRate > 70 ? "default" : metrics.utilizationRate > 40 ? "secondary" : "destructive"}>
                                            {metrics.utilizationRate.toFixed(1)}%
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Efficiency Score</span>
                                        <Badge variant={metrics.efficiencyScore > 70 ? "default" : metrics.efficiencyScore > 40 ? "secondary" : "destructive"}>
                                            {metrics.efficiencyScore.toFixed(1)}/100
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Active Projects</span>
                                        <span className="text-sm font-bold">{metrics.activeProjects}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Completed Slots</span>
                                        <span className="text-sm font-bold">{metrics.completedSlots}</span>
                                    </div>

                                    <Separator />

                                    <div className="text-sm text-muted-foreground">
                                        <p><strong>Performance Status:</strong> {
                                            metrics.utilizationRate > 80 ? 'Excellent utilization' :
                                                metrics.utilizationRate > 60 ? 'Good utilization' :
                                                    metrics.utilizationRate > 40 ? 'Moderate utilization' :
                                                        'Low utilization - consider increasing workload'
                                        }</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Time Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Time Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Allocated Hours</span>
                                            <span className="font-medium">{metrics.totalAllocatedHours.toFixed(1)}h</span>
                                        </div>
                                        <Progress value={(metrics.totalAllocatedHours / (metrics.totalAllocatedHours + metrics.unutilizedHours)) * 100} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Utilized Hours</span>
                                            <span className="font-medium">{metrics.totalUtilizedHours.toFixed(1)}h</span>
                                        </div>
                                        <Progress value={metrics.utilizationRate} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Unutilized Hours</span>
                                            <span className="font-medium">{metrics.unutilizedHours.toFixed(1)}h</span>
                                        </div>
                                        <Progress value={(metrics.unutilizedHours / (metrics.totalAllocatedHours + metrics.unutilizedHours)) * 100} className="h-2" />
                                    </div>

                                    <Separator />

                                    <div className="text-sm text-muted-foreground">
                                        <p><strong>Average Daily Hours:</strong> {(metrics.totalUtilizedHours / (selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90)).toFixed(1)}h</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {metrics.recommendations.map((recommendation, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                            <p className="text-sm">{recommendation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-4">
                        {/* Utilization Trends Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Utilization Trends</CardTitle>
                                <CardDescription>Daily utilization rate over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={utilizationTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Hours Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Hours Breakdown</CardTitle>
                                <CardDescription>Allocated vs utilized hours over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={utilizationTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="allocated" fill="#94a3b8" name="Allocated" />
                                        <Bar dataKey="utilized" fill="#3b82f6" name="Utilized" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        {/* Project Breakdown Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Utilization</CardTitle>
                                <CardDescription>Utilization rates across different projects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={projectBreakdownData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="utilization" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Project Details Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Allocated Hours</TableHead>
                                            <TableHead>Utilized Hours</TableHead>
                                            <TableHead>Utilization Rate</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics.projectBreakdown.map((project) => (
                                            <TableRow key={project.projectId}>
                                                <TableCell>
                                                    <div className="font-medium">{project.projectTitle}</div>
                                                </TableCell>
                                                <TableCell>{project.allocatedHours.toFixed(1)}h</TableCell>
                                                <TableCell>{project.utilizedHours.toFixed(1)}h</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={project.utilizationRate} className="w-16" />
                                                        <span className="text-sm">{project.utilizationRate.toFixed(1)}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={project.utilizationRate > 70 ? "default" : project.utilizationRate > 40 ? "secondary" : "destructive"}>
                                                        {project.utilizationRate > 70 ? 'High' : project.utilizationRate > 40 ? 'Medium' : 'Low'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                        {/* Performance Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                                <CardDescription>Detailed performance indicators and benchmarks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-primary mb-2">
                                            {metrics.efficiencyScore.toFixed(1)}/100
                                        </div>
                                        <div className="text-sm text-muted-foreground">Efficiency Score</div>
                                        <Progress value={metrics.efficiencyScore} className="mt-2" />
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-green-600 mb-2">
                                            ${metrics.revenueGenerated.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">
                                            {metrics.completedSlots}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Completed Slots</div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Performance Insights */}
                                <div className="space-y-4">
                                    <h4 className="font-medium">Performance Insights</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted rounded-lg">
                                            <h5 className="font-medium mb-2">Strengths</h5>
                                            <ul className="text-sm space-y-1">
                                                {metrics.utilizationRate > 70 && (
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        High utilization rate
                                                    </li>
                                                )}
                                                {metrics.completedSlots > 5 && (
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Strong project completion record
                                                    </li>
                                                )}
                                                {metrics.revenueGenerated > 1000 && (
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                        Significant revenue contribution
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-muted rounded-lg">
                                            <h5 className="font-medium mb-2">Areas for Improvement</h5>
                                            <ul className="text-sm space-y-1">
                                                {metrics.utilizationRate < 60 && (
                                                    <li className="flex items-center gap-2">
                                                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                                        Utilization rate could be improved
                                                    </li>
                                                )}
                                                {metrics.unutilizedHours > metrics.totalUtilizedHours && (
                                                    <li className="flex items-center gap-2">
                                                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                                        Significant unutilized allocated time
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No data available</h3>
                            <p className="text-muted-foreground">
                                Utilization data will appear here once you have time allocations and logged hours.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FreelancerUtilizationReport;