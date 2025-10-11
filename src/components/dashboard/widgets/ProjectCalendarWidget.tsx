import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'deadline' | 'meeting' | 'milestone' | 'review';
  date: Date;
  project: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'overdue' | 'completed';
}

const mockEvents: CalendarEvent[] = [
  {
    id: 'evt_001',
    title: 'Design Review Meeting',
    type: 'meeting',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    project: 'Office Complex Design',
    priority: 'high',
    status: 'upcoming'
  },
  {
    id: 'evt_002',
    title: 'Final Plans Submission',
    type: 'deadline',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    project: 'Residential Planning',
    priority: 'high',
    status: 'upcoming'
  },
  {
    id: 'evt_003',
    title: 'Phase 1 Completion',
    type: 'milestone',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    project: 'Urban Development',
    priority: 'medium',
    status: 'overdue'
  }
];

const ProjectCalendarWidget: React.FC = () => {
  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'milestone':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'review':
        return <Clock className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusBadge = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default">Upcoming</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <div className="space-y-4">
      {mockEvents.map((event) => (
        <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
          {getEventIcon(event.type)}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
              {getStatusBadge(event.status)}
            </div>
            
            <p className="text-sm text-muted-foreground">{event.project}</p>
            <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectCalendarWidget;
