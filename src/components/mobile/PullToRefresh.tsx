import React, { useRef, useEffect } from 'react';
import { usePullToRefresh, PullToRefreshConfig } from '../../hooks/usePullToRefresh';
import { Loader2, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  config?: PullToRefreshConfig;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  config,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, setupPullToRefresh } = usePullToRefresh(onRefresh, config);

  useEffect(() => {
    const cleanup = setupPullToRefresh(containerRef.current);
    return cleanup;
  }, [setupPullToRefresh]);

  const getIndicatorIcon = () => {
    if (state.isRefreshing) {
      return <Loader2 className="w-6 h-6 animate-spin text-primary" />;
    }
    if (state.canRefresh) {
      return <Check className="w-6 h-6 text-success" />;
    }
    return <ArrowDown className="w-6 h-6 text-muted-foreground" />;
  };

  const getIndicatorText = () => {
    if (state.isRefreshing) return 'Refreshing...';
    if (state.canRefresh) return 'Release to refresh';
    if (state.isPulling) return 'Pull to refresh';
    return '';
  };

  const indicatorOpacity = state.isPulling || state.isRefreshing ? 1 : 0;
  const indicatorScale = state.canRefresh ? 1.1 : 1;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{
          transform: state.isPulling ? `translateY(${state.pullDistance}px)` : 'none',
          transition: state.isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50"
          style={{
            height: '80px',
            transform: `translateY(-80px) translateY(${state.pullDistance}px)`,
            opacity: indicatorOpacity,
            transition: state.isPulling 
              ? 'opacity 0.2s ease-out' 
              : 'opacity 0.3s ease-out, transform 0.3s ease-out'
          }}
        >
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
            style={{
              transform: `scale(${indicatorScale})`,
              transition: 'transform 0.2s ease-out'
            }}
          >
            {getIndicatorIcon()}
            {getIndicatorText() && (
              <span className="text-sm font-medium text-foreground">
                {getIndicatorText()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};
