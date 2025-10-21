import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createApprovalRequest,
  getApprovalRequests,
  submitApprovalVote,
  getApprovalRequestById,
  updateApprovalRequestStatus,
  deleteApprovalRequest,
  checkAllocationRequiresApproval
} from '../../src/services/allocationApprovalService';
import { AllocationApprovalStatus, AllocationApprovalRequest, ApprovalVote } from '../../src/types';

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

describe('Allocation Approval Service', () => {
  let mockAllocationData: any;
  let mockApprovalRequest: AllocationApprovalRequest;

  beforeEach(() => {
    mockAllocationData = {
      projectId: 'project123',
      projectTitle: 'Test Project',
      freelancerId: 'freelancer456',
      freelancerName: 'John Doe',
      allocatedById: 'admin789',
      allocatedByName: 'Admin User',
      allocatedHours: 60,
      hourlyRate: 50
    };

    mockApprovalRequest = {
      id: 'approval123',
      allocationId: '',
      projectId: 'project123',
      projectTitle: 'Test Project',
      freelancerId: 'freelancer456',
      freelancerName: 'John Doe',
      requestedById: 'admin789',
      requestedByName: 'Admin User',
      allocatedHours: 60,
      hourlyRate: 50,
      totalValue: 3000,
      reason: 'Large allocation request',
      status: AllocationApprovalStatus.PENDING,
      approvals: [],
      requiredApprovals: 2,
      createdAt: mockFirestore.Timestamp.now(),
      updatedAt: mockFirestore.Timestamp.now(),
      expiresAt: mockFirestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
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

  describe('createApprovalRequest', () => {
    it('should create an approval request successfully', async () => {
      const reason = 'Large time allocation requested';
      const requiredApprovals = 2;

      mockFirestore.addDoc.mockResolvedValue({ id: 'approval123' });

      const requestId = await createApprovalRequest(mockAllocationData, reason, requiredApprovals);

      expect(requestId).toBe('approval123');
      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        { id: 'collection' },
        expect.objectContaining({
          allocationId: '',
          projectId: 'project123',
          freelancerId: 'freelancer456',
          allocatedHours: 60,
          hourlyRate: 50,
          totalValue: 3000, // 60 * 50
          reason,
          status: AllocationApprovalStatus.PENDING,
          requiredApprovals
        })
      );
    });

    it('should handle creation errors', async () => {
      mockFirestore.addDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(createApprovalRequest(mockAllocationData, 'Test reason')).rejects.toThrow('Failed to create approval request');
    });
  });

  describe('getApprovalRequests', () => {
    it('should get all approval requests without filters', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'approval1',
          data: () => mockApprovalRequest
        }]
      });

      const requests = await getApprovalRequests();

      expect(requests).toHaveLength(1);
      expect(requests[0].id).toBe('approval1');
    });

    it('should filter requests by status', async () => {
      const status = AllocationApprovalStatus.PENDING;

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'approval1',
          data: () => ({ ...mockApprovalRequest, status })
        }]
      });

      const requests = await getApprovalRequests(status);

      expect(requests).toHaveLength(1);
      expect(requests[0].status).toBe(status);
    });

    it('should filter requests for admin voting', async () => {
      const adminId = 'admin123';

      // Mock requests where admin hasn't voted
      const requests = [
        { ...mockApprovalRequest, id: 'approval1', approvals: [] },
        { ...mockApprovalRequest, id: 'approval2', approvals: [{ adminId: 'otherAdmin' }] },
        { ...mockApprovalRequest, id: 'approval3', requestedById: adminId } // Created by this admin
      ];

      mockFirestore.getDocs.mockResolvedValue({
        docs: requests.map(req => ({
          id: req.id,
          data: () => req
        }))
      });

      const filteredRequests = await getApprovalRequests(undefined, adminId);

      expect(filteredRequests).toHaveLength(2); // approval1 and approval3
      expect(filteredRequests.map(r => r.id)).toEqual(['approval1', 'approval3']);
    });
  });

  describe('submitApprovalVote', () => {
    it('should submit an approval vote successfully', async () => {
      const requestId = 'approval123';
      const adminId = 'admin123';
      const adminName = 'Admin User';
      const decision = 'APPROVE' as const;
      const comments = 'Approved for project needs';

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockApprovalRequest
      });

      await submitApprovalVote(requestId, adminId, adminName, decision, comments);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          approvals: expect.arrayContaining([
            expect.objectContaining({
              adminId,
              adminName,
              decision,
              comments
            })
          ])
        })
      );
    });

    it('should prevent duplicate votes from the same admin', async () => {
      const requestId = 'approval123';
      const adminId = 'admin123';

      const requestWithVote = {
        ...mockApprovalRequest,
        approvals: [{ adminId, adminName: 'Admin User', decision: 'APPROVE', votedAt: mockFirestore.Timestamp.now() }]
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => requestWithVote
      });

      await expect(submitApprovalVote(requestId, adminId, 'Admin User', 'APPROVE')).rejects.toThrow('Admin has already voted');
    });

    it('should approve allocation when required approvals are met', async () => {
      const requestId = 'approval123';
      const adminId = 'admin123';
      const adminName = 'Admin User';

      const requestWithOneVote = {
        ...mockApprovalRequest,
        approvals: [{ adminId: 'otherAdmin', adminName: 'Other Admin', decision: 'APPROVE', votedAt: mockFirestore.Timestamp.now() }]
      };

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => requestWithOneVote
      });

      await submitApprovalVote(requestId, adminId, adminName, 'APPROVE');

      // Should update approval request status to APPROVED
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: AllocationApprovalStatus.APPROVED
        })
      );
    });

    it('should reject allocation when rejection vote is cast', async () => {
      const requestId = 'approval123';
      const adminId = 'admin123';
      const adminName = 'Admin User';

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockApprovalRequest
      });

      await submitApprovalVote(requestId, adminId, adminName, 'REJECT');

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: AllocationApprovalStatus.REJECTED
        })
      );
    });

    it('should escalate request when escalation vote is cast', async () => {
      const requestId = 'approval123';
      const adminId = 'admin123';
      const adminName = 'Admin User';

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockApprovalRequest
      });

      await submitApprovalVote(requestId, adminId, adminName, 'ESCALATE');

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: AllocationApprovalStatus.ESCALATED
        })
      );
    });
  });

  describe('getApprovalRequestById', () => {
    it('should get approval request by ID', async () => {
      const requestId = 'approval123';

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockApprovalRequest
      });

      const request = await getApprovalRequestById(requestId);

      expect(request).toBeTruthy();
      expect(request?.id).toBe(requestId);
    });

    it('should return null for non-existent request', async () => {
      const requestId = 'nonexistent';

      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false
      });

      const request = await getApprovalRequestById(requestId);

      expect(request).toBeNull();
    });
  });

  describe('updateApprovalRequestStatus', () => {
    it('should update approval request status', async () => {
      const requestId = 'approval123';
      const newStatus = AllocationApprovalStatus.APPROVED;

      await updateApprovalRequestStatus(requestId, newStatus);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: newStatus,
          updatedAt: expect.any(Object)
        })
      );
    });
  });

  describe('deleteApprovalRequest', () => {
    it('should delete approval request', async () => {
      const requestId = 'approval123';

      await deleteApprovalRequest(requestId);

      expect(mockFirestore.deleteDoc).toHaveBeenCalledWith({ id: 'doc' });
    });
  });

  describe('checkAllocationRequiresApproval', () => {
    it('should require approval for allocations above threshold', () => {
      expect(checkAllocationRequiresApproval(60, 50)).toBe(true);
      expect(checkAllocationRequiresApproval(40, 50)).toBe(false);
    });

    it('should use default threshold of 50 hours', () => {
      expect(checkAllocationRequiresApproval(60)).toBe(true);
      expect(checkAllocationRequiresApproval(40)).toBe(false);
    });
  });
});