import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'; import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'; import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';



// Mock Firestore functions before importing the service

vi.mock('firebase/firestore', () => ({

    collection: vi.fn(),// Mock Firestore functions before importing the service// Mock Firestore functions before importing the service

    doc: vi.fn(),

    addDoc: vi.fn(), vi.mock('firebase/firestore', () => ({

        updateDoc: vi.fn(), vi.mock('firebase/firestore', () => ({

            deleteDoc: vi.fn(),

            getDoc: vi.fn(), collection: vi.fn(), collection: vi.fn(),

            getDocs: vi.fn(),

            query: vi.fn(), doc: vi.fn(), doc: vi.fn(),

            where: vi.fn(),

            orderBy: vi.fn(), addDoc: vi.fn(), addDoc: vi.fn(),

            serverTimestamp: vi.fn(),

            Timestamp: {
                updateDoc: vi.fn(), updateDoc: vi.fn(),

                now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),

                fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))        deleteDoc: vi.fn(), deleteDoc: vi.fn(),

            },

            writeBatch: vi.fn(() => ({
                getDoc: vi.fn(), getDoc: vi.fn(),

                set: vi.fn(),

                update: vi.fn(), getDocs: vi.fn(), getDocs: vi.fn(),

                delete: vi.fn(),

                commit: vi.fn()        query: vi.fn(), query: vi.fn(),

            }))

        })); where: vi.fn(), where: vi.fn(),



        // Mock Firebase        orderBy: vi.fn(), orderBy: vi.fn(),

        vi.mock('@/firebase', () => ({

            db: {}        serverTimestamp: vi.fn(), serverTimestamp: vi.fn(),

        }));

        Timestamp: {

            // Mock audit logger            Timestamp: {

            vi.mock('@/utils/auditLogger', () => ({

                logAuditEvent: vi.fn()                now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })), now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),

            }));

            fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))

import { db } from '@/firebase';

            import {},

            createTimeAllocation,
        },

        getAvailableTimeSlots

    } from '@/services/timeAllocationService'; writeBatch: vi.fn(() => ({

        import {
            writeBatch: vi.fn(() => ({

                purchaseTimeSlot,

                getTimePurchases, set: vi.fn(), set: vi.fn(),

                startTimeSlotWork,

                completeTimeSlot                update: vi.fn(), update: vi.fn(),

            } from '@/services/timeSlotService';

            import {
                delete: vi.fn(), delete: vi.fn(),

                submitApprovalVote

            } from '@/services/allocationApprovalService'; commit: vi.fn()    commit: vi.fn()

import { TimeSlotStatus, TimeAllocationStatus, AllocationApprovalStatus } from '@/types';

        }))

describe('Time Management Integration Tests', () => {}))

const mockUser = {

    id: 'admin-1',
}));

name: 'Admin User',}));

email: 'admin@example.com',

    role: 'admin'

  };

// Mock Firebase// Mock Firebase

const mockAllocationData = {

    projectId: 'project-1', vi.mock('@/firebase', () => ({

        projectTitle: 'Test Project', vi.mock('@/firebase', () => ({

            freelancerId: 'freelancer-1',

            freelancerName: 'John Doe', db: {}  db: {}

    allocatedById: 'admin-1',

            allocatedByName: 'Admin User',
        }));

        allocatedHours: 20,
    }));

    hourlyRate: 75,

    startDate: { seconds: 1234567890, nanoseconds: 0 },

    endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 },

    notes: 'Test allocation'// Mock audit logger// Mock audit logger

};

vi.mock('@/utils/auditLogger', () => ({

    const mockClient = {
        vi.mock('@/utils/auditLogger', () => ({

            id: 'client-1',

            name: 'Client Company'        logAuditEvent: vi.fn()  logAuditEvent: vi.fn()

        };

    }));

beforeEach(() => { }));

vi.clearAllMocks();

  });



