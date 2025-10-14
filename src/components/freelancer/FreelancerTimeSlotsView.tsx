import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, Project, UserRole, TimeSlot, TimeSlotStatus } from '../../types';
import { format, isAfter, isBefore, addDays, isToday, isTomorrow } from 'date-fns';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Progress,
    cn
} from '../../lib/shadcn';
import {
    Clock,
    Play,
    CheckCircle,
    AlertTriangle,
    Calendar,
    DollarSign,
    Timer,
    TrendingUp,
    BarChart3,
    Search,
    Filter,
    Star,
    Info,
    User as UserIcon
} from 'lucide-react';

interface FreelancerTimeSlotsViewProps {
    className?: string;
}

export const FreelancerTimeSlotsView: React.FC<FreelancerTimeSlotsViewProps> = ({
    className = ''
}) => {
    const {
        user,
        projects,
        getTimeSlotsByFreelancer,
        updateTimeSlotStatus,
        startGlobalTimer,
        stopGlobalTimerAndLog
    } = useAppContext();

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isStartWorkDialogOpen, setIsStartWorkDialogOpen] = useState(false);
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('all');

    // Load data on component mount
    useEffect(() => {
        if (user?.id) {
            loadTimeSlots();
        }
    }, [user?.id]);

    const loadTimeSlots = async () => {
        try {
            setLoading(true);
            if (user?.id) {
                const slots = await getTimeSlotsByFreelancer(user.id);
                setTimeSlots(slots);
            }
        } catch (error) {
            console.error('Error loading time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter slots based on search and status
    const filteredSlots = useMemo(() => {
        let filtered = timeSlots;

        if (searchTerm) {
            filtered = filtered.filter(slot => {
                const project = projects.find(p => p.id === slot.projectId);
                return project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    slot.purchasedByName?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(slot => slot.status === statusFilter);
        }

        // Tab filtering
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(slot => {
                const slotDate = slot.startTime.toDate();
                return isAfter(slotDate, new Date()) && slot.status === TimeSlotStatus.PURCHASED;
            });
        } else if (activeTab === 'in-progress') {
            filtered = filtered.filter(slot => slot.status === TimeSlotStatus.IN_PROGRESS);
        } else if (activeTab === 'completed') {
            filtered = filtered.filter(slot => slot.status === TimeSlotStatus.COMPLETED);
        }

        return filtered;
    }, [timeSlots, searchTerm, statusFilter, activeTab, projects]);

    // Group slots by status for stats
    const slotStats = useMemo(() => {
        const stats = {
            purchased: timeSlots.filter(slot => slot.status === TimeSlotStatus.PURCHASED).length,
            inProgress: timeSlots.filter(slot => slot.status === TimeSlotStatus.IN_PROGRESS).length,
            completed: timeSlots.filter(slot => slot.status === TimeSlotStatus.COMPLETED).length,
            totalEarned: timeSlots
                .filter(slot => slot.status === TimeSlotStatus.COMPLETED)
                .reduce((total, slot) => total + (slot.durationHours * slot.hourlyRate), 0),
            totalHours: timeSlots
                .filter(slot => slot.status === TimeSlotStatus.COMPLETED)
                .reduce((total, slot) => total + slot.durationHours, 0)
        };
        return stats;
    }, [timeSlots]);

    const handleStartWork = async () => {
        if (!selectedSlot) return;

        try {
            await updateTimeSlotStatus(selectedSlot.id, TimeSlotStatus.IN_PROGRESS);
            setIsStartWorkDialogOpen(false);
            setSelectedSlot(null);
            await loadTimeSlots();
        } catch (error) {
            console.error('Error starting work on time slot:', error);
        }
    };

    const handleCompleteWork = async () => {
        if (!selectedSlot) return;

        try {
            await updateTimeSlotStatus(selectedSlot.id, TimeSlotStatus.COMPLETED);
            setIsCompleteDialogOpen(false);
            setSelectedSlot(null);
            await loadTimeSlots();
        } catch (error) {
            console.error('Error completing time slot:', error);
        }
    };

    const handleStartTimer = async (slot: TimeSlot) => {
        try {
            const project = projects.find(p => p.id === slot.projectId);
            if (project) {
                // Find a job card for this project (assuming there's at least one)
                const jobCard = project.jobCards?.[0];
                if (jobCard) {
                    const success = await startGlobalTimer(
                        jobCard.id,
                        jobCard.title,
                        project.id,
                        slot.durationHours
                    );
                    if (success) {
                        console.log('Timer started for time slot:', slot.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    };

    const getSlotStatusBadge = (status: TimeSlotStatus) => {
        switch (status) {
            case TimeSlotStatus.AVAILABLE:
                return <Badge variant="outline" className="bg-gray-100 text-gray-800">Available</Badge>;
            case TimeSlotStatus.PURCHASED:
                return <Badge variant="default" className="bg-blue-100 text-blue-800">Purchased</Badge>;
            case TimeSlotStatus.IN_PROGRESS:
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
            case TimeSlotStatus.COMPLETED:
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
            case TimeSlotStatus.CANCELLED:
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getDateDisplay = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'MMM dd, yyyy');
    };

    const getUrgencyBadge = (slot: TimeSlot) => {
        const slotDate = slot.startTime.toDate();
        const now = new Date();
        const daysDiff = Math.ceil((slotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0 && slot.status === TimeSlotStatus.PURCHASED) {
            return <Badge variant="destructive" className="ml-2">Overdue</Badge>;
        } else if (daysDiff <= 1 && slot.status === TimeSlotStatus.PURCHASED) {
            return <Badge variant="destructive" className="ml-2">Urgent</Badge>;
        } else if (daysDiff <= 3 && slot.status === TimeSlotStatus.PURCHASED) {
            return <Badge variant="outline" className="ml-2 text-yellow-700 border-yellow-300">Soon</Badge>;
        }
        return null;
    };

    if (user?.role !== UserRole.FREELANCER) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        This page is only available to freelancers.
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
                                My Time Slots
                            </CardTitle>
                            <CardDescription>
                                View and manage your allocated time slots across all projects
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                {/* Stats Cards */}
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{timeSlots.length}</div>
                            <div className="text-sm text-muted-foreground">Total Slots</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{slotStats.purchased}</div>
                            <div className="text-sm text-muted-foreground">Purchased</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{slotStats.inProgress}</div>
                            <div className="text-sm text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{slotStats.completed}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">${slotStats.totalEarned.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Earned</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by project or client name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value={TimeSlotStatus.PURCHASED}>Purchased</SelectItem>
                                <SelectItem value={TimeSlotStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={TimeSlotStatus.COMPLETED}>Completed</SelectItem>
                                <SelectItem value={TimeSlotStatus.CANCELLED}>Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({timeSlots.length})</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming ({slotStats.purchased})</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress ({slotStats.inProgress})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({slotStats.completed})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {loading ? (
                        <Card>
                            <CardContent className="py-8">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : filteredSlots.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <div className="text-center">
                                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        {activeTab === 'all' ? 'No time slots allocated yet' :
                                            activeTab === 'upcoming' ? 'No upcoming time slots' :
                                                activeTab === 'in-progress' ? 'No work in progress' :
                                                    'No completed time slots'}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {activeTab === 'all'
                                            ? 'Time slots will appear here when administrators allocate them to you.'
                                            : 'Check back later for updates.'
                                        }
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredSlots.map((slot) => {
                                const project = projects.find(p => p.id === slot.projectId);
                                const slotDate = slot.startTime.toDate();
                                const isOverdue = isBefore(slotDate, new Date()) && slot.status === TimeSlotStatus.PURCHASED;

                                return (
                                    <Card key={slot.id} className={cn(
                                        "transition-all hover:shadow-md",
                                        isOverdue && "border-red-200 bg-red-50/50"
                                    )}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src="" alt={slot.purchasedByName || 'Client'} />
                                                        <AvatarFallback>
                                                            {slot.purchasedByName ? slot.purchasedByName.charAt(0) : 'C'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{project?.title || 'Unknown Project'}</h3>
                                                            {getUrgencyBadge(slot)}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Client: {slot.purchasedByName || 'Not assigned'}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <div className="flex items-center text-sm">
                                                                <Timer className="h-4 w-4 mr-1" />
                                                                {slot.durationHours} hours
                                                            </div>
                                                            <div className="flex items-center text-sm">
                                                                <DollarSign className="h-4 w-4 mr-1" />
                                                                ${slot.hourlyRate}/hr
                                                            </div>
                                                            <div className="flex items-center text-sm">
                                                                <Calendar className="h-4 w-4 mr-1" />
                                                                {getDateDisplay(slotDate)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
                                                            ${(slot.durationHours * slot.hourlyRate).toLocaleString()}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Potential earnings</div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {getSlotStatusBadge(slot.status)}

                                                        <div className="flex gap-2 mt-2">
                                                            {slot.status === TimeSlotStatus.PURCHASED && (
                                                                <Dialog open={isStartWorkDialogOpen && selectedSlot?.id === slot.id}
                                                                    onOpenChange={(open) => {
                                                                        setIsStartWorkDialogOpen(open);
                                                                        if (!open) setSelectedSlot(null);
                                                                    }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => setSelectedSlot(slot)}
                                                                            className="bg-green-600 hover:bg-green-700"
                                                                        >
                                                                            <Play className="h-4 w-4 mr-1" />
                                                                            Start Work
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Start Working on Time Slot</DialogTitle>
                                                                            <DialogDescription>
                                                                                This will mark the time slot as in progress and you can begin working on it.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="py-4">
                                                                            <div className="bg-muted p-4 rounded-lg">
                                                                                <p className="font-medium mb-2">Time Slot Details:</p>
                                                                                <p>Project: {project?.title}</p>
                                                                                <p>Duration: {slot.durationHours} hours</p>
                                                                                <p>Client: {slot.purchasedByName}</p>
                                                                                <p>Start Date: {format(slotDate, 'PPP')}</p>
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setIsStartWorkDialogOpen(false)}>
                                                                                Cancel
                                                                            </Button>
                                                                            <Button onClick={handleStartWork}>
                                                                                <Play className="h-4 w-4 mr-2" />
                                                                                Start Work
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}

                                                            {slot.status === TimeSlotStatus.IN_PROGRESS && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleStartTimer(slot)}
                                                                        variant="outline"
                                                                    >
                                                                        <Timer className="h-4 w-4 mr-1" />
                                                                        Start Timer
                                                                    </Button>

                                                                    <Dialog open={isCompleteDialogOpen && selectedSlot?.id === slot.id}
                                                                        onOpenChange={(open) => {
                                                                            setIsCompleteDialogOpen(open);
                                                                            if (!open) setSelectedSlot(null);
                                                                        }}>
                                                                        <DialogTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => setSelectedSlot(slot)}
                                                                                className="bg-blue-600 hover:bg-blue-700"
                                                                            >
                                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                                Complete
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>Mark Work as Complete</DialogTitle>
                                                                                <DialogDescription>
                                                                                    This will mark the time slot as completed and finalize the payment.
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <div className="py-4">
                                                                                <Alert>
                                                                                    <Info className="h-4 w-4" />
                                                                                    <AlertDescription>
                                                                                        Make sure all work is completed before marking as done.
                                                                                        This action cannot be undone.
                                                                                    </AlertDescription>
                                                                                </Alert>
                                                                            </div>
                                                                            <DialogFooter>
                                                                                <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                                                                                    Cancel
                                                                                </Button>
                                                                                <Button onClick={handleCompleteWork}>
                                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                                    Mark Complete
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FreelancerTimeSlotsView;