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
import { ProjectFile, FilePermissions } from '../types';

const PROJECTS_COLLECTION = 'projects';
const FILES_COLLECTION = 'files';

/**
 * Add a file to a project.
 */
export const addFileToProject = async (
    projectId: string,
    fileData: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProjectFile> => {
    try {
        // In a real app, you would upload the file to a cloud storage (e.g., Firebase Storage) here
        // and get the download URL.
        const downloadURL = `https://fake-storage.com/${fileData.name}`;

        const filesCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, FILES_COLLECTION);
        const docRef = await addDoc(filesCollectionRef, {
            ...fileData,
            url: downloadURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, ...fileData, url: downloadURL, uploadedAt: Timestamp.now() };
    } catch (error) {
        console.error('Error adding file to project:', error);
        throw new Error('Failed to add file to project');
    }
};

/**
 * Update file permissions.
 */
export const updateFilePermissions = async (
    projectId: string,
    fileId: string,
    permissions: FilePermissions
): Promise<void> => {
    try {
        const fileDocRef = doc(db, PROJECTS_COLLECTION, projectId, FILES_COLLECTION, fileId);
        await updateDoc(fileDocRef, {
            permissions,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating file permissions:', error);
        throw new Error('Failed to update file permissions');
    }
};

/**
 * Delete a file from a project.
 */
export const deleteFileFromProject = async (
    projectId: string,
    fileId: string
): Promise<void> => {
    try {
        // In a real app, you would also delete the file from cloud storage.
        const fileDocRef = doc(db, PROJECTS_COLLECTION, projectId, FILES_COLLECTION, fileId);
        await deleteDoc(fileDocRef);
    } catch (error) {
        console.error('Error deleting file from project:', error);
        throw new Error('Failed to delete file from project');
    }
};

/**
 * Get all files for a project.
 */
export const getProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
    try {
        const filesCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, FILES_COLLECTION);
        const q = query(filesCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
    } catch (error) {
        console.error('Error getting project files:', error);
        throw new Error('Failed to get project files');
    }
};

/**
 * Subscribe to real-time updates for a project's files.
 */
export const subscribeToProjectFiles = (
    projectId: string,
    callback: (files: ProjectFile[]) => void
): (() => void) => {
    const filesCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, FILES_COLLECTION);
    const q = query(filesCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
        callback(files);
    }, (error) => {
        console.error('Error in project files subscription:', error);
        callback([]);
    });

    return unsubscribe;
};