afterEach(() => {
    import { db } from '@/firebase'; import { db } from '@/firebase';

    vi.resetAllMocks();

}); import {import {



    describe('Time Slot Purchase Workflow', () => {
        createTimeAllocation, createTimeAllocation,

        it('should allow purchasing an available time slot', async () => {

            // Mock Firestore responses    getTimeAllocations, getTimeAllocations,

            const mockSlotDoc = {

                exists: () => true, getAvailableTimeSlots, getAvailableTimeSlots,

                data: () => ({

                    status: TimeSlotStatus.AVAILABLE, deleteTimeAllocation  deleteTimeAllocation

          projectId: 'project-1',

                    freelancerId: 'freelancer-1',
                } from '@/services/timeAllocationService';
            } from '@/services/timeAllocationService';

            freelancerName: 'John Doe',

                durationHours: 4,import {import {

                    hourlyRate: 75

                })    purchaseTimeSlot, purchaseTimeSlot,

      };

getTimePurchases, getTimePurchases,

      const mockPurchaseDocRef = { id: 'purchase-1' };

getTimeSlotsByStatus, getTimeSlotsByStatus,

    // Mock collection and doc calls

    (doc as any).mockReturnValue({ id: 'slot-1' }); startTimeSlotWork, startTimeSlotWork,

        (getDocs as any).mockResolvedValue({

            docs: [mockSlotDoc], completeTimeSlot  completeTimeSlot

        empty: false

        });} from '@/services/timeSlotService';} from '@/services/timeSlotService';

(addDoc as any).mockResolvedValue(mockPurchaseDocRef);

(updateDoc as any).mockResolvedValue(undefined); import {import {



    // Purchase the time slot    createApprovalRequest, createApprovalRequest,

    const purchaseId = await purchaseTimeSlot('slot-1', mockClient.id, mockClient.name);

    submitApprovalVote, submitApprovalVote,

    expect(purchaseId).toBe('purchase-1');

    expect(updateDoc).toHaveBeenCalledWith(getApprovalRequests  getApprovalRequests

        { id: 'slot-1' },

        expect.objectContaining({} from '@/services/allocationApprovalService';
} from '@/services/allocationApprovalService';

status: TimeSlotStatus.PURCHASED,

    purchasedById: mockClient.id,import { TimeSlotStatus, TimeAllocationStatus, AllocationApprovalStatus } from '@/types'; import { TimeSlotStatus, TimeAllocationStatus, AllocationApprovalStatus } from '@/types';

purchasedByName: mockClient.name,

    purchaseId: 'purchase-1'

        })

      );// Get references to mocked functions// Get references to mocked functions

    });

import {import {

    it('should retrieve purchase history for a client', async () => {

    const mockPurchases = [{
        collection, collection,

        id: 'purchase-1',

        data: () => ({
            doc, doc,

            slotId: 'slot-1',

            clientId: 'client-1', addDoc, addDoc,

            clientName: 'Client Company',

            projectId: 'project-1', updateDoc, updateDoc,

            freelancerId: 'freelancer-1',

            freelancerName: 'John Doe', getDoc, getDoc,

            amount: 300,

            currency: 'USD', getDocs, getDocs,

            status: 'COMPLETED',

            purchasedAt: { seconds: 1234567890, nanoseconds: 0 }    query, query,

        })

    }]; serverTimestamp, serverTimestamp,



        (getDocs as any).mockResolvedValue({
            Timestamp  Timestamp

        docs: mockPurchases,

            empty: false
        } from 'firebase/firestore';
} from 'firebase/firestore';

      });



const purchases = await getTimePurchases('client-1');

describe('Time Management Integration Tests', () => {

    expect(purchases).toHaveLength(1); describe('Time Management Integration Tests', () => {

        expect(purchases[0].amount).toBe(300);

        expect(purchases[0].clientId).toBe('client-1'); const mockUser = {

        }); const mockUser = {

        });

id: 'admin-1', id: 'admin-1',

    describe('Time Slot Status Transitions', () => {

        it('should transition slot from purchased to in-progress to completed', async () => {
            name: 'Admin User', name: 'Admin User',

      const slotId = 'slot-workflow-test';

            email: 'admin@example.com', email: 'admin@example.com',

                // Mock doc calls

                (doc as any).mockReturnValue({ id: slotId }); role: 'admin'    role: 'admin'

                    (updateDoc as any).mockResolvedValue(undefined);

        };

        // Start work        };

        await startTimeSlotWork(slotId);

        expect(updateDoc).toHaveBeenCalledWith(

            { id: slotId },

            expect.objectContaining({ status: TimeSlotStatus.IN_PROGRESS })        const mockAllocationData = {

      ); const mockAllocationData = {



    // Reset mock for next call                projectId: 'project-1', projectId: 'project-1',

    vi.clearAllMocks();

      (doc as any).mockReturnValue({ id: slotId }); projectTitle: 'Test Project', projectTitle: 'Test Project',

    (updateDoc as any).mockResolvedValue(undefined);

freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

    // Complete work

    await completeTimeSlot(slotId); freelancerName: 'John Doe', freelancerName: 'John Doe',

        expect(updateDoc).toHaveBeenCalledWith(

            { id: slotId }, allocatedById: 'admin-1', allocatedById: 'admin-1',

            expect.objectContaining({ status: TimeSlotStatus.COMPLETED })

        ); allocatedByName: 'Admin User', allocatedByName: 'Admin User',

    });

  }); allocatedHours: 20, allocatedHours: 20,



    describe('Allocation Approval Workflow', () => {
        hourlyRate: 75, hourlyRate: 75,

            it('should handle approval vote submission', async () => {

                // Mock request document                startDate: { seconds: 1234567890, nanoseconds: 0 }, startDate: { seconds: 1234567890, nanoseconds: 0 },

                const mockRequestDoc = {

                    exists: () => true, endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 }, endDate: { seconds: 1234567890 + (20 * 60 * 60), nanoseconds: 0 },

                    data: () => ({

                        allocationId: 'allocation-1', notes: 'Test allocation'    notes: 'Test allocation'

          approvals: [],

                        requiredApprovals: 2,
                    };

                    status: AllocationApprovalStatus.PENDING
                };

            })

    };



(doc as any).mockReturnValue({ id: 'approval-1' }); const mockClient = {

      (getDoc as any).mockResolvedValue(mockRequestDoc); const mockClient = {

      (updateDoc as any).mockResolvedValue(undefined);

id: 'client-1', id: 'client-1',

    // Submit approval vote

    await submitApprovalVote('approval-1', 'admin-2', 'Admin Two', 'APPROVE', 'Approved'); name: 'Client Company'    name: 'Client Company'



expect(updateDoc).toHaveBeenCalledWith(            };

{ id: 'approval-1' },        };

expect.objectContaining({

    approvals: expect.arrayContaining([

        expect.objectContaining({

            adminId: 'admin-2', beforeEach(() => {

                adminName: 'Admin Two', beforeEach(() => {

            decision: 'APPROVE',

            comments: 'Approved'                vi.clearAllMocks(); vi.clearAllMocks();

        })

    ])(serverTimestamp as any).mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }); (serverTimestamp as any).mockReturnValue({ seconds: 1234567890, nanoseconds: 0 });

        })

      ); (Timestamp.now as any).mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }); (Timestamp.now as any).mockReturnValue({ seconds: 1234567890, nanoseconds: 0 });

    });

  });            });

});        });



