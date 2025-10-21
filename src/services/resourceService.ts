import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { ResourceAssignment, User, Task } from '../types';

/**
 * Resource Service
 * Handles all resource-related operations for project management
 */

const RESOURCE_ASSIGNMENTS_COLLECTION = 'resourceAssignments';

/**
 * Create a resource assignment
 */
export const createResourceAssignment = async (
    assignmentData: Omit<ResourceAssignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const now = serverTimestamp();

        const newAssignment: Omit<ResourceAssignment, 'id'> = {
            ...assignmentData,
            createdAt: now as Timestamp,
            updatedAt: now as Timestamp,
        };

        const docRef = doc(collection(db, RESOURCE_ASSIGNMENTS_COLLECTION));
        await setDoc(docRef, newAssignment);

        console.log('Resource assignment created successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating resource assignment:', error);
        throw new Error('Failed to create resource assignment');
    }
};

/**
 * Get resource assignments for a task
 */
export const getTaskResourceAssignments = async (taskId: string): Promise<ResourceAssignment[]> => {
    try {
        const q = query(
            collection(db, RESOURCE_ASSIGNMENTS_COLLECTION),
            where('taskId', '==', taskId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const assignments: ResourceAssignment[] = [];

        querySnapshot.forEach((doc) => {
            const assignmentData = doc.data() as Omit<ResourceAssignment, 'id'>;
            assignments.push({
                id: doc.id,
                ...assignmentData,
            } as ResourceAssignment);
        });

        return assignments;
    } catch (error) {
        console.error('Error fetching task resource assignments:', error);
        throw new Error('Failed to fetch task resource assignments');
    }
};

/**
 * Get resource assignments for a project
 */
export const getProjectResourceAssignments = async (projectId: string): Promise<ResourceAssignment[]> => {
    try {
        // This would require a projectId field in assignments or joining with tasks
        // For now, we'll get all assignments and filter by project
        const q = query(
            collection(db, RESOURCE_ASSIGNMENTS_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const assignments: ResourceAssignment[] = [];

        querySnapshot.forEach((doc) => {
            const assignmentData = doc.data() as Omit<ResourceAssignment, 'id'>;
            assignments.push({
                id: doc.id,
                ...assignmentData,
            } as ResourceAssignment);
        });

        // TODO: Filter by project ID once we have the relationship
        return assignments;
    } catch (error) {
        console.error('Error fetching project resource assignments:', error);
        throw new Error('Failed to fetch project resource assignments');
    }
};

/**
 * Get resource assignments for a user
 */
export const getUserResourceAssignments = async (userId: string): Promise<ResourceAssignment[]> => {
    try {
        const q = query(
            collection(db, RESOURCE_ASSIGNMENTS_COLLECTION),
            where('resourceId', '==', userId),
            where('resourceType', '==', 'user'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const assignments: ResourceAssignment[] = [];

        querySnapshot.forEach((doc) => {
            const assignmentData = doc.data() as Omit<ResourceAssignment, 'id'>;
            assignments.push({
                id: doc.id,
                ...assignmentData,
            } as ResourceAssignment);
        });

        return assignments;
    } catch (error) {
        console.error('Error fetching user resource assignments:', error);
        throw new Error('Failed to fetch user resource assignments');
    }
};

/**
 * Update a resource assignment
 */
export const updateResourceAssignment = async (
    assignmentId: string,
    updates: Partial<Omit<ResourceAssignment, 'id' | 'createdAt'>>
): Promise<void> => {
    try {
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, RESOURCE_ASSIGNMENTS_COLLECTION, assignmentId), updateData);
        console.log('Resource assignment updated successfully:', assignmentId);
    } catch (error) {
        console.error('Error updating resource assignment:', error);
        throw new Error('Failed to update resource assignment');
    }
};

/**
 * Delete a resource assignment
 */
export const deleteResourceAssignment = async (assignmentId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, RESOURCE_ASSIGNMENTS_COLLECTION, assignmentId), {
            isActive: false,
            updatedAt: serverTimestamp(),
        });

        console.log('Resource assignment deactivated successfully:', assignmentId);
    } catch (error) {
        console.error('Error deactivating resource assignment:', error);
        throw new Error('Failed to deactivate resource assignment');
    }
};

/**
 * Bulk create resource assignments
 */
export const createBulkResourceAssignments = async (
    assignments: Omit<ResourceAssignment, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<string[]> => {
    try {
        const batch = writeBatch(db);
        const now = serverTimestamp();
        const createdIds: string[] = [];

        assignments.forEach((assignmentData) => {
            const docRef = doc(collection(db, RESOURCE_ASSIGNMENTS_COLLECTION));
            createdIds.push(docRef.id);

            const newAssignment: Omit<ResourceAssignment, 'id'> = {
                ...assignmentData,
                createdAt: now as Timestamp,
                updatedAt: now as Timestamp,
            };

            batch.set(docRef, newAssignment);
        });

        await batch.commit();
        console.log('Bulk resource assignments created successfully:', createdIds.length);
        return createdIds;
    } catch (error) {
        console.error('Error creating bulk resource assignments:', error);
        throw new Error('Failed to create bulk resource assignments');
    }
};

/**
 * Get resource utilization for a user within a date range
 */
export const getUserResourceUtilization = async (
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalAllocation: number;
    assignments: ResourceAssignment[];
    utilizationByDate: Record<string, number>;
}> => {
    try {
        const assignments = await getUserResourceAssignments(userId);

        // Filter assignments within date range
        const relevantAssignments = assignments.filter(assignment => {
            const assignmentStart = assignment.startDate.toDate();
            const assignmentEnd = assignment.endDate.toDate();
            return assignmentStart <= endDate && assignmentEnd >= startDate;
        });

        // Calculate total allocation percentage
        const totalAllocation = relevantAssignments.reduce((sum, assignment) => {
            return sum + assignment.allocationPercentage;
        }, 0);

        // Calculate utilization by date (simplified - assumes daily allocation)
        const utilizationByDate: Record<string, number> = {};
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayUtilization = relevantAssignments
                .filter(assignment => {
                    const start = assignment.startDate.toDate();
                    const end = assignment.endDate.toDate();
                    return currentDate >= start && currentDate <= end;
                })
                .reduce((sum, assignment) => sum + assignment.allocationPercentage, 0);

            utilizationByDate[dateKey] = Math.min(dayUtilization, 100); // Cap at 100%
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            totalAllocation,
            assignments: relevantAssignments,
            utilizationByDate,
        };
    } catch (error) {
        console.error('Error getting user resource utilization:', error);
        throw new Error('Failed to get user resource utilization');
    }
};

/**
 * Check for resource conflicts (over-allocation)
 */
export const checkResourceConflicts = async (
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeAssignmentId?: string
): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
        date: Date;
        totalAllocation: number;
        assignments: ResourceAssignment[];
    }>;
}> => {
    try {
        const assignments = await getUserResourceAssignments(userId);

        // Filter out the assignment being checked (for updates)
        const relevantAssignments = assignments.filter(assignment =>
            assignment.id !== excludeAssignmentId
        );

        const conflicts: Array<{
            date: Date;
            totalAllocation: number;
            assignments: ResourceAssignment[];
        }> = [];

        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayAssignments = relevantAssignments.filter(assignment => {
                const start = assignment.startDate.toDate();
                const end = assignment.endDate.toDate();
                return currentDate >= start && currentDate <= end;
            });

            const totalAllocation = dayAssignments.reduce((sum, assignment) =>
                sum + assignment.allocationPercentage, 0
            );

            if (totalAllocation > 100) {
                conflicts.push({
                    date: new Date(currentDate),
                    totalAllocation,
                    assignments: dayAssignments,
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
        };
    } catch (error) {
        console.error('Error checking resource conflicts:', error);
        throw new Error('Failed to check resource conflicts');
    }
};

/**
 * Perform resource leveling for a project
 * Automatically adjusts resource allocations to avoid over-allocation
 */
export const performResourceLeveling = async (
    projectId: string,
    tasks: Task[]
): Promise<{
    leveledAssignments: ResourceAssignment[];
    adjustments: Array<{
        originalAssignment: ResourceAssignment;
        newAllocation: number;
        reason: string;
    }>;
}> => {
    try {
        const assignments = await getProjectResourceAssignments(projectId);

        // Group assignments by resource and date
        const resourceUtilization: Record<string, Record<string, ResourceAssignment[]>> = {};

        assignments.forEach(assignment => {
            if (assignment.resourceType === 'user') {
                const resourceId = assignment.resourceId;
                const startDate = assignment.startDate.toDate();
                const endDate = assignment.endDate.toDate();

                if (!resourceUtilization[resourceId]) {
                    resourceUtilization[resourceId] = {};
                }

                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dateKey = currentDate.toISOString().split('T')[0];
                    if (!resourceUtilization[resourceId][dateKey]) {
                        resourceUtilization[resourceId][dateKey] = [];
                    }
                    resourceUtilization[resourceId][dateKey].push(assignment);
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        });

        // Identify and resolve over-allocations
        const adjustments: Array<{
            originalAssignment: ResourceAssignment;
            newAllocation: number;
            reason: string;
        }> = [];

        const leveledAssignments = [...assignments];

        Object.entries(resourceUtilization).forEach(([resourceId, dateUtilization]) => {
            Object.entries(dateUtilization).forEach(([dateKey, dayAssignments]) => {
                const totalAllocation = dayAssignments.reduce((sum, assignment) =>
                    sum + assignment.allocationPercentage, 0
                );

                if (totalAllocation > 100) {
                    // Distribute allocation evenly among assignments for this day
                    const targetAllocation = 100 / dayAssignments.length;

                    dayAssignments.forEach(assignment => {
                        const originalAllocation = assignment.allocationPercentage;
                        const newAllocation = Math.floor(targetAllocation);

                        if (newAllocation !== originalAllocation) {
                            adjustments.push({
                                originalAssignment: assignment,
                                newAllocation,
                                reason: `Over-allocation on ${dateKey} (${totalAllocation}%). Reduced from ${originalAllocation}% to ${newAllocation}%.`,
                            });

                            // Update the assignment in our result set
                            const assignmentIndex = leveledAssignments.findIndex(a => a.id === assignment.id);
                            if (assignmentIndex !== -1) {
                                leveledAssignments[assignmentIndex] = {
                                    ...leveledAssignments[assignmentIndex],
                                    allocationPercentage: newAllocation,
                                };
                            }
                        }
                    });
                }
            });
        });

        return {
            leveledAssignments,
            adjustments,
        };
    } catch (error) {
        console.error('Error performing resource leveling:', error);
        throw new Error('Failed to perform resource leveling');
    }
};

/**
 * Get resource availability for a user
 */
export const getUserAvailability = async (
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{
    date: Date;
    availablePercentage: number;
    currentAllocations: ResourceAssignment[];
}>> => {
    try {
        const assignments = await getUserResourceAssignments(userId);
        const availability: Array<{
            date: Date;
            availablePercentage: number;
            currentAllocations: ResourceAssignment[];
        }> = [];

        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayAssignments = assignments.filter(assignment => {
                const start = assignment.startDate.toDate();
                const end = assignment.endDate.toDate();
                return currentDate >= start && currentDate <= end;
            });

            const totalAllocation = dayAssignments.reduce((sum, assignment) =>
                sum + assignment.allocationPercentage, 0
            );

            availability.push({
                date: new Date(currentDate),
                availablePercentage: Math.max(0, 100 - totalAllocation),
                currentAllocations: dayAssignments,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return availability;
    } catch (error) {
        console.error('Error getting user availability:', error);
        throw new Error('Failed to get user availability');
    }
};