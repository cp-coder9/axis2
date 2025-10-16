import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, Project, UserRole } from '../../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
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
    Avatar,
    AvatarFallback,
    AvatarImage,
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Label,
    Alert,
    AlertDescription,
    Separator,
    Progress,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
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
    PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface AdminUtilizationDashboardProps {
    className?: string;
}

export const AdminUtilizationDashboard: React.FC<AdminUtilizationDashboardProps> = ({
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

    const [report, setReport] = useState<TimeManagementAnalyticsReport | null>(null);
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
                timeSlots,
                purchases,
                timeLogs,
                projects,
                period
            );

            setReport(analyticsReport);
        } catch (error) {
            console.error('Error loading analytics report:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const freelancerUtilizationData = useMemo(() => {
        if (!report) return [];
        return report.freelancerUtilization.map(f => ({
            name: f.freelancerName.split(' ')[0], // First name only for chart
            utilization: Math.round(f.utilizationRate),
            allocated: f.totalAllocatedHours,
            utilized: f.totalUtilizedHours,
            revenue: f.revenueGenerated
        }));
    }, [report]);

    const projectProfitabilityData = useMemo(() => {
        if (!report) return [];
        return report.projectProfitability.map(p => ({
            name: p.projectTitle.length > 15 ? p.projectTitle.substring(0, 15) + '...' : p.projectTitle,
            profitMargin: Math.round(p.profitMargin),
            revenue: p.totalRevenue,
            spent: p.totalSpent,
            roi: Math.round(p.returnOnInvestment)
        }));
    }, [report]);

    const allocationTrendsData = useMemo(() => {
        if (!report) return [];
        return report.allocationComparison.trends.map(t => ({
            date: format(new Date(t.date), 'MM/dd'),
            allocations: t.allocations,
            utilizedHours: Math.round(t.utilizedHours),
            utilizationRate: Math.round(t.utilizationRate),
            revenue: t.revenue
        }));
    }, [report]);

    const slotPerformanceData = useMemo(() => {
        if (!report) return [];
        const { timeSlotPerformance } = report.allocationComparison;
        return [
            { name: 'Available', value: timeSlotPerformance.available, color: '#94a3b8' },
            { name: 'Purchased', value: timeSlotPerformance.purchased, color: '#3b82f6' },
            { name: 'In Progress', value: timeSlotPerformance.inProgress, color: '#f59e0b' },
            { name: 'Completed', value: timeSlotPerformance.completed, color: '#10b981' },
            { name: 'Expired', value: timeSlotPerformance.expired, color: '#ef4444' }
        ].filter(item => item.value > 0);
    }, [report]);

    const exportReport = () => {
        if (!report) return;

        const jsonReport = TimerAnalytics.exportTimeManagementReportToJSON(report);
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilization-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportTextReport = () => {
        if (!report) return;

        const textReport = TimerAnalytics.formatTimeManagementReportForDisplay(report);
        const blob = new Blob([textReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilization-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
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
                        You do not have permission to view this page. Admin access required.
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
                                Utilization Analytics Dashboard
                            </CardTitle>
                            <CardDescription>
                                Monitor freelancer utilization, project profitability, and allocation efficiency
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

                            <Button variant="outline" onClick={exportReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export JSON
                            </Button>
                            <Button variant="outline" onClick={exportTextReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Text
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Key Metrics */}
                {report && (
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {Math.round(report.allocationComparison.overallUtilizationRate)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Overall Utilization</div>
                                <Progress value={report.allocationComparison.overallUtilizationRate} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {Math.round(report.allocationComparison.allocationEfficiency)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Allocation Efficiency</div>
                                <Progress value={report.allocationComparison.allocationEfficiency} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    ${report.freelancerUtilization.reduce((sum, f) => sum + f.revenueGenerated, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Revenue</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {report.allocationComparison.totalAllocations}
                                </div>
                                <div className="text-sm text-muted-foreground">Active Allocations</div>
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
            ) : report ? (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Slot Performance Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="h-5 w-5" />
                                        Time Slot Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={slotPerformanceData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                                            >
                                                {slotPerformanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Utilization Trends */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Utilization Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={allocationTrendsData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="utilizationRate" stroke="#3b82f6" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {report.allocationComparison.recommendations.map((recommendation, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                            <p className="text-sm">{recommendation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="freelancers" className="space-y-4">
                        {/* Freelancer Utilization Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Utilization Rates</CardTitle>
                                <CardDescription>Compare utilization across all freelancers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={freelancerUtilizationData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="utilization" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Freelancer Details Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Performance Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Freelancer</TableHead>
                                            <TableHead>Allocated Hours</TableHead>
                                            <TableHead>Utilized Hours</TableHead>
                                            <TableHead>Utilization Rate</TableHead>
                                            <TableHead>Revenue</TableHead>
                                            <TableHead>Efficiency Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.freelancerUtilization.map((freelancer) => (
                                            <TableRow key={freelancer.freelancerId}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src="" alt={freelancer.freelancerName} />
                                                            <AvatarFallback>{freelancer.freelancerName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{freelancer.freelancerName}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{freelancer.totalAllocatedHours.toFixed(1)}h</TableCell>
                                                <TableCell>{freelancer.totalUtilizedHours.toFixed(1)}h</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={freelancer.utilizationRate} className="w-16" />
                                                        <span className="text-sm">{freelancer.utilizationRate.toFixed(1)}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>${freelancer.revenueGenerated.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={freelancer.efficiencyScore > 70 ? "default" : freelancer.efficiencyScore > 40 ? "secondary" : "destructive"}>
                                                        {freelancer.efficiencyScore.toFixed(1)}/100
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        {/* Project Profitability Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Profit Margins</CardTitle>
                                <CardDescription>Profitability comparison across projects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={projectProfitabilityData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="profitMargin" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Project Details Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Profitability Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Allocated Budget</TableHead>
                                            <TableHead>Total Revenue</TableHead>
                                            <TableHead>Total Spent</TableHead>
                                            <TableHead>Profit Margin</TableHead>
                                            <TableHead>ROI</TableHead>
                                            <TableHead>Utilization</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.projectProfitability.map((project) => (
                                            <TableRow key={project.projectId}>
                                                <TableCell>
                                                    <div className="font-medium">{project.projectTitle}</div>
                                                </TableCell>
                                                <TableCell>${project.totalAllocatedBudget.toLocaleString()}</TableCell>
                                                <TableCell className="text-green-600 font-medium">
                                                    ${project.totalRevenue.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-red-600">
                                                    ${project.totalSpent.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={project.profitMargin > 20 ? "default" : project.profitMargin > 0 ? "secondary" : "destructive"}>
                                                        {project.profitMargin.toFixed(1)}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={project.returnOnInvestment > 50 ? "default" : project.returnOnInvestment > 0 ? "secondary" : "destructive"}>
                                                        {project.returnOnInvestment.toFixed(1)}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={project.allocationUtilization} className="w-16" />
                                                        <span className="text-sm">{project.allocationUtilization.toFixed(1)}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-4">
                        {/* Allocation Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Allocation Trends Over Time</CardTitle>
                                <CardDescription>Track allocations, utilization, and revenue trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={allocationTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="allocations" fill="#3b82f6" name="Allocations" />
                                        <Line yAxisId="right" type="monotone" dataKey="utilizationRate" stroke="#10b981" strokeWidth={2} name="Utilization %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>Daily revenue from time slot purchases</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={allocationTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                                        <Bar dataKey="revenue" fill="#f59e0b" />
                                    </BarChart>
                                </ResponsiveContainer>
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
                                Analytics data will appear here once time allocations and purchases are made.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminUtilizationDashboard;