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
import { User, UserRole } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Get all clients.
 */
export const getClients = async (): Promise<User[]> => {
    try {
        const usersCollectionRef = collection(db, USERS_COLLECTION);
        const q = query(usersCollectionRef, where('role', '==', UserRole.CLIENT));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error('Error getting clients:', error);
        throw new Error('Failed to get clients');
    }
};

/**
 * Create a new client.
 */
export const createClient = async (clientData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const usersCollectionRef = collection(db, USERS_COLLECTION);
        const docRef = await addDoc(usersCollectionRef, {
            ...clientData,
            role: UserRole.CLIENT,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating client:', error);
        throw new Error('Failed to create client');
    }
};

/**
 * Update a client.
 */
export const updateClient = async (clientId: string, updates: Partial<User>): Promise<void> => {
    try {
        const clientDocRef = doc(db, USERS_COLLECTION, clientId);
        await updateDoc(clientDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating client:', error);
        throw new Error('Failed to update client');
    }
};

/**
 * Delete a client.
 */
export const deleteClient = async (clientId: string): Promise<void> => {
    try {
        const clientDocRef = doc(db, USERS_COLLECTION, clientId);
        await deleteDoc(clientDocRef);
    } catch (error) {
        console.error('Error deleting client:', error);
        throw new Error('Failed to delete client');
    }
};

/**
 * Subscribe to real-time updates for clients.
 */
export const subscribeToClients = (callback: (clients: User[]) => void): (() => void) => {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const q = query(usersCollectionRef, where('role', '==', UserRole.CLIENT), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(clients);
    }, (error) => {
        console.error('Error in clients subscription:', error);
        callback([]);
    });

    return unsubscribe;
};