import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'milestone' | 'team' | 'feedback' | 'system';
}

interface RecentActivityWidgetProps {
  activities?: ActivityItem[];
  maxItems?: number;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activities = [
    {
      id: '1',
      title: 'Project milestone completed',
      description: 'Residential Complex Design - Phase 2',
      timestamp: '2 hours ago',
      type: 'milestone'
    },
    {
      id: '2',
      title: 'New team member joined',
      description: 'Sarah Johnson - Senior Architect',
      timestamp: '5 hours ago',
      type: 'team'
    },
    {
      id: '3',
      title: 'Client feedback received',
      description: 'Commercial Tower Planning - Revision requested',
      timestamp: '1 day ago',
      type: 'feedback'
    },
    {
      id: '4',
      title: 'System maintenance completed',
      description: 'Database optimization and backup',
      timestamp: '2 days ago',
      type: 'system'
    }
  ],
  maxItems = 10
}) => {
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-blue-500';
      case 'team': return 'bg-green-500';
      case 'feedback': return 'bg-orange-500';
      case 'system': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Activity</h3>
        <Badge variant="outline">{activities.length} updates</Badge>
      </div>
      
      <ScrollArea className="h-48">
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {activity.timestamp}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecentActivityWidget;