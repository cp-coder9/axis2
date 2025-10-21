import { useState, useCallback, useEffect } from 'react';
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { TimeLog, SubstantiationFile, Project, User, UserRole, TimeSlotStatus } from '../../types';
import { NotificationType, NotificationPriority, NotificationCategory } from '../../types/notifications';
import type { Notification } from '../../types/notifications';
import { offlineSync } from '../../utils/offlineSync';
import { logAuditEvent, AuditAction } from '../../utils/auditLogger';
import { sanitizeForFirestore } from '../../utils/firebaseHelpers';
import { canFreelancerUseTimer } from './auth';
import { canUserStartTimerOnTask, getTaskHoursForTask } from './projects';
import { canFreelancerStartTimer, getAvailableSlotsForFreelancer } from '../../utils/timerSlotValidation';
import { createNotification } from '../../services/notificationService';

export interface ActiveTimerInfo {
  projectId: string;
  jobId: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  isPaused: boolean;
  totalPausedTime: number;
  allocatedHours?: number;
  pauseWarningShown: boolean;
  pausedAt?: string;
  autoResumeTimeout?: NodeJS.Timeout;
  warningTimer?: NodeJS.Timeout;
  idempotencyKey: string; // Added for concurrency control
  slotId?: string; // Reference to time slot for allocated time tracking
  jobCardId?: string; // Reference to job card for project organization
  jobCardTitle?: string; // Title of the job card for display purposes
}

export interface TimerState {
  activeTimers: Record<string, ActiveTimerInfo>;
  currentTimerKey: string | null;
  // Flexible APIs: support either (projectId, jobId, taskId, ...) or a single timerKey string
  startGlobalTimer: (...args: any[]) => Promise<boolean>;
  resumeGlobalTimer: (...args: any[]) => Promise<boolean>;
  pauseGlobalTimer: (...args: any[]) => Promise<boolean>;
  stopGlobalTimerAndLog: (...args: any[]) => Promise<void>;
  syncTimerState: () => Promise<void>; // Added for multi-tab/device synchronization
  hasActiveTimer: boolean; // Added for quick status check
  slotMonitoringActive: boolean; // Track if slot monitoring is active
}

// Storage keys for timer data
const TIMER_STORAGE_KEY = 'architex_active_timer';
const TIMER_HEARTBEAT_KEY = 'architex_timer_heartbeat';

