import { useState } from 'react'
import { CountdownTimer, TimerState } from '@/components/timer/CountdownTimer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clock, Users, Settings } from 'lucide-react'

export default function CountdownTimerDemo() {
  const [timerEvents, setTimerEvents] = useState<string[]>([])
  const [userRole, setUserRole] = useState<'ADMIN' | 'FREELANCER' | 'CLIENT'>('FREELANCER')
  const [showCircularProgress, setShowCircularProgress] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showAsFloating, setShowAsFloating] = useState(false)
  const [initialTime, setInitialTime] = useState(3600) // 1 hour default

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTimerEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 9)])
  }

  const handleTimerEvent = (eventType: string, state: TimerState) => {
    const timeStr = Math.floor(state.timeRemaining / 60) + ':' + String(state.timeRemaining % 60).padStart(2, '0')
    addEvent(`${eventType} - Status: ${state.status}, Time: ${timeStr}`)
  }

  const presetTimes = [
    { label: '15 minutes', value: 900 },
    { label: '30 minutes', value: 1800 },
    { label: '1 hour', value: 3600 },
    { label: '2 hours', value: 7200 },
    { label: '4 hours', value: 14400 },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Countdown Timer Component Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the enhanced CountdownTimer with circular progress, role-based controls, and floating display options.
        </p>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standard">Standard View</TabsTrigger>
          <TabsTrigger value="circular">Circular Progress</TabsTrigger>
          <TabsTrigger value="floating">Floating Timer</TabsTrigger>
          <TabsTrigger value="roles">Role Variations</TabsTrigger>
        </TabsList>

        {/* Settings Panel */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Timer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Initial Time</Label>
                <Select value={initialTime.toString()} onValueChange={(value) => setInitialTime(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presetTimes.map(preset => (
                      <SelectItem key={preset.value} value={preset.value.toString()}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>User Role</Label>
                <Select value={userRole} onValueChange={(value: 'ADMIN' | 'FREELANCER' | 'CLIENT') => setUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="FREELANCER">Freelancer</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="circular-progress"
                    checked={showCircularProgress}
                    onCheckedChange={setShowCircularProgress}
                  />
                  <Label htmlFor="circular-progress">Circular Progress</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compact-mode"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="floating-display"
                    checked={showAsFloating}
                    onCheckedChange={setShowAsFloating}
                  />
                  <Label htmlFor="floating-display">Floating Display</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="standard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Standard Timer Display</h3>
              <CountdownTimer
                key={`standard-${initialTime}-${userRole}`}
                initialTime={initialTime}
                jobCardId="JC-001"
                jobCardTitle="Residential Complex - Phase 1 Design"
                projectId="PROJ-2025-001"
                userRole={userRole}
                showCircularProgress={showCircularProgress}
                compactMode={compactMode}
                showAsFloating={false}
                onStart={(state) => handleTimerEvent('Timer Started', state)}
                onPause={(state) => handleTimerEvent('Timer Paused', state)}
                onResume={(state) => handleTimerEvent('Timer Resumed', state)}
                onStop={(state) => handleTimerEvent('Timer Stopped', state)}
                onComplete={(state) => handleTimerEvent('Timer Completed', state)}
                onTimeUpdate={(state) => {
                  // Only log every 30 seconds to avoid spam
                  if (state.timeRemaining % 30 === 0) {
                    handleTimerEvent('Time Update', state)
                  }
                }}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timer Events Log
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {timerEvents.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No events yet. Start interacting with the timer!</p>
                    ) : (
                      timerEvents.map((event, index) => (
                        <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                          {event}
                        </div>
                      ))
                    )}
                  </div>
                  {timerEvents.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => setTimerEvents([])}
                    >
                      Clear Events
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="circular" className="space-y-4">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Circular Progress Display</h3>
            <p className="text-muted-foreground">Circular progress rings showing days, hours, minutes, and seconds.</p>
            
            <div className="flex justify-center">
              <CountdownTimer
                key={`circular-${initialTime}-${userRole}`}
                initialTime={initialTime}
                jobCardId="JC-002"
                jobCardTitle="Commercial Tower - Structural Analysis"
                projectId="PROJ-2025-002"
                userRole={userRole}
                showCircularProgress={true}
                compactMode={compactMode}
                showAsFloating={false}
                onStart={(state) => handleTimerEvent('Circular Timer Started', state)}
                onPause={(state) => handleTimerEvent('Circular Timer Paused', state)}
                onResume={(state) => handleTimerEvent('Circular Timer Resumed', state)}
                onStop={(state) => handleTimerEvent('Circular Timer Stopped', state)}
                onComplete={(state) => handleTimerEvent('Circular Timer Completed', state)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="floating" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Floating Timer Display</h3>
            <p className="text-muted-foreground">
              Legacy-style floating timer that appears in the top-right corner. Perfect for minimal screen real estate usage.
            </p>
            
            <div className="bg-muted/50 p-8 rounded-lg min-h-[400px] relative">
              <p className="text-center text-muted-foreground">
                The floating timer will appear in the top-right corner when activated.
              </p>
              
              <CountdownTimer
                key={`floating-${initialTime}-${userRole}`}
                initialTime={initialTime}
                jobCardId="JC-003"
                jobCardTitle="Urban Park - Landscape Design"
                projectId="PROJ-2025-003"
                userRole={userRole}
                showCircularProgress={showCircularProgress}
                compactMode={compactMode}
                showAsFloating={true}
                onStart={(state) => handleTimerEvent('Floating Timer Started', state)}
                onPause={(state) => handleTimerEvent('Floating Timer Paused', state)}
                onResume={(state) => handleTimerEvent('Floating Timer Resumed', state)}
                onStop={(state) => handleTimerEvent('Floating Timer Stopped', state)}
                onComplete={(state) => handleTimerEvent('Floating Timer Completed', state)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role-Based Timer Variations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admin Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Admin View
                    <Badge variant="destructive">ADMIN</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CountdownTimer
                    key={`admin-${initialTime}`}
                    initialTime={1800} // 30 minutes
                    jobCardId="JC-004"
                    jobCardTitle="Admin Task Monitor"
                    projectId="PROJ-2025-004"
                    userRole="ADMIN"
                    showCircularProgress={false}
                    compactMode={true}
                    showAsFloating={false}
                    onStart={(state) => handleTimerEvent('Admin Timer Started', state)}
                    onPause={(state) => handleTimerEvent('Admin Timer Paused', state)}
                    onResume={(state) => handleTimerEvent('Admin Timer Resumed', state)}
                    onStop={(state) => handleTimerEvent('Admin Timer Stopped', state)}
                    onComplete={(state) => handleTimerEvent('Admin Timer Completed', state)}
                  />
                </CardContent>
              </Card>

              {/* Freelancer Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Freelancer View
                    <Badge variant="default">FREELANCER</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CountdownTimer
                    key={`freelancer-${initialTime}`}
                    initialTime={2700} // 45 minutes
                    jobCardId="JC-005"
                    jobCardTitle="Freelancer Design Task"
                    projectId="PROJ-2025-005"
                    userRole="FREELANCER"
                    showCircularProgress={false}
                    compactMode={true}
                    showAsFloating={false}
                    onStart={(state) => handleTimerEvent('Freelancer Timer Started', state)}
                    onPause={(state) => handleTimerEvent('Freelancer Timer Paused', state)}
                    onResume={(state) => handleTimerEvent('Freelancer Timer Resumed', state)}
                    onStop={(state) => handleTimerEvent('Freelancer Timer Stopped', state)}
                    onComplete={(state) => handleTimerEvent('Freelancer Timer Completed', state)}
                  />
                </CardContent>
              </Card>

              {/* Client Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Client View
                    <Badge variant="secondary">CLIENT</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Timer hidden for CLIENT role</p>
                    <p className="text-xs">Clients cannot see timer interfaces</p>
                  </div>
                  
                  {/* This timer won't render due to role-based access control */}
                  <CountdownTimer
                    key={`client-${initialTime}`}
                    initialTime={1200}
                    jobCardId="JC-006"
                    jobCardTitle="Client Task"
                    projectId="PROJ-2025-006"
                    userRole="CLIENT"
                    showCircularProgress={false}
                    compactMode={true}
                    showAsFloating={false}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Timer Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🎯 Role-Based Access Control</h4>
              <p className="text-sm text-muted-foreground">
                Timer automatically hides for CLIENT role users and shows admin overrides for ADMIN role.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">⏰ 3-Minute Pause Limit</h4>
              <p className="text-sm text-muted-foreground">
                Enforces business rule of maximum 3 minutes pause time with auto-stop when exceeded.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">🔄 Circular Progress Visualization</h4>
              <p className="text-sm text-muted-foreground">
                Beautiful circular progress rings showing days, hours, minutes, and seconds breakdown.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">📱 Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                Adapts to different screen sizes with compact mode and floating display options.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">♿ Accessibility Features</h4>
              <p className="text-sm text-muted-foreground">
                ARIA live regions, keyboard navigation, screen reader compatibility, and focus management.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">🎨 shadcn/ui Integration</h4>
              <p className="text-sm text-muted-foreground">
                Built with shadcn/ui components ensuring consistent design and theme compatibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}