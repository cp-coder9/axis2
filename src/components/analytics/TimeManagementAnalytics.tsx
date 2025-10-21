import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import { useAppContext } from '@/contexts/AppContext';
import { TimeSlotStatus, TimeAllocation, TimePurchase } from '@/types/timeManagement';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, addWeeks, addMonths } from 'date-fns';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Clock, Users, BarChart3 } from 'lucide-react';

interface AnalyticsData {
    totalAllocatedHours: number;
    totalPurchasedHours: number;
    totalUtilizedHours: number;
    totalRevenue: number;
    utilizationRate: number;
    efficiencyScore: number;
    freelancerUtilization: Array<{
        freelancerId: string;
        freelancerName: string;
        allocatedHours: number;
        utilizedHours: number;
        utilizationRate: number;
        efficiencyScore: number;
        revenueGenerated: number;
        activeProjects: number;
        avgProjectValue: number;
        trend: 'up' | 'down' | 'stable';
    }>;
    projectRevenue: Array<{
        projectId: string;
        projectName: string;
        revenue: number;
        hoursPurchased: number;
        avgHourlyRate: number;
        utilizationRate: number;
        status: string;
        freelancerCount: number;
    }>;
    timeSlotStatusDistribution: Array<{
        status: TimeSlotStatus;
        count: number;
        hours: number;
        percentage: number;
    }>;
    weeklyTrends: Array<{
        week: string;
        allocated: number;
        purchased: number;
        utilized: number;
        revenue: number;
        utilizationRate: number;
    }>;
    predictiveInsights: {
        nextWeekUtilization: number;
        nextMonthUtilization: number;
        revenueForecast: number;
        bottleneckProjects: string[];
        underutilizedFreelancers: string[];
        recommendedAllocations: Array<{
            freelancerId: string;
            projectId: string;
            recommendedHours: number;
            confidence: number;
        }>;
    };
    performanceMetrics: {
        avgTimeToPurchase: number; // hours from allocation to purchase
        avgTimeToComplete: number; // hours from purchase to completion
        clientSatisfaction: number; // based on ratings
        freelancerSatisfaction: number; // based on ratings
        costEfficiency: number; // revenue per hour vs allocated cost
        scheduleAdherence: number; // percentage of on-time completions
    };
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
            // Firestore stores timestamps as Timestamp objects; convert to Date for comparisons
            const filteredAllocations = allocations.filter(a => {
                const createdAtDate = (a.createdAt && (a.createdAt as any).toDate) ? (a.createdAt as any).toDate() : new Date(a.createdAt as any);
                return createdAtDate >= startDate;
            });

            const filteredPurchases = purchases.filter(p => {
                const purchasedAtDate = (p.purchasedAt && (p.purchasedAt as any).toDate) ? (p.purchasedAt as any).toDate() : new Date(p.purchasedAt as any);
                return purchasedAtDate >= startDate;
            });

            const filteredSlots = slots.filter(s => {
                const createdAtDate = (s.createdAt && (s.createdAt as any).toDate) ? (s.createdAt as any).toDate() : new Date(s.createdAt as any);
                return createdAtDate >= startDate;
            });

            // Calculate analytics with advanced metrics
            const data: AnalyticsData = {
                totalAllocatedHours: filteredAllocations.reduce((sum, a) => sum + a.allocatedHours, 0),
                totalPurchasedHours: filteredPurchases.reduce((sum, p) => sum + p.amount, 0), // Using amount as hours purchased
                totalUtilizedHours: filteredSlots
                    .filter(s => s.status === TimeSlotStatus.COMPLETED)
                    .reduce((sum, s) => sum + s.durationHours, 0),
                totalRevenue: filteredPurchases.reduce((sum, p) => sum + p.amount, 0),
                utilizationRate: 0, // Will be calculated
                efficiencyScore: 0, // Will be calculated
                freelancerUtilization: calculateFreelancerUtilization(filteredAllocations, filteredSlots, filteredPurchases),
                projectRevenue: calculateProjectRevenue(filteredPurchases, filteredSlots),
                timeSlotStatusDistribution: calculateStatusDistribution(filteredSlots),
                weeklyTrends: calculateWeeklyTrends(filteredAllocations, filteredPurchases, filteredSlots, startDate),
                predictiveInsights: calculatePredictiveInsights(filteredAllocations, filteredSlots, filteredPurchases),
                performanceMetrics: calculatePerformanceMetrics(filteredAllocations, filteredSlots, filteredPurchases)
            };

