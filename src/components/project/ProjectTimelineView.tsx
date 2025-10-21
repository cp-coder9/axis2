import React from 'react';
import { Project, Job, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Flag, Target, Clock } from 'lucide-react';

interface ProjectTimelineViewProps {
    project: Project;
    jobs: Job[];
    tasks: Task[];
    className?: string;
}

export const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({
    project,
    jobs,
    tasks,
    className
}) => {
    // Calculate timeline data
    const timelineData = React.useMemo(() => {
        const allTasks = tasks.filter(task => jobs.some(job => job.id === task.jobId && job.projectId === project.id));

        // Find milestones (tasks marked as milestones or with no duration)
        const milestones = allTasks.filter(task => task.isMilestone || (task.duration && task.duration <= 1));

        // Group tasks by month for phase overview
        const tasksByMonth: Record<string, Task[]> = {};
        allTasks.forEach(task => {
            if (task.startDate) {
                const monthKey = task.startDate.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
                tasksByMonth[monthKey].push(task);
            }
        });

        // Calculate project phases (group consecutive months)
        const phases = Object.keys(tasksByMonth)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .reduce((acc: Array<{ name: string; startDate: Date; endDate: Date; tasks: Task[] }>, monthKey) => {
                const monthTasks = tasksByMonth[monthKey];
                const monthDate = new Date(monthKey + ' 1');

                if (acc.length === 0 || acc[acc.length - 1].endDate.getTime() < monthDate.getTime() - 30 * 24 * 60 * 60 * 1000) {
                    // New phase
                    acc.push({
                        name: `Phase ${acc.length + 1}`,
                        startDate: monthDate,
                        endDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
                        tasks: monthTasks
                    });
                } else {
                    // Extend current phase
                    acc[acc.length - 1].endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                    acc[acc.length - 1].tasks.push(...monthTasks);
                }

                return acc;
            }, []);

        // Calculate key metrics
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(task => task.status === 'COMPLETED').length;
        const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS').length;
        const overdueTasks = allTasks.filter(task => {
            if (!task.dueDate || task.status === 'COMPLETED') return false;
            return task.dueDate.toDate() < new Date();
        }).length;

        return {
            milestones,
            phases,
            metrics: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            }
        };
    }, [project, jobs, tasks]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Project Overview Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {project.title} - Timeline Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{timelineData.metrics.totalTasks}</div>
                            <div className="text-sm text-gray-500">Total Tasks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{timelineData.metrics.completedTasks}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{timelineData.metrics.inProgressTasks}</div>
                            <div className="text-sm text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{timelineData.metrics.overdueTasks}</div>
                            <div className="text-sm text-gray-500">Overdue</div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Overall Progress</span>
                            <span>{Math.round(timelineData.metrics.completionRate)}%</span>
                        </div>
                        <Progress value={timelineData.metrics.completionRate} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Project Phases */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Project Phases
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {timelineData.phases.map((phase, index) => {
                            const phaseTasks = phase.tasks;
                            const completedPhaseTasks = phaseTasks.filter(task => task.status === 'COMPLETED').length;
                            const phaseProgress = phaseTasks.length > 0 ? (completedPhaseTasks / phaseTasks.length) * 100 : 0;

                            return (
                                <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{phase.name}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-sm">{phaseTasks.length} tasks</span>
                                        <Progress value={phaseProgress} className="flex-1 h-2" />
                                        <span className="text-sm font-medium">{Math.round(phaseProgress)}%</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {phaseTasks.slice(0, 5).map(task => (
                                            <Badge
                                                key={task.id}
                                                variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {task.title}
                                            </Badge>
                                        ))}
                                        {phaseTasks.length > 5 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{phaseTasks.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Key Milestones */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flag className="w-5 h-5" />
                        Key Milestones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {timelineData.milestones.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No milestones defined yet</p>
                    ) : (
                        <div className="space-y-3">
                            {timelineData.milestones.map(milestone => (
                                <div key={milestone.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{milestone.title}</h4>
                                        <p className="text-sm text-gray-500">
                                            {milestone.startDate ? formatDate(milestone.startDate.toDate()) : 'No date set'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={milestone.status === 'COMPLETED' ? 'default' : 'secondary'}
                                    >
                                        {milestone.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Timeline Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle>Timeline Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {/* Timeline axis */}
                        <div className="flex justify-between mb-4 text-sm text-gray-500">
                            {timelineData.phases.map((phase, index) => (
                                <div key={index} className="text-center">
                                    <div>{phase.name}</div>
                                    <div className="text-xs">{formatDate(phase.startDate)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline bar */}
                        <div className="h-4 bg-gray-200 rounded-full relative">
                            {timelineData.phases.map((phase, index) => {
                                const phaseTasks = phase.tasks;
                                const completedTasks = phaseTasks.filter(task => task.status === 'COMPLETED').length;
                                const progress = phaseTasks.length > 0 ? (completedTasks / phaseTasks.length) * 100 : 0;

                                return (
                                    <div
                                        key={index}
                                        className="absolute top-0 h-full bg-blue-500 rounded-full"
                                        style={{
                                            left: `${(index / timelineData.phases.length) * 100}%`,
                                            width: `${100 / timelineData.phases.length}%`,
                                            background: `linear-gradient(to right, #3b82f6 ${progress}%, #e5e7eb ${progress}%)`
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Milestone markers */}
                        <div className="relative mt-2">
                            {timelineData.milestones.map(milestone => {
                                if (!milestone.startDate) return null;

                                const milestoneDate = milestone.startDate.toDate();
                                const projectStart = project.startDate?.toDate() || new Date();
                                const projectEnd = project.endDate?.toDate() || new Date();
                                const position = ((milestoneDate.getTime() - projectStart.getTime()) /
                                    (projectEnd.getTime() - projectStart.getTime())) * 100;

                                return (
                                    <div
                                        key={milestone.id}
                                        className="absolute transform -translate-x-1/2"
                                        style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
                                    >
                                        <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-red-500 mx-auto"></div>
                                        <div className="text-xs text-center mt-1 text-gray-600 max-w-24 truncate">
                                            {milestone.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectTimelineView;