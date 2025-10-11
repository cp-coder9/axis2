import React, { useState } from 'react';
import { StopTimerModal } from '@/components/timer/StopTimerModal';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Switch,
  Separator
} from '@/lib/shadcn';
import { Clock, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DemoEvent {
  id: number;
  timestamp: string;
  type: 'submit' | 'close' | 'file_select' | 'error';
  data?: any;
}

export const TimerModalDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Demo configuration
  const [timeExceeded, setTimeExceeded] = useState(false);
  const [allocatedHours, setAllocatedHours] = useState(4);
  const [actualHours, setActualHours] = useState(3.5);
  const [showLoadingState, setShowLoadingState] = useState(false);

  const addEvent = (type: DemoEvent['type'], data?: any) => {
    const event: DemoEvent = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      data
    };
    setEvents(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
  };

  const handleModalSubmit = async (details: { notes: string; file: File }) => {
    addEvent('submit', {
      notesLength: details.notes.length,
      fileName: details.file.name,
      fileSize: `${(details.file.size / 1024 / 1024).toFixed(2)}MB`
    });

    if (showLoadingState) {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
    }

    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    addEvent('close');
    setIsModalOpen(false);
  };

  const openModal = (scenario: string) => {
    addEvent('open', { scenario });
    setIsModalOpen(true);
  };

  const scenarios = [
    {
      id: 'normal',
      title: 'Normal Time Usage',
      description: 'Timer completed within allocated time',
      allocated: 4,
      actual: 3.5,
      exceeded: false
    },
    {
      id: 'exceeded',
      title: 'Time Exceeded',
      description: 'Timer ran longer than allocated time',
      allocated: 4,
      actual: 5.2,
      exceeded: true
    },
    {
      id: 'no-allocation',
      title: 'No Time Allocation',
      description: 'Job card without time allocation',
      allocated: 0,
      actual: 2.3,
      exceeded: false
    },
    {
      id: 'massive-overrun',
      title: 'Massive Overrun',
      description: 'Significantly exceeded allocated time',
      allocated: 2,
      actual: 8.7,
      exceeded: true
    }
  ];

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Timer Modal Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the StopTimerModal component with shadcn/ui
        </p>
      </div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="Time Exceeded-input">Time Exceeded</label>
                    <Switch
                      checked={timeExceeded}
                      onCheckedChange={setTimeExceeded}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="Allocated Hours: {allocatedHours}h-input">Allocated Hours: {allocatedHours}h</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={allocatedHours}
                      onChange={(e) => setAllocatedHours(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="Actual Hours: {actualHours}h-input">Actual Hours: {actualHours}h</label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.1"
                      value={actualHours}
                      onChange={(e) => setActualHours(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="Show Loading State-input">Show Loading State</label>
                    <Switch
                      checked={showLoadingState}
                      onCheckedChange={setShowLoadingState}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Preview</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-muted-foreground">Allocated</div>
                      <div className="font-medium">{formatTime(allocatedHours)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Used</div>
                      <div className="font-medium">{formatTime(actualHours)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <Badge variant={timeExceeded ? 'destructive' : 'default'} className="text-xs">
                        {timeExceeded ? 'Exceeded' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => openModal('custom')}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Open Timer Modal
                </Button>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Component Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Time Summary Visualization</h4>
                      <p className="text-xs text-muted-foreground">
                        Progress bars and time allocation comparison
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Form Validation</h4>
                      <p className="text-xs text-muted-foreground">
                        Required fields with character count and file size limits
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">File Upload & Preview</h4>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop file selection with image preview
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Warning Alerts</h4>
                      <p className="text-xs text-muted-foreground">
                        Contextual alerts for time exceeded scenarios
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Unsaved Changes Protection</h4>
                      <p className="text-xs text-muted-foreground">
                        Confirmation dialog when closing with unsaved data
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Loading States</h4>
                      <p className="text-xs text-muted-foreground">
                        Visual feedback during form submission
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{scenario.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    </div>
                    <Badge variant={scenario.exceeded ? 'destructive' : 'default'}>
                      {scenario.exceeded ? 'Exceeded' : 'Normal'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-muted-foreground">Allocated</div>
                      <div className="font-medium">
                        {scenario.allocated > 0 ? formatTime(scenario.allocated) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Actual</div>
                      <div className="font-medium">{formatTime(scenario.actual)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Difference</div>
                      <div className={`font-medium ${scenario.exceeded ? 'text-destructive' : 'text-green-600'}`}>
                        {scenario.allocated > 0 
                          ? (scenario.exceeded ? '+' : '') + formatTime(Math.abs(scenario.actual - scenario.allocated))
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setAllocatedHours(scenario.allocated);
                      setActualHours(scenario.actual);
                      setTimeExceeded(scenario.exceeded);
                      openModal(scenario.id);
                    }}
                  >
                    Test Scenario
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Event Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No events yet. Interact with the timer modal to see events appear here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      <Badge variant={
                        event.type === 'submit' ? 'default' :
                        event.type === 'error' ? 'destructive' :
                        'secondary'
                      }>
                        {event.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                        </div>
                        {event.data && (
                          <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Component */}
      <StopTimerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        timeExceeded={timeExceeded}
        allocatedHours={allocatedHours > 0 ? allocatedHours : undefined}
        actualHours={actualHours}
        jobCardTitle="UI Design Review"
        projectName="Architex Dashboard Migration"
        loading={loading}
      />
    </div>
  );
};

export default TimerModalDemo;