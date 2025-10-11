import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight, 
  ChevronLeft, 
  Home,
  Layers,
  ZoomIn,
  BarChart3,
  PieChart,
  TrendingUp
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { InteractiveTooltip } from './ChartTooltipSystem';
import { EnhancedShadcnChart } from './EnhancedShadcnChart';

export interface DrillDownLevel {
  id: string;
  title: string;
  data: any;
  chartType?: 'bar' | 'line' | 'pie';
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface DrillDownPath {
  levels: DrillDownLevel[];
  currentLevelIndex: number;
}

interface ChartDrillDownSystemProps {
  initialData: any;
  title: string;
  onDrillDown?: (dataPoint: any, currentLevel: DrillDownLevel) => DrillDownLevel | null;
  onDrillUp?: (currentPath: DrillDownPath) => void;
  maxDepth?: number;
  className?: string;
}

export const ChartDrillDownSystem: React.FC<ChartDrillDownSystemProps> = ({
  initialData,
  title,
  onDrillDown,
  onDrillUp,
  maxDepth = 3,
  className = '',
}) => {
  const [drillPath, setDrillPath] = useState<DrillDownPath>({
    levels: [{
      id: 'root',
      title,
      data: initialData,
      chartType: 'bar',
    }],
    currentLevelIndex: 0,
  });

  const currentLevel = drillPath.levels[drillPath.currentLevelIndex];
  const canDrillDown = drillPath.currentLevelIndex < maxDepth - 1;
  const canDrillUp = drillPath.currentLevelIndex > 0;

  // Handle drill down
  const handleDrillDown = useCallback((dataPoint: any, index: number) => {
    if (!canDrillDown || !onDrillDown) return;

    const nextLevel = onDrillDown(dataPoint, currentLevel);
    if (!nextLevel) return;

    const newLevels = [...drillPath.levels.slice(0, drillPath.currentLevelIndex + 1), nextLevel];
    setDrillPath({
      levels: newLevels,
      currentLevelIndex: drillPath.currentLevelIndex + 1,
    });
  }, [canDrillDown, onDrillDown, currentLevel, drillPath]);

  // Handle drill up
  const handleDrillUp = useCallback(() => {
    if (!canDrillUp) return;

    const newPath = {
      ...drillPath,
      currentLevelIndex: drillPath.currentLevelIndex - 1,
    };
    
    setDrillPath(newPath);
    onDrillUp?.(newPath);
  }, [canDrillUp, drillPath, onDrillUp]);

  // Navigate to specific level
  const navigateToLevel = useCallback((levelIndex: number) => {
    if (levelIndex >= 0 && levelIndex < drillPath.levels.length) {
      setDrillPath(prev => ({
        ...prev,
        currentLevelIndex: levelIndex,
      }));
    }
  }, [drillPath.levels.length]);

  // Reset to root level
  const resetToRoot = useCallback(() => {
    setDrillPath(prev => ({
      ...prev,
      currentLevelIndex: 0,
    }));
  }, []);

  // Get chart icon based on type
  const getChartIcon = (chartType?: string) => {
    switch (chartType) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      case 'line':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              {getChartIcon(currentLevel.chartType)}
              {currentLevel.title}
              {drillPath.currentLevelIndex > 0 && (
                <Badge variant="outline" className="text-xs">
                  Level {drillPath.currentLevelIndex + 1}
                </Badge>
              )}
            </CardTitle>
            
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
              <BreadcrumbList>
                {drillPath.levels.map((level, index) => (
                  <React.Fragment key={level.id}>
                    <BreadcrumbItem>
                      {index === drillPath.currentLevelIndex ? (
                        <BreadcrumbPage className="flex items-center gap-1">
                          {getChartIcon(level.chartType)}
                          {level.title}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          onClick={() => navigateToLevel(index)}
                          className="flex items-center gap-1 cursor-pointer hover:text-primary"
                        >
                          {getChartIcon(level.chartType)}
                          {level.title}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < drillPath.levels.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <InteractiveTooltip content="Go to root level">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToRoot}
                disabled={drillPath.currentLevelIndex === 0}
                className="h-8 w-8 p-0"
              >
                <Home className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Go back one level">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDrillUp}
                disabled={!canDrillUp}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>

            <Badge variant="secondary" className="text-xs">
              {drillPath.currentLevelIndex + 1} / {maxDepth}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Current Level Chart */}
        <EnhancedShadcnChart
          data={currentLevel.data}
          title=""
          type={currentLevel.chartType || 'bar'}
          height={400}
          interactive={canDrillDown}
          onDataPointClick={canDrillDown ? handleDrillDown : undefined}
        />

        {/* Drill Down Instructions */}
        {canDrillDown && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ZoomIn className="w-4 h-4" />
              <span>Click on any data point to drill down for more details</span>
            </div>
          </div>
        )}

        {/* Level Metadata */}
        {currentLevel.metadata && Object.keys(currentLevel.metadata).length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Level Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(currentLevel.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for managing drill-down data
export const useDrillDownData = () => {
  // Example drill-down data structure
  const generateDrillDownData = useCallback((
    dataPoint: any, 
    currentLevel: DrillDownLevel
  ): DrillDownLevel | null => {
    // This is a sample implementation - replace with your actual drill-down logic
    
    if (currentLevel.id === 'root') {
      // First level drill-down: from overview to category details
      return {
        id: `category-${dataPoint.name}`,
        title: `${dataPoint.name} Details`,
        chartType: 'pie',
        parentId: currentLevel.id,
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Quarterly Breakdown',
            data: [
              Math.floor(dataPoint.value * 0.2),
              Math.floor(dataPoint.value * 0.3),
              Math.floor(dataPoint.value * 0.25),
              Math.floor(dataPoint.value * 0.25),
            ],
          }]
        },
        metadata: {
          category: dataPoint.name,
          totalValue: dataPoint.value,
          drillDownType: 'quarterly',
        }
      };
    }
    
    if (currentLevel.id.startsWith('category-')) {
      // Second level drill-down: from category to time series
      return {
        id: `timeseries-${dataPoint.name}`,
        title: `${dataPoint.name} Timeline`,
        chartType: 'line',
        parentId: currentLevel.id,
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Weekly Trend',
            data: [
              Math.floor(dataPoint.value * 0.8),
              Math.floor(dataPoint.value * 1.1),
              Math.floor(dataPoint.value * 0.9),
              Math.floor(dataPoint.value * 1.2),
            ],
          }]
        },
        metadata: {
          period: dataPoint.name,
          parentCategory: currentLevel.title,
          drillDownType: 'weekly',
        }
      };
    }
    
    // No further drill-down available
    return null;
  }, []);

  return {
    generateDrillDownData,
  };
};

// Pre-built drill-down configurations
export const DrillDownConfigs = {
  // Revenue drill-down: Total → Categories → Time Series
  revenue: {
    maxDepth: 3,
    generateLevel: (dataPoint: any, currentLevel: DrillDownLevel) => {
      if (currentLevel.id === 'root') {
        return {
          id: `revenue-${dataPoint.name}`,
          title: `${dataPoint.name} Revenue`,
          chartType: 'bar' as const,
          data: {
            labels: ['Product A', 'Product B', 'Product C', 'Product D'],
            datasets: [{
              label: 'Product Revenue',
              data: [
                Math.floor(dataPoint.value * 0.4),
                Math.floor(dataPoint.value * 0.3),
                Math.floor(dataPoint.value * 0.2),
                Math.floor(dataPoint.value * 0.1),
              ],
            }]
          },
          metadata: { category: dataPoint.name, type: 'product-breakdown' }
        };
      }
      return null;
    }
  },

  // Geographic drill-down: Country → State → City
  geographic: {
    maxDepth: 3,
    generateLevel: (dataPoint: any, currentLevel: DrillDownLevel) => {
      if (currentLevel.id === 'root') {
        return {
          id: `country-${dataPoint.name}`,
          title: `${dataPoint.name} Regions`,
          chartType: 'pie' as const,
          data: {
            labels: ['North', 'South', 'East', 'West'],
            datasets: [{
              label: 'Regional Distribution',
              data: [
                Math.floor(dataPoint.value * 0.35),
                Math.floor(dataPoint.value * 0.25),
                Math.floor(dataPoint.value * 0.25),
                Math.floor(dataPoint.value * 0.15),
              ],
            }]
          },
          metadata: { country: dataPoint.name, type: 'regional-breakdown' }
        };
      }
      return null;
    }
  },
};