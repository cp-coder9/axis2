import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  updateTimeSlotStatus,
  purchaseTimeSlot,
  getTimePurchases,
  startTimeSlotWork,
  completeTimeSlot,
  getTimeSlotsByStatus,
  getTimeSlotUtilizationStats,
  getTimeSlots
} from '../../src/services/timeSlotService';
import { TimeSlot, TimeSlotStatus, TimePurchase, TimePurchaseStatus } from '../../src/types';

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
  }
};

vi.mock('firebase/firestore', () => mockFirestore);

describe('Time Slot Service', () => {
  let mockTimeSlot: TimeSlot;
  let mockTimePurchase: TimePurchase;

  beforeEach(() => {
    mockTimeSlot = {
      id: 'slot123',
      allocationId: 'allocation123',
      projectId: 'project456',
      freelancerId: 'freelancer789',
      freelancerName: 'John Doe',
      startTime: mockFirestore.Timestamp.now(),
      endTime: mockFirestore.Timestamp.now(),
      durationHours: 4,
      hourlyRate: 50,
      status: TimeSlotStatus.AVAILABLE,
      createdAt: mockFirestore.Timestamp.now(),
      updatedAt: mockFirestore.Timestamp.now()
    };

    mockTimePurchase = {
      id: 'purchase123',
      slotId: 'slot123',
      clientId: 'client456',
      clientName: 'Client Corp',
      projectId: 'project456',
      freelancerId: 'freelancer789',
      freelancerName: 'John Doe',
      amount: 200,
      currency: 'USD',
      status: TimePurchaseStatus.COMPLETED,
      purchasedAt: mockFirestore.Timestamp.now()
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

  describe('updateTimeSlotStatus', () => {
    it('should update time slot status successfully', async () => {
      const slotId = 'slot123';
      const newStatus = TimeSlotStatus.IN_PROGRESS;

      await updateTimeSlotStatus(slotId, newStatus);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: newStatus,
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should handle update errors', async () => {
      mockFirestore.updateDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(updateTimeSlotStatus('slot123', TimeSlotStatus.IN_PROGRESS))
        .rejects.toThrow('Failed to update time slot status');
    });
  });

  describe('purchaseTimeSlot', () => {
    it('should purchase an available time slot successfully', async () => {
      const slotId = 'slot123';
      const clientId = 'client456';
      const clientName = 'Client Corp';

      // Mock slot retrieval
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          data: () => mockTimeSlot
        }]
      });

      // Mock purchase creation
      mockFirestore.addDoc.mockResolvedValue({ id: 'purchase123' });

      const purchaseId = await purchaseTimeSlot(slotId, clientId, clientName);

      expect(purchaseId).toBe('purchase123');
      expect(mockFirestore.addDoc).toHaveBeenCalledTimes(1); // Purchase record
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: TimeSlotStatus.PURCHASED,
          purchasedById: clientId,
          purchasedByName: clientName,
          purchaseId: 'purchase123'
        })
      );
    });

    it('should reject purchase of unavailable time slot', async () => {
      const unavailableSlot = { ...mockTimeSlot, status: TimeSlotStatus.PURCHASED };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          data: () => unavailableSlot
        }]
      });

      await expect(purchaseTimeSlot('slot123', 'client456', 'Client Corp'))
        .rejects.toThrow('Time slot is not available for purchase');
    });

    it('should calculate correct purchase amount', async () => {
      const slotWithCustomRate = { ...mockTimeSlot, durationHours: 2, hourlyRate: 75 };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          data: () => slotWithCustomRate
        }]
      });

      mockFirestore.addDoc.mockResolvedValue({ id: 'purchase123' });

      await purchaseTimeSlot('slot123', 'client456', 'Client Corp');

      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        { id: 'collection' },
        expect.objectContaining({
          amount: 150, // 2 hours * $75/hour
          currency: 'USD'
        })
      );
    });
  });

  describe('getTimePurchases', () => {
    it('should get all time purchases without filters', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'purchase1',
          data: () => mockTimePurchase
        }]
      });

      const purchases = await getTimePurchases();

      expect(purchases).toHaveLength(1);
      expect(purchases[0].id).toBe('purchase1');
    });

    it('should filter purchases by client ID', async () => {
      const clientPurchase = { ...mockTimePurchase, clientId: 'client456' };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'purchase1',
          data: () => clientPurchase
        }]
      });

      const purchases = await getTimePurchases('client456');

      expect(purchases).toHaveLength(1);
      expect(purchases[0].clientId).toBe('client456');
    });

    it('should filter purchases by project ID', async () => {
      const projectPurchase = { ...mockTimePurchase, projectId: 'project456' };

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'purchase1',
          data: () => projectPurchase
        }]
      });

      const purchases = await getTimePurchases(undefined, 'project456');

      expect(purchases).toHaveLength(1);
      expect(purchases[0].projectId).toBe('project456');
    });
  });

  describe('startTimeSlotWork', () => {
    it('should mark time slot as in progress', async () => {
      const slotId = 'slot123';

      await startTimeSlotWork(slotId);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: TimeSlotStatus.IN_PROGRESS,
          updatedAt: expect.any(Object)
        })
      );
    });
  });

  describe('completeTimeSlot', () => {
    it('should mark time slot as completed', async () => {
      const slotId = 'slot123';

      await completeTimeSlot(slotId);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        { id: 'doc' },
        expect.objectContaining({
          status: TimeSlotStatus.COMPLETED,
          updatedAt: expect.any(Object)
        })
      );
    });
  });

  describe('getTimeSlotsByStatus', () => {
    it('should get time slots by status', async () => {
      const status = TimeSlotStatus.AVAILABLE;

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, status })
        }]
      });

      const slots = await getTimeSlotsByStatus(status);

      expect(slots).toHaveLength(1);
      expect(slots[0].status).toBe(status);
    });

    it('should filter by project ID when provided', async () => {
      const status = TimeSlotStatus.AVAILABLE;
      const projectId = 'project456';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, status, projectId })
        }]
      });

      const slots = await getTimeSlotsByStatus(status, projectId);

      expect(slots).toHaveLength(1);
      expect(slots[0].projectId).toBe(projectId);
    });
  });

  describe('getTimeSlotUtilizationStats', () => {
    it('should calculate utilization statistics correctly', async () => {
      // Mock different slot statuses
      const availableSlots = [{ ...mockTimeSlot, status: TimeSlotStatus.AVAILABLE }];
      const purchasedSlots = [{ ...mockTimeSlot, status: TimeSlotStatus.PURCHASED }];
      const inProgressSlots = [{ ...mockTimeSlot, status: TimeSlotStatus.IN_PROGRESS }];
      const completedSlots = [{ ...mockTimeSlot, status: TimeSlotStatus.COMPLETED }];

      mockFirestore.getDocs
        .mockResolvedValueOnce({ docs: availableSlots.map(s => ({ data: () => s })) }) // Available
        .mockResolvedValueOnce({ docs: purchasedSlots.map(s => ({ data: () => s })) }) // Purchased
        .mockResolvedValueOnce({ docs: inProgressSlots.map(s => ({ data: () => s })) }) // In Progress
        .mockResolvedValueOnce({ docs: completedSlots.map(s => ({ data: () => s })) }); // Completed

      const stats = await getTimeSlotUtilizationStats();

      expect(stats.totalSlots).toBe(4);
      expect(stats.availableSlots).toBe(1);
      expect(stats.purchasedSlots).toBe(1);
      expect(stats.inProgressSlots).toBe(1);
      expect(stats.completedSlots).toBe(1);
      expect(stats.utilizationRate).toBe(75); // 3 utilized out of 4 total
    });

    it('should filter by project ID when provided', async () => {
      const projectId = 'project456';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{ data: () => ({ ...mockTimeSlot, projectId }) }]
      });

      const stats = await getTimeSlotUtilizationStats(projectId);

      expect(mockFirestore.where).toHaveBeenCalledWith('projectId', '==', projectId);
    });

    it('should handle zero total slots', async () => {
      mockFirestore.getDocs.mockResolvedValue({ docs: [] });

      const stats = await getTimeSlotUtilizationStats();

      expect(stats.totalSlots).toBe(0);
      expect(stats.utilizationRate).toBe(0);
    });
  });

  describe('getTimeSlots', () => {
    it('should get all time slots without filters', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => mockTimeSlot
        }]
      });

      const slots = await getTimeSlots();

      expect(slots).toHaveLength(1);
      expect(slots[0].id).toBe('slot1');
    });

    it('should filter by project ID', async () => {
      const projectId = 'project456';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, projectId })
        }]
      });

      const slots = await getTimeSlots(projectId);

      expect(slots).toHaveLength(1);
      expect(slots[0].projectId).toBe(projectId);
    });

    it('should filter by freelancer ID', async () => {
      const freelancerId = 'freelancer789';

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, freelancerId })
        }]
      });

      const slots = await getTimeSlots(undefined, freelancerId);

      expect(slots).toHaveLength(1);
      expect(slots[0].freelancerId).toBe(freelancerId);
    });

    it('should filter by status', async () => {
      const status = TimeSlotStatus.AVAILABLE;

      mockFirestore.getDocs.mockResolvedValue({
        docs: [{
          id: 'slot1',
          data: () => ({ ...mockTimeSlot, status })
        }]
      });

      const slots = await getTimeSlots(undefined, undefined, status);

      expect(slots).toHaveLength(1);
      expect(slots[0].status).toBe(status);
    });
  });
});