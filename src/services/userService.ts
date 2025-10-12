import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole } from '../types';

/**
 * Firebase User Service
 * Handles all user-related Firestore operations
 */

// Collection reference
const USERS_COLLECTION = 'users';

/**
 * Get user data from Firestore by user ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
        lastActive: userData.lastActive || serverTimestamp(),
      } as User;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      throw new Error('Unable to fetch user data while offline. Please check your internet connection.');
    }
    
    throw new Error('Failed to fetch user data');
  }
};

/**
 * Get user data from Firestore by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
        lastActive: userData.lastActive || serverTimestamp(),
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user data');
  }
};

/**
 * Create a new user document in Firestore
 */
export const createUserDocument = async (
  userId: string, 
  userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>
): Promise<User> => {
  try {
    const now = serverTimestamp();
    const newUser: Omit<User, 'id'> = {
      ...userData,
      createdAt: now as Timestamp,
      lastActive: now as Timestamp,
      onboardingCompleted: false,
      accountStatus: 'active'
    };

    await setDoc(doc(db, USERS_COLLECTION, userId), newUser);
    
    return {
      id: userId,
      ...newUser,
      createdAt: now as Timestamp,
      lastActive: now as Timestamp,
    };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user document');
  }
};

/**
 * Update user document in Firestore
 */
export const updateUserDocument = async (
  userId: string, 
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      lastActive: serverTimestamp(),
    };

    await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
  } catch (error) {
    console.error('Error updating user document:', error);
    throw new Error('Failed to update user document');
  }
};

// Alias for backward compatibility
export const updateUser = updateUserDocument;

/**
 * Update user's last active timestamp
 */
export const updateUserLastActive = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user last active:', error);
    // Don't throw error for this non-critical operation
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
        lastActive: userData.lastActive || serverTimestamp(),
      } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('role', '==', role)
    );
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
        lastActive: userData.lastActive || serverTimestamp(),
      } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw new Error('Failed to fetch users by role');
  }
};

/**
 * Check if user exists in Firestore
 */
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

/**
 * Create user from Firebase Auth user (for first-time login)
 */
export const createUserFromFirebaseAuth = async (
  firebaseUser: any,
  role: UserRole,
  additionalData?: Partial<User>
): Promise<User> => {
  const userData: Omit<User, 'id' | 'createdAt' | 'lastActive'> = {
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    role,
    title: role === UserRole.ADMIN ? 'Administrator' : 
           role === UserRole.CLIENT ? 'Client' : 'Freelancer',
    hourlyRate: role === UserRole.FREELANCER ? 75 : 0,
    phone: firebaseUser.phoneNumber || '',
    company: role === UserRole.CLIENT ? 'Client Company' : 'Architex Axis',
    avatarUrl: firebaseUser.photoURL || '',
    onboardingCompleted: false,
    accountStatus: 'active',
    ...additionalData
  };

  return await createUserDocument(firebaseUser.uid, userData);
};