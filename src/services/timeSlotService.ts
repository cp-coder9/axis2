import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { TimeSlot, TimeSlotStatus, TimePurchase, TimePurchaseStatus } from '../types';

const TIME_SLOTS_COLLECTION = 'timeSlots';
const TIME_PURCHASES_COLLECTION = 'timePurchases';

/**
 * Update time slot status
 */
export const updateTimeSlotStatus = async (
    slotId: string,
    status: TimeSlotStatus,
    additionalData?: Partial<TimeSlot>
): Promise<void> => {
    try {
        const slotDocRef = doc(db, TIME_SLOTS_COLLECTION, slotId);
        await updateDoc(slotDocRef, {
            status,
            ...additionalData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating time slot status:', error);
        throw new Error('Failed to update time slot status');
    }
};

/**
 * Purchase a time slot
 */
export const purchaseTimeSlot = async (
    slotId: string,
    clientId: string,
    clientName: string
): Promise<string> => {
    try {
        // Get the slot details
        const slotDocRef = doc(db, TIME_SLOTS_COLLECTION, slotId);
        const slotDoc = await getDocs(query(collection(db, TIME_SLOTS_COLLECTION), where('__name__', '==', slotDocRef)));
        const slotData = slotDoc.docs[0]?.data() as TimeSlot;

        if (!slotData) {
            throw new Error('Time slot not found');
        }

        if (slotData.status !== TimeSlotStatus.AVAILABLE) {
            throw new Error('Time slot is not available for purchase');
        }

        // Calculate purchase amount
        const amount = slotData.durationHours * slotData.hourlyRate;

        // Create purchase record
        const purchasesCollectionRef = collection(db, TIME_PURCHASES_COLLECTION);
        const purchaseData = {
            slotId,
            clientId,
            clientName,
            projectId: slotData.projectId,
            freelancerId: slotData.freelancerId,
            freelancerName: slotData.freelancerName,
            amount,
            currency: 'USD', // Default currency
            status: TimePurchaseStatus.COMPLETED,
            purchasedAt: serverTimestamp(),
        };

        const purchaseDocRef = await addDoc(purchasesCollectionRef, purchaseData);

        // Update slot status
        await updateTimeSlotStatus(slotId, TimeSlotStatus.PURCHASED, {
            purchasedById: clientId,
            purchasedByName: clientName,
            purchaseId: purchaseDocRef.id,
        });

        return purchaseDocRef.id;
    } catch (error) {
        console.error('Error purchasing time slot:', error);
        throw new Error('Failed to purchase time slot');
    }
};

/**
 * Get time purchases with optional filtering
 */
export const getTimePurchases = async (
    clientId?: string,
    projectId?: string
): Promise<TimePurchase[]> => {
    try {
        const purchasesCollectionRef = collection(db, TIME_PURCHASES_COLLECTION);
        let q = query(purchasesCollectionRef, orderBy('purchasedAt', 'desc'));

        if (clientId) {
            q = query(q, where('clientId', '==', clientId));
        }

        if (projectId) {
            q = query(q, where('projectId', '==', projectId));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimePurchase));
    } catch (error) {
        console.error('Error getting time purchases:', error);
        throw new Error('Failed to get time purchases');
    }
};

/**
 * Mark time slot as in progress (when freelancer starts working)
 */
export const startTimeSlotWork = async (slotId: string): Promise<void> => {
    try {
        await updateTimeSlotStatus(slotId, TimeSlotStatus.IN_PROGRESS);
    } catch (error) {
        console.error('Error starting time slot work:', error);
        throw new Error('Failed to start time slot work');
    }
};

/**
 * Mark time slot as completed
 */
export const completeTimeSlot = async (slotId: string): Promise<void> => {
    try {
        await updateTimeSlotStatus(slotId, TimeSlotStatus.COMPLETED);
    } catch (error) {
        console.error('Error completing time slot:', error);
        throw new Error('Failed to complete time slot');
    }
};

/**
 * Get time slots by status
 */
export const getTimeSlotsByStatus = async (
    status: TimeSlotStatus,
    projectId?: string
): Promise<TimeSlot[]> => {
    try {
        const slotsCollectionRef = collection(db, TIME_SLOTS_COLLECTION);
        let q = query(
            slotsCollectionRef,
            where('status', '==', status),
            orderBy('startTime', 'asc')
        );

        if (projectId) {
            q = query(q, where('projectId', '==', projectId));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimeSlot));
    } catch (error) {
        console.error('Error getting time slots by status:', error);
        throw new Error('Failed to get time slots by status');
    }
};

/**
 * Get utilization statistics for time slots
 */
export const getTimeSlotUtilizationStats = async (projectId?: string): Promise<{
    totalSlots: number;
    availableSlots: number;
    purchasedSlots: number;
    inProgressSlots: number;
    completedSlots: number;
    utilizationRate: number;
}> => {
    try {
        const allSlots = projectId
            ? await getTimeSlotsByStatus(TimeSlotStatus.AVAILABLE, projectId)
            : await getTimeSlotsByStatus(TimeSlotStatus.AVAILABLE);

        const purchasedSlots = projectId
            ? await getTimeSlotsByStatus(TimeSlotStatus.PURCHASED, projectId)
            : await getTimeSlotsByStatus(TimeSlotStatus.PURCHASED);

        const inProgressSlots = projectId
            ? await getTimeSlotsByStatus(TimeSlotStatus.IN_PROGRESS, projectId)
            : await getTimeSlotsByStatus(TimeSlotStatus.IN_PROGRESS);

        const completedSlots = projectId
            ? await getTimeSlotsByStatus(TimeSlotStatus.COMPLETED, projectId)
            : await getTimeSlotsByStatus(TimeSlotStatus.COMPLETED);

        const totalSlots = allSlots.length + purchasedSlots.length + inProgressSlots.length + completedSlots.length;
        const utilizedSlots = purchasedSlots.length + inProgressSlots.length + completedSlots.length;
        const utilizationRate = totalSlots > 0 ? (utilizedSlots / totalSlots) * 100 : 0;

        return {
            totalSlots,
            availableSlots: allSlots.length,
            purchasedSlots: purchasedSlots.length,
            inProgressSlots: inProgressSlots.length,
            completedSlots: completedSlots.length,
            utilizationRate,
        };
    } catch (error) {
        console.error('Error getting time slot utilization stats:', error);
        throw new Error('Failed to get time slot utilization stats');
    }
};

/**
 * Get all time slots with optional filtering
 */
export const getTimeSlots = async (
    projectId?: string,
    freelancerId?: string,
    status?: TimeSlotStatus
): Promise<TimeSlot[]> => {
    try {
        const slotsCollectionRef = collection(db, TIME_SLOTS_COLLECTION);
        let q = query(slotsCollectionRef, orderBy('startTime', 'asc'));

        if (projectId) {
            q = query(q, where('projectId', '==', projectId));
        }

        if (freelancerId) {
            q = query(q, where('freelancerId', '==', freelancerId));
        }

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TimeSlot));
    } catch (error) {
        console.error('Error getting time slots:', error);
        throw new Error('Failed to get time slots');
    }
};