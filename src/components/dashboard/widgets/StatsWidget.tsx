import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, LayoutDashboard } from 'lucide-react';

interface StatsWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'users' | 'clock' | 'check' | 'dashboard';
  description?: string;
}

const iconMap = {
  users: Users,
  clock: Clock,
  check: CheckCircle,
  dashboard: LayoutDashboard
};

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon = 'dashboard',
  description
}) => {
  const IconComponent = iconMap[icon];
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="h-full">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium">{title}</div>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change}</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
};