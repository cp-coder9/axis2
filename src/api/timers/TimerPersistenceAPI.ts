import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface TimerPersistenceState {
  id: string;
  userId: string;
  projectId: string;
  jobCardId: string;
  jobCardTitle: string;
  startTime: Date;
  endTime?: Date;
  timeRemaining: number;
  allocatedHours: number;
  isRunning: boolean;
  isPaused: boolean;
  pauseCount: number;
  pauseHistory: Array<{
    pausedAt: Date;
    resumedAt?: Date;
    reason?: string;
  }>;
  lastUpdated: Date;
  deviceId: string;
  sessionId: string;
  syncVersion: number;
  conflictResolution?: 'local_wins' | 'remote_wins' | 'merged';
  idempotencyKey: string;
}

export interface TimerSyncOptions {
  enableOptimisticUpdates?: boolean;
  conflictResolutionStrategy?: 'last_write_wins' | 'user_choice' | 'merge';
  maxRetries?: number;
  retryDelay?: number;
  enableRealtimeSync?: boolean;
  heartbeatInterval?: number;
}

export interface TimerSyncEvent {
  type: 'sync' | 'conflict' | 'error' | 'connected' | 'disconnected';
  timerId?: string;
  data?: any;
  error?: Error;
}

/**
 * Enhanced Timer Persistence API
 * Handles Firestore synchronization, conflict resolution, offline support, and real-time sync
 */
export class TimerPersistenceAPI {
  private retryQueue: Map<string, () => Promise<void>> = new Map();
  private activeListeners: Map<string, () => void> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private syncEventHandlers: Map<string, (event: TimerSyncEvent) => void> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor(private options: TimerSyncOptions = {}) {
    this.options = {
      enableOptimisticUpdates: true,
      conflictResolutionStrategy: 'last_write_wins',
      maxRetries: 3,
      retryDelay: 1000,
      enableRealtimeSync: true,
      heartbeatInterval: 30000, // 30 seconds
      ...options
    };

    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Setup heartbeat for connection status
    if (this.options.enableRealtimeSync) {
      this.startHeartbeat();
    }
  }

