import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Job, Project, TaskDependency } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { useProjects } from '@/contexts/ProjectsContext';
import TaskBar from './TaskBar';
import DependencyLine from './DependencyLine';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import { createProjectBaseline, getProjectBaselines, compareProjectWithBaseline } from '@/services/projectBaselineService';
import { getTaskResourceAssignments, createResourceAssignment, updateResourceAssignment, deleteResourceAssignment, performResourceLeveling } from '@/services/resourceService';
import { getAllUsers } from '@/services/userService';
import { exportProjectScheduleToPDF } from '@/utils/exportHelpers';
import { scheduleTemplateService, ScheduleTemplate } from '@/services/projectTemplateService';
import { scheduleNotificationService, ScheduleNotification, NotificationSettings } from '@/services/scheduleNotificationService';
import { undoRedoService, HistoryAction } from '@/services/undoRedoService';
import { commentsService, Comment } from '@/services/commentsService';

// Define action data types for undo/redo
interface TaskActionData {
    taskId?: string;
    oldData?: Partial<Task>;
    newData?: Partial<Task>;
}

interface GanttChartProps {
    projectId: string;
    tasks: Task[];
    jobs: Job[];
    dependencies: TaskDependency[];
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
    onTaskSelect?: (task: Task) => void;
    selectedTaskId?: string;
    height?: number;
    startDate?: Date;
    endDate?: Date;
    onDependencyCreate?: (dependency: Omit<TaskDependency, 'id' | 'createdAt' | 'updatedAt'>) => void;
    dependencyCreationMode?: boolean;
}

interface TimelineHeaderProps {
    startDate: Date;
    endDate: Date;
    dayWidth: number;
    scrollLeft: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
    startDate,
    endDate,
    dayWidth,
    scrollLeft
}) => {
    const months = useMemo(() => {
        const months = [];
        const current = new Date(startDate);
        current.setDate(1); // Start of month

        while (current <= endDate) {
            const monthStart = new Date(current);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const daysInMonth = monthEnd.getDate();

            months.push({
                name: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                start: monthStart,
                days: daysInMonth,
                width: daysInMonth * dayWidth
            });

            current.setMonth(current.getMonth() + 1);
        }

        return months;
    }, [startDate, endDate, dayWidth]);

    return (
        <div className="flex border-b bg-gray-50 sticky top-0 z-10">
            {/* Task name column */}
            <div className="w-64 border-r bg-white p-2 font-semibold text-sm">
                Tasks
            </div>

            {/* Timeline */}
            <div className="flex overflow-hidden" style={{ transform: `translateX(-${scrollLeft}px)` }}>
                {months.map((month, index) => (
                    <div
                        key={index}
                        className="border-r border-gray-300 flex-shrink-0"
                        style={{ width: month.width }}
                    >
                        <div className="p-2 text-center font-semibold text-sm bg-gray-100 border-b">
                            {month.name}
                        </div>
                        <div className="flex">
                            {Array.from({ length: month.days }, (_, i) => {
                                const date = new Date(month.start);
                                date.setDate(month.start.getDate() + i);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = date.toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 border-r border-gray-200 text-center text-xs py-1 ${isToday ? 'bg-blue-100 font-semibold' :
                                            isWeekend ? 'bg-gray-50' : 'bg-white'
                                            }`}
                                        style={{ width: dayWidth }}
                                    >
                                        {date.getDate()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GanttChart: React.FC<GanttChartProps> = ({
    projectId,
    tasks,
    jobs,
    dependencies,
    onTaskUpdate,
    onTaskSelect,
    selectedTaskId,
    height = 600,
    startDate,
    endDate,
    onDependencyCreate,
    dependencyCreationMode = false
}) => {
    const { getCriticalPath } = useProjects();
    const [scrollLeft, setScrollLeft] = useState(0);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);
    const [dependencyMode, setDependencyMode] = useState(dependencyCreationMode);
    const [selectedTasksForDependency, setSelectedTasksForDependency] = useState<Task[]>([]);
    const [dependencyDialogOpen, setDependencyDialogOpen] = useState(false);
    const [selectedDependencyType, setSelectedDependencyType] = useState<string>('FS');
    const [baselineDialogOpen, setBaselineDialogOpen] = useState(false);
    const [baselineName, setBaselineName] = useState('');
    const [baselineDescription, setBaselineDescription] = useState('');
    const [baselines, setBaselines] = useState<any[]>([]);
    const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
    const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');
    const [comparisonResult, setComparisonResult] = useState<any>(null);
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [selectedTaskForResources, setSelectedTaskForResources] = useState<Task | null>(null);
    const [resourceAssignments, setResourceAssignments] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [levelingDialogOpen, setLevelingDialogOpen] = useState(false);
    const [levelingResults, setLevelingResults] = useState<{
        leveledAssignments: any[];
        adjustments: Array<{
            originalAssignment: any;
            newAllocation: number;
            reason: string;
        }>;
    } | null>(null);
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
    const [taskProgress, setTaskProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [draggedPosition, setDraggedPosition] = useState<{ left: number; task: Task } | null>(null);
    const [progressMode, setProgressMode] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    // Comments mode state
    const [commentsMode, setCommentsMode] = useState(false);

    // Validation state
    const [validationResults, setValidationResults] = useState<{
        isValid: boolean;
        errors: Array<{
            type: string;
            message: string;
            taskId?: string;
            dependencyId?: string;
        }>;
        warnings: Array<{
            type: string;
            message: string;
            taskId?: string;
        }>;
    } | null>(null);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [taskFilters, setTaskFilters] = useState({
        assignee: 'all',
        status: 'all',
        criticalPath: false,
        dateRange: {
            start: null as Date | null,
            end: null as Date | null
        }
    });

    // Zoom state for timeline scaling
    const [zoomLevel, setZoomLevel] = useState<'days' | 'weeks' | 'months'>('days');

    // Schedule template state
    const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
    const [scheduleTemplateDialogOpen, setScheduleTemplateDialogOpen] = useState(false);
    const [selectedScheduleTemplate, setSelectedScheduleTemplate] = useState<ScheduleTemplate | null>(null);
    const [templateApplyDialogOpen, setTemplateApplyDialogOpen] = useState(false);

    // Schedule notifications state
    const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
    const [notificationSettingsDialogOpen, setNotificationSettingsDialogOpen] = useState(false);

    // Undo/Redo state
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [undoDescription, setUndoDescription] = useState<string | null>(null);
    const [redoDescription, setRedoDescription] = useState<string | null>(null);

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
    const [selectedItemForComments, setSelectedItemForComments] = useState<{ type: 'task' | 'job' | 'project'; id: string; title: string } | null>(null);
    const [newCommentContent, setNewCommentContent] = useState('');

    // Calculate critical path and update tasks with isCritical flag
    const [criticalTaskIds, setCriticalTaskIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadBaselines = async () => {
            try {
                const projectBaselines = await getProjectBaselines(projectId);
                setBaselines(projectBaselines);
            } catch (error) {
                console.error('Failed to load baselines:', error);
            }
        };

        if (projectId) {
            loadBaselines();
        }
    }, [projectId]);

    useEffect(() => {
        loadAvailableUsers();
    }, []);

    const loadAvailableUsers = async () => {
        try {
            const users = await getAllUsers();
            setAvailableUsers(users);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    useEffect(() => {
        const calculateCriticalPath = async () => {
            try {
                const criticalPathResult = await getCriticalPath(projectId);
                setCriticalTaskIds(new Set(criticalPathResult.tasks));
            } catch (error) {
                console.error('Failed to calculate critical path:', error);
                setCriticalTaskIds(new Set());
            }
        };

        if (projectId) {
            calculateCriticalPath();
        }
    }, [projectId, getCriticalPath]);

    // Load schedule templates
    useEffect(() => {
        const loadScheduleTemplates = async () => {
            try {
                // TODO: Get current user ID from auth context
                const userId = 'current-user-id'; // Replace with actual user ID
                const templates = await scheduleTemplateService.getScheduleTemplates(userId);
                setScheduleTemplates(templates);
            } catch (error) {
                console.error('Failed to load schedule templates:', error);
            }
        };

        loadScheduleTemplates();
    }, []);

    // Update undo/redo state
    useEffect(() => {
        const updateUndoRedoState = () => {
            setCanUndo(undoRedoService.canUndo(projectId));
            setCanRedo(undoRedoService.canRedo(projectId));
            setUndoDescription(undoRedoService.getUndoDescription(projectId));
            setRedoDescription(undoRedoService.getRedoDescription(projectId));
        };

        updateUndoRedoState();

        // Update state whenever tasks or dependencies change
        // This is a simple approach - in a real app, you'd track changes more precisely
        const interval = setInterval(updateUndoRedoState, 1000);
        return () => clearInterval(interval);
    }, [projectId, tasks, dependencies]);

    // Load notifications and settings
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const userId = 'current-user-id'; // TODO: Get from auth context
                const projectNotifications = await scheduleNotificationService.getProjectNotifications(projectId, userId);
                setNotifications(projectNotifications);

                const settings = await scheduleNotificationService.getNotificationSettings(userId, projectId);
                if (!settings) {
                    await scheduleNotificationService.createDefaultNotificationSettings(userId, projectId);
                    const newSettings = await scheduleNotificationService.getNotificationSettings(userId, projectId);
                    setNotificationSettings(newSettings);
                } else {
                    setNotificationSettings(settings);
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        };

        if (projectId) {
            loadNotifications();
        }
    }, [projectId]);

    // Load comments
    useEffect(() => {
        const loadComments = async () => {
            try {
                const projectComments = await commentsService.getProjectComments(projectId);
                setComments(projectComments);
            } catch (error) {
                console.error('Failed to load comments:', error);
            }
        };

        if (projectId) {
            loadComments();
        }
    }, [projectId]);

    const tasksWithCriticalPath = useMemo(() => {
        return tasks.map(task => ({
            ...task,
            isCritical: criticalTaskIds.has(task.id)
        }));
    }, [tasks, criticalTaskIds]);

    // Calculate date range if not provided
    const dateRange = useMemo(() => {
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }

        const allDates = tasksWithCriticalPath.flatMap(task => [
            task.startDate?.toDate(),
            task.endDate?.toDate()
        ]).filter(Boolean) as Date[];

        if (allDates.length === 0) {
            const today = new Date();
            return {
                start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
            };
        }

        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        return {
            start: new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
    }, [tasksWithCriticalPath, startDate, endDate]);

    const dayWidth = useMemo(() => {
        switch (zoomLevel) {
            case 'days':
                return 30; // pixels per day
            case 'weeks':
                return 150; // pixels per week
            case 'months':
                return 300; // pixels per month
            default:
                return 30;
        }
    }, [zoomLevel]);
    const totalWidth = ((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;

    // Group tasks by job for display (with filtering)
    const tasksByJob = useMemo(() => {
        // First apply filters to tasks
        let filteredTasks = tasksWithCriticalPath;

        // Assignee filter
        if (taskFilters.assignee !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.assignedToId === taskFilters.assignee);
        }

        // Status filter
        if (taskFilters.status !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === taskFilters.status);
        }

        // Critical path filter
        if (taskFilters.criticalPath) {
            filteredTasks = filteredTasks.filter(task => task.isCritical);
        }

        // Date range filter
        if (taskFilters.dateRange.start || taskFilters.dateRange.end) {
            filteredTasks = filteredTasks.filter(task => {
                const taskStart = task.startDate?.toDate();
                const taskEnd = task.endDate?.toDate();

                if (!taskStart || !taskEnd) return false;

                if (taskFilters.dateRange.start && taskEnd < taskFilters.dateRange.start) return false;
                if (taskFilters.dateRange.end && taskStart > taskFilters.dateRange.end) return false;

                return true;
            });
        }

        // Group filtered tasks by job
        const grouped: Record<string, Task[]> = {};
        filteredTasks.forEach(task => {
            const { jobId } = task;
            if (!grouped[jobId]) grouped[jobId] = [];
            grouped[jobId].push(task);
        });
        return grouped;
    }, [tasksWithCriticalPath, taskFilters]);

    const handleTaskClick = (task: Task) => {
        if (dependencyMode) {
            // In dependency creation mode, select tasks for dependency
            if (selectedTasksForDependency.length === 0) {
                setSelectedTasksForDependency([task]);
            } else if (selectedTasksForDependency.length === 1) {
                if (selectedTasksForDependency[0].id === task.id) {
                    // Deselect if clicking the same task
                    setSelectedTasksForDependency([]);
                } else {
                    // Select second task and show dependency dialog
                    setSelectedTasksForDependency([selectedTasksForDependency[0], task]);
                    setDependencyDialogOpen(true);
                }
            } else {
                // Reset selection if more than 2 tasks (shouldn't happen)
                setSelectedTasksForDependency([task]);
            }
        } else if (progressMode) {
            // In progress tracking mode, open progress dialog
            setSelectedTaskForProgress(task);
            setTaskProgress(task.progress || 0);
            setProgressDialogOpen(true);
        } else if (commentsMode) {
            // In comments mode, open comments dialog for the task
            handleOpenComments('task', task.id, task.title);
        } else {
            // Open resource assignment dialog
            setSelectedTaskForResources(task);
            loadTaskResources(task.id);
            setResourceDialogOpen(true);
        }
    };

    const cancelDependencyCreation = () => {
        setSelectedTasksForDependency([]);
        setDependencyDialogOpen(false);
        setSelectedDependencyType('FS');
    };

    const handleCreateDependency = () => {
        if (selectedTasksForDependency.length === 2 && onDependencyCreate) {
            const [predecessor, successor] = selectedTasksForDependency;
            onDependencyCreate({
                predecessorId: predecessor.id,
                successorId: successor.id,
                type: selectedDependencyType as 'FS' | 'SS' | 'FF' | 'SF',
                projectId,
                lag: 0,
                isActive: true
            });
            setSelectedTasksForDependency([]);
            setDependencyDialogOpen(false);
            setSelectedDependencyType('FS');
        }
    };

    const handleCreateBaseline = async () => {
        if (!baselineName.trim()) return;

        try {
            await createProjectBaseline(projectId, tasks, baselineName, baselineDescription);
            setBaselineDialogOpen(false);
            setBaselineName('');
            setBaselineDescription('');
            // Refresh baselines
            const projectBaselines = await getProjectBaselines(projectId);
            setBaselines(projectBaselines);
        } catch (error) {
            console.error('Failed to create baseline:', error);
        }
    };

    const handleCompareBaseline = async () => {
        if (!selectedBaselineId) return;

        try {
            const result = await compareProjectWithBaseline(projectId, selectedBaselineId, tasks);
            setComparisonResult(result);
        } catch (error) {
            console.error('Error comparing baseline:', error);
        }
    };

    const handleAddResourceAssignment = async (userId: string, allocationPercentage: number) => {
        if (!selectedTaskForResources) return;

        try {
            await createResourceAssignment({
                taskId: selectedTaskForResources.id,
                resourceId: userId,
                resourceType: 'user',
                allocationPercentage,
                startDate: selectedTaskForResources.startDate || Timestamp.now(),
                endDate: selectedTaskForResources.endDate || Timestamp.now(),
                isActive: true
            });
            await loadTaskResources(selectedTaskForResources.id);
        } catch (error) {
            console.error('Error adding resource assignment:', error);
        }
    };

    const handleUpdateResourceAssignment = async (assignmentId: string, allocationPercentage: number) => {
        try {
            await updateResourceAssignment(assignmentId, { allocationPercentage });
            if (selectedTaskForResources) {
                await loadTaskResources(selectedTaskForResources.id);
            }
        } catch (error) {
            console.error('Error updating resource assignment:', error);
        }
    };

    const handleRemoveResourceAssignment = async (assignmentId: string) => {
        try {
            await deleteResourceAssignment(assignmentId);
            if (selectedTaskForResources) {
                await loadTaskResources(selectedTaskForResources.id);
            }
        } catch (error) {
            console.error('Error removing resource assignment:', error);
        }
    };

    const handleResourceLeveling = async () => {
        try {
            const results = await performResourceLeveling(projectId, tasks);
            setLevelingResults(results);
            setLevelingDialogOpen(true);

            // Apply the leveled assignments
            for (const adjustment of results.adjustments) {
                await updateResourceAssignment(adjustment.originalAssignment.id, {
                    allocationPercentage: adjustment.newAllocation
                });
            }

            // Refresh resource assignments if dialog is open
            if (resourceDialogOpen && selectedTaskForResources) {
                await loadTaskResources(selectedTaskForResources.id);
            }
        } catch (error) {
            console.error('Error performing resource leveling:', error);
        }
    };

    const handleUpdateProgress = async () => {
        if (!selectedTaskForProgress) return;

        try {
            await onTaskUpdate?.(selectedTaskForProgress.id, { progress: taskProgress });
            setProgressDialogOpen(false);
            setSelectedTaskForProgress(null);
            setTaskProgress(0);
        } catch (error) {
            console.error('Error updating task progress:', error);
        }
    };

    // Schedule template handlers
    const handleApplyScheduleTemplate = async () => {
        if (!selectedScheduleTemplate) return;

        try {
            const startDate = new Date(); // Use current date as start date
            await scheduleTemplateService.applyScheduleTemplate(selectedScheduleTemplate.id, projectId, startDate);
            setTemplateApplyDialogOpen(false);
            setSelectedScheduleTemplate(null);
            // TODO: Refresh the project data to show the applied template
        } catch (error) {
            console.error('Error applying schedule template:', error);
        }
    };

    // Schedule notification handlers
    const handleMarkNotificationAsRead = async (notificationId: string) => {
        try {
            await scheduleNotificationService.markAsRead(notificationId);
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkNotificationAsResolved = async (notificationId: string) => {
        try {
            await scheduleNotificationService.markAsResolved(notificationId);
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, isResolved: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as resolved:', error);
        }
    };

    const handleUpdateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
        try {
            const userId = 'current-user-id'; // TODO: Get from auth context
            await scheduleNotificationService.updateNotificationSettings(userId, projectId, settings);
            const updatedSettings = await scheduleNotificationService.getNotificationSettings(userId, projectId);
            setNotificationSettings(updatedSettings);
        } catch (error) {
            console.error('Error updating notification settings:', error);
        }
    };

    const handleCheckScheduleNotifications = async () => {
        try {
            await scheduleNotificationService.checkScheduleAndNotify(projectId, tasks, dependencies);
            // Refresh notifications
            const userId = 'current-user-id';
            const projectNotifications = await scheduleNotificationService.getProjectNotifications(projectId, userId);
            setNotifications(projectNotifications);
        } catch (error) {
            console.error('Error checking schedule notifications:', error);
        }
    };

    // Comments handlers
    const handleOpenComments = async (type: 'task' | 'job' | 'project', id: string, title: string) => {
        setSelectedItemForComments({ type, id, title });
        setCommentsDialogOpen(true);

        try {
            let itemComments: Comment[] = [];
            if (type === 'task') {
                itemComments = await commentsService.getTaskComments(projectId, id);
            } else if (type === 'job') {
                itemComments = await commentsService.getJobComments(projectId, id);
            } else {
                // For project comments, filter from all comments
                itemComments = comments.filter(c => !c.taskId && !c.jobId);
            }
            setComments(itemComments);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (!selectedItemForComments || !newCommentContent.trim()) return;

        try {
            const userId = 'current-user-id'; // TODO: Get from auth context
            const userName = 'Current User'; // TODO: Get from auth context
            const userEmail = 'user@example.com'; // TODO: Get from auth context

            const commentData: any = {
                projectId,
                userId,
                userName,
                userEmail,
                content: newCommentContent.trim()
            };

            if (selectedItemForComments.type === 'task') {
                commentData.taskId = selectedItemForComments.id;
            } else if (selectedItemForComments.type === 'job') {
                commentData.jobId = selectedItemForComments.id;
            }

            await commentsService.createComment(commentData);
            setNewCommentContent('');

            // Refresh comments
            const updatedComments = await commentsService.getProjectComments(projectId);
            setComments(updatedComments);
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await commentsService.deleteComment(commentId);
            // Refresh comments
            const updatedComments = await commentsService.getProjectComments(projectId);
            setComments(updatedComments);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    // Undo/Redo handlers
    const handleUndo = async () => {
        try {
            const action = await undoRedoService.undo(projectId);
            if (action) {
                // Execute undo operation based on action type
                await executeAction(action, 'undo');
                console.log('Undid action:', action.description);
            }
        } catch (error) {
            console.error('Error performing undo:', error);
        }
    };

    const handleRedo = async () => {
        try {
            const action = await undoRedoService.redo(projectId);
            if (action) {
                // Execute redo operation based on action type
                await executeAction(action, 'redo');
                console.log('Redid action:', action.description);
            }
        } catch (error) {
            console.error('Error performing redo:', error);
        }
    };

    // Execute action for undo/redo
    const executeAction = async (action: HistoryAction, operation: 'undo' | 'redo') => {
        switch (action.type) {
            case 'TASK_UPDATE':
                const taskData = action.data as TaskActionData;
                const dataToApply = operation === 'undo' ? taskData.oldData : taskData.newData;
                if (dataToApply && taskData.taskId) {
                    onTaskUpdate?.(taskData.taskId, dataToApply);

                    // Recalculate schedule for dependent tasks
                    const task = tasks.find(t => t.id === taskData.taskId);
                    if (task) {
                        const updatedTask = { ...task, ...dataToApply };
                        await recalculateSchedule(taskData.taskId, updatedTask);
                    }
                }
                break;
            default:
                console.warn('Action execution not implemented for type:', action.type);
        }
    };

    // Schedule recalculation function
    const recalculateSchedule = async (updatedTaskId: string, updatedTask: Task) => {
        // Find all dependencies where the updated task is a predecessor
        const affectedDependencies = dependencies.filter(dep => dep.predecessorId === updatedTaskId);

        if (affectedDependencies.length === 0) return;

        // Create a map of task ID to task for quick lookup
        const taskMap = new Map(tasks.map(task => [task.id, task]));

        // Process each affected dependency
        for (const dependency of affectedDependencies) {
            const successor = taskMap.get(dependency.successorId);
            if (!successor) continue;

            let newStartDate: Date | null = null;
            let newEndDate: Date | null = null;

            const predecessorStart = updatedTask.startDate?.toDate();
            const predecessorEnd = updatedTask.endDate?.toDate();
            const successorDuration = successor.duration || 1;

            if (!predecessorStart || !predecessorEnd) continue;

            switch (dependency.type) {
                case 'FS': // Finish to Start - successor starts after predecessor finishes
                    newStartDate = new Date(predecessorEnd.getTime() + (dependency.lag || 0) * 24 * 60 * 60 * 1000);
                    newEndDate = new Date(newStartDate.getTime() + successorDuration * 24 * 60 * 60 * 1000);
                    break;

                case 'SS': // Start to Start - successor starts when predecessor starts
                    newStartDate = new Date(predecessorStart.getTime() + (dependency.lag || 0) * 24 * 60 * 60 * 1000);
                    newEndDate = new Date(newStartDate.getTime() + successorDuration * 24 * 60 * 60 * 1000);
                    break;

                case 'FF': // Finish to Finish - successor finishes when predecessor finishes
                    newEndDate = new Date(predecessorEnd.getTime() + (dependency.lag || 0) * 24 * 60 * 60 * 1000);
                    newStartDate = new Date(newEndDate.getTime() - successorDuration * 24 * 60 * 60 * 1000);
                    break;

                case 'SF': // Start to Finish - successor finishes when predecessor starts
                    newEndDate = new Date(predecessorStart.getTime() + (dependency.lag || 0) * 24 * 60 * 60 * 1000);
                    newStartDate = new Date(newEndDate.getTime() - successorDuration * 24 * 60 * 60 * 1000);
                    break;
            }

            if (newStartDate && newEndDate) {
                // Update the successor task
                await onTaskUpdate?.(successor.id, {
                    startDate: Timestamp.fromDate(newStartDate),
                    endDate: Timestamp.fromDate(newEndDate)
                });

                // Recursively recalculate for tasks that depend on this successor
                await recalculateSchedule(successor.id, {
                    ...successor,
                    startDate: Timestamp.fromDate(newStartDate),
                    endDate: Timestamp.fromDate(newEndDate)
                });
            }
        }
    };

    // Schedule validation function
    const validateSchedule = (taskList: Task[], dependencyList: TaskDependency[]): {
        isValid: boolean;
        errors: Array<{
            type: 'circular_dependency' | 'negative_float' | 'resource_conflict' | 'date_conflict';
            message: string;
            taskId?: string;
            dependencyId?: string;
        }>;
        warnings: Array<{
            type: 'tight_schedule' | 'resource_overload';
            message: string;
            taskId?: string;
        }>;
    } => {
        const errors: Array<{
            type: 'circular_dependency' | 'negative_float' | 'resource_conflict' | 'date_conflict';
            message: string;
            taskId?: string;
            dependencyId?: string;
        }> = [];

        const warnings: Array<{
            type: 'tight_schedule' | 'resource_overload';
            message: string;
            taskId?: string;
        }> = [];

        // Check for circular dependencies
        const detectCircularDependencies = () => {
            const visited = new Set<string>();
            const recursionStack = new Set<string>();

            const hasCycle = (taskId: string): boolean => {
                if (recursionStack.has(taskId)) return true;
                if (visited.has(taskId)) return false;

                visited.add(taskId);
                recursionStack.add(taskId);

                // Find all successors of this task
                const successors = dependencyList
                    .filter(dep => dep.predecessorId === taskId)
                    .map(dep => dep.successorId);

                for (const successorId of successors) {
                    if (hasCycle(successorId)) {
                        return true;
                    }
                }

                recursionStack.delete(taskId);
                return false;
            };

            for (const task of taskList) {
                if (!visited.has(task.id) && hasCycle(task.id)) {
                    errors.push({
                        type: 'circular_dependency',
                        message: 'Circular dependency detected in the schedule',
                        taskId: task.id
                    });
                    break; // Only report one circular dependency
                }
            }
        };

        // Check for negative float (tasks that can't meet their deadlines)
        const checkNegativeFloat = () => {
            for (const task of taskList) {
                const taskStart = task.startDate?.toDate();
                const taskEnd = task.endDate?.toDate();
                const dueDate = task.dueDate?.toDate();

                if (taskStart && taskEnd && dueDate && taskEnd > dueDate) {
                    errors.push({
                        type: 'negative_float',
                        message: `Task "${task.title}" cannot be completed by its due date`,
                        taskId: task.id
                    });
                }

                // Check for tight schedules (less than 1 day float)
                if (task.float !== undefined && task.float < 1) {
                    warnings.push({
                        type: 'tight_schedule',
                        message: `Task "${task.title}" has very little schedule flexibility (${task.float} days)`,
                        taskId: task.id
                    });
                }
            }
        };

        // Check for date conflicts (overlapping tasks with same resources)
        const checkDateConflicts = () => {
            const taskMap = new Map(taskList.map(task => [task.id, task]));

            for (const dependency of dependencyList) {
                const predecessor = taskMap.get(dependency.predecessorId);
                const successor = taskMap.get(dependency.successorId);

                if (!predecessor || !successor) continue;

                const predEnd = predecessor.endDate?.toDate();
                const succStart = successor.startDate?.toDate();

                if (predEnd && succStart) {
                    if (dependency.type === 'FS' && succStart < predEnd) {
                        errors.push({
                            type: 'date_conflict',
                            message: `Task "${successor.title}" starts before "${predecessor.title}" finishes`,
                            taskId: successor.id,
                            dependencyId: dependency.id
                        });
                    }
                }
            }
        };

        // Run all validation checks
        detectCircularDependencies();
        checkNegativeFloat();
        checkDateConflicts();

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    };

    const loadTaskResources = async (taskId: string) => {
        try {
            const assignments = await getTaskResourceAssignments(taskId);
            setResourceAssignments(assignments);
        } catch (error) {
            console.error('Failed to load task resources:', error);
        }
    };

    const handleExportToPDF = async () => {
        try {
            // Get project name from context or use default
            const projectName = 'Project Schedule'; // TODO: Get from project context

            await exportProjectScheduleToPDF(
                projectName,
                tasks,
                dependencies,
                [], // TODO: Get resource assignments
                dateRange.start,
                dateRange.end
            );
        } catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, task: Task) => {
        if (dependencyMode) return;
        setDraggedTask(task);
        setIsDragging(true);
        const rect = chartRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset(e.clientX - rect.left - ((task.startDate?.toDate().getTime() || 0) - dateRange.start.getTime()) / (1000 * 60 * 60 * 24) * dayWidth);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedTask || !chartRef.current) return;

        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft - dragOffset;
        const daysOffset = Math.round(x / dayWidth);

        const newStartDate = new Date(dateRange.start);
        newStartDate.setDate(newStartDate.getDate() + daysOffset);

        // Set visual position
        const left = Math.max(0, (newStartDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24) * dayWidth);
        setDraggedPosition({ left, task: draggedTask });
    };

    const handleMouseUp = async (e: React.MouseEvent) => {
        if (!isDragging || !draggedTask || !chartRef.current) {
            setIsDragging(false);
            setDraggedTask(null);
            setDraggedPosition(null);
            return;
        }

        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft - dragOffset;
        const daysOffset = Math.round(x / dayWidth);

        const newStartDate = new Date(dateRange.start);
        newStartDate.setDate(newStartDate.getDate() + daysOffset);

        const duration = draggedTask.duration || 1;
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + duration);

        // Capture old data for undo/redo
        const oldData = {
            startDate: draggedTask.startDate,
            endDate: draggedTask.endDate
        };

        const newData = {
            startDate: Timestamp.fromDate(newStartDate),
            endDate: Timestamp.fromDate(newEndDate)
        };

        // Record action before making changes
        undoRedoService.recordAction(
            projectId,
            'TASK_UPDATE',
            'current-user-id', // TODO: Get from auth context
            'Current User', // TODO: Get from auth context
            `Moved task "${draggedTask.title}"`,
            {
                taskId: draggedTask.id,
                oldData,
                newData
            }
        );

        onTaskUpdate?.(draggedTask.id, newData);

        // Recalculate schedule for dependent tasks
        const updatedTask = {
            ...draggedTask,
            ...newData
        };
        await recalculateSchedule(draggedTask.id, updatedTask);

        setIsDragging(false);
        setDraggedTask(null);
        setDragOffset(0);
        setDraggedPosition(null);
    };

    const handleResizeStart = (e: React.MouseEvent, task: Task, direction: 'left' | 'right') => {
        e.stopPropagation();
        setResizeDirection(direction);
        setDraggedTask(task);
    };

    const handleResizeEnd = async (e: React.MouseEvent) => {
        if (!draggedTask || !resizeDirection || !chartRef.current) return;

        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft;
        const daysOffset = Math.round(x / dayWidth);

        const newDate = new Date(dateRange.start);
        newDate.setDate(newDate.getDate() + daysOffset);

        // Capture old data for undo/redo
        const oldData = {
            startDate: draggedTask.startDate,
            endDate: draggedTask.endDate
        };

        let newData: any = {};
        let description = '';

        if (resizeDirection === 'left') {
            newData = { startDate: Timestamp.fromDate(newDate) };
            description = `Resized start date of task "${draggedTask.title}"`;
        } else {
            newData = { endDate: Timestamp.fromDate(newDate) };
            description = `Resized end date of task "${draggedTask.title}"`;
        }

        // Record action before making changes
        undoRedoService.recordAction(
            projectId,
            'TASK_UPDATE',
            'current-user-id', // TODO: Get from auth context
            'Current User', // TODO: Get from auth context
            description,
            {
                taskId: draggedTask.id,
                oldData,
                newData
            }
        );

        onTaskUpdate?.(draggedTask.id, newData);

        // Recalculate schedule for dependent tasks
        const updatedTask = { ...draggedTask, ...newData };
        await recalculateSchedule(draggedTask.id, updatedTask);

        setDraggedTask(null);
        setResizeDirection(null);
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            {/* Dependency Creation Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <Button
                        variant={dependencyMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDependencyMode(!dependencyMode)}
                        className="flex items-center gap-2"
                    >
                        <Link className="w-4 h-4" />
                        {dependencyMode ? 'Exit Dependency Mode' : 'Create Dependencies'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBaselineDialogOpen(true)}
                        className="flex items-center gap-2"
                    >
                        📊 Create Baseline
                    </Button>
                    {baselines.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setComparisonDialogOpen(true)}
                            className="flex items-center gap-2"
                        >
                            📈 Compare Baseline
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResourceLeveling}
                        className="flex items-center gap-2"
                    >
                        ⚖️ Level Resources
                    </Button>
                    <Button
                        variant={progressMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setProgressMode(!progressMode);
                            if (!progressMode) {
                                setDependencyMode(false);
                                setCommentsMode(false);
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        📊 {progressMode ? 'Exit Progress Mode' : 'Track Progress'}
                    </Button>
                    <Button
                        variant={commentsMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setCommentsMode(!commentsMode);
                            if (!commentsMode) {
                                setDependencyMode(false);
                                setProgressMode(false);
                            }
                        }}
                        className="flex items-center gap-2"
                    >
                        💬 {commentsMode ? 'Exit Comments Mode' : 'View Comments'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const results = validateSchedule(tasks, dependencies);
                            setValidationResults(results);
                            setValidationDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                    >
                        ✅ Validate Schedule
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToPDF}
                        className="flex items-center gap-2"
                    >
                        📄 Export PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleTemplateDialogOpen(true)}
                        className="flex items-center gap-2"
                    >
                        📋 Schedule Templates
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNotificationsDialogOpen(true)}
                        className="flex items-center gap-2"
                    >
                        🔔 Notifications
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                                {notifications.filter(n => !n.isRead).length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenComments('project', projectId, 'Project')}
                        className="flex items-center gap-2"
                    >
                        💬 Comments
                        {comments.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                                {comments.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title={undoDescription || 'Undo last action'}
                        className="flex items-center gap-2"
                    >
                        ↶ Undo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title={redoDescription || 'Redo last undone action'}
                        className="flex items-center gap-2"
                    >
                        ↷ Redo
                    </Button>

                    {/* Task Filters */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Filters
                                {(taskFilters.assignee !== 'all' || taskFilters.status !== 'all' || taskFilters.criticalPath || taskFilters.dateRange.start || taskFilters.dateRange.end) && (
                                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                                        !
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-4">
                                <h4 className="font-medium">Filter Tasks</h4>

                                {/* Assignee Filter */}
                                <div className="space-y-2">
                                    <Label>Assignee</Label>
                                    <Select
                                        value={taskFilters.assignee}
                                        onValueChange={(value) => setTaskFilters(prev => ({ ...prev, assignee: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Assignees</SelectItem>
                                            {availableUsers.map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={taskFilters.status}
                                        onValueChange={(value) => setTaskFilters(prev => ({ ...prev, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="TODO">To Do</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="REVIEW">Review</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Critical Path Filter */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="critical-path"
                                        checked={taskFilters.criticalPath}
                                        onChange={(e) => setTaskFilters(prev => ({ ...prev, criticalPath: e.target.checked }))}
                                        className="rounded"
                                    />
                                    <Label htmlFor="critical-path">Critical Path Only</Label>
                                </div>

                                {/* Date Range Filter */}
                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {taskFilters.dateRange.start ? taskFilters.dateRange.start.toLocaleDateString() : "Start Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={taskFilters.dateRange.start || undefined}
                                                    onSelect={(date) => setTaskFilters(prev => ({
                                                        ...prev,
                                                        dateRange: { ...prev.dateRange, start: date || null }
                                                    }))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {taskFilters.dateRange.end ? taskFilters.dateRange.end.toLocaleDateString() : "End Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={taskFilters.dateRange.end || undefined}
                                                    onSelect={(date) => setTaskFilters(prev => ({
                                                        ...prev,
                                                        dateRange: { ...prev.dateRange, end: date || null }
                                                    }))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTaskFilters({
                                        assignee: 'all',
                                        status: 'all',
                                        criticalPath: false,
                                        dateRange: { start: null, end: null }
                                    })}
                                    className="w-full"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 border-l pl-2 ml-2">
                        <span className="text-xs text-gray-500 mr-2">Zoom:</span>
                        <Button
                            variant={zoomLevel === 'days' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setZoomLevel('days')}
                            className="px-2 py-1 text-xs"
                        >
                            Days
                        </Button>
                        <Button
                            variant={zoomLevel === 'weeks' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setZoomLevel('weeks')}
                            className="px-2 py-1 text-xs"
                        >
                            Weeks
                        </Button>
                        <Button
                            variant={zoomLevel === 'months' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setZoomLevel('months')}
                            className="px-2 py-1 text-xs"
                        >
                            Months
                        </Button>
                    </div>

                    {dependencyMode && (
                        <div className="text-sm text-gray-600">
                            Click on two tasks to create a dependency between them
                        </div>
                    )}
                </div>
                {selectedTasksForDependency.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            {selectedTasksForDependency.length}/2 tasks selected
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelDependencyCreation}
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            <TimelineHeader
                startDate={dateRange.start}
                endDate={dateRange.end}
                dayWidth={dayWidth}
                scrollLeft={scrollLeft}
            />

            <div
                ref={chartRef}
                className="relative overflow-auto"
                style={{ height: `${height - 60}px` }}
                onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // In case mouse leaves the area
            >
                <div style={{ width: `${totalWidth + 256}px`, minHeight: '100%' }}>
                    {/* Task rows */}
                    {Object.entries(tasksByJob).map(([jobId, jobTasks]) => {
                        const job = jobs.find(j => j.id === jobId);
                        return (
                            <div key={jobId} className="flex border-b">
                                {/* Job/Task name column */}
                                <div className="w-64 border-r bg-white p-2">
                                    <div className="font-semibold text-sm text-gray-800">
                                        {job?.title || 'Unknown Job'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {jobTasks.length} task{jobTasks.length !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Timeline area */}
                                <div className="flex-1 relative" style={{ height: `${jobTasks.length * 40 + 20}px` }}>
                                    {/* Grid lines */}
                                    <div className="absolute inset-0">
                                        {Array.from({ length: Math.ceil(totalWidth / dayWidth) }, (_, i) => (
                                            <div
                                                key={i}
                                                className="absolute top-0 bottom-0 border-r border-gray-100"
                                                style={{ left: `${i * dayWidth}px`, width: '1px' }}
                                            />
                                        ))}
                                    </div>

                                    {/* Task bars */}
                                    {jobTasks.map((task, index) => (
                                        <TaskBar
                                            key={task.id}
                                            task={task}
                                            job={job}
                                            startDate={dateRange.start}
                                            dayWidth={dayWidth}
                                            isSelected={selectedTaskId === task.id}
                                            isCritical={task.isCritical || false}
                                            progress={task.progress || 0}
                                            isDependencySelected={selectedTasksForDependency.some(t => t.id === task.id)}
                                            onClick={() => handleTaskClick(task)}
                                            onMouseDown={(e) => handleMouseDown(e, task)}
                                            onResizeStart={(e, direction) => handleResizeStart(e, task, direction)}
                                        />
                                    ))}

                                    {/* Dragged task ghost */}
                                    {isDragging && draggedPosition && jobTasks.some(t => t.id === draggedPosition.task.id) && (
                                        <div
                                            className="absolute top-1 h-6 bg-blue-300 opacity-50 rounded border-2 border-blue-500 pointer-events-none"
                                            style={{
                                                left: `${draggedPosition.left}px`,
                                                width: `${Math.max(dayWidth * 0.5, (draggedPosition.task.endDate?.toDate().getTime() || 0) - (draggedPosition.task.startDate?.toDate().getTime() || 0)) / (1000 * 60 * 60 * 24) * dayWidth}px`,
                                                zIndex: 50
                                            }}
                                        />
                                    )}

                                    {/* Dependency lines */}
                                    {dependencies
                                        .filter(dep => jobTasks.some(t => t.id === dep.predecessorId || t.id === dep.successorId))
                                        .map((dep, depIndex) => {
                                            const predecessorIndex = jobTasks.findIndex(t => t.id === dep.predecessorId);
                                            const successorIndex = jobTasks.findIndex(t => t.id === dep.successorId);
                                            const predecessorY = predecessorIndex * 40 + 20;
                                            const successorY = successorIndex * 40 + 20;

                                            return (
                                                <DependencyLine
                                                    key={dep.id}
                                                    dependency={dep}
                                                    tasks={tasksWithCriticalPath}
                                                    startDate={dateRange.start}
                                                    dayWidth={dayWidth}
                                                    predecessorY={predecessorY}
                                                    successorY={successorY}
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dependency Creation Dialog */}
            <Dialog open={dependencyDialogOpen} onOpenChange={setDependencyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Task Dependency</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Selected Tasks:</label>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                    <Badge variant="secondary">Predecessor</Badge>
                                    <span className="text-sm">{selectedTasksForDependency[0]?.title}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                    <Badge variant="secondary">Successor</Badge>
                                    <span className="text-sm">{selectedTasksForDependency[1]?.title}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dependency Type:</label>
                            <Select value={selectedDependencyType} onValueChange={setSelectedDependencyType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FS">Finish to Start (FS) - Successor starts after predecessor finishes</SelectItem>
                                    <SelectItem value="SS">Start to Start (SS) - Successor starts when predecessor starts</SelectItem>
                                    <SelectItem value="FF">Finish to Finish (FF) - Successor finishes when predecessor finishes</SelectItem>
                                    <SelectItem value="SF">Start to Finish (SF) - Successor finishes when predecessor starts</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={cancelDependencyCreation}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateDependency}>
                                Create Dependency
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Baseline Creation Dialog */}
            <Dialog open={baselineDialogOpen} onOpenChange={setBaselineDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Project Baseline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="baseline-name">Baseline Name</Label>
                            <Input
                                id="baseline-name"
                                value={baselineName}
                                onChange={(e) => setBaselineName(e.target.value)}
                                placeholder="e.g., Initial Plan, Phase 1 Complete"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="baseline-description">Description (Optional)</Label>
                            <Input
                                id="baseline-description"
                                value={baselineDescription}
                                onChange={(e) => setBaselineDescription(e.target.value)}
                                placeholder="Additional notes about this baseline"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBaselineDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateBaseline} disabled={!baselineName.trim()}>
                                Create Baseline
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Baseline Comparison Dialog */}
            <Dialog open={comparisonDialogOpen} onOpenChange={setComparisonDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Baseline Comparison</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {!comparisonResult ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Baseline to Compare</Label>
                                    <Select value={selectedBaselineId} onValueChange={setSelectedBaselineId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a baseline" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {baselines.map((baseline) => (
                                                <SelectItem key={baseline.id} value={baseline.id}>
                                                    {baseline.name} ({baseline.createdAt.toDate().toLocaleDateString()})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setComparisonDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCompareBaseline} disabled={!selectedBaselineId}>
                                        Compare
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded">
                                        <h4 className="font-semibold">Schedule Variance</h4>
                                        <p className="text-2xl font-bold">{comparisonResult.variances.scheduleVariance} days</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded">
                                        <h4 className="font-semibold">Cost Variance</h4>
                                        <p className="text-2xl font-bold">${comparisonResult.variances.costVariance}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Task Variances</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                        {comparisonResult.variances.taskVariances.map((variance: any) => (
                                            <div key={variance.taskId} className="flex justify-between p-2 border-b">
                                                <span>{tasks.find(t => t.id === variance.taskId)?.title || 'Unknown Task'}</span>
                                                <div className="text-sm">
                                                    <span className={variance.startVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                                                        {variance.startVariance} days
                                                    </span>
                                                    {' / '}
                                                    <span className={variance.costVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                                                        ${variance.costVariance}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={() => { setComparisonResult(null); setSelectedBaselineId(''); }}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resource Assignment Dialog */}
            <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Resource Assignment - {selectedTaskForResources?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Current Assignments</h4>
                            {resourceAssignments.length === 0 ? (
                                <p className="text-sm text-gray-500">No resources assigned to this task.</p>
                            ) : (
                                <div className="space-y-2">
                                    {resourceAssignments.map((assignment) => {
                                        const user = availableUsers.find(u => u.id === assignment.resourceId);
                                        return (
                                            <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <span className="font-medium">{user?.name || 'Unknown User'}</span>
                                                    <span className="text-sm text-gray-500 ml-2">
                                                        {assignment.allocationPercentage}% allocation
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={assignment.allocationPercentage}
                                                        onChange={(e) => handleUpdateResourceAssignment(assignment.id, parseInt(e.target.value))}
                                                        className="w-20"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRemoveResourceAssignment(assignment.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold">Add New Assignment</h4>
                            <div className="flex gap-2">
                                <Select onValueChange={(userId) => {
                                    const user = availableUsers.find(u => u.id === userId);
                                    if (user) {
                                        handleAddResourceAssignment(userId, 100);
                                    }
                                }}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers
                                            .filter(user => !resourceAssignments.some(a => a.resourceId === user.id))
                                            .map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setResourceDialogOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resource Leveling Results Dialog */}
            <Dialog open={levelingDialogOpen} onOpenChange={setLevelingDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Resource Leveling Results</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {levelingResults ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded">
                                    <h4 className="font-semibold">Leveling Summary</h4>
                                    <p className="text-sm text-gray-600">
                                        {levelingResults.adjustments.length === 0
                                            ? "No resource conflicts were found. All resources are properly allocated."
                                            : `${levelingResults.adjustments.length} adjustment${levelingResults.adjustments.length !== 1 ? 's' : ''} made to resolve over-allocations.`
                                        }
                                    </p>
                                </div>

                                {levelingResults.adjustments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Adjustments Made</h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {levelingResults.adjustments.map((adjustment, index) => {
                                                const task = tasks.find(t => t.id === adjustment.originalAssignment.taskId);
                                                const user = availableUsers.find(u => u.id === adjustment.originalAssignment.resourceId);
                                                return (
                                                    <div key={index} className="p-3 border rounded bg-yellow-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="font-medium">{user?.name || 'Unknown User'}</span>
                                                                <span className="text-sm text-gray-600 ml-2">
                                                                    on "{task?.title || 'Unknown Task'}"
                                                                </span>
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="text-red-600">{adjustment.originalAssignment.allocationPercentage}%</span>
                                                                <span className="mx-1">→</span>
                                                                <span className="text-green-600">{adjustment.newAllocation}%</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{adjustment.reason}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button onClick={() => setLevelingDialogOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No leveling results available.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Progress Tracking Dialog */}
            <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Task Progress - {selectedTaskForProgress?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="progress">Progress (%)</Label>
                            <div className="space-y-2">
                                <Input
                                    id="progress"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taskProgress}
                                    onChange={(e) => setTaskProgress(parseInt(e.target.value) || 0)}
                                    className="w-full"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={taskProgress}
                                        onChange={(e) => setTaskProgress(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-medium w-12">{taskProgress}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={selectedTaskForProgress?.status || 'TODO'}
                                onValueChange={(status) => {
                                    if (selectedTaskForProgress) {
                                        onTaskUpdate?.(selectedTaskForProgress.id, { status: status as any });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="REVIEW">Review</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateProgress}>
                                Update Progress
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Validation Dialog */}
            <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Schedule Validation Results</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {validationResults ? (
                            <div className="space-y-4">
                                <div className={`p-4 rounded ${validationResults.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <h4 className="font-semibold flex items-center gap-2">
                                        {validationResults.isValid ? '✅ Schedule is Valid' : '❌ Schedule Issues Found'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {validationResults.isValid
                                            ? 'No scheduling conflicts or constraint violations detected.'
                                            : `${validationResults.errors.length} error${validationResults.errors.length !== 1 ? 's' : ''} and ${validationResults.warnings.length} warning${validationResults.warnings.length !== 1 ? 's' : ''} found.`
                                        }
                                    </p>
                                </div>

                                {validationResults.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-red-600">Errors (Must Fix)</h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {validationResults.errors.map((error, index) => (
                                                <div key={index} className="p-3 border border-red-200 rounded bg-red-50">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-red-600 font-bold">•</span>
                                                        <div>
                                                            <span className="font-medium text-red-800">{error.type.replace('_', ' ').toUpperCase()}</span>
                                                            <p className="text-sm text-red-700 mt-1">{error.message}</p>
                                                            {error.taskId && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Task: {tasks.find(t => t.id === error.taskId)?.title || 'Unknown'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {validationResults.warnings.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-yellow-600">Warnings (Consider Fixing)</h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {validationResults.warnings.map((warning, index) => (
                                                <div key={index} className="p-3 border border-yellow-200 rounded bg-yellow-50">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-yellow-600 font-bold">•</span>
                                                        <div>
                                                            <span className="font-medium text-yellow-800">{warning.type.replace('_', ' ').toUpperCase()}</span>
                                                            <p className="text-sm text-yellow-700 mt-1">{warning.message}</p>
                                                            {warning.taskId && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Task: {tasks.find(t => t.id === warning.taskId)?.title || 'Unknown'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button onClick={() => setValidationDialogOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No validation results available.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Templates Dialog */}
            <Dialog open={scheduleTemplateDialogOpen} onOpenChange={setScheduleTemplateDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Schedule Templates</DialogTitle>
                        <p className="text-sm text-gray-600">Apply reusable schedule templates to your project</p>
                    </DialogHeader>
                    <div className="space-y-4">
                        {scheduleTemplates.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No schedule templates available.</p>
                                <p className="text-sm text-gray-400 mt-2">Create templates from existing projects to reuse schedules.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {scheduleTemplates.map((template) => (
                                    <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold">{template.name}</h4>
                                            <Badge variant="secondary">{template.category}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <div>Duration: {template.estimatedDuration} days</div>
                                            <div>Jobs: {template.jobTemplates.length}</div>
                                            <div>Created: {template.createdAt.toDate().toLocaleDateString()}</div>
                                        </div>
                                        <Button
                                            className="w-full mt-3"
                                            onClick={() => {
                                                setSelectedScheduleTemplate(template);
                                                setTemplateApplyDialogOpen(true);
                                            }}
                                        >
                                            Apply Template
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={() => setScheduleTemplateDialogOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Apply Template Confirmation Dialog */}
            <Dialog open={templateApplyDialogOpen} onOpenChange={setTemplateApplyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply Schedule Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedScheduleTemplate && (
                            <div className="space-y-2">
                                <p>Are you sure you want to apply the template <strong>"{selectedScheduleTemplate.name}"</strong> to this project?</p>
                                <p className="text-sm text-gray-600">
                                    This will create {selectedScheduleTemplate.jobTemplates.length} job{selectedScheduleTemplate.jobTemplates.length !== 1 ? 's' : ''} with their associated tasks and dependencies.
                                </p>
                                <div className="bg-yellow-50 p-3 rounded border">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> This action will add new jobs and tasks to your project. Existing tasks will not be affected.
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setTemplateApplyDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleApplyScheduleTemplate}>
                                Apply Template
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Schedule Notifications Dialog */}
            <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Schedule Notifications</DialogTitle>
                        <div className="flex gap-2">
                            <Button onClick={handleCheckScheduleNotifications} size="sm">
                                🔍 Check Schedule
                            </Button>
                            <Button onClick={() => setNotificationSettingsDialogOpen(true)} variant="outline" size="sm">
                                ⚙️ Settings
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No notifications at this time.</p>
                                <p className="text-sm text-gray-400 mt-2">Schedule notifications will appear here when issues are detected.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border rounded-lg ${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'} ${notification.isResolved ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        notification.severity === 'CRITICAL' ? 'destructive' :
                                                            notification.severity === 'HIGH' ? 'default' :
                                                                'secondary'
                                                    }
                                                >
                                                    {notification.severity}
                                                </Badge>
                                                <Badge variant="outline">{notification.type.replace('_', ' ')}</Badge>
                                                {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {notification.createdAt.toDate().toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold mb-1">{notification.title}</h4>
                                        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                        {notification.metadata && (
                                            <div className="text-xs text-gray-500 space-y-1">
                                                {notification.metadata.daysOverdue && (
                                                    <div>Days overdue: {notification.metadata.daysOverdue}</div>
                                                )}
                                                {notification.metadata.expectedDate && (
                                                    <div>Expected: {new Date(notification.metadata.expectedDate).toLocaleDateString()}</div>
                                                )}
                                                {notification.metadata.actualDate && (
                                                    <div>Actual: {new Date(notification.metadata.actualDate).toLocaleDateString()}</div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2 mt-3">
                                            {!notification.isRead && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkNotificationAsRead(notification.id)}
                                                >
                                                    Mark as Read
                                                </Button>
                                            )}
                                            {!notification.isResolved && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkNotificationAsResolved(notification.id)}
                                                >
                                                    Mark as Resolved
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={() => setNotificationsDialogOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Notification Settings Dialog */}
            <Dialog open={notificationSettingsDialogOpen} onOpenChange={setNotificationSettingsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Notification Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {notificationSettings && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Enabled Notifications</h4>
                                    <div className="space-y-2">
                                        {Object.entries(notificationSettings.enabledNotifications).map(([key, enabled]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={key}
                                                    checked={enabled}
                                                    onChange={(e) => handleUpdateNotificationSettings({
                                                        enabledNotifications: {
                                                            ...notificationSettings.enabledNotifications,
                                                            [key]: e.target.checked
                                                        }
                                                    })}
                                                    className="rounded"
                                                />
                                                <Label htmlFor={key} className="text-sm">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold">Thresholds</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="deadline-warning" className="text-sm min-w-32">
                                                Deadline Warning (days):
                                            </Label>
                                            <Input
                                                id="deadline-warning"
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={notificationSettings.thresholds.deadlineWarningDays}
                                                onChange={(e) => handleUpdateNotificationSettings({
                                                    thresholds: {
                                                        ...notificationSettings.thresholds,
                                                        deadlineWarningDays: parseInt(e.target.value) || 3
                                                    }
                                                })}
                                                className="w-20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="slippage-threshold" className="text-sm min-w-32">
                                                Slippage Threshold (days):
                                            </Label>
                                            <Input
                                                id="slippage-threshold"
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={notificationSettings.thresholds.slippageThresholdDays}
                                                onChange={(e) => handleUpdateNotificationSettings({
                                                    thresholds: {
                                                        ...notificationSettings.thresholds,
                                                        slippageThresholdDays: parseInt(e.target.value) || 1
                                                    }
                                                })}
                                                className="w-20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={() => setNotificationSettingsDialogOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Comments Dialog */}
            <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Comments - {selectedItemForComments?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">Comments</h4>
                            {comments.length === 0 ? (
                                <p className="text-sm text-gray-500">No comments yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="p-3 border rounded bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{comment.userName}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {comment.createdAt.toDate().toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-comment">Add Comment</Label>
                            <Textarea
                                id="new-comment"
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                placeholder="Type your comment here..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCommentsDialogOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={handleAddComment} disabled={!newCommentContent.trim()}>
                                Add Comment
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};