import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { AllocationApprovalRequest, AllocationApprovalStatus, ApprovalVote, TimeAllocation, TimeAllocationStatus } from '../types';

const APPROVAL_REQUESTS_COLLECTION = 'allocationApprovalRequests';

/**
 * Create an approval request for a large time allocation
 */
export const createApprovalRequest = async (
    allocationData: Omit<TimeAllocation, 'id' | 'createdAt' | 'updatedAt'>,
    reason: string,
    requiredApprovals: number = 2
): Promise<string> => {
    try {
        const approvalRequestsCollectionRef = collection(db, APPROVAL_REQUESTS_COLLECTION);

        const totalValue = allocationData.allocatedHours * allocationData.hourlyRate;

        const approvalRequestData = {
            allocationId: '', // Will be set after allocation is created
            projectId: allocationData.projectId,
            projectTitle: '', // Will be populated from project data
            freelancerId: allocationData.freelancerId,
            freelancerName: allocationData.freelancerName,
            requestedById: allocationData.allocatedById,
            requestedByName: allocationData.allocatedByName,
            allocatedHours: allocationData.allocatedHours,
            hourlyRate: allocationData.hourlyRate,
            totalValue,
            reason,
            status: AllocationApprovalStatus.PENDING,
            approvals: [],
            requiredApprovals,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
        };

        const docRef = await addDoc(approvalRequestsCollectionRef, approvalRequestData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating approval request:', error);
        throw new Error('Failed to create approval request');
    }
};

/**
 * Get approval requests with optional filtering
 */
export const getApprovalRequests = async (
    status?: AllocationApprovalStatus,
    adminId?: string
): Promise<AllocationApprovalRequest[]> => {
    try {
        const approvalRequestsCollectionRef = collection(db, APPROVAL_REQUESTS_COLLECTION);
        let q = query(approvalRequestsCollectionRef, orderBy('createdAt', 'desc'));

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const querySnapshot = await getDocs(q);
        let requests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AllocationApprovalRequest));

        // If adminId is provided, filter to only show requests where the admin hasn't voted yet
        // or requests they created
        if (adminId) {
            requests = requests.filter(request =>
                request.requestedById === adminId ||
                !request.approvals.some(vote => vote.adminId === adminId)
            );
        }

        return requests;
    } catch (error) {
        console.error('Error getting approval requests:', error);
        throw new Error('Failed to get approval requests');
    }
};

/**
 * Submit an approval vote for an allocation request
 */
export const submitApprovalVote = async (
    requestId: string,
    adminId: string,
    adminName: string,
    decision: 'APPROVE' | 'REJECT' | 'ESCALATE',
    comments?: string
): Promise<void> => {
    try {
        const requestDocRef = doc(db, APPROVAL_REQUESTS_COLLECTION, requestId);
        const requestDoc = await getDoc(requestDocRef);

        if (!requestDoc.exists()) {
            throw new Error('Approval request not found');
        }

        const requestData = requestDoc.data() as AllocationApprovalRequest;

        // Check if admin has already voted
        const existingVote = requestData.approvals.find(vote => vote.adminId === adminId);
        if (existingVote) {
            throw new Error('Admin has already voted on this request');
        }

        // Add the vote
        const newVote: ApprovalVote = {
            adminId,
            adminName,
            decision,
            comments,
            votedAt: Timestamp.now()
        };

        const updatedApprovals = [...requestData.approvals, newVote];
        const approvedCount = updatedApprovals.filter(vote => vote.decision === 'APPROVE').length;
        const rejectedCount = updatedApprovals.filter(vote => vote.decision === 'REJECT').length;

        let newStatus = requestData.status;

        // Determine new status based on votes
        if (approvedCount >= requestData.requiredApprovals) {
            newStatus = AllocationApprovalStatus.APPROVED;
        } else if (rejectedCount > 0) {
            newStatus = AllocationApprovalStatus.REJECTED;
        } else if (updatedApprovals.some(vote => vote.decision === 'ESCALATE')) {
            newStatus = AllocationApprovalStatus.ESCALATED;
        }

        // Update the approval request
        await updateDoc(requestDocRef, {
            approvals: updatedApprovals,
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        // If approved, update the allocation status
        if (newStatus === AllocationApprovalStatus.APPROVED && requestData.allocationId) {
            const allocationDocRef = doc(db, 'timeAllocations', requestData.allocationId);
            await updateDoc(allocationDocRef, {
                status: TimeAllocationStatus.ACTIVE,
                approvalStatus: AllocationApprovalStatus.APPROVED,
                updatedAt: serverTimestamp()
            });
        }

        // If rejected, update the allocation status
        if (newStatus === AllocationApprovalStatus.REJECTED && requestData.allocationId) {
            const allocationDocRef = doc(db, 'timeAllocations', requestData.allocationId);
            await updateDoc(allocationDocRef, {
                status: TimeAllocationStatus.CANCELLED,
                approvalStatus: AllocationApprovalStatus.REJECTED,
                updatedAt: serverTimestamp()
            });
        }

    } catch (error) {
        console.error('Error submitting approval vote:', error);
        throw new Error('Failed to submit approval vote');
    }
};

/**
 * Get approval request by ID
 */
export const getApprovalRequestById = async (requestId: string): Promise<AllocationApprovalRequest | null> => {
    try {
        const requestDocRef = doc(db, APPROVAL_REQUESTS_COLLECTION, requestId);
        const requestDoc = await getDoc(requestDocRef);

        if (!requestDoc.exists()) {
            return null;
        }

        return {
            id: requestDoc.id,
            ...requestDoc.data()
        } as AllocationApprovalRequest;
    } catch (error) {
        console.error('Error getting approval request:', error);
        throw new Error('Failed to get approval request');
    }
};

/**
 * Update approval request status
 */
export const updateApprovalRequestStatus = async (
    requestId: string,
    status: AllocationApprovalStatus
): Promise<void> => {
    try {
        const requestDocRef = doc(db, APPROVAL_REQUESTS_COLLECTION, requestId);
        await updateDoc(requestDocRef, {
            status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating approval request status:', error);
        throw new Error('Failed to update approval request status');
    }
};

/**
 * Delete an approval request
 */
export const deleteApprovalRequest = async (requestId: string): Promise<void> => {
    try {
        const requestDocRef = doc(db, APPROVAL_REQUESTS_COLLECTION, requestId);
        await deleteDoc(requestDocRef);
    } catch (error) {
        console.error('Error deleting approval request:', error);
        throw new Error('Failed to delete approval request');
    }
};

/**
 * Check if an allocation requires approval based on configured thresholds
 */
export const checkAllocationRequiresApproval = (allocatedHours: number, thresholdHours: number = 50): boolean => {
    return allocatedHours >= thresholdHours;
};