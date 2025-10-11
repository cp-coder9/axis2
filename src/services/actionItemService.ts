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
import { ActionItem, ActionItemCreationData } from '../types';

const PROJECTS_COLLECTION = 'projects';
const ACTION_ITEMS_COLLECTION = 'actionItems';

/**
 * Add an action item to a project.
 */
export const addActionItem = async (
    projectId: string,
    actionItemData: ActionItemCreationData
): Promise<string> => {
    try {
        const actionItemsCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, ACTION_ITEMS_COLLECTION);
        const docRef = await addDoc(actionItemsCollectionRef, {
            ...actionItemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding action item:', error);
        throw new Error('Failed to add action item');
    }
};

/**
 * Update an action item.
 */
export const updateActionItem = async (
    projectId: string,
    actionItemId: string,
    updates: Partial<ActionItem>
): Promise<void> => {
    try {
        const actionItemDocRef = doc(db, PROJECTS_COLLECTION, projectId, ACTION_ITEMS_COLLECTION, actionItemId);
        await updateDoc(actionItemDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating action item:', error);
        throw new Error('Failed to update action item');
    }
};

/**
 * Delete an action item.
 */
export const deleteActionItem = async (
    projectId: string,
    actionItemId: string
): Promise<void> => {
    try {
        const actionItemDocRef = doc(db, PROJECTS_COLLECTION, projectId, ACTION_ITEMS_COLLECTION, actionItemId);
        await deleteDoc(actionItemDocRef);
    } catch (error) {
        console.error('Error deleting action item:', error);
        throw new Error('Failed to delete action item');
    }
};

/**
 * Get all action items for a project.
 */
export const getActionItems = async (projectId: string): Promise<ActionItem[]> => {
    try {
        const actionItemsCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, ACTION_ITEMS_COLLECTION);
        const q = query(actionItemsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem));
    } catch (error) {
        console.error('Error getting action items:', error);
        throw new Error('Failed to get action items');
    }
};

/**
 * Subscribe to real-time updates for a project's action items.
 */
export const subscribeToActionItems = (
    projectId: string,
    callback: (actionItems: ActionItem[]) => void
): (() => void) => {
    const actionItemsCollectionRef = collection(db, PROJECTS_COLLECTION, projectId, ACTION_ITEMS_COLLECTION);
    const q = query(actionItemsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const actionItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem));
        callback(actionItems);
    }, (error) => {
        console.error('Error in action items subscription:', error);
        callback([]);
    });

    return unsubscribe;
};