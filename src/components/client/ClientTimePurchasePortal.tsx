import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { User, Project, UserRole, TimeSlot, TimeSlotStatus } from '../../types';
import { format, isAfter, isBefore, addDays } from 'date-fns';
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
    cn
} from '../../lib/shadcn';
import {
    ShoppingCart,
    Clock,
    Users,
    Calendar,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Search,
    Filter,
    CreditCard,
    Timer,
    Star,
    Info
} from 'lucide-react';

interface ClientTimePurchasePortalProps {
    className?: string;
}

export const ClientTimePurchasePortal: React.FC<ClientTimePurchasePortalProps> = ({
    className = ''
}) => {
    const {
        user,
        projects,
        purchaseTimeSlot,
        getTimeSlotsByProject,
        getTimeSlotsByClient
    } = useAppContext();

    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [clientPurchases, setClientPurchases] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('available');

    // Load data on component mount
    useEffect(() => {
        if (user?.id) {
            loadAvailableSlots();
            loadClientPurchases();
        }
    }, [user?.id]);

    const loadAvailableSlots = async () => {
        try {
            setLoading(true);
            // Load slots for all client projects
            const clientProjects = projects.filter(p =>
                p.clientId === user?.id || p.assignedTeamIds?.includes(user?.id || '')
            );

            const allSlots: TimeSlot[] = [];
            for (const project of clientProjects) {
                const projectSlots = await getTimeSlotsByProject(project.id);
                allSlots.push(...projectSlots);
            }

            // Filter to only available slots
            const available = allSlots.filter(slot => slot.status === TimeSlotStatus.AVAILABLE);
            setAvailableSlots(available);
        } catch (error) {
            console.error('Error loading available slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadClientPurchases = async () => {
        try {
            if (user?.id) {
                const purchases = await getTimeSlotsByClient(user.id);
                setClientPurchases(purchases);
            }
        } catch (error) {
            console.error('Error loading client purchases:', error);
        }
    };

    // Filter slots based on search and project
    const filteredSlots = useMemo(() => {
        let filtered = activeTab === 'available' ? availableSlots : clientPurchases;

        if (searchTerm) {
            filtered = filtered.filter(slot =>
                slot.freelancerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                slot.projectId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedProject !== 'all') {
            filtered = filtered.filter(slot => slot.projectId === selectedProject);
        }

        return filtered;
    }, [availableSlots, clientPurchases, searchTerm, selectedProject, activeTab]);

    // Get project options for filter
    const projectOptions = useMemo(() => {
        const clientProjects = projects.filter(p =>
            p.clientId === user?.id || p.assignedTeamIds?.includes(user?.id || '')
        );
        return clientProjects;
    }, [projects, user?.id]);

    const handlePurchaseSlot = async () => {
        if (!selectedSlot || !user) return;

        try {
            await purchaseTimeSlot(selectedSlot.id, user.id, user.name);
            setIsPurchaseDialogOpen(false);
            setSelectedSlot(null);

            // Reload data
            await loadAvailableSlots();
            await loadClientPurchases();
        } catch (error) {
            console.error('Error purchasing time slot:', error);
            // TODO: Show error toast
        }
    };

    const getSlotStatusBadge = (status: TimeSlotStatus) => {
        switch (status) {
            case TimeSlotStatus.AVAILABLE:
                return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
            case TimeSlotStatus.PURCHASED:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Purchased</Badge>;
            case TimeSlotStatus.IN_PROGRESS:
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
            case TimeSlotStatus.COMPLETED:
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Completed</Badge>;
            case TimeSlotStatus.CANCELLED:
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTotalPurchasedValue = () => {
        return clientPurchases.reduce((total, slot) => total + (slot.durationHours * slot.hourlyRate), 0);
    };

    const getTotalPurchasedHours = () => {
        return clientPurchases.reduce((total, slot) => total + slot.durationHours, 0);
    };

    if (user?.role !== UserRole.CLIENT) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        This page is only available to clients.
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
                                <ShoppingCart className="h-6 w-6" />
                                Time Purchase Portal
                            </CardTitle>
                            <CardDescription>
                                Browse and purchase available time slots for your projects
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                {/* Stats Cards */}
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{availableSlots.length}</div>
                            <div className="text-sm text-muted-foreground">Available Slots</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{clientPurchases.length}</div>
                            <div className="text-sm text-muted-foreground">My Purchases</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{getTotalPurchasedHours()}</div>
                            <div className="text-sm text-muted-foreground">Total Hours</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">${getTotalPurchasedValue().toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Spent</div>
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
                                placeholder="Search by freelancer name or project..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projectOptions.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">
                        Available Slots ({availableSlots.length})
                    </TabsTrigger>
                    <TabsTrigger value="purchased">
                        My Purchases ({clientPurchases.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-4">
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
                                    <h3 className="text-lg font-medium text-foreground mb-2">No available time slots</h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || selectedProject !== 'all'
                                            ? 'Try adjusting your filters.'
                                            : 'Time slots will appear here when administrators allocate them to your projects.'
                                        }
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredSlots.map((slot) => {
                                const project = projects.find(p => p.id === slot.projectId);
                                const isUpcoming = isAfter(slot.startTime.toDate(), new Date());
                                const isStartingSoon = isUpcoming && isBefore(slot.startTime.toDate(), addDays(new Date(), 7));

                                return (
                                    <Card key={slot.id} className={cn(
                                        "transition-all hover:shadow-md",
                                        isStartingSoon && "border-yellow-200 bg-yellow-50/50"
                                    )}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src="" alt={slot.freelancerName} />
                                                        <AvatarFallback>{slot.freelancerName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold">{slot.freelancerName}</h3>
                                                        <p className="text-sm text-muted-foreground">{project?.title}</p>
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
                                                                {format(slot.startTime.toDate(), 'MMM dd, yyyy')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
                                                            ${(slot.durationHours * slot.hourlyRate).toLocaleString()}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Total cost</div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {getSlotStatusBadge(slot.status)}

                                                        {isStartingSoon && (
                                                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                Starting soon
                                                            </Badge>
                                                        )}

                                                        <Dialog open={isPurchaseDialogOpen && selectedSlot?.id === slot.id}
                                                            onOpenChange={(open) => {
                                                                setIsPurchaseDialogOpen(open);
                                                                if (!open) setSelectedSlot(null);
                                                            }}>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    onClick={() => setSelectedSlot(slot)}
                                                                    className="mt-2"
                                                                >
                                                                    <CreditCard className="h-4 w-4 mr-2" />
                                                                    Purchase
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Confirm Purchase</DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you sure you want to purchase this time slot?
                                                                    </DialogDescription>
                                                                </DialogHeader>

                                                                {selectedSlot && (
                                                                    <div className="py-4">
                                                                        <div className="bg-muted p-4 rounded-lg">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="font-medium">Freelancer:</span>
                                                                                <span>{selectedSlot.freelancerName}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="font-medium">Duration:</span>
                                                                                <span>{selectedSlot.durationHours} hours</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="font-medium">Rate:</span>
                                                                                <span>${selectedSlot.hourlyRate}/hour</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="font-medium">Start Date:</span>
                                                                                <span>{format(selectedSlot.startTime.toDate(), 'PPP')}</span>
                                                                            </div>
                                                                            <Separator className="my-2" />
                                                                            <div className="flex items-center justify-between font-bold">
                                                                                <span>Total Cost:</span>
                                                                                <span>${(selectedSlot.durationHours * selectedSlot.hourlyRate).toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button onClick={handlePurchaseSlot}>
                                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                                        Confirm Purchase
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
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

                <TabsContent value="purchased" className="space-y-4">
                    {filteredSlots.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <div className="text-center">
                                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">No purchased time slots</h3>
                                    <p className="text-muted-foreground">
                                        Your purchased time slots will appear here.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Freelancer</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Total Cost</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSlots.map((slot) => {
                                    const project = projects.find(p => p.id === slot.projectId);
                                    return (
                                        <TableRow key={slot.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src="" alt={slot.freelancerName} />
                                                        <AvatarFallback>{slot.freelancerName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{slot.freelancerName}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{project?.title}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Timer className="h-4 w-4 mr-1" />
                                                    {slot.durationHours}h
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                    ${slot.hourlyRate}/hr
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    ${(slot.durationHours * slot.hourlyRate).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {format(slot.startTime.toDate(), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getSlotStatusBadge(slot.status)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClientTimePurchasePortal;