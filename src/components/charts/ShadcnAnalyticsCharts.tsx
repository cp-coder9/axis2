import React from 'react';
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

// Transform chart.js data format to recharts format
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
  }[];
}

// Recharts compatible data format
export interface RechartsData {
  [key: string]: string | number;
}

interface ShadcnAnalyticsChartsProps {
  data: LegacyChartData;
  title: string;
  type?: 'bar' | 'line' | 'pie' | 'doughnut';
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string;
}

// This component now uses the enhanced chart theming system

const ShadcnAnalyticsCharts: React.FC<ShadcnAnalyticsChartsProps> = ({
  data,
  title,
  type = 'bar',
  height = 300,
  className = '',
  loading = false,
  error
}) => {
  const chartTheme = useChartTheme();

  // Show loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="flex items-end justify-center space-x-2" 
              style={{ height: `${height}px` }}
            >
              {type === 'pie' ? (
                <Skeleton className="rounded-full w-32 h-32" />
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="w-8 rounded-t-md" 
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            style={{ height: `${height}px` }} 
            className="flex items-center justify-center text-muted-foreground"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium text-destructive mb-1">Chart Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            style={{ height: `${height}px` }} 
            className="flex items-center justify-center bg-muted/50 rounded-lg"
          >
            <div className="text-center text-muted-foreground">
              <div className="text-2xl mb-2">📊</div>
              <div>No data available</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { chartData, config } = transformChartDataWithTheme(data, chartTheme);

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={chartData}>
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
            <ChartLegend content={<ChartLegendContent />} />
            {data.datasets.map((dataset, index) => {
              const key = dataset.label.replace(/\s+/g, '').toLowerCase();
              return (
                <Bar
                  key={dataset.label}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={[4, 4, 0, 0]}
                />
              );
            })}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={chartData}>
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
            <ChartLegend content={<ChartLegendContent />} />
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
                  dot={{ r: 4, fill: `var(--color-${key})` }}
                  activeDot={{ 
                    r: 6, 
                    fill: `var(--color-${key})`,
                    stroke: chartTheme.config.tooltip.backgroundColor,
                    strokeWidth: 2
                  }}
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
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="mx-auto aspect-square"
          style={{ height: `${height}px` }}
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ShadcnAnalyticsCharts;
