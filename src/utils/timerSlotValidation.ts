import { getTimeAllocations, getTimeSlotsForFreelancer } from '../services/timeAllocationService';
import { getTimeSlots } from '../services/timeSlotService';
import { TimeSlotStatus } from '../types';

/**
 * Check if a freelancer has available time slots for timer usage
 */
export const hasAvailableTimeSlots = async (freelancerId: string, projectId?: string): Promise<boolean> => {
    try {
        // Get freelancer's time allocations
        const allocations = await getTimeAllocations(undefined, freelancerId);

        // Filter allocations for the current project if specified
        const relevantAllocations = projectId
            ? allocations.filter(a => a.projectId === projectId)
            : allocations;

        // Check if any allocations are active (not expired)
        const activeAllocations = relevantAllocations.filter(allocation => {
            const endDate = new Date(allocation.endDate.toDate());
            return endDate > new Date();
        });

        if (activeAllocations.length === 0) {
            return false;
        }

        // Get time slots for these allocations
        const allSlots = await getTimeSlots();

        // Check if any slots are available (not fully utilized)
        for (const allocation of activeAllocations) {
            const allocationSlots = allSlots.filter(slot => slot.allocationId === allocation.id);

            // Check if any slot has available time (not completed)
            const hasAvailableSlot = allocationSlots.some(slot => {
                return slot.status === TimeSlotStatus.AVAILABLE ||
                    slot.status === TimeSlotStatus.PURCHASED;
            });

            if (hasAvailableSlot) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking available time slots:', error);
        return false;
    }
};

/**
 * Get available time slots for a freelancer
 */
export const getAvailableSlotsForFreelancer = async (freelancerId: string, projectId?: string): Promise<any[]> => {
    try {
        const allocations = await getTimeAllocations(undefined, freelancerId);
        const relevantAllocations = projectId
            ? allocations.filter(a => a.projectId === projectId)
            : allocations;

        const activeAllocations = relevantAllocations.filter(allocation => {
            const endDate = new Date(allocation.endDate.toDate());
            return endDate > new Date();
        });

        const allSlots = await getTimeSlots();

        const availableSlots: any[] = [];

        for (const allocation of activeAllocations) {
            const allocationSlots = allSlots.filter(slot => slot.allocationId === allocation.id);

            for (const slot of allocationSlots) {
                // A slot is available if it's purchased and not in progress or completed
                if (slot.status === TimeSlotStatus.PURCHASED) {
                    availableSlots.push({
                        ...slot,
                        allocation: allocation,
                        remainingHours: allocation.allocatedHours // Simplified - in real implementation, calculate from time logs
                    });
                }
            }
        }

        return availableSlots;
    } catch (error) {
        console.error('Error getting available slots for freelancer:', error);
        return [];
    }
};

/**
 * Validate if a freelancer can start a timer for a specific project
 */
export const canFreelancerStartTimer = async (
    freelancerId: string,
    projectId: string,
    jobCardId: string
): Promise<{ canStart: boolean; reason?: string }> => {
    try {
        const hasAvailableSlots = await hasAvailableTimeSlots(freelancerId, projectId);

        if (!hasAvailableSlots) {
            return {
                canStart: false,
                reason: 'No available time slots. Contact your administrator to request time allocation.'
            };
        }

        return { canStart: true };
    } catch (error) {
        console.error('Error validating timer start:', error);
        return {
            canStart: false,
            reason: 'Unable to validate time allocation. Please try again.'
        };
    }
};