import { useState, useCallback, useEffect } from 'react';
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { TimeLog, SubstantiationFile, NotificationType, Project, User, UserRole } from '../../types';
import type { Notification } from '../../types';
import { offlineSync } from '../../utils/offlineSync';
import { logAuditEvent, AuditAction } from '../../utils/auditLogger';
import { sanitizeForFirestore } from '../../utils/firebaseHelpers';
import { canFreelancerUseTimer } from './auth';
import { canUserStartTimerOnJobCard, getTaskHoursForJobCard } from './projects';

export interface ActiveTimerInfo {
  jobCardId: string;
  jobCardTitle: string;
  projectId: string;
  startTime: string;
  isPaused: boolean;
  totalPausedTime: number;
  allocatedHours?: number;
  pauseWarningShown: boolean;
  pausedAt?: string;
  autoResumeTimeout?: NodeJS.Timeout;
  warningTimer?: NodeJS.Timeout;
  idempotencyKey: string; // Added for concurrency control
}

export interface TimerState {
  activeTimers: Record<string, ActiveTimerInfo>;
  currentTimerKey: string | null;
  startGlobalTimer: (jobCardId: string, jobCardTitle: string, projectId: string, allocatedHours?: number) => Promise<boolean>;
  resumeGlobalTimer: (projectId: string, jobCardId: string) => Promise<boolean>;
  pauseGlobalTimer: (projectId: string, jobCardId: string) => Promise<boolean>;
  stopGlobalTimerAndLog: (projectId: string, jobCardId: string, details: { notes?: string; file?: File }, user: any, updateNotifications: (callback: (prev: Notification[]) => Notification[]) => void) => Promise<void>;
  syncTimerState: () => Promise<void>; // Added for multi-tab/device synchronization
  hasActiveTimer: boolean; // Added for quick status check
}

// Storage keys for timer data
const TIMER_STORAGE_KEY = 'architex_active_timer';
const TIMER_HEARTBEAT_KEY = 'architex_timer_heartbeat';

