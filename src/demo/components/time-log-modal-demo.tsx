import { useState } from 'react';
import { Button } from '../../lib/shadcn';
import { ShadcnTimeLogModal } from '../../components/timer/ShadcnTimeLogModal';
import { ManualLogData } from '../../types';

export default function TimeLogModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastLogData, setLastLogData] = useState<ManualLogData | null>(null);

  const handleSubmit = async (logData: ManualLogData) => {
    // Simulate API call
    console.log('Submitting time log:', logData);
    setLastLogData(logData);
    
    // Show success message
    alert(`Time logged successfully!\nDuration: ${Math.floor(logData.durationMinutes / 60)}h ${logData.durationMinutes % 60}m`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">ShadcnTimeLogModal Demo</h2>
        <p className="text-muted-foreground">
          Manual time entry modal with form validation and file upload
        </p>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Open Time Log Modal
        </Button>

        {lastLogData && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Last Logged Entry:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Start:</strong> {new Date(lastLogData.startTime).toLocaleTimeString()}</p>
              <p><strong>End:</strong> {new Date(lastLogData.endTime).toLocaleTimeString()}</p>
              <p><strong>Duration:</strong> {formatDuration(lastLogData.durationMinutes)}</p>
              {lastLogData.notes && <p><strong>Notes:</strong> {lastLogData.notes}</p>}
              {lastLogData.file && <p><strong>File:</strong> {lastLogData.file.name}</p>}
              <p><strong>Manual Entry:</strong> {lastLogData.manualEntry ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </div>

      <ShadcnTimeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        jobCardTitle="UI Component Migration - Timer System"
      />
    </div>
  );
}
