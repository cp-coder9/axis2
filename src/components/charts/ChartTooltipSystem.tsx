import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useChartTheme } from './ChartThemeProvider';

// Enhanced tooltip content for charts
export interface ChartTooltipData {
  label: string;
  value: number | string;
  color: string;
  trend?: 'up' | 'down' | 'flat';
  percentage?: number;
  additionalInfo?: string;
}

interface EnhancedChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  showTrend?: boolean;
  showPercentage?: boolean;
  customFormatter?: (value: any, name: string) => string;
}

export const EnhancedChartTooltip: React.FC<EnhancedChartTooltipProps> = ({
  active,
  payload,
  label,
  showTrend = false,
  showPercentage = false,
  customFormatter,
}) => {
  const chartTheme = useChartTheme();

  if (!active || !payload || !payload.length) {
    return null;
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'flat':
        return <Minus className="w-3 h-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatValue = (value: any, name: string) => {
    if (customFormatter) {
      return customFormatter(value, name);
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  return (
    <Card className="shadow-lg border-0 bg-popover/95 backdrop-blur-sm">
      <CardContent className="p-3 space-y-2">
        {label && (
          <div className="font-medium text-sm text-popover-foreground border-b border-border pb-2">
            {label}
          </div>
        )}
        
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-popover-foreground font-medium">
                  {entry.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-popover-foreground">
                  {formatValue(entry.value, entry.name)}
                </span>
                
                {showTrend && entry.trend && getTrendIcon(entry.trend)}
                
                {showPercentage && entry.percentage !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {entry.percentage > 0 ? '+' : ''}{entry.percentage.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {payload.some(entry => entry.additionalInfo) && (
          <>
            <Separator />
            <div className="space-y-1">
              {payload
                .filter(entry => entry.additionalInfo)
                .map((entry, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{entry.additionalInfo}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Interactive tooltip wrapper for chart elements
interface InteractiveTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Chart legend with interactive tooltips
interface InteractiveLegendProps {
  payload?: any[];
  onToggle?: (dataKey: string, visible: boolean) => void;
  activeKeys?: string[];
}

export const InteractiveLegend: React.FC<InteractiveLegendProps> = ({
  payload,
  onToggle,
  activeKeys = [],
}) => {
  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
      {payload.map((entry, index) => {
        const isActive = activeKeys.length === 0 || activeKeys.includes(entry.dataKey);
        
        return (
          <InteractiveTooltip
            key={entry.dataKey}
            content={
              <div className="space-y-1">
                <div className="font-medium">{entry.value}</div>
                <div className="text-xs text-muted-foreground">
                  Click to {isActive ? 'hide' : 'show'} this data series
                </div>
              </div>
            }
          >
            <button
              className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-all hover:bg-muted/50 ${
                isActive ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() => onToggle?.(entry.dataKey, !isActive)}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.value}</span>
            </button>
          </InteractiveTooltip>
        );
      })}
    </div>
  );
};

// Data point highlight system
export interface DataPointHighlight {
  dataIndex: number;
  seriesKey: string;
  color: string;
  value: any;
}

interface DataPointHighlightProps {
  highlight: DataPointHighlight | null;
  onClear: () => void;
}

export const DataPointHighlight: React.FC<DataPointHighlightProps> = ({
  highlight,
  onClear,
}) => {
  if (!highlight) return null;

  return (
    <Card className="absolute top-4 right-4 z-10 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: highlight.color }}
            />
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {highlight.seriesKey}
              </div>
              <div className="text-lg font-bold">
                {highlight.value}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear highlight"
          >
            ×
          </button>
        </div>
      </CardContent>
    </Card>
  );
};