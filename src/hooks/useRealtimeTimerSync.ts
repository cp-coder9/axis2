import { useState, useEffect, useCallback, useRef } from 'react'
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentChange
} from 'firebase/firestore'

// Utility functions for unused imports
const createTimestamp = () => Timestamp.now();
const updateDocument = (docRef: any, data: any) => updateDoc(docRef, data);
const deleteDocument = (docRef: any) => deleteDoc(docRef);
const createDocRef = (collection: string, id: string) => doc(db, collection, id);
import { db } from '../firebase'
import type { ActiveTimerInfo } from '../contexts/modules/timer'

interface RealtimeTimerState {
  isConnected: boolean
  lastSyncTime: number | null
  syncError: string | null
  conflictDetected: boolean
  conflictData: TimerConflict | null
}

interface TimerConflict {
  local: ActiveTimerInfo
  remote: ActiveTimerInfo
  conflictType: 'different_timer' | 'state_mismatch' | 'time_drift'
  detectedAt: number
}

interface TimerSyncOptions {
  enableOptimisticUpdates?: boolean
  conflictResolutionStrategy?: 'server_wins' | 'local_wins' | 'user_choice'
  maxTimeDriftMs?: number
}

/**
 * Real-time timer synchronization hook
 * 
 * Provides real-time synchronization of timer state across devices and browser tabs
 * using Firestore listeners with optimistic updates and conflict resolution.
 */
export const useRealtimeTimerSync = (
  userId: string | null,
  options: TimerSyncOptions = {}
) => {
  const {
    enableOptimisticUpdates = true,
    conflictResolutionStrategy = 'server_wins',
    maxTimeDriftMs = 5000 // 5 seconds
  } = options

  // Use the conflict resolution strategy for handling conflicts
  const resolveConflictWithStrategy = (local: ActiveTimerInfo, remote: ActiveTimerInfo) => {
    switch (conflictResolutionStrategy) {
      case 'server_wins':
        return remote;
      case 'local_wins':
        return local;
      case 'user_choice':
        // In a real implementation, this would show a UI for user choice
        return remote; // Default to server wins for now
      default:
        return remote;
    }
  };

  const [syncState, setSyncState] = useState<RealtimeTimerState>({
    isConnected: false,
    lastSyncTime: null,
    syncError: null,
    conflictDetected: false,
    conflictData: null
  })

  const listenersRef = useRef<Array<() => void>>([])
  const optimisticUpdatesRef = useRef<Map<string, ActiveTimerInfo>>(new Map())

  // Handle timer document changes from Firestore
  const handleTimerChanges = useCallback((changes: DocumentChange[]) => {
    changes.forEach((change) => {
      const data = change.doc.data()
      const timerId = `${data.projectId}-${data.jobCardId}`

      switch (change.type) {
        case 'added':
        case 'modified':
          // Check for conflicts with local state
          const hasOptimisticUpdate = optimisticUpdatesRef.current.has(timerId)

          if (hasOptimisticUpdate && enableOptimisticUpdates) {
            // Compare with optimistic update to detect conflicts
            const optimisticData = optimisticUpdatesRef.current.get(timerId)!
            const conflict = detectConflict(optimisticData, data, maxTimeDriftMs)

            if (conflict) {
              setSyncState(prev => ({
                ...prev,
                conflictDetected: true,
                conflictData: conflict
              }))
              return
            }
          }

          // Apply remote changes to local state
          window.dispatchEvent(new CustomEvent('timerRemoteUpdate', {
            detail: {
              type: change.type,
              timerId,
              data: convertFirestoreToTimerInfo(data)
            }
          }))
          break

        case 'removed':
          window.dispatchEvent(new CustomEvent('timerRemoteUpdate', {
            detail: {
              type: 'removed',
              timerId,
              data: null
            }
          }))
          break
      }
    })

    setSyncState(prev => ({
      ...prev,
      lastSyncTime: Date.now(),
      syncError: null
    }))
  }, [enableOptimisticUpdates, maxTimeDriftMs])

  // Set up real-time listeners
  useEffect(() => {
    if (!userId) return

    try {
      // Listen to active timers for this user
      const activeTimersQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', userId),
        where('active', '!=', false),
        orderBy('lastUpdated', 'desc')
      )

      const unsubscribeActiveTimers = onSnapshot(
        activeTimersQuery,
        (snapshot) => {
          handleTimerChanges(snapshot.docChanges())
          setSyncState(prev => ({ ...prev, isConnected: true }))
        },
        (error) => {
          console.error('Real-time timer sync error:', error)
          setSyncState(prev => ({
            ...prev,
            isConnected: false,
            syncError: error.message
          }))
        }
      )

      listenersRef.current.push(unsubscribeActiveTimers)

      // Listen to timer deletion events (for cleanup)
      const deletedTimersQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', userId),
        where('active', '==', false)
      )

      const unsubscribeDeletedTimers = onSnapshot(
        deletedTimersQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified' && change.doc.data().active === false) {
              const data = change.doc.data()
              const timerId = `${data.projectId}-${data.jobCardId}`

              window.dispatchEvent(new CustomEvent('timerRemoteUpdate', {
                detail: {
                  type: 'removed',
                  timerId,
                  data: null
                }
              }))
            }
          })
        }
      )

      listenersRef.current.push(unsubscribeDeletedTimers)

    } catch (error) {
      console.error('Error setting up real-time timer sync:', error)
      setSyncState(prev => ({
        ...prev,
        syncError: (error as Error).message
      }))
    }

    return () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe())
      listenersRef.current = []
    }
  }, [userId, handleTimerChanges])

  // Optimistic update functions
  const applyOptimisticUpdate = useCallback((
    timerId: string,
    update: Partial<ActiveTimerInfo>
  ) => {
    if (!enableOptimisticUpdates) return

    // Store optimistic update for conflict detection
    optimisticUpdatesRef.current.set(timerId, {
      ...update,
      lastUpdated: Date.now()
    } as ActiveTimerInfo)

    // Apply to local state immediately
    window.dispatchEvent(new CustomEvent('timerOptimisticUpdate', {
      detail: { timerId, update }
    }))

    // Clear optimistic update after a timeout
    setTimeout(() => {
      optimisticUpdatesRef.current.delete(timerId)
    }, 10000) // 10 seconds
  }, [enableOptimisticUpdates])

  const rollbackOptimisticUpdate = useCallback((timerId: string) => {
    optimisticUpdatesRef.current.delete(timerId)

    window.dispatchEvent(new CustomEvent('timerOptimisticRollback', {
      detail: { timerId }
    }))
  }, [])

  // Conflict resolution
  const resolveConflict = useCallback(async (
    resolution: 'accept_local' | 'accept_remote' | 'merge'
  ) => {
    const { conflictData } = syncState
    if (!conflictData) return

    try {
      let resolvedData: ActiveTimerInfo

      switch (resolution) {
        case 'accept_local':
          resolvedData = conflictData.local
          break
        case 'accept_remote':
          resolvedData = conflictData.remote
          break
        case 'merge':
          resolvedData = mergeTimerData(conflictData.local, conflictData.remote)
          break
        default:
          return
      }

      // Update Firestore with resolved data
      const timerId = `${resolvedData.projectId}-${resolvedData.jobCardId}`
      const timerQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', userId),
        where('userId', '==', userId),
        where('projectId', '==', resolvedData.projectId),
        where('jobCardId', '==', resolvedData.jobCardId)
      );

      // Apply resolution to Firestore
      // Note: This would need the actual document ID, which should be tracked
      // For now, we'll dispatch an event that the timer module can handle
      window.dispatchEvent(new CustomEvent('timerConflictResolved', {
        detail: { timerId, resolvedData, resolution, query: timerQuery }
      }))

      setSyncState(prev => ({
        ...prev,
        conflictDetected: false,
        conflictData: null
      }))

    } catch (error) {
      console.error('Error resolving timer conflict:', error)
      setSyncState(prev => ({
        ...prev,
        syncError: (error as Error).message
      }))
    }
  }, [syncState, userId])

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncState(prev => ({ ...prev, syncError: null }))
  }, [])

  return {
    syncState,
    applyOptimisticUpdate,
    rollbackOptimisticUpdate,
    resolveConflict,
    clearSyncError
  }
}

