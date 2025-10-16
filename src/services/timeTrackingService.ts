import {
    doc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { TimeLog, TimeTrackingReport } from '../types';

const TIME_LOGS_COLLECTION = 'timeLogs';

/**
 * Add a manual time log.
 */
export const addManualTimeLog = async (timeLogData: Omit<TimeLog, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const timeLogsCollectionRef = collection(db, TIME_LOGS_COLLECTION);
        const docRef = await addDoc(timeLogsCollectionRef, {
            ...timeLogData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding manual time log:', error);
        throw new Error('Failed to add manual time log');
    }
};

/**
 * Add an admin comment to a time log.
 */
export const addAdminCommentToTimeLog = async (timeLogId: string, adminComment: string): Promise<void> => {
    try {
        const timeLogDocRef = doc(db, TIME_LOGS_COLLECTION, timeLogId);
        await updateDoc(timeLogDocRef, {
            adminComment,
        });
    } catch (error) {
        console.error('Error adding admin comment to time log:', error);
        throw new Error('Failed to add admin comment to time log');
    }
};

/**
 * Generate a time tracking report.
 */
export const generateTimeTrackingReport = async (
    projectId: string,
    startDate: Date,
    endDate: Date
): Promise<TimeTrackingReport> => {
    try {
        const timeLogsCollectionRef = collection(db, TIME_LOGS_COLLECTION);
        const q = query(
            timeLogsCollectionRef,
            where('projectId', '==', projectId),
            where('startTime', '>=', startDate),
            where('startTime', '<=', endDate)
        );
        const querySnapshot = await getDocs(q);
        const timeLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));

        const totalMinutes = timeLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
        const totalHours = totalMinutes / 60;
        const totalEarnings = timeLogs.reduce((acc, log) => acc + (log.earnings || 0), 0);

        return {
            totalHours,
            totalEarnings,
            projectBreakdown: [{
                projectId,
                projectTitle: 'Current Project', // This should be fetched from project data
                hours: totalHours,
                earnings: totalEarnings
            }],
            period: {
                startDate,
                endDate
            }
        };
    } catch (error) {
        console.error('Error generating time tracking report:', error);
        throw new Error('Failed to generate time tracking report');
    }
};