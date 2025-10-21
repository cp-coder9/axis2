import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { TimeAllocation, TimeAllocationStatus, TimeSlotStatus, AllocationApprovalStatus, User, AuditAction } from '../types';
import { TimeSlot } from '../types/timeManagement';
import { createApprovalRequest, checkAllocationRequiresApproval } from './allocationApprovalService';
import { logAuditEvent } from '../utils/auditLogger';

const TIME_ALLOCATIONS_COLLECTION = 'timeAllocations';
const TIME_SLOTS_COLLECTION = 'timeSlots';

/**
 * Create a new time allocation (Admin only)
 */
export const createTimeAllocation = async (
    allocationData: Omit<TimeAllocation, 'id' | 'createdAt' | 'updatedAt'>,
    user: User,
    largeAllocationThreshold: number = 50
): Promise<{ allocationId: string; requiresApproval: boolean; approvalRequestId?: string }> => {
    try {
        // Check for conflicts before creating
        const conflicts = await checkAllocationConflicts(
            allocationData.freelancerId,
            allocationData.startDate,
            allocationData.endDate
        );

        if (conflicts.length > 0) {
            throw new Error(`Time allocation conflicts with existing allocations: ${conflicts.map(c => c.projectId).join(', ')}`);
        }

        // Check if this allocation requires approval
        const requiresApproval = checkAllocationRequiresApproval(allocationData.allocatedHours, largeAllocationThreshold);

        let approvalRequestId: string | undefined;
        let initialStatus = TimeAllocationStatus.ACTIVE;

        if (requiresApproval) {
            // Create approval request first
            approvalRequestId = await createApprovalRequest(
                allocationData,
                `Large time allocation of ${allocationData.allocatedHours} hours requested`
            );
            initialStatus = TimeAllocationStatus.PENDING_APPROVAL;
        }

        const allocationsCollectionRef = collection(db, TIME_ALLOCATIONS_COLLECTION);
        const docRef = await addDoc(allocationsCollectionRef, {
            ...allocationData,
            status: initialStatus,
            requiresApproval,
            approvalStatus: requiresApproval ? AllocationApprovalStatus.PENDING : undefined,
            approvalRequestId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // If no approval required, create time slots immediately
        if (!requiresApproval) {
            await createTimeSlotsFromAllocation(docRef.id, allocationData);
        }

        // If approval required, update the approval request with the allocation ID
        if (requiresApproval && approvalRequestId) {
            const { updateDoc } = await import('firebase/firestore');
            const approvalDocRef = doc(db, 'allocationApprovalRequests', approvalRequestId);
            await updateDoc(approvalDocRef, {
                allocationId: docRef.id,
                updatedAt: serverTimestamp()
            });
        }

        // Log audit event
        await logAuditEvent(user, AuditAction.TIME_ALLOCATION_CREATED, {
            resourceType: 'timeAllocation',
            resourceId: docRef.id,
            projectId: allocationData.projectId,
            freelancerId: allocationData.freelancerId,
            allocatedHours: allocationData.allocatedHours,
            requiresApproval,
            approvalRequestId
        });

        return {
            allocationId: docRef.id,
            requiresApproval,
            approvalRequestId
        };
    } catch (error) {
        console.error('Error creating time allocation:', error);
        throw new Error('Failed to create time allocation');
    }
};

/**
 * Get time allocations with optional filtering
 */
export const getTimeAllocations = async (
    projectId?: string,
    freelancerId?: string
): Promise<TimeAllocation[]> => {
    try {
        const allocationsCollectionRef = collection(db, TIME_ALLOCATIONS_COLLECTION);
        let q = query(allocationsCollectionRef, orderBy('createdAt', 'desc'));

        if (projectId) {
            q = query(q, where('projectId', '==', projectId));
        }

        if (freelancerId) {
            q = query(q, where('freelancerId', '==', freelancerId));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimeAllocation));
    } catch (error) {
        console.error('Error getting time allocations:', error);
        throw new Error('Failed to get time allocations');
    }
};

/**
 * Update a time allocation
 */
export const updateTimeAllocation = async (
    allocationId: string,
    updates: Partial<TimeAllocation>,
    user: User
): Promise<void> => {
    try {
        // If updating time-related fields, check for conflicts
        if (updates.startDate || updates.endDate || updates.freelancerId) {
            const existingDoc = await getDoc(doc(db, TIME_ALLOCATIONS_COLLECTION, allocationId));
            if (!existingDoc.exists()) {
                throw new Error('Allocation not found');
            }

            const existingData = existingDoc.data() as TimeAllocation;
            const freelancerId = updates.freelancerId || existingData.freelancerId;
            const startDate = updates.startDate || existingData.startDate;
            const endDate = updates.endDate || existingData.endDate;

            const conflicts = await checkAllocationConflicts(
                freelancerId,
                startDate,
                endDate,
                allocationId
            );

            if (conflicts.length > 0) {
                throw new Error(`Time allocation conflicts with existing allocations: ${conflicts.map(c => c.projectId).join(', ')}`);
            }
        }

        const allocationDocRef = doc(db, TIME_ALLOCATIONS_COLLECTION, allocationId);
        await updateDoc(allocationDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Log audit event
        await logAuditEvent(user, AuditAction.TIME_ALLOCATION_UPDATED, {
            resourceType: 'timeAllocation',
            resourceId: allocationId,
            updates: Object.keys(updates),
            ...updates
        });
    } catch (error) {
        console.error('Error updating time allocation:', error);
        throw new Error('Failed to update time allocation');
    }
};

/**
 * Delete a time allocation and its associated slots
 */
export const deleteTimeAllocation = async (allocationId: string, user: User): Promise<void> => {
    try {
        // Get allocation data before deleting for audit logging
        const allocationDoc = await getDoc(doc(db, TIME_ALLOCATIONS_COLLECTION, allocationId));
        if (!allocationDoc.exists()) {
            throw new Error('Allocation not found');
        }
        const allocationData = allocationDoc.data() as TimeAllocation;

        // Delete associated time slots first
        const slotsQuery = query(
            collection(db, TIME_SLOTS_COLLECTION),
            where('allocationId', '==', allocationId)
        );
        const slotsSnapshot = await getDocs(slotsQuery);

        const deletePromises = slotsSnapshot.docs.map(slotDoc =>
            deleteDoc(doc(db, TIME_SLOTS_COLLECTION, slotDoc.id))
        );

        await Promise.all(deletePromises);

        // Delete the allocation
        const allocationDocRef = doc(db, TIME_ALLOCATIONS_COLLECTION, allocationId);
        await deleteDoc(allocationDocRef);

        // Log audit event
        await logAuditEvent(user, AuditAction.TIME_ALLOCATION_DELETED, {
            resourceType: 'timeAllocation',
            resourceId: allocationId,
            projectId: allocationData.projectId,
            freelancerId: allocationData.freelancerId,
            allocatedHours: allocationData.allocatedHours,
            deletedSlotsCount: slotsSnapshot.docs.length
        });
    } catch (error) {
        console.error('Error deleting time allocation:', error);
        throw new Error('Failed to delete time allocation');
    }
};

/**
 * Create time slots from an allocation (4-hour blocks)
 */
const createTimeSlotsFromAllocation = async (
    allocationId: string,
    allocationData: Omit<TimeAllocation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
    try {
        const slotsCollectionRef = collection(db, TIME_SLOTS_COLLECTION);
        const totalHours = allocationData.allocatedHours;
        const slotDuration = 4; // 4-hour blocks
        const numberOfSlots = Math.ceil(totalHours / slotDuration);

        const slotPromises = [];

        for (let i = 0; i < numberOfSlots; i++) {
            const slotStartTime = new Timestamp(
                allocationData.startDate.seconds + (i * slotDuration * 60 * 60),
                allocationData.startDate.nanoseconds
            );

            const slotEndTime = new Timestamp(
                slotStartTime.seconds + (slotDuration * 60 * 60),
                slotStartTime.nanoseconds
            );

            const slotData = {
                allocationId,
                projectId: allocationData.projectId,
                freelancerId: allocationData.freelancerId,
                freelancerName: allocationData.freelancerName,
                startTime: slotStartTime,
                endTime: slotEndTime,
                durationHours: Math.min(slotDuration, totalHours - (i * slotDuration)),
                hourlyRate: allocationData.hourlyRate,
                status: TimeSlotStatus.AVAILABLE,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            slotPromises.push(addDoc(slotsCollectionRef, slotData));
        }

        await Promise.all(slotPromises);
    } catch (error) {
        console.error('Error creating time slots:', error);
        throw new Error('Failed to create time slots');
    }
};

/**
 * Get available time slots for a project
 */
export const getAvailableTimeSlots = async (projectId: string): Promise<TimeSlot[]> => {
    try {
        const slotsCollectionRef = collection(db, TIME_SLOTS_COLLECTION);
        const q = query(
            slotsCollectionRef,
            where('projectId', '==', projectId),
            where('status', '==', TimeSlotStatus.AVAILABLE),
            orderBy('startTime', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimeSlot));
    } catch (error) {
        console.error('Error getting available time slots:', error);
        throw new Error('Failed to get available time slots');
    }
};

/**
 * Get time slots for a freelancer
 */
export const getTimeSlotsForFreelancer = async (freelancerId: string): Promise<TimeSlot[]> => {
    try {
        const slotsCollectionRef = collection(db, TIME_SLOTS_COLLECTION);
        const q = query(
            slotsCollectionRef,
            where('freelancerId', '==', freelancerId),
            orderBy('startTime', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimeSlot));
    } catch (error) {
        console.error('Error getting freelancer time slots:', error);
        throw new Error('Failed to get freelancer time slots');
    }
};

/**
 * Check for time allocation conflicts for a freelancer
 */
export const checkAllocationConflicts = async (
    freelancerId: string,
    startDate: Timestamp,
    endDate: Timestamp,
    excludeAllocationId?: string
): Promise<TimeAllocation[]> => {
    try {
        const allocationsCollectionRef = collection(db, TIME_ALLOCATIONS_COLLECTION);
        const q = query(
            allocationsCollectionRef,
            where('freelancerId', '==', freelancerId),
            where('status', '==', TimeAllocationStatus.ACTIVE)
        );

        const querySnapshot = await getDocs(q);
        const conflicts: TimeAllocation[] = [];

        querySnapshot.docs.forEach(doc => {
            const allocation = { id: doc.id, ...doc.data() } as TimeAllocation;

            // Skip the allocation being updated
            if (excludeAllocationId && allocation.id === excludeAllocationId) {
                return;
            }

            // Check for time overlap
            const allocationStart = allocation.startDate.toDate().getTime();
            const allocationEnd = allocation.endDate.toDate().getTime();
            const newStart = startDate.toDate().getTime();
            const newEnd = endDate.toDate().getTime();

            // Check if periods overlap
            if (newStart < allocationEnd && newEnd > allocationStart) {
                conflicts.push(allocation);
            }
        });

        return conflicts;
    } catch (error) {
        console.error('Error checking allocation conflicts:', error);
        throw new Error('Failed to check allocation conflicts');
    }
};