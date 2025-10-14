import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAppContext } from '@/contexts/AppContext';
import { TimeSlotStatus, TimeAllocation, TimePurchase } from '@/types/timeManagement';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

interface AnalyticsData {
    totalAllocatedHours: number;
    totalPurchasedHours: number;
    totalUtilizedHours: number;
    totalRevenue: number;
    freelancerUtilization: Array<{
        freelancerId: string;
        freelancerName: string;
        allocatedHours: number;
        utilizedHours: number;
        utilizationRate: number;
    }>;
    projectRevenue: Array<{
        projectId: string;
        projectName: string;
        revenue: number;
        hoursPurchased: number;
    }>;
    timeSlotStatusDistribution: Array<{
        status: TimeSlotStatus;
        count: number;
        hours: number;
    }>;
    weeklyTrends: Array<{
        week: string;
        allocated: number;
        purchased: number;
        utilized: number;
    }>;
}

export const TimeManagementAnalytics: React.FC = () => {
    const { user, getTimeAllocations, getTimePurchases, getTimeSlots } = useAppContext();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalyticsData();
    }, [timeRange]);

    const loadAnalyticsData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const now = new Date();
            let startDate: Date;

            switch (timeRange) {
                case 'week':
                    startDate = startOfWeek(now);
                    break;
                case 'month':
                    startDate = startOfMonth(now);
                    break;
                case 'quarter':
                    startDate = subMonths(startOfMonth(now), 2);
                    break;
            }

            // Fetch all time management data
            const [allocations, purchases, slots] = await Promise.all([
                getTimeAllocations(),
                getTimePurchases(),
                getTimeSlots()
            ]);

            // Filter data by time range
            const filteredAllocations = allocations.filter(a => new Date(a.createdAt) >= startDate);
            const filteredPurchases = purchases.filter(p => new Date(p.purchasedAt) >= startDate);
            const filteredSlots = slots.filter(s => new Date(s.createdAt) >= startDate);

            // Calculate analytics
            const data: AnalyticsData = {
                totalAllocatedHours: filteredAllocations.reduce((sum, a) => sum + a.allocatedHours, 0),
                totalPurchasedHours: filteredPurchases.reduce((sum, p) => sum + p.amount, 0), // Using amount as hours purchased
                totalUtilizedHours: filteredSlots
                    .filter(s => s.status === TimeSlotStatus.COMPLETED)
                    .reduce((sum, s) => sum + s.durationHours, 0),
                totalRevenue: filteredPurchases.reduce((sum, p) => sum + p.amount, 0),
                freelancerUtilization: calculateFreelancerUtilization(filteredAllocations, filteredSlots),
                projectRevenue: calculateProjectRevenue(filteredPurchases),
                timeSlotStatusDistribution: calculateStatusDistribution(filteredSlots),
                weeklyTrends: calculateWeeklyTrends(filteredAllocations, filteredPurchases, filteredSlots, startDate)
            };

            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateFreelancerUtilization = (allocations: TimeAllocation[], slots: any[]) => {
        const freelancerMap = new Map<string, { name: string; allocated: number; utilized: number }>();

        allocations.forEach(allocation => {
            const existing = freelancerMap.get(allocation.freelancerId) || { name: allocation.freelancerName, allocated: 0, utilized: 0 };
            existing.allocated += allocation.allocatedHours;
            freelancerMap.set(allocation.freelancerId, existing);
        });

        slots.filter(s => s.status === TimeSlotStatus.COMPLETED).forEach(slot => {
            const existing = freelancerMap.get(slot.freelancerId) || { name: slot.freelancerName, allocated: 0, utilized: 0 };
            existing.utilized += slot.durationHours;
            freelancerMap.set(slot.freelancerId, existing);
        });

        return Array.from(freelancerMap.entries()).map(([id, data]) => ({
            freelancerId: id,
            freelancerName: data.name,
            allocatedHours: data.allocated,
            utilizedHours: data.utilized,
            utilizationRate: data.allocated > 0 ? (data.utilized / data.allocated) * 100 : 0
        })).sort((a, b) => b.utilizationRate - a.utilizationRate);
    };

    const calculateProjectRevenue = (purchases: TimePurchase[]) => {
        const projectMap = new Map<string, { name: string; revenue: number; hours: number }>();

        purchases.forEach(purchase => {
            // For now, use projectId as name since projectName is not available in TimePurchase
            const projectName = `Project ${purchase.projectId.slice(0, 8)}`;
            const existing = projectMap.get(purchase.projectId) || { name: projectName, revenue: 0, hours: 0 };
            existing.revenue += purchase.amount;
            // Calculate hours from amount and hourly rate (assuming we need to get this from slot)
            // For now, use a placeholder calculation
            existing.hours += purchase.amount / 50; // Placeholder: assume $50/hour
            projectMap.set(purchase.projectId, existing);
        });

        return Array.from(projectMap.entries()).map(([id, data]) => ({
            projectId: id,
            projectName: data.name,
            revenue: data.revenue,
            hoursPurchased: data.hours
        })).sort((a, b) => b.revenue - a.revenue);
    };

    const calculateStatusDistribution = (slots: any[]) => {
        const statusMap = new Map<TimeSlotStatus, { count: number; hours: number }>();

        slots.forEach(slot => {
            const existing = statusMap.get(slot.status) || { count: 0, hours: 0 };
            existing.count += 1;
            existing.hours += slot.durationHours;
            statusMap.set(slot.status, existing);
        });

        return Array.from(statusMap.entries()).map(([status, data]) => ({
            status,
            count: data.count,
            hours: data.hours
        }));
    };

    const calculateWeeklyTrends = (allocations: TimeAllocation[], purchases: TimePurchase[], slots: any[], startDate: Date) => {
        const weeks: Array<{ week: string; allocated: number; purchased: number; utilized: number }> = [];
        const now = new Date();

        for (let i = 0; i < 12; i++) {
            const weekStart = startOfWeek(subWeeks(now, i));
            const weekEnd = endOfWeek(weekStart);

            const weekAllocations = allocations.filter(a =>
                new Date(a.createdAt) >= weekStart && new Date(a.createdAt) <= weekEnd
            );
            const weekPurchases = purchases.filter(p =>
                new Date(p.purchasedAt) >= weekStart && new Date(p.purchasedAt) <= weekEnd
            );
            const weekSlots = slots.filter(s =>
                new Date(s.createdAt) >= weekStart && new Date(s.createdAt) <= weekEnd &&
                s.status === TimeSlotStatus.COMPLETED
            );

            weeks.unshift({
                week: format(weekStart, 'MMM dd'),
                allocated: weekAllocations.reduce((sum, a) => sum + a.allocatedHours, 0),
                purchased: weekPurchases.reduce((sum, p) => sum + p.amount, 0), // Using amount as hours purchased
                utilized: weekSlots.reduce((sum, s) => sum + s.durationHours, 0)
            });
        }

        return weeks;
    };

    const getStatusColor = (status: TimeSlotStatus) => {
        switch (status) {
            case TimeSlotStatus.AVAILABLE: return '#10B981'; // green
            case TimeSlotStatus.PURCHASED: return '#3B82F6'; // blue
            case TimeSlotStatus.IN_PROGRESS: return '#F59E0B'; // yellow
            case TimeSlotStatus.COMPLETED: return '#8B5CF6'; // purple
            case TimeSlotStatus.EXPIRED: return '#EF4444'; // red
            default: return '#6B7280'; // gray
        }
    };

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading analytics...</div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-red-500">Failed to load analytics data</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Time Management Analytics</h2>
                <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeRange(value)}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">Last 3 Months</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Allocated Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatHours(analyticsData.totalAllocatedHours)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Purchased Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatHours(analyticsData.totalPurchasedHours)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Utilized Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatHours(analyticsData.totalUtilizedHours)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Time Slot Status Distribution</CardTitle>
                                <CardDescription>Current status of all time slots</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.timeSlotStatusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.status}: ${formatHours(entry.hours)}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="hours"
                                        >
                                            {analyticsData.timeSlotStatusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatHours(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Weekly Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Activity Trends</CardTitle>
                                <CardDescription>Hours allocated, purchased, and utilized over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analyticsData.weeklyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis />
                                        <Tooltip formatter={(value: number) => formatHours(value)} />
                                        <Line type="monotone" dataKey="allocated" stroke="#8884d8" name="Allocated" />
                                        <Line type="monotone" dataKey="purchased" stroke="#82ca9d" name="Purchased" />
                                        <Line type="monotone" dataKey="utilized" stroke="#ffc658" name="Utilized" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="freelancers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Freelancer Utilization</CardTitle>
                            <CardDescription>Time allocation and utilization rates by freelancer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={analyticsData.freelancerUtilization}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="freelancerName" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number, name: string) => {
                                            if (name === 'utilizationRate') return [`${value.toFixed(1)}%`, 'Utilization Rate'];
                                            return [formatHours(value), name];
                                        }}
                                    />
                                    <Bar dataKey="allocatedHours" fill="#8884d8" name="Allocated Hours" />
                                    <Bar dataKey="utilizedHours" fill="#82ca9d" name="Utilized Hours" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyticsData.freelancerUtilization.slice(0, 6).map((freelancer) => (
                            <Card key={freelancer.freelancerId}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">{freelancer.freelancerName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Allocated:</span>
                                            <span className="font-medium">{formatHours(freelancer.allocatedHours)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Utilized:</span>
                                            <span className="font-medium">{formatHours(freelancer.utilizedHours)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Rate:</span>
                                            <Badge variant={freelancer.utilizationRate >= 80 ? "default" : freelancer.utilizationRate >= 60 ? "secondary" : "destructive"}>
                                                {freelancer.utilizationRate.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Revenue</CardTitle>
                            <CardDescription>Revenue generated by each project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={analyticsData.projectRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="projectName" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyticsData.projectRevenue.slice(0, 6).map((project) => (
                            <Card key={project.projectId}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">{project.projectName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Revenue:</span>
                                            <span className="font-medium">{formatCurrency(project.revenue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Hours Purchased:</span>
                                            <span className="font-medium">{formatHours(project.hoursPurchased)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Avg Rate:</span>
                                            <span className="font-medium">
                                                {project.hoursPurchased > 0 ? formatCurrency(project.revenue / project.hoursPurchased) : '$0.00'}/hr
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Trends</CardTitle>
                            <CardDescription>Detailed weekly trends for the selected time period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={500}>
                                <LineChart data={analyticsData.weeklyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => formatHours(value)} />
                                    <Line type="monotone" dataKey="allocated" stroke="#8884d8" strokeWidth={2} name="Allocated Hours" />
                                    <Line type="monotone" dataKey="purchased" stroke="#82ca9d" strokeWidth={2} name="Purchased Hours" />
                                    <Line type="monotone" dataKey="utilized" stroke="#ffc658" strokeWidth={2} name="Utilized Hours" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};