/**
 * Timer Persistence System
 * Task 5.2: Timer state storage and synchronization
 */

import { Timestamp } from 'firebase/firestore';

export interface TimerState {
  jobCardId: string;
  jobCardTitle: string;
  projectId: string;
  startTime: number;
  pausedTime: number;
  pauseCount: number;
  allocatedHours?: number;
  status: 'running' | 'paused' | 'stopped';
  lastUpdated: number;
}

export interface TimerSession {
  id: string;
  userId: string;
  timerState: TimerState;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
}

export class TimerPersistence {
  private static readonly STORAGE_KEY = 'architex_timer_state';
  private static readonly SESSION_KEY = 'architex_timer_session';
  private static readonly MAX_SESSIONS = 10;

  /**
   * Save timer state to localStorage
   */
  static saveTimerState(state: TimerState): void {
    try {
      const stateWithTimestamp = {
        ...state,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }

  /**
   * Load timer state from localStorage
   */
  static loadTimerState(): TimerState | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored) as TimerState;
      
      // Check if state is stale (older than 24 hours)
      const age = Date.now() - state.lastUpdated;
      if (age > 24 * 60 * 60 * 1000) {
        this.clearTimerState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to load timer state:', error);
      return null;
    }
  }

  /**
   * Clear timer state from localStorage
   */
  static clearTimerState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear timer state:', error);
    }
  }

  /**
   * Save timer session
   */
  static saveTimerSession(userId: string, timerState: TimerState): void {
    try {
      const session: TimerSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timerState,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: this.getDeviceId(),
      };

      const sessions = this.loadTimerSessions(userId);
      sessions.unshift(session);

      // Keep only the most recent sessions
      const trimmedSessions = sessions.slice(0, this.MAX_SESSIONS);

      localStorage.setItem(
        `${this.SESSION_KEY}_${userId}`,
        JSON.stringify(trimmedSessions)
      );
    } catch (error) {
      console.error('Failed to save timer session:', error);
    }
  }

  /**
   * Load timer sessions for a user
   */
  static loadTimerSessions(userId: string): TimerSession[] {
    try {
      const stored = localStorage.getItem(`${this.SESSION_KEY}_${userId}`);
      if (!stored) return [];

      return JSON.parse(stored) as TimerSession[];
    } catch (error) {
      console.error('Failed to load timer sessions:', error);
      return [];
    }
  }

  /**
   * Get the most recent timer session
   */
  static getLastSession(userId: string): TimerSession | null {
    const sessions = this.loadTimerSessions(userId);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Clear all timer sessions for a user
   */
  static clearTimerSessions(userId: string): void {
    try {
      localStorage.removeItem(`${this.SESSION_KEY}_${userId}`);
    } catch (error) {
      console.error('Failed to clear timer sessions:', error);
    }
  }

  /**
   * Get or create device ID
   */
  private static getDeviceId(): string {
    const key = 'architex_device_id';
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, deviceId);
    }

    return deviceId;
  }

  /**
   * Check if timer state needs recovery
   */
  static needsRecovery(): boolean {
    const state = this.loadTimerState();
    if (!state) return false;

    // Check if timer was running or paused
    return state.status === 'running' || state.status === 'paused';
  }

  /**
   * Calculate elapsed time from saved state
   */
  static calculateElapsedTime(state: TimerState): number {
    if (state.status === 'paused') {
      return state.pausedTime;
    }

    const now = Date.now();
    const elapsed = now - state.startTime;
    return elapsed + state.pausedTime;
  }

  /**
   * Backup timer state to IndexedDB (for more reliable storage)
   */
  static async backupToIndexedDB(state: TimerState): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['timerStates'], 'readwrite');
      const store = transaction.objectStore('timerStates');

      const request = store.put({
        id: 'current',
        state,
        timestamp: Date.now(),
      });

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to backup to IndexedDB:', error);
    }
  }

  /**
   * Restore timer state from IndexedDB
   */
  static async restoreFromIndexedDB(): Promise<TimerState | null> {
    if (!('indexedDB' in window)) {
      return null;
    }

    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['timerStates'], 'readonly');
      const store = transaction.objectStore('timerStates');

      const request = store.get('current');

      return new Promise<TimerState | null>((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          if (!data) {
            resolve(null);
            return;
          }

          // Check if backup is stale
          const age = Date.now() - data.timestamp;
          if (age > 24 * 60 * 60 * 1000) {
            resolve(null);
            return;
          }

          resolve(data.state);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to restore from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Open IndexedDB database
   */
  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ArchitexTimerDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('timerStates')) {
          db.createObjectStore('timerStates', { keyPath: 'id' });
        }
      };
    });
  }
}
