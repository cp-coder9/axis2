import React, { useState, useCallback, useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Brush,
  ReferenceArea,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChartTheme, transformChartDataWithTheme } from './ChartThemeProvider';
import { ChartZoomPanControls, useChartZoomPan, ZoomPanChartContainer } from './ChartZoomPanSystem';
import {
  SelectionToolbar,
  EnhancedTooltip,
  SelectionInfo,
  useChartInteractiveFeatures,
  type EnhancedTooltipData,
  type DataSelection,
} from './ChartInteractiveFeatures';
import { cn } from "@/lib/utils";

interface InteractiveChartDemoProps {
  data: any;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

const InteractiveChartDemo: React.FC<InteractiveChartDemoProps> = ({
  data,
  title = "Interactive Chart with Advanced Features",
  description = "Explore zoom, pan, selection, and enhanced tooltips",
  height = 400,
  className = '',
}) => {
  const chartTheme = useChartTheme();
  const { chartData, config } = useMemo(() => 
    transformChartDataWithTheme(data, chartTheme), 
    [data, chartTheme]
  );

  // Zoom and pan state
  const {
    zoomState,
    updateZoomState,
    resetZoomState,
    zoomToSelection,
  } = useChartZoomPan();

  // Interactive features state
  const {
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
  } = useChartInteractiveFeatures();

  // Domain selection state
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  const dataKeys = Object.keys(config);

  // Calculate enhanced tooltip data
  const createEnhancedTooltipData = useCallback((
    payload: any,
    index: number
  ): EnhancedTooltipData | null => {
    if (!payload || !payload.length) return null;

    const entry = payload[0];
    const dataKey = entry.dataKey;
    const value = entry.value;

    // Calculate trend
    let trend = undefined;
    if (index > 0) {
      const previousValue = chartData[index - 1]?.[dataKey];
      if (previousValue !== undefined) {
        const change = value - previousValue;
        const percentage = (change / previousValue) * 100;
        trend = {
          direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'flat' as const,
          percentage,
          previousValue,
        };
      }
    }

    // Calculate statistics for the data series
    const values = chartData.map(item => item[dataKey]).filter(v => typeof v === 'number');
    const statistics = calculateStatistics(values);

    return {
      label: chartData[index].name,
      value,
      color: entry.color,
      dataKey,
      index,
      trend,
      statistics,
      additionalInfo: {
        'Data Point': `${index + 1} of ${chartData.length}`,
        'Series': config[dataKey]?.label || dataKey,
      },
    };
  }, [chartData, config, calculateStatistics]);

  // Handle chart mouse move for custom tooltip
  const handleChartMouseMove = useCallback((e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const tooltipData = createEnhancedTooltipData(e.activePayload, e.activeTooltipIndex);
      if (tooltipData) {
        handleDataPointHover(tooltipData, e as any);
      }
    }
  }, [createEnhancedTooltipData, handleDataPointHover]);

  // Handle domain selection with brush
  const handleMouseDown = useCallback((e: any) => {
    if (selectionMode === 'box' && e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
    }
  }, [selectionMode]);

  const handleMouseMove = useCallback((e: any) => {
    if (refAreaLeft && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  }, [refAreaLeft]);

  const handleMouseUp = useCallback(() => {
    if (!refAreaLeft || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // Find indices
    const leftIndex = chartData.findIndex(item => item.name === refAreaLeft);
    const rightIndex = chartData.findIndex(item => item.name === refAreaRight);

    if (leftIndex === -1 || rightIndex === -1) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    const startIndex = Math.min(leftIndex, rightIndex);
    const endIndex = Math.max(leftIndex, rightIndex);

    // Create selection
    const newSelection: DataSelection = {
      mode: 'box',
      indices: Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i),
      dataKeys,
      bounds: {
        x: [startIndex, endIndex],
        y: [0, 1], // Would need to calculate actual Y bounds
      },
    };

    handleSelection(newSelection);

    // Zoom to selection if in lasso mode
    if (selectionMode === 'lasso') {
      zoomToSelection(startIndex, endIndex, chartData.length);
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, [refAreaLeft, refAreaRight, chartData, dataKeys, handleSelection, selectionMode, zoomToSelection]);

  // Handle zoom to selection
  const handleZoomToSelection = useCallback(() => {
    if (!selection || selection.indices.length === 0) return;
    
    const startIndex = Math.min(...selection.indices);
    const endIndex = Math.max(...selection.indices);
    zoomToSelection(startIndex, endIndex, chartData.length);
  }, [selection, chartData.length, zoomToSelection]);

  // Handle export selection
  const handleExportSelection = useCallback(() => {
    if (!selection || selection.indices.length === 0) return;

    const selectedData = selection.indices.map(i => chartData[i]).filter(Boolean);
    const csvContent = [
      ['Name', ...dataKeys].join(','),
      ...selectedData.map(item => 
        [item.name, ...dataKeys.map(key => item[key] || 0)].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart_selection.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selection, chartData, dataKeys]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Interactive Features</TabsTrigger>
            <TabsTrigger value="zoom">Zoom & Pan</TabsTrigger>
            <TabsTrigger value="selection">Selection Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Hover over data points to see enhanced tooltips with trends and statistics.
              Use the brush at the bottom to zoom into specific ranges.
            </div>

            <div className="relative">
              <ChartContainer
                config={config}
                className="w-full"
                style={{ height: `${height}px` }}
              >
                <LineChart
                  data={chartData}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleDataPointLeave}
                >
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
                  />
                  <YAxis 
                    tick={{ 
                      fontSize: chartTheme.config.axis.fontSize,
                      fill: chartTheme.config.axis.stroke,
                    }}
                  />
                  <ChartLegend />
                  
                  {dataKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                  
                  <Brush
                    dataKey="name"
                    height={30}
                    stroke={chartTheme.config.grid.stroke}
                  />
                </LineChart>
              </ChartContainer>

              <EnhancedTooltip
                data={tooltipData}
                position={tooltipPosition}
                visible={tooltipVisible}
              />
            </div>
          </TabsContent>

          <TabsContent value="zoom" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use zoom controls to magnify the chart. Pan mode allows you to drag the chart around.
              Mouse wheel also works for zooming.
            </div>

            <ChartZoomPanControls
              zoomState={zoomState}
              onZoomChange={updateZoomState}
              onReset={resetZoomState}
              enablePan={true}
            />

            <ZoomPanChartContainer
              zoomState={zoomState}
              onZoomChange={updateZoomState}
              enableMouseWheel={true}
              enablePinchZoom={true}
            >
              <ChartContainer
                config={config}
                className="w-full"
                style={{ height: `${height}px` }}
              >
                <LineChart data={chartData}>
                  <CartesianGrid 
                    strokeDasharray={chartTheme.config.grid.strokeDasharray}
                    stroke={chartTheme.config.grid.stroke}
                    className="opacity-30"
                  />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <ChartLegend />
                  
                  {dataKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </ZoomPanChartContainer>
          </TabsContent>

          <TabsContent value="selection" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select a mode and drag on the chart to select data points.
              Box mode creates a rectangular selection. Lasso mode zooms to the selection.
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-4">
                <SelectionToolbar
                  mode={selectionMode}
                  onModeChange={setSelectionMode}
                  hasSelection={!!selection && selection.indices.length > 0}
                  onClearSelection={clearSelection}
                />

                <div className="relative">
                  <ChartContainer
                    config={config}
                    className="w-full"
                    style={{ height: `${height}px` }}
                  >
                    <LineChart
                      data={chartData}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <CartesianGrid 
                        strokeDasharray={chartTheme.config.grid.strokeDasharray}
                        stroke={chartTheme.config.grid.stroke}
                        className="opacity-30"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <ChartLegend />
                      
                      {dataKeys.map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={`var(--color-${key})`}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}

                      {refAreaLeft && refAreaRight && (
                        <ReferenceArea
                          x1={refAreaLeft}
                          x2={refAreaRight}
                          strokeOpacity={0.3}
                          fill={chartTheme.config.grid.stroke}
                          fillOpacity={0.3}
                        />
                      )}
                    </LineChart>
                  </ChartContainer>
                </div>
              </div>

              {selection && selection.indices.length > 0 && (
                <SelectionInfo
                  selection={selection}
                  data={chartData}
                  onZoomToSelection={handleZoomToSelection}
                  onExportSelection={handleExportSelection}
                  className="w-64"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InteractiveChartDemo;
