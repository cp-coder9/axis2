import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  Line,
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from "lucide-react";
import { useChartTheme, transformChartDataWithTheme } from './ChartThemeProvider';
import { ChartExportButton, ChartExportData } from './ChartExportUtils';
import { cn } from "@/lib/utils";

interface AccessibleChartProps {
  data: any;
  title: string;
  description?: string;
  type?: 'bar' | 'line';
  height?: number;
  className?: string;
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
  enableDataAnnouncement?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

interface NavigationState {
  currentDataIndex: number;
  currentSeriesIndex: number;
  isPlaying: boolean;
  focusedElement: 'chart' | 'data' | 'controls';
}

const AccessibleChart: React.FC<AccessibleChartProps> = ({
  data,
  title,
  description,
  type = 'bar',
  height = 400,
  className = '',
  enableKeyboardNavigation = true,
  enableScreenReader = true,
  enableDataAnnouncement = true,
  autoPlay = false,
  autoPlayInterval = 2000,
}) => {
  const chartTheme = useChartTheme();
  const { chartData, config } = transformChartDataWithTheme(data, chartTheme);
  const chartRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  
  const [navState, setNavState] = useState<NavigationState>({
    currentDataIndex: 0,
    currentSeriesIndex: 0,
    isPlaying: false,
    focusedElement: 'chart',
  });

  const dataKeys = Object.keys(config);
  const maxDataIndex = chartData.length - 1;
  const maxSeriesIndex = dataKeys.length - 1;

  // Announce data point information
  const announceDataPoint = useCallback((dataIndex: number, seriesIndex: number) => {
    if (!enableDataAnnouncement || !announcementRef.current) return;
    
    const dataPoint = chartData[dataIndex];
    const seriesKey = dataKeys[seriesIndex];
    const seriesLabel = config[seriesKey]?.label || seriesKey;
    const value = dataPoint?.[seriesKey];
    
    if (dataPoint && value !== undefined) {
      const announcement = `${seriesLabel}: ${value} for ${dataPoint.name}`;
      announcementRef.current.textContent = announcement;
      
      // Also update aria-live region
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [chartData, dataKeys, config, enableDataAnnouncement]);

  // Navigation functions
  const navigateData = useCallback((direction: 'next' | 'prev') => {
    setNavState(prev => {
      const newIndex = direction === 'next' 
        ? Math.min(prev.currentDataIndex + 1, maxDataIndex)
        : Math.max(prev.currentDataIndex - 1, 0);
      
      announceDataPoint(newIndex, prev.currentSeriesIndex);
      
      return { ...prev, currentDataIndex: newIndex };
    });
  }, [maxDataIndex, announceDataPoint]);

  const navigateSeries = useCallback((direction: 'next' | 'prev') => {
    setNavState(prev => {
      const newIndex = direction === 'next'
        ? Math.min(prev.currentSeriesIndex + 1, maxSeriesIndex)
        : Math.max(prev.currentSeriesIndex - 1, 0);
      
      announceDataPoint(prev.currentDataIndex, newIndex);
      
      return { ...prev, currentSeriesIndex: newIndex };
    });
  }, [maxSeriesIndex, announceDataPoint]);

  const toggleAutoPlay = useCallback(() => {
    setNavState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const resetNavigation = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      currentDataIndex: 0,
      currentSeriesIndex: 0,
      isPlaying: false,
    }));
    announceDataPoint(0, 0);
  }, [announceDataPoint]);

