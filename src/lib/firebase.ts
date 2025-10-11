// Firebase configuration for the migrated shadcn-ui project
// Mock Firebase services for development/testing

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase configuration
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || 'mock-app-id'
};

// Mock Firestore types and functions for TypeScript compatibility
export interface MockFirestore {
  type: 'firestore';
  app: any;
  toJSON: () => any;
}

export interface MockDocumentReference {
  id: string;
  path: string;
  parent: any;
  firestore: MockFirestore;
  converter: any;
  type: string;
  withConverter: any;
}

export interface MockCollectionReference {
  id: string;
  path: string;
  parent: any;
  firestore: MockFirestore;
  type: string;
  withConverter: any;
}

// Create mock Firestore instance that satisfies TypeScript requirements
const createMockFirestore = (): MockFirestore => ({
  type: 'firestore' as const,
  app: {},
  toJSON: () => ({})
});

// Initialize mock Firebase services
export const db = createMockFirestore();
export const auth = {};
export const storage = {};

console.log('Firebase configured for development/testing with project:', firebaseConfig.projectId);
