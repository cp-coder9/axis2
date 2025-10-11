import { useState, useEffect, useCallback, useRef } from 'react';

export interface TimerSyncState {
  lastSync: Date | null;
  syncStatus: 'connected' | 'syncing' | 'offline' | 'error';
  conflictDetected: boolean;
  pendingChanges: number;
}

export interface TimerState {
  id: string;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  pauseCount: number;
  lastUpdated: Date;
  userId: string;
  projectId: string;
  jobCardId: string;
}

export interface TimerSyncOptions {
  projectId: string;
  jobCardId: string;
  userId: string;
  onSyncConflict?: (local: TimerState, remote: TimerState) => TimerState;
  onSyncError?: (error: Error) => void;
  syncInterval?: number; // milliseconds
}

// Simulated Firestore operations for development
const simulateFirestoreDelay = () => 
  new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

/**
 * Custom hook for real-time timer synchronization with Firestore
 * Handles conflicts, offline state, and cross-device synchronization
 */
export function useTimerSync(options: TimerSyncOptions) {
  const [syncState, setSyncState] = useState<TimerSyncState>({
    lastSync: null,
    syncStatus: 'offline',
    conflictDetected: false,
    pendingChanges: 0
  });

  const [localTimerState, setLocalTimerState] = useState<TimerState | null>(null);
  const pendingUpdatesRef = useRef<TimerState[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Simulate conflict resolution
  const resolveConflict = useCallback((local: TimerState, remote: TimerState): TimerState => {
    if (options.onSyncConflict) {
      return options.onSyncConflict(local, remote);
    }
    
    // Default conflict resolution: most recent update wins
    return local.lastUpdated > remote.lastUpdated ? local : remote;
  }, [options]);

  // Sync timer state with Firestore
  const syncTimerState = useCallback(async (timerState: TimerState) => {
    try {
      setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));
      
      // Simulate Firestore operation
      await simulateFirestoreDelay();
      
      // In a real implementation, this would be:
      // await updateDoc(doc(db, 'timers', timerState.id), timerState);
      console.log('Timer state synced to Firestore:', timerState);
      
      setSyncState(prev => ({
        ...prev,
        syncStatus: 'connected',
        lastSync: new Date(),
        pendingChanges: Math.max(0, prev.pendingChanges - 1)
      }));
      
      return true;
    } catch (error) {
      console.error('Timer sync error:', error);
      setSyncState(prev => ({ ...prev, syncStatus: 'error' }));
      options.onSyncError?.(error as Error);
      return false;
    }
  }, [options]);

  // Listen to real-time Firestore updates
  const listenToTimerUpdates = useCallback(() => {
    setSyncState(prev => ({ ...prev, syncStatus: 'connected' }));
    
    // Simulate real-time listener
    const intervalId = setInterval(async () => {
      try {
        await simulateFirestoreDelay();
        
        // Simulate receiving remote update
        if (Math.random() < 0.1 && localTimerState) { // 10% chance of remote update
          const remoteState: TimerState = {
            ...localTimerState,
            lastUpdated: new Date(),
            timeRemaining: localTimerState.timeRemaining - 1
          };
          
          // Check for conflicts
          if (localTimerState.lastUpdated > remoteState.lastUpdated) {
            setSyncState(prev => ({ ...prev, conflictDetected: true }));
            const resolvedState = resolveConflict(localTimerState, remoteState);
            setLocalTimerState(resolvedState);
          } else {
            setLocalTimerState(remoteState);
          }
        }
      } catch (error) {
        console.error('Real-time listener error:', error);
        setSyncState(prev => ({ ...prev, syncStatus: 'error' }));
      }
    }, options.syncInterval || 5000);
    
    return () => clearInterval(intervalId);
  }, [localTimerState, resolveConflict, options.syncInterval]);

  // Update timer state with optimistic updates
  const updateTimerState = useCallback(async (updates: Partial<TimerState>) => {
    if (!localTimerState) return false;

    const newState: TimerState = {
      ...localTimerState,
      ...updates,
      lastUpdated: new Date()
    };

    // Optimistic update
    setLocalTimerState(newState);
    setSyncState(prev => ({ 
      ...prev, 
      pendingChanges: prev.pendingChanges + 1 
    }));

    // Queue for background sync
    pendingUpdatesRef.current.push(newState);
    
    // Attempt immediate sync
    const success = await syncTimerState(newState);
    
    if (!success) {
      // Add to retry queue in real implementation
      console.log('Timer update queued for retry');
    }

    return success;
  }, [localTimerState, syncTimerState]);

  // Initialize timer state
  const initializeTimer = useCallback(async (initialState: Partial<TimerState>) => {
    const timerState: TimerState = {
      id: `timer_${options.projectId}_${options.jobCardId}_${Date.now()}`,
      timeRemaining: 7200, // 2 hours default
      isRunning: false,
      isPaused: false,
      pauseCount: 0,
      lastUpdated: new Date(),
      userId: options.userId,
      projectId: options.projectId,
      jobCardId: options.jobCardId,
      ...initialState
    };

    setLocalTimerState(timerState);
    await syncTimerState(timerState);
    
    return timerState;
  }, [options, syncTimerState]);

  // Cleanup and sync pending changes on unmount
  useEffect(() => {
    const currentSyncInterval = syncIntervalRef.current;
    const currentPendingUpdates = pendingUpdatesRef.current;
    
    return () => {
      if (currentSyncInterval) {
        clearInterval(currentSyncInterval);
      }
      
      // Sync any pending changes
      if (currentPendingUpdates.length > 0) {
        const lastUpdate = currentPendingUpdates[currentPendingUpdates.length - 1];
        syncTimerState(lastUpdate);
      }
    };
  }, [syncTimerState]);

  // Start real-time listening
  useEffect(() => {
    const unsubscribe = listenToTimerUpdates();
    return unsubscribe;
  }, [listenToTimerUpdates]);

  return {
    timerState: localTimerState,
    syncState,
    updateTimerState,
    initializeTimer,
    syncNow: () => localTimerState ? syncTimerState(localTimerState) : Promise.resolve(false)
  };
}
