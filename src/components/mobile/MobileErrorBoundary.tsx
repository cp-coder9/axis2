import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Trigger haptic feedback for error
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md">
            {/* Error Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" />
                <div className="relative bg-destructive/10 p-6 rounded-full">
                  <AlertCircle className="w-16 h-16 text-destructive" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono text-destructive break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full touch-target-lg flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg active:scale-98 transition-transform"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full touch-target-lg flex items-center justify-center gap-2 px-6 py-4 bg-secondary text-secondary-foreground rounded-lg font-medium active:scale-98 transition-transform"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mobile-optimized error toast component
interface MobileErrorToastProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const MobileErrorToast: React.FC<MobileErrorToastProps> = ({
  message,
  onRetry,
  onDismiss,
  duration = 5000
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const handleRetry = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onRetry?.();
  };

  const handleDismiss = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onDismiss();
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-destructive text-destructive-foreground rounded-lg shadow-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={handleRetry}
              className="touch-target p-2 hover:bg-destructive-foreground/10 rounded-md transition-colors"
              aria-label="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="touch-target p-2 hover:bg-destructive-foreground/10 rounded-md transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
