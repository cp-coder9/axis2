import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Box, 
  ZoomIn,
  Trash2,
  Info,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { InteractiveTooltip } from './ChartTooltipSystem';
import { cn } from "@/lib/utils";

// Selection tool types
export type SelectionMode = 'none' | 'box' | 'lasso' | 'point';

export interface DataSelection {
  mode: SelectionMode;
  indices: number[];
  dataKeys: string[];
  bounds?: {
    x: [number, number];
    y: [number, number];
  };
}

export interface EnhancedTooltipData {
  label: string;
  value: number | string;
  color: string;
  dataKey: string;
  index: number;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    previousValue?: number;
  };
  statistics?: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  additionalInfo?: Record<string, any>;
}

// Selection tool component
interface SelectionToolbarProps {
  mode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  hasSelection: boolean;
  onClearSelection: () => void;
  className?: string;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  mode,
  onModeChange,
  hasSelection,
  onClearSelection,
  className = '',
}) => {
  return (
    <Card className={cn("bg-background/95 backdrop-blur-sm border shadow-lg", className)}>
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Selection:</span>
          
          <div className="flex items-center gap-1">
            <InteractiveTooltip content="Point Selection">
              <Button
                variant={mode === 'point' ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange('point')}
                className="h-8 w-8 p-0"
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Box Selection">
              <Button
                variant={mode === 'box' ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange('box')}
                className="h-8 w-8 p-0"
              >
                <Box className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Zoom to Selection">
              <Button
                variant={mode === 'lasso' ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange('lasso')}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
          </div>
          
          {hasSelection && (
            <>
              <Separator orientation="vertical" className="h-6" />
              
              <InteractiveTooltip content="Clear Selection">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </InteractiveTooltip>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced tooltip with detailed information
interface EnhancedTooltipProps {
  data: EnhancedTooltipData | null;
  position: { x: number; y: number };
  visible: boolean;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  data,
  position,
  visible,
}) => {
  if (!visible || !data) return null;

  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'flat':
        return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`,
      }}
    >
      <Card className="shadow-xl border-2 bg-popover/98 backdrop-blur-md max-w-sm">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-semibold text-sm text-popover-foreground">
                {data.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-popover-foreground">
              {typeof data.value === 'number' 
                ? data.value.toLocaleString() 
                : data.value}
            </div>
          </div>

          {/* Trend Information */}
          {data.trend && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trend</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(data.trend.direction)}
                    <Badge variant={
                      data.trend.direction === 'up' ? 'default' : 
                      data.trend.direction === 'down' ? 'destructive' : 
                      'secondary'
                    }>
                      {data.trend.percentage > 0 ? '+' : ''}
                      {data.trend.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                {data.trend.previousValue !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Previous: {data.trend.previousValue.toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Statistics */}
          {data.statistics && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Statistics
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Min:</span>
                    <span className="ml-1 font-medium">{data.statistics.min.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>
                    <span className="ml-1 font-medium">{data.statistics.max.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg:</span>
                    <span className="ml-1 font-medium">{data.statistics.avg.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Median:</span>
                    <span className="ml-1 font-medium">{data.statistics.median.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Information */}
          {data.additionalInfo && Object.keys(data.additionalInfo).length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                {Object.entries(data.additionalInfo).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="ml-1 text-popover-foreground">{String(value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Domain selection component
interface DomainSelectorProps {
  data: any[];
  dataKeys: string[];
  onDomainSelect: (domain: { x: [number, number]; y: [number, number] }) => void;
  className?: string;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  data,
  dataKeys,
  onDomainSelect,
  className = '',
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionEnd({ x, y });
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionStart || !selectionEnd || !containerRef.current) {
      setIsSelecting(false);
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate domain based on selection
    const xMin = Math.min(selectionStart.x, selectionEnd.x) / rect.width;
    const xMax = Math.max(selectionStart.x, selectionEnd.x) / rect.width;
    const yMin = 1 - (Math.max(selectionStart.y, selectionEnd.y) / rect.height);
    const yMax = 1 - (Math.min(selectionStart.y, selectionEnd.y) / rect.height);
    
    // Convert to data indices
    const xMinIndex = Math.floor(xMin * data.length);
    const xMaxIndex = Math.ceil(xMax * data.length);
    
    onDomainSelect({
      x: [xMinIndex, xMaxIndex],
      y: [yMin, yMax],
    });
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [isSelecting, selectionStart, selectionEnd, data.length, onDomainSelect]);

  const selectionBox = selectionStart && selectionEnd ? {
    left: Math.min(selectionStart.x, selectionEnd.x),
    top: Math.min(selectionStart.y, selectionEnd.y),
    width: Math.abs(selectionEnd.x - selectionStart.x),
    height: Math.abs(selectionEnd.y - selectionStart.y),
  } : null;

  return (
    <div
      ref={containerRef}
      className={cn("relative cursor-crosshair", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {selectionBox && (
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
          style={{
            left: `${selectionBox.left}px`,
            top: `${selectionBox.top}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}
    </div>
  );
};

// Selection info panel
interface SelectionInfoProps {
  selection: DataSelection | null;
  data: any[];
  onZoomToSelection?: () => void;
  onExportSelection?: () => void;
  className?: string;
}

export const SelectionInfo: React.FC<SelectionInfoProps> = ({
  selection,
  data,
  onZoomToSelection,
  onExportSelection,
  className = '',
}) => {
  if (!selection || selection.indices.length === 0) return null;

  const selectedData = selection.indices.map(i => data[i]).filter(Boolean);
  const dataCount = selectedData.length;

  return (
    <Card className={cn("bg-background/95 backdrop-blur-sm border shadow-lg", className)}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              Selection
            </div>
            <div className="text-xs text-muted-foreground">
              {dataCount} data point{dataCount !== 1 ? 's' : ''} selected
            </div>
          </div>
          
          <Badge variant="secondary">
            {selection.mode}
          </Badge>
        </div>

        {selection.bounds && (
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">X Range:</span>
              <span className="font-mono">
                {selection.bounds.x[0]} - {selection.bounds.x[1]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Y Range:</span>
              <span className="font-mono">
                {selection.bounds.y[0].toFixed(2)} - {selection.bounds.y[1].toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onZoomToSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomToSelection}
              className="flex-1 text-xs h-7"
            >
              <ZoomIn className="w-3 h-3 mr-1" />
              Zoom
            </Button>
          )}
          {onExportSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelection}
              className="flex-1 text-xs h-7"
            >
              Export
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for managing interactive features
export const useChartInteractiveFeatures = () => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [selection, setSelection] = useState<DataSelection | null>(null);
  const [tooltipData, setTooltipData] = useState<EnhancedTooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleDataPointHover = useCallback((
    data: EnhancedTooltipData,
    event: React.MouseEvent
  ) => {
    setTooltipData(data);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setTooltipVisible(true);
  }, []);

  const handleDataPointLeave = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  const handleSelection = useCallback((newSelection: DataSelection) => {
    setSelection(newSelection);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setSelectionMode('none');
  }, []);

  const calculateStatistics = useCallback((values: number[]) => {
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }, []);

  return {
    selectionMode,
    setSelectionMode,
    selection,
    handleSelection,
    clearSelection,
    tooltipData,
    tooltipPosition,
    tooltipVisible,
    handleDataPointHover,
    handleDataPointLeave,
    calculateStatistics,
  };
};
