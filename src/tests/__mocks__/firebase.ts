/**
 * Mock Implementations for Firebase Services
 * Provides comprehensive mocks for Firebase Auth, Firestore, and Storage
 */

import { vi } from 'vitest'

// Mock Firebase Auth User
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@architexaxis.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  role: 'FREELANCER' as const,
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  delete: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn().mockResolvedValue(undefined),
}

// Mock Firebase Auth
export const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  signOut: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}

// Mock Firestore Document
export const mockDoc = {
  id: 'test-doc-id',
  data: vi.fn().mockReturnValue({}),
  exists: vi.fn().mockReturnValue(true),
  ref: { id: 'test-doc-id' },
}

// Mock Firestore Document Reference
export const mockDocRef = {
  id: 'test-doc-id',
  get: vi.fn().mockResolvedValue(mockDoc),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
}

// Mock Firestore Query Snapshot
export const mockQuerySnapshot = {
  docs: [mockDoc],
  empty: false,
  size: 1,
  forEach: vi.fn((callback) => [mockDoc].forEach(callback)),
}

// Mock Firestore Collection Reference
export const mockCollectionRef = {
  add: vi.fn().mockResolvedValue(mockDoc),
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue(mockQuerySnapshot),
  onSnapshot: vi.fn(),
}

// Set up circular reference after both are defined
mockDocRef.collection = vi.fn().mockReturnValue(mockCollectionRef)

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
  doc: vi.fn().mockReturnValue(mockDocRef),
  runTransaction: vi.fn().mockResolvedValue(undefined),
  batch: vi.fn().mockReturnValue({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
  enableNetwork: vi.fn().mockResolvedValue(undefined),
  disableNetwork: vi.fn().mockResolvedValue(undefined),
  // Additional Firestore methods for timer persistence
  getDoc: vi.fn().mockResolvedValue(mockDoc),
  getDocs: vi.fn().mockResolvedValue(mockQuerySnapshot),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(),
}

// Mock Firebase Storage
export const mockStorageRef = {
  put: vi.fn().mockResolvedValue({
    ref: null, // Will be set after creation
    metadata: { name: 'test-file.jpg', size: 1024 },
  }),
  getDownloadURL: vi.fn().mockResolvedValue('https://example.com/test-file.jpg'),
  delete: vi.fn().mockResolvedValue(undefined),
  child: vi.fn().mockReturnThis(),
}

// Set up circular reference after creation
mockStorageRef.put = vi.fn().mockResolvedValue({
  ref: mockStorageRef,
  metadata: { name: 'test-file.jpg', size: 1024 },
})

export const mockStorage = {
  ref: vi.fn().mockReturnValue(mockStorageRef),
}

// Mock Firebase App
export const mockFirebaseApp = {
  name: 'test-app',
  options: {},
}

// Comprehensive Firebase Mock
export const mockFirebase = {
  app: mockFirebaseApp,
  auth: mockAuth,
  firestore: mockFirestore,
  storage: mockStorage,
}

// Mock Firebase Admin (for server-side operations)
export const mockAdmin = {
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-123' }),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
  }),
  firestore: () => mockFirestore,
  storage: () => mockStorage,
}

// Mock Firebase Functions
export const mockFunctions = {
  httpsCallable: vi.fn().mockReturnValue(
    vi.fn().mockResolvedValue({ data: 'mock-function-result' })
  ),
}

// Mock Firebase Analytics
export const mockAnalytics = {
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
}

// Firebase Error Mocks
export const mockFirebaseError = {
  code: 'auth/user-not-found',
  message: 'There is no user record corresponding to this identifier.',
  name: 'FirebaseError',
}

// Mock Firebase Firestore exports that tests expect
export const writeBatch = vi.fn().mockReturnValue({
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
})

export const getDoc = vi.fn().mockResolvedValue(mockDoc)
export const getDocs = vi.fn().mockResolvedValue(mockQuerySnapshot)
export const setDoc = vi.fn().mockResolvedValue(undefined)
export const updateDoc = vi.fn().mockResolvedValue(undefined)
export const deleteDoc = vi.fn().mockResolvedValue(undefined)
export const onSnapshot = vi.fn()
export const doc = vi.fn().mockReturnValue(mockDocRef)
export const collection = vi.fn().mockReturnValue(mockCollectionRef)

// Export all mocks as default
export default {
  mockUser,
  mockAuth,
  mockFirestore,
  mockStorage,
  mockFirebase,
  mockAdmin,
  mockFunctions,
  mockAnalytics,
  mockFirebaseError,
}