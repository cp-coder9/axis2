import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, UserRole } from '../../types';
import { format, subDays } from 'date-fns';
import { TimerAnalytics, DateRange, TimeManagementAnalyticsReport } from '../../utils/TimerAnalytics';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
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
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle,
    Download,
    Calendar,
    Target,
    PieChart,
    Activity,
    Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, AreaChart, Area, ComposedChart, Pie } from 'recharts';

interface TimeManagementAnalyticsDashboardProps {
    className?: string;
}

export const TimeManagementAnalyticsDashboard: React.FC<TimeManagementAnalyticsDashboardProps> = ({
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

    const [analyticsReport, setAnalyticsReport] = useState<TimeManagementAnalyticsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [customStartDate, setCustomStartDate] = useState<Date>(subDays(new Date(), 30));
    const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

    // Load analytics data
    useEffect(() => {
        loadAnalyticsReport();
    }, [selectedPeriod, customStartDate, customEndDate]);

    const loadAnalyticsReport = async () => {
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
                case 'custom':
                    period = { startDate: customStartDate, endDate: customEndDate };
                    break;
            }

            const analyticsReport = TimerAnalytics.generateTimeManagementAnalyticsReport(
                allocations,
                timeSlots.map(slot => ({
                    ...slot,
                    startTime: slot.startTime.toDate(),
                    endTime: slot.endTime.toDate(),
                    createdAt: slot.createdAt.toDate(),
                    updatedAt: slot.updatedAt.toDate()
                })),
                purchases,
                timeLogs,
                projects,
                period
            );

            setAnalyticsReport(analyticsReport);
        } catch (error) {
            console.error('Error loading analytics report:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare comprehensive chart data
    const kpiData = useMemo(() => {
        if (!analyticsReport) return null;

        const { allocationComparison, freelancerUtilization, projectProfitability } = analyticsReport;

        return {
            overallUtilization: Math.round(allocationComparison.overallUtilizationRate),
            allocationEfficiency: Math.round(allocationComparison.allocationEfficiency),
            totalRevenue: freelancerUtilization.reduce((sum, f) => sum + f.revenueGenerated, 0),
            totalAllocations: allocationComparison.totalAllocations,
            avgProfitMargin: Math.round(projectProfitability.reduce((sum, p) => sum + p.profitMargin, 0) / Math.max(projectProfitability.length, 1)),
            activeFreelancers: freelancerUtilization.length,
            completedSlots: allocationComparison.timeSlotPerformance.completed
        };
    }, [analyticsReport]);

    const performanceOverviewData = useMemo(() => {
        if (!analyticsReport) return [];

        const { allocationComparison } = analyticsReport;

        return allocationComparison.trends.map(t => ({
            date: format(new Date(t.date), 'MM/dd'),
            utilization: Math.round(t.utilizationRate),
            efficiency: Math.round(t.allocationEfficiency),
            allocations: t.allocations,
            revenue: t.revenue,
            hoursUtilized: Math.round(t.utilizedHours)
        }));
    }, [analyticsReport]);

    const freelancerPerformanceData = useMemo(() => {
        if (!analyticsReport) return [];

        return analyticsReport.freelancerUtilization.map(f => ({
            name: f.freelancerName.split(' ')[0],
            utilization: Math.round(f.utilizationRate),
            efficiency: Math.round(f.efficiencyScore),
            revenue: f.revenueGenerated,
            allocatedHours: f.totalAllocatedHours,
            utilizedHours: f.totalUtilizedHours
        })).sort((a, b) => b.utilization - a.utilization);
    }, [analyticsReport]);

    const projectPerformanceData = useMemo(() => {
        if (!analyticsReport) return [];

        return analyticsReport.projectProfitability.map(p => ({
            name: p.projectTitle.length > 15 ? p.projectTitle.substring(0, 15) + '...' : p.projectTitle,
            profitMargin: Math.round(p.profitMargin),
            roi: Math.round(p.returnOnInvestment),
            utilization: Math.round(p.allocationUtilization),
            revenue: p.totalRevenue
        })).sort((a, b) => b.profitMargin - a.profitMargin);
    }, [analyticsReport]);

    const slotStatusData = useMemo(() => {
        if (!analyticsReport) return [];

        const { timeSlotPerformance } = analyticsReport.allocationComparison;

        return [
            { name: 'Available', value: timeSlotPerformance.available, color: '#94a3b8', percentage: Math.round((timeSlotPerformance.available / Math.max(analyticsReport.allocationComparison.totalAllocations, 1)) * 100) },
            { name: 'Purchased', value: timeSlotPerformance.purchased, color: '#3b82f6', percentage: Math.round((timeSlotPerformance.purchased / Math.max(analyticsReport.allocationComparison.totalAllocations, 1)) * 100) },
            { name: 'In Progress', value: timeSlotPerformance.inProgress, color: '#f59e0b', percentage: Math.round((timeSlotPerformance.inProgress / Math.max(analyticsReport.allocationComparison.totalAllocations, 1)) * 100) },
            { name: 'Completed', value: timeSlotPerformance.completed, color: '#10b981', percentage: Math.round((timeSlotPerformance.completed / Math.max(analyticsReport.allocationComparison.totalAllocations, 1)) * 100) },
            { name: 'Expired', value: timeSlotPerformance.expired, color: '#ef4444', percentage: Math.round((timeSlotPerformance.expired / Math.max(analyticsReport.allocationComparison.totalAllocations, 1)) * 100) }
        ].filter(item => item.value > 0);
    }, [analyticsReport]);

    const revenueBreakdownData = useMemo(() => {
        if (!analyticsReport) return [];

        // Group revenue by project
        const projectRevenue = analyticsReport.projectProfitability.reduce((acc, p) => {
            acc[p.projectTitle] = (acc[p.projectTitle] || 0) + p.totalRevenue;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(projectRevenue)
            .map(([name, value]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                value,
                percentage: Math.round((value / Math.max(Object.values(projectRevenue).reduce((sum, v) => sum + v, 0), 1)) * 100)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 projects
    }, [analyticsReport]);

    const exportDashboardData = () => {
        if (!analyticsReport) return;

        const dashboardData = {
            period: selectedPeriod,
            kpis: kpiData,
            analyticsReport: analyticsReport,
            generatedAt: new Date().toISOString()
        };

        const jsonData = JSON.stringify(dashboardData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-management-dashboard-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (user?.role !== UserRole.ADMIN) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        You do not have permission to view this dashboard. Admin access required.
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
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Activity className="h-7 w-7" />
                                Time Management Analytics Dashboard
                            </CardTitle>
                            <CardDescription>
                                Comprehensive analytics for time allocation, utilization, and business performance
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d' | 'custom') => setSelectedPeriod(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>

                            {selectedPeriod === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={format(customStartDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                                        className="w-36"
                                    />
                                    <span>to</span>
                                    <Input
                                        type="date"
                                        value={format(customEndDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                                        className="w-36"
                                    />
                                </div>
                            )}

                            <Button variant="outline" onClick={exportDashboardData}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* KPI Cards */}
                {kpiData && (
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {kpiData.overallUtilization}%
                                </div>
                                <div className="text-sm text-muted-foreground">Utilization</div>
                                <Progress value={kpiData.overallUtilization} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {kpiData.allocationEfficiency}%
                                </div>
                                <div className="text-sm text-muted-foreground">Efficiency</div>
                                <Progress value={kpiData.allocationEfficiency} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    ${kpiData.totalRevenue.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Revenue</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {kpiData.totalAllocations}
                                </div>
                                <div className="text-sm text-muted-foreground">Allocations</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {kpiData.avgProfitMargin}%
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Margin</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">
                                    {kpiData.activeFreelancers}
                                </div>
                                <div className="text-sm text-muted-foreground">Freelancers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600">
                                    {kpiData.completedSlots}
                                </div>
                                <div className="text-sm text-muted-foreground">Completed</div>
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
            ) : analyticsReport ? (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Performance Overview Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Overview</CardTitle>
                                <CardDescription>Key metrics trends over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={performanceOverviewData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Area yAxisId="left" type="monotone" dataKey="utilization" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                        <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} />
                                        <Bar yAxisId="right" dataKey="allocations" fill="#f59e0b" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Slot Status Distribution */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="h-5 w-5" />
                                        Time Slot Status Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={slotStatusData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                            >
                                                {slotStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Revenue Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Revenue by Project
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={revenueBreakdownData} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} />
                                            <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                                            <Bar dataKey="value" fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6">
                        {/* Detailed Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Utilization vs Efficiency</CardTitle>
                                    <CardDescription>Correlation between utilization rates and efficiency scores</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={freelancerPerformanceData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                                            <Bar dataKey="efficiency" fill="#10b981" name="Efficiency Score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Profit Margins</CardTitle>
                                    <CardDescription>Profitability analysis across projects</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={projectPerformanceData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="profitMargin" fill="#f59e0b" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performers</CardTitle>
                                <CardDescription>Highest performing freelancers and projects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Freelancers */}
                                    <div>
                                        <h4 className="font-medium mb-4">Top Freelancers by Utilization</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Freelancer</TableHead>
                                                    <TableHead>Utilization</TableHead>
                                                    <TableHead>Efficiency</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {freelancerPerformanceData.slice(0, 5).map((freelancer) => (
                                                    <TableRow key={freelancer.name}>
                                                        <TableCell className="font-medium">{freelancer.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={freelancer.utilization > 70 ? "default" : "secondary"}>
                                                                {freelancer.utilization}%
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={freelancer.efficiency > 70 ? "default" : "secondary"}>
                                                                {freelancer.efficiency}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Top Projects */}
                                    <div>
                                        <h4 className="font-medium mb-4">Top Projects by Profit Margin</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Project</TableHead>
                                                    <TableHead>Margin</TableHead>
                                                    <TableHead>ROI</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {projectPerformanceData.slice(0, 5).map((project) => (
                                                    <TableRow key={project.name}>
                                                        <TableCell className="font-medium">{project.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={project.profitMargin > 20 ? "default" : "secondary"}>
                                                                {project.profitMargin}%
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={project.roi > 50 ? "default" : "secondary"}>
                                                                {project.roi}%
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="freelancers" className="space-y-6">
                        {/* Freelancer Analytics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Performance Overview</CardTitle>
                                <CardDescription>Comprehensive freelancer utilization and revenue metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={freelancerPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                                        <Bar yAxisId="left" dataKey="efficiency" fill="#10b981" name="Efficiency Score" />
                                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue ($)" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Detailed Freelancer Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Freelancer</TableHead>
                                            <TableHead>Utilization</TableHead>
                                            <TableHead>Efficiency</TableHead>
                                            <TableHead>Allocated Hours</TableHead>
                                            <TableHead>Utilized Hours</TableHead>
                                            <TableHead>Revenue</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {freelancerPerformanceData.map((freelancer) => (
                                            <TableRow key={freelancer.name}>
                                                <TableCell className="font-medium">{freelancer.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={freelancer.utilization} className="w-16" />
                                                        <span className="text-sm">{freelancer.utilization}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={freelancer.efficiency > 70 ? "default" : freelancer.efficiency > 40 ? "secondary" : "destructive"}>
                                                        {freelancer.efficiency}/100
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{freelancer.allocatedHours.toFixed(1)}h</TableCell>
                                                <TableCell>{freelancer.utilizedHours.toFixed(1)}h</TableCell>
                                                <TableCell>${freelancer.revenue.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        freelancer.utilization > 80 ? "default" :
                                                            freelancer.utilization > 60 ? "secondary" :
                                                                "destructive"
                                                    }>
                                                        {freelancer.utilization > 80 ? 'Excellent' :
                                                            freelancer.utilization > 60 ? 'Good' : 'Needs Attention'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-6">
                        {/* Project Analytics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Performance Matrix</CardTitle>
                                <CardDescription>Project profitability, ROI, and utilization analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={projectPerformanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="profitMargin" fill="#f59e0b" name="Profit Margin %" />
                                        <Bar yAxisId="left" dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                                        <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={2} name="ROI %" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Detailed Project Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Profit Margin</TableHead>
                                            <TableHead>ROI</TableHead>
                                            <TableHead>Utilization</TableHead>
                                            <TableHead>Revenue</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectPerformanceData.map((project) => (
                                            <TableRow key={project.name}>
                                                <TableCell className="font-medium">{project.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={project.profitMargin > 20 ? "default" : project.profitMargin > 0 ? "secondary" : "destructive"}>
                                                        {project.profitMargin}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={project.roi > 50 ? "default" : project.roi > 0 ? "secondary" : "destructive"}>
                                                        {project.roi}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={project.utilization} className="w-16" />
                                                        <span className="text-sm">{project.utilization}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>${project.revenue.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        project.profitMargin > 20 && project.utilization > 70 ? "default" :
                                                            project.profitMargin > 0 && project.utilization > 40 ? "secondary" :
                                                                "destructive"
                                                    }>
                                                        {project.profitMargin > 20 && project.utilization > 70 ? 'Excellent' :
                                                            project.profitMargin > 0 && project.utilization > 40 ? 'Good' : 'Needs Attention'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        {/* Key Insights */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Key Insights & Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analyticsReport.allocationComparison.recommendations.map((recommendation, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Recommendation {index + 1}</p>
                                            <p className="text-sm text-muted-foreground">{recommendation}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Additional Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Performance Trend
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {kpiData && kpiData.overallUtilization > 70 ?
                                                'Utilization rates are strong. Consider expanding capacity.' :
                                                'Utilization rates need improvement. Focus on better allocation matching.'
                                            }
                                        </p>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Revenue Optimization
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {kpiData && kpiData.avgProfitMargin > 20 ?
                                                'Profit margins are healthy. Consider premium pricing strategies.' :
                                                'Profit margins could be improved. Review pricing and cost structures.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Benchmarking */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Industry Benchmarks</CardTitle>
                                <CardDescription>How your metrics compare to industry standards</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold mb-2">
                                            {kpiData?.overallUtilization || 0}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Your Utilization</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry: 70-85%
                                        </div>
                                        <Badge variant={
                                            (kpiData?.overallUtilization || 0) >= 70 ? "default" :
                                                (kpiData?.overallUtilization || 0) >= 50 ? "secondary" : "destructive"
                                        } className="mt-2">
                                            {(kpiData?.overallUtilization || 0) >= 70 ? 'Above Average' :
                                                (kpiData?.overallUtilization || 0) >= 50 ? 'Average' : 'Below Average'}
                                        </Badge>
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold mb-2">
                                            {kpiData?.allocationEfficiency || 0}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Your Efficiency</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry: 65-80%
                                        </div>
                                        <Badge variant={
                                            (kpiData?.allocationEfficiency || 0) >= 65 ? "default" :
                                                (kpiData?.allocationEfficiency || 0) >= 45 ? "secondary" : "destructive"
                                        } className="mt-2">
                                            {(kpiData?.allocationEfficiency || 0) >= 65 ? 'Above Average' :
                                                (kpiData?.allocationEfficiency || 0) >= 45 ? 'Average' : 'Below Average'}
                                        </Badge>
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold mb-2">
                                            {kpiData?.avgProfitMargin || 0}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Your Margin</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry: 15-30%
                                        </div>
                                        <Badge variant={
                                            (kpiData?.avgProfitMargin || 0) >= 15 ? "default" :
                                                (kpiData?.avgProfitMargin || 0) >= 5 ? "secondary" : "destructive"
                                        } className="mt-2">
                                            {(kpiData?.avgProfitMargin || 0) >= 15 ? 'Above Average' :
                                                (kpiData?.avgProfitMargin || 0) >= 5 ? 'Average' : 'Below Average'}
                                        </Badge>
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
                            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No analytics data available</h3>
                            <p className="text-muted-foreground">
                                Analytics will appear here once time allocations, purchases, and time logs are created.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TimeManagementAnalyticsDashboard;