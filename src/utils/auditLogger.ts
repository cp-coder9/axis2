// Audit logging utilities for timer actions
import { doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, AuditAction } from '../types';

export { AuditAction } from '../types';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 * @param user - The user performing the action
 * @param action - The action being performed
 * @param details - Additional details about the action
 * @returns Promise<void>
 */
export const logAuditEvent = async (
  user: User,
  action: AuditAction,
  details: Record<string, any> = {}
): Promise<void> => {
  try {
    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType: details.resourceType || 'timer',
      resourceId: details.resourceId || details.projectId || details.jobCardId || 'unknown',
      details: {
        ...details,
        timestamp: Date.now()
      },
      timestamp: Timestamp.now(),
      // Add browser info if available
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    // Generate a unique ID for the audit log entry
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to Firestore audit collection
    await setDoc(doc(collection(db, 'auditLogs'), auditId), {
      id: auditId,
      ...auditEntry
    });

    console.log(`Audit logged: ${action} by ${user.name}`, details);
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw the error to avoid breaking the main operation
  }
};

/**
 * Log a timer-specific audit event with common timer details
 * @param user - The user performing the action
 * @param action - The timer action being performed
 * @param projectId - The project ID
 * @param jobCardId - The job card ID
 * @param additionalDetails - Additional details specific to the action
 * @returns Promise<void>
 */
export const logTimerAuditEvent = async (
  user: User,
  action: AuditAction,
  projectId: string,
  jobCardId: string,
  additionalDetails: Record<string, any> = {}
): Promise<void> => {
  const details = {
    resourceType: 'timer',
    projectId,
    jobCardId,
    ...additionalDetails
  };

  await logAuditEvent(user, action, details);
};

/**
 * Log a security-related audit event
 * @param user - The user performing the action
 * @param action - The security action
 * @param details - Security-specific details
 * @returns Promise<void>
 */
export const logSecurityAuditEvent = async (
  user: User,
  action: AuditAction,
  details: Record<string, any> = {}
): Promise<void> => {
  const securityDetails = {
    resourceType: 'security',
    severity: 'high',
    ...details
  };

  await logAuditEvent(user, action, securityDetails);
};