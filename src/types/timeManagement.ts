// Time Management Module Types
export interface TimeAllocation {
    id: string;
    projectId: string;
    freelancerId: string;
    freelancerName: string;
    allocatedById: string; // Admin who allocated
    allocatedByName: string;
    allocatedHours: number; // Total hours allocated
    hourlyRate: number;
    startDate: Date;
    endDate: Date;
    status: TimeAllocationStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum TimeAllocationStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface TimeSlot {
    id: string;
    allocationId: string; // Reference to parent allocation
    projectId: string;
    freelancerId: string;
    freelancerName: string;
    startTime: Date;
    endTime: Date;
    durationHours: number; // Fixed 4-hour blocks
    hourlyRate: number;
    status: TimeSlotStatus;
    hoursUtilized?: number; // Hours actually worked/utilized
    purchasedById?: string; // Client who purchased
    purchasedByName?: string;
    purchaseId?: string; // Reference to purchase record
    createdAt: Date;
    updatedAt: Date;
}

export enum TimeSlotStatus {
    AVAILABLE = 'AVAILABLE', // Allocated but not purchased
    PURCHASED = 'PURCHASED', // Purchased by client
    IN_PROGRESS = 'IN_PROGRESS', // Freelancer working
    COMPLETED = 'COMPLETED', // Work completed
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED' // Added EXPIRED status
}

export interface TimePurchase {
    id: string;
    slotId: string;
    clientId: string;
    clientName: string;
    projectId: string;
    freelancerId: string;
    freelancerName: string;
    amount: number;
    currency: string;
    status: TimePurchaseStatus;
    paymentMethod?: string;
    transactionId?: string;
    purchasedAt: Date;
    notes?: string;
}

export enum TimePurchaseStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}