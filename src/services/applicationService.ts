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
import { Application, ApplicationStatus } from '../types';

const APPLICATIONS_COLLECTION = 'applications';

/**
 * Apply to a project.
 */
export const applyToProject = async (applicationData: Omit<Application, 'id' | 'status' | 'createdAt'>): Promise<string> => {
    try {
        const applicationsCollectionRef = collection(db, APPLICATIONS_COLLECTION);
        const docRef = await addDoc(applicationsCollectionRef, {
            ...applicationData,
            status: ApplicationStatus.PENDING,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error applying to project:', error);
        throw new Error('Failed to apply to project');
    }
};

/**
 * Get all applications for a project.
 */
export const getProjectApplications = async (projectId: string): Promise<Application[]> => {
    try {
        const applicationsCollectionRef = collection(db, APPLICATIONS_COLLECTION);
        const q = query(applicationsCollectionRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    } catch (error) {
        console.error('Error getting project applications:', error);
        throw new Error('Failed to get project applications');
    }
};

/**
 * Accept an application.
 */
export const acceptApplication = async (applicationId: string): Promise<void> => {
    try {
        const applicationDocRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
        await updateDoc(applicationDocRef, {
            status: ApplicationStatus.ACCEPTED,
        });
    } catch (error) {
        console.error('Error accepting application:', error);
        throw new Error('Failed to accept application');
    }
};

/**
 * Reject an application.
 */
export const rejectApplication = async (applicationId: string): Promise<void> => {
    try {
        const applicationDocRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
        await updateDoc(applicationDocRef, {
            status: ApplicationStatus.REJECTED,
        });
    } catch (error) {
        console.error('Error rejecting application:', error);
        throw new Error('Failed to reject application');
    }
};

/**
 * Subscribe to real-time updates for a project's applications.
 */
export const subscribeToProjectApplications = (
    projectId: string,
    callback: (applications: Application[]) => void
): (() => void) => {
    const applicationsCollectionRef = collection(db, APPLICATIONS_COLLECTION);
    const q = query(applicationsCollectionRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const applications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        callback(applications);
    }, (error) => {
        console.error('Error in project applications subscription:', error);
        callback([]);
    });

    return unsubscribe;
};