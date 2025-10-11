import { Badge, Progress, Card, CardContent } from '../../lib/shadcn';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface ShadcnTimeUsageProgressProps {
  loggedMinutes: number;
  estimatedHours?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showOverBudgetWarning?: boolean;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

export const ShadcnTimeUsageProgress: React.FC<ShadcnTimeUsageProgressProps> = ({
  loggedMinutes,
  estimatedHours,
  className,
  variant = 'default',
  showOverBudgetWarning = true
}) => {
  if (!estimatedHours) return null;

  const estimatedMinutes = estimatedHours * 60;
  const progress = estimatedMinutes > 0 ? Math.min((loggedMinutes / estimatedMinutes) * 100, 100) : 0;
  const isOverBudget = loggedMinutes > estimatedMinutes;
  const overBudgetMinutes = isOverBudget ? loggedMinutes - estimatedMinutes : 0;
  
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (progress >= 90) return 'bg-yellow-500';
    if (progress >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (progress >= 90) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isOverBudget) return 'Over Budget';
    if (progress >= 90) return 'Near Limit';
    if (progress >= 75) return 'High Usage';
    return 'On Track';
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'space-y-1';
      case 'detailed':
        return 'space-y-4';
      default:
        return 'space-y-3';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`${getVariantClass()} ${className || ''}`}>
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            Time Usage
          </span>
          <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-primary'}`}>
            {formatDuration(loggedMinutes)} / {estimatedHours}h
          </span>
        </div>
        
        <div className="relative">
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
          <div 
            className={`absolute top-0 left-0 h-1.5 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {isOverBudget && showOverBudgetWarning && (
          <p className="text-xs text-red-600 text-right">
            {formatDuration(overBudgetMinutes)} over budget
          </p>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className={getVariantClass()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Time Usage Progress</h3>
              </div>
              <Badge variant={isOverBudget ? "destructive" : "default"}>
                {getStatusText()}
              </Badge>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              
              <div className="relative">
                <Progress value={Math.min(progress, 100)} className="h-3" />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Used</div>
                <div className="font-semibold text-sm">{formatDuration(loggedMinutes)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Allocated</div>
                <div className="font-semibold text-sm">{estimatedHours}h</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {isOverBudget ? 'Over' : 'Remaining'}
                </div>
                <div className={`font-semibold text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget 
                    ? formatDuration(overBudgetMinutes)
                    : formatDuration(estimatedMinutes - loggedMinutes)
                  }
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className={isOverBudget ? 'text-red-600' : 'text-muted-foreground'}>
                {isOverBudget 
                  ? `Time allocation exceeded by ${formatDuration(overBudgetMinutes)}`
                  : progress >= 90
                    ? 'Approaching time allocation limit'
                    : 'Time usage is within expected range'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`${getVariantClass()} ${className || ''}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1 font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          Time Usage
        </span>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-primary'}`}>
            {formatDuration(loggedMinutes)} / {estimatedHours}h
          </span>
        </div>
      </div>
      
      <div className="relative">
        <Progress value={Math.min(progress, 100)} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Time usage: ${Math.round(progress)}% of allocated time`}
        />
      </div>
      
      {isOverBudget && showOverBudgetWarning && (
        <div className="flex items-center justify-between text-xs">
          <Badge variant="destructive" className="text-xs">
            Over Budget
          </Badge>
          <span className="text-red-600 font-medium">
            {formatDuration(overBudgetMinutes)} over
          </span>
        </div>
      )}
    </div>
  );
};

export default ShadcnTimeUsageProgress;
