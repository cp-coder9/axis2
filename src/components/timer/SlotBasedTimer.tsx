import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { UserRole } from '../../types';
import { format, addHours, differenceInMinutes } from 'date-fns';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    Progress,
    Alert,
    AlertDescription,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Label,
    cn
} from '../../lib/shadcn';
import {
    Play,
    Pause,
    Square,
    Clock,
    AlertTriangle,
    CheckCircle,
    Timer,
    Calendar,
    User
} from 'lucide-react';

interface SlotBasedTimerProps {
    projectId: string;
    jobCardId: string;
    jobCardTitle: string;
    className?: string;
}

interface AllocatedSlot {
    id: string;
    freelancerId: string;
    freelancerName: string;
    projectId: string;
    projectTitle: string;
    startDate: Date;
    endDate: Date;
    hoursAllocated: number;
    hoursUtilized: number;
    status: 'available' | 'in_progress' | 'completed' | 'expired';
    remainingHours: number;
}

export const SlotBasedTimer: React.FC<SlotBasedTimerProps> = ({
    projectId,
    jobCardId,
    jobCardTitle,
    className = ''
}) => {
    const {
        user,
        startGlobalTimer,
        stopGlobalTimerAndLog,
        getTimeAllocationsByFreelancer,
        getTimeSlots
    } = useAppContext();

    const [selectedSlotId, setSelectedSlotId] = useState<string>('');
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    // Load allocations and time slots
    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user || user.role !== UserRole.FREELANCER) {
            setLoading(false);
            return;
        }

        try {
            const [userAllocations, allTimeSlots] = await Promise.all([
                getTimeAllocationsByFreelancer(user.id),
                getTimeSlots()
            ]);

            setAllocations(userAllocations);
            setTimeSlots(allTimeSlots);
        } catch (error) {
            console.error('Error loading timer data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get allocated slots for this freelancer and project
    const allocatedSlots = useMemo((): AllocatedSlot[] => {
        if (!user || user.role !== UserRole.FREELANCER || loading) return [];

        const freelancerAllocations = allocations.filter((a: any) =>
            a.freelancerId === user.id &&
            a.projectId === projectId &&
            new Date(a.endDate) > new Date() // Not expired
        );

        return freelancerAllocations.map((allocation: any) => {
            // Find corresponding time slot to get utilization data
            const slot = timeSlots.find((s: any) => s.allocationId === allocation.id);
            const utilizedHours = slot ? slot.hoursUtilized || 0 : 0;
            const remainingHours = Math.max(0, allocation.hoursAllocated - utilizedHours);

            let status: AllocatedSlot['status'] = 'available';
            if (utilizedHours >= allocation.hoursAllocated) {
                status = 'completed';
            } else if (allocatedSlots.some(s => s.status === 'in_progress')) {
                status = 'in_progress';
            } else if (new Date(allocation.endDate) < new Date()) {
                status = 'expired';
            }

            return {
                id: allocation.id,
                freelancerId: allocation.freelancerId,
                freelancerName: user.name,
                projectId: allocation.projectId,
                projectTitle: allocation.projectTitle || 'Unknown Project',
                startDate: new Date(allocation.startDate),
                endDate: new Date(allocation.endDate),
                hoursAllocated: allocation.hoursAllocated,
                hoursUtilized: utilizedHours,
                status,
                remainingHours
            };
        }).filter(slot => slot.status !== 'expired'); // Don't show expired slots
    }, [user, allocations, timeSlots, projectId, loading]);

    // Update current time every second when timer is active
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (allocatedSlots.some(slot => slot.status === 'in_progress')) {
            // For now, just show a simple timer - in a real implementation,
            // you'd get the actual start time from the timer service
            interval = setInterval(() => {
                setCurrentTime(prev => prev + 1);
            }, 1000);
        } else {
            setCurrentTime(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [allocatedSlots]);

    // Auto-select the first available slot if none selected
    useEffect(() => {
        if (!selectedSlotId && allocatedSlots.length > 0) {
            const availableSlot = allocatedSlots.find(slot => slot.status === 'available');
            if (availableSlot) {
                setSelectedSlotId(availableSlot.id);
            }
        }
    }, [allocatedSlots, selectedSlotId]);

    const selectedSlot = allocatedSlots.find(slot => slot.id === selectedSlotId);

    const handleStartTimer = async () => {
        if (!selectedSlot || selectedSlot.status !== 'available') return;

        setIsStarting(true);
        try {
            const success = await startGlobalTimer(jobCardId, jobCardTitle, projectId, selectedSlot.hoursAllocated);
            if (success) {
                console.log('Timer started for allocated slot:', selectedSlot.id);
            }
        } catch (error) {
            console.error('Error starting timer:', error);
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopTimer = async (notes?: string, completionReason?: 'completed' | 'stopped' | 'timeout') => {
        setIsStopping(true);
        try {
            await stopGlobalTimerAndLog(projectId, jobCardId, {
                notes: notes || '',
                completionReason: completionReason || 'stopped'
            });
            console.log('Timer stopped for allocated slot');
        } catch (error) {
            console.error('Error stopping timer:', error);
        } finally {
            setIsStopping(false);
        }
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const getSlotStatusColor = (status: AllocatedSlot['status']) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'expired': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSlotStatusIcon = (status: AllocatedSlot['status']) => {
        switch (status) {
            case 'available': return <CheckCircle className="h-3 w-3" />;
            case 'in_progress': return <Timer className="h-3 w-3" />;
            case 'completed': return <CheckCircle className="h-3 w-3" />;
            case 'expired': return <AlertTriangle className="h-3 w-3" />;
            default: return <Clock className="h-3 w-3" />;
        }
    };

    // Only show for freelancers
    if (!user || user.role !== UserRole.FREELANCER) {
        return null;
    }

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Check if user has any allocated slots for this project
    if (allocatedSlots.length === 0) {
        return (
            <Card className={cn('border-orange-200 bg-orange-50', className)}>
                <CardContent className="py-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                            <h4 className="font-medium text-orange-900">No Time Allocation</h4>
                            <p className="text-sm text-orange-700">
                                You don't have any allocated time slots for this project. Contact your administrator to request time allocation.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isTimerActive = allocatedSlots.some(slot => slot.status === 'in_progress');
    const hasAvailableSlots = allocatedSlots.some(slot => slot.status === 'available');

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Tracking
                </CardTitle>
                <CardDescription>
                    Track time against your allocated slots for: {jobCardTitle}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Slot Selection */}
                <div className="space-y-2">
                    <Label htmlFor="slot-select">Select Time Slot</Label>
                    <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose an allocated time slot" />
                        </SelectTrigger>
                        <SelectContent>
                            {allocatedSlots.map((slot) => (
                                <SelectItem key={slot.id} value={slot.id}>
                                    <div className="flex items-center gap-2">
                                        {getSlotStatusIcon(slot.status)}
                                        <span>
                                            {slot.hoursAllocated}h allocated
                                            ({format(slot.startDate, 'MMM dd')} - {format(slot.endDate, 'MMM dd')})
                                        </span>
                                        <Badge variant="outline" className={getSlotStatusColor(slot.status)}>
                                            {slot.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Selected Slot Details */}
                {selectedSlot && (
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{selectedSlot.freelancerName}</span>
                                    </div>
                                    <Badge variant="outline" className={getSlotStatusColor(selectedSlot.status)}>
                                        {selectedSlot.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {format(selectedSlot.startDate, 'MMM dd, yyyy')} - {format(selectedSlot.endDate, 'MMM dd, yyyy')}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Allocated: {selectedSlot.hoursAllocated}h</span>
                                        <span>Utilized: {selectedSlot.hoursUtilized.toFixed(1)}h</span>
                                        <span>Remaining: {selectedSlot.remainingHours.toFixed(1)}h</span>
                                    </div>
                                    <Progress
                                        value={(selectedSlot.hoursUtilized / selectedSlot.hoursAllocated) * 100}
                                        className="h-2"
                                    />
                                </div>

                                {selectedSlot.status === 'completed' && (
                                    <Alert>
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            This time slot has been fully utilized. Great work!
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Timer Controls */}
                <div className="flex items-center justify-center gap-4">
                    {!isTimerActive ? (
                        <Button
                            onClick={handleStartTimer}
                            disabled={!selectedSlot || selectedSlot.status !== 'available' || isStarting || !hasAvailableSlots}
                            className="flex items-center gap-2"
                        >
                            {isStarting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            Start Timer
                        </Button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-mono font-bold text-primary">
                                    {formatTime(currentTime)}
                                </div>
                                <div className="text-sm text-muted-foreground">Current Session</div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => handleStopTimer('', 'stopped')}
                                disabled={isStopping}
                                className="flex items-center gap-2"
                            >
                                {isStopping ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                    <Square className="h-4 w-4" />
                                )}
                                Stop Timer
                            </Button>
                        </div>
                    )}
                </div>

                {/* Warnings */}
                {!hasAvailableSlots && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            All your allocated time slots for this project are either completed or in progress.
                            Contact your administrator for additional time allocation.
                        </AlertDescription>
                    </Alert>
                )}

                {selectedSlot && selectedSlot.remainingHours < 1 && selectedSlot.status === 'available' && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Warning: This time slot has less than 1 hour remaining. Consider completing it in this session.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Slot Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                            {allocatedSlots.filter(s => s.status === 'available').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Available Slots</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                            {allocatedSlots.filter(s => s.status === 'in_progress').length}
                        </div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                            {allocatedSlots.filter(s => s.status === 'completed').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                            {allocatedSlots.reduce((sum, s) => sum + s.remainingHours, 0).toFixed(1)}h
                        </div>
                        <div className="text-xs text-muted-foreground">Total Remaining</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SlotBasedTimer;