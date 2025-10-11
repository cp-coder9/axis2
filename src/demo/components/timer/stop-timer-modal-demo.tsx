import { useState } from 'react';
import { ShadcnStopTimerModal } from '../../../components/timer/ShadcnStopTimerModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '../../../lib/shadcn';

/**
 * Demo component for ShadcnStopTimerModal
 * 
 * This component demonstrates the migrated stop timer modal using shadcn/ui components.
 * 
 * Features demonstrated:
 * - Dialog component for modal presentation
 * - Form components with validation (react-hook-form + zod)
 * - File upload with preview and size display
 * - Time summary with overtime warnings
 * - Accessible form controls and error handling
 * - Responsive design and proper typography
 * 
 * @component
 * @example
 * ```tsx
 * <StopTimerModalDemo />
 * ```
 */
export default function StopTimerModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOvertimeVersion, setShowOvertimeVersion] = useState(false);

  const handleSubmit = async (details: { notes?: string; file?: File }) => {
    console.log('Timer stopped with details:', details);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stop Timer Modal - shadcn/ui Migration</CardTitle>
          <CardDescription>
            Enhanced timer stop interface with form validation and file upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>Key Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Dialog component for accessible modal presentation</li>
              <li>Form components with react-hook-form integration</li>
              <li>Zod schema validation for form inputs</li>
              <li>File upload with preview and size formatting</li>
              <li>Time summary showing allocated vs actual hours</li>
              <li>Alert component for overtime warnings</li>
              <li>Accessible form controls with proper labels</li>
              <li>Loading states and disabled button management</li>
            </ul>
            
            <p className="mt-4">
              <strong>Migration Highlights:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Replaced custom Modal with shadcn/ui Dialog component</li>
              <li>Implemented Form components with validation</li>
              <li>Enhanced file upload with visual feedback</li>
              <li>Added proper ARIA attributes and descriptions</li>
              <li>Improved error handling and user feedback</li>
              <li>Maintained all existing functionality</li>
              <li>Enhanced accessibility and keyboard navigation</li>
              <li>Added overtime detection and warnings</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
          <CardDescription>
            Test different modal states and scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setShowOvertimeVersion(false);
                setIsModalOpen(true);
              }}
            >
              Show Normal Timer Stop
            </Button>
            <Button 
              onClick={() => {
                setShowOvertimeVersion(true);
                setIsModalOpen(true);
              }}
              variant="destructive"
            >
              Show Overtime Timer Stop
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Click the buttons above to see different modal states. The overtime version 
            shows warnings and requires notes to be entered.
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      <ShadcnStopTimerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        timeExceeded={showOvertimeVersion}
        allocatedHours={showOvertimeVersion ? 4 : 6}
        actualHours={showOvertimeVersion ? 5.5 : 3.2}
      />
    </div>
  );
}
