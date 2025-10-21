import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, AlertTriangle } from 'lucide-react';
import { getAllUsers } from '@/services/userService';
import { getProjectResourceAssignments, getUserResourceUtilization } from '@/services/resourceService';
import { Timestamp } from 'firebase/firestore';

interface ResourceCalendarViewProps {
    projectId: string;
    className?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

import { ResourceAssignment } from '@/types';

const ResourceCalendarView: React.FC<ResourceCalendarViewProps> = ({
    projectId,
    className
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    // Calculate the date range for the current month view
    const dateRange = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return { start, end };
    }, [currentDate]);

    // Load users and assignments
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [usersData, assignmentsData] = await Promise.all([
                    getAllUsers(),
                    getProjectResourceAssignments(projectId)
                ]);
                setUsers(usersData);
                setAssignments(assignmentsData);
            } catch (error) {
                console.error('Error loading resource calendar data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [projectId]);

    // Filter assignments by selected user
    const filteredAssignments = useMemo(() => {
        if (selectedUserId === 'all') {
            return assignments;
        }
        return assignments.filter(assignment => assignment.resourceId === selectedUserId);
    }, [assignments, selectedUserId]);

    // Calculate utilization for each user and date
    const utilizationData = useMemo(() => {
        const data: Record<string, Record<string, number>> = {};

        users.forEach(user => {
            data[user.id] = {};
            const userAssignments = filteredAssignments.filter(a => a.resourceId === user.id);

            const currentDate = new Date(dateRange.start);
            while (currentDate <= dateRange.end) {
                const dateKey = currentDate.toISOString().split('T')[0];
                const dayAssignments = userAssignments.filter(assignment => {
                    const start = assignment.startDate.toDate();
                    const end = assignment.endDate.toDate();
                    return currentDate >= start && currentDate <= end && assignment.isActive;
                });

                const totalAllocation = dayAssignments.reduce((sum, assignment) =>
                    sum + assignment.allocationPercentage, 0
                );

                data[user.id][dateKey] = Math.min(totalAllocation, 100);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        return data;
    }, [users, filteredAssignments, dateRange]);

    // Get utilization color based on percentage
    const getUtilizationColor = (percentage: number) => {
        if (percentage === 0) return 'bg-gray-100';
        if (percentage <= 50) return 'bg-green-200';
        if (percentage <= 80) return 'bg-yellow-200';
        if (percentage <= 100) return 'bg-orange-200';
        return 'bg-red-200'; // Over-allocated
    };

    // Get utilization text color
    const getUtilizationTextColor = (percentage: number) => {
        if (percentage === 0) return 'text-gray-500';
        if (percentage <= 50) return 'text-green-700';
        if (percentage <= 80) return 'text-yellow-700';
        if (percentage <= 100) return 'text-orange-700';
        return 'text-red-700'; // Over-allocated
    };

    // Navigate to previous/next month
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const days = [];
        const firstDay = new Date(dateRange.start);
        const lastDay = new Date(dateRange.end);

        // Add empty cells for days before the first day of the month
        const startDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        const currentDay = new Date(firstDay);
        while (currentDay <= lastDay) {
            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }

        return days;
    }, [dateRange]);

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="text-center">Loading resource calendar...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Resource Calendar
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-medium min-w-32 text-center">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('next')}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Filter by User:</label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-100 border"></div>
                            <span>0%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-200 border"></div>
                            <span>1-50%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-200 border"></div>
                            <span>51-80%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-orange-200 border"></div>
                            <span>81-100%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-200 border"></div>
                            <span>&gt;100%</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-2 text-center font-medium text-sm bg-gray-50 rounded">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`min-h-24 p-2 border rounded ${day ? 'bg-white' : 'bg-gray-50'
                                    }`}
                            >
                                {day && (
                                    <>
                                        <div className="text-sm font-medium mb-1">
                                            {day.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {users.map(user => {
                                                const dateKey = day.toISOString().split('T')[0];
                                                const utilization = utilizationData[user.id]?.[dateKey] || 0;
                                                const showUser = selectedUserId === 'all' || selectedUserId === user.id;

                                                if (!showUser || utilization === 0) return null;

                                                return (
                                                    <div
                                                        key={user.id}
                                                        className={`text-xs p-1 rounded flex items-center justify-between ${getUtilizationColor(utilization)}`}
                                                    >
                                                        <span className="truncate mr-1">
                                                            {user.name.split(' ')[0]}
                                                        </span>
                                                        <span className={`font-medium ${getUtilizationTextColor(utilization)}`}>
                                                            {utilization}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                                        <p className="text-2xl font-bold">{users.length}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                                        <p className="text-2xl font-bold">
                                            {assignments.filter(a => a.isActive).length}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-lg px-2 py-1">
                                        {assignments.filter(a => a.isActive).length}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Over-allocated Days</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {Object.values(utilizationData).reduce((total, userData) =>
                                                total + Object.values(userData).filter(util => util > 100).length, 0
                                            )}
                                        </p>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResourceCalendarView;