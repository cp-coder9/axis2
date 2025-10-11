import {
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
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
import { ProjectRequest, ProjectRequestStatus } from '../types';

const PROJECT_REQUESTS_COLLECTION = 'projectRequests';

/**
 * Create a new project request.
 */
export const createProjectRequest = async (projectRequestData: Omit<ProjectRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const projectRequestsCollectionRef = collection(db, PROJECT_REQUESTS_COLLECTION);
        const docRef = await addDoc(projectRequestsCollectionRef, {
            ...projectRequestData,
            status: ProjectRequestStatus.PENDING,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating project request:', error);
        throw new Error('Failed to create project request');
    }
};

/**
 * Update a project request.
 */
export const updateProjectRequest = async (projectRequestId: string, updates: Partial<ProjectRequest>): Promise<void> => {
    try {
        const projectRequestDocRef = doc(db, PROJECT_REQUESTS_COLLECTION, projectRequestId);
        await updateDoc(projectRequestDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating project request:', error);
        throw new Error('Failed to update project request');
    }
};

/**
 * Delete a project request.
 */
export const deleteProjectRequest = async (projectRequestId: string): Promise<void> => {
    try {
        const projectRequestDocRef = doc(db, PROJECT_REQUESTS_COLLECTION, projectRequestId);
        await deleteDoc(projectRequestDocRef);
    } catch (error) {
        console.error('Error deleting project request:', error);
        throw new Error('Failed to delete project request');
    }
};

/**
 * Get all project requests.
 */
export const getProjectRequests = async (): Promise<ProjectRequest[]> => {
    try {
        const projectRequestsCollectionRef = collection(db, PROJECT_REQUESTS_COLLECTION);
        const q = query(projectRequestsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectRequest));
    } catch (error) {
        console.error('Error getting project requests:', error);
        throw new Error('Failed to get project requests');
    }
};

/**
 * Subscribe to real-time updates for project requests.
 */
export const subscribeToProjectRequests = (callback: (projectRequests: ProjectRequest[]) => void): (() => void) => {
    const projectRequestsCollectionRef = collection(db, PROJECT_REQUESTS_COLLECTION);
    const q = query(projectRequestsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectRequest));
        callback(projectRequests);
    }, (error) => {
        console.error('Error in project requests subscription:', error);
        callback([]);
    });

    return unsubscribe;
};