            // Calculate overall metrics
            data.utilizationRate = data.totalAllocatedHours > 0 ? (data.totalUtilizedHours / data.totalAllocatedHours) * 100 : 0;
            data.efficiencyScore = calculateEfficiencyScore(data);

            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateFreelancerUtilization = (allocations: TimeAllocation[], slots: any[], purchases: TimePurchase[]) => {
        const freelancerMap = new Map<string, {
            name: string;
            allocated: number;
            utilized: number;
            revenue: number;
            projects: Set<string>;
            completedSlots: number;
            totalSlots: number;
            avgRating: number;
            ratingCount: number;
        }>();

        allocations.forEach(allocation => {
            const existing = freelancerMap.get(allocation.freelancerId) || {
                name: allocation.freelancerName,
                allocated: 0,
                utilized: 0,
                revenue: 0,
                projects: new Set(),
                completedSlots: 0,
                totalSlots: 0,
                avgRating: 0,
                ratingCount: 0
            };
            existing.allocated += allocation.allocatedHours;
            freelancerMap.set(allocation.freelancerId, existing);
        });

        slots.forEach(slot => {
            const existing = freelancerMap.get(slot.freelancerId) || {
                name: slot.freelancerName,
                allocated: 0,
                utilized: 0,
                revenue: 0,
                projects: new Set(),
                completedSlots: 0,
                totalSlots: 0,
                avgRating: 0,
                ratingCount: 0
            };
            existing.totalSlots += 1;
            if (slot.status === TimeSlotStatus.COMPLETED) {
                existing.utilized += slot.durationHours;
                existing.completedSlots += 1;
                existing.revenue += slot.durationHours * slot.hourlyRate;
            }
            if (slot.freelancerRating) {
                existing.avgRating = (existing.avgRating * existing.ratingCount + slot.freelancerRating) / (existing.ratingCount + 1);
                existing.ratingCount += 1;
            }
            existing.projects.add(slot.projectId);
            freelancerMap.set(slot.freelancerId, existing);
        });

        return Array.from(freelancerMap.entries()).map(([id, data]) => {
            const utilizationRate = data.allocated > 0 ? (data.utilized / data.allocated) * 100 : 0;
            const completionRate = data.totalSlots > 0 ? (data.completedSlots / data.totalSlots) * 100 : 0;
            const efficiencyScore = (utilizationRate * 0.4) + (completionRate * 0.4) + (data.avgRating * 10 * 0.2);

            // Calculate trend (simplified - in real implementation would use historical data)
            const trend: 'up' | 'down' | 'stable' = utilizationRate > 75 ? 'up' : utilizationRate < 50 ? 'down' : 'stable';

            return {
                freelancerId: id,
                freelancerName: data.name,
                allocatedHours: data.allocated,
                utilizedHours: data.utilized,
                utilizationRate,
                efficiencyScore,
                revenueGenerated: data.revenue,
                activeProjects: data.projects.size,
                avgProjectValue: data.projects.size > 0 ? data.revenue / data.projects.size : 0,
                trend
            };
        }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    };

    const calculateProjectRevenue = (purchases: TimePurchase[], slots: any[]) => {
        const projectMap = new Map<string, {
            name: string;
            revenue: number;
            hours: number;
            freelancers: Set<string>;
            totalSlots: number;
            completedSlots: number;
        }>();

        purchases.forEach(purchase => {
            const projectName = `Project ${purchase.projectId.slice(0, 8)}`;
            const existing = projectMap.get(purchase.projectId) || {
                name: projectName,
                revenue: 0,
                hours: 0,
                freelancers: new Set(),
                totalSlots: 0,
                completedSlots: 0
            };
            existing.revenue += purchase.amount;
            existing.hours += purchase.amount / 50; // Placeholder: assume $50/hour
            projectMap.set(purchase.projectId, existing);
        });

        slots.forEach(slot => {
            const existing = projectMap.get(slot.projectId) || {
                name: `Project ${slot.projectId.slice(0, 8)}`,
                revenue: 0,
                hours: 0,
                freelancers: new Set(),
                totalSlots: 0,
                completedSlots: 0
            };
            existing.totalSlots += 1;
            existing.freelancers.add(slot.freelancerId);
            if (slot.status === TimeSlotStatus.COMPLETED) {
                existing.completedSlots += 1;
            }
            projectMap.set(slot.projectId, existing);
        });

        return Array.from(projectMap.entries()).map(([id, data]) => ({
            projectId: id,
            projectName: data.name,
            revenue: data.revenue,
            hoursPurchased: data.hours,
            avgHourlyRate: data.hours > 0 ? data.revenue / data.hours : 0,
            utilizationRate: data.totalSlots > 0 ? (data.completedSlots / data.totalSlots) * 100 : 0,
            status: data.completedSlots === data.totalSlots ? 'Completed' : data.completedSlots > 0 ? 'In Progress' : 'Not Started',
            freelancerCount: data.freelancers.size
        })).sort((a, b) => b.revenue - a.revenue);
    };

    const calculateStatusDistribution = (slots: any[]) => {
        const statusMap = new Map<TimeSlotStatus, { count: number; hours: number }>();
        const totalHours = slots.reduce((sum, slot) => sum + slot.durationHours, 0);

        slots.forEach(slot => {
            const existing = statusMap.get(slot.status) || { count: 0, hours: 0 };
            existing.count += 1;
            existing.hours += slot.durationHours;
            statusMap.set(slot.status, existing);
        });

        return Array.from(statusMap.entries()).map(([status, data]) => ({
            status,
            count: data.count,
            hours: data.hours,
            percentage: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
        }));
    };

    const calculateWeeklyTrends = (allocations: TimeAllocation[], purchases: TimePurchase[], slots: any[], startDate: Date) => {
        const weeks: Array<{
            week: string;
            allocated: number;
            purchased: number;
            utilized: number;
            revenue: number;
            utilizationRate: number;
        }> = [];
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
                new Date(s.createdAt) >= weekStart && new Date(s.createdAt) <= weekEnd
            );

            const weekAllocated = weekAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
            const weekUtilized = weekSlots
                .filter(s => s.status === TimeSlotStatus.COMPLETED)
                .reduce((sum, s) => sum + s.durationHours, 0);
            const weekRevenue = weekPurchases.reduce((sum, p) => sum + p.amount, 0);

            weeks.unshift({
                week: format(weekStart, 'MMM dd'),
                allocated: weekAllocated,
                purchased: weekPurchases.reduce((sum, p) => sum + p.amount, 0), // Using amount as hours purchased
                utilized: weekUtilized,
                revenue: weekRevenue,
                utilizationRate: weekAllocated > 0 ? (weekUtilized / weekAllocated) * 100 : 0
            });
        }

