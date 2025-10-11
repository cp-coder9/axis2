import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, X, GripVertical } from 'lucide-react';
import { DashboardWidget as WidgetType, WidgetProps, WidgetError } from '../../types/dashboard';

// Extended widget type with component
interface EnhancedWidgetType extends WidgetType {
  component: React.ComponentType<WidgetProps>;
}

interface EnhancedDashboardWidgetProps {
  widget: EnhancedWidgetType;
  onError?: (error: WidgetError) => void;
  onRemove?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  isVisible?: boolean;
  className?: string;
  enableDragHandle?: boolean;
}

const WidgetErrorBoundary: React.FC<{
  children: React.ReactNode;
  widgetId: string;
  onError?: (error: WidgetError) => void;
  onRetry?: () => void;
}> = ({ children, widgetId, onError, onRetry }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (hasError && error && onError) {
      onError({
        widgetId,
        error,
        timestamp: new Date(),
        retryCount
      });
    }
  }, [hasError, error, widgetId, onError, retryCount]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setError(null);
    setRetryCount(prev => prev + 1);
    onRetry?.();
  }, [onRetry]);

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Widget Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error?.message || 'Something went wrong loading this widget'}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Retry ({retryCount > 0 ? `${retryCount} attempts` : 'First try'})
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ErrorBoundaryWrapper
      onError={(error) => {
        setHasError(true);
        setError(error);
      }}
    >
      {children}
    </ErrorBoundaryWrapper>
  );
};

class ErrorBoundaryWrapper extends React.Component<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

const WidgetSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </CardContent>
  </Card>
);

export const EnhancedDashboardWidget: React.FC<EnhancedDashboardWidgetProps> = ({
  widget,
  onError,
  onRemove,
  onRefresh,
  isVisible = true,
  className = '',
  enableDragHandle = true
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate refresh delay
      setRefreshKey(prev => prev + 1);
      onRefresh?.(widget.id);
    } finally {
      setIsRefreshing(false);
    }
  }, [widget.id, onRefresh]);

  const handleRetry = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!widget.refreshInterval || !isVisible) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, widget.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [widget.refreshInterval, isVisible, handleRefresh]);

  const WidgetComponent = widget.component;

  const widgetProps: WidgetProps = {
    widgetId: widget.id,
    onError: (error) => onError?.({
      widgetId: widget.id,
      error,
      timestamp: new Date(),
      retryCount: 0
    }),
    onRefresh: handleRefresh,
    isVisible
  };

  return (
    <div className={`h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enableDragHandle && (
                <div className="widget-drag-handle p-1 rounded hover:bg-accent cursor-move">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(widget.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <WidgetErrorBoundary
            widgetId={widget.id}
            onError={onError}
            onRetry={handleRetry}
          >
            <Suspense fallback={<WidgetSkeleton title={widget.title} />}>
              <WidgetComponent key={refreshKey} {...widgetProps} />
            </Suspense>
          </WidgetErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};