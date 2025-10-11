import {
    collection,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLog } from '../types';

const AUDIT_LOGS_COLLECTION = 'auditLogs';

/**
 * Log an audit event.
 */
export const logAuditEvent = async (logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> => {
    try {
        const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
        const docRef = await addDoc(auditLogsCollectionRef, {
            ...logData,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error logging audit event:', error);
        throw new Error('Failed to log audit event');
    }
};

/**
 * Load the audit module.
 */
export const loadAuditModule = async (): Promise<any> => {
    // In a real app, this might dynamically load a larger audit module/library.
    // For now, it just returns an object with the logging function.
    return {
        log: logAuditEvent,
    };
};