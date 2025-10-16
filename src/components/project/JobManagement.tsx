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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Clock,
    User as UserIcon,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    PauseCircle,
    ArrowUp,
    ArrowDown,
    Users,
    Calendar,
    Target,
} from 'lucide-react';
import { Job, Task, TaskStatus, User } from '@/types';
import { format } from 'date-fns';

interface JobManagementProps {
    job: Job;
    tasks: Task[];
    teamMembers: User[];
    currentUser: User;
    onUpdateJob: (jobId: string, updates: Partial<Job>) => void;
    onCreateTask: (jobId: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onReorderTasks?: (taskId: string, direction: 'up' | 'down') => void;
    onAssignTask: (taskId: string, userId: string) => void;
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

export const JobManagement: React.FC<JobManagementProps> = ({
    job,
    tasks,
    teamMembers,
    currentUser,
    onUpdateJob,
    onCreateTask,
    onEditTask,
    onDeleteTask,
    onUpdateTask,
    onReorderTasks,
    onAssignTask,
    onUpdateTaskStatus,
}) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    // Calculate job statistics
    const jobStats = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
        const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
        const todoTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
        const totalAllocatedHours = tasks.reduce((sum, task) => sum + (task.allocatedHours || 0), 0);

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            completionRate,
            totalEstimatedHours,
            totalAllocatedHours,
        };
    }, [tasks]);

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

    const getTaskStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case TaskStatus.IN_PROGRESS:
                return <PlayCircle className="h-4 w-4" />;
            case TaskStatus.ON_HOLD:
                return <PauseCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getAssigneeName = (userId: string) => {
        const member = teamMembers.find(m => m.id === userId);
        return member ? member.name : 'Unassigned';
    };

    const getAssigneeAvatar = (userId: string) => {
        const member = teamMembers.find(m => m.id === userId);
        return member?.avatarUrl || '';
    };

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        onUpdateTaskStatus(taskId, newStatus);
    };

    const handleAssignTask = (taskId: string, userId: string) => {
        onAssignTask(taskId, userId);
        setIsAssignDialogOpen(false);
        setSelectedTask(null);
    };

    const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
        const assignee = teamMembers.find(m => m.id === task.assignedToId);

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{task.title}</h4>
                                <Badge className={getTaskStatusColor(task.status)}>
                                    {getTaskStatusIcon(task.status)}
                                    <span className="ml-1">{task.status.replace('_', ' ')}</span>
                                </Badge>
                                {task.priority && (
                                    <Badge variant="outline" className="text-xs">
                                        {task.priority}
                                    </Badge>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {task.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <UserIcon className="h-4 w-4" />
                                        <span>{assignee ? assignee.name : 'Unassigned'}</span>
                                    </div>

                                    {task.estimatedTime && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{task.estimatedTime}h</span>
                                        </div>
                                    )}

                                    {task.dueDate && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{format(task.dueDate.toDate(), 'MMM dd')}</span>
                                        </div>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Task
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsAssignDialogOpen(true);
                                            }}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Assign Task
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(task.id, TaskStatus.TODO)}
                                            disabled={task.status === TaskStatus.TODO}
                                        >
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            Mark as To Do
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(task.id, TaskStatus.IN_PROGRESS)}
                                            disabled={task.status === TaskStatus.IN_PROGRESS}
                                        >
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Start Progress
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(task.id, TaskStatus.COMPLETED)}
                                            disabled={task.status === TaskStatus.COMPLETED}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark Complete
                                        </DropdownMenuItem>

                                        {onReorderTasks && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onReorderTasks(task.id, 'up')}
                                                    disabled={index === 0}
                                                >
                                                    <ArrowUp className="h-4 w-4 mr-2" />
                                                    Move Up
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onReorderTasks(task.id, 'down')}
                                                    disabled={index === tasks.length - 1}
                                                >
                                                    <ArrowDown className="h-4 w-4 mr-2" />
                                                    Move Down
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDeleteTask(task.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Task
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Job Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <p className="text-muted-foreground mt-1">{job.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => onUpdateJob(job.id, {})}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Job
                            </Button>
                            <Button onClick={() => onCreateTask(job.id)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Task
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{jobStats.totalTasks}</div>
                            <div className="text-sm text-muted-foreground">Total Tasks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{jobStats.completedTasks}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{jobStats.inProgressTasks}</div>
                            <div className="text-sm text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">{jobStats.todoTasks}</div>
                            <div className="text-sm text-muted-foreground">To Do</div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Overall Progress</span>
                            <span>{Math.round(jobStats.completionRate)}%</span>
                        </div>
                        <Progress value={jobStats.completionRate} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Estimated Hours:</span>
                            <span className="ml-2 font-medium">{jobStats.totalEstimatedHours}h</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Allocated Hours:</span>
                            <span className="ml-2 font-medium">{jobStats.totalAllocatedHours}h</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
                <CardHeader>
                    <CardTitle>Tasks ({jobStats.totalTasks})</CardTitle>
                </CardHeader>
                <CardContent>
                    {tasks.length === 0 ? (
                        <div className="text-center py-8">
                            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by creating the first task for this job.
                            </p>
                            <Button onClick={() => onCreateTask(job.id)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Task
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Task Assignment Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                        <DialogDescription>
                            Select a team member to assign this task to.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTask && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium">{selectedTask.title}</h4>
                                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assign to:</label>
                                <Select
                                    onValueChange={(userId) => handleAssignTask(selectedTask.id, userId)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {teamMembers.map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback className="text-xs">
                                                            {member.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default JobManagement;