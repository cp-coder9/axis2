import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, UserRole } from '../../types';
import { format, subDays } from 'date-fns';
import { TimerAnalytics, DateRange, AllocationUtilizationComparison } from '../../utils/TimerAnalytics';
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
    AlertTriangle,
    CheckCircle,
    Target,
    BarChart3,
    Download,
    Lightbulb,
    Zap,
    Users,
    Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface AllocationEfficiencyReportProps {
    className?: string;
}

export const AllocationEfficiencyReport: React.FC<AllocationEfficiencyReportProps> = ({
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

    const [efficiencyData, setEfficiencyData] = useState<AllocationUtilizationComparison | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    // Load efficiency data
    useEffect(() => {
        loadEfficiencyReport();
    }, [selectedPeriod]);

    const loadEfficiencyReport = async () => {
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

            const comparison = TimerAnalytics.compareAllocationUtilization(
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
                period
            );

            setEfficiencyData(comparison);
        } catch (error) {
            console.error('Error loading efficiency report:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const efficiencyTrendsData = useMemo(() => {
        if (!efficiencyData) return [];

        return efficiencyData.trends.map(t => ({
            date: format(new Date(t.date), 'MM/dd'),
            utilizationRate: Math.round(t.utilizationRate),
            allocationEfficiency: Math.round(t.allocationEfficiency),
            totalAllocations: t.allocations,
            utilizedHours: Math.round(t.utilizedHours),
            revenue: t.revenue
        }));
    }, [efficiencyData]);

    const freelancerEfficiencyData = useMemo(() => {
        if (!efficiencyData) return [];

        // Calculate freelancer efficiency scores
        const freelancerData = users
            .filter(u => u.role === UserRole.FREELANCER)
            .map(freelancer => {
                const freelancerAllocations = allocations.filter(a => a.freelancerId === freelancer.id);
                const freelancerTimeLogs = timeLogs.filter(t => t.userId === freelancer.id);

                const totalAllocated = freelancerAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
                const totalUtilized = freelancerTimeLogs.reduce((sum, t) => sum + t.durationMinutes, 0) / 60; // Convert minutes to hours

                const utilizationRate = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;
                const efficiencyScore = Math.min(100, utilizationRate * 1.2); // Efficiency can exceed 100% for over-performance

                return {
                    name: freelancer.name.split(' ')[0],
                    utilization: Math.round(utilizationRate),
                    efficiency: Math.round(efficiencyScore),
                    allocated: totalAllocated,
                    utilized: totalUtilized
                };
            })
            .filter(f => f.allocated > 0)
            .sort((a, b) => b.efficiency - a.efficiency);

        return freelancerData;
    }, [efficiencyData, users, allocations, timeLogs]);

    const optimizationOpportunitiesData = useMemo(() => {
        if (!efficiencyData) return [];

        // Identify optimization opportunities
        const opportunities = [];

        // Underutilized freelancers
        const underutilizedFreelancers = users
            .filter(u => u.role === UserRole.FREELANCER)
            .map(freelancer => {
                const freelancerAllocations = allocations.filter(a => a.freelancerId === freelancer.id);
                const freelancerTimeLogs = timeLogs.filter(t => t.userId === freelancer.id);

                const totalAllocated = freelancerAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
                const totalUtilized = freelancerTimeLogs.reduce((sum, t) => sum + t.durationMinutes, 0) / 60;

                const utilizationRate = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

                return { freelancer, utilizationRate, totalAllocated };
            })
            .filter(f => f.totalAllocated > 0 && f.utilizationRate < 60)
            .sort((a, b) => a.utilizationRate - b.utilizationRate);

        underutilizedFreelancers.slice(0, 5).forEach(f => {
            opportunities.push({
                type: 'underutilized',
                title: `${f.freelancer.name} has low utilization`,
                description: `${f.utilizationRate.toFixed(1)}% utilization rate`,
                impact: 'high',
                action: 'Reallocate to higher-demand projects'
            });
        });

        // Overallocated projects
        const overallocatedProjects = projects.map(project => {
            const projectAllocations = allocations.filter(a => a.projectId === project.id);
            const totalAllocated = projectAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);

            return { project, totalAllocated };
        }).filter(p => p.totalAllocated > 100) // Arbitrary threshold
            .sort((a, b) => b.totalAllocated - a.totalAllocated);

        overallocatedProjects.slice(0, 3).forEach(p => {
            opportunities.push({
                type: 'overallocated',
                title: `${p.project.title} is overallocated`,
                description: `${p.totalAllocated.toFixed(1)} hours allocated`,
                impact: 'medium',
                action: 'Review project scope or redistribute workload'
            });
        });

        return opportunities;
    }, [efficiencyData, users, projects, allocations, timeLogs]);

    const exportReport = () => {
        if (!efficiencyData) return;

        const reportData = {
            period: selectedPeriod,
            efficiencyData: efficiencyData,
            generatedAt: new Date().toISOString()
        };

        const jsonReport = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `allocation-efficiency-${format(new Date(), 'yyyy-MM-dd')}.json`;
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
                                <Target className="h-6 w-6" />
                                Allocation Efficiency Report
                            </CardTitle>
                            <CardDescription>
                                Analyze allocation efficiency and identify optimization opportunities
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
                {efficiencyData && (
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {Math.round(efficiencyData.overallUtilizationRate)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Overall Utilization</div>
                                <Progress value={efficiencyData.overallUtilizationRate} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {Math.round(efficiencyData.allocationEfficiency)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Allocation Efficiency</div>
                                <Progress value={efficiencyData.allocationEfficiency} className="mt-2" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {efficiencyData.totalAllocations}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Allocations</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    ${efficiencyData.trends.reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Revenue</div>
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
            ) : efficiencyData ? (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="optimization">Optimization</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Efficiency Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5" />
                                        Efficiency Metrics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Allocation Efficiency</span>
                                        <Badge variant={efficiencyData.allocationEfficiency > 75 ? "default" : efficiencyData.allocationEfficiency > 50 ? "secondary" : "destructive"}>
                                            {efficiencyData.allocationEfficiency.toFixed(1)}%
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Utilization Rate</span>
                                        <Badge variant={efficiencyData.overallUtilizationRate > 70 ? "default" : efficiencyData.overallUtilizationRate > 40 ? "secondary" : "destructive"}>
                                            {efficiencyData.overallUtilizationRate.toFixed(1)}%
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Total Allocations</span>
                                        <span className="text-sm font-bold">{efficiencyData.totalAllocations}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Active Projects</span>
                                        <span className="text-sm font-bold">
                                            {new Set(allocations.map(a => a.projectId)).size}
                                        </span>
                                    </div>

                                    <Separator />

                                    <div className="text-sm text-muted-foreground">
                                        <p><strong>Efficiency Status:</strong> {
                                            efficiencyData.allocationEfficiency > 80 ? 'Excellent allocation efficiency' :
                                                efficiencyData.allocationEfficiency > 60 ? 'Good allocation efficiency' :
                                                    efficiencyData.allocationEfficiency > 40 ? 'Moderate allocation efficiency' :
                                                        'Poor allocation efficiency - optimization needed'
                                        }</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Time Slot Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Time Slot Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Available Slots</span>
                                            <span className="font-medium">{efficiencyData.timeSlotPerformance.available}</span>
                                        </div>
                                        <Progress value={(efficiencyData.timeSlotPerformance.available / efficiencyData.totalAllocations) * 100} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Purchased Slots</span>
                                            <span className="font-medium">{efficiencyData.timeSlotPerformance.purchased}</span>
                                        </div>
                                        <Progress value={(efficiencyData.timeSlotPerformance.purchased / efficiencyData.totalAllocations) * 100} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>In Progress</span>
                                            <span className="font-medium">{efficiencyData.timeSlotPerformance.inProgress}</span>
                                        </div>
                                        <Progress value={(efficiencyData.timeSlotPerformance.inProgress / efficiencyData.totalAllocations) * 100} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Completed</span>
                                            <span className="font-medium">{efficiencyData.timeSlotPerformance.completed}</span>
                                        </div>
                                        <Progress value={(efficiencyData.timeSlotPerformance.completed / efficiencyData.totalAllocations) * 100} className="h-2" />
                                    </div>

                                    <Separator />

                                    <div className="text-sm text-muted-foreground">
                                        <p><strong>Completion Rate:</strong> {
                                            efficiencyData.totalAllocations > 0 ?
                                                ((efficiencyData.timeSlotPerformance.completed / efficiencyData.totalAllocations) * 100).toFixed(1) + '%' :
                                                '0%'
                                        }</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Efficiency Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {efficiencyData.recommendations.map((recommendation, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                            <p className="text-sm">{recommendation}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="freelancers" className="space-y-4">
                        {/* Freelancer Efficiency Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Efficiency Comparison</CardTitle>
                                <CardDescription>Compare utilization and efficiency across freelancers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ScatterChart data={freelancerEfficiencyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="utilization" name="Utilization %" />
                                        <YAxis dataKey="efficiency" name="Efficiency Score" />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === 'utilization' ? `${value}%` : `${value}/100`,
                                                name === 'utilization' ? 'Utilization Rate' : 'Efficiency Score'
                                            ]}
                                        />
                                        <Scatter dataKey="efficiency" fill="#3b82f6" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Freelancer Efficiency Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Freelancer Efficiency Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Freelancer</TableHead>
                                            <TableHead>Utilization Rate</TableHead>
                                            <TableHead>Efficiency Score</TableHead>
                                            <TableHead>Allocated Hours</TableHead>
                                            <TableHead>Utilized Hours</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {freelancerEfficiencyData.map((freelancer) => (
                                            <TableRow key={freelancer.name}>
                                                <TableCell>
                                                    <div className="font-medium">{freelancer.name}</div>
                                                </TableCell>
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
                                                <TableCell>{freelancer.allocated.toFixed(1)}h</TableCell>
                                                <TableCell>{freelancer.utilized.toFixed(1)}h</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        freelancer.efficiency > 80 ? "default" :
                                                            freelancer.efficiency > 60 ? "secondary" :
                                                                "destructive"
                                                    }>
                                                        {freelancer.efficiency > 80 ? 'High' :
                                                            freelancer.efficiency > 60 ? 'Medium' : 'Low'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-4">
                        {/* Efficiency Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Efficiency Trends Over Time</CardTitle>
                                <CardDescription>Track efficiency and utilization trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={efficiencyTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Line yAxisId="left" type="monotone" dataKey="utilizationRate" stroke="#3b82f6" strokeWidth={2} name="Utilization %" />
                                        <Line yAxisId="right" type="monotone" dataKey="allocationEfficiency" stroke="#10b981" strokeWidth={2} name="Efficiency %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Allocation Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Allocation Activity</CardTitle>
                                <CardDescription>Daily allocation and utilization activity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={efficiencyTrendsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="totalAllocations" fill="#3b82f6" name="Allocations" />
                                        <Bar dataKey="utilizedHours" fill="#10b981" name="Utilized Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="optimization" className="space-y-4">
                        {/* Optimization Opportunities */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Optimization Opportunities
                                </CardTitle>
                                <CardDescription>Identified areas for improving allocation efficiency</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {optimizationOpportunitiesData.map((opportunity, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium">{opportunity.title}</h4>
                                                <Badge variant={opportunity.impact === 'high' ? 'destructive' : opportunity.impact === 'medium' ? 'secondary' : 'default'}>
                                                    {opportunity.impact} impact
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{opportunity.description}</p>
                                            <p className="text-sm font-medium text-primary">{opportunity.action}</p>
                                        </div>
                                    ))}

                                    {optimizationOpportunitiesData.length === 0 && (
                                        <div className="text-center py-8">
                                            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                                            <h3 className="text-lg font-medium text-foreground mb-2">No optimization opportunities found</h3>
                                            <p className="text-muted-foreground">
                                                Your allocation efficiency is currently optimal. Continue monitoring for any changes.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Efficiency Benchmarks */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Efficiency Benchmarks</CardTitle>
                                <CardDescription>Compare against industry standards</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-primary mb-2">
                                            {efficiencyData.allocationEfficiency.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Your Efficiency</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry avg: 65-75%
                                        </div>
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">
                                            {efficiencyData.overallUtilizationRate.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Your Utilization</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry avg: 70-80%
                                        </div>
                                    </div>

                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl font-bold text-green-600 mb-2">
                                            {((efficiencyData.timeSlotPerformance.completed / Math.max(efficiencyData.totalAllocations, 1)) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                                        <div className="text-xs text-muted-foreground">
                                            Industry avg: 85-95%
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
                                Efficiency data will appear here once time allocations are created and utilized.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AllocationEfficiencyReport;