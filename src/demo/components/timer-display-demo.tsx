import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../lib/shadcn';
import { ShadcnTimerDisplay } from '../../components/timer/ShadcnTimerDisplay';
import { UserRole } from '../../types';

export const TimerDisplayDemo = () => {
  const [position, setPosition] = useState<'fixed' | 'relative'>('relative');
  const [variant, setVariant] = useState<'default' | 'compact' | 'minimal'>('default');
  const [showDemo, setShowDemo] = useState(true);

  // Mock active timers data
  const mockActiveTimers = {
    'proj-123-job-456': {
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      jobCardTitle: 'UI Component Migration - Timer System',
      allocatedHours: 4,
      isPaused: false,
      totalPausedTime: 0,
      pausedAt: null
    },
    'proj-124-job-789': {
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      jobCardTitle: 'Database Schema Updates',
      allocatedHours: 2,
      isPaused: true,
      totalPausedTime: 300, // 5 minutes
      pausedAt: new Date(Date.now() - 600000) // Paused 10 minutes ago
    }
  };

  const mockUser = { role: UserRole.FREELANCER };

  const handlePause = (projectId: string, jobCardId: string) => {
    console.log('Pause timer:', projectId, jobCardId);
  };

  const handleResume = (projectId: string, jobCardId: string) => {
    console.log('Resume timer:', projectId, jobCardId);
  };

  const handleStop = (projectId: string, jobCardId: string, details?: any) => {
    console.log('Stop timer:', projectId, jobCardId, details);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Timer Display Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Active timer display showing real-time countdown with pause/resume/stop controls.
            Supports multiple simultaneous timers with different states.
          </p>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Position-input">Position</label>
              <Select value={position} onValueChange={(value: 'fixed' | 'relative') => setPosition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="fixed">Fixed (Top-Right)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Variant-input">Variant</label>
              <Select value={variant} onValueChange={(value: 'default' | 'compact' | 'minimal') => setVariant(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="Demo Control-input">Demo Control</label>
              <Button 
                onClick={() => setShowDemo(!showDemo)}
                variant={showDemo ? "default" : "outline"}
                className="w-full"
              >
                {showDemo ? 'Hide Demo' : 'Show Demo'}
              </Button>
            </div>
          </div>

          {/* Feature Overview */}
          <div className="text-sm text-muted-foreground space-y-2">
            <h5 className="font-medium text-foreground">Features Demonstrated:</h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time timer countdown with seconds precision</li>
              <li>Multiple timer support with individual controls</li>
              <li>Pause/Resume functionality with visual state indicators</li>
              <li>Stop timer with modal integration</li>
              <li>Three display variants: default, compact, minimal</li>
              <li>Fixed and relative positioning options</li>
              <li>Responsive design for mobile and desktop</li>
              <li>Role-based visibility (hidden for client users)</li>
              <li>Visual indicators for active vs paused states</li>
              <li>Truncated task titles with hover tooltips</li>
            </ul>
          </div>

          {/* Demo Area */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-[200px] relative">
            <div className="text-center text-muted-foreground mb-4">
              Timer Display Demo Area
              {!showDemo && <div className="text-sm mt-2">Click "Show Demo" to view timers</div>}
            </div>
            
            {showDemo && (
              <ShadcnTimerDisplay
                position={position}
                variant={variant}
                activeTimers={mockActiveTimers}
                user={mockUser}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
                className={position === 'relative' ? 'relative top-0 right-0' : ''}
              />
            )}
          </div>

          {/* Timer State Information */}
          {showDemo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mock Timer Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockActiveTimers).map(([key, timer]) => (
                    <div key={key} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium">{timer.jobCardTitle}</div>
                      <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                        <div>Status: {timer.isPaused ? 'Paused' : 'Active'}</div>
                        <div>Allocated: {timer.allocatedHours}h</div>
                        <div>Started: {new Date(timer.startTime).toLocaleTimeString()}</div>
                        <div>Key: {key}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