        return weeks;
    };

    const calculatePredictiveInsights = (allocations: TimeAllocation[], slots: any[], purchases: TimePurchase[]) => {
        // Simple predictive analytics based on historical trends
        const recentWeeks = 4;
        const recentAllocations = allocations.slice(-recentWeeks * 7); // Rough approximation
        const recentPurchases = purchases.slice(-recentWeeks * 7);
        const recentCompletedSlots = slots.filter(s => s.status === TimeSlotStatus.COMPLETED).slice(-recentWeeks * 7);

        const avgWeeklyAllocation = recentAllocations.length / recentWeeks;
        const avgWeeklyPurchase = recentPurchases.length / recentWeeks;
        const avgWeeklyUtilization = recentCompletedSlots.length / recentWeeks;

        // Calculate utilization trend
        const utilizationTrend = recentCompletedSlots.length > recentAllocations.length * 0.7 ? 1.1 : 0.9;

        return {
            nextWeekUtilization: avgWeeklyUtilization * utilizationTrend,
            nextMonthUtilization: avgWeeklyUtilization * 4 * utilizationTrend,
            revenueForecast: avgWeeklyPurchase * 4 * 50, // Assuming $50/hour
            bottleneckProjects: [], // Would need more complex analysis
            underutilizedFreelancers: [], // Would need freelancer-specific analysis
            recommendedAllocations: [] // Would need ML/AI for real recommendations
        };
    };

    const calculatePerformanceMetrics = (allocations: TimeAllocation[], slots: any[], purchases: TimePurchase[]) => {
        // Calculate average time metrics
        const completedSlots = slots.filter(s => s.status === TimeSlotStatus.COMPLETED);
        const avgTimeToComplete = completedSlots.length > 0
            ? completedSlots.reduce((sum, slot) => {
                const purchase = purchases.find(p => p.slotId === slot.id);
                if (purchase) {
                    const purchaseTime = new Date(purchase.purchasedAt).getTime();
                    const completeTime = new Date(slot.updatedAt || slot.createdAt).getTime();
                    return sum + (completeTime - purchaseTime) / (1000 * 60 * 60); // hours
                }
                return sum;
            }, 0) / completedSlots.length
            : 0;

        // Calculate cost efficiency (revenue per allocated hour vs actual cost)
        const totalAllocatedCost = allocations.reduce((sum, a) => sum + (a.allocatedHours * a.hourlyRate), 0);
        const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
        const costEfficiency = totalAllocatedCost > 0 ? (totalRevenue / totalAllocatedCost) * 100 : 0;

        return {
            avgTimeToPurchase: 24, // Placeholder - would need purchase timing data
            avgTimeToComplete,
            clientSatisfaction: 4.2, // Placeholder - would need rating system
            freelancerSatisfaction: 4.5, // Placeholder - would need rating system
            costEfficiency,
            scheduleAdherence: 85 // Placeholder - would need deadline tracking
        };
    };

    const calculateEfficiencyScore = (data: AnalyticsData): number => {
        const utilizationWeight = 0.4;
        const revenueWeight = 0.3;
        const completionWeight = 0.3;

        const utilizationScore = Math.min(data.utilizationRate / 100, 1) * 100;
        const revenueEfficiency = data.totalAllocatedHours > 0 ? (data.totalRevenue / (data.totalAllocatedHours * 50)) * 100 : 0; // Assuming $50 avg rate
        const completionRate = data.totalPurchasedHours > 0 ? (data.totalUtilizedHours / data.totalPurchasedHours) * 100 : 0;

        return (utilizationScore * utilizationWeight) +
            (revenueEfficiency * revenueWeight) +
            (completionRate * completionWeight);
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

            {/* Key Metrics with Advanced KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Overall Utilization
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.utilizationRate.toFixed(1)}%</div>
                        <Progress value={analyticsData.utilizationRate} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Efficiency Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.efficiencyScore.toFixed(1)}/100</div>
                        <Progress value={analyticsData.efficiencyScore} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Revenue Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.performanceMetrics.costEfficiency.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Revenue vs Allocated Cost
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Avg Completion Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.performanceMetrics.avgTimeToComplete.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            From purchase to completion
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Predictive Insights Alert */}
            <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Predictive Insights</AlertTitle>
                <AlertDescription>
                    Next week utilization forecast: {analyticsData.predictiveInsights.nextWeekUtilization.toFixed(1)} hours |
                    Revenue forecast: {formatCurrency(analyticsData.predictiveInsights.revenueForecast)}
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
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
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        {freelancer.freelancerName}
                                        <div className="flex items-center gap-1">
                                            {freelancer.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                            {freelancer.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Utilization:</span>
                                            <Badge variant={freelancer.utilizationRate >= 80 ? "default" : freelancer.utilizationRate >= 60 ? "secondary" : "destructive"}>
                                                {freelancer.utilizationRate.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Efficiency Score:</span>
                                            <span className="font-medium">{freelancer.efficiencyScore.toFixed(1)}/100</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Revenue:</span>
                                            <span className="font-medium">{formatCurrency(freelancer.revenueGenerated)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Active Projects:</span>
                                            <span className="font-medium">{freelancer.activeProjects}</span>
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
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        {project.projectName}
                                        <Badge variant={
                                            project.status === 'Completed' ? 'default' :
                                                project.status === 'In Progress' ? 'secondary' : 'outline'
                                        }>
                                            {project.status}
                                        </Badge>
                                    </CardTitle>
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
                                            <span className="font-medium">{formatCurrency(project.avgHourlyRate)}/hr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Utilization:</span>
                                            <Badge variant={project.utilizationRate >= 80 ? "default" : "secondary"}>
                                                {project.utilizationRate.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Freelancers:</span>
                                            <span className="font-medium">{project.freelancerCount}</span>
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

                <TabsContent value="insights" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Predictive Analytics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Predictive Analytics
                                </CardTitle>
                                <CardDescription>Forecasted utilization and revenue</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Next Week Utilization:</span>
                                    <Badge variant="outline">{analyticsData.predictiveInsights.nextWeekUtilization.toFixed(1)} hours</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Next Month Utilization:</span>
                                    <Badge variant="outline">{analyticsData.predictiveInsights.nextMonthUtilization.toFixed(1)} hours</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Revenue Forecast:</span>
                                    <Badge variant="outline">{formatCurrency(analyticsData.predictiveInsights.revenueForecast)}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Recommendations
                                </CardTitle>
                                <CardDescription>Optimization suggestions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>High Utilization Alert</AlertTitle>
                                    <AlertDescription>
                                        {analyticsData.freelancerUtilization.filter(f => f.utilizationRate > 90).length} freelancers at risk of burnout
                                    </AlertDescription>
                                </Alert>
                                <Alert>
                                    <TrendingDown className="h-4 w-4" />
                                    <AlertTitle>Underutilization</AlertTitle>
                                    <AlertDescription>
                                        {analyticsData.freelancerUtilization.filter(f => f.utilizationRate < 50).length} freelancers under 50% utilization
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Efficiency Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Efficiency Trends</CardTitle>
                            <CardDescription>Utilization rate trends over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analyticsData.weeklyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                    <Area type="monotone" dataKey="utilizationRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Utilization Rate %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.clientSatisfaction.toFixed(1)}/5</div>
                                <div className="flex mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-lg ${i < Math.floor(analyticsData.performanceMetrics.clientSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Freelancer Satisfaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.freelancerSatisfaction.toFixed(1)}/5</div>
                                <div className="flex mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-lg ${i < Math.floor(analyticsData.performanceMetrics.freelancerSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Schedule Adherence</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.scheduleAdherence.toFixed(1)}%</div>
                                <Progress value={analyticsData.performanceMetrics.scheduleAdherence} className="mt-2" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analyticsData.performanceMetrics.costEfficiency.toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Revenue vs Cost
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Comparison</CardTitle>
                            <CardDescription>Freelancer efficiency scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={analyticsData.freelancerUtilization.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="freelancerName" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Bar yAxisId="left" dataKey="utilizationRate" fill="#8884d8" name="Utilization %" />
                                    <Bar yAxisId="left" dataKey="efficiencyScore" fill="#82ca9d" name="Efficiency Score" />
                                    <Line yAxisId="right" type="monotone" dataKey="revenueGenerated" stroke="#ff7300" name="Revenue ($)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};