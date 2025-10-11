// Mock Firebase Firestore functions for development/testing
// This file provides TypeScript-compatible mocks for Firebase Firestore operations

export interface MockDocumentData {
  [key: string]: any;
}

export interface MockDocumentReference {
  id: string;
  path: string;
  parent: any;
  firestore: any;
  converter: any;
  type: string;
  withConverter: any;
}

export interface MockCollectionReference {
  id: string;
  path: string;
  parent: any;
  firestore: any;
  type: string;
  withConverter: any;
}

export interface MockQuerySnapshot {
  docs: MockDocumentSnapshot[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: MockDocumentSnapshot) => void) => void;
}

export interface MockDocumentSnapshot {
  id: string;
  ref: MockDocumentReference;
  exists: () => boolean;
  data: () => MockDocumentData | undefined;
}

// Mock Firestore functions
export const doc = (firestore: any, path: string, ...pathSegments: string[]): MockDocumentReference => {
  const fullPath = [path, ...pathSegments].join('/');
  return {
    id: pathSegments[pathSegments.length - 1] || path,
    path: fullPath,
    parent: null,
    firestore,
    converter: null,
    type: 'document',
    withConverter: () => ({})
  };
};

export const collection = (firestore: any, path: string, ...pathSegments: string[]): MockCollectionReference => {
  const fullPath = [path, ...pathSegments].join('/');
  return {
    id: pathSegments[pathSegments.length - 1] || path,
    path: fullPath,
    parent: null,
    firestore,
    type: 'collection',
    withConverter: () => ({})
  };
};

export const setDoc = async (docRef: MockDocumentReference, data: MockDocumentData): Promise<void> => {
  console.log('Mock setDoc called for:', docRef.path, data);
  // Mock implementation - in real app this would write to Firestore
  return Promise.resolve();
};

export const getDoc = async (docRef: MockDocumentReference): Promise<MockDocumentSnapshot> => {
  console.log('Mock getDoc called for:', docRef.path);
  // Mock implementation - in real app this would read from Firestore
  return {
    id: docRef.id,
    ref: docRef,
    exists: () => false,
    data: () => undefined
  };
};

export const updateDoc = async (docRef: MockDocumentReference, data: Partial<MockDocumentData>): Promise<void> => {
  console.log('Mock updateDoc called for:', docRef.path, data);
  // Mock implementation - in real app this would update Firestore document
  return Promise.resolve();
};

export const onSnapshot = (
  docRef: MockDocumentReference | MockCollectionReference,
  callback: (snapshot: MockDocumentSnapshot) => void,
  onError?: (error: any) => void
): (() => void) => {
  console.log('Mock onSnapshot called for:', docRef.path);
  // Mock implementation - in real app this would listen to Firestore changes
  // Simulate initial callback with empty document
  setTimeout(() => {
    const mockSnapshot: MockDocumentSnapshot = {
      id: 'id' in docRef ? docRef.id : 'mock-id',
      ref: docRef as MockDocumentReference,
      exists: () => false,
      data: () => undefined
    };
    try {
      callback(mockSnapshot);
    } catch (error) {
      onError?.(error);
    }
  }, 100);
  
  // Return unsubscribe function
  return () => {
    console.log('Mock onSnapshot unsubscribed for:', docRef.path);
  };
};

export const serverTimestamp = (): any => {
  console.log('Mock serverTimestamp called');
  // Mock implementation - in real app this would return Firebase server timestamp
  return new Date();
};

export const writeBatch = (_firestore: any): any => {
  console.log('Mock writeBatch called');
  // Mock implementation - in real app this would return Firebase batch writer
  return {
    set: (docRef: MockDocumentReference, data: MockDocumentData) => {
      console.log('Mock batch.set called for:', docRef.path, data);
    },
    update: (docRef: MockDocumentReference, data: Partial<MockDocumentData>) => {
      console.log('Mock batch.update called for:', docRef.path, data);
    },
    delete: (docRef: MockDocumentReference) => {
      console.log('Mock batch.delete called for:', docRef.path);
    },
    commit: async () => {
      console.log('Mock batch.commit called');
      return Promise.resolve();
    }
  };
};

export const query = (collectionRef: MockCollectionReference, ...constraints: any[]): any => {
  console.log('Mock query called for:', collectionRef.path, constraints);
  // Mock implementation - in real app this would create Firestore query
  return {
    ...collectionRef,
    constraints
  };
};

export const where = (field: string, operator: any, value: any): any => {
  console.log('Mock where called:', field, operator, value);
  // Mock implementation - in real app this would create Firestore where constraint
  return { type: 'where', field, operator, value };
};

export const orderBy = (field: string, direction?: 'asc' | 'desc'): any => {
  console.log('Mock orderBy called:', field, direction);
  // Mock implementation - in real app this would create Firestore orderBy constraint
  return { type: 'orderBy', field, direction };
};

export const limit = (count: number): any => {
  console.log('Mock limit called:', count);
  // Mock implementation - in real app this would create Firestore limit constraint
  return { type: 'limit', count };
};