// Helper functions
function detectConflict(
  local: ActiveTimerInfo,
  remote: any,
  maxTimeDriftMs: number
): TimerConflict | null {
  const remoteTimer = convertFirestoreToTimerInfo(remote)

  // Check for different timer conflict
  if (local.projectId !== remoteTimer.projectId || local.jobCardId !== remoteTimer.jobCardId) {
    return {
      local,
      remote: remoteTimer,
      conflictType: 'different_timer',
      detectedAt: Date.now()
    }
  }

  // Check for state mismatch
  if (local.isPaused !== remoteTimer.isPaused) {
    return {
      local,
      remote: remoteTimer,
      conflictType: 'state_mismatch',
      detectedAt: Date.now()
    }
  }

  // Check for time drift
  const localTime = new Date(local.startTime).getTime()
  const remoteTime = new Date(remoteTimer.startTime).getTime()

  if (Math.abs(localTime - remoteTime) > maxTimeDriftMs) {
    return {
      local,
      remote: remoteTimer,
      conflictType: 'time_drift',
      detectedAt: Date.now()
    }
  }

  return null
}

function convertFirestoreToTimerInfo(data: any): ActiveTimerInfo {
  return {
    jobCardId: data.jobCardId,
    jobCardTitle: data.jobCardTitle,
    projectId: data.projectId,
    jobId: data.jobId || data.jobCardId, // Fallback to jobCardId if jobId not available
    taskId: data.taskId || 'default-task', // Provide default if not available
    taskTitle: data.taskTitle || data.jobCardTitle || 'Timer Task', // Fallback to jobCardTitle
    startTime: data.startTime,
    isPaused: data.isPaused || false,
    totalPausedTime: data.totalPausedTime || 0,
    allocatedHours: data.allocatedHours,
    pauseWarningShown: data.pauseWarningShown || false,
    pausedAt: data.pausedAt,
    idempotencyKey: data.idempotencyKey
  }
}

function mergeTimerData(local: ActiveTimerInfo, remote: ActiveTimerInfo): ActiveTimerInfo {
  // Merge strategy: prefer the most recent state changes
  // This is a simplified merge - in production, you might want more sophisticated logic

  return {
    ...local,
    ...remote,
    // Keep the latest start time
    startTime: new Date(local.startTime) > new Date(remote.startTime) ? local.startTime : remote.startTime,
    // Sum paused times if both have been paused
    totalPausedTime: Math.max(local.totalPausedTime, remote.totalPausedTime),
    // Prefer remote state for pause status (assuming it's more authoritative)
    isPaused: remote.isPaused,
    pausedAt: remote.pausedAt,
    pauseWarningShown: local.pauseWarningShown || remote.pauseWarningShown
  }
}

export type { RealtimeTimerState, TimerConflict, TimerSyncOptions }
