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
import { TimeAllocation, TimeAllocationStatus, TimeSlot, TimeSlotStatus } from '../types';

const TIME_ALLOCATIONS_COLLECTION = 'timeAllocations';
const TIME_SLOTS_COLLECTION = 'timeSlots';

/**
 * Create a new time allocation (Admin only)
 */
export const createTimeAllocation = async (allocationData: Omit<TimeAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const allocationsCollectionRef = collection(db, TIME_ALLOCATIONS_COLLECTION);
        const docRef = await addDoc(allocationsCollectionRef, {
            ...allocationData,
            status: TimeAllocationStatus.ACTIVE,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Create time slots from the allocation (4-hour blocks)
        await createTimeSlotsFromAllocation(docRef.id, allocationData);

        return docRef.id;
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
    updates: Partial<TimeAllocation>
): Promise<void> => {
    try {
        const allocationDocRef = doc(db, TIME_ALLOCATIONS_COLLECTION, allocationId);
        await updateDoc(allocationDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating time allocation:', error);
        throw new Error('Failed to update time allocation');
    }
};

/**
 * Delete a time allocation and its associated slots
 */
export const deleteTimeAllocation = async (allocationId: string): Promise<void> => {
    try {
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