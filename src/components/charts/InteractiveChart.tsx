import React, { useState, useCallback, useMemo } from 'react';
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
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useChartTheme, transformChartDataWithTheme } from './ChartThemeProvider';
import { cn } from "@/lib/utils";

interface InteractiveChartProps {
  data: any;
  title: string;
  type?: 'bar' | 'line';
  height?: number;
  className?: string;
  enableZoom?: boolean;
  enableFilter?: boolean;
  enableExport?: boolean;
  showTrend?: boolean;
  onDataPointClick?: (data: any, index: number) => void;
  onExport?: (format: 'png' | 'csv' | 'pdf') => void;
}

interface ChartState {
  zoomDomain: [number, number] | null;
  filteredData: any[];
  selectedDataKeys: string[];
  showTrendLine: boolean;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  type = 'bar',
  height = 400,
  className = '',
  enableZoom = true,
  enableFilter = true,
  enableExport = true,
  showTrend = false,
  onDataPointClick,
  onExport,
}) => {
  const chartTheme = useChartTheme();
  const { chartData, config } = useMemo(() => 
    transformChartDataWithTheme(data, chartTheme), 
    [data, chartTheme]
  );

  const [chartState, setChartState] = useState<ChartState>({
    zoomDomain: null,
    filteredData: chartData,
    selectedDataKeys: Object.keys(config),
    showTrendLine: showTrend,
  });

  // Calculate trend for trend line
  const trendData = useMemo(() => {
    if (!chartState.showTrendLine || chartData.length < 2) return null;
    
    const firstDataKey = chartState.selectedDataKeys[0];
    if (!firstDataKey) return null;

    const values = chartData.map((item, index) => ({ x: index, y: item[firstDataKey] || 0 }));
    
    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, point) => sum + point.x, 0);
    const sumY = values.reduce((sum, point) => sum + point.y, 0);
    const sumXY = values.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = values.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return chartData.map((item, index) => ({
      ...item,
      trend: slope * index + intercept,
    }));
  }, [chartData, chartState.showTrendLine, chartState.selectedDataKeys]);

  // Handle zoom
  const handleZoom = useCallback((domain: [number, number] | null) => {
    setChartState(prev => ({ ...prev, zoomDomain: domain }));
  }, []);

  // Handle data key toggle
  const toggleDataKey = useCallback((key: string) => {
    setChartState(prev => ({
      ...prev,
      selectedDataKeys: prev.selectedDataKeys.includes(key)
        ? prev.selectedDataKeys.filter(k => k !== key)
        : [...prev.selectedDataKeys, key],
    }));
  }, []);

  // Handle trend toggle
  const toggleTrend = useCallback(() => {
    setChartState(prev => ({ ...prev, showTrendLine: !prev.showTrendLine }));
  }, []);

  // Reset chart
  const resetChart = useCallback(() => {
    setChartState({
      zoomDomain: null,
      filteredData: chartData,
      selectedDataKeys: Object.keys(config),
      showTrendLine: showTrend,
    });
  }, [chartData, config, showTrend]);

  // Export handlers
  const handleExport = useCallback((format: 'png' | 'csv' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export behavior
      if (format === 'csv') {
        const csvContent = [
          ['Name', ...chartState.selectedDataKeys].join(','),
          ...chartData.map(item => 
            [item.name, ...chartState.selectedDataKeys.map(key => item[key] || 0)].join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}_chart_data.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  }, [chartData, chartState.selectedDataKeys, title, onExport]);

  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (!trendData || trendData.length < 2) return null;
    const firstTrend = trendData[0].trend;
    const lastTrend = trendData[trendData.length - 1].trend;
    return lastTrend > firstTrend ? 'up' : lastTrend < firstTrend ? 'down' : 'flat';
  }, [trendData]);

  const renderChart = () => {
    const dataToRender = trendData || chartData;
    const commonProps = {
      data: dataToRender,
    };

    // Handle clicks on individual chart elements
    const handleElementClick = (data: any) => {
      if (onDataPointClick && data) {
        // Extract the index from the data object if available
        const index = dataToRender.findIndex(item => item === data.payload || item.name === data.name);
        onDataPointClick(data, index >= 0 ? index : 0);
      }
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
          <ChartTooltip 
            content={<ChartTooltipContent />}
            cursor={{ stroke: chartTheme.config.grid.stroke, strokeWidth: 1 }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          
          {/* Data lines */}
          {chartState.selectedDataKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={{ r: 4, fill: `var(--color-${key})` }}
              activeDot={{
                r: 6,
                fill: `var(--color-${key})`,
                stroke: chartTheme.config.tooltip.backgroundColor,
                strokeWidth: 2
              }}
              connectNulls={false}
              onClick={handleElementClick}
            />
          ))}
          
          {/* Trend line */}
          {chartState.showTrendLine && trendData && (
            <Line
              type="monotone"
              dataKey="trend"
              stroke={chartTheme.getSemanticColor('info')}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
              name="Trend"
            />
          )}
          
          {/* Zoom brush */}
          {enableZoom && (
            <Brush
              dataKey="name"
              height={30}
              stroke={chartTheme.config.grid.stroke}
              fill={chartTheme.config.tooltip.backgroundColor}
            />
          )}
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
        <ChartTooltip 
          content={<ChartTooltipContent />}
          cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        
        {chartState.selectedDataKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            radius={[4, 4, 0, 0]}
            onClick={handleElementClick}
          />
        ))}
        
        {enableZoom && (
          <Brush
            dataKey="name"
            height={30}
            stroke={chartTheme.config.grid.stroke}
            fill={chartTheme.config.tooltip.backgroundColor}
          />
        )}
      </BarChart>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
              {chartState.showTrendLine && trendDirection && (
                <Badge variant="outline" className="text-xs">
                  {trendDirection === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
                  {trendDirection === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-red-500" />}
                  {trendDirection === 'flat' && <Minus className="w-3 h-3 mr-1 text-gray-500" />}
                  {trendDirection}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Data key filters */}
            {enableFilter && (
              <div className="flex items-center gap-1">
                {Object.keys(config).map((key) => (
                  <Button
                    key={key}
                    variant={chartState.selectedDataKeys.includes(key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDataKey(key)}
                    className="text-xs h-7"
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: `var(--color-${key})` }}
                    />
                    {config[key].label}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Chart controls */}
            <div className="flex items-center gap-1">
              {showTrend && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={chartState.showTrendLine ? "default" : "outline"}
                        size="sm"
                        onClick={toggleTrend}
                        className="h-8 w-8 p-0"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle trend line</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetChart}
                      className="h-8 w-8 p-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset chart</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {enableExport && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height: `${height}px` }}
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;