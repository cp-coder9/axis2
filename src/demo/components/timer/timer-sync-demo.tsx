import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTimerSync } from '../../../contexts/modules/timerSync';
import { useAppContext } from '../../../contexts/AppContext';
import CountdownTimer from '../../../components/timer/CountdownTimer';
import { 
  Play, 
  Pause, 
  Square, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Timer as TimerIcon,
  Zap,
  Users,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimerSyncDemo() {
  const {
    activeTimer,
    isLoading,
    isOnline,
    syncStatus,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    syncAllTimers,
    resolveConflict,
    hasConflict,
    conflictData
  } = useTimerSync();

  const { user } = useAppContext();

  // Demo state for testing
  const [demoProjectId, setDemoProjectId] = useState('demo-project-1');
  const [demoJobCardId, setDemoJobCardId] = useState('task-001');
  const [demoJobCardTitle, setDemoJobCardTitle] = useState('User Interface Design');
  const [demoAllocatedHours, setDemoAllocatedHours] = useState(2.5);
  const [stopNotes, setStopNotes] = useState('');
  const [syncEvents, setSyncEvents] = useState<string[]>([]);

  // Track sync events for demonstration
  useEffect(() => {
    const addSyncEvent = (event: string) => {
      setSyncEvents(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${event}`]);
    };

    if (activeTimer) {
      addSyncEvent(`Timer active: ${activeTimer.jobCardTitle || 'Unknown Task'}`);
    }

    if (syncStatus) {
      addSyncEvent(`Sync status: ${syncStatus}`);
    }

    if (hasConflict) {
      addSyncEvent('⚠️ Timer conflict detected');
    }
  }, [activeTimer, syncStatus, hasConflict]);

  const handleStartDemo = async () => {
    const success = await startTimer(demoProjectId, demoJobCardId, demoJobCardTitle, demoAllocatedHours);
    if (success) {
      setSyncEvents(prev => [...prev, `${new Date().toLocaleTimeString()}: Started timer for ${demoJobCardTitle}`]);
    }
  };

  const handleStopDemo = async () => {
    const success = await stopTimer(stopNotes, 'completed');
    if (success) {
      setSyncEvents(prev => [...prev, `${new Date().toLocaleTimeString()}: Stopped timer with notes`]);
      setStopNotes('');
    }
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'connected':
        return { 
          icon: <Wifi className="h-4 w-4" />, 
          color: 'text-green-600', 
          bg: 'bg-green-50 border-green-200',
          label: 'Connected' 
        };
      case 'disconnected':
        return { 
          icon: <WifiOff className="h-4 w-4" />, 
          color: 'text-red-600', 
          bg: 'bg-red-50 border-red-200',
          label: 'Disconnected' 
        };
      case 'syncing':
        return { 
          icon: <RefreshCw className="h-4 w-4 animate-spin" />, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50 border-blue-200',
          label: 'Syncing' 
        };
      case 'error':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-orange-600', 
          bg: 'bg-orange-50 border-orange-200',
          label: 'Error' 
        };
      default:
        return { 
          icon: <Clock className="h-4 w-4" />, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50 border-gray-200',
          label: 'Unknown' 
        };
    }
  };

  const statusInfo = getSyncStatusInfo();

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Timer Synchronization Demo</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Demonstrates real-time timer synchronization across devices with conflict resolution, 
          offline support, and multi-user awareness.
        </p>
      </div>

      {/* Sync Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Synchronization Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className={cn("p-4 rounded-lg border", statusInfo.bg)}>
              <div className={cn("flex items-center gap-2 mb-2", statusInfo.color)}>
                {statusInfo.icon}
                <span className="font-medium">{statusInfo.label}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            {/* Active Timer Status */}
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <TimerIcon className="h-4 w-4" />
                <span className="font-medium">Active Timer</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {activeTimer ? 'Running' : 'None'}
              </div>
            </div>

            {/* Loading Status */}
            <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2 text-purple-600">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Operations</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? 'Processing...' : 'Ready'}
              </div>
            </div>

            {/* User Status */}
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2 text-green-600">
                <Users className="h-4 w-4" />
                <span className="font-medium">User</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.name || 'Not logged in'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution */}
      {hasConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Timer conflict detected! Multiple devices are trying to update the same timer.
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resolveConflict('local')}
              >
                Use Local
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resolveConflict('remote')}
              >
                Use Remote
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resolveConflict('merge')}
              >
                Merge Changes
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demo">Timer Demo</TabsTrigger>
          <TabsTrigger value="integrated">Integrated Timer</TabsTrigger>
          <TabsTrigger value="sync">Sync Controls</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        {/* Timer Demo Controls */}
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timer Sync Demo Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Timer Display */}
              {activeTimer && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{activeTimer.jobCardTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Project: {activeTimer.projectId} • Task: {activeTimer.jobCardId}
                      </p>
                    </div>
                    <Badge variant={activeTimer.isRunning ? 'default' : 'secondary'}>
                      {activeTimer.isRunning ? 'Running' : 'Paused'}
                    </Badge>
                  </div>
                  
                  {activeTimer.timeRemaining !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining</span>
                        <span className="font-mono">{formatTimeRemaining(activeTimer.timeRemaining)}</span>
                      </div>
                      <Progress value={((activeTimer.allocatedHours * 3600 - activeTimer.timeRemaining) / (activeTimer.allocatedHours * 3600)) * 100} />
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {activeTimer.isRunning ? (
                      <Button size="sm" variant="secondary" onClick={pauseTimer}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" onClick={resumeTimer}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={handleStopDemo}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}

              {/* Start New Timer */}
              {!activeTimer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectId">Project ID</Label>
                      <Input
                        id="projectId"
                        value={demoProjectId}
                        onChange={(e) => setDemoProjectId(e.target.value)}
                        placeholder="Enter project ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobCardId">Job Card ID</Label>
                      <Input
                        id="jobCardId"
                        value={demoJobCardId}
                        onChange={(e) => setDemoJobCardId(e.target.value)}
                        placeholder="Enter job card ID"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="jobCardTitle">Task Title</Label>
                      <Input
                        id="jobCardTitle"
                        value={demoJobCardTitle}
                        onChange={(e) => setDemoJobCardTitle(e.target.value)}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="allocatedHours">Allocated Hours</Label>
                      <Input
                        id="allocatedHours"
                        type="number"
                        step="0.5"
                        value={demoAllocatedHours}
                        onChange={(e) => setDemoAllocatedHours(parseFloat(e.target.value))}
                        placeholder="2.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stop Timer Notes */}
              {activeTimer && (
                <div className="space-y-2">
                  <Label htmlFor="stopNotes">Stop Notes (Optional)</Label>
                  <Textarea
                    id="stopNotes"
                    value={stopNotes}
                    onChange={(e) => setStopNotes(e.target.value)}
                    placeholder="Add notes about the work completed..."
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!activeTimer ? (
                  <Button onClick={handleStartDemo} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Timer
                  </Button>
                ) : null}
                
                <Button variant="outline" onClick={syncAllTimers} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Force Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrated CountdownTimer */}
        <TabsContent value="integrated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrated CountdownTimer with Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <CountdownTimer
                  initialTime={demoAllocatedHours * 3600} // Convert hours to seconds
                  jobCardId={demoJobCardId}
                  jobCardTitle={demoJobCardTitle}
                  projectId={demoProjectId}
                  maxPauseTime={180} // 3 minutes
                  maxPauseCount={5}
                  userRole="FREELANCER"
                  showCircularProgress={false}
                  compactMode={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Controls */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={syncAllTimers} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Sync All Timers
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Simulate New Device
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Network Status</h3>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {isOnline ? 'Connected to internet' : 'Offline mode active'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Sync Status</h3>
                <Badge variant={syncStatus === 'connected' ? 'default' : 'secondary'}>
                  {syncStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Log */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No sync events yet. Start a timer to see real-time synchronization.
                  </p>
                ) : (
                  syncEvents.map((event, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                      {event}
                    </div>
                  ))
                )}
              </div>
              
              {syncEvents.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSyncEvents([])}
                  className="mt-4"
                >
                  Clear Events
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Timer Sync Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Real-time Sync
              </div>
              <p className="text-muted-foreground">
                Timer state synchronized across all devices and tabs in real-time.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Conflict Resolution
              </div>
              <p className="text-muted-foreground">
                Intelligent conflict detection with user-choice resolution strategies.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Offline Support
              </div>
              <p className="text-muted-foreground">
                Continue working offline with automatic sync when connection is restored.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Multi-device Awareness
              </div>
              <p className="text-muted-foreground">
                Detect and handle timer operations from multiple devices gracefully.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Optimistic Updates
              </div>
              <p className="text-muted-foreground">
                Immediate UI feedback with reliable background synchronization.
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Error Recovery
              </div>
              <p className="text-muted-foreground">
                Robust error handling with automatic retry and fallback mechanisms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
