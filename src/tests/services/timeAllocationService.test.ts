import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createTimeAllocation,
  getTimeAllocations,
  updateTimeAllocation,
  deleteTimeAllocation,
  getAvailableTimeSlots,
  getTimeSlotsForFreelancer,
  checkAllocationConflicts
} from '../../src/services/timeAllocationService';
import { TimeAllocation, TimeAllocationStatus, TimeSlotStatus, AllocationApprovalStatus } from '../../src/types';

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
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
  },
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }))
};

vi.mock('firebase/firestore', () => mockFirestore);

// Mock allocation approval service
vi.mock('../../src/services/allocationApprovalService', () => ({
  createApprovalRequest: vi.fn(),
  checkAllocationRequiresApproval: vi.fn()
}));

describe('Time Allocation Service', () => {
  let mockAllocationData: Omit<TimeAllocation, 'id' | 'createdAt' | 'updatedAt'>;
  let mockTimeSlot: TimeSlot;

  beforeEach(() => {
    mockAllocationData = {
      projectId: 'project123',
      projectTitle: 'Test Project',
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

    mockTimeSlot = {
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

  describe('createTimeAllocation', () => {
    it('should create a time allocation without approval for small allocations', async () => {
      const { createApprovalRequest, checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      // Mock approval check to return false (no approval needed)
      checkAllocationRequiresApproval.mockReturnValue(false);

      // Mock Firestore operations
      mockFirestore.addDoc.mockResolvedValue({ id: 'allocation123' });
      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const result = await createTimeAllocation(mockAllocationData, 50);

      expect(result.allocationId).toBe('allocation123');
      expect(result.requiresApproval).toBe(false);
      expect(result.approvalRequestId).toBeUndefined();
      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(createApprovalRequest).not.toHaveBeenCalled();
    });

    it('should create a time allocation with approval for large allocations', async () => {
      const { createApprovalRequest, checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      // Mock approval check to return true (approval needed)
      checkAllocationRequiresApproval.mockReturnValue(true);
      createApprovalRequest.mockResolvedValue('approval123');

      // Mock Firestore operations
      mockFirestore.addDoc.mockResolvedValueOnce({ id: 'allocation123' }); // For allocation
      mockFirestore.addDoc.mockResolvedValueOnce({ id: 'approval123' }); // For approval request
      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const result = await createTimeAllocation(mockAllocationData, 30); // Lower threshold

      expect(result.allocationId).toBe('allocation123');
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalRequestId).toBe('approval123');
      expect(createApprovalRequest).toHaveBeenCalled();
    });

    it('should detect and prevent conflicting allocations', async () => {
      const { checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      checkAllocationRequiresApproval.mockReturnValue(false);

      // Mock existing conflicting allocation
      const conflictingAllocation = {
        ...mockAllocationData,
        id: 'existing123',
        startDate: mockFirestore.Timestamp.now(),
        endDate: mockFirestore.Timestamp.now()
      };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'existing123',
          data: () => conflictingAllocation
        }]
      });

      await expect(createTimeAllocation(mockAllocationData)).rejects.toThrow('Time allocation conflicts');
    });

    it('should create time slots for allocations that don\'t require approval', async () => {
      const { checkAllocationRequiresApproval } = await import('../../src/services/allocationApprovalService');

      checkAllocationRequiresApproval.mockReturnValue(false);

      mockFirestore.addDoc
        .mockResolvedValueOnce({ id: 'allocation123' }) // Allocation
        .mockResolvedValue({ id: 'slot123' }); // Time slots

      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      await createTimeAllocation(mockAllocationData);

      // Should create time slots (called multiple times for each 4-hour slot)
      expect(mockFirestore.addDoc).toHaveBeenCalledTimes(11); // 1 allocation + 10 slots (40 hours / 4)
    });
  });

  describe('getTimeAllocations', () => {
    it('should get all time allocations without filters', async () => {
      const mockAllocations = [
        { ...mockAllocationData, id: 'alloc1' },
        { ...mockAllocationData, id: 'alloc2' }
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: mockAllocations.map(alloc => ({
          id: alloc.id,
          data: () => alloc
        }))
      });

      const result = await getTimeAllocations();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('alloc1');
      expect(result[1].id).toBe('alloc2');
    });

    it('should filter allocations by project ID', async () => {
      const mockAllocation = { ...mockAllocationData, id: 'alloc1', projectId: 'project123' };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'alloc1',
          data: () => mockAllocation
        }]
      });

      const result = await getTimeAllocations('project123');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project123');
    });

    it('should filter allocations by freelancer ID', async () => {
      const mockAllocation = { ...mockAllocationData, id: 'alloc1', freelancerId: 'freelancer456' };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'alloc1',
          data: () => mockAllocation
        }]
      });

      const result = await getTimeAllocations(undefined, 'freelancer456');

      expect(result).toHaveLength(1);
      expect(result[0].freelancerId).toBe('freelancer456');
    });
  });

  describe('updateTimeAllocation', () => {
    it('should update allocation successfully', async () => {
      const allocationId = 'allocation123';
      const updates = { allocatedHours: 50 };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAllocationData
      });

      mockFirestore.getDocs.mockResolvedValue({
        docs: [] // No conflicts
      });

      await updateTimeAllocation(allocationId, updates);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          allocatedHours: 50,
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should detect conflicts when updating dates', async () => {
      const allocationId = 'allocation123';
      const newStartDate = mockFirestore.Timestamp.now();
      const updates = { startDate: newStartDate };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAllocationData
      });

      // Mock conflicting allocation
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'conflict123',
          data: () => ({ ...mockAllocationData, id: 'conflict123' })
        }]
      });

      await expect(updateTimeAllocation(allocationId, updates)).rejects.toThrow('Time allocation conflicts');
    });
  });

  describe('deleteTimeAllocation', () => {
    it('should delete allocation and associated time slots', async () => {
      const allocationId = 'allocation123';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [
          { id: 'slot1', data: () => mockTimeSlot },
          { id: 'slot2', data: () => ({ ...mockTimeSlot, id: 'slot2' }) }
        ]
      });

      await deleteTimeAllocation(allocationId);

      expect(mockFirestore.deleteDoc).toHaveBeenCalledTimes(3); // 2 slots + 1 allocation
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should get available time slots for a project', async () => {
      const projectId = 'project123';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, status: TimeSlotStatus.AVAILABLE })
        }]
      });

      const result = await getAvailableTimeSlots(projectId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TimeSlotStatus.AVAILABLE);
      expect(result[0].projectId).toBe(projectId);
    });
  });

  describe('getTimeSlotsForFreelancer', () => {
    it('should get time slots for a freelancer', async () => {
      const freelancerId = 'freelancer456';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, freelancerId })
        }]
      });

      const result = await getTimeSlotsForFreelancer(freelancerId);

      expect(result).toHaveLength(1);
      expect(result[0].freelancerId).toBe(freelancerId);
    });
  });

  describe('checkAllocationConflicts', () => {
    it('should return empty array when no conflicts exist', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const conflicts = await checkAllocationConflicts(
        'freelancer456',
        mockFirestore.Timestamp.now(),
        mockFirestore.Timestamp.now()
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should detect overlapping time allocations', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T14:00:00Z');

      const conflictingAllocation = {
        ...mockAllocationData,
        id: 'conflict123',
        startDate: mockFirestore.Timestamp.fromDate(new Date('2024-01-01T12:00:00Z')),
        endDate: mockFirestore.Timestamp.fromDate(new Date('2024-01-01T16:00:00Z'))
      };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'conflict123',
          data: () => conflictingAllocation
        }]
      });

      const conflicts = await checkAllocationConflicts(
        'freelancer456',
        mockFirestore.Timestamp.fromDate(startTime),
        mockFirestore.Timestamp.fromDate(endTime)
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe('conflict123');
    });

    it('should exclude the specified allocation when checking conflicts', async () => {
      const excludeId = 'exclude123';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: excludeId,
          data: () => ({ ...mockAllocationData, id: excludeId })
        }]
      });

      const conflicts = await checkAllocationConflicts(
        'freelancer456',
        mockFirestore.Timestamp.now(),
        mockFirestore.Timestamp.now(),
        excludeId
      );

      expect(conflicts).toHaveLength(0);
    });
  });
});