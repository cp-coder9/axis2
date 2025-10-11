import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../lib/shadcn';
import { ShadcnPersistentTimerPopup } from '../../components/timer/ShadcnPersistentTimerPopup';
import { UserRole } from '../../types';

// Mock context for demo
const mockContext = {
  activeTimers: {
    'proj-123-job-456': {
      startTime: new Date(),
      jobCardTitle: 'UI Component Migration - Timer System',
      allocatedHours: 4,
      isPaused: false,
      totalPausedTime: 0,
      pausedAt: null
    }
  },
  currentTimerKey: 'proj-123-job-456' as string | null,
  pauseGlobalTimer: async () => console.log('Pause timer called'),
  resumeGlobalTimer: async () => console.log('Resume timer called'),
  stopGlobalTimerAndLog: async () => console.log('Stop timer called'),
  user: { role: UserRole.FREELANCER, id: 'user-1', name: 'John Developer' },
  projects: [{ id: 'proj-123', title: 'Migration Project' }]
};

// Mock the useAppContext hook for demo
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockContext
}));

export default function PersistentTimerPopupDemo() {
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [timerState, setTimerState] = useState({
    isPaused: false,
    timeExceeded: false,
    allocatedHours: 4
  });

  const handleToggleTimer = () => {
    setIsTimerActive(!isTimerActive);
    // Update mock context when needed
    if (isTimerActive) {
      mockContext.currentTimerKey = null;
    } else {
      mockContext.currentTimerKey = 'proj-123-job-456';
    }
  };

  const handleTogglePause = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    mockContext.activeTimers['proj-123-job-456'].isPaused = !timerState.isPaused;
  };

  const handleToggleOvertime = () => {
    setTimerState(prev => ({ ...prev, timeExceeded: !prev.timeExceeded }));
    // Simulate overtime by setting start time far in the past
    if (!timerState.timeExceeded) {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 5); // 5 hours ago for 4h allocation
      mockContext.activeTimers['proj-123-job-456'].startTime = pastTime;
    } else {
      mockContext.activeTimers['proj-123-job-456'].startTime = new Date();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">ShadcnPersistentTimerPopup Demo</h2>
        <p className="text-muted-foreground">
          Draggable, persistent timer popup that stays on top of the application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={handleToggleTimer}
              variant={isTimerActive ? "destructive" : "default"}
            >
              {isTimerActive ? 'Hide Timer' : 'Show Timer'}
            </Button>
            
            <Button 
              onClick={handleTogglePause}
              variant="secondary"
              disabled={!isTimerActive}
            >
              Toggle Pause State
            </Button>
            
            <Button 
              onClick={handleToggleOvertime}
              variant="outline"
              disabled={!isTimerActive}
            >
              Toggle Overtime Mode
            </Button>
            
            <Button 
              onClick={() => {
                // Reset timer state
                setTimerState({ isPaused: false, timeExceeded: false, allocatedHours: 4 });
                mockContext.activeTimers['proj-123-job-456'] = {
                  ...mockContext.activeTimers['proj-123-job-456'],
                  startTime: new Date(),
                  isPaused: false,
                  totalPausedTime: 0
                };
              }}
              variant="outline"
              disabled={!isTimerActive}
            >
              Reset Timer
            </Button>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Current State:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Timer Active: {isTimerActive ? 'Yes' : 'No'}</li>
              <li>Paused: {timerState.isPaused ? 'Yes' : 'No'}</li>
              <li>Overtime: {timerState.timeExceeded ? 'Yes' : 'No'}</li>
              <li>Allocated: {timerState.allocatedHours}h</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Draggable:</strong> Click and drag the timer to move it around</li>
            <li>✅ <strong>Minimizable:</strong> Click the minimize button to collapse to icon</li>
            <li>✅ <strong>State Indicators:</strong> Visual feedback for running, paused, and overtime states</li>
            <li>✅ <strong>Real-time Updates:</strong> Timer counts up/down based on allocation</li>
            <li>✅ <strong>Pause Warnings:</strong> Alerts when approaching pause time limits</li>
            <li>✅ <strong>Role-based Controls:</strong> Buttons enabled/disabled based on permissions</li>
            <li>✅ <strong>Accessibility:</strong> ARIA labels, live regions, keyboard navigation</li>
            <li>✅ <strong>Browser Notifications:</strong> System notifications for overtime</li>
          </ul>
        </CardContent>
      </Card>

      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> The persistent timer popup appears as a floating, draggable card. 
          In a real application, it would maintain its position across page navigation and 
          show the actual running timer data from the global context.
        </p>
      </div>

      {/* Render the persistent timer popup when active */}
      {isTimerActive && <ShadcnPersistentTimerPopup />}
    </div>
  );
}