afterEach(() => {
    afterEach(() => {

        vi.resetAllMocks(); vi.resetAllMocks();

    });
});



describe('Complete Time Allocation and Purchasing Workflow', () => {
    describe('Complete Time Allocation and Purchasing Workflow', () => {

        it('should complete full workflow: allocation -> approval -> slot creation -> purchase -> completion', async () => {
            it('should complete full workflow: allocation -> approval -> slot creation -> purchase -> completion', async () => {

                // Mock Firestore responses      // Mock Firestore responses

                const mockAllocationDocRef = { id: 'allocation-1' }; const mockAllocationDocRef = { id: 'allocation-1' };

                const mockApprovalDocRef = { id: 'approval-1' }; const mockApprovalDocRef = { id: 'approval-1' };

                const mockSlotDocRefs = [      const mockSlotDocRefs = [

                    { id: 'slot-1' }, { id: 'slot-1' },

                    { id: 'slot-2' }, { id: 'slot-2' },

                    { id: 'slot-3' }, { id: 'slot-3' },

                    { id: 'slot-4' }, { id: 'slot-4' },

                    { id: 'slot-5' }        { id: 'slot-5' }

                ];      ];

                const mockPurchaseDocRef = { id: 'purchase-1' }; const mockPurchaseDocRef = { id: 'purchase-1' };



                // Mock collection and doc calls      // Mock collection and doc calls

                (collection as any).mockReturnValue({}); (collection as any).mockReturnValue({});

                (doc as any).mockReturnValue(mockAllocationDocRef); (doc as any).mockReturnValue(mockAllocationDocRef);

                (addDoc as any)(addDoc as any)

                    .mockReturnValueOnce(mockAllocationDocRef) // allocation creation        .mockReturnValueOnce(mockAllocationDocRef) // allocation creation

                    .mockReturnValueOnce(mockApprovalDocRef)   // approval request        .mockReturnValueOnce(mockApprovalDocRef)   // approval request

                    .mockReturnValueOnce(mockSlotDocRefs[0])   // slot 1        .mockReturnValueOnce(mockSlotDocRefs[0])   // slot 1

                    .mockReturnValueOnce(mockSlotDocRefs[1])   // slot 2        .mockReturnValueOnce(mockSlotDocRefs[1])   // slot 2

                    .mockReturnValueOnce(mockSlotDocRefs[2])   // slot 3        .mockReturnValueOnce(mockSlotDocRefs[2])   // slot 3

                    .mockReturnValueOnce(mockSlotDocRefs[3])   // slot 4        .mockReturnValueOnce(mockSlotDocRefs[3])   // slot 4

                    .mockReturnValueOnce(mockSlotDocRefs[4])   // slot 5        .mockReturnValueOnce(mockSlotDocRefs[4])   // slot 5

                    .mockReturnValueOnce(mockPurchaseDocRef);  // purchase        .mockReturnValueOnce(mockPurchaseDocRef);  // purchase



                // Mock getDocs for conflict checking (empty results)      // Mock getDocs for conflict checking (empty results)

                (getDocs as any).mockResolvedValue({      (getDocs as any).mockResolvedValue({

                    docs: [], docs: [],

                    empty: true        empty: true

                });
            });



            // Mock updateDoc calls      // Mock updateDoc calls

            (updateDoc as any).mockResolvedValue(undefined); (updateDoc as any).mockResolvedValue(undefined);



            // Step 1: Create large allocation (requires approval)      // Step 1: Create large allocation (requires approval)

            const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 }; const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 };

            const result = await createTimeAllocation(largeAllocationData, mockUser, 50); const result = await createTimeAllocation(largeAllocationData, mockUser, 50);



            expect(result.requiresApproval).toBe(true); expect(result.requiresApproval).toBe(true);

            expect(result.allocationId).toBe('allocation-1'); expect(result.allocationId).toBe('allocation-1');

            expect(result.approvalRequestId).toBe('approval-1'); expect(result.approvalRequestId).toBe('approval-1');



            // Step 2: Submit approval votes      // Step 2: Submit approval votes

            await submitApprovalVote('approval-1', 'admin-2', 'Admin Two', 'APPROVE', 'Approved for project needs'); await submitApprovalVote('approval-1', 'admin-2', 'Admin Two', 'APPROVE', 'Approved for project needs');

            await submitApprovalVote('approval-1', 'admin-3', 'Admin Three', 'APPROVE', 'Looks good'); await submitApprovalVote('approval-1', 'admin-3', 'Admin Three', 'APPROVE', 'Looks good');



            // Step 3: Check that slots were created (this would happen in the approval process)      // Step 3: Check that slots were created (this would happen in the approval process)

            // Mock slots query result      // Mock slots query result

            const mockSlots = mockSlotDocRefs.map((ref, index) => ({
                const mockSlots = mockSlotDocRefs.map((ref, index) => ({

                    id: ref.id, id: ref.id,

                    data: () => ({
                        data: () => ({

                            allocationId: 'allocation-1', allocationId: 'allocation-1',

                            projectId: 'project-1', projectId: 'project-1',

                            freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

                            freelancerName: 'John Doe', freelancerName: 'John Doe',

                            startTime: { seconds: 1234567890 + (index * 4 * 60 * 60), nanoseconds: 0 }, startTime: { seconds: 1234567890 + (index * 4 * 60 * 60), nanoseconds: 0 },

                            endTime: { seconds: 1234567890 + ((index + 1) * 4 * 60 * 60), nanoseconds: 0 }, endTime: { seconds: 1234567890 + ((index + 1) * 4 * 60 * 60), nanoseconds: 0 },

                            durationHours: 4, durationHours: 4,

                            hourlyRate: 75, hourlyRate: 75,

                            status: TimeSlotStatus.AVAILABLE          status: TimeSlotStatus.AVAILABLE

                        })
                    })

                }));
            }));



            (getDocs as any).mockResolvedValueOnce({      (getDocs as any).mockResolvedValueOnce({

                docs: mockSlots, docs: mockSlots,

                empty: false        empty: false

            });
        });



        // Step 4: Get available slots      // Step 4: Get available slots

        const availableSlots = await getAvailableTimeSlots('project-1'); const availableSlots = await getAvailableTimeSlots('project-1');

        expect(availableSlots).toHaveLength(5); expect(availableSlots).toHaveLength(5);

        expect(availableSlots[0].status).toBe(TimeSlotStatus.AVAILABLE); expect(availableSlots[0].status).toBe(TimeSlotStatus.AVAILABLE);



        // Step 5: Purchase a time slot      // Step 5: Purchase a time slot

        const purchaseId = await purchaseTimeSlot('slot-1', mockClient.id, mockClient.name); const purchaseId = await purchaseTimeSlot('slot-1', mockClient.id, mockClient.name);

        expect(purchaseId).toBe('purchase-1'); expect(purchaseId).toBe('purchase-1');



        // Step 6: Start work on the slot      // Step 6: Start work on the slot

        await startTimeSlotWork('slot-1'); await startTimeSlotWork('slot-1');



        // Step 7: Complete the slot      // Step 7: Complete the slot

        await completeTimeSlot('slot-1'); await completeTimeSlot('slot-1');



        // Step 8: Verify purchase history      // Step 8: Verify purchase history

        const mockPurchases = [{
            const mockPurchases = [{

                id: 'purchase-1', id: 'purchase-1',

                data: () => ({
                    data: () => ({

                        slotId: 'slot-1', slotId: 'slot-1',

                        clientId: mockClient.id, clientId: mockClient.id,

                        clientName: mockClient.name, clientName: mockClient.name,

                        projectId: 'project-1', projectId: 'project-1',

                        freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

                        freelancerName: 'John Doe', freelancerName: 'John Doe',

                        amount: 300, // 4 hours * $75          amount: 300, // 4 hours * $75

                        currency: 'USD', currency: 'USD',

                        status: 'COMPLETED', status: 'COMPLETED',

                        purchasedAt: { seconds: 1234567890, nanoseconds: 0 }          purchasedAt: { seconds: 1234567890, nanoseconds: 0 }

                    })
                })

            }];
        }];



        (getDocs as any).mockResolvedValueOnce({      (getDocs as any).mockResolvedValueOnce({

            docs: mockPurchases, docs: mockPurchases,

            empty: false        empty: false

        });
    });



    const purchases = await getTimePurchases(mockClient.id); const purchases = await getTimePurchases(mockClient.id);

    expect(purchases).toHaveLength(1); expect(purchases).toHaveLength(1);

    expect(purchases[0].amount).toBe(300); expect(purchases[0].amount).toBe(300);

});
    });



it('should handle small allocations without approval workflow', async () => {
    it('should handle small allocations without approval workflow', async () => {

        // Mock Firestore responses      // Mock Firestore responses

        const mockAllocationDocRef = { id: 'allocation-2' }; const mockAllocationDocRef = { id: 'allocation-2' };

        const mockSlotDocRefs = [      const mockSlotDocRefs = [

            { id: 'slot-6' }, { id: 'slot-6' },

            { id: 'slot-7' }, { id: 'slot-7' },

            { id: 'slot-8' }, { id: 'slot-8' },

            { id: 'slot-9' }, { id: 'slot-9' },

            { id: 'slot-10' }        { id: 'slot-10' }

        ];      ];



        // Mock collection and doc calls      // Mock collection and doc calls

        (collection as any).mockReturnValue({}); (collection as any).mockReturnValue({});

        (doc as any).mockReturnValue(mockAllocationDocRef); (doc as any).mockReturnValue(mockAllocationDocRef);

        (addDoc as any)(addDoc as any)

            .mockReturnValueOnce(mockAllocationDocRef) // allocation creation        .mockReturnValueOnce(mockAllocationDocRef) // allocation creation

            .mockReturnValueOnce(mockSlotDocRefs[0])   // slot 1        .mockReturnValueOnce(mockSlotDocRefs[0])   // slot 1

            .mockReturnValueOnce(mockSlotDocRefs[1])   // slot 2        .mockReturnValueOnce(mockSlotDocRefs[1])   // slot 2

            .mockReturnValueOnce(mockSlotDocRefs[2])   // slot 3        .mockReturnValueOnce(mockSlotDocRefs[2])   // slot 3

            .mockReturnValueOnce(mockSlotDocRefs[3])   // slot 4        .mockReturnValueOnce(mockSlotDocRefs[3])   // slot 4

            .mockReturnValueOnce(mockSlotDocRefs[4]);  // slot 5        .mockReturnValueOnce(mockSlotDocRefs[4]);  // slot 5



        // Mock getDocs for conflict checking (empty results)      // Mock getDocs for conflict checking (empty results)

        (getDocs as any).mockResolvedValue({      (getDocs as any).mockResolvedValue({

            docs: [], docs: [],

            empty: true        empty: true

        });
    });



    // Mock updateDoc calls      // Mock updateDoc calls

    (updateDoc as any).mockResolvedValue(undefined); (updateDoc as any).mockResolvedValue(undefined);



    // Create small allocation (no approval required)      // Create small allocation (no approval required)

    const smallAllocationData = { ...mockAllocationData, allocatedHours: 20 }; const smallAllocationData = { ...mockAllocationData, allocatedHours: 20 };

    const result = await createTimeAllocation(smallAllocationData, mockUser, 50); const result = await createTimeAllocation(smallAllocationData, mockUser, 50);



    expect(result.requiresApproval).toBe(false); expect(result.requiresApproval).toBe(false);

    expect(result.allocationId).toBe('allocation-2'); expect(result.allocationId).toBe('allocation-2');

    expect(result.approvalRequestId).toBeUndefined(); expect(result.approvalRequestId).toBeUndefined();



    // Verify slots were created immediately      // Verify slots were created immediately

    const mockSlots = mockSlotDocRefs.map((ref, index) => ({
        const mockSlots = mockSlotDocRefs.map((ref, index) => ({

            id: ref.id, id: ref.id,

            data: () => ({
                data: () => ({

                    allocationId: 'allocation-2', allocationId: 'allocation-2',

                    projectId: 'project-1', projectId: 'project-1',

                    freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

                    freelancerName: 'John Doe', freelancerName: 'John Doe',

                    startTime: { seconds: 1234567890 + (index * 4 * 60 * 60), nanoseconds: 0 }, startTime: { seconds: 1234567890 + (index * 4 * 60 * 60), nanoseconds: 0 },

                    endTime: { seconds: 1234567890 + ((index + 1) * 4 * 60 * 60), nanoseconds: 0 }, endTime: { seconds: 1234567890 + ((index + 1) * 4 * 60 * 60), nanoseconds: 0 },

                    durationHours: 4, durationHours: 4,

                    hourlyRate: 75, hourlyRate: 75,

                    status: TimeSlotStatus.AVAILABLE          status: TimeSlotStatus.AVAILABLE

                })
            })

        }));
    }));



    (getDocs as any).mockResolvedValueOnce({      (getDocs as any).mockResolvedValueOnce({

        docs: mockSlots, docs: mockSlots,

        empty: false        empty: false

    });
});



const availableSlots = await getAvailableTimeSlots('project-1'); const availableSlots = await getAvailableTimeSlots('project-1');

expect(availableSlots).toHaveLength(5); expect(availableSlots).toHaveLength(5);

});    });



it('should handle allocation conflicts correctly', async () => {
    it('should handle allocation conflicts correctly', async () => {

        // Mock existing allocation that conflicts      // Mock existing allocation that conflicts

        const mockExistingAllocation = {
            const mockExistingAllocation = {

                id: 'existing-allocation', id: 'existing-allocation',

                data: () => ({
                    data: () => ({

                        freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

                        startDate: { seconds: 1234567890 - (24 * 60 * 60), nanoseconds: 0 }, // yesterday          startDate: { seconds: 1234567890 - (24 * 60 * 60), nanoseconds: 0 }, // yesterday

                        endDate: { seconds: 1234567890 + (24 * 60 * 60), nanoseconds: 0 },  // tomorrow          endDate: { seconds: 1234567890 + (24 * 60 * 60), nanoseconds: 0 },  // tomorrow

                        status: TimeAllocationStatus.ACTIVE          status: TimeAllocationStatus.ACTIVE

                    })
                })

            };
        };



        (getDocs as any).mockResolvedValueOnce({      (getDocs as any).mockResolvedValueOnce({

            docs: [mockExistingAllocation], docs: [mockExistingAllocation],

            empty: false        empty: false

        });
    });



    // Attempt to create overlapping allocation      // Attempt to create overlapping allocation

    const conflictingAllocation = {
        const conflictingAllocation = {

            ...mockAllocationData, ...mockAllocationData,

            startDate: { seconds: 1234567890, nanoseconds: 0 }, // today        startDate: { seconds: 1234567890, nanoseconds: 0 }, // today

            endDate: { seconds: 1234567890 + (48 * 60 * 60), nanoseconds: 0 } // day after tomorrow        endDate: { seconds: 1234567890 + (48 * 60 * 60), nanoseconds: 0 } // day after tomorrow

        };
    };



    await expect(createTimeAllocation(conflictingAllocation, mockUser, 50))      await expect(createTimeAllocation(conflictingAllocation, mockUser, 50))

        .rejects.toThrow('Time allocation conflicts with existing allocations');        .rejects.toThrow('Time allocation conflicts with existing allocations');

});    });



it('should handle approval rejection workflow', async () => {
    it('should handle approval rejection workflow', async () => {

        // Mock Firestore responses      // Mock Firestore responses

        const mockAllocationDocRef = { id: 'allocation-3' }; const mockAllocationDocRef = { id: 'allocation-3' };

        const mockApprovalDocRef = { id: 'approval-2' }; const mockApprovalDocRef = { id: 'approval-2' };



        // Mock collection and doc calls      // Mock collection and doc calls

        (collection as any).mockReturnValue({}); (collection as any).mockReturnValue({});

        (doc as any).mockReturnValue(mockAllocationDocRef); (doc as any).mockReturnValue(mockAllocationDocRef);

        (addDoc as any)(addDoc as any)

            .mockReturnValueOnce(mockAllocationDocRef) // allocation creation        .mockReturnValueOnce(mockAllocationDocRef) // allocation creation

            .mockReturnValueOnce(mockApprovalDocRef);   // approval request        .mockReturnValueOnce(mockApprovalDocRef);   // approval request



        // Mock getDocs for conflict checking (empty results)      // Mock getDocs for conflict checking (empty results)

        (getDocs as any).mockResolvedValue({      (getDocs as any).mockResolvedValue({

            docs: [], docs: [],

            empty: true        empty: true

        });
    });



    // Mock updateDoc calls      // Mock updateDoc calls

    (updateDoc as any).mockResolvedValue(undefined); (updateDoc as any).mockResolvedValue(undefined);



    // Create large allocation requiring approval      // Create large allocation requiring approval

    const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 }; const largeAllocationData = { ...mockAllocationData, allocatedHours: 60 };

    const result = await createTimeAllocation(largeAllocationData, mockUser, 50); const result = await createTimeAllocation(largeAllocationData, mockUser, 50);



    expect(result.requiresApproval).toBe(true); expect(result.requiresApproval).toBe(true);

    expect(result.approvalRequestId).toBe('approval-2'); expect(result.approvalRequestId).toBe('approval-2');



    // Submit rejection vote      // Submit rejection vote

    await submitApprovalVote('approval-2', 'admin-2', 'Admin Two', 'REJECT', 'Budget concerns'); await submitApprovalVote('approval-2', 'admin-2', 'Admin Two', 'REJECT', 'Budget concerns');



    // Verify allocation status would be updated to cancelled (this happens in the service)      // Verify allocation status would be updated to cancelled (this happens in the service)

    expect(updateDoc).toHaveBeenCalledWith(expect(updateDoc).toHaveBeenCalledWith(

        expect.any(Object), expect.any(Object),

        expect.objectContaining({
            expect.objectContaining({

                status: TimeAllocationStatus.CANCELLED, status: TimeAllocationStatus.CANCELLED,

                approvalStatus: AllocationApprovalStatus.REJECTED          approvalStatus: AllocationApprovalStatus.REJECTED

            })
        })

    );      );

    });    });

  });  });