export const useTimer = (): TimerState => {
  const [activeTimers, setActiveTimers] = useState<Record<string, ActiveTimerInfo>>({});
  const [currentTimerKey, setCurrentTimerKey] = useState<string | null>(null);
  const [hasActiveTimer, setHasActiveTimer] = useState<boolean>(false);
  const [slotMonitoringActive, setSlotMonitoringActive] = useState<boolean>(false); // Track slot monitoring status
  const [slotMonitoringInterval, setSlotMonitoringInterval] = useState<NodeJS.Timeout | null>(null); // Track slot monitoring timer

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

      // Clear slot monitoring on unmount
      if (slotMonitoringInterval) {
        clearInterval(slotMonitoringInterval);
      }
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
        const serverTimerKey = `${serverTimer.projectId}-${serverTimer.jobId}-${serverTimer.taskId}`;

        // If server has an active timer but we don't, or it's different from ours
        if (!currentTimerKey || currentTimerKey !== serverTimerKey) {
          // Server timer takes precedence
          setActiveTimers(prev => ({
            ...prev,
            [serverTimerKey]: {
              projectId: serverTimer.projectId,
              jobId: serverTimer.jobId,
              taskId: serverTimer.taskId,
              taskTitle: serverTimer.taskTitle,
              startTime: serverTimer.startTime,
              isPaused: serverTimer.isPaused || false,
              totalPausedTime: serverTimer.totalPausedTime || 0,
              allocatedHours: serverTimer.allocatedHours,
              pauseWarningShown: serverTimer.pauseWarningShown || false,
              pausedAt: serverTimer.pausedAt,
              slotId: serverTimer.slotId,
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
            jobId: timer.jobId,
            taskId: timer.taskId,
            taskTitle: timer.taskTitle,
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

  const startGlobalTimer = useCallback(async (...args: any[]): Promise<boolean> => {
    // Support both signatures: (timerKey) or (projectId, jobId, taskId, taskTitle?, allocatedHours?, slotId?, adminOverride?)
    let projectId: string, jobId: string, taskId: string, taskTitle: string | undefined, allocatedHours: number | undefined, slotId: string | undefined, adminOverride: boolean = false;
    if (args.length === 1 && typeof args[0] === 'string') {
      const key = args[0] as string;
      const parts = key.split('-');
      projectId = parts[0]; jobId = parts[1]; taskId = parts[2];
      allocatedHours = undefined;
      slotId = undefined;
      adminOverride = false;
    } else {
      [projectId, jobId, taskId, taskTitle, allocatedHours, slotId, adminOverride] = args;
    }

    const user = JSON.parse(localStorage.getItem('architex_user') || '{}') as User;
    if (!user.id) return false;

    // Debounce rapid start attempts
    if (isDebounced(`start:${user.id}:${projectId}:${jobId}:${taskId}`)) {
      console.warn('Start timer debounced');
      return false;
    }

    try {
      // RBAC: role must be allowed (skip for admin override)
      if (!adminOverride && !canFreelancerUseTimer(user)) {
        await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ROLE, { projectId, jobId, taskId, role: user.role as UserRole });
        return false;
      }

      // Assignment check: ensure the user is assigned to this task (skip for admin override)
      const projectSnap = await getDoc(doc(db, 'projects', projectId));
      const projectData = projectSnap.exists() ? (projectSnap.data() as Project) : null;
      if (!adminOverride && !canUserStartTimerOnTask(projectData, jobId, taskId, user as any)) {
        await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ASSIGNMENT, { projectId, jobId, taskId });
        return false;
      }

      // Slot-based allocation check (freelancer only, skip for admin override)
      if (!adminOverride && user.role === UserRole.FREELANCER) {
        try {
          const slotCheck = await canFreelancerStartTimer(user.id, projectId, jobId);
          if (!slotCheck.canStart) {
            await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ASSIGNMENT, { projectId, jobId, taskId, reason: slotCheck.reason });
            return false;
          }

          // Additional strict validation: ensure there's actually an available slot with remaining time
          const availableSlots = await getAvailableSlotsForFreelancer(user.id, projectId);
          const hasValidSlot = availableSlots.some(slot => {
            const remainingHours = slot.durationHours - (slot.hoursUtilized || 0);
            return remainingHours > 0.083; // At least 5 minutes remaining (0.083 hours)
          });

          if (!hasValidSlot) {
            await logAuditEvent(user as any, AuditAction.TIMER_START_DENIED_ASSIGNMENT, {
              projectId,
              jobId,
              taskId,
              reason: 'No time slots with sufficient remaining time available'
            });
            return false;
          }
        } catch (error) {
          console.error('Error during slot validation for timer start:', error);
          return false;
        }
      }

      // Log admin override usage
      if (adminOverride) {
        await logAuditEvent(user, AuditAction.ADMIN_OVERRIDE_USED, {
          projectId,
          jobId,
          taskId,
          overrideType: 'timer_start_bypass_restrictions',
          originalRole: user.role,
          bypassedChecks: ['role_check', 'assignment_check', 'slot_check']
        });
      }

      // Generate a unique idempotency key for this timer start operation
      const idempotencyKey = generateIdempotencyKey();

      // Hours countdown alignment: if not provided, infer from project
      let allocated = allocatedHours;
      if (allocated == null && projectData) {
        const h = getTaskHoursForTask(projectData, jobId, taskId);
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
            jobId,
            taskId,
            reason: 'auto_stopped_for_new_timer'
          });
        }
      }

      const timerKey = `${projectId}-${jobId}-${taskId}`;

      // Create new timer in state
      const newTimer: ActiveTimerInfo = {
        projectId,
        jobId,
        taskId,
        taskTitle,
        startTime: new Date().toISOString(),
        isPaused: false,
        totalPausedTime: 0,
        allocatedHours: allocated,
        pauseWarningShown: false,
        idempotencyKey,
        slotId
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
        jobId,
        taskId,
        taskTitle,
        startTime: newTimer.startTime,
        isPaused: false,
        totalPausedTime: 0,
        allocatedHours: newTimer.allocatedHours,
        idempotencyKey,
        slotId: newTimer.slotId,
        lastUpdated: Timestamp.now()
      });

      // Log this action for audit
      await logAuditEvent(user, AuditAction.TIMER_STARTED, {
        projectId,
        jobId,
        taskId,
        idempotencyKey
      });

      // Queue for offline sync
      await queueForSyncSafe('timeEntry', 'create', {
        action: 'start',
        projectId,
        jobId,
        taskId,
        taskTitle,
        startTime: newTimer.startTime,
        idempotencyKey,
        userId: user.id
      });

      // Update time slot status to IN_PROGRESS if slotId provided
      if (slotId) {
        try {
          const { updateTimeSlotStatus } = await import('../../services/timeSlotService');
          await updateTimeSlotStatus(slotId, TimeSlotStatus.IN_PROGRESS);
          console.log('Time slot status updated to IN_PROGRESS:', slotId);
        } catch (slotError) {
          console.error('Error updating time slot status:', slotError);
          // Don't fail timer start if slot update fails
        }
      }

      // Notify project team members about timer start
      try {
        await notifyTimerStarted(projectId, jobId, taskId, taskTitle, user.name, projectData);
      } catch (error) {
        console.error('Error sending timer start notification:', error);
        // Don't fail timer start if notification fails
      }

      // Start slot monitoring if timer is associated with a slot (for freelancers)
      if (slotId && user.role === UserRole.FREELANCER) {
        // Clear any existing monitoring
        if (slotMonitoringInterval) {
          clearInterval(slotMonitoringInterval);
        }

        // Start monitoring every 30 seconds
        const monitoringInterval = setInterval(monitorSlotUtilization, 30000);
        setSlotMonitoringInterval(monitoringInterval);
      }

      return true;
    } catch (error) {
      console.error('Error starting timer:', error);
      return false;
    }
  }, [activeTimers, currentTimerKey, isDebounced, queueForSyncSafe, syncTimerState]);

  const resumeGlobalTimer = useCallback(async (...args: any[]): Promise<boolean> => {
    let projectId: string, jobId: string, taskId: string;
    if (args.length === 1 && typeof args[0] === 'string') {
      const parts = args[0].split('-');
      projectId = parts[0]; jobId = parts[1]; taskId = parts[2];
    } else {
      [projectId, jobId, taskId] = args;
    }
    const timerKey = `${projectId}-${jobId}-${taskId}`;
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
                where('jobId', '==', jobId),
                where('taskId', '==', taskId)
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
                jobId,
                taskId,
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
            jobId,
            taskId,
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

      // Restart slot monitoring if timer is associated with a slot
      const resumedTimer = activeTimers[timerKey];
      if (resumedTimer && resumedTimer.slotId) {
        const user = JSON.parse(localStorage.getItem('architex_user') || '{}');
        if (user.role === UserRole.FREELANCER) {
          // Clear any existing monitoring
          if (slotMonitoringInterval) {
            clearInterval(slotMonitoringInterval);
          }

          // Restart monitoring
          const monitoringInterval = setInterval(monitorSlotUtilization, 30000);
          setSlotMonitoringInterval(monitoringInterval);
        }
      }

      return true;
    } catch (error) {
      console.error('Error resuming timer:', error);
      return false;
    }
  }, [queueForSyncSafe]);

  const pauseGlobalTimer = useCallback(async (...args: any[]): Promise<boolean> => {
    let projectId: string, jobId: string, taskId: string;
    if (args.length === 1 && typeof args[0] === 'string') {
      const parts = args[0].split('-');
      projectId = parts[0]; jobId = parts[1]; taskId = parts[2];
    } else {
      [projectId, jobId, taskId] = args;
    }
    const timerKey = `${projectId}-${jobId}-${taskId}`;
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
            resumeGlobalTimer(projectId, jobId, taskId);

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
                where('jobId', '==', jobId),
                where('taskId', '==', taskId)
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
                jobId,
                taskId,
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
            jobId,
            taskId,
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

      // Stop slot monitoring when timer is paused
      if (slotMonitoringInterval) {
        clearInterval(slotMonitoringInterval);
        setSlotMonitoringInterval(null);
      }

      return true;
    } catch (error) {
      console.error('Error pausing timer:', error);
      return false;
    }
  }, [resumeGlobalTimer, queueForSyncSafe]);

  const stopGlobalTimerAndLog = async (...args: any[]) => {
    // Accept either (timerKey, details, user, setNotifications) or (projectId, jobId, taskId, details, user, setNotifications)
    let projectId: string, jobId: string, taskId: string, details: any, user: any, setNotifications: any;
    if (args.length >= 1 && typeof args[0] === 'string' && args[0].includes('-') && args.length === 4) {
      const parts = args[0].split('-');
      projectId = parts[0]; jobId = parts[1]; taskId = parts[2];
      details = args[1]; user = args[2]; setNotifications = args[3];
    } else {
      [projectId, jobId, taskId, details, user, setNotifications] = args;
    }
    const timerKey = `${projectId}-${jobId}-${taskId}`;
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
        const storageRef = ref(storage, `substantiation/${timer.projectId}/${timer.jobId}/${timer.taskId}/${user.id}/${details.file.name}`);
        await uploadBytes(storageRef, details.file);
        const url = await getDownloadURL(storageRef);
        substantiationFile = {
          id: `sf-${Date.now()}`,
          name: details.file.name,
          url,
          projectId: timer.projectId,
          uploadedBy: user.id,
          uploadedAt: Timestamp.now()
        };
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    // Calculate earnings based on user's hourly rate
    const hourlyRate = user.hourlyRate || 0;
    const earnings = durationHours * hourlyRate;

    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      userId: user.id,
      startTime,
      endTime,
      durationMinutes,
      notes: details.notes,
      manualEntry: false,
      projectId: timer.projectId,
      jobId: timer.jobId,
      taskId: timer.taskId,
      loggedById: user.id,
      loggedByName: user.name,
      substantiationFile,
      hourlyRate,
      earnings,
      pausedTime: pausedMinutes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const projectDocRef = doc(db, "projects", newLog.projectId);
    const projectSnap = await getDoc(projectDocRef);
    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project;

      // Find and update the specific job and task
      const updatedJobs = projectData.jobs.map(job => {
        if (job.id === timer.jobId) {
          const updatedTasks = job.tasks.map(task => {
            if (task.id === timer.taskId) {
              return {
                ...task,
                timeLogs: [...(task.timeLogs || []), newLog]
              };
            }
            return task;
          });

          // Update job allocated hours if they exist
          let updatedJob = { ...job, tasks: updatedTasks };
          if (job.allocatedHours && job.allocatedHours > 0) {
            const remainingHours = Math.max(0, job.allocatedHours - durationHours);
            updatedJob.allocatedHours = remainingHours;
          }

          return updatedJob;
        }
        return job;
      });

      // Calculate project-level statistics
      const totalTimeSpent = updatedJobs.reduce((total, job) => {
        return total + job.tasks.reduce((jobTotal, task) => {
          return jobTotal + (task.timeLogs || []).reduce((taskTotal, log) => taskTotal + log.durationMinutes, 0);
        }, 0);
      }, 0);

      const totalAllocatedHours = updatedJobs.reduce((total, job) => {
        return total + (job.allocatedHours || 0);
      }, 0);

      const totalEarnings = updatedJobs.reduce((total, job) => {
        return total + job.tasks.reduce((jobTotal, task) => {
          return jobTotal + (task.timeLogs || []).reduce((taskTotal, log) => taskTotal + (log.earnings || 0), 0);
        }, 0);
      }, 0);

      // Update project with new jobs and totals
      const updateData: any = {
        jobs: updatedJobs,
        totalTimeSpentMinutes: totalTimeSpent,
        totalAllocatedHours: totalAllocatedHours,
        totalEarnings: totalEarnings
      };

      // Filter out undefined values
      const sanitizedUpdateData = sanitizeForFirestore(updateData);

      await updateDoc(projectDocRef, sanitizedUpdateData);

      // Update time slot utilization if timer was associated with a slot
      if (timer.slotId) {
        try {
          const slotDocRef = doc(db, 'timeSlots', timer.slotId);
          const slotSnap = await getDoc(slotDocRef);

          if (slotSnap.exists()) {
            const slotData = slotSnap.data();
            const currentUtilized = slotData.hoursUtilized || 0;
            const newUtilized = currentUtilized + durationHours;
            const slotDuration = slotData.durationHours || 4; // Default to 4 hours if not set

            // Update slot utilization
            await updateDoc(slotDocRef, {
              hoursUtilized: newUtilized,
              status: newUtilized >= slotDuration ? TimeSlotStatus.COMPLETED : TimeSlotStatus.IN_PROGRESS,
              updatedAt: Timestamp.now()
            });

            console.log(`Updated time slot ${timer.slotId} utilization: ${currentUtilized}h -> ${newUtilized}h`);
          }
        } catch (slotError) {
          console.error('Error updating time slot utilization:', slotError);
          // Don't fail timer stop if slot update fails
        }
      }

      // Create notification for admin and client
      const notification: Notification = {
        id: `ntf-${Date.now()}`,
        userId: projectData.clientId,
        type: NotificationType.PROJECT_UPDATED,
        title: 'Time Logged',
        message: `${user.name} logged ${Math.floor(durationHours)}h ${durationMinutes % 60}m for task "${timer.taskTitle}" in ${projectData.title}`,
        data: { projectId: projectData.id },
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.PROJECT,
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
            type: NotificationType.DEADLINE_APPROACHING,
            title: 'Low Hours Remaining',
            message: `Task "${timer.taskTitle}" has ${Math.round(remainingHours * 60)} minutes remaining. Consider allocating more hours.`,
            data: { projectId: projectData.id },
            priority: NotificationPriority.MEDIUM,
            category: NotificationCategory.PROJECT,
            createdAt: Timestamp.now(),
            read: false
          };
          await addDoc(collection(db, "notifications"), warningNotification);
          setNotifications(prev => [...prev, warningNotification]);
        }
      }

      // Notify project team members about timer stop and time logged
      try {
        await notifyTimerStopped(projectId, jobId, taskId, timer.taskTitle, user.name, durationHours, projectData);
      } catch (error) {
        console.error('Error sending timer stop notification:', error);
        // Don't fail timer stop if notification fails
      }

      // Remove from active timers in Firestore for cross-device syncing
      const activeTimersQuery = query(
        collection(db, 'activeTimers'),
        where('userId', '==', user.id),
        where('projectId', '==', projectId),
        where('jobId', '==', jobId),
        where('taskId', '==', taskId)
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
        jobId,
        taskId,
        durationMinutes,
        pausedTime: pausedMinutes,
        idempotencyKey: timer.idempotencyKey,
        timeLogId: newLog.id
      });

      // Queue for offline sync in case stop is triggered offline
      await queueForSyncSafe('timeEntry', 'create', {
        timeLog: newLog,
        projectId,
        jobId,
        taskId,
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

      // Stop slot monitoring if it was active
      if (slotMonitoringInterval) {
        clearInterval(slotMonitoringInterval);
        setSlotMonitoringInterval(null);
      }
    }
  };

  // Helper functions for timer notifications
  const notifyTimerStarted = async (
    projectId: string,
    jobId: string,
    taskId: string,
    taskTitle: string,
    userName: string,
    projectData?: Project
  ): Promise<void> => {
    if (!projectData) return;

    // Notify client and team members (excluding the timer starter)
    const recipients = [projectData.clientId, ...projectData.assignedTeamIds].filter(
      (userId, index, arr) => arr.indexOf(userId) === index // Remove duplicates
    );

    const notifications = recipients.map(recipientId =>
      createNotification({
        userId: recipientId,
        type: NotificationType.TIMER_STARTED,
        title: 'Timer Started',
        message: `${userName} started working on "${taskTitle}" in project "${projectData.title}"`,
        data: { projectId, jobId, taskId },
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.TIMER
      })
    );

    await Promise.all(notifications);
  };

  const notifyTimerStopped = async (
    projectId: string,
    jobId: string,
    taskId: string,
    taskTitle: string,
    userName: string,
    durationHours: number,
    projectData?: Project
  ): Promise<void> => {
    if (!projectData) return;

    // Notify client and team members
    const recipients = [projectData.clientId, ...projectData.assignedTeamIds].filter(
      (userId, index, arr) => arr.indexOf(userId) === index // Remove duplicates
    );

    const durationText = durationHours >= 1
      ? `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`
      : `${Math.round(durationHours * 60)}m`;

    const notifications = recipients.map(recipientId =>
      createNotification({
        userId: recipientId,
        type: NotificationType.TIMER_STOPPED,
        title: 'Time Logged',
        message: `${userName} logged ${durationText} for "${taskTitle}" in project "${projectData.title}"`,
        data: { projectId, jobId, taskId, durationHours },
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.TIMER
      })
    );

    await Promise.all(notifications);
  };

  // Slot utilization monitoring for automatic timer stopping
  const monitorSlotUtilization = useCallback(async () => {
    if (!currentTimerKey) return;

    const timer = activeTimers[currentTimerKey];
    if (!timer || !timer.slotId) return;

    try {
      const user = JSON.parse(localStorage.getItem('architex_user') || '{}');
      if (!user.id || user.role !== UserRole.FREELANCER) return;

      // Check current slot utilization
      const slotDocRef = doc(db, 'timeSlots', timer.slotId);
      const slotSnap = await getDoc(slotDocRef);

      if (slotSnap.exists()) {
        const slotData = slotSnap.data();
        const currentUtilized = slotData.hoursUtilized || 0;
        const slotDuration = slotData.durationHours || 4; // Default to 4 hours

        // Calculate elapsed time since timer started
        const elapsedMs = Date.now() - new Date(timer.startTime).getTime();
        const elapsedHours = elapsedMs / (1000 * 60 * 60);

        // If slot would be exhausted within 1 minute of current session, stop the timer
        const projectedUtilization = currentUtilized + elapsedHours;
        const remainingTime = slotDuration - projectedUtilization;

        if (remainingTime <= 1 / 60) { // Less than 1 minute remaining
          console.log('Slot time exhausted, automatically stopping timer');

          // Stop the timer automatically
          await stopGlobalTimerAndLog(
            timer.projectId,
            timer.jobId,
            timer.taskId,
            {
              notes: 'Timer automatically stopped - allocated time slot exhausted',
              file: null
            },
            user,
            () => { } // Empty setNotifications function
          );

          // Log this action for audit
          await logAuditEvent(user, AuditAction.TIMER_AUTO_STOPPED, {
            projectId: timer.projectId,
            jobId: timer.taskId,
            taskId: timer.taskId,
            reason: 'slot_time_exhausted',
            slotId: timer.slotId,
            slotDuration,
            utilizedHours: projectedUtilization
          });
        }
      }
    } catch (error) {
      console.error('Error monitoring slot utilization:', error);
    }
  }, [currentTimerKey, activeTimers, stopGlobalTimerAndLog]);

  return {
    activeTimers,
    currentTimerKey,
    startGlobalTimer,
    resumeGlobalTimer,
    pauseGlobalTimer,
    stopGlobalTimerAndLog,
    syncTimerState,
    hasActiveTimer,
    slotMonitoringActive: slotMonitoringInterval !== null
  };
};