import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Users, Trophy, TrendingUp, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  hoursThisWeek: number;
  efficiency: number;
  activeProjects: number;
  avatar?: string;
}

interface TeamPerformanceWidgetProps {
  userRole?: 'admin' | 'freelancer' | 'client';
}

const mockTeamData: TeamMember[] = [
  {
    id: 'user_001',
    name: 'Sarah Chen',
    role: 'Senior Architect',
    hoursThisWeek: 42.5,
    efficiency: 94,
    activeProjects: 3,
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 'user_002', 
    name: 'Mike Rodriguez',
    role: 'Project Manager',
    hoursThisWeek: 38.2,
    efficiency: 87,
    activeProjects: 5,
    avatar: '/avatars/mike.jpg'
  },
  {
    id: 'user_003',
    name: 'Emily Watson',
    role: 'Design Specialist',
    hoursThisWeek: 35.7,
    efficiency: 91,
    activeProjects: 2,
    avatar: '/avatars/emily.jpg'
  },
  {
    id: 'user_004',
    name: 'David Kim',
    role: 'Junior Architect', 
    hoursThisWeek: 40.1,
    efficiency: 82,
    activeProjects: 2,
    avatar: '/avatars/david.jpg'
  }
];

const TeamPerformanceWidget: React.FC<TeamPerformanceWidgetProps> = ({ userRole = 'admin' }) => {
  const formatHours = (hours: number) => {
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadgeVariant = (efficiency: number) => {
    if (efficiency >= 90) return 'default';
    if (efficiency >= 80) return 'secondary';
    return 'destructive';
  };

  // Hide sensitive data for client role
  if (userRole === 'client') {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Team performance data not available for client view</p>
      </div>
    );
  }

  const totalHours = mockTeamData.reduce((sum, member) => sum + member.hoursThisWeek, 0);
  const avgEfficiency = mockTeamData.reduce((sum, member) => sum + member.efficiency, 0) / mockTeamData.length;
  const topPerformer = mockTeamData.reduce((top, member) => 
    member.efficiency > top.efficiency ? member : top
  );

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">{mockTeamData.length}</div>
          <div className="text-sm text-muted-foreground">Team Members</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
          <div className="text-sm text-muted-foreground">Total Hours</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>
            {Math.round(avgEfficiency)}%
          </div>
          <div className="text-sm text-muted-foreground">Avg. Efficiency</div>
        </div>
      </div>

      {/* Top Performer */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <div>
            <div className="font-medium">Top Performer</div>
            <div className="text-sm text-muted-foreground">
              {topPerformer.name} - {topPerformer.efficiency}% efficiency
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {mockTeamData.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 w-full h-full flex items-center justify-center text-white font-medium">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              </Avatar>
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.role}</div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={getEfficiencyBadgeVariant(member.efficiency)}>
                  {member.efficiency}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatHours(member.hoursThisWeek)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {member.activeProjects} active projects
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <div className="text-sm font-medium">Productivity Up</div>
          <div className="text-xs text-muted-foreground">+12% this week</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <div className="text-sm font-medium">On Schedule</div>
          <div className="text-xs text-muted-foreground">94% of deliverables</div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformanceWidget;