describe('Time Slot Status Transitions', () => {
    describe('Time Slot Status Transitions', () => {

        it('should properly transition slot through all status states', async () => {
            it('should properly transition slot through all status states', async () => {

                const slotId = 'slot-transition-test'; const slotId = 'slot-transition-test';



                // Mock doc calls      // Mock doc calls

                (doc as any).mockReturnValue({ id: slotId }); (doc as any).mockReturnValue({ id: slotId });

                (updateDoc as any).mockResolvedValue(undefined); (updateDoc as any).mockResolvedValue(undefined);



                // Start work on slot      // Start work on slot

                await startTimeSlotWork(slotId); await startTimeSlotWork(slotId);

                expect(updateDoc).toHaveBeenCalledWith(expect(updateDoc).toHaveBeenCalledWith(

                    { id: slotId }, { id: slotId },

                    expect.objectContaining({ status: TimeSlotStatus.IN_PROGRESS })        expect.objectContaining({ status: TimeSlotStatus.IN_PROGRESS })

                );      );



            // Reset mock      // Reset mock

            vi.clearAllMocks(); vi.clearAllMocks();

            (doc as any).mockReturnValue({ id: slotId }); (doc as any).mockReturnValue({ id: slotId });

            (updateDoc as any).mockResolvedValue(undefined); (updateDoc as any).mockResolvedValue(undefined);



            // Complete slot      // Complete slot

            await completeTimeSlot(slotId); await completeTimeSlot(slotId);

            expect(updateDoc).toHaveBeenCalledWith(expect(updateDoc).toHaveBeenCalledWith(

                { id: slotId }, { id: slotId },

                expect.objectContaining({ status: TimeSlotStatus.COMPLETED })        expect.objectContaining({ status: TimeSlotStatus.COMPLETED })

            );      );

    });
});

  });  });