export const useTimer = (): TimerState => {
  const [activeTimers, setActiveTimers] = useState<Record<string, ActiveTimerInfo>>({});
  const [currentTimerKey, setCurrentTimerKey] = useState<string | null>(null);
  const [hasActiveTimer, setHasActiveTimer] = useState<boolean>(false);

  // Generate a unique idempotency key
  const generateIdempotencyKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Basic debounce map for timer actions (T2.1)
  const actionDebounce: Record<string, number> = {};
  const isDebounced = (key: string, windowMs = 800) => {
    const now = Date.now();
    const last = actionDebounce[key] || 0;
    if (now - last < windowMs) return true;
    actionDebounce[key] = now;
    return false;
  };

  // Provide a safe wrapper for queueForSync which exists in mocks but not in production utils/offlineSync.ts
  const queueForSyncSafe = useCallback(async (type: string, action: 'create' | 'update' | 'delete', data: any): Promise<boolean> => {
    try {
      const fn: any = (offlineSync as any)?.queueForSync;
      if (typeof fn === 'function') {
        return await fn(type, action, data);
      }
      // Fall back to a no-op if queueForSync isn't available in production build
      return false;
    } catch (e) {
      console.warn('queueForSyncSafe encountered an error; continuing without queuing:', e);
      return false;
    }
  }, []);

  // Load timer state from storage on component mount
  useEffect(() => {
    const loadTimerFromStorage = async () => {
      try {
        // First check IndexedDB (via offlineSync) for timer state
        const storedTimer = await offlineSync.getOfflineData('active_timer');
        
        if (storedTimer) {
          setActiveTimers(storedTimer.timers || {});
          setCurrentTimerKey(storedTimer.currentTimerKey || null);
          setHasActiveTimer(storedTimer.currentTimerKey !== null);
        } else {
          // Fallback to localStorage if no data in IndexedDB
          const storedTimerData = localStorage.getItem(TIMER_STORAGE_KEY);
          if (storedTimerData) {
            const parsedData = JSON.parse(storedTimerData);
            setActiveTimers(parsedData.timers || {});
            setCurrentTimerKey(parsedData.currentTimerKey || null);
            setHasActiveTimer(parsedData.currentTimerKey !== null);
          }
        }
        
        // Regardless of where we loaded the timer from, sync with server state
        syncTimerState();
      } catch (error) {
        console.error('Error loading timer from storage:', error);
      }
    };

    loadTimerFromStorage();
    
    // Set up periodic heartbeat and state check
    const heartbeatInterval = setInterval(() => {
      if (currentTimerKey) {
        // Update heartbeat timestamp
        localStorage.setItem(TIMER_HEARTBEAT_KEY, JSON.stringify({ 
          timestamp: Date.now(),
          userId: JSON.parse(localStorage.getItem('architex_user') || '{}').id || 'unknown'
        }));
        
        // Check for other active tabs/devices
        syncTimerState();
      }
    }, 30000); // 30 second intervals
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [currentTimerKey]);

  // Save timer state to storage whenever it changes
  useEffect(() => {
    const saveTimerToStorage = async () => {
      try {
        const timerData = {
          timers: activeTimers,
          currentTimerKey,
          timestamp: Date.now()
        };
        
        // Store in IndexedDB (production module supports saveOfflineData but not cacheData)
        await offlineSync.saveOfflineData('active_timer', timerData);
        
        // Also store in localStorage for cross-tab communication
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
        
        // Update heartbeat
        localStorage.setItem(TIMER_HEARTBEAT_KEY, JSON.stringify({ 
          timestamp: Date.now(),
          userId: JSON.parse(localStorage.getItem('architex_user') || '{}').id || 'unknown'
        }));
        
        setHasActiveTimer(currentTimerKey !== null);
      } catch (error) {
        console.error('Error saving timer to storage:', error);
      }
    };

    saveTimerToStorage();
  }, [activeTimers, currentTimerKey]);
  
  // Sync timer state with server and other tabs/devices
  const syncTimerState = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('architex_user') || '{}');
      if (!user.id) return;
      
      // Check for active timers in Firestore
      const activeTimersQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', user.id),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(activeTimersQuery);
      
      if (!snapshot.empty) {
        const serverTimer = snapshot.docs[0].data();
        const serverTimerKey = `${serverTimer.projectId}-${serverTimer.jobCardId}`;
        
        // If server has an active timer but we don't, or it's different from ours
        if (!currentTimerKey || currentTimerKey !== serverTimerKey) {
          // Server timer takes precedence
          setActiveTimers(prev => ({
            ...prev,
            [serverTimerKey]: {
              jobCardId: serverTimer.jobCardId,
              jobCardTitle: serverTimer.jobCardTitle,
              projectId: serverTimer.projectId,
              startTime: serverTimer.startTime,
              isPaused: serverTimer.isPaused || false,
              totalPausedTime: serverTimer.totalPausedTime || 0,
              allocatedHours: serverTimer.allocatedHours,
              pauseWarningShown: serverTimer.pauseWarningShown || false,
              pausedAt: serverTimer.pausedAt,
              idempotencyKey: serverTimer.idempotencyKey || generateIdempotencyKey()
            }
          }));
          setCurrentTimerKey(serverTimerKey);
        }
      } else if (currentTimerKey) {
        // If we have a local timer but server doesn't, push our timer to server
        const timerKey = currentTimerKey;
        const timer = activeTimers[timerKey];
        
        if (timer) {
          await addDoc(collection(db, 'activeTimers'), {
            userId: user.id,
            userName: user.name,
            projectId: timer.projectId,
            jobCardId: timer.jobCardId,
            jobCardTitle: timer.jobCardTitle,
            startTime: timer.startTime,
            isPaused: timer.isPaused,
            totalPausedTime: timer.totalPausedTime,
            allocatedHours: timer.allocatedHours,
            pauseWarningShown: timer.pauseWarningShown,
            pausedAt: timer.pausedAt,
            idempotencyKey: timer.idempotencyKey,
            lastUpdated: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error syncing timer state with server:', error);
    }
  };

  const startGlobalTimer = useCallback(async (jobCardId: string, jobCardTitle: string, projectId: string, allocatedHours?: number): Promise<boolean> => {
    const user = JSON.parse(localStorage.getItem('architex_user') || '{}') as User;
    if (!user.id) return false;

    // Debounce rapid start attempts
    if (isDebounced(`start:${user.id}:${projectId}:${jobCardId}`)) {
      console.warn('Start timer debounced');
      return false;
    }

    try {
      // RBAC: role must be allowed
      if (!canFreelancerUseTimer(user)) {
        await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ROLE, { projectId, jobCardId, role: user.role as UserRole });
        return false;
      }

      // Assignment check: ensure the user is assigned to this job card
      const projectSnap = await getDoc(doc(db, 'projects', projectId));
      const projectData = projectSnap.exists() ? (projectSnap.data() as Project) : null;
      if (!canUserStartTimerOnJobCard(projectData, jobCardId, user as any)) {
        await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ASSIGNMENT, { projectId, jobCardId });
        return false;
      }

      // Check for existing timers on server first
      await syncTimerState();
      
      // Generate a unique idempotency key for this timer start operation
      const idempotencyKey = generateIdempotencyKey();

      // Hours countdown alignment: if not provided, infer from project
      let allocated = allocatedHours;
      if (allocated == null && projectData) {
        const h = getTaskHoursForJobCard(projectData, jobCardId);
        allocated = h.remaining || h.assigned; // prefer remaining countdown
      }
      
      // If there's already an active timer, stop it first
      if (currentTimerKey) {
        const activeTimer = activeTimers[currentTimerKey];
        if (activeTimer) {
          console.log('Stopping existing timer before starting a new one');
          // We can't await this because we need the user to provide log details
          // Instead, let's just remove the timer directly for concurrency control
          const activeTimersQuery = query(
            collection(db, 'activeTimers'),
            where('userId', '==', user.id)
          );
          
          const snapshot = await getDocs(activeTimersQuery);
          if (!snapshot.empty) {
            // Delete all active timers for this user
            for (const doc of snapshot.docs) {
              await updateDoc(doc.ref, sanitizeForFirestore({ active: false, endTime: Timestamp.now() }));
            }
          }
          
          // Notify the user that their previous timer was stopped automatically
          alert('Your previous timer has been automatically stopped to start a new one.');
          
              // Log this action for audit
              await logAuditEvent(user, AuditAction.TIMER_AUTO_STOPPED, {
                projectId,
                jobCardId,
                reason: 'auto_stopped_for_new_timer'
              });
        }
      }
      
      const timerKey = `${projectId}-${jobCardId}`;
      
      // Create new timer in state
      const newTimer: ActiveTimerInfo = {
        jobCardId,
        jobCardTitle,
        projectId,
        startTime: new Date().toISOString(),
        isPaused: false,
        totalPausedTime: 0,
        allocatedHours: allocated,
        pauseWarningShown: false,
        idempotencyKey
      };
      
      setActiveTimers(prev => ({
        ...prev,
        [timerKey]: newTimer
      }));
      setCurrentTimerKey(timerKey);
      
      // Add to Firestore for cross-device syncing
      await addDoc(collection(db, 'activeTimers'), {
        userId: user.id,
        userName: user.name,
        projectId,
        jobCardId,
        jobCardTitle,
        startTime: newTimer.startTime,
        isPaused: false,
        totalPausedTime: 0,
        allocatedHours: newTimer.allocatedHours,
        idempotencyKey,
        lastUpdated: Timestamp.now()
      });
      
          // Log this action for audit
          await logAuditEvent(user, AuditAction.TIMER_STARTED, {
            projectId,
            jobCardId,
            idempotencyKey
          });
      
      // Queue for offline sync
      await queueForSyncSafe('timeEntry', 'create', {
        action: 'start',
        projectId,
        jobCardId,
        jobCardTitle,
        startTime: newTimer.startTime,
        idempotencyKey,
        userId: user.id
      });
      
      return true;
    } catch (error) {
      console.error('Error starting timer:', error);
      return false;
    }
  }, [activeTimers, currentTimerKey, isDebounced, queueForSyncSafe, syncTimerState]);

  const resumeGlobalTimer = useCallback(async (projectId: string, jobCardId: string): Promise<boolean> => {
    const timerKey = `${projectId}-${jobCardId}`;
    const user = JSON.parse(localStorage.getItem('architex_user') || '{}');
    if (!user.id) return false;
    
    try {
      setActiveTimers(prev => {
        const timer = prev[timerKey];
        if (timer && timer.isPaused && timer.pausedAt) {
          // Clear any pending auto-resume/Warning timeouts
          if (timer.autoResumeTimeout) {
            clearTimeout(timer.autoResumeTimeout);
          }
          if (timer.warningTimer) {
            clearTimeout(timer.warningTimer);
          }

          const pauseDuration = new Date().getTime() - new Date(timer.pausedAt).getTime();
          
          // Update Firestore
          const updateTimerInFirestore = async () => {
            try {
              const activeTimersQuery = query(
                collection(db, 'activeTimers'),
                where('userId', '==', user.id),
                where('projectId', '==', projectId),
                where('jobCardId', '==', jobCardId)
              );
              
              const snapshot = await getDocs(activeTimersQuery);
              if (!snapshot.empty) {
                for (const doc of snapshot.docs) {
                  await updateDoc(doc.ref, sanitizeForFirestore({
                    isPaused: false,
                    pausedAt: null,
                    totalPausedTime: (doc.data().totalPausedTime || 0) + pauseDuration,
                    pauseWarningShown: false,
                    lastUpdated: Timestamp.now()
                  }));
                }
              }
              
              // Log this action for audit
              await logAuditEvent(user, AuditAction.TIMER_RESUMED, {
                projectId,
                jobCardId,
                pauseDuration
              });
            } catch (error) {
              console.error('Error updating timer in Firestore:', error);
            }
          };
          updateTimerInFirestore();
          
          // Queue for offline sync
          queueForSyncSafe('timeEntry', 'update', {
            action: 'resume',
            projectId,
            jobCardId,
            pauseDuration,
            idempotencyKey: timer.idempotencyKey,
            userId: user.id
          });
          
          return {
            ...prev,
            [timerKey]: {
              ...timer,
              isPaused: false,
              pausedAt: undefined,
              totalPausedTime: timer.totalPausedTime + pauseDuration,
              pauseWarningShown: false,
              autoResumeTimeout: undefined
            }
          };
        }
        return prev;
      });
      setCurrentTimerKey(timerKey);
      return true;
    } catch (error) {
      console.error('Error resuming timer:', error);
      return false;
    }
  }, [queueForSyncSafe]);

  const pauseGlobalTimer = useCallback(async (projectId: string, jobCardId: string): Promise<boolean> => {
    const timerKey = `${projectId}-${jobCardId}`;
    const user = JSON.parse(localStorage.getItem('architex_user') || '{}');
    if (!user.id) return false;
    
    try {
      setActiveTimers(prev => {
        const timer = prev[timerKey];
        if (timer && !timer.isPaused) {
          // Enhanced pause system: 3 minute pause limit with warning system (corrected from 5 minutes)
          const warningAt = Date.now() + 170000; // 2:50 warning (170 seconds)
          const resumeAt = Date.now() + 180000;  // 3 minutes auto-resume (180 seconds)

          const warningTimer = setTimeout(() => {
            setActiveTimers(current => {
              const cur = current[timerKey];
              if (!cur || !cur.isPaused) return current;
              
              // Show browser notification for pause warning
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Timer Pause Warning', {
                  body: 'Your timer will auto-resume in 10 seconds. Click to return to the app.',
                  icon: '/favicon.ico',
                  tag: 'timer-pause-warning'
                });
              }
              
              return {
                ...current,
                [timerKey]: { ...cur, pauseWarningShown: true }
              };
            });
          }, Math.max(0, warningAt - Date.now()));

          const autoResumeTimeout = setTimeout(() => {
            // Use timestamps to avoid drift issues if tab sleeps
            resumeGlobalTimer(projectId, jobCardId);
            
            // Show notification when auto-resumed
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Auto-Resumed', {
                body: 'Your timer has been automatically resumed after 3 minutes of pause.',
                icon: '/favicon.ico',
                tag: 'timer-auto-resume'
              });
            }
          }, Math.max(0, resumeAt - Date.now()));

          // Update Firestore
          const updateTimerInFirestore = async () => {
            try {
              const activeTimersQuery = query(
                collection(db, 'activeTimers'),
                where('userId', '==', user.id),
                where('projectId', '==', projectId),
                where('jobCardId', '==', jobCardId)
              );
              
              const snapshot = await getDocs(activeTimersQuery);
              if (!snapshot.empty) {
                for (const doc of snapshot.docs) {
                  await updateDoc(doc.ref, sanitizeForFirestore({
                    isPaused: true,
                    pausedAt: new Date().toISOString(),
                    pauseWarningShown: false,
                    lastUpdated: Timestamp.now()
                  }));
                }
              }
              
              // Log this action for audit
              await logAuditEvent(user, AuditAction.TIMER_PAUSED, {
                projectId,
                jobCardId,
                pausedAt: new Date().toISOString(),
                idempotencyKey: timer.idempotencyKey
              });
            } catch (error) {
              console.error('Error updating timer in Firestore:', error);
            }
          };
          updateTimerInFirestore();
          
          // Queue for offline sync
          queueForSyncSafe('timeEntry', 'update', {
            action: 'pause',
            projectId,
            jobCardId,
            pausedAt: new Date().toISOString(),
            idempotencyKey: timer.idempotencyKey,
            userId: user.id
          });

          return {
            ...prev,
            [timerKey]: {
              ...timer,
              isPaused: true,
              pausedAt: new Date().toISOString(),
              autoResumeTimeout,
              warningTimer
            }
          };
        }
        return prev;
      });
      
      // When pausing, we don't have an active timer key
      setCurrentTimerKey(null);
      return true;
    } catch (error) {
      console.error('Error pausing timer:', error);
      return false;
    }
  }, [resumeGlobalTimer, queueForSyncSafe]);

  const stopGlobalTimerAndLog = async (
    projectId: string, 
    jobCardId: string, 
    details: { notes?: string; file?: File }, 
    user: any,
    setNotifications: (callback: (prev: Notification[]) => Notification[]) => void
  ) => {
    const timerKey = `${projectId}-${jobCardId}`;
    const timer = activeTimers[timerKey];
    if (!timer || !user) return;

    // Clear any pending auto-resume timeout
    if (timer.autoResumeTimeout) {
      clearTimeout(timer.autoResumeTimeout);
    }
    if (timer.warningTimer) {
      clearTimeout(timer.warningTimer);
    }

    const endTime = Timestamp.now();
    const startTime = Timestamp.fromDate(new Date(timer.startTime));
    const totalElapsedMs = endTime.toMillis() - startTime.toMillis() - timer.totalPausedTime;
    const durationMinutes = Math.round(totalElapsedMs / 60000);
    const durationHours = durationMinutes / 60;
    const pausedMinutes = Math.round(timer.totalPausedTime / 60000);

    let substantiationFile: SubstantiationFile | undefined;
    if (details.file) {
      try {
        const storageRef = ref(storage, `substantiation/${timer.projectId}/${timer.jobCardId}/${user.id}/${details.file.name}`);
        await uploadBytes(storageRef, details.file);
        const url = await getDownloadURL(storageRef);
        substantiationFile = { name: details.file.name, url };
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    // Calculate earnings based on user's hourly rate
    const hourlyRate = user.hourlyRate || 0;
    const earnings = durationHours * hourlyRate;

    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      startTime,
      endTime,
      durationMinutes,
      notes: details.notes,
      manualEntry: false,
      projectId: timer.projectId,
      jobCardId: timer.jobCardId,
      loggedById: user.id,
      loggedByName: user.name,
      substantiationFile,
      hourlyRate,
      earnings,
      pausedTime: pausedMinutes,
    };

    const projectDocRef = doc(db, "projects", newLog.projectId);
    const projectSnap = await getDoc(projectDocRef);
    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project;
      
      // Calculate project totals
      const updatedJobCards = projectData.jobCards.map(jc => {
        if (jc.id === newLog.jobCardId) {
          const updatedJobCard = { 
            ...jc, 
            timeLogs: [...(jc.timeLogs || []), newLog]
          };
          
          // Deduct time from allocated hours if they exist
          if (jc.allocatedHours && jc.allocatedHours > 0) {
            const remainingHours = Math.max(0, jc.allocatedHours - durationHours);
            updatedJobCard.allocatedHours = remainingHours;
          }
          
          return updatedJobCard;
        }
        return jc;
      });

      // Calculate project-level statistics
      const totalTimeSpent = updatedJobCards.reduce((total, jc) => {
        return total + (jc.timeLogs || []).reduce((jcTotal, log) => jcTotal + log.durationMinutes, 0);
      }, 0);

      const totalAllocatedHours = updatedJobCards.reduce((total, jc) => {
        return total + (jc.allocatedHours || 0);
      }, 0);

      const totalEarnings = updatedJobCards.reduce((total, jc) => {
        return total + (jc.timeLogs || []).reduce((jcTotal, log) => jcTotal + (log.earnings || 0), 0);
      }, 0);

      // Update project with new job cards and totals
      const updateData: any = { 
        jobCards: updatedJobCards,
        totalTimeSpentMinutes: totalTimeSpent,
        totalAllocatedHours: totalAllocatedHours,
        totalEarnings: totalEarnings
      };

      // Filter out undefined values
      // Remove undefined values and update project
      const sanitizedUpdateData = sanitizeForFirestore(updateData);

      await updateDoc(projectDocRef, sanitizedUpdateData);

      // Create notification for admin and client
      const notification: Notification = {
        id: `ntf-${Date.now()}`,
        userId: projectData.clientId,
        type: NotificationType.PROJECT_UPDATE,
        title: 'Time Logged',
        message: `${user.name} logged ${Math.floor(durationHours)}h ${durationMinutes % 60}m for task "${timer.jobCardTitle}" in ${projectData.title}`,
        projectId: projectData.id,
        createdAt: Timestamp.now(),
        read: false
      };
      await addDoc(collection(db, "notifications"), notification);
      setNotifications(prev => [...prev, notification]);

      // Show warning if allocated hours are low
      if (timer.allocatedHours && timer.allocatedHours > 0) {
        const remainingHours = Math.max(0, timer.allocatedHours - durationHours);
        if (remainingHours <= 0.5) { // 30 minutes or less remaining
          const warningNotification: Notification = {
            id: `ntf-warn-${Date.now()}`,
            userId: projectData.clientId,
            type: NotificationType.WARNING,
            title: 'Low Hours Remaining',
            message: `Task "${timer.jobCardTitle}" has ${Math.round(remainingHours * 60)} minutes remaining. Consider allocating more hours.`,
            projectId: projectData.id,
            createdAt: Timestamp.now(),
            read: false
          };
          await addDoc(collection(db, "notifications"), warningNotification);
          setNotifications(prev => [...prev, warningNotification]);
        }
      }
    }

    // Remove from active timers in Firestore for cross-device syncing
    const activeTimersQuery = query(
      collection(db, 'activeTimers'),
      where('userId', '==', user.id),
      where('projectId', '==', projectId),
      where('jobCardId', '==', jobCardId)
    );
    
    const snapshot = await getDocs(activeTimersQuery);
    if (!snapshot.empty) {
      for (const doc of snapshot.docs) {
        await updateDoc(doc.ref, sanitizeForFirestore({ 
          active: false,
          endTime: endTime,
          durationMinutes,
          totalPausedTime: timer.totalPausedTime,
          lastUpdated: Timestamp.now()
        }));
      }
    }
    
              // Log this action for audit
              await logAuditEvent(user, AuditAction.TIMER_STOPPED, {
                projectId,
                jobCardId,
                durationMinutes,
                pausedTime: pausedMinutes,
                idempotencyKey: timer.idempotencyKey,
                timeLogId: newLog.id
              });
    
    // Queue for offline sync in case stop is triggered offline
    await queueForSyncSafe('timeEntry', 'create', {
      timeLog: newLog,
      projectId,
      jobCardId,
      idempotencyKey: timer.idempotencyKey,
      userId: user.id
    });

    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[timerKey];
      return newTimers;
    });
    setCurrentTimerKey(null);
    
    // Clear from localStorage
    const timerData = {
      timers: {},
      currentTimerKey: null,
      timestamp: Date.now()
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
  };

  return {
    activeTimers,
    currentTimerKey,
    startGlobalTimer,
    resumeGlobalTimer,
    pauseGlobalTimer,
    stopGlobalTimerAndLog,
    syncTimerState,
    hasActiveTimer
  };
};