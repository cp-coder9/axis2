import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  Timer
} from 'lucide-react';

interface TimerAnalyticsData {
  totalHours: number;
  weeklyHours: number;
  averageSession: number;
  efficiency: number;
  weeklyTrend: number;
  topProjects: Array<{
    name: string;
    hours: number;
    percentage: number;
  }>;
  dailyBreakdown: Array<{
    day: string;
    hours: number;
  }>;
}

interface TimerAnalyticsWidgetProps {
  userRole?: 'admin' | 'freelancer' | 'client';
}

// Mock analytics data
const mockAnalytics: TimerAnalyticsData = {
  totalHours: 156.5,
  weeklyHours: 42.3,
  averageSession: 2.4,
  efficiency: 87,
  weeklyTrend: 12.5,
  topProjects: [
    { name: 'Office Complex Design', hours: 65.2, percentage: 42 },
    { name: 'Residential Planning', hours: 38.7, percentage: 25 },
    { name: 'Urban Development', hours: 28.4, percentage: 18 },
    { name: 'Heritage Restoration', hours: 24.2, percentage: 15 }
  ],
  dailyBreakdown: [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 7.2 },
    { day: 'Wed', hours: 9.1 },
    { day: 'Thu', hours: 6.8 },
    { day: 'Fri', hours: 8.7 },
    { day: 'Sat', hours: 2.0 },
    { day: 'Sun', hours: 0 }
  ]
};

const TimerAnalyticsWidget: React.FC<TimerAnalyticsWidgetProps> = ({ userRole = 'admin' }) => {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const maxDailyHours = Math.max(...mockAnalytics.dailyBreakdown.map(d => d.hours));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{formatHours(mockAnalytics.totalHours)}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500 opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{formatHours(mockAnalytics.weeklyHours)}</p>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(mockAnalytics.weeklyTrend)}
                <span className={mockAnalytics.weeklyTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(mockAnalytics.weeklyTrend)}%
                </span>
              </div>
            </div>
            <BarChart3 className="h-8 w-8 text-green-500 opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Session</p>
              <p className="text-2xl font-bold">{formatHours(mockAnalytics.averageSession)}</p>
            </div>
            <Timer className="h-8 w-8 text-purple-500 opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Efficiency</p>
              <p className={`text-2xl font-bold ${getEfficiencyColor(mockAnalytics.efficiency)}`}>
                {mockAnalytics.efficiency}%
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-500 opacity-75" />
          </div>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card className="p-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Daily Hours This Week
        </h4>
        <div className="space-y-3">
          {mockAnalytics.dailyBreakdown.map((day) => (
            <div key={day.day} className="flex items-center gap-3">
              <div className="w-8 text-sm text-muted-foreground">{day.day}</div>
              <div className="flex-1">
                <div className="bg-muted rounded-full h-2 relative">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(day.hours / maxDailyHours) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm text-right">
                {day.hours > 0 ? formatHours(day.hours) : '-'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Projects */}
      <Card className="p-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Time by Project
        </h4>
        <div className="space-y-3">
          {mockAnalytics.topProjects.map((project, index) => (
            <div key={project.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{project.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {project.percentage}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatHours(project.hours)}
                  </span>
                </div>
              </div>
              <Progress value={project.percentage} className="h-1.5" />
            </div>
          ))}
        </div>
      </Card>

      {userRole === 'client' && (
        <div className="text-xs text-muted-foreground text-center py-2">
          Limited analytics view for client role
        </div>
      )}
    </div>
  );
};

export default TimerAnalyticsWidget;
