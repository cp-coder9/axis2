import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Database, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { InteractiveTooltip } from './ChartTooltipSystem';

// Performance monitoring interface
export interface ChartPerformanceMetrics {
  renderTime: number;
  dataSize: number;
  memoryUsage: number;
  frameRate: number;
  lastUpdate: number;
}

// Data optimization strategies
export interface DataOptimizationConfig {
  enableVirtualization: boolean;
  maxDataPoints: number;
  samplingRate: number;
  enableDataCaching: boolean;
  enableLazyLoading: boolean;
}

// Performance optimization hook
export const useChartPerformance = (
  data: any[],
  config: DataOptimizationConfig = {
    enableVirtualization: true,
    maxDataPoints: 1000,
    samplingRate: 1,
    enableDataCaching: true,
    enableLazyLoading: true,
  }
) => {
  const [metrics, setMetrics] = useState<ChartPerformanceMetrics>({
    renderTime: 0,
    dataSize: 0,
    memoryUsage: 0,
    frameRate: 60,
    lastUpdate: Date.now(),
  });

  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  // Data sampling for large datasets
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const startTime = performance.now();
    let processedData = [...data];

    // Apply sampling if data exceeds max points
    if (config.enableVirtualization && data.length > config.maxDataPoints) {
      const step = Math.ceil(data.length / config.maxDataPoints);
      processedData = data.filter((_, index) => index % step === 0);
    }

    // Apply sampling rate
    if (config.samplingRate < 1) {
      const sampleSize = Math.floor(processedData.length * config.samplingRate);
      processedData = processedData.slice(0, sampleSize);
    }

    const processingTime = performance.now() - startTime;
    
    setMetrics(prev => ({
      ...prev,
      dataSize: processedData.length,
      renderTime: processingTime,
      lastUpdate: Date.now(),
    }));

    return processedData;
  }, [data, config]);

  // Performance measurement utilities
  const startRenderMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      lastUpdate: Date.now(),
    }));
  }, []);

  // Frame rate monitoring
  useEffect(() => {
    let animationId: number;
    
    const measureFrameRate = () => {
      const now = performance.now();
      frameCount.current++;
      
      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
        setMetrics(prev => ({ ...prev, frameRate: fps }));
        frameCount.current = 0;
        lastFrameTime.current = now;
      }
      
      animationId = requestAnimationFrame(measureFrameRate);
    };

    measureFrameRate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Memory usage estimation
  const estimateMemoryUsage = useCallback(() => {
    const dataSize = JSON.stringify(optimizedData).length;
    const estimatedMemory = dataSize * 2; // Rough estimation
    
    setMetrics(prev => ({
      ...prev,
      memoryUsage: estimatedMemory,
    }));
  }, [optimizedData]);

  useEffect(() => {
    estimateMemoryUsage();
  }, [estimateMemoryUsage]);

  return {
    optimizedData,
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
  };
};

// Performance monitoring component
interface ChartPerformanceMonitorProps {
  metrics: ChartPerformanceMetrics;
  className?: string;
  showDetails?: boolean;
}

export const ChartPerformanceMonitor: React.FC<ChartPerformanceMonitorProps> = ({
  metrics,
  className = '',
  showDetails = false,
}) => {
  const getPerformanceStatus = () => {
    if (metrics.renderTime > 100) return { status: 'poor', color: 'destructive' };
    if (metrics.renderTime > 50) return { status: 'fair', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const getFrameRateStatus = () => {
    if (metrics.frameRate < 30) return { status: 'poor', color: 'destructive' };
    if (metrics.frameRate < 50) return { status: 'fair', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const performanceStatus = getPerformanceStatus();
  const frameRateStatus = getFrameRateStatus();

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <InteractiveTooltip
          content={
            <div className="space-y-2">
              <div>Render Time: {metrics.renderTime.toFixed(2)}ms</div>
              <div>Frame Rate: {metrics.frameRate} FPS</div>
              <div>Data Points: {metrics.dataSize.toLocaleString()}</div>
            </div>
          }
        >
          <Badge variant={performanceStatus.color as any} className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {performanceStatus.status}
          </Badge>
        </InteractiveTooltip>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Render Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Render Time
            </span>
            <Badge variant={performanceStatus.color as any} className="text-xs">
              {metrics.renderTime.toFixed(2)}ms
            </Badge>
          </div>
          <Progress 
            value={Math.min((metrics.renderTime / 100) * 100, 100)} 
            className="h-2"
          />
        </div>

        {/* Frame Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Frame Rate
            </span>
            <Badge variant={frameRateStatus.color as any} className="text-xs">
              {metrics.frameRate} FPS
            </Badge>
          </div>
          <Progress 
            value={(metrics.frameRate / 60) * 100} 
            className="h-2"
          />
        </div>

        {/* Data Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Points
            </span>
            <Badge variant="outline" className="text-xs">
              {metrics.dataSize.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Memory Est.
            </span>
            <Badge variant="outline" className="text-xs">
              {(metrics.memoryUsage / 1024).toFixed(1)} KB
            </Badge>
          </div>
        </div>

        {/* Performance Recommendations */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Recommendations</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              Refresh Metrics
            </Button>
          </div>
          <div className="space-y-2">
            {metrics.renderTime > 100 && (
              <div className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Consider reducing data points or enabling virtualization</span>
              </div>
            )}
            
            {metrics.frameRate < 30 && (
              <div className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Low frame rate detected. Optimize animations or reduce complexity</span>
              </div>
            )}
            
            {metrics.dataSize > 1000 && (
              <div className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Large dataset detected. Consider data sampling</span>
              </div>
            )}
            
            {performanceStatus.status === 'good' && frameRateStatus.status === 'good' && (
              <div className="flex items-start gap-2 text-xs text-success">
                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Performance is optimal</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Data virtualization component for large datasets
interface VirtualizedChartDataProps {
  data: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualizedChartData: React.FC<VirtualizedChartDataProps> = ({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(data.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = useMemo(() => {
    return data.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [data, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = data.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Lazy loading wrapper for chart components
interface LazyChartWrapperProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
}

export const LazyChartWrapper: React.FC<LazyChartWrapperProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback = <div className="h-64 bg-muted animate-pulse rounded" />,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Performance optimization utilities
export const ChartOptimizationUtils = {
  // Debounce function for performance-sensitive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll/resize events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Data sampling for large datasets
  sampleData: (data: any[], maxPoints: number): any[] => {
    if (data.length <= maxPoints) return data;
    
    const step = data.length / maxPoints;
    const sampled = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[Math.floor(i)]);
    }
    
    return sampled;
  },

  // Memory-efficient data transformation
  transformDataEfficiently: (data: any[], transformer: (item: any) => any): any[] => {
    const result = [];
    const batchSize = 1000;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      result.push(...batch.map(transformer));
      
      // Allow other tasks to run
      if (i % (batchSize * 10) === 0) {
        setTimeout(() => {}, 0);
      }
    }
    
    return result;
  },
};