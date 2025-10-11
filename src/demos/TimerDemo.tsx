import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CountdownTimer } from '@/components/timer/CountdownTimer'
import { LegacyTimer } from '@/components/timer/LegacyTimer'

const TimerDemo: React.FC = () => {
  // Configuration state
  const [config, setConfig] = useState({
    initialTime: 300, // 5 minutes
    maxPauseTime: 180, // 3 minutes
    maxPauseCount: 5,
    jobCardTitle: '',
    jobCardId: '',
    projectId: '',
    autoStart: false,
    disabled: false,
  })

  // Update configuration handlers
  const handleConfigChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    const numValue = e.target.type === 'number' ? parseInt(e.target.value) : value
    
    setConfig({
      ...config,
      [key]: e.target.type === 'number' ? numValue : value
    })
  }

  // Event handlers to demonstrate timer callbacks
  const handleTimerStart = (state: any) => {
    console.log('Timer started:', state)
  }

  const handleTimerPause = (state: any) => {
    console.log('Timer paused:', state)
  }

  const handleTimerResume = (state: any) => {
    console.log('Timer resumed:', state)
  }

  const handleTimerStop = (state: any) => {
    console.log('Timer stopped:', state)
  }

  const handleTimerComplete = (state: any) => {
    console.log('Timer completed:', state)
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Timer Components Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Timer Configuration</CardTitle>
            <CardDescription>
              Adjust the settings to test different timer configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialTime">Initial Time (seconds)</Label>
                <Input
                  id="initialTime"
                  type="number"
                  value={config.initialTime}
                  onChange={handleConfigChange('initialTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPauseTime">Max Pause Time (seconds)</Label>
                <Input
                  id="maxPauseTime"
                  type="number"
                  value={config.maxPauseTime}
                  onChange={handleConfigChange('maxPauseTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPauseCount">Max Pause Count</Label>
                <Input
                  id="maxPauseCount"
                  type="number"
                  value={config.maxPauseCount}
                  onChange={handleConfigChange('maxPauseCount')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobCardTitle">Job Card Title</Label>
              <Input
                id="jobCardTitle"
                value={config.jobCardTitle}
                onChange={handleConfigChange('jobCardTitle')}
                placeholder="Optional job card title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobCardId">Job Card ID</Label>
                <Input
                  id="jobCardId"
                  value={config.jobCardId}
                  onChange={handleConfigChange('jobCardId')}
                  placeholder="Optional job card ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  value={config.projectId}
                  onChange={handleConfigChange('projectId')}
                  placeholder="Optional project ID"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={config.autoStart}
                  onChange={handleConfigChange('autoStart')}
                  className="h-4 w-4"
                />
                <Label htmlFor="autoStart">Auto Start</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="disabled"
                  checked={config.disabled}
                  onChange={handleConfigChange('disabled')}
                  className="h-4 w-4"
                />
                <Label htmlFor="disabled">Disabled</Label>
              </div>
            </div>
            
            <Button
              onClick={() => setConfig({
                initialTime: 300,
                maxPauseTime: 180,
                maxPauseCount: 5,
                jobCardTitle: '',
                jobCardId: '',
                projectId: '',
                autoStart: false,
                disabled: false,
              })}
              variant="outline"
              className="mt-2"
            >
              Reset Configuration
            </Button>
          </CardContent>
        </Card>
        
        {/* New CountdownTimer */}
        <Card>
          <CardHeader>
            <CardTitle>Shadcn/UI Timer</CardTitle>
            <CardDescription>
              New CountdownTimer component using shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CountdownTimer
              initialTime={config.initialTime}
              maxPauseTime={config.maxPauseTime}
              maxPauseCount={config.maxPauseCount}
              jobCardTitle={config.jobCardTitle || undefined}
              jobCardId={config.jobCardId || undefined}
              projectId={config.projectId || undefined}
              autoStart={config.autoStart}
              disabled={config.disabled}
              onStart={handleTimerStart}
              onPause={handleTimerPause}
              onResume={handleTimerResume}
              onStop={handleTimerStop}
              onComplete={handleTimerComplete}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Legacy Timer Example */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Timer</CardTitle>
          <CardDescription>
            LegacyTimer component providing backward compatibility with original timer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display legacy timer if we have job card ID and project ID */}
          {config.jobCardId && config.projectId ? (
            <LegacyTimer
              activeTimerInfo={{
                startTime: new Date().toISOString(),
                allocatedHours: config.initialTime / 3600,
                totalPausedTime: 0,
                isPaused: false,
                jobCardId: config.jobCardId,
                projectId: config.projectId,
              }}
              currentTimerKey={`${config.projectId}-${config.jobCardId}`}
              user={{ role: 'ADMIN' }}
              pauseGlobalTimer={async () => true}
              resumeGlobalTimer={async () => true}
              stopGlobalTimerAndLog={async () => {}}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter Job Card ID and Project ID to display legacy timer
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TimerDemo