describe('Purchase History and Analytics', () => {
    describe('Purchase History and Analytics', () => {

        it('should retrieve purchase history with proper filtering', async () => {
            it('should retrieve purchase history with proper filtering', async () => {

                const mockPurchases = [      const mockPurchases = [

                    {        {

                        id: 'purchase-1', id: 'purchase-1',

                        data: () => ({
                            data: () => ({

                                slotId: 'slot-1', slotId: 'slot-1',

                                clientId: 'client-1', clientId: 'client-1',

                                clientName: 'Client One', clientName: 'Client One',

                                projectId: 'project-1', projectId: 'project-1',

                                freelancerId: 'freelancer-1', freelancerId: 'freelancer-1',

                                freelancerName: 'John Doe', freelancerName: 'John Doe',

                                amount: 300, amount: 300,

                                currency: 'USD', currency: 'USD',

                                status: 'COMPLETED', status: 'COMPLETED',

                                purchasedAt: { seconds: 1234567890, nanoseconds: 0 }            purchasedAt: { seconds: 1234567890, nanoseconds: 0 }

                            })
                        })

                    },        },

                {        {

                id: 'purchase-2', id: 'purchase-2',

                data: () => ({
                    data: () => ({

                        slotId: 'slot-2', slotId: 'slot-2',

                        clientId: 'client-1', clientId: 'client-1',

                        clientName: 'Client One', clientName: 'Client One',

                        projectId: 'project-2', projectId: 'project-2',

                        freelancerId: 'freelancer-2', freelancerId: 'freelancer-2',

                        freelancerName: 'Jane Smith', freelancerName: 'Jane Smith',

                        amount: 150, amount: 150,

                        currency: 'USD', currency: 'USD',

                        status: 'COMPLETED', status: 'COMPLETED',

                        purchasedAt: { seconds: 1234567890 + 3600, nanoseconds: 0 }            purchasedAt: { seconds: 1234567890 + 3600, nanoseconds: 0 }

                    })
                })

            }        }

      ];      ];



        (getDocs as any).mockResolvedValue({      (getDocs as any).mockResolvedValue({

            docs: mockPurchases, docs: mockPurchases,

            empty: false        empty: false

        });
    });



    // Get all purchases for client      // Get all purchases for client

    const clientPurchases = await getTimePurchases('client-1'); const clientPurchases = await getTimePurchases('client-1');

    expect(clientPurchases).toHaveLength(2); expect(clientPurchases).toHaveLength(2);

    expect(clientPurchases[0].amount).toBe(300); expect(clientPurchases[0].amount).toBe(300);

    expect(clientPurchases[1].amount).toBe(150); expect(clientPurchases[1].amount).toBe(150);



    // Get purchases for specific project      // Get purchases for specific project

    const projectPurchases = await getTimePurchases('client-1', 'project-1'); const projectPurchases = await getTimePurchases('client-1', 'project-1');

    expect(projectPurchases).toHaveLength(1); expect(projectPurchases).toHaveLength(1);

    expect(projectPurchases[0].projectId).toBe('project-1'); expect(projectPurchases[0].projectId).toBe('project-1');

});    });

  });  });

});}); </content>
    < parameter name = "filePath" > d: \a.7.1 - s\src\tests\integration\timeManagementWorkflow.integration.test.ts