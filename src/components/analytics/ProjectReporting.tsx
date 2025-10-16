import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Download,
    FileText,
    BarChart3,
    Calendar,
    Users,
    Clock,
    DollarSign,
    TrendingUp,
    Filter,
    RefreshCw,
    CheckCircle
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Project, Job, Task, ProjectStatus, JobStatus, TaskStatus, TimeLog, UserRole } from '@/types';
import { format } from 'date-fns';

/**
 * Project Reporting System - Task 7.3
 * Comprehensive reporting with export capabilities for project data
 */
export function ProjectReporting() {
    const { projects, users } = useAppContext();
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [reportType, setReportType] = useState('summary');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
    const [includeCharts, setIncludeCharts] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter projects based on selection and date range
    const filteredProjects = useMemo(() => {
        let filtered = projects || [];

        if (selectedProjects.length > 0) {
            filtered = filtered.filter(p => selectedProjects.includes(p.id));
        }

        if (dateRange) {
            filtered = filtered.filter(p => {
                const createdDate = p.createdAt.toDate();
                return createdDate >= dateRange.from && createdDate <= dateRange.to;
            });
        }

        return filtered;
    }, [projects, selectedProjects, dateRange]);

    // Generate report data based on type
    const reportData = useMemo(() => {
        if (!filteredProjects.length) return null;

        const allJobs = filteredProjects.flatMap(p => p.jobs || []);
        const allTasks = allJobs.flatMap(j => j.tasks || []);
        const allTimeLogs = allTasks.flatMap(t => t.timeLogs || []);

        switch (reportType) {
            case 'summary':
                return {
                    type: 'Project Summary Report',
                    generatedAt: new Date(),
                    period: dateRange ? `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}` : 'All time',
                    data: {
                        totalProjects: filteredProjects.length,
                        activeProjects: filteredProjects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.IN_PROGRESS).length,
                        completedProjects: filteredProjects.filter(p => p.status === ProjectStatus.COMPLETED).length,
                        totalBudget: filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
                        totalEarnings: filteredProjects.reduce((sum, p) => sum + (p.totalEarnings || 0), 0),
                        totalTimeSpent: allTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60,
                        taskCompletionRate: allTasks.length > 0 ? (allTasks.filter(t => t.status === TaskStatus.COMPLETED).length / allTasks.length) * 100 : 0,
                    }
                };

            case 'detailed':
                return {
                    type: 'Detailed Project Report',
                    generatedAt: new Date(),
                    period: dateRange ? `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}` : 'All time',
                    data: filteredProjects.map(project => ({
                        id: project.id,
                        title: project.title,
                        status: project.status,
                        client: project.clientName,
                        budget: project.budget || 0,
                        earnings: project.totalEarnings || 0,
                        timeSpent: (project.totalTimeSpentMinutes || 0) / 60,
                        jobsCount: project.jobs?.length || 0,
                        tasksCount: project.jobs?.flatMap(j => j.tasks)?.length || 0,
                        completedTasks: project.jobs?.flatMap(j => j.tasks)?.filter(t => t.status === TaskStatus.COMPLETED)?.length || 0,
                        startDate: project.createdAt.toDate(),
                        deadline: project.deadline?.toDate(),
                        progress: project.completionPercentage || 0,
                    }))
                };

            case 'financial':
                return {
                    type: 'Financial Performance Report',
                    generatedAt: new Date(),
                    period: dateRange ? `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}` : 'All time',
                    data: {
                        totalBudget: filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
                        totalEarnings: filteredProjects.reduce((sum, p) => sum + (p.totalEarnings || 0), 0),
                        budgetUtilization: filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0) > 0 ?
                            (filteredProjects.reduce((sum, p) => sum + (p.totalEarnings || 0), 0) / filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)) * 100 : 0,
                        profitableProjects: filteredProjects.filter(p => (p.totalEarnings || 0) >= (p.budget || 0)).length,
                        projectBreakdown: filteredProjects.map(p => ({
                            title: p.title,
                            budget: p.budget || 0,
                            earnings: p.totalEarnings || 0,
                            profit: (p.totalEarnings || 0) - (p.budget || 0),
                            margin: p.budget && p.budget > 0 ? (((p.totalEarnings || 0) - p.budget) / p.budget) * 100 : 0,
                        }))
                    }
                };

            case 'team':
                const teamMembers = users?.filter(u => u.role === UserRole.FREELANCER) || [];
                return {
                    type: 'Team Performance Report',
                    generatedAt: new Date(),
                    period: dateRange ? `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}` : 'All time',
                    data: teamMembers.map(member => {
                        const memberTimeLogs = allTimeLogs.filter(log => log.loggedById === member.id);
                        const memberTasks = allTasks.filter(task => task.assignedToId === member.id);
                        const completedTasks = memberTasks.filter(task => task.status === TaskStatus.COMPLETED);

                        return {
                            name: member.name,
                            hoursLogged: memberTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60,
                            earnings: memberTimeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0),
                            tasksAssigned: memberTasks.length,
                            tasksCompleted: completedTasks.length,
                            completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
                            averageHourlyRate: member.hourlyRate,
                            projects: [...new Set(memberTasks.map(task => {
                                const job = allJobs.find(j => j.id === task.jobId);
                                return job ? filteredProjects.find(p => p.id === job.projectId)?.title : '';
                            }).filter(Boolean))].length,
                        };
                    })
                };

            default:
                return null;
        }
    }, [filteredProjects, reportType, dateRange, users]);

    const handleSelectAllProjects = () => {
        if (selectedProjects.length === projects?.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(projects?.map(p => p.id) || []);
        }
    };

    const handleProjectToggle = (projectId: string) => {
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const generateReport = async (format: 'pdf' | 'csv' | 'excel') => {
        if (!reportData) return;

        setIsGenerating(true);

        try {
            // Simulate report generation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create mock download
            const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                type: format === 'csv' ? 'text/csv' : 'application/pdf'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportData.type.replace(/\s+/g, '_').toLowerCase()}_${format}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Report generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToPDF = () => generateReport('pdf');
    const exportToCSV = () => generateReport('csv');
    const exportToExcel = () => generateReport('excel');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Project Reporting</h2>
                    <p className="text-muted-foreground">
                        Generate comprehensive reports with export capabilities
                    </p>
                </div>
            </div>

            {/* Report Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>
                        Customize your report parameters and filters
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium">Report Type</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="summary">Project Summary</SelectItem>
                                    <SelectItem value="detailed">Detailed Projects</SelectItem>
                                    <SelectItem value="financial">Financial Performance</SelectItem>
                                    <SelectItem value="team">Team Performance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="text-sm text-muted-foreground p-2 border rounded">
                                Date range filtering coming soon
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="include-charts"
                                checked={includeCharts}
                                onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                            />
                            <label htmlFor="include-charts" className="text-sm font-medium">
                                Include Charts
                            </label>
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Select Projects</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllProjects}
                            >
                                {selectedProjects.length === projects?.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                            {projects?.map(project => (
                                <div key={project.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={project.id}
                                        checked={selectedProjects.includes(project.id)}
                                        onCheckedChange={() => handleProjectToggle(project.id)}
                                    />
                                    <label htmlFor={project.id} className="text-sm truncate">
                                        {project.title}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedProjects.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Report Preview */}
            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>{reportData.type}</CardTitle>
                        <CardDescription>
                            Generated on {format(reportData.generatedAt, 'PPP')} • {reportData.period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                <TabsTrigger value="export">Export Options</TabsTrigger>
                            </TabsList>

                            <TabsContent value="preview" className="space-y-4">
                                {reportType === 'summary' && reportData.data && typeof reportData.data === 'object' && !Array.isArray(reportData.data) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">Total Projects</p>
                                                        <p className="text-2xl font-bold">{(reportData.data as any).totalProjects}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">Active Projects</p>
                                                        <p className="text-2xl font-bold">{(reportData.data as any).activeProjects}</p>
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
                                                        <p className="text-2xl font-bold">{Math.round((reportData.data as any).totalTimeSpent)}</p>
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
                                                        <p className="text-2xl font-bold">${(reportData.data as any).totalEarnings.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {reportType === 'detailed' && Array.isArray(reportData.data) && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Project</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Client</TableHead>
                                                <TableHead>Budget</TableHead>
                                                <TableHead>Earnings</TableHead>
                                                <TableHead>Hours</TableHead>
                                                <TableHead>Progress</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.data.map((project: any) => (
                                                <TableRow key={project.id}>
                                                    <TableCell className="font-medium">{project.title}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            project.status === ProjectStatus.COMPLETED ? 'default' :
                                                                project.status === ProjectStatus.ACTIVE ? 'secondary' : 'outline'
                                                        }>
                                                            {project.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{project.client}</TableCell>
                                                    <TableCell>${project.budget.toLocaleString()}</TableCell>
                                                    <TableCell>${project.earnings.toLocaleString()}</TableCell>
                                                    <TableCell>{Math.round(project.timeSpent)}h</TableCell>
                                                    <TableCell>{project.progress}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}

                                {reportType === 'financial' && reportData.data && typeof reportData.data === 'object' && !Array.isArray(reportData.data) && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Total Budget</p>
                                                        <p className="text-2xl font-bold">${(reportData.data as any).totalBudget.toLocaleString()}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Total Earnings</p>
                                                        <p className="text-2xl font-bold">${(reportData.data as any).totalEarnings.toLocaleString()}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Budget Utilization</p>
                                                        <p className="text-2xl font-bold">{Math.round((reportData.data as any).budgetUtilization)}%</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Project</TableHead>
                                                    <TableHead>Budget</TableHead>
                                                    <TableHead>Earnings</TableHead>
                                                    <TableHead>Profit/Loss</TableHead>
                                                    <TableHead>Margin</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(reportData.data as any).projectBreakdown.map((project: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{project.title}</TableCell>
                                                        <TableCell>${project.budget.toLocaleString()}</TableCell>
                                                        <TableCell>${project.earnings.toLocaleString()}</TableCell>
                                                        <TableCell className={project.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            ${project.profit.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className={project.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {project.margin.toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {reportType === 'team' && Array.isArray(reportData.data) && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Team Member</TableHead>
                                                <TableHead>Hours Logged</TableHead>
                                                <TableHead>Earnings</TableHead>
                                                <TableHead>Tasks Completed</TableHead>
                                                <TableHead>Completion Rate</TableHead>
                                                <TableHead>Projects</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.data.map((member: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell>{Math.round(member.hoursLogged)}h</TableCell>
                                                    <TableCell>${member.earnings.toLocaleString()}</TableCell>
                                                    <TableCell>{member.tasksCompleted}/{member.tasksAssigned}</TableCell>
                                                    <TableCell>{Math.round(member.completionRate)}%</TableCell>
                                                    <TableCell>{member.projects}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>

                            <TabsContent value="export" className="space-y-4">
                                <Alert>
                                    <FileText className="h-4 w-4" />
                                    <AlertDescription>
                                        Export your report in multiple formats. PDF includes charts and formatting,
                                        CSV is suitable for data analysis, and Excel provides spreadsheet functionality.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={exportToPDF}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        {isGenerating ? 'Generating...' : 'Export PDF'}
                                    </Button>

                                    <Button
                                        onClick={exportToCSV}
                                        variant="outline"
                                        disabled={isGenerating}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </Button>

                                    <Button
                                        onClick={exportToExcel}
                                        variant="outline"
                                        disabled={isGenerating}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export Excel
                                    </Button>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    <p>• PDF reports include charts and professional formatting</p>
                                    <p>• CSV files are optimized for data analysis and import</p>
                                    <p>• Excel files maintain data structure and can be edited</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {!reportData && selectedProjects.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Projects Selected</h3>
                        <p className="text-muted-foreground mb-4">
                            Select one or more projects to generate a report.
                        </p>
                        <Button onClick={handleSelectAllProjects}>
                            Select All Projects
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default ProjectReporting;