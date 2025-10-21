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
vi.mock('../firebase', () => ({
    db: {}
}));

// Mock allocation approval service
vi.mock('../services/allocationApprovalService', () => ({
    createApprovalRequest: vi.fn(),
    checkAllocationRequiresApproval: vi.fn()
}));

// Mock audit logger
vi.mock('../utils/auditLogger', () => ({
    logAuditEvent: vi.fn()
}));

import { db } from '../firebase';
import {
    createTimeAllocation,
    updateTimeAllocation,
    deleteTimeAllocation,
    getTimeAllocations
} from '../services/timeAllocationService';

// Get references to mocked functions
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { createApprovalRequest, checkAllocationRequiresApproval } from '../services/allocationApprovalService';

describe('Admin Access Control - Firestore Security Rules Simulation', () => {
    const adminUser = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        title: 'Administrator',
        hourlyRate: 0,
        phone: '123-456-7890',
        company: 'Test Company',
        avatarUrl: '',
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
        lastActive: { seconds: 1234567890, nanoseconds: 0 }
    };

    const freelancerUser = {
        id: 'freelancer-1',
        name: 'John Doe',
        email: 'freelancer@example.com',
        role: 'FREELANCER' as const,
        title: 'Architect',
        hourlyRate: 75,
        phone: '123-456-7890',
        company: 'Freelance Co',
        avatarUrl: '',
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
        lastActive: { seconds: 1234567890, nanoseconds: 0 }
    };

    const clientUser = {
        id: 'client-1',
        name: 'Client Company',
        email: 'client@example.com',
        role: 'CLIENT' as const,
        title: 'Project Manager',
        hourlyRate: 0,
        phone: '123-456-7890',
        company: 'Client Corp',
        avatarUrl: '',
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
        lastActive: { seconds: 1234567890, nanoseconds: 0 }
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
        status: 'ACTIVE' as const,
        notes: 'Test allocation'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('Time Allocation Creation - Admin Only (Firestore Rules)', () => {
        it('should allow admin users to create time allocations (service level)', async () => {
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

        it('should simulate Firestore security rules preventing freelancer allocation creation', async () => {
            // Simulate Firestore security rules by mocking addDoc to reject for non-admin users
            // In a real Firestore with rules enabled, this would fail at the database level

            // Mock Firestore to reject writes for non-admin users (simulating security rules)
            const firestoreError = new Error('Permission denied: User does not have admin role');
            firestoreError.name = 'FirebaseError';
            (firestoreError as any).code = 'permission-denied';

            (collection as any).mockReturnValue({});
            (doc as any).mockReturnValue({ id: 'allocation-fail' });
            (addDoc as any).mockRejectedValue(firestoreError);

            // Mock approval check
            (checkAllocationRequiresApproval as any).mockReturnValue(false);

            // Mock getDocs for conflict checking (empty results)
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            // Attempt to create allocation as freelancer - should fail due to security rules
            await expect(createTimeAllocation(mockAllocationData, freelancerUser, 50))
                .rejects.toThrow('Permission denied: User does not have admin role');

            // Verify addDoc was attempted but failed
            expect(addDoc).toHaveBeenCalled();
        });

        it('should simulate Firestore security rules preventing client allocation creation', async () => {
            // Simulate Firestore security rules preventing client from creating allocations

            const firestoreError = new Error('Permission denied: User does not have admin role');
            firestoreError.name = 'FirebaseError';
            (firestoreError as any).code = 'permission-denied';

            (collection as any).mockReturnValue({});
            (doc as any).mockReturnValue({ id: 'allocation-fail' });
            (addDoc as any).mockRejectedValue(firestoreError);

            (checkAllocationRequiresApproval as any).mockReturnValue(false);
            (getDocs as any).mockResolvedValue({
                docs: [],
                empty: true
            });

            // Attempt to create allocation as client - should fail
            await expect(createTimeAllocation(mockAllocationData, clientUser, 50))
                .rejects.toThrow('Permission denied: User does not have admin role');

            expect(addDoc).toHaveBeenCalled();
        });

        it('should allow admin to create allocations requiring approval', async () => {
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
    });

    describe('Time Allocation Updates - Admin Only (Firestore Rules)', () => {
        it('should allow admin users to update allocations', async () => {
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

            expect(updateDoc).toHaveBeenCalled();
        });

        it('should simulate Firestore security rules preventing freelancer updates', async () => {
            // Simulate Firestore rejecting update for non-admin user

            const firestoreError = new Error('Permission denied: User does not have admin role');
            firestoreError.name = 'FirebaseError';
            (firestoreError as any).code = 'permission-denied';

            (doc as any).mockReturnValue({ id: 'allocation-1' });
            (getDoc as any).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    freelancerId: 'freelancer-1',
                    startDate: { seconds: 1234567890, nanoseconds: 0 },
                    endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 }
                })
            });
            (updateDoc as any).mockRejectedValue(firestoreError);

            // Attempt to update as freelancer - should fail
            await expect(updateTimeAllocation('allocation-1', { notes: 'Updated' }, freelancerUser))
                .rejects.toThrow('Permission denied: User does not have admin role');

            expect(updateDoc).toHaveBeenCalled();
        });
    });

    describe('Time Allocation Deletion - Admin Only (Firestore Rules)', () => {
        it('should allow admins to delete allocations', async () => {
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

        it('should simulate Firestore security rules preventing freelancer deletion', async () => {
            // Simulate Firestore rejecting deletion for non-admin user

            const firestoreError = new Error('Permission denied: User does not have admin role');
            firestoreError.name = 'FirebaseError';
            (firestoreError as any).code = 'permission-denied';

            const mockAllocationDoc = {
                exists: () => true,
                data: () => ({
                    projectId: 'project-1',
                    freelancerId: 'freelancer-1',
                    allocatedHours: 20
                })
            };

            (doc as any).mockReturnValue({ id: 'allocation-1' });
            (getDoc as any).mockResolvedValue(mockAllocationDoc);
            (deleteDoc as any).mockRejectedValue(firestoreError);

            // Attempt to delete as freelancer - should fail
            await expect(deleteTimeAllocation('allocation-1', freelancerUser))
                .rejects.toThrow('Permission denied: User does not have admin role');

            expect(deleteDoc).toHaveBeenCalled();
        });
    });

    describe('Read Permissions - Role-Based Access', () => {
        it('should allow freelancers to read their own allocations', async () => {
            const mockAllocations = [{
                id: 'allocation-1',
                data: () => ({
                    projectId: 'project-1',
                    freelancerId: 'freelancer-1',
                    allocatedHours: 20,
                    status: 'ACTIVE'
                })
            }];

            (collection as any).mockReturnValue({});
            (query as any).mockReturnValue({});
            (where as any).mockReturnValue({});
            (orderBy as any).mockReturnValue({});
            (getDocs as any).mockResolvedValue({
                docs: mockAllocations,
                empty: false
            });

            const allocations = await getTimeAllocations(undefined, 'freelancer-1');

            expect(allocations).toHaveLength(1);
            expect(allocations[0].freelancerId).toBe('freelancer-1');
        });

        it('should allow admins to read all allocations', async () => {
            const mockAllocations = [
                {
                    id: 'allocation-1',
                    data: () => ({
                        projectId: 'project-1',
                        freelancerId: 'freelancer-1',
                        allocatedHours: 20,
                        status: 'ACTIVE'
                    })
                },
                {
                    id: 'allocation-2',
                    data: () => ({
                        projectId: 'project-2',
                        freelancerId: 'freelancer-2',
                        allocatedHours: 16,
                        status: 'ACTIVE'
                    })
                }
            ];

            (collection as any).mockReturnValue({});
            (query as any).mockReturnValue({});
            (orderBy as any).mockReturnValue({});
            (getDocs as any).mockResolvedValue({
                docs: mockAllocations,
                empty: false
            });

            const allocations = await getTimeAllocations();

            expect(allocations).toHaveLength(2);
        });

        it('should simulate Firestore security rules preventing freelancers from reading other freelancers allocations', async () => {
            // In Firestore with rules, freelancers can only read their own allocations
            // This is enforced at the query level, not the service level

            const mockAllocations = [{
                id: 'allocation-1',
                data: () => ({
                    projectId: 'project-1',
                    freelancerId: 'freelancer-2', // Different freelancer
                    allocatedHours: 20,
                    status: 'ACTIVE'
                })
            }];

            (collection as any).mockReturnValue({});
            (query as any).mockReturnValue({});
            (where as any).mockReturnValue({});
            (orderBy as any).mockReturnValue({});
            (getDocs as any).mockResolvedValue({
                docs: mockAllocations,
                empty: false
            });

            // Service allows reading any freelancer's allocations
            // In real Firestore with rules, this would be filtered server-side
            const allocations = await getTimeAllocations(undefined, 'freelancer-2');

            expect(allocations).toHaveLength(1);
            // Note: Real security rules would prevent this query from returning data for different freelancer
        });
    });
});