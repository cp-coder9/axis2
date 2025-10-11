import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { useRealtimeTimerSync, type RealtimeTimerState, type TimerConflict } from '../../hooks/useRealtimeTimerSync'
import { formatTime } from '../../utils/timeUtils'

interface TimerSyncStatusProps {
  userId: string | null
  className?: string
  showDetailedStatus?: boolean
}

interface ConflictResolutionDialogProps {
  isOpen: boolean
  conflict: TimerConflict | null
  onResolve: (resolution: 'accept_local' | 'accept_remote' | 'merge') => void
  onClose: () => void
}

/**
 * Timer Sync Status Component
 * 
 * Displays real-time synchronization status and handles conflict resolution
 * for timer state across devices and browser tabs.
 */
export const TimerSyncStatus: React.FC<TimerSyncStatusProps> = ({
  userId,
  className = '',
  showDetailedStatus = false
}) => {
  const {
    syncState,
    resolveConflict,
    clearSyncError
  } = useRealtimeTimerSync(userId)

  const getSyncStatusIcon = () => {
    if (syncState.conflictDetected) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    }
    if (syncState.syncError) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    if (syncState.isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />
    }
    return <WifiOff className="h-4 w-4 text-gray-400" />
  }

  const getSyncStatusText = () => {
    if (syncState.conflictDetected) {
      return 'Sync Conflict'
    }
    if (syncState.syncError) {
      return 'Sync Error'
    }
    if (syncState.isConnected) {
      return 'Synced'
    }
    return 'Disconnected'
  }

  const getSyncStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (syncState.conflictDetected) {
      return 'destructive'
    }
    if (syncState.syncError) {
      return 'destructive'
    }
    if (syncState.isConnected) {
      return 'default'
    }
    return 'secondary'
  }

  if (!userId) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Sync Status Badge */}
      <Badge variant={getSyncStatusVariant()} className="flex items-center gap-1">
        {getSyncStatusIcon()}
        <span className="text-xs">{getSyncStatusText()}</span>
      </Badge>

      {/* Last Sync Time (detailed view) */}
      {showDetailedStatus && syncState.lastSyncTime && (
        <span className="text-xs text-muted-foreground">
          Last sync: {new Date(syncState.lastSyncTime).toLocaleTimeString()}
        </span>
      )}

      {/* Sync Error Alert */}
      {syncState.syncError && (
        <Alert className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Timer sync error: {syncState.syncError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSyncError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        isOpen={syncState.conflictDetected}
        conflict={syncState.conflictData}
        onResolve={resolveConflict}
        onClose={() => resolveConflict('accept_remote')} // Default to server wins
      />
    </div>
  )
}

/**
 * Conflict Resolution Dialog
 * 
 * Allows users to resolve timer synchronization conflicts between local and remote state.
 */
const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  conflict,
  onResolve,
  onClose
}) => {
  if (!conflict) return null

  const getConflictDescription = () => {
    switch (conflict.conflictType) {
      case 'different_timer':
        return 'You have a different timer running on another device. Which timer would you like to keep?'
      case 'state_mismatch':
        return 'Your timer state is different from another device. Which state is correct?'
      case 'time_drift':
        return 'Timer start times are significantly different between devices. Which time is correct?'
      default:
        return 'A timer synchronization conflict has been detected.'
    }
  }

  const formatTimerInfo = (timer: any) => {
    const status = timer.isPaused ? 'Paused' : 'Running'
    const startTime = new Date(timer.startTime).toLocaleTimeString()
    
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="font-medium">{timer.jobCardTitle}</div>
        <div className="text-sm text-muted-foreground">
          Project: {timer.projectId}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={timer.isPaused ? 'secondary' : 'default'}>
            {status}
          </Badge>
          <span>Started: {startTime}</span>
        </div>
        {timer.allocatedHours && (
          <div className="text-sm text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            {formatTime(timer.allocatedHours * 3600)} allocated
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Timer Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            {getConflictDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Local Timer */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                This Device
              </span>
            </h4>
            {formatTimerInfo(conflict.local)}
          </div>

          {/* Remote Timer */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                Other Device
              </span>
            </h4>
            {formatTimerInfo(conflict.remote)}
          </div>

          {/* Conflict Details */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conflict Type:</strong> {conflict.conflictType.replace('_', ' ')}
              <br />
              <strong>Detected:</strong> {new Date(conflict.detectedAt).toLocaleString()}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onResolve('accept_local')}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Keep This Device
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onResolve('accept_remote')}
            className="flex items-center gap-2"
          >
            <Wifi className="h-4 w-4" />
            Keep Other Device
          </Button>
          
          {conflict.conflictType !== 'different_timer' && (
            <Button
              onClick={() => onResolve('merge')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Merge Both
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TimerSyncStatus
