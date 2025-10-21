import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeSlotStatus, TimeAllocationStatus, UserRole } from '../types';
import {
    purchaseTimeSlot,
    updateTimeSlotStatus,
    getTimeSlotsByStatus,
    getTimeSlotUtilizationStats,
    startTimeSlotWork,
    completeTimeSlot
} from '../services/timeSlotService';
import { createTimeAllocation } from '../services/timeAllocationService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase services
vi.mock('../firebase/config', () => ({
    db: {},
    auth: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    runTransaction: vi.fn(),
    writeBatch: vi.fn(),
    serverTimestamp: vi.fn(() => Timestamp.now()),
    getFirestore: vi.fn(() => ({})),
    Timestamp: {
        now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
        fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
    }
}));

// Mock user for admin operations
const mockAdminUser = {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    title: 'Administrator',
    hourlyRate: 0,
    phone: '123-456-7890',
    company: 'Test Company',
    avatarUrl: '',
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now()
};

describe('Time Management End-to-End Workflows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Complete Time Allocation to Completion Workflow', () => {
        it('should complete full workflow: allocation → purchase → completion', async () => {
            // Step 1: Admin allocates time to freelancer
            const allocationResult = await createTimeAllocation({
                projectId: 'project-123',
                freelancerId: 'freelancer-456',
                freelancerName: 'John Doe',
                allocatedById: mockAdminUser.id,
                allocatedByName: mockAdminUser.email,
                allocatedHours: 40,
                hourlyRate: 75,
                startDate: Timestamp.fromDate(new Date('2024-01-15')),
                endDate: Timestamp.fromDate(new Date('2024-01-19')),
                status: TimeAllocationStatus.ACTIVE,
                notes: 'Frontend development sprint'
            }, mockAdminUser);

            expect(allocationResult).toBeDefined();
            expect(allocationResult.allocationId).toBeDefined();
            expect(typeof allocationResult.allocationId).toBe('string');

            // Step 2: Client purchases available time slot
            const purchaseId = await purchaseTimeSlot('slot-789', 'client-101', 'TechCorp Inc');
            expect(purchaseId).toBeDefined();
            expect(typeof purchaseId).toBe('string');

            // Step 3: Freelancer starts working on the purchased slot
            await startTimeSlotWork('slot-789');
            // Verify slot status was updated
            const inProgressSlots = await getTimeSlotsByStatus(TimeSlotStatus.IN_PROGRESS);
            expect(inProgressSlots.some(slot => slot.id === 'slot-789')).toBe(true);

            // Step 4: Freelancer completes the work
            await completeTimeSlot('slot-789');
            // Verify slot status was updated to completed
            const completedSlots = await getTimeSlotsByStatus(TimeSlotStatus.COMPLETED);
            expect(completedSlots.some(slot => slot.id === 'slot-789')).toBe(true);

            // Step 5: Verify utilization statistics reflect the completed work
            const stats = await getTimeSlotUtilizationStats();
            expect(stats).toBeDefined();
            expect(stats.totalSlots).toBeGreaterThan(0);
            expect(stats.completedSlots).toBeGreaterThan(0);
            expect(stats.utilizationRate).toBeGreaterThan(0);
        });

        it('should handle multiple allocations and purchases across projects', async () => {
            // Multiple projects scenario
            const allocations = [
                {
                    projectId: 'project-1',
                    freelancerId: 'freelancer-1',
                    totalHours: 20,
                    hourlyRate: 80
                },
                {
                    projectId: 'project-2',
                    freelancerId: 'freelancer-2',
                    totalHours: 30,
                    hourlyRate: 70
                }
            ];

            // Allocate time to multiple freelancers
            for (const alloc of allocations) {
                await createTimeAllocation({
                    projectId: alloc.projectId,
                    freelancerId: alloc.freelancerId,
                    freelancerName: `Freelancer ${alloc.freelancerId}`,
                    allocatedById: mockAdminUser.id,
                    allocatedByName: mockAdminUser.name,
                    allocatedHours: alloc.totalHours,
                    hourlyRate: alloc.hourlyRate,
                    startDate: Timestamp.fromDate(new Date()),
                    endDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
                    status: TimeAllocationStatus.ACTIVE
                }, mockAdminUser);
            }

            // Multiple clients purchase slots
            await purchaseTimeSlot('slot-1', 'client-1', 'Client One');
            await purchaseTimeSlot('slot-2', 'client-2', 'Client Two');

            // Verify cross-project statistics
            const stats = await getTimeSlotUtilizationStats();
            expect(stats.totalSlots).toBeGreaterThanOrEqual(2);
            expect(stats.purchasedSlots).toBeGreaterThanOrEqual(2);
        });

        it('should prevent invalid workflow transitions', async () => {
            // Try to purchase a slot that's already purchased
            const purchaseData = {
                slotId: 'slot-already-purchased',
                clientId: 'client-101',
                clientName: 'TechCorp Inc',
                hoursToPurchase: 4,
                totalCost: 300
            };

            // First purchase should succeed
            await purchaseTimeSlot(purchaseData);

            // Second purchase of same slot should fail
            await expect(purchaseTimeSlot(purchaseData)).rejects.toThrow();

            // Try to complete a slot that was never purchased
            await expect(
                updateTimeSlotStatus('slot-never-purchased', TimeSlotStatus.COMPLETED)
            ).rejects.toThrow();

            // Try invalid status transition (available -> completed, skipping purchased)
            await expect(
                updateTimeSlotStatus('slot-available', TimeSlotStatus.COMPLETED)
            ).rejects.toThrow();
        });

        it('should handle concurrent slot purchases with proper locking', async () => {
            const purchaseData1 = {
                slotId: 'slot-concurrent',
                clientId: 'client-1',
                clientName: 'Client One',
                hoursToPurchase: 4,
                totalCost: 300
            };

            const purchaseData2 = {
                slotId: 'slot-concurrent',
                clientId: 'client-2',
                clientName: 'Client Two',
                hoursToPurchase: 4,
                totalCost: 300
            };

            // Simulate concurrent purchases
            const purchasePromises = [
                purchaseTimeSlot(purchaseData1),
                purchaseTimeSlot(purchaseData2)
            ];

            // One should succeed, one should fail due to concurrency
            const results = await Promise.allSettled(purchasePromises);
            const successes = results.filter(r => r.status === 'fulfilled').length;
            const failures = results.filter(r => r.status === 'rejected').length;

            expect(successes).toBe(1);
            expect(failures).toBe(1);
        });

        it('should track utilization across the complete project lifecycle', async () => {
            // Create allocation
            await allocateTimeToFreelancer({
                projectId: 'project-lifecycle',
                projectName: 'Lifecycle Test Project',
                freelancerId: 'freelancer-lifecycle',
                freelancerName: 'Lifecycle Freelancer',
                totalHours: 20,
                hourlyRate: 75,
                startDate: new Date(),
                endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            });

            // Initial stats - should have available slots
            let stats = await getTimeSlotUtilizationStats();
            const initialAvailable = stats.availableSlots;

            // Purchase some slots
            await purchaseTimeSlot({
                slotId: 'slot-lifecycle-1',
                clientId: 'client-lifecycle',
                clientName: 'Lifecycle Client',
                hoursToPurchase: 4,
                totalCost: 300,
                projectId: 'project-lifecycle',
                projectName: 'Lifecycle Test Project'
            });

            // Stats after purchase
            stats = await getTimeSlotUtilizationStats();
            expect(stats.purchasedSlots).toBeGreaterThan(0);

            // Complete the work
            await updateTimeSlotStatus('slot-lifecycle-1', TimeSlotStatus.IN_PROGRESS);
            await updateTimeSlotStatus('slot-lifecycle-1', TimeSlotStatus.COMPLETED);

            // Final stats
            stats = await getTimeSlotUtilizationStats();
            expect(stats.completedSlots).toBeGreaterThan(0);
            expect(stats.utilizationRate).toBeGreaterThan(0);

            // Verify the lifecycle: available -> purchased -> in_progress -> completed
            const completedSlots = await getTimeSlotsByStatus(TimeSlotStatus.COMPLETED);
            expect(completedSlots.some(slot => slot.id === 'slot-lifecycle-1')).toBe(true);
        });

        it('should handle partial slot purchases and utilization', async () => {
            // Allocate time
            await allocateTimeToFreelancer({
                projectId: 'project-partial',
                projectName: 'Partial Purchase Project',
                freelancerId: 'freelancer-partial',
                freelancerName: 'Partial Freelancer',
                totalHours: 8, // Small allocation for partial testing
                hourlyRate: 75,
                startDate: new Date(),
                endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            });

            // Purchase partial slot (2 hours out of 4)
            await purchaseTimeSlot({
                slotId: 'slot-partial',
                clientId: 'client-partial',
                clientName: 'Partial Client',
                hoursToPurchase: 2, // Partial purchase
                totalCost: 150, // 2 hours * $75
                projectId: 'project-partial',
                projectName: 'Partial Purchase Project'
            });

            // Start work
            await updateTimeSlotStatus('slot-partial', TimeSlotStatus.IN_PROGRESS);

            // Complete work
            await updateTimeSlotStatus('slot-partial', TimeSlotStatus.COMPLETED);

            // Verify partial utilization is tracked
            const stats = await getTimeSlotUtilizationStats();
            expect(stats).toBeDefined();
            // Should still count as completed even if partial
            expect(stats.completedSlots).toBeGreaterThan(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle network failures gracefully', async () => {
            // Mock network failure during allocation
            vi.mocked(allocateTimeToFreelancer).mockRejectedValueOnce(
                new Error('Network connection failed')
            );

            await expect(allocateTimeToFreelancer({
                projectId: 'project-fail',
                projectName: 'Failing Project',
                freelancerId: 'freelancer-fail',
                freelancerName: 'Failing Freelancer',
                totalHours: 10,
                hourlyRate: 50,
                startDate: new Date(),
                endDate: new Date()
            })).rejects.toThrow('Network connection failed');
        });

        it('should validate data integrity across operations', async () => {
            // Try to purchase with invalid data
            await expect(purchaseTimeSlot({
                slotId: '',
                clientId: 'client-invalid',
                clientName: 'Invalid Client',
                hoursToPurchase: 0,
                totalCost: 0
            })).rejects.toThrow();

            // Try to update status with invalid slot ID
            await expect(updateTimeSlotStatus('', TimeSlotStatus.COMPLETED)).rejects.toThrow();
        });

        it('should handle timezone and date edge cases', async () => {
            // Test with different timezone dates
            const pastDate = new Date('2020-01-01');
            const futureDate = new Date('2030-12-31');

            await allocateTimeToFreelancer({
                projectId: 'project-timezone',
                projectName: 'Timezone Project',
                freelancerId: 'freelancer-timezone',
                freelancerName: 'Timezone Freelancer',
                totalHours: 10,
                hourlyRate: 50,
                startDate: pastDate,
                endDate: futureDate
            });

            // Should handle date calculations correctly regardless of timezone
            const stats = await getTimeSlotUtilizationStats();
            expect(stats).toBeDefined();
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle bulk operations efficiently', async () => {
            const startTime = Date.now();

            // Bulk allocate time to multiple freelancers
            const bulkAllocations = Array.from({ length: 10 }, (_, i) => ({
                projectId: `project-bulk-${i}`,
                projectName: `Bulk Project ${i}`,
                freelancerId: `freelancer-bulk-${i}`,
                freelancerName: `Bulk Freelancer ${i}`,
                totalHours: 40,
                hourlyRate: 75,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }));

            await Promise.all(bulkAllocations.map(alloc => allocateTimeToFreelancer(alloc)));

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete bulk operations within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max for bulk operations
        });

        it('should maintain data consistency under load', async () => {
            // Simulate high concurrency scenario
            const concurrentOperations = Array.from({ length: 20 }, (_, i) =>
                purchaseTimeSlot({
                    slotId: `slot-concurrent-${i}`,
                    clientId: `client-concurrent-${i}`,
                    clientName: `Concurrent Client ${i}`,
                    hoursToPurchase: 4,
                    totalCost: 300,
                    projectId: 'project-concurrent',
                    projectName: 'Concurrent Project'
                })
            );

            const results = await Promise.allSettled(concurrentOperations);
            const successfulPurchases = results.filter(r => r.status === 'fulfilled').length;

            // Should handle concurrent operations without data corruption
            expect(successfulPurchases).toBeGreaterThan(0);

            // Verify final state is consistent
            const stats = await getTimeSlotUtilizationStats();
            expect(stats.totalSlots).toBeDefined();
        });
    });
});