  // Auto-play functionality
  useEffect(() => {
    if (!navState.isPlaying) return;
    
    const interval = setInterval(() => {
      setNavState(prev => {
        const nextDataIndex = prev.currentDataIndex + 1;
        if (nextDataIndex > maxDataIndex) {
          // Reset to beginning or stop
          return { ...prev, currentDataIndex: 0, isPlaying: false };
        }
        
        announceDataPoint(nextDataIndex, prev.currentSeriesIndex);
        return { ...prev, currentDataIndex: nextDataIndex };
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [navState.isPlaying, maxDataIndex, autoPlayInterval, announceDataPoint]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if chart is focused
      if (!chartRef.current?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          navigateData('next');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigateData('prev');
          break;
        case 'ArrowUp':
          event.preventDefault();
          navigateSeries('prev');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateSeries('next');
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          announceDataPoint(navState.currentDataIndex, navState.currentSeriesIndex);
          break;
        case 'Home':
          event.preventDefault();
          resetNavigation();
          break;
        case 'p':
        case 'P':
          if (autoPlay) {
            event.preventDefault();
            toggleAutoPlay();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardNavigation,
    navigateData,
    navigateSeries,
    announceDataPoint,
    navState.currentDataIndex,
    navState.currentSeriesIndex,
    resetNavigation,
    toggleAutoPlay,
    autoPlay,
  ]);

  // Generate chart data with highlighting
  const highlightedData = chartData.map((item: Record<string, any>, index: number) => ({
    ...item,
    isHighlighted: index === navState.currentDataIndex,
  }));

  // Current data point info
  const currentDataPoint = chartData[navState.currentDataIndex];
  const currentSeriesKey = dataKeys[navState.currentSeriesIndex];
  const currentValue = currentDataPoint?.[currentSeriesKey];
  const currentSeriesLabel = config[currentSeriesKey]?.label || currentSeriesKey;

  // Export data
  const exportData: ChartExportData = {
    title,
    data: chartData,
    config,
    chartType: type,
  };

  const renderChart = () => {
    const commonProps = {
      data: highlightedData,
    };

    if (type === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid 
            strokeDasharray={chartTheme.config.grid.strokeDasharray}
            stroke={chartTheme.config.grid.stroke}
            className="opacity-30"
          />
          <XAxis 
            dataKey="name"
            tick={{ 
              fontSize: chartTheme.config.axis.fontSize,
              fill: chartTheme.config.axis.stroke,
            }}
            axisLine={{ stroke: chartTheme.config.axis.stroke }}
            tickLine={{ stroke: chartTheme.config.axis.stroke }}
          />
          <YAxis 
            tick={{ 
              fontSize: chartTheme.config.axis.fontSize,
              fill: chartTheme.config.axis.stroke,
            }}
            axisLine={{ stroke: chartTheme.config.axis.stroke }}
            tickLine={{ stroke: chartTheme.config.axis.stroke }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent payload={[]} verticalAlign="bottom" />} />
          
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={index === navState.currentSeriesIndex ? 3 : 2}
              dot={{ 
                r: 4, 
                fill: `var(--color-${key})`,
                strokeWidth: index === navState.currentSeriesIndex ? 2 : 0,
                stroke: chartTheme.config.tooltip.backgroundColor,
              }}
              activeDot={{ 
                r: 6, 
                fill: `var(--color-${key})`,
                stroke: chartTheme.config.tooltip.backgroundColor,
                strokeWidth: 2
              }}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid 
          strokeDasharray={chartTheme.config.grid.strokeDasharray}
          stroke={chartTheme.config.grid.stroke}
          className="opacity-30"
        />
        <XAxis 
          dataKey="name"
          tick={{ 
            fontSize: chartTheme.config.axis.fontSize,
            fill: chartTheme.config.axis.stroke,
          }}
          axisLine={{ stroke: chartTheme.config.axis.stroke }}
          tickLine={{ stroke: chartTheme.config.axis.stroke }}
        />
        <YAxis 
          tick={{ 
            fontSize: chartTheme.config.axis.fontSize,
            fill: chartTheme.config.axis.stroke,
          }}
          axisLine={{ stroke: chartTheme.config.axis.stroke }}
          tickLine={{ stroke: chartTheme.config.axis.stroke }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent payload={[]} verticalAlign="bottom" />} />
        
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            fillOpacity={index === navState.currentSeriesIndex ? 1 : 0.7}
            stroke={index === navState.currentSeriesIndex ? `var(--color-${key})` : 'none'}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <ChartExportButton 
              data={exportData}
              chartElementRef={chartRef}
              className="h-8"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current data point display */}
        {currentDataPoint && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                Current: {currentDataPoint.name}
              </div>
              <div className="text-lg font-bold">
                {currentSeriesLabel}: {currentValue}
              </div>
            </div>
            <Badge variant="outline">
              {navState.currentDataIndex + 1} of {chartData.length}
            </Badge>
          </div>
        )}
        
        {/* Chart container */}
        <div
          ref={chartRef}
          {...(enableKeyboardNavigation && { tabIndex: 0 })}
          role="application"
          aria-label={`${title} chart. Use arrow keys to navigate data points. Press Enter to announce current value.`}
          aria-describedby={enableScreenReader ? "chart-description" : undefined}
          className={cn(
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg",
            enableKeyboardNavigation && "cursor-pointer"
          )}
        >
          <ChartContainer
            config={config}
            className="w-full"
            style={{ height: `${height}px` }}
          >
            {renderChart()}
          </ChartContainer>
        </div>
        
        {/* Navigation controls */}
        {enableKeyboardNavigation && (
          <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateData('prev')}
                disabled={navState.currentDataIndex === 0}
                aria-label="Previous data point"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateData('next')}
                disabled={navState.currentDataIndex === maxDataIndex}
                aria-label="Next data point"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="w-px h-6 bg-border" />
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateSeries('prev')}
                disabled={navState.currentSeriesIndex === 0}
                aria-label="Previous data series"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateSeries('next')}
                disabled={navState.currentSeriesIndex === maxSeriesIndex}
                aria-label="Next data series"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            
            {autoPlay && (
              <>
                <div className="w-px h-6 bg-border" />
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetNavigation}
                    aria-label="Reset to beginning"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAutoPlay}
                    aria-label={navState.isPlaying ? "Pause auto-play" : "Start auto-play"}
                  >
                    {navState.isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNavState(prev => ({
                        ...prev,
                        currentDataIndex: maxDataIndex,
                      }));
                      announceDataPoint(maxDataIndex, navState.currentSeriesIndex);
                    }}
                    aria-label="Skip to end"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Screen reader descriptions */}
        {enableScreenReader && (
          <div className="sr-only">
            <div id="chart-description">
              {description || `Interactive ${type} chart showing ${dataKeys.length} data series across ${chartData.length} data points.`}
              {enableKeyboardNavigation && (
                <span>
                  {" "}Use arrow keys to navigate: left/right for data points, up/down for data series. 
                  Press Enter to announce current value. Press Home to reset to beginning.
                  {autoPlay && " Press P to toggle auto-play."}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Live region for announcements */}
        {enableDataAnnouncement && (
          <div
            ref={announcementRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AccessibleChart;
