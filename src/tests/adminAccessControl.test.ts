import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore functions before importing the service
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
    serverTimestamp: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
        fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
    },
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn()
    }))
}));

// Mock Firebase
vi.mock('@/firebase', () => ({
    db: {}
}));

// Mock allocation approval service
vi.mock('@/services/allocationApprovalService', () => ({
    createApprovalRequest: vi.fn(),
    checkAllocationRequiresApproval: vi.fn()
}));

import { db } from '@/firebase';
import {
    createTimeAllocation,
    updateTimeAllocation,
    deleteTimeAllocation
} from '@/services/timeAllocationService';

// Get references to mocked functions
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { createApprovalRequest, checkAllocationRequiresApproval } from '@/services/allocationApprovalService';

describe('Admin Access Control Tests', () => {
    const adminUser = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
    };

    const freelancerUser = {
        id: 'freelancer-1',
        name: 'John Doe',
        email: 'freelancer@example.com',
        role: 'freelancer'
    };

    const clientUser = {
        id: 'client-1',
        name: 'Client Company',
        email: 'client@example.com',
        role: 'client'
    };

    const mockAllocationData = {
        projectId: 'project-1',
        projectTitle: 'Test Project',
        freelancerId: 'freelancer-1',
        freelancerName: 'John Doe',
        allocatedById: 'admin-1',
        allocatedByName: 'Admin User',
        allocatedHours: 20,
        hourlyRate: 75,
        startDate: { seconds: 1234567890, nanoseconds: 0 },
        endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 },
        notes: 'Test allocation'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Time Allocation Creation - Admin Only', () => {
        it('should allow admin users to create time allocations', async () => {
            // Mock Firestore responses
            const mockAllocationDocRef = { id: 'allocation-1' };

            // Mock collection and doc calls
            (collection as any).mockReturnValue({});
            (doc as any).mockReturnValue(mockAllocationDocRef);
            (addDoc as any).mockResolvedValue(mockAllocationDocRef);

            // Mock approval check to return false (no approval needed)
            (checkAllocationRequiresApproval as any).mockReturnValue(false);

            // Mock getDocs for conflict checking (empty results)
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            // Create allocation as admin
            const result = await createTimeAllocation(mockAllocationData, adminUser, 50);

            expect(result.allocationId).toBe('allocation-1');
            expect(result.requiresApproval).toBe(false);
            expect(addDoc).toHaveBeenCalled();
        });

        it('should allow admin users to create large allocations requiring approval', async () => {
            // Mock Firestore responses
            const mockAllocationDocRef = { id: 'allocation-2' };
            const mockApprovalDocRef = { id: 'approval-1' };

            // Mock collection and doc calls
            (collection as any).mockReturnValue({});
            (doc as any)
                .mockReturnValueOnce(mockApprovalDocRef) // for approval request update
                .mockReturnValueOnce(mockAllocationDocRef); // for allocation
            (addDoc as any)
                .mockResolvedValueOnce(mockAllocationDocRef) // allocation creation
                .mockResolvedValueOnce(mockApprovalDocRef);   // approval request

            // Mock approval service
            (checkAllocationRequiresApproval as any).mockReturnValue(true);
            (createApprovalRequest as any).mockResolvedValue('approval-1');

            // Mock getDocs for conflict checking (empty results)
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            // Mock updateDoc for approval request update
            (updateDoc as any).mockResolvedValue(undefined);

            // Create large allocation as admin
            const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 };
            const result = await createTimeAllocation(largeAllocationData, adminUser, 50);

            expect(result.allocationId).toBe('allocation-2');
            expect(result.requiresApproval).toBe(true);
            expect(result.approvalRequestId).toBe('approval-1');
        });

        it('should process allocation creation regardless of user role (service layer)', async () => {
            // Note: In the current implementation, the service doesn't check user roles
            // Role checking is handled by Firestore security rules
            // This test verifies the service works for any user (role checking is external)

            const mockAllocationDocRef = { id: 'allocation-3' };

            (collection as any).mockReturnValue({});
            (doc as any).mockReturnValue(mockAllocationDocRef);
            (addDoc as any).mockResolvedValue(mockAllocationDocRef);
            (checkAllocationRequiresApproval as any).mockReturnValue(false);
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            // Create allocation as freelancer (service allows it, but Firestore rules would reject)
            const result = await createTimeAllocation(mockAllocationData, freelancerUser, 50);

            expect(result.allocationId).toBe('allocation-3');
            expect(addDoc).toHaveBeenCalled();
        });
    });

    describe('Time Allocation Updates - Admin Only', () => {
        it('should allow updating allocations with proper audit logging', async () => {
            const mockAllocationDoc = {
                exists: () => true,
                data: () => ({
                    freelancerId: 'freelancer-1',
                    startDate: { seconds: 1234567890, nanoseconds: 0 },
                    endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 }
                })
            };

            (doc as any).mockReturnValue({ id: 'allocation-1' });
            (getDoc as any).mockResolvedValue(mockAllocationDoc);
            (getDocs as any).mockResolvedValue({ docs: [], empty: true }); // No conflicts
            (updateDoc as any).mockResolvedValue(undefined);

            await updateTimeAllocation('allocation-1', { notes: 'Updated notes' }, adminUser);

            // getDoc is only called when updating time-related fields
            expect(updateDoc).toHaveBeenCalled();
        });

        it('should detect and prevent allocation conflicts', async () => {
            const mockExistingAllocation = {
                id: 'existing-allocation',
                data: () => ({
                    freelancerId: 'freelancer-1',
                    startDate: { toDate: () => new Date((1234567890 - 86400) * 1000) },
                    endDate: { toDate: () => new Date((1234567890 + 86400) * 1000) },
                    status: 'ACTIVE',
                    projectId: 'project-2'
                })
            };

            const mockCurrentAllocation = {
                exists: () => true,
                data: () => ({
                    freelancerId: 'freelancer-1',
                    startDate: { toDate: () => new Date(1234567890 * 1000) },
                    endDate: { toDate: () => new Date((1234567890 + 20 * 60 * 60) * 1000) }
                })
            };

            (doc as any).mockReturnValue({ id: 'allocation-1' });
            (getDoc as any).mockResolvedValue(mockCurrentAllocation);
            (getDocs as any).mockResolvedValue({
                docs: [mockExistingAllocation],
                empty: false
            });

            // Attempt to update with conflicting dates
            const conflictingUpdate = {
                startDate: { toDate: () => new Date(1234567890 * 1000) },
                endDate: { toDate: () => new Date((1234567890 + 172800) * 1000) }
            };

            await expect(updateTimeAllocation('allocation-1', conflictingUpdate, adminUser))
                .rejects.toThrow('Time allocation conflicts with existing allocations: project-2');
        });
    });

    describe('Time Allocation Deletion - Admin Only', () => {
        it('should allow admins to delete allocations and associated slots', async () => {
            const mockAllocationDoc = {
                exists: () => true,
                data: () => ({
                    projectId: 'project-1',
                    freelancerId: 'freelancer-1',
                    allocatedHours: 20
                })
            };

            const mockSlots = [
                { id: 'slot-1', ref: {} },
                { id: 'slot-2', ref: {} }
            ];

            (doc as any).mockReturnValue({ id: 'allocation-1' });
            (getDoc as any).mockResolvedValue(mockAllocationDoc);
            (getDocs as any).mockResolvedValue({
                docs: mockSlots,
                empty: false
            });
            (deleteDoc as any).mockResolvedValue(undefined);

            await deleteTimeAllocation('allocation-1', adminUser);

            // Should delete the allocation and associated slots
            expect(getDocs).toHaveBeenCalled(); // For finding associated slots
            expect(deleteDoc).toHaveBeenCalledTimes(3); // 2 slots + 1 allocation
        });
    });

    describe('Role-Based Access Simulation', () => {
        it('should log audit events for all admin operations', async () => {
            const mockAllocationDocRef = { id: 'allocation-4' };

            (collection as any).mockReturnValue({});
            (doc as any).mockReturnValue(mockAllocationDocRef);
            (addDoc as any).mockReturnValue(mockAllocationDocRef);
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            await createTimeAllocation(mockAllocationData, adminUser, 50);

            // Verify audit logging was called
            const { logAuditEvent } = await import('@/utils/auditLogger');
            expect(logAuditEvent).toHaveBeenCalledWith(
                adminUser,
                'TIME_ALLOCATION_CREATED',
                expect.objectContaining({
                    resourceType: 'timeAllocation',
                    resourceId: 'allocation-4',
                    allocatedHours: 20
                })
            );
        });

        it('should include user information in audit logs', async () => {
            const mockAllocationDoc = {
                id: 'allocation-5',
                data: () => ({
                    projectId: 'project-1',
                    freelancerId: 'freelancer-1',
                    allocatedHours: 20
                })
            };

            (doc as any).mockReturnValue({ id: 'allocation-5' });
            (getDoc as any).mockResolvedValue(mockAllocationDoc);
            (getDocs as any).mockResolvedValue({ docs: [], empty: false });

            await updateTimeAllocation('allocation-5', { notes: 'Updated' }, adminUser);

            const { logAuditEvent } = await import('@/utils/auditLogger');
            expect(logAuditEvent).toHaveBeenCalledWith(
                adminUser,
                'TIME_ALLOCATION_UPDATED',
                expect.objectContaining({
                    resourceType: 'timeAllocation',
                    resourceId: 'allocation-5'
                })
            );
        });
    });
});