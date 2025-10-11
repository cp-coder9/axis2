import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../lib/shadcn';
import { ShadcnEnhancedStopTimerModal } from '../../components/timer/ShadcnEnhancedStopTimerModal';

export const EnhancedStopTimerModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenario, setScenario] = useState<'normal' | 'exceeded'>('normal');

  const handleSubmit = (details: { notes: string; file: File }) => {
    console.log('Timer stopped with details:', details);
    setIsModalOpen(false);
  };

  const scenarios = {
    normal: {
      timeExceeded: false,
      allocatedHours: 4,
      actualHours: 2.5,
      description: 'Normal scenario - within time allocation'
    },
    exceeded: {
      timeExceeded: true,
      allocatedHours: 4,
      actualHours: 5.25,
      description: 'Time exceeded scenario - over allocated hours'
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Stop Timer Modal Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This modal appears when stopping a timer and requires work description and substantiation file.
            It shows time allocation progress and warnings for exceeded time.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Test Scenarios:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(scenarios).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={key}
                      name="scenario"
                      checked={scenario === key}
                      onChange={() => setScenario(key as 'normal' | 'exceeded')}
                      className="h-4 w-4"
                    />
                    <label htmlFor={key} className="text-sm">
                      {config.description}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsModalOpen(true)}>
                Open Enhanced Stop Modal
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <h5 className="font-medium">Features Demonstrated:</h5>
              <ul className="list-disc list-inside space-y-1">
                <li>Time allocation progress with visual indicators</li>
                <li>Form validation with react-hook-form and zod</li>
                <li>File upload with preview for images</li>
                <li>Over-budget warnings and alerts</li>
                <li>Accessible form controls with proper ARIA labels</li>
                <li>Responsive design with mobile optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShadcnEnhancedStopTimerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        timeExceeded={scenarios[scenario].timeExceeded}
        allocatedHours={scenarios[scenario].allocatedHours}
        actualHours={scenarios[scenario].actualHours}
      />
    </div>
  );
};
