import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle,
    PlayCircle,
    Filter,
    SortAsc,
    SortDesc,
} from 'lucide-react';
import { Task, TaskStatus, User, Project, Job } from '@/types';
import { format } from 'date-fns';

interface TaskAssignmentProps {
    tasks: Task[];
    teamMembers: User[];
    projects: Project[];
    jobs: Job[];
    currentUser: User;
    onAssignTask: (taskId: string, userId: string) => void;
    onBulkAssign: (taskIds: string[], userId: string) => void;
    onUnassignTask: (taskId: string) => void;
    onUpdateTaskPriority: (taskId: string, priority: string) => void;
    onFilterTasks: (filters: TaskFilters) => void;
    onSortTasks: (sortBy: TaskSortOption) => void;
}

interface TaskFilters {
    status?: TaskStatus[];
    assignedTo?: string[];
    priority?: string[];
    projectId?: string;
    jobId?: string;
    dueDateRange?: { start: Date; end: Date };
    searchQuery?: string;
}

type TaskSortOption = 'dueDate' | 'priority' | 'status' | 'title' | 'assignee';

interface TaskGroup {
    id: string;
    title: string;
    tasks: Task[];
    color: string;
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({
    tasks,
    teamMembers,
    projects,
    jobs,
    currentUser,
    onAssignTask,
    onBulkAssign,
    onUnassignTask,
    onUpdateTaskPriority,
    onFilterTasks,
    onSortTasks,
}) => {
    const [filters, setFilters] = useState<TaskFilters>({});
    const [sortBy, setSortBy] = useState<TaskSortOption>('dueDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort tasks
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = tasks.filter(task => {
            // Search query filter
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Status filter
            if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
                return false;
            }

            // Assignee filter
            if (filters.assignedTo && filters.assignedTo.length > 0) {
                if (!task.assignedToId || !filters.assignedTo.includes(task.assignedToId)) {
                    return false;
                }
            }

            // Priority filter
            if (filters.priority && filters.priority.length > 0) {
                if (!task.priority || !filters.priority.includes(task.priority)) {
                    return false;
                }
            }

            // Project filter
            if (filters.projectId) {
                const taskJob = jobs.find(job => job.id === task.jobId);
                if (!taskJob || taskJob.projectId !== filters.projectId) {
                    return false;
                }
            }

            // Job filter
            if (filters.jobId && task.jobId !== filters.jobId) {
                return false;
            }

            // Due date range filter
            if (filters.dueDateRange && task.dueDate) {
                const dueDate = task.dueDate.toDate();
                if (dueDate < filters.dueDateRange.start || dueDate > filters.dueDateRange.end) {
                    return false;
                }
            }

            return true;
        });

        // Sort tasks
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'dueDate':
                    aValue = a.dueDate?.toDate().getTime() || Infinity;
                    bValue = b.dueDate?.toDate().getTime() || Infinity;
                    break;
                case 'priority':
                    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                    aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                    bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'assignee':
                    const aAssignee = teamMembers.find(m => m.id === a.assignedToId)?.name || '';
                    const bAssignee = teamMembers.find(m => m.id === b.assignedToId)?.name || '';
                    aValue = aAssignee.toLowerCase();
                    bValue = bAssignee.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [tasks, filters, sortBy, sortOrder, searchQuery, jobs, teamMembers]);

    // Group tasks by assignee
    const taskGroups: TaskGroup[] = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        const unassignedTasks: Task[] = [];

        filteredAndSortedTasks.forEach(task => {
            if (task.assignedToId) {
                if (!groups[task.assignedToId]) {
                    groups[task.assignedToId] = [];
                }
                groups[task.assignedToId].push(task);
            } else {
                unassignedTasks.push(task);
            }
        });

        const result: TaskGroup[] = [
            {
                id: 'unassigned',
                title: 'Unassigned Tasks',
                tasks: unassignedTasks,
                color: 'bg-gray-100',
            },
        ];

        teamMembers.forEach(member => {
            if (groups[member.id]) {
                result.push({
                    id: member.id,
                    title: member.name,
                    tasks: groups[member.id],
                    color: 'bg-blue-100',
                });
            }
        });

        return result;
    }, [filteredAndSortedTasks, teamMembers]);

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
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-100 text-red-800';
            case 'High':
                return 'bg-orange-100 text-orange-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        const sourceGroupId = source.droppableId;
        const destGroupId = destination.droppableId;

        // If dropped in the same group, do nothing
        if (sourceGroupId === destGroupId) return;

        // Assign task to new user (or unassign if dropped in unassigned)
        const userId = destGroupId === 'unassigned' ? '' : destGroupId;
        onAssignTask(draggableId, userId);
    };

    const handleBulkAssign = (userId: string) => {
        if (selectedTasks.size > 0) {
            onBulkAssign(Array.from(selectedTasks), userId);
            setSelectedTasks(new Set());
            setBulkAssignDialogOpen(false);
        }
    };

    const toggleTaskSelection = (taskId: string) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };

    const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
        const job = jobs.find(j => j.id === task.jobId);
        const project = projects.find(p => p.id === job?.projectId);
        const assignee = teamMembers.find(m => m.id === task.assignedToId);

        return (
            <Draggable draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                    <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`hover:shadow-md transition-shadow cursor-move ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                            } ${selectedTasks.has(task.id) ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => toggleTaskSelection(task.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.has(task.id)}
                                    onChange={() => toggleTaskSelection(task.id)}
                                    className="mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold truncate">{task.title}</h4>
                                        <Badge className={getTaskStatusColor(task.status)}>
                                            {getTaskStatusIcon(task.status)}
                                            <span className="ml-1">{task.status.replace('_', ' ')}</span>
                                        </Badge>
                                        {task.priority && (
                                            <Badge className={getPriorityColor(task.priority)}>
                                                {task.priority}
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {task.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            {project && (
                                                <span className="truncate max-w-24">{project.title}</span>
                                            )}
                                            {job && (
                                                <span className="truncate max-w-24">{job.title}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {task.estimatedTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{task.estimatedTime}h</span>
                                                </div>
                                            )}

                                            {task.dueDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(task.dueDate.toDate(), 'MMM dd')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </Draggable>
        );
    };

    const TaskGroupColumn: React.FC<{ group: TaskGroup }> = ({ group }) => {
        const member = teamMembers.find(m => m.id === group.id);

        return (
            <div className="flex-1 min-w-80">
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            {group.id === 'unassigned' ? (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserX className="h-4 w-4 text-gray-600" />
                                </div>
                            ) : (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={member?.avatarUrl} />
                                    <AvatarFallback>
                                        {member?.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex-1">
                                <CardTitle className="text-lg">{group.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <Droppable droppableId={group.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`space-y-3 min-h-32 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                                        }`}
                                >
                                    {group.tasks.map((task, index) => (
                                        <TaskCard key={task.id} task={task} index={index} />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Task Assignment
                        </CardTitle>

                        {selectedTasks.size > 0 && (
                            <Button
                                onClick={() => setBulkAssignDialogOpen(true)}
                                variant="outline"
                            >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Assign {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <Select
                            value={sortBy}
                            onValueChange={(value: TaskSortOption) => setSortBy(value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dueDate">Due Date</SelectItem>
                                <SelectItem value="priority">Priority</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="assignee">Assignee</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? (
                                <SortAsc className="h-4 w-4" />
                            ) : (
                                <SortDesc className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Select
                            value={filters.status?.[0] || ''}
                            onValueChange={(value) => {
                                const newFilters = { ...filters };
                                if (value) {
                                    newFilters.status = [value as TaskStatus];
                                } else {
                                    delete newFilters.status;
                                }
                                setFilters(newFilters);
                                onFilterTasks(newFilters);
                            }}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                                <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
                                <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                                <SelectItem value={TaskStatus.ON_HOLD}>On Hold</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.priority?.[0] || ''}
                            onValueChange={(value) => {
                                const newFilters = { ...filters };
                                if (value) {
                                    newFilters.priority = [value];
                                } else {
                                    delete newFilters.priority;
                                }
                                setFilters(newFilters);
                                onFilterTasks(newFilters);
                            }}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Priority</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Task Assignment Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {taskGroups.map((group) => (
                        <TaskGroupColumn key={group.id} group={group} />
                    ))}
                </div>
            </DragDropContext>

            {/* Bulk Assign Dialog */}
            <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Assign Tasks</DialogTitle>
                        <DialogDescription>
                            Assign {selectedTasks.size} selected task{selectedTasks.size !== 1 ? 's' : ''} to a team member.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Select onValueChange={handleBulkAssign}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
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
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TaskAssignment;