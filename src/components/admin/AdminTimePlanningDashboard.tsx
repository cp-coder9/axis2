import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, Project, UserRole, TimeAllocation, TimeSlot, ProjectStatus } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { format, addDays, startOfDay } from 'date-fns';
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
import {
    Clock,
    Plus,
    Users,
    Calendar,
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

interface AllocationFormData {
    freelancerId: string;
    projectId: string;
    allocatedHours: number;
    hourlyRate: number;
    startDate: Date;
    notes?: string;
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
    const [allocationForm, setAllocationForm] = useState<AllocationFormData>({
        freelancerId: '',
        projectId: '',
        allocatedHours: 4,
        hourlyRate: 50,
        startDate: startOfDay(new Date()),
        notes: ''
    });

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

        try {
            const allocationData = {
                freelancerId: allocationForm.freelancerId,
                projectId: allocationForm.projectId,
                freelancerName: freelancers.find(f => f.id === allocationForm.freelancerId)?.name || '',
                projectName: activeProjects.find(p => p.id === allocationForm.projectId)?.title || '',
                allocatedHours: allocationForm.allocatedHours,
                hourlyRate: allocationForm.hourlyRate,
                startDate: Timestamp.fromDate(allocationForm.startDate),
                notes: allocationForm.notes,
                status: 'ACTIVE' as const
            };

            if (editingAllocation) {
                await updateTimeAllocation(editingAllocation.id, allocationData);
            } else {
                await allocateTimeToFreelancer(allocationData);
            }

            // Reset form and reload data
            resetForm();
            await loadAllocations();
            await loadUtilizationStats();
            setIsAllocationDialogOpen(false);
        } catch (error) {
            console.error('Error saving allocation:', error);
            // TODO: Show error toast
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
        return allocations.reduce((total, allocation) =>
            total + (allocation.allocatedHours * allocation.hourlyRate), 0
        );
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
                                                <Calendar className="h-4 w-4 mr-1" />
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