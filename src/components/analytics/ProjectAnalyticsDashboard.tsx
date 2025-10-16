import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Users, Target, DollarSign, Calendar, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Project, Job, Task, ProjectStatus, JobStatus, TaskStatus, TimeLog, UserRole } from '@/types';

/**
 * Project Analytics Dashboard - Task 7.1
 * Comprehensive analytics for project progress, time tracking, and performance metrics
 */
export function ProjectAnalyticsDashboard() {
    const { projects, users } = useAppContext();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [timeRange, setTimeRange] = useState('30d');
    const [isLoading, setIsLoading] = useState(false);

    // Calculate project analytics
    const projectAnalytics = useMemo(() => {
        if (!projects || projects.length === 0) return null;

        const filteredProjects = selectedProjectId === 'all'
            ? projects
            : projects.filter(p => p.id === selectedProjectId);

        // Overall project metrics
        const totalProjects = filteredProjects.length;
        const activeProjects = filteredProjects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.IN_PROGRESS).length;
        const completedProjects = filteredProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
        const onHoldProjects = filteredProjects.filter(p => p.status === ProjectStatus.ON_HOLD).length;

        // Job and task metrics
        const allJobs = filteredProjects.flatMap(p => p.jobs || []);
        const allTasks = allJobs.flatMap(j => j.tasks || []);

        const totalJobs = allJobs.length;
        const completedJobs = allJobs.filter(j => j.status === JobStatus.COMPLETED).length;
        const inProgressJobs = allJobs.filter(j => j.status === JobStatus.IN_PROGRESS).length;

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const inProgressTasks = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

        // Time tracking metrics
        const allTimeLogs = allTasks.flatMap(t => t.timeLogs || []);
        const totalTimeSpent = allTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
        const totalEarnings = allTimeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);

        // Project progress data
        const projectProgressData = filteredProjects.map(project => {
            const projectJobs = project.jobs || [];
            const projectTasks = projectJobs.flatMap(j => j.tasks || []);
            const completedProjectTasks = projectTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
            const totalProjectTasks = projectTasks.length;
            const progress = totalProjectTasks > 0 ? (completedProjectTasks / totalProjectTasks) * 100 : 0;

            return {
                name: project.title.length > 20 ? project.title.substring(0, 20) + '...' : project.title,
                progress: Math.round(progress),
                status: project.status,
                deadline: project.deadline?.toDate(),
                budget: project.budget || 0,
                timeSpent: project.totalTimeSpentMinutes || 0,
            };
        });

        // Time tracking trends (mock data for now - would be calculated from actual time logs)
        const timeTrackingTrends = [
            { date: '2024-01-01', hours: 45, earnings: 2250 },
            { date: '2024-01-08', hours: 52, earnings: 2600 },
            { date: '2024-01-15', hours: 48, earnings: 2400 },
            { date: '2024-01-22', hours: 61, earnings: 3050 },
            { date: '2024-01-29', hours: 55, earnings: 2750 },
            { date: '2024-02-05', hours: 58, earnings: 2900 },
        ];

        // Team performance data
        const teamPerformance = users?.filter(u => u.role === UserRole.FREELANCER).map(user => {
            const userTimeLogs = allTimeLogs.filter(log => log.loggedById === user.id);
            const userHours = userTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
            const userEarnings = userTimeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
            const userTasks = allTasks.filter(t => t.assignedToId === user.id);
            const completedUserTasks = userTasks.filter(t => t.status === TaskStatus.COMPLETED).length;

            return {
                name: user.name,
                hours: Math.round(userHours),
                earnings: userEarnings,
                tasksCompleted: completedUserTasks,
                efficiency: userTasks.length > 0 ? Math.round((completedUserTasks / userTasks.length) * 100) : 0,
            };
        }) || [];

        // Project status distribution
        const statusDistribution = [
            { name: 'Active', value: activeProjects, color: '#22c55e' },
            { name: 'Completed', value: completedProjects, color: '#3b82f6' },
            { name: 'On Hold', value: onHoldProjects, color: '#f59e0b' },
            { name: 'Planning', value: filteredProjects.filter(p => p.status === ProjectStatus.PLANNING).length, color: '#8b5cf6' },
        ];

        return {
            overview: {
                totalProjects,
                activeProjects,
                completedProjects,
                onHoldProjects,
                totalJobs,
                completedJobs,
                inProgressJobs,
                totalTasks,
                completedTasks,
                inProgressTasks,
                totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
                totalEarnings,
            },
            projectProgress: projectProgressData,
            timeTrackingTrends,
            teamPerformance,
            statusDistribution,
        };
    }, [projects, selectedProjectId, users]);

    const refreshData = () => {
        setIsLoading(true);
        // Simulate data refresh
        setTimeout(() => setIsLoading(false), 1000);
    };

    if (!projectAnalytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading project analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Project Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Comprehensive project progress, time tracking, and performance metrics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects?.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={refreshData} variant="outline" size="sm" disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overview KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium">Active Projects</p>
                                <p className="text-2xl font-bold">{projectAnalytics.overview.activeProjects}</p>
                                <p className="text-xs text-muted-foreground">
                                    of {projectAnalytics.overview.totalProjects} total
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm font-medium">Task Completion</p>
                                <p className="text-2xl font-bold">
                                    {projectAnalytics.overview.totalTasks > 0
                                        ? Math.round((projectAnalytics.overview.completedTasks / projectAnalytics.overview.totalTasks) * 100)
                                        : 0}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {projectAnalytics.overview.completedTasks} of {projectAnalytics.overview.totalTasks} tasks
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm font-medium">Total Hours</p>
                                <p className="text-2xl font-bold">{projectAnalytics.overview.totalTimeSpent}</p>
                                <p className="text-xs text-muted-foreground">
                                    logged this period
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm font-medium">Total Earnings</p>
                                <p className="text-2xl font-bold">${projectAnalytics.overview.totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                    from completed work
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="progress" className="w-full">
                <TabsList>
                    <TabsTrigger value="progress">Project Progress</TabsTrigger>
                    <TabsTrigger value="time">Time Tracking</TabsTrigger>
                    <TabsTrigger value="team">Team Performance</TabsTrigger>
                    <TabsTrigger value="status">Status Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Progress Overview</CardTitle>
                            <CardDescription>
                                Completion percentage for each project
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {projectAnalytics.projectProgress.map((project, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{project.name}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    project.status === ProjectStatus.COMPLETED ? 'default' :
                                                        project.status === ProjectStatus.ACTIVE ? 'secondary' :
                                                            project.status === ProjectStatus.ON_HOLD ? 'destructive' : 'outline'
                                                }>
                                                    {project.status}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">{project.progress}%</span>
                                            </div>
                                        </div>
                                        <Progress value={project.progress} className="h-2" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{Math.round(project.timeSpent / 60)}h logged</span>
                                            {project.deadline && (
                                                <span>Due: {project.deadline.toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="time" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Time Tracking Trends</CardTitle>
                            <CardDescription>
                                Hours logged and earnings over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    hours: { label: 'Hours', color: 'var(--primary)' },
                                    earnings: { label: 'Earnings ($)', color: 'var(--secondary)' }
                                }}
                                className="h-[300px]"
                            >
                                <LineChart data={projectAnalytics.timeTrackingTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="var(--color-hours)"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="earnings"
                                        stroke="var(--color-earnings)"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Performance</CardTitle>
                            <CardDescription>
                                Individual team member productivity metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {projectAnalytics.teamPerformance.map((member, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{member.name}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>{member.hours}h logged</span>
                                                <span>{member.tasksCompleted} tasks completed</span>
                                                <span>${member.earnings} earned</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-600">
                                                {member.efficiency}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">efficiency</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="status" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Status Distribution</CardTitle>
                                <CardDescription>
                                    Breakdown of projects by status
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{}}
                                    className="h-[300px]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={projectAnalytics.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {projectAnalytics.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status Summary</CardTitle>
                                <CardDescription>
                                    Quick overview of project statuses
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {projectAnalytics.statusDistribution.map((status, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                                <span className="text-sm font-medium">{status.name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">{status.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default ProjectAnalyticsDashboard;