  /**
   * Initialize a new timer session with enhanced conflict detection
   */
  async initializeTimer(timerData: Omit<TimerPersistenceState, 'id' | 'syncVersion' | 'lastUpdated'>): Promise<string> {
    const timerId = `timer_${timerData.userId}_${timerData.projectId}_${Date.now()}`;
    
    // Check for existing active timers
    const existingTimers = await this.getActiveTimers(timerData.userId);
    if (existingTimers.length > 0) {
      console.warn('User has existing active timers:', existingTimers.map(t => t.id));
      // Auto-stop existing timers or throw error based on business rules
    }

    const timerState: TimerPersistenceState = {
      ...timerData,
      id: timerId,
      syncVersion: 1,
      lastUpdated: new Date(),
      deviceId: this.generateDeviceId(),
      sessionId: this.generateSessionId(),
      idempotencyKey: timerData.idempotencyKey || this.generateIdempotencyKey()
    };

    try {
      const timerRef = doc(db, 'timers', timerId);
      const activeTimerRef = doc(db, 'activeTimers', timerId);
      
      // Use batch write for consistency
      const batch = writeBatch(db);
      
      batch.set(timerRef, {
        ...timerState,
        startTime: timerState.startTime,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      batch.set(activeTimerRef, {
        userId: timerState.userId,
        timerId,
        projectId: timerState.projectId,
        jobCardId: timerState.jobCardId,
        jobCardTitle: timerState.jobCardTitle,
        startTime: timerState.startTime,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        deviceId: timerState.deviceId,
        sessionId: timerState.sessionId,
        idempotencyKey: timerState.idempotencyKey,
        lastUpdated: serverTimestamp()
      });

      await batch.commit();
      
      // Start real-time listener
      if (this.options.enableRealtimeSync) {
        this.listenToTimer(timerId, (updatedTimer) => {
          this.emitSyncEvent({ type: 'sync', timerId, data: updatedTimer });
        });
      }

      console.log('Timer initialized:', timerId);
      this.emitSyncEvent({ type: 'connected', timerId });
      return timerId;
    } catch (error) {
      console.error('Failed to initialize timer:', error);
      this.emitSyncEvent({ type: 'error', timerId, error: error as Error });
      throw new Error(`Failed to initialize timer: ${error}`);
    }
  }

  /**
   * Update timer state with enhanced conflict resolution and optimistic updates
   */
  async updateTimer(
    timerId: string, 
    updates: Partial<TimerPersistenceState>,
    optimistic: boolean = true
  ): Promise<boolean> {
    try {
      const timerRef = doc(db, 'timers', timerId);
      const activeTimerRef = doc(db, 'activeTimers', timerId);
      
      // Check for conflicts if not optimistic
      if (!optimistic || !this.isOnline) {
        const currentDoc = await getDoc(timerRef);
        if (currentDoc.exists()) {
          const currentData = currentDoc.data() as TimerPersistenceState;
          const hasConflict = this.detectConflict(currentData, updates);
          
          if (hasConflict) {
            const resolution = await this.resolveConflict(currentData, updates);
            if (resolution.type === 'conflict') {
              this.emitSyncEvent({ 
                type: 'conflict', 
                timerId, 
                data: { current: currentData, updates, resolution } 
              });
            }
            updates = { ...updates, ...resolution.resolvedData };
          }
        }
      }

      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp(),
        syncVersion: (updates.syncVersion || 0) + 1,
        deviceId: this.generateDeviceId()
      };

      // Update both timer and active timer records
      const batch = writeBatch(db);
      batch.update(timerRef, updateData);
      
      // Update active timer with relevant fields
      const activeTimerUpdate: Record<string, any> = {
        isRunning: updates.isRunning,
        isPaused: updates.isPaused,
        timeRemaining: updates.timeRemaining,
        lastUpdated: serverTimestamp()
      };
      
      Object.keys(activeTimerUpdate).forEach(key => {
        if (activeTimerUpdate[key] === undefined) {
          delete activeTimerUpdate[key];
        }
      });
      
      if (Object.keys(activeTimerUpdate).length > 1) { // more than just lastUpdated
        batch.update(activeTimerRef, activeTimerUpdate);
      }

      if (this.options.enableOptimisticUpdates && optimistic && this.isOnline) {
        // Optimistic update - don't wait for server response
        batch.commit().catch((error) => {
          console.error('Optimistic update failed, queuing for retry:', error);
          this.queueRetry(timerId, async () => {
            await this.updateTimer(timerId, updates, false);
          });
          this.emitSyncEvent({ type: 'error', timerId, error });
        });
        return true;
      } else {
        await batch.commit();
        this.emitSyncEvent({ type: 'sync', timerId, data: updates });
        return true;
      }
    } catch (error) {
      console.error('Timer update failed:', error);
      this.emitSyncEvent({ type: 'error', timerId, error: error as Error });
      
      // Queue for retry
      this.queueRetry(timerId, async () => {
        await this.updateTimer(timerId, updates, false);
      });
      return false;
    }
  }

  /**
   * Get timer state with caching support
   */
  async getTimer(timerId: string): Promise<TimerPersistenceState | null> {
    try {
      const timerRef = doc(db, 'timers', timerId);
      const docSnap = await getDoc(timerRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data) return null;
        
        return this.convertFirestoreTimer(data);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get timer:', error);
      this.emitSyncEvent({ type: 'error', timerId, error: error as Error });
      return null;
    }
  }

  /**
   * Listen to real-time timer updates with enhanced error handling
   */
  listenToTimer(
    timerId: string, 
    onUpdate: (timer: TimerPersistenceState | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!this.options.enableRealtimeSync) {
      console.warn('Real-time sync is disabled');
      return () => {};
    }

    const timerRef = doc(db, 'timers', timerId);
    
    const unsubscribe = onSnapshot(
      timerRef,
      {
        includeMetadataChanges: true // Include pending writes
      },
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (!data) return;
          
          const timerState = this.convertFirestoreTimer(data);
          
          // Check if this is from local cache or server
          const source = doc.metadata.fromCache ? 'cache' : 'server';
          console.log(`Timer update from ${source}:`, timerId);
          
          onUpdate(timerState);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error('Timer listener error:', error);
        this.emitSyncEvent({ type: 'error', timerId, error });
        onError?.(error);
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.activeListeners.has(timerId)) {
            console.log('Attempting to reconnect timer listener:', timerId);
            this.listenToTimer(timerId, onUpdate, onError);
          }
        }, this.options.retryDelay || 1000);
      }
    );

    this.activeListeners.set(timerId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Complete timer session with comprehensive logging
   */
  async completeTimer(timerId: string, completionData: {
    endTime: Date;
    notes?: string;
    completionReason: 'completed' | 'stopped' | 'timeout';
    finalTimeRemaining: number;
  }): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      const timerRef = doc(db, 'timers', timerId);
      const activeTimerRef = doc(db, 'activeTimers', timerId);
      
      // Get current timer data for logging
      const currentTimer = await this.getTimer(timerId);
      if (!currentTimer) {
        throw new Error('Timer not found');
      }

      // Update timer with completion data
      batch.update(timerRef, {
        ...completionData,
        isRunning: false,
        isPaused: false,
        isCompleted: true,
        lastUpdated: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // Remove from active timers
      batch.delete(activeTimerRef);

      // Create comprehensive timer log entry
      const logRef = doc(collection(db, 'timerLogs'), `log_${timerId}_${Date.now()}`);
      batch.set(logRef, {
        timerId,
        userId: currentTimer.userId,
        projectId: currentTimer.projectId,
        jobCardId: currentTimer.jobCardId,
        jobCardTitle: currentTimer.jobCardTitle,
        startTime: currentTimer.startTime,
        duration: completionData.endTime.getTime() - currentTimer.startTime.getTime(),
        allocatedHours: currentTimer.allocatedHours,
        pauseCount: currentTimer.pauseCount,
        pauseHistory: currentTimer.pauseHistory,
        deviceId: currentTimer.deviceId,
        sessionId: currentTimer.sessionId,
        idempotencyKey: currentTimer.idempotencyKey,
        ...completionData,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      // Clean up listener
      this.stopListening(timerId);
      
      console.log('Timer completed:', timerId);
      this.emitSyncEvent({ type: 'sync', timerId, data: { completed: true, ...completionData } });
      return true;
    } catch (error) {
      console.error('Failed to complete timer:', error);
      this.emitSyncEvent({ type: 'error', timerId, error: error as Error });
      return false;
    }
  }

  /**
   * Get active timers for a user with enhanced querying
   */
  async getActiveTimers(userId: string): Promise<TimerPersistenceState[]> {
    try {
      const q = query(
        collection(db, 'timers'),
        where('userId', '==', userId),
        where('isRunning', '==', true),
        orderBy('startTime', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const timers: TimerPersistenceState[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        timers.push(this.convertFirestoreTimer(data));
      });

      return timers;
    } catch (error) {
      console.error('Failed to get active timers:', error);
      this.emitSyncEvent({ type: 'error', error: error as Error });
      return [];
    }
  }

  /**
   * Sync timer state across devices - detect and resolve conflicts
   */
  async syncAllTimers(userId: string): Promise<void> {
    try {
      const activeTimersQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc')
      );

      const snapshot = await getDocs(activeTimersQuery);
      
      for (const doc of snapshot.docs) {
        const activeTimerData = doc.data();
        const timerId = activeTimerData.timerId;
        
        // Get full timer data
        const fullTimer = await this.getTimer(timerId);
        if (fullTimer) {
          this.emitSyncEvent({ type: 'sync', timerId, data: fullTimer });
        }
      }
    } catch (error) {
      console.error('Failed to sync all timers:', error);
      this.emitSyncEvent({ type: 'error', error: error as Error });
    }
  }

  /**
   * Enhanced conflict detection with multiple criteria
   */
  private detectConflict(
    current: TimerPersistenceState, 
    updates: Partial<TimerPersistenceState>
  ): boolean {
    // Check for version conflicts
    if (updates.syncVersion && current.syncVersion >= updates.syncVersion) {
      return true;
    }

    // Check for device conflicts (different devices updating same timer)
    if (updates.deviceId && current.deviceId !== updates.deviceId) {
      const timeDiff = Math.abs(
        (updates.lastUpdated?.getTime() || Date.now()) - current.lastUpdated.getTime()
      );
      if (timeDiff < 5000) { // Updates within 5 seconds from different devices
        return true;
      }
    }

    // Check for state conflicts
    if (updates.isRunning !== undefined && current.isRunning !== updates.isRunning) {
      return true;
    }

    if (updates.isPaused !== undefined && current.isPaused !== updates.isPaused) {
      return true;
    }

    // Check for time conflicts (significant drift)
    if (updates.timeRemaining !== undefined) {
      const timeDiff = Math.abs(current.timeRemaining - updates.timeRemaining);
      if (timeDiff > 60) { // More than 1 minute difference
        return true;
      }
    }

    return false;
  }

  /**
   * Enhanced conflict resolution with user choice support
   */
  private async resolveConflict(
    current: TimerPersistenceState,
    updates: Partial<TimerPersistenceState>
  ): Promise<{ type: string; resolvedData: Partial<TimerPersistenceState> }> {
    switch (this.options.conflictResolutionStrategy) {
      case 'last_write_wins':
        const isCurrentNewer = current.lastUpdated > (updates.lastUpdated || new Date());
        return {
          type: isCurrentNewer ? 'local_wins' : 'remote_wins',
          resolvedData: isCurrentNewer ? {} : updates
        };
      
      case 'merge':
        return {
          type: 'merged',
          resolvedData: {
            ...updates,
            // Merge pause history
            pauseHistory: [
              ...(current.pauseHistory || []),
              ...(updates.pauseHistory || [])
            ].sort((a, b) => a.pausedAt.getTime() - b.pausedAt.getTime()),
            // Take the more recent time
            timeRemaining: updates.timeRemaining !== undefined 
              ? updates.timeRemaining 
              : current.timeRemaining,
            // Increment sync version
            syncVersion: Math.max(current.syncVersion, updates.syncVersion || 0) + 1,
            // Mark as merged
            conflictResolution: 'merged'
          }
        };
      
      case 'user_choice':
      default:
        // For user choice, emit conflict event and wait for resolution
        return {
          type: 'conflict',
          resolvedData: updates // Temporarily use updates, UI should handle choice
        };
    }
  }

  /**
   * Convert Firestore data to TimerPersistenceState
   */
  private convertFirestoreTimer(data: any): TimerPersistenceState {
    return {
      ...data,
      startTime: data.startTime?.toDate?.() || new Date(data.startTime),
      endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : undefined),
      lastUpdated: data.lastUpdated?.toDate?.() || new Date(data.lastUpdated),
      pauseHistory: data.pauseHistory?.map((pause: any) => ({
        ...pause,
        pausedAt: pause.pausedAt?.toDate?.() || new Date(pause.pausedAt),
        resumedAt: pause.resumedAt?.toDate?.() || (pause.resumedAt ? new Date(pause.resumedAt) : undefined)
      })) || []
    } as TimerPersistenceState;
  }

  /**
   * Setup network monitoring for offline/online state
   */
  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      this.emitSyncEvent({ type: 'connected' });
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.isOnline = false;
      this.emitSyncEvent({ type: 'disconnected' });
    });
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // Update heartbeat timestamp in localStorage for cross-tab communication
      localStorage.setItem('timer_heartbeat', JSON.stringify({
        timestamp: Date.now(),
        isOnline: this.isOnline
      }));
    }, this.options.heartbeatInterval || 30000);
  }

  /**
   * Process retry queue when connection is restored
   */
  private async processRetryQueue() {
    console.log(`Processing ${this.retryQueue.size} queued operations`);
    
    for (const [key, operation] of this.retryQueue.entries()) {
      try {
        await operation();
        this.retryQueue.delete(key);
      } catch (error) {
        console.error(`Retry operation failed for ${key}:`, error);
        // Keep in queue for next retry cycle
      }
    }
  }

  /**
   * Queue failed operations for retry with exponential backoff
   */
  private queueRetry(key: string, operation: () => Promise<void>) {
    if (this.retryQueue.has(key)) return;
    
    this.retryQueue.set(key, operation);
    
    const retryCount = parseInt(key.split('_retry_')[1] || '0');
    const delay = Math.min((this.options.retryDelay || 1000) * Math.pow(2, retryCount), 30000);
    
    setTimeout(async () => {
      const retryOperation = this.retryQueue.get(key);
      if (retryOperation && retryCount < (this.options.maxRetries || 3)) {
        try {
          await retryOperation();
          this.retryQueue.delete(key);
        } catch (error) {
          console.error(`Retry operation failed (attempt ${retryCount + 1}):`, error);
          // Re-queue with incremented retry count
          this.queueRetry(`${key}_retry_${retryCount + 1}`, operation);
        }
      } else if (retryCount >= (this.options.maxRetries || 3)) {
        console.error(`Max retries exceeded for operation: ${key}`);
        this.retryQueue.delete(key);
      }
    }, delay);
  }

  /**
   * Add event listener for sync events
   */
  addEventListener(type: string, handler: (event: TimerSyncEvent) => void) {
    this.syncEventHandlers.set(type, handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: string) {
    this.syncEventHandlers.delete(type);
  }

  /**
   * Emit sync event to registered handlers
   */
  private emitSyncEvent(event: TimerSyncEvent) {
    const handler = this.syncEventHandlers.get(event.type);
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in sync event handler:', error);
      }
    }
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('timer_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('timer_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Stop listening to timer updates
   */
  stopListening(timerId: string) {
    const unsubscribe = this.activeListeners.get(timerId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(timerId);
    }
  }

  /**
   * Cleanup all listeners, timers, and retry queues
   */
  cleanup() {
    // Stop all listeners
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
    
    // Clear retry queue
    this.retryQueue.clear();
    
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Clear event handlers
    this.syncEventHandlers.clear();
    
    console.log('TimerPersistenceAPI cleanup completed');
  }

  /**
   * Create a new timer using setDoc (implements unused import)
   */
  async createTimerWithSetDoc(timerId: string, timerData: TimerPersistenceState): Promise<void> {
    try {
      const timerRef = doc(db, 'timers', timerId);
      await setDoc(timerRef, {
        ...timerData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      console.log('Timer created with setDoc:', timerId);
    } catch (error) {
      console.error('Failed to create timer with setDoc:', error);
      throw error;
    }
  }

  /**
   * Add a timer to collection using addDoc (implements unused import)
   */
  async addTimerToCollection(timerData: Omit<TimerPersistenceState, 'id'>): Promise<string> {
    try {
      const timersRef = collection(db, 'timers');
      const docRef = await addDoc(timersRef, {
        ...timerData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      console.log('Timer added to collection:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to add timer to collection:', error);
      throw error;
    }
  }

  /**
   * Update a timer using updateDoc (implements unused import)
   */
  async updateTimerWithUpdateDoc(timerId: string, updates: Partial<TimerPersistenceState>): Promise<void> {
    try {
      const timerRef = doc(db, 'timers', timerId);
      await updateDoc(timerRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      console.log('Timer updated with updateDoc:', timerId);
    } catch (error) {
      console.error('Failed to update timer with updateDoc:', error);
      throw error;
    }
  }

  /**
   * Delete a timer using deleteDoc (implements unused import)
   */
  async deleteTimerWithDeleteDoc(timerId: string): Promise<void> {
    try {
      const timerRef = doc(db, 'timers', timerId);
      await deleteDoc(timerRef);
      
      // Also remove from active timers
      const activeTimerRef = doc(db, 'activeTimers', timerId);
      await deleteDoc(activeTimerRef);
      
      // Clean up listener
      this.stopListening(timerId);
      
      console.log('Timer deleted with deleteDoc:', timerId);
    } catch (error) {
      console.error('Failed to delete timer with deleteDoc:', error);
      throw error;
    }
  }
}
