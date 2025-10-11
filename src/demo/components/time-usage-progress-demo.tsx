import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label } from '../../lib/shadcn';
import { ShadcnTimeUsageProgress } from '../../components/timer/ShadcnTimeUsageProgress';

export const TimeUsageProgressDemo = () => {
  const [loggedMinutes, setLoggedMinutes] = useState(150); // 2.5 hours
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [variant, setVariant] = useState<'default' | 'compact' | 'detailed'>('default');
  const [showOverBudgetWarning, setShowOverBudgetWarning] = useState(true);

  const presetScenarios = [
    { name: 'Under Budget', logged: 120, estimated: 4 }, // 2h of 4h
    { name: 'Near Limit', logged: 220, estimated: 4 }, // 3.67h of 4h (91.7%)
    { name: 'Over Budget', logged: 300, estimated: 4 }, // 5h of 4h (125%)
    { name: 'Way Over', logged: 480, estimated: 4 }, // 8h of 4h (200%)
    { name: 'Minimal Usage', logged: 30, estimated: 8 }, // 0.5h of 8h (6.25%)
  ];

  const applyScenario = (scenario: typeof presetScenarios[0]) => {
    setLoggedMinutes(scenario.logged);
    setEstimatedHours(scenario.estimated);
  };

  const calculateProgress = () => {
    const estimatedMinutes = estimatedHours * 60;
    return estimatedMinutes > 0 ? (loggedMinutes / estimatedMinutes) * 100 : 0;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Usage Progress Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Visual progress indicator for time allocation tracking. Shows logged time vs estimated hours 
            with different states for normal usage, approaching limit, and over-budget scenarios.
          </p>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logged-minutes">Logged Time (minutes)</Label>
              <Input
                id="logged-minutes"
                type="number"
                value={loggedMinutes}
                onChange={(e) => setLoggedMinutes(Number(e.target.value))}
                min="0"
                step="15"
              />
              <div className="text-xs text-muted-foreground">
                = {formatTime(loggedMinutes)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-hours">Estimated Hours</Label>
              <Input
                id="estimated-hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                min="0.5"
                step="0.5"
              />
              <div className="text-xs text-muted-foreground">
                = {estimatedHours * 60} minutes
              </div>
            </div>

            <div className="space-y-2">
              <Label>Variant</Label>
              <Select value={variant} onValueChange={(value: 'default' | 'compact' | 'detailed') => setVariant(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Progress Status</Label>
              <div className="text-sm p-2 bg-muted rounded">
                {Math.round(calculateProgress())}% used
                {loggedMinutes > estimatedHours * 60 && (
                  <div className="text-red-600 font-medium">
                    {formatTime(loggedMinutes - (estimatedHours * 60))} over
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Preset Scenarios */}
          <div className="space-y-2">
            <Label>Quick Scenarios</Label>
            <div className="flex flex-wrap gap-2">
              {presetScenarios.map((scenario) => (
                <Button
                  key={scenario.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyScenario(scenario)}
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Warning Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-warning"
              checked={showOverBudgetWarning}
              onChange={(e) => setShowOverBudgetWarning(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="show-warning">Show over-budget warnings</Label>
          </div>

          {/* Demo Display */}
          <div className="space-y-6">
            <h4 className="font-medium">Preview:</h4>
            
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <ShadcnTimeUsageProgress
                loggedMinutes={loggedMinutes}
                estimatedHours={estimatedHours}
                variant={variant}
                showOverBudgetWarning={showOverBudgetWarning}
              />
            </div>
          </div>

          {/* Feature Overview */}
          <div className="text-sm text-muted-foreground space-y-2">
            <h5 className="font-medium text-foreground">Features Demonstrated:</h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Progress bar with color-coded states (green, yellow, orange, red)</li>
              <li>Three display variants: compact, default, detailed</li>
              <li>Over-budget detection and warnings</li>
              <li>Responsive layout with mobile optimization</li>
              <li>Accessible progress indicators with ARIA labels</li>
              <li>Real-time calculation updates</li>
              <li>Status badges and icons for visual feedback</li>
              <li>Detailed statistics in expanded view</li>
              <li>Duration formatting (hours and minutes)</li>
              <li>Configurable warning display</li>
            </ul>
          </div>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Logged Time:</div>
                  <div>{formatTime(loggedMinutes)}</div>
                </div>
                <div>
                  <div className="font-medium">Estimated Time:</div>
                  <div>{estimatedHours}h</div>
                </div>
                <div>
                  <div className="font-medium">Progress:</div>
                  <div>{Math.round(calculateProgress())}%</div>
                </div>
                <div>
                  <div className="font-medium">Status:</div>
                  <div className={loggedMinutes > estimatedHours * 60 ? 'text-red-600' : 'text-green-600'}>
                    {loggedMinutes > estimatedHours * 60 ? 'Over Budget' : 'Within Budget'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
