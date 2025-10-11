import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  HardDrive,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { UserRole } from '@/types';
import { useUploadQuotaMonitor } from '@/hooks/useRoleBasedUpload';
import { formatFileSize } from '@/utils/formatters';

interface UploadQuotaMonitorProps {
  userRole: UserRole;
  userId: string;
  className?: string;
  showDetails?: boolean;
  onRefresh?: () => void;
}

export const UploadQuotaMonitor: React.FC<UploadQuotaMonitorProps> = ({
  userRole,
  userId,
  className = '',
  showDetails = true,
  onRefresh
}) => {
  const { quota, config, isNearLimit, isAtLimit, status, message } = useUploadQuotaMonitor(userRole, userId);

  const getStatusIcon = () => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Quota Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Upload Quota - {userRole}
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quota Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span className="font-medium">
                {formatFileSize(quota.used)} / {formatFileSize(quota.limit)}
              </span>
            </div>
            <div className="relative">
              <Progress value={quota.percentage} className="h-3" />
              <div 
                className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${quota.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{quota.percentage.toFixed(1)}% used</span>
              <span>{formatFileSize(quota.remaining)} remaining</span>
            </div>
          </div>

          {/* Status Message */}
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upload Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max files per upload:</span>
                  <Badge variant="outline">{config.maxFiles}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max file size:</span>
                  <Badge variant="outline">{formatFileSize(config.maxFileSize)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly quota:</span>
                  <Badge variant="outline">{formatFileSize(config.monthlyQuota)}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs">Allowed categories:</div>
                <div className="flex flex-wrap gap-1">
                  {config.allowedCategories.map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Status Alert */}
      {isAtLimit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Upload quota exceeded</p>
              <p className="text-sm">
                You have reached your monthly upload limit of {formatFileSize(config.monthlyQuota)}. 
                Contact your administrator to increase your quota or wait until next month.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alert */}
      {isNearLimit && !isAtLimit && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Approaching quota limit</p>
              <p className="text-sm">
                You have used {quota.percentage.toFixed(1)}% of your monthly quota. 
                Consider managing your uploads to avoid hitting the limit.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Compact version for sidebars or small spaces
export const CompactUploadQuotaMonitor: React.FC<UploadQuotaMonitorProps> = ({
  userRole,
  userId,
  className = ''
}) => {
  const { quota, isNearLimit, isAtLimit, status } = useUploadQuotaMonitor(userRole, userId);

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-500';
    if (isNearLimit) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${className}`}>
      <HardDrive className={`h-4 w-4 ${getStatusColor()}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Quota</span>
          <span className="font-medium">{quota.percentage.toFixed(0)}%</span>
        </div>
        <Progress value={quota.percentage} className="h-1" />
      </div>
      {(isNearLimit || isAtLimit) && (
        <AlertTriangle className="h-3 w-3 text-amber-500" />
      )}
    </div>
  );
};