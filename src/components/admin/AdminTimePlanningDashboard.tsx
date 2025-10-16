import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, Project, UserRole, TimeAllocation, TimeSlot, ProjectStatus, TimeAllocationStatus, AllocationFormData } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { format, addDays, startOfDay } from 'date-fns';
import { createTimeAllocation } from '../../services/timeAllocationService';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from '@hello-pangea/dnd';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Avatar,
    AvatarFallback,
    AvatarImage,
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Label,
    Alert,
    AlertDescription,
    Separator,
    Progress,
    cn
} from '../../lib/shadcn';
import { Calendar } from '../../components/ui/calendar';
import {
    Clock,
    Plus,
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    BarChart3,
    Timer
} from 'lucide-react';

interface AdminTimePlanningDashboardProps {
    className?: string;
}

interface AllocationTemplate {
    id: string;
    name: string;
    description: string;
    allocations: {
        freelancerId: string;
        allocatedHours: number;
        hourlyRate: number;
        daysOffset: number; // Days from project start
    }[];
}

export const AdminTimePlanningDashboard: React.FC<AdminTimePlanningDashboardProps> = ({
    className = ''
}) => {
    const {
        user,
        users,
        projects,
        allocateTimeToFreelancer,
        getTimeAllocations,
        getTimeAllocationsByFreelancer,
        getTimeAllocationsByProject,
        updateTimeAllocation,
        deleteTimeAllocation,
        getTimeSlotUtilizationStats
    } = useAppContext();

    const [allocations, setAllocations] = useState<TimeAllocation[]>([]);
    const [utilizationStats, setUtilizationStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<TimeAllocation | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [allocationForm, setAllocationForm] = useState<AllocationFormData>({
        freelancerId: '',
        projectId: '',
        allocatedHours: 4,
        hourlyRate: 50,
        startDate: startOfDay(new Date()),
        notes: ''
    });
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    // Predefined allocation templates
    const allocationTemplates: AllocationTemplate[] = [
        {
            id: 'full-time-week',
            name: 'Full-Time Week',
            description: '40 hours across 5 working days',
            allocations: [
                { freelancerId: '', allocatedHours: 8, hourlyRate: 50, daysOffset: 0 }, // Monday
                { freelancerId: '', allocatedHours: 8, hourlyRate: 50, daysOffset: 1 }, // Tuesday
                { freelancerId: '', allocatedHours: 8, hourlyRate: 50, daysOffset: 2 }, // Wednesday
                { freelancerId: '', allocatedHours: 8, hourlyRate: 50, daysOffset: 3 }, // Thursday
                { freelancerId: '', allocatedHours: 8, hourlyRate: 50, daysOffset: 4 }, // Friday
            ]
        },
        {
            id: 'part-time-week',
            name: 'Part-Time Week',
            description: '20 hours across 3 working days',
            allocations: [
                { freelancerId: '', allocatedHours: 8, hourlyRate: 45, daysOffset: 0 }, // Monday
                { freelancerId: '', allocatedHours: 6, hourlyRate: 45, daysOffset: 2 }, // Wednesday
                { freelancerId: '', allocatedHours: 6, hourlyRate: 45, daysOffset: 4 }, // Friday
            ]
        },
        {
            id: 'sprint-allocation',
            name: '2-Week Sprint',
            description: 'Intensive 2-week development sprint',
            allocations: [
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 0 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 1 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 2 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 3 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 4 },
                { freelancerId: '', allocatedHours: 6, hourlyRate: 55, daysOffset: 7 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 8 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 9 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 10 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 55, daysOffset: 11 },
            ]
        },
        {
            id: 'design-phase',
            name: 'Design Phase',
            description: 'Focused design work over 1 week',
            allocations: [
                { freelancerId: '', allocatedHours: 6, hourlyRate: 60, daysOffset: 0 },
                { freelancerId: '', allocatedHours: 7, hourlyRate: 60, daysOffset: 1 },
                { freelancerId: '', allocatedHours: 8, hourlyRate: 60, daysOffset: 2 },
                { freelancerId: '', allocatedHours: 7, hourlyRate: 60, daysOffset: 3 },
                { freelancerId: '', allocatedHours: 6, hourlyRate: 60, daysOffset: 4 },
            ]
        }
    ];

    // Load data on component mount
    useEffect(() => {
        loadAllocations();
        loadUtilizationStats();
    }, []);

    const loadAllocations = async () => {
        try {
            setLoading(true);
            const data = await getTimeAllocations();
            setAllocations(data);
        } catch (error) {
            console.error('Error loading allocations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUtilizationStats = async () => {
        try {
            const stats = await getTimeSlotUtilizationStats();
            setUtilizationStats(stats);
        } catch (error) {
            console.error('Error loading utilization stats:', error);
        }
    };

    // Filter users and projects
    const freelancers = useMemo(() =>
        users.filter(u => u.role === UserRole.FREELANCER),
        [users]
    );

    const activeProjects = useMemo(() =>
        projects.filter(p => p.status === ProjectStatus.IN_PROGRESS),
        [projects]
    );

    // Handle form submission
    const handleAllocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        try {
            const allocationData = {
                projectId: allocationForm.projectId,
                freelancerId: allocationForm.freelancerId,
                freelancerName: freelancers.find(f => f.id === allocationForm.freelancerId)?.name || '',
                allocatedById: user.id,
                allocatedByName: user.name,
                allocatedHours: allocationForm.allocatedHours,
                hourlyRate: allocationForm.hourlyRate,
                startDate: Timestamp.fromDate(allocationForm.startDate),
                endDate: Timestamp.fromDate(new Date(allocationForm.startDate.getTime() + (allocationForm.allocatedHours * 60 * 60 * 1000))),
                status: TimeAllocationStatus.ACTIVE,
                notes: allocationForm.notes
            };

            if (editingAllocation) {
                await updateTimeAllocation(editingAllocation.id, {
                    projectId: allocationData.projectId,
                    freelancerId: allocationData.freelancerId,
                    freelancerName: allocationData.freelancerName,
                    allocatedHours: allocationData.allocatedHours,
                    hourlyRate: allocationData.hourlyRate,
                    startDate: allocationData.startDate,
                    endDate: allocationData.endDate,
                    notes: allocationData.notes
                });
            } else {
                await createTimeAllocation(allocationData);
            }

            // Reset form and reload data
            resetForm();
            await loadAllocations();
            await loadUtilizationStats();
            setIsAllocationDialogOpen(false);
        } catch (error) {
            console.error('Error saving allocation:', error);
            // Show error message to user
            alert(error instanceof Error ? error.message : 'Failed to save allocation');
        }
    };

    const resetForm = () => {
        setAllocationForm({
            freelancerId: '',
            projectId: '',
            allocatedHours: 4,
            hourlyRate: 50,
            startDate: startOfDay(new Date()),
            notes: ''
        });
        setEditingAllocation(null);
    };

    const handleEditAllocation = (allocation: TimeAllocation) => {
        setEditingAllocation(allocation);
        setAllocationForm({
            freelancerId: allocation.freelancerId,
            projectId: allocation.projectId,
            allocatedHours: allocation.allocatedHours,
            hourlyRate: allocation.hourlyRate,
            startDate: allocation.startDate.toDate(),
            notes: allocation.notes || ''
        });
        setIsAllocationDialogOpen(true);
    };

    const handleDeleteAllocation = async (allocationId: string) => {
        try {
            await deleteTimeAllocation(allocationId);
            await loadAllocations();
            await loadUtilizationStats();
        } catch (error) {
            console.error('Error deleting allocation:', error);
            // TODO: Show error toast
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        // For now, just log the drag operation
        // TODO: Implement actual rescheduling logic
        console.log('Dragged allocation:', draggableId, 'to position:', destination);
    };

    const getAllocationStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
            case 'COMPLETED':
                return <Badge variant="secondary">Completed</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTotalAllocatedHours = () => {
        return allocations.reduce((total, allocation) => total + allocation.allocatedHours, 0);
    };

    const getTotalAllocatedValue = () => {
        return allocations.reduce((total, allocation) => total + (allocation.allocatedHours * allocation.hourlyRate), 0);
    };

    // Apply allocation template to a project
    const applyAllocationTemplate = async (templateId: string, projectId: string, freelancerId: string) => {
        const template = allocationTemplates.find(t => t.id === templateId);
        if (!template || !user) return;

        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const projectStartDate = project.startDate ? project.startDate.toDate() : new Date();

            // Create allocations for each template item
            for (const allocation of template.allocations) {
                const allocationData = {
                    projectId,
                    freelancerId,
                    freelancerName: freelancers.find(f => f.id === freelancerId)?.name || '',
                    allocatedById: user.id,
                    allocatedByName: user.name,
                    allocatedHours: allocation.allocatedHours,
                    hourlyRate: allocation.hourlyRate,
                    startDate: Timestamp.fromDate(addDays(projectStartDate, allocation.daysOffset)),
                    endDate: Timestamp.fromDate(addDays(addDays(projectStartDate, allocation.daysOffset), allocation.allocatedHours / 24)),
                    status: TimeAllocationStatus.ACTIVE,
                    notes: `Applied from template: ${template.name}`
                };

                await createTimeAllocation(allocationData);
            }

            // Reload data
            await loadAllocations();
            await loadUtilizationStats();
            setIsTemplateDialogOpen(false);
            setSelectedTemplate('');
        } catch (error) {
            console.error('Error applying template:', error);
            alert('Failed to apply template. Please try again.');
        }
    };

    // Get allocations for a specific date
    const getAllocationsForDate = (date: Date) => {
        const targetDate = startOfDay(date);
        return allocations.filter(allocation => {
            const startDate = startOfDay(allocation.startDate.toDate());
            const endDate = allocation.endDate.toDate();
            return targetDate >= startDate && targetDate <= endDate;
        });
    };

    // Get dates that have allocations for calendar highlighting
    const getAllocationDates = () => {
        const dates = new Set<string>();
        allocations.forEach(allocation => {
            const startDate = startOfDay(allocation.startDate.toDate());
            const endDate = allocation.endDate.toDate();
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                dates.add(format(currentDate, 'yyyy-MM-dd'));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        return dates;
    };

    // Check if a date has allocation conflicts
    const hasAllocationConflicts = (date: Date) => {
        const allocationsForDate = getAllocationsForDate(date);
        const freelancerIds = new Set(allocationsForDate.map(a => a.freelancerId));
        return freelancerIds.size < allocationsForDate.length; // Same freelancer allocated multiple times
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
                                <Clock className="h-6 w-6" />
                                Time Planning Dashboard
                            </CardTitle>
                            <CardDescription>
                                Allocate time slots to freelancers and manage project capacity
                            </CardDescription>
                        </div>
                        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { resetForm(); setIsAllocationDialogOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Allocate Time
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <form onSubmit={handleAllocationSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingAllocation ? 'Edit Time Allocation' : 'Create Time Allocation'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Allocate time slots for freelancers to work on projects.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="freelancer" className="text-right">
                                                Freelancer
                                            </Label>
                                            <Select
                                                value={allocationForm.freelancerId}
                                                onValueChange={(value) => setAllocationForm(prev => ({ ...prev, freelancerId: value }))}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select freelancer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {freelancers.map((freelancer) => (
                                                        <SelectItem key={freelancer.id} value={freelancer.id}>
                                                            {freelancer.name} - ${freelancer.hourlyRate}/hr
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="project" className="text-right">
                                                Project
                                            </Label>
                                            <Select
                                                value={allocationForm.projectId}
                                                onValueChange={(value) => setAllocationForm(prev => ({ ...prev, projectId: value }))}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select project" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeProjects.map((project) => (
                                                        <SelectItem key={project.id} value={project.id}>
                                                            {project.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="hours" className="text-right">
                                                Hours
                                            </Label>
                                            <Input
                                                id="hours"
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={allocationForm.allocatedHours}
                                                onChange={(e) => setAllocationForm(prev => ({
                                                    ...prev,
                                                    allocatedHours: parseInt(e.target.value) || 4
                                                }))}
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="rate" className="text-right">
                                                Rate ($/hr)
                                            </Label>
                                            <Input
                                                id="rate"
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={allocationForm.hourlyRate}
                                                onChange={(e) => setAllocationForm(prev => ({
                                                    ...prev,
                                                    hourlyRate: parseInt(e.target.value) || 50
                                                }))}
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="startDate" className="text-right">
                                                Start Date
                                            </Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={format(allocationForm.startDate, 'yyyy-MM-dd')}
                                                onChange={(e) => setAllocationForm(prev => ({
                                                    ...prev,
                                                    startDate: new Date(e.target.value)
                                                }))}
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="notes" className="text-right">
                                                Notes
                                            </Label>
                                            <Input
                                                id="notes"
                                                value={allocationForm.notes}
                                                onChange={(e) => setAllocationForm(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="Optional notes..."
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingAllocation ? 'Update' : 'Create'} Allocation
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Apply Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Apply Allocation Template</DialogTitle>
                                    <DialogDescription>
                                        Choose a template and apply it to allocate time for a freelancer on a project.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="template" className="text-right">
                                            Template
                                        </Label>
                                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select a template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allocationTemplates.map((template) => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        <div>
                                                            <div className="font-medium">{template.name}</div>
                                                            <div className="text-xs text-muted-foreground">{template.description}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedTemplate && (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="template-project" className="text-right">
                                                    Project
                                                </Label>
                                                <Select onValueChange={(value) => setAllocationForm(prev => ({ ...prev, projectId: value }))}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select project" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activeProjects.map((project) => (
                                                            <SelectItem key={project.id} value={project.id}>
                                                                {project.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="template-freelancer" className="text-right">
                                                    Freelancer
                                                </Label>
                                                <Select onValueChange={(value) => setAllocationForm(prev => ({ ...prev, freelancerId: value }))}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select freelancer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {freelancers.map((freelancer) => (
                                                            <SelectItem key={freelancer.id} value={freelancer.id}>
                                                                {freelancer.name} - ${freelancer.hourlyRate}/hr
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Template Preview */}
                                            <div className="col-span-4">
                                                <Label className="text-sm font-medium">Template Preview:</Label>
                                                <div className="mt-2 p-3 bg-muted rounded-lg">
                                                    {(() => {
                                                        const template = allocationTemplates.find(t => t.id === selectedTemplate);
                                                        if (!template) return null;

                                                        const totalHours = template.allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
                                                        const totalValue = template.allocations.reduce((sum, a) => sum + (a.allocatedHours * a.hourlyRate), 0);

                                                        return (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Total Hours:</span>
                                                                    <span className="font-medium">{totalHours}h</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span>Total Value:</span>
                                                                    <span className="font-medium">${totalValue.toLocaleString()}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {template.allocations.length} allocation{template.allocations.length !== 1 ? 's' : ''} over {Math.max(...template.allocations.map(a => a.daysOffset)) + 1} day{Math.max(...template.allocations.map(a => a.daysOffset)) + 1 !== 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => applyAllocationTemplate(selectedTemplate, allocationForm.projectId, allocationForm.freelancerId)}
                                        disabled={!selectedTemplate || !allocationForm.projectId || !allocationForm.freelancerId}
                                    >
                                        Apply Template
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                {/* Stats Cards */}
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{allocations.length}</div>
                            <div className="text-sm text-muted-foreground">Total Allocations</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{getTotalAllocatedHours()}</div>
                            <div className="text-sm text-muted-foreground">Total Hours</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">${getTotalAllocatedValue().toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Value</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {utilizationStats ? Math.round(utilizationStats.utilizationRate) : 0}%
                            </div>
                            <div className="text-sm text-muted-foreground">Utilization</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Utilization Overview */}
            {utilizationStats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Time Slot Utilization
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Utilization</span>
                                <span className="text-sm text-muted-foreground">
                                    {Math.round(utilizationStats.utilizationRate)}%
                                </span>
                            </div>
                            <Progress value={utilizationStats.utilizationRate} className="w-full" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-lg font-semibold text-green-700">
                                        {utilizationStats.availableSlots}
                                    </div>
                                    <div className="text-xs text-green-600">Available</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-lg font-semibold text-blue-700">
                                        {utilizationStats.purchasedSlots}
                                    </div>
                                    <div className="text-xs text-blue-600">Purchased</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-lg font-semibold text-yellow-700">
                                        {utilizationStats.inProgressSlots}
                                    </div>
                                    <div className="text-xs text-yellow-600">In Progress</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold text-gray-700">
                                        {utilizationStats.completedSlots}
                                    </div>
                                    <div className="text-xs text-gray-600">Completed</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Timeline View */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Project Timeline Overview
                    </CardTitle>
                    <CardDescription>
                        Visual timeline of projects with allocated time slots
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="space-y-6">
                            {activeProjects.map((project) => {
                                const projectAllocations = allocations.filter(a => a.projectId === project.id);
                                const projectStartDate = project.startDate ? project.startDate.toDate() : new Date();
                                const projectEndDate = project.endDate ? project.endDate.toDate() : addDays(projectStartDate, 30);                                // Calculate timeline width and positioning
                                const totalDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                const timelineWidth = Math.max(600, totalDays * 20); // Minimum width, scale by days

                                return (
                                    <div key={project.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">{project.title}</h3>
                                            <div className="text-sm text-muted-foreground">
                                                {format(projectStartDate, 'MMM dd')} - {format(projectEndDate, 'MMM dd, yyyy')}
                                            </div>
                                        </div>

                                        <div className="relative overflow-x-auto">
                                            <Droppable droppableId={`timeline-${project.id}`} direction="horizontal">
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className="h-16 bg-gray-100 rounded-lg border relative overflow-hidden"
                                                        style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
                                                    >
                                                        {/* Month markers */}
                                                        {Array.from({ length: Math.ceil(totalDays / 30) + 1 }, (_, i) => {
                                                            const monthDate = addDays(projectStartDate, i * 30);
                                                            const left = ((monthDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)) * 20;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute top-0 h-full border-l border-gray-300"
                                                                    style={{ left: `${left}px` }}
                                                                >
                                                                    <div className="text-xs text-gray-500 -ml-6 mt-1">
                                                                        {format(monthDate, 'MMM')}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Allocated time slots */}
                                                        {projectAllocations.map((allocation, index) => {
                                                            const allocationStart = allocation.startDate.toDate();
                                                            const allocationEnd = allocation.endDate.toDate();

                                                            // Calculate position and width
                                                            const startOffset = Math.max(0, (allocationStart.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                                            const duration = (allocationEnd.getTime() - allocationStart.getTime()) / (1000 * 60 * 60 * 24);
                                                            const left = startOffset * 20;
                                                            const width = Math.max(40, duration * 20); // Minimum width for visibility

                                                            return (
                                                                <Draggable
                                                                    key={allocation.id}
                                                                    draggableId={allocation.id}
                                                                    index={Math.floor(left / 20)} // Use day position as index
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={cn(
                                                                                "absolute top-2 h-12 rounded-md border-2 flex items-center px-2 cursor-move hover:opacity-80 transition-opacity",
                                                                                snapshot.isDragging && "shadow-lg z-10",
                                                                                allocation.status === TimeAllocationStatus.ACTIVE
                                                                                    ? "bg-blue-100 border-blue-300 text-blue-900"
                                                                                    : allocation.status === TimeAllocationStatus.COMPLETED
                                                                                        ? "bg-green-100 border-green-300 text-green-900"
                                                                                        : "bg-gray-100 border-gray-300 text-gray-900"
                                                                            )}
                                                                            style={{
                                                                                left: `${left}px`,
                                                                                width: `${width}px`,
                                                                                ...provided.draggableProps.style
                                                                            }}
                                                                            title={`${allocation.freelancerName}: ${allocation.allocatedHours}h @ $${allocation.hourlyRate}/hr - Drag to reschedule`}
                                                                        >
                                                                            <div className="flex flex-col text-xs truncate">
                                                                                <div className="font-medium truncate">{allocation.freelancerName}</div>
                                                                                <div className="text-xs opacity-75">
                                                                                    {allocation.allocatedHours}h
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>

                                            {/* Timeline legend */}
                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                                                    <span>Active</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                                    <span>Completed</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                                                    <span>Other</span>
                                                </div>
                                                <div className="text-muted-foreground ml-4">
                                                    💡 Drag allocations to reschedule them
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {activeProjects.length === 0 && (
                                <div className="text-center py-8">
                                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">No active projects</h3>
                                    <p className="text-muted-foreground">
                                        Create projects to see timeline visualizations of time allocations.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DragDropContext>
                </CardContent>
            </Card>

            {/* Freelancer Availability Calendar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Freelancer Availability Calendar
                    </CardTitle>
                    <CardDescription>
                        Overview of freelancer availability and allocation conflicts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Date range selector */}
                        <div className="flex items-center gap-4">
                            <Label>View Period:</Label>
                            <Select value={selectedDate ? format(selectedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM')}
                                onValueChange={(value) => setSelectedDate(new Date(value + '-01'))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const date = addDays(new Date(), i * 30);
                                        return (
                                            <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                                                {format(date, 'MMMM yyyy')}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Availability Grid */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left p-2 border-b font-medium">Freelancer</th>
                                        {Array.from({ length: 31 }, (_, i) => {
                                            const date = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1) : addDays(new Date(), i);
                                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                            return (
                                                <th key={i} className={cn(
                                                    "text-center p-1 border-b text-xs min-w-[30px]",
                                                    isToday && "bg-blue-50 font-semibold"
                                                )}>
                                                    {format(date, 'd')}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {freelancers.map((freelancer) => {
                                        const freelancerAllocations = allocations.filter(a => a.freelancerId === freelancer.id);

                                        return (
                                            <tr key={freelancer.id}>
                                                <td className="p-2 border-b font-medium text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src="" alt={freelancer.name} />
                                                            <AvatarFallback className="text-xs">{freelancer.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate max-w-[120px]" title={freelancer.name}>
                                                            {freelancer.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {Array.from({ length: 31 }, (_, i) => {
                                                    const date = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1) : addDays(new Date(), i);
                                                    const dateStr = format(date, 'yyyy-MM-dd');

                                                    // Check allocations for this date
                                                    const dayAllocations = freelancerAllocations.filter(allocation => {
                                                        const startDate = startOfDay(allocation.startDate.toDate());
                                                        const endDate = allocation.endDate.toDate();
                                                        const targetDate = startOfDay(date);
                                                        return targetDate >= startDate && targetDate <= endDate;
                                                    });

                                                    const hasAllocation = dayAllocations.length > 0;
                                                    const hasConflict = dayAllocations.length > 1;
                                                    const isCompleted = dayAllocations.some(a => a.status === TimeAllocationStatus.COMPLETED);
                                                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                                                    return (
                                                        <td key={i} className={cn(
                                                            "text-center p-1 border-b min-w-[30px]",
                                                            isToday && "bg-blue-50"
                                                        )}>
                                                            <div
                                                                className={cn(
                                                                    "w-6 h-6 mx-auto rounded text-xs flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity",
                                                                    hasConflict
                                                                        ? "bg-red-100 border border-red-300 text-red-900"
                                                                        : hasAllocation && isCompleted
                                                                            ? "bg-green-100 border border-green-300 text-green-900"
                                                                            : hasAllocation
                                                                                ? "bg-blue-100 border border-blue-300 text-blue-900"
                                                                                : "bg-gray-50 border border-gray-200 text-gray-400 hover:bg-gray-100"
                                                                )}
                                                                title={
                                                                    hasConflict
                                                                        ? `${dayAllocations.length} overlapping allocations`
                                                                        : hasAllocation
                                                                            ? `${dayAllocations[0].projectId} - ${dayAllocations[0].allocatedHours}h`
                                                                            : 'Available'
                                                                }
                                                            >
                                                                {hasConflict ? '!' : hasAllocation ? '●' : '○'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
                                <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                                <span>Allocated</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                <span>Completed</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                                <span>Conflict (!)</span>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-semibold text-green-700">
                                    {freelancers.length - allocations.filter(a => a.status === TimeAllocationStatus.ACTIVE).length}
                                </div>
                                <div className="text-xs text-green-600">Available Today</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-semibold text-blue-700">
                                    {allocations.filter(a => a.status === TimeAllocationStatus.ACTIVE).length}
                                </div>
                                <div className="text-xs text-blue-600">Allocated Today</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-lg font-semibold text-yellow-700">
                                    {freelancers.filter(f =>
                                        allocations.filter(a =>
                                            a.freelancerId === f.id &&
                                            a.status === TimeAllocationStatus.ACTIVE &&
                                            startOfDay(a.startDate.toDate()) <= startOfDay(new Date()) &&
                                            a.endDate.toDate() >= new Date()
                                        ).length > 1
                                    ).length}
                                </div>
                                <div className="text-xs text-yellow-600">With Conflicts</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-semibold text-purple-700">
                                    {Math.round((allocations.filter(a => a.status === TimeAllocationStatus.ACTIVE).length / freelancers.length) * 100) || 0}%
                                </div>
                                <div className="text-xs text-purple-600">Utilization</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Time Planning Calendar
                    </CardTitle>
                    <CardDescription>
                        Visual overview of time allocations and freelancer availability
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                                modifiers={{
                                    hasAllocations: (date) => getAllocationDates().has(format(date, 'yyyy-MM-dd')),
                                    hasConflicts: (date) => hasAllocationConflicts(date)
                                }}
                                modifiersClassNames={{
                                    hasAllocations: 'bg-blue-100 text-blue-900 font-semibold',
                                    hasConflicts: 'bg-red-100 text-red-900 font-semibold'
                                }}
                            />
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-blue-100 rounded"></div>
                                    <span>Has allocations</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-red-100 rounded"></div>
                                    <span>Has conflicts</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            {selectedDate && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">
                                        Allocations for {format(selectedDate, 'MMMM dd, yyyy')}
                                    </h3>
                                    {getAllocationsForDate(selectedDate).length === 0 ? (
                                        <p className="text-muted-foreground">No allocations for this date</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {getAllocationsForDate(selectedDate).map((allocation) => (
                                                <div key={allocation.id} className="p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-medium">{allocation.freelancerName}</div>
                                                        {getAllocationStatusBadge(allocation.status)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mb-1">
                                                        {projects.find(p => p.id === allocation.projectId)?.title || 'Unknown Project'}
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{allocation.allocatedHours}h @ ${allocation.hourlyRate}/hr</span>
                                                        <span className="font-medium">
                                                            ${(allocation.allocatedHours * allocation.hourlyRate).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {allocation.notes && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {allocation.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {hasAllocationConflicts(selectedDate) && (
                                        <Alert className="mt-4">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Conflicts detected: Some freelancers have overlapping allocations on this date.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Allocations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Time Allocations</CardTitle>
                    <CardDescription>
                        Manage time allocations across all projects and freelancers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : allocations.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No time allocations yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first time allocation to get started with time planning.
                            </p>
                            <Button onClick={() => setIsAllocationDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Allocation
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Freelancer</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Total Value</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocations.map((allocation) => (
                                    <TableRow key={allocation.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="" alt={allocation.freelancerName} />
                                                    <AvatarFallback>{allocation.freelancerName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{allocation.freelancerName}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {projects.find(p => p.id === allocation.projectId)?.title || 'Unknown Project'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Timer className="h-4 w-4 mr-1" />
                                                {allocation.allocatedHours}h
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-1" />
                                                ${allocation.hourlyRate}/hr
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                ${(allocation.allocatedHours * allocation.hourlyRate).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <CalendarDays className="h-4 w-4 mr-1" />
                                                {format(allocation.startDate.toDate(), 'MMM dd, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getAllocationStatusBadge(allocation.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleEditAllocation(allocation)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Time Allocation</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete this time allocation and all associated time slots.
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteAllocation(allocation.id)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminTimePlanningDashboard;