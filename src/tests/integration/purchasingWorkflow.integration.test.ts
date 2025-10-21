import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createTimeAllocation,
  getTimeAllocations,
  getAvailableTimeSlots
} from '../../src/services/timeAllocationService';
import {
  purchaseTimeSlot,
  getTimePurchases
} from '../../src/services/timeSlotService';
import {
  createApprovalRequest,
  submitApprovalVote,
  checkAllocationRequiresApproval
} from '../../src/services/allocationApprovalService';
import { TimeAllocationStatus, AllocationApprovalStatus, TimeSlotStatus } from '../../src/types';

// Mock Firebase
vi.mock('../../src/firebase', () => ({
  db: {}
}));

// Mock Firestore functions
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: class MockTimestamp {
    seconds: number;
    nanoseconds: number;

    constructor(seconds: number, nanoseconds: number = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toDate() { return new Date(this.seconds * 1000); }
    toMillis() { return this.seconds * 1000; }
    isEqual(other: any) { return this.seconds === other.seconds && this.nanoseconds === other.nanoseconds; }
    toJSON() { return { seconds: this.seconds, nanoseconds: this.nanoseconds, type: 'timestamp' }; }
    valueOf() { return this.toMillis().toString(); }

    static now() { return new MockTimestamp(Date.now() / 1000); }
    static fromDate(date: Date) { return new MockTimestamp(date.getTime() / 1000); }
  },
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }))
};

vi.mock('firebase/firestore', () => mockFirestore);

// Mock allocation approval service for integration
vi.mock('../../src/services/allocationApprovalService', () => ({
  createApprovalRequest: vi.fn(),
  checkAllocationRequiresApproval: vi.fn(),
  submitApprovalVote: vi.fn()
}));

describe('Time Management Integration Tests', () => {
  let mockAllocationData: any;
  let mockClientData: { id: string; name: string };

  beforeEach(() => {
    mockAllocationData = {
      projectId: 'project123',
      projectTitle: 'Integration Test Project',
      freelancerId: 'freelancer456',
      freelancerName: 'John Doe',
      allocatedById: 'admin789',
      allocatedByName: 'Admin User',
      allocatedHours: 40,
      hourlyRate: 50,
      startDate: mockFirestore.Timestamp.now(),
      endDate: mockFirestore.Timestamp.now(),
      status: TimeAllocationStatus.ACTIVE,
      requiresApproval: false,
      approvalStatus: undefined
    };

    mockClientData = {
      id: 'client123',
      name: 'Test Client Corp'
    };

    // Reset all mocks
    Object.values(mockFirestore).forEach(mock => {
      if (vi.isMockFunction(mock)) {
        mock.mockReset();
      }
    });

    // Setup default mock returns
    mockFirestore.collection.mockReturnValue({ id: 'collection' });
    mockFirestore.doc.mockReturnValue({ id: 'doc' });
    mockFirestore.query.mockReturnValue({ id: 'query' });
    mockFirestore.where.mockReturnValue({ id: 'where' });
    mockFirestore.orderBy.mockReturnValue({ id: 'orderBy' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Time Allocation and Purchasing Workflow', () => {
    it('should complete full workflow: allocation -> slot creation -> purchase', async () => {
      const { createApprovalRequest, checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      // Mock approval check to return false (no approval needed)
      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(false);

      // Step 1: Create time allocation
      mockFirestore.addDoc
        .mockResolvedValueOnce({ id: 'allocation123' }) // Allocation
        .mockResolvedValue({ id: 'slot123' }); // Time slots

      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const allocationResult = await createTimeAllocation(mockAllocationData, 50);

      expect(allocationResult.allocationId).toBe('allocation123');
      expect(allocationResult.requiresApproval).toBe(false);

      // Step 2: Get available time slots
      const mockSlots = [
        {
          id: 'slot1',
          allocationId: 'allocation123',
          projectId: 'project123',
          freelancerId: 'freelancer456',
          freelancerName: 'John Doe',
          startTime: mockFirestore.Timestamp.now(),
          endTime: mockFirestore.Timestamp.now(),
          durationHours: 4,
          hourlyRate: 50,
          status: TimeSlotStatus.AVAILABLE,
          createdAt: mockFirestore.Timestamp.now(),
          updatedAt: mockFirestore.Timestamp.now()
        }
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockSlots.map(slot => ({
          id: slot.id,
          data: () => slot
        }))
      });

      const availableSlots = await getAvailableTimeSlots('project123');

      expect(availableSlots).toHaveLength(1);
      expect(availableSlots[0].status).toBe(TimeSlotStatus.AVAILABLE);

      // Step 3: Purchase a time slot
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          data: () => mockSlots[0]
        }]
      });

      mockFirestore.addDoc.mockResolvedValue({ id: 'purchase123' });

      const purchaseId = await purchaseTimeSlot('slot1', mockClientData.id, mockClientData.name);

      expect(purchaseId).toBe('purchase123');

      // Step 4: Verify purchase was recorded
      const mockPurchases = [{
        id: 'purchase123',
        slotId: 'slot1',
        clientId: mockClientData.id,
        clientName: mockClientData.name,
        projectId: 'project123',
        freelancerId: 'freelancer456',
        freelancerName: 'John Doe',
        amount: 200, // 4 hours * $50
        currency: 'USD',
        status: 'COMPLETED',
        purchasedAt: mockFirestore.Timestamp.now()
      }];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockPurchases.map(purchase => ({
          id: purchase.id,
          data: () => purchase
        }))
      });

      const purchases = await getTimePurchases(mockClientData.id);

      expect(purchases).toHaveLength(1);
      expect(purchases[0].amount).toBe(200);
      expect(purchases[0].clientId).toBe(mockClientData.id);
    });

    it('should handle large allocation approval workflow', async () => {
      const { createApprovalRequest, checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      // Mock approval check to return true (approval needed)
      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(true);
      vi.mocked(createApprovalRequest).mockResolvedValue('approval123');

      // Create large allocation requiring approval
      const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 };

      mockFirestore.addDoc
        .mockResolvedValueOnce({ id: 'allocation123' }) // Allocation
        .mockResolvedValueOnce({ id: 'approval123' }); // Approval request

      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const allocationResult = await createTimeAllocation(largeAllocationData, 50);

      expect(allocationResult.requiresApproval).toBe(true);
      expect(allocationResult.approvalRequestId).toBe('approval123');

      // Simulate approval process
      const approvalRequest = {
        id: 'approval123',
        allocationId: 'allocation123',
        projectId: 'project123',
        freelancerId: 'freelancer456',
        freelancerName: 'John Doe',
        requestedById: 'admin789',
        requestedByName: 'Admin User',
        allocatedHours: 60,
        hourlyRate: 50,
        totalValue: 3000,
        reason: 'Large time allocation requested',
        status: AllocationApprovalStatus.PENDING,
        approvals: [],
        requiredApprovals: 2,
        createdAt: mockFirestore.Timestamp.now(),
        updatedAt: mockFirestore.Timestamp.now()
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => approvalRequest
      });

      // Submit first approval
      await submitApprovalVote('approval123', 'admin1', 'Admin One', 'APPROVE');

      // Submit second approval (should trigger allocation activation)
      await submitApprovalVote('approval123', 'admin2', 'Admin Two', 'APPROVE');

      // Verify allocation was activated
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'timeAllocations' }),
        expect.objectContaining({
          status: TimeAllocationStatus.ACTIVE,
          approvalStatus: AllocationApprovalStatus.APPROVED
        })
      );
    });

    it('should handle allocation rejection workflow', async () => {
      const { createApprovalRequest, checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(true);
      vi.mocked(createApprovalRequest).mockResolvedValue('approval123');

      const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 };

      mockFirestore.addDoc
        .mockResolvedValueOnce({ id: 'allocation123' })
        .mockResolvedValueOnce({ id: 'approval123' });

      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      await createTimeAllocation(largeAllocationData, 50);

      // Simulate rejection
      const approvalRequest = {
        id: 'approval123',
        allocationId: 'allocation123',
        projectId: 'project123',
        freelancerId: 'freelancer456',
        freelancerName: 'John Doe',
        requestedById: 'admin789',
        requestedByName: 'Admin User',
        allocatedHours: 60,
        hourlyRate: 50,
        totalValue: 3000,
        reason: 'Large time allocation requested',
        status: AllocationApprovalStatus.PENDING,
        approvals: [],
        requiredApprovals: 2,
        createdAt: mockFirestore.Timestamp.now(),
        updatedAt: mockFirestore.Timestamp.now()
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => approvalRequest
      });

      // Submit rejection vote
      await submitApprovalVote('approval123', 'admin1', 'Admin One', 'REJECT', 'Budget constraints');

      // Verify allocation was cancelled
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'timeAllocations' }),
        expect.objectContaining({
          status: TimeAllocationStatus.CANCELLED,
          approvalStatus: AllocationApprovalStatus.REJECTED
        })
      );
    });
  });

  describe('Multi-Project Time Allocation Management', () => {
    it('should handle allocations across multiple projects for same freelancer', async () => {
      const { checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(false);

      // Create allocations for different projects
      const project1Allocation = { ...mockAllocationData, projectId: 'project1', allocatedHours: 20 };
      const project2Allocation = { ...mockAllocationData, projectId: 'project2', allocatedHours: 30 };

      mockFirestore.addDoc.mockResolvedValue({ id: 'alloc1' });
      mockFirestore.getDocs.mockResolvedValue({ docs: [] });

      await createTimeAllocation(project1Allocation, 50);
      await createTimeAllocation(project2Allocation, 50);

      // Get allocations by freelancer
      const mockAllocations = [
        { ...project1Allocation, id: 'alloc1' },
        { ...project2Allocation, id: 'alloc2' }
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockAllocations.map(alloc => ({
          id: alloc.id,
          data: () => alloc
        }))
      });

      const freelancerAllocations = await getTimeAllocations(undefined, 'freelancer456');

      expect(freelancerAllocations).toHaveLength(2);
      expect(freelancerAllocations.map(a => a.projectId)).toEqual(['project1', 'project2']);
      expect(freelancerAllocations.reduce((sum, a) => sum + a.allocatedHours, 0)).toBe(50);
    });

    it('should detect conflicts across multiple projects', async () => {
      const { checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(false);

      // Create first allocation
      mockFirestore.addDoc.mockResolvedValue({ id: 'alloc1' });
      mockFirestore.getDocs.mockResolvedValue({ docs: [] });

      await createTimeAllocation(mockAllocationData, 50);

      // Try to create conflicting allocation
      const conflictingStart = new Date(mockAllocationData.startDate.toDate().getTime() + 2 * 60 * 60 * 1000); // 2 hours into first allocation
      const conflictingEnd = new Date(conflictingStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

      const conflictingAllocation = {
        ...mockAllocationData,
        projectId: 'project456', // Different project
        startDate: mockFirestore.Timestamp.fromDate(conflictingStart),
        endDate: mockFirestore.Timestamp.fromDate(conflictingEnd)
      };

      // Mock existing allocation that conflicts
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'alloc1',
          data: () => ({ ...mockAllocationData, id: 'alloc1' })
        }]
      });

      await expect(createTimeAllocation(conflictingAllocation, 50)).rejects.toThrow('Time allocation conflicts');
    });
  });

  describe('Time Slot Lifecycle Management', () => {
    it('should track complete slot lifecycle from allocation to completion', async () => {
      const { checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      vi.mocked(checkAllocationRequiresApproval).mockReturnValue(false);

      // 1. Create allocation
      mockFirestore.addDoc
        .mockResolvedValueOnce({ id: 'allocation123' })
        .mockResolvedValue({ id: 'slot123' });

      mockFirestore.getDocs.mockResolvedValue({ docs: [] });

      await createTimeAllocation(mockAllocationData, 50);

      // 2. Get available slots
      const mockSlot = {
        id: 'slot123',
        allocationId: 'allocation123',
        projectId: 'project123',
        freelancerId: 'freelancer456',
        freelancerName: 'John Doe',
        startTime: mockFirestore.Timestamp.now(),
        endTime: mockFirestore.Timestamp.now(),
        durationHours: 4,
        hourlyRate: 50,
        status: TimeSlotStatus.AVAILABLE,
        createdAt: mockFirestore.Timestamp.now(),
        updatedAt: mockFirestore.Timestamp.now()
      };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{ id: 'slot123', data: () => mockSlot }]
      });

      let slots = await getAvailableTimeSlots('project123');
      expect(slots[0].status).toBe(TimeSlotStatus.AVAILABLE);

      // 3. Purchase slot
      mockFirestore.addDoc.mockResolvedValue({ id: 'purchase123' });

      await purchaseTimeSlot('slot123', mockClientData.id, mockClientData.name);

      // 4. Verify slot status changed
      const purchasedSlot = { ...mockSlot, status: TimeSlotStatus.PURCHASED };
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{ id: 'slot123', data: () => purchasedSlot }]
      });

      slots = await getAvailableTimeSlots('project123');
      expect(slots).toHaveLength(0); // No available slots after purchase
    });
  });
});