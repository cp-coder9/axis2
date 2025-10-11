import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase before any imports
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}), // Return unsubscribe function
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}));

import { TimerPersistenceAPI } from './TimerPersistenceAPI';

describe('TimerPersistenceAPI Basic Tests', () => {
  let api: TimerPersistenceAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new TimerPersistenceAPI();
  });

  it('should create an instance', () => {
    expect(api).toBeInstanceOf(TimerPersistenceAPI);
  });

  it('should have cleanup method', () => {
    expect(typeof api.cleanup).toBe('function');
    expect(() => api.cleanup()).not.toThrow();
  });

  it('should have event listener methods', () => {
    expect(typeof api.addEventListener).toBe('function');
    
    const handler = vi.fn();
    expect(() => api.addEventListener('sync', handler)).not.toThrow();
  });
});
