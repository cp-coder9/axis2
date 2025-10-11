import React, { Suspense, useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  Line,
  Pie,
  BarChart,
  LineChart,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartTheme, transformChartDataWithTheme } from './ChartThemeProvider';
import { cn } from "@/lib/utils";

// Legacy chart.js data format for backward compatibility
export interface LegacyChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    borderDash?: number[];
    type?: 'success' | 'warning' | 'error' | 'info';
  }[];
}

interface EnhancedShadcnChartProps {
  data: LegacyChartData;
  title: string;
  description?: string;
  type?: 'bar' | 'line' | 'pie' | 'doughnut';
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string;
  interactive?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  onDataPointClick?: (data: any, index: number) => void;
}

// Chart skeleton component
const ChartSkeleton: React.FC<{ height: number; type: string }> = ({ height, type }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-3 w-[150px]" />
    </div>
    <div 
      className="flex items-end justify-center space-x-2" 
      style={{ height: `${height}px` }}
    >
      {type === 'pie' ? (
        <Skeleton className="rounded-full w-32 h-32" />
      ) : (
        Array.from({ length: 8 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-8 rounded-t-md" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))
      )}
    </div>
    <div className="flex justify-center space-x-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Error state component
const ChartError: React.FC<{ error: string; height: number }> = ({ error, height }) => (
  <div 
    className="flex flex-col items-center justify-center text-muted-foreground"
    style={{ height: `${height}px` }}
  >
    <div className="text-4xl mb-4">📊</div>
    <div className="text-center">
      <div className="font-medium text-destructive mb-2">Chart Error</div>
      <div className="text-sm">{error}</div>
    </div>
  </div>
);

// Empty state component
const ChartEmpty: React.FC<{ height: number }> = ({ height }) => (
  <div 
    className="flex flex-col items-center justify-center text-muted-foreground"
    style={{ height: `${height}px` }}
  >
    <div className="text-4xl mb-4">📈</div>
    <div className="text-center">
      <div className="font-medium mb-2">No Data Available</div>
      <div className="text-sm">Chart will appear when data is loaded</div>
    </div>
  </div>
);

const EnhancedShadcnChart: React.FC<EnhancedShadcnChartProps> = ({
  data,
  title,
  description,
  type = 'bar',
  height = 300,
  className = '',
  loading = false,
  error,
  interactive = true,
  showLegend = true,
  showTooltip = true,
  onDataPointClick,
}) => {
  const chartTheme = useChartTheme();

  // Transform data with proper theming
  const { chartData, config } = useMemo(() => {
    if (!data || loading || error) {
      return { chartData: [], config: {} };
    }
    return transformChartDataWithTheme(data, chartTheme);
  }, [data, chartTheme, loading, error]);

  // Validate data
  const hasValidData = chartData.length > 0 && Object.keys(config).length > 0;

  const renderChart = () => {
    if (!hasValidData) return null;

    const commonProps = {
      data: chartData,
    };

    // Handle clicks on individual chart elements if interactive
    const handleElementClick = (data: any) => {
      if (interactive && onDataPointClick && data) {
        // Extract the index from the data object if available
        const index = chartData.findIndex(item => item === data.payload || item.name === data.name);
        onDataPointClick(data, index >= 0 ? index : 0);
      }
    };

    switch (type) {
      case 'bar':
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
            {showTooltip && <ChartTooltip content={<ChartTooltipContent />} />}
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
            {data.datasets.map((dataset, index) => {
              const key = dataset.label.replace(/\s+/g, '').toLowerCase();
              return (
                <Bar
                  key={dataset.label}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={[4, 4, 0, 0]}
                  className={interactive ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                  onClick={interactive ? handleElementClick : undefined}
                />
              );
            })}
          </BarChart>
        );

      case 'line':
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
            {showTooltip && <ChartTooltip content={<ChartTooltipContent />} />}
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
            {data.datasets.map((dataset, index) => {
              const key = dataset.label.replace(/\s+/g, '').toLowerCase();
              return (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  strokeDasharray={dataset.borderDash ? dataset.borderDash.join(' ') : undefined}
                  dot={{
                    r: 4,
                    fill: `var(--color-${key})`,
                    className: interactive ? "cursor-pointer hover:r-6 transition-all" : ""
                  }}
                  activeDot={{
                    r: 6,
                    fill: `var(--color-${key})`,
                    stroke: chartTheme.config.tooltip.backgroundColor,
                    strokeWidth: 2
                  }}
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={interactive ? handleElementClick : undefined}
                />
              );
            })}
          </LineChart>
        );

      case 'pie':
      case 'doughnut':
        // For pie charts, transform data differently
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0,
          fill: chartTheme.getColor(index),
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={type === 'doughnut' ? 60 : 0}
              outerRadius={Math.min(height * 0.35, 120)}
              paddingAngle={2}
              className={interactive ? "cursor-pointer" : ""}
              onClick={interactive ? handleElementClick : undefined}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  className={interactive ? "hover:opacity-80 transition-opacity" : ""}
                />
              ))}
            </Pie>
            {showTooltip && <ChartTooltip content={<ChartTooltipContent />} />}
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton height={height} type={type} />
        ) : error ? (
          <ChartError error={error} height={height} />
        ) : !hasValidData ? (
          <ChartEmpty height={height} />
        ) : (
          <Suspense fallback={<ChartSkeleton height={height} type={type} />}>
            <ChartContainer
              config={config}
              className="mx-auto w-full"
              style={{ height: `${height}px` }}
            >
              {renderChart()}
            </ChartContainer>
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedShadcnChart;
export { EnhancedShadcnChart };