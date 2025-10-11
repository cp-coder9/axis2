import React, { useState } from 'react';
import EnhancedTimerDisplay from '@/components/timer/EnhancedTimerDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/shadcn';
import { Button } from '@/lib/shadcn';
import { Badge } from '@/lib/shadcn';
import { Switch } from '@/lib/shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/shadcn';
import { Separator } from '@/lib/shadcn';

// Demo component showcasing EnhancedTimerDisplay features
export default function EnhancedTimerDemo() {
  // Configuration state
  const [isCompact, setIsCompact] = useState(false);
  const [isFloating, setIsFloating] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Event logging state
  const [events, setEvents] = useState<string[]>([]);
  
  // Log events for demonstration
  const logEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 9)]);
  };

  // Event handlers
  const handlePause = () => logEvent('Timer paused');
  const handleResume = () => logEvent('Timer resumed');
  const handleStop = () => logEvent('Timer stopped');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Timer Display Demo</h1>
        <p className="text-muted-foreground">
          Compact floating widget with role-based access control and assignment validation
        </p>
      </div>

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="interactive">Interactive Demo</TabsTrigger>
          <TabsTrigger value="roles">Role Variations</TabsTrigger>
          <TabsTrigger value="states">Timer States</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Views</TabsTrigger>
        </TabsList>

        {/* Interactive Demo Tab */}
        <TabsContent value="interactive" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="compact-mode" className="text-sm font-medium" htmlFor="Compact Mode-input">Compact Mode</label>
                  <Switch 
                    id="compact-mode"
                    checked={isCompact} 
                    onCheckedChange={setIsCompact}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="Floating Position-input">Floating Position</label>
                  <Switch 
                    checked={isFloating} 
                    onCheckedChange={setIsFloating}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="Show Controls-input">Show Controls</label>
                  <Switch 
                    checked={showControls} 
                    onCheckedChange={setShowControls}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Current Configuration:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <Badge variant="outline">{isCompact ? 'Compact' : 'Full Widget'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <Badge variant="outline">{isFloating ? 'Floating' : 'Inline'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Controls:</span>
                      <Badge variant="outline">{showControls ? 'Visible' : 'Hidden'}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Log */}
            <Card>
              <CardHeader>
                <CardTitle>Event Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 h-48 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Interact with the timer to see events
                    </div>
                  ) : (
                    events.map((event, index) => (
                      <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                        {event}
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setEvents([])}
                >
                  Clear Log
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Live Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative min-h-[200px] border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Timer widget will appear {isFloating ? 'floating in the top-right corner' : 'inline below'}:
                </div>
                
                <EnhancedTimerDisplay
                  compact={isCompact}
                  floating={isFloating}
                  showControls={showControls}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  className={!isFloating ? 'relative top-0 right-0' : ''}
                />
                
                {!isFloating && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    ↑ Inline timer widget display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Variations Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role-Based Timer Display</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Different roles see different timer interfaces and capabilities
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin Role */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">ADMIN</Badge>
                    <span className="text-sm font-medium">Administrator View</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Admins can monitor all timers and override controls when needed
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> "Admin View: Timer Active" / "Overtime Monitoring"</div>
                      <div><strong>Tooltip:</strong> "You can monitor all timer activity and override controls if needed"</div>
                      <div><strong>Special Features:</strong> Override capabilities, overtime alerts, full access</div>
                      <div><strong>Controls:</strong> Always enabled regardless of assignment</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Freelancer Role */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">FREELANCER</Badge>
                    <span className="text-sm font-medium">Freelancer View</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Freelancers see detailed time tracking with allocation awareness
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> "Time Remaining" / "Timer Paused" / "Time Exceeded"</div>
                      <div><strong>Tooltip:</strong> "Working on allocated 4h task. Track your time carefully."</div>
                      <div><strong>Features:</strong> Pause warnings, time allocation display, overtime notices</div>
                      <div><strong>Controls:</strong> Enabled only when assigned to task</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Client Role */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">CLIENT</Badge>
                    <span className="text-sm font-medium">Client View</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Clients see minimal timer information for project awareness
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div><strong>Display:</strong> Timer component is completely hidden</div>
                      <div><strong>Rationale:</strong> Clients Don't need timer controls</div>
                      <div><strong>Alternative:</strong> Project status updates via other components</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timer States Tab */}
        <TabsContent value="states" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Running State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  Running State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div><strong>Status:</strong> Active timer counting down</div>
                  <div><strong>Display:</strong> Time remaining in MM:SS format</div>
                  <div><strong>Controls:</strong> Pause and Stop buttons enabled</div>
                  <div><strong>Badge:</strong> Green "RUNNING" status</div>
                  <div><strong>Icon:</strong> Timer icon with animation</div>
                </div>
              </CardContent>
            </Card>

            {/* Paused State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Paused State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div><strong>Status:</strong> Timer temporarily stopped</div>
                  <div><strong>Display:</strong> Last known time remaining</div>
                  <div><strong>Controls:</strong> Resume and Stop buttons</div>
                  <div><strong>Badge:</strong> Yellow "PAUSED" status</div>
                  <div><strong>Warning:</strong> 3-minute pause limit enforcement</div>
                </div>
              </CardContent>
            </Card>

            {/* Time Exceeded State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Time Exceeded
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div><strong>Status:</strong> Overtime mode active</div>
                  <div><strong>Display:</strong> "+MM:SS" overtime format</div>
                  <div><strong>Controls:</strong> Stop button prominent</div>
                  <div><strong>Badge:</strong> Red "OVERTIME" status</div>
                  <div><strong>Alert:</strong> Visual warning indicators</div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  Assignment Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div><strong>Check:</strong> User assignment to job card</div>
                  <div><strong>Disabled:</strong> Controls grayed out if not assigned</div>
                  <div><strong>Tooltip:</strong> "You are not assigned to this task"</div>
                  <div><strong>Admin Override:</strong> Admins can always control</div>
                  <div><strong>Visual:</strong> Disabled state styling</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mobile Views Tab */}
        <TabsContent value="mobile" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Responsive Design</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Timer widget adapts to different screen sizes and orientations
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mobile Compact View */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Compact Mobile View</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30">
                    <div className="max-w-sm mx-auto">
                      <EnhancedTimerDisplay
                        compact={true}
                        floating={false}
                        showControls={true}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Optimized for mobile screens with minimal space usage
                  </div>
                </div>

                <Separator />

                {/* Mobile Features */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Mobile Features</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Touch Interactions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Touch-friendly button sizing</li>
                        <li>• Swipe gestures (future enhancement)</li>
                        <li>• Haptic feedback support</li>
                        <li>• Long-press for additional options</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Responsive Behavior</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Automatic text truncation</li>
                        <li>• Collapsible information sections</li>
                        <li>• Adaptive control layouts</li>
                        <li>• Portrait/landscape optimization</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Breakpoint Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Responsive Breakpoints</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div><strong>sm (640px+):</strong> Compact controls, single row layout</div>
                      <div><strong>md (768px+):</strong> Full controls, expanded information</div>
                      <div><strong>lg (1024px+):</strong> Complete widget with all features</div>
                      <div><strong>xl (1280px+):</strong> Enhanced tooltips and animations</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}