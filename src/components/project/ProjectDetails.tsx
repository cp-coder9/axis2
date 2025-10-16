import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    ArrowLeft,
    Edit,
    Plus,
    MoreHorizontal,
    Users,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    PauseCircle,
    Building,
    Target,
    TrendingUp,
} from 'lucide-react';
import { Project, Job, Task, User, JobStatus, TaskStatus, ChatType } from '@/types';
import { ProjectChatInterface } from '../ProjectChatInterface';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Notification } from '../../types/notifications';
import { EnhancedFileManager } from '../files/EnhancedFileManager';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface ProjectDetailsProps {
    project: Project;
    jobs: Job[];
    tasks: Task[];
    teamMembers: User[];
    currentUser: User;
    onBack: () => void;
    onEditProject: (project: Project) => void;
    onCreateJob: (projectId: string) => void;
    onEditJob: (job: Job) => void;
    onDeleteJob: (jobId: string) => void;
    onViewJob: (job: Job) => void;
    onCreateTask: (jobId: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onViewTask: (task: Task) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
    project,
    jobs,
    tasks,
    teamMembers,
    currentUser,
    onBack,
    onEditProject,
    onCreateJob,
    onEditJob,
    onDeleteJob,
    onViewJob,
    onCreateTask,
    onEditTask,
    onDeleteTask,
    onViewTask,
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Calculate project statistics
    const projectStats = useMemo(() => {
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter(job => job.status === JobStatus.COMPLETED).length;
        const inProgressJobs = jobs.filter(job => job.status === JobStatus.IN_PROGRESS).length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;

        const jobCompletionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const overallProgress = (jobCompletionRate + taskCompletionRate) / 2;

        const totalAllocatedHours = jobs.reduce((sum, job) => sum + (job.allocatedHours || 0), 0);
        const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);

        return {
            totalJobs,
            completedJobs,
            inProgressJobs,
            totalTasks,
            completedTasks,
            jobCompletionRate,
            taskCompletionRate,
            overallProgress,
            totalAllocatedHours,
            totalEstimatedHours,
        };
    }, [jobs, tasks]);

    const getJobStatusColor = (status: JobStatus) => {
        switch (status) {
            case JobStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case JobStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800';
            case JobStatus.REVIEW:
                return 'bg-yellow-100 text-yellow-800';
            case JobStatus.ON_HOLD:
                return 'bg-orange-100 text-orange-800';
            case JobStatus.TODO:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTaskStatusColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case TaskStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-800';
            case TaskStatus.REVIEW:
                return 'bg-yellow-100 text-yellow-800';
            case TaskStatus.ON_HOLD:
                return 'bg-orange-100 text-orange-800';
            case TaskStatus.TODO:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getJobStatusIcon = (status: JobStatus) => {
        switch (status) {
            case JobStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case JobStatus.IN_PROGRESS:
                return <PlayCircle className="h-4 w-4" />;
            case JobStatus.ON_HOLD:
                return <PauseCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getTeamMemberName = (userId: string) => {
        const member = teamMembers.find(m => m.id === userId);
        return member ? member.name : 'Unknown User';
    };

    const JobCard: React.FC<{ job: Job }> = ({ job }) => {
        const jobTasks = tasks.filter(task => task.jobId === job.id);
        const completedTasks = jobTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
        const progress = jobTasks.length > 0 ? (completedTasks / jobTasks.length) * 100 : 0;

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold truncate">
                                {job.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {job.description}
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewJob(job)}>
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEditJob(job)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Job
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onCreateTask(job.id)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDeleteJob(job.id)}
                                    className="text-red-600"
                                >
                                    Delete Job
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge className={getJobStatusColor(job.status)}>
                                {getJobStatusIcon(job.status)}
                                <span className="ml-1">{job.status.replace('_', ' ')}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {jobTasks.length} tasks
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{job.assignedArchitectIds.length} assigned</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{job.allocatedHours || 0}h allocated</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Updated {job.updatedAt ? format(job.updatedAt.toDate(), 'MMM dd, yyyy') : 'Never'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
        const assignee = teamMembers.find(m => m.id === task.assignedToId);

        return (
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                                {task.status.replace('_', ' ')}
                            </Badge>
                            {assignee && (
                                <div className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={assignee.avatarUrl} />
                                        <AvatarFallback className="text-xs">
                                            {assignee.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                        {assignee.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {task.estimatedTime && (
                        <span className="text-xs text-muted-foreground">
                            {task.estimatedTime}h
                        </span>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewTask(task)}>
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <Edit className="h-3 w-3 mr-2" />
                                Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDeleteTask(task.id)}
                                className="text-red-600"
                            >
                                Delete Task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    };

    const ProjectNotifications: React.FC<{ projectId: string }> = ({ projectId }) => {
        const { notifications, markAsRead, loading } = useNotificationContext();

        // Filter notifications for this project
        const projectNotifications = notifications.filter(
            notification => notification.data?.projectId === projectId
        );

        const formatRelativeTime = (date: Date): string => {
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

            return date.toLocaleDateString();
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Project Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : projectNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications for this project yet</p>
                            <p className="text-xs mt-1">
                                Project updates and status changes will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {projectNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-muted/30 border-l-4 border-l-blue-500"
                                    )}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            {!notification.read && (
                                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatRelativeTime(notification.createdAt.toDate())}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{project.title}</h1>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onEditProject(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                    </Button>
                    <Button onClick={() => onCreateJob(project.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job
                    </Button>
                </div>
            </div>

            {/* Project Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium">Jobs</p>
                                <p className="text-2xl font-bold">{projectStats.totalJobs}</p>
                                <p className="text-xs text-muted-foreground">
                                    {projectStats.completedJobs} completed
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
                                <p className="text-sm font-medium">Tasks</p>
                                <p className="text-2xl font-bold">{projectStats.totalTasks}</p>
                                <p className="text-xs text-muted-foreground">
                                    {projectStats.completedTasks} completed
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm font-medium">Progress</p>
                                <p className="text-2xl font-bold">{Math.round(projectStats.overallProgress)}%</p>
                                <Progress value={projectStats.overallProgress} className="mt-2 h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm font-medium">Hours</p>
                                <p className="text-2xl font-bold">{projectStats.totalAllocatedHours}</p>
                                <p className="text-xs text-muted-foreground">
                                    allocated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Client</span>
                            </div>
                            <p className="text-sm">{project.clientName || 'No client assigned'}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Team Members</span>
                            </div>
                            <p className="text-sm">{project.assignedTeamIds?.length || 0} members</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Deadline</span>
                            </div>
                            <p className="text-sm">
                                {project.deadline ? format(project.deadline.toDate(), 'PPP') : 'No deadline set'}
                            </p>
                        </div>

                        {project.budget && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Budget</span>
                                </div>
                                <p className="text-sm">{formatCurrency(project.budget)}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Status</span>
                            </div>
                            <Badge className={project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'}>
                                {project.status.replace('_', ' ')}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Priority</span>
                            </div>
                            <Badge variant="outline">
                                {project.priority || 'Medium'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Jobs and Tasks Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Jobs Overview</TabsTrigger>
                    <TabsTrigger value="tasks">All Tasks</TabsTrigger>
                    <TabsTrigger value="messaging">Team Chat</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="files">Files & Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {jobs.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Get started by creating your first job for this project.
                                </p>
                                <Button onClick={() => onCreateJob(project.id)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Job
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    {tasks.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Tasks will appear here once jobs are created and tasks are added.
                                </p>
                                {jobs.length > 0 && (
                                    <Button onClick={() => onCreateTask(jobs[0].id)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Task
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="messaging" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Team Chat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProjectChatInterface
                                project={project}
                                chatType={ChatType.GENERAL}
                                className="h-96"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <ProjectNotifications projectId={project.id} />
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Files & Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EnhancedFileManager projectId={project.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProjectDetails;