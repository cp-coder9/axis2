import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Grid3X3,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Minimize2,
  Move,
  Layers
} from 'lucide-react';
import {
  WidgetLayout,
  DashboardWidget,
  DashboardSettings
} from '@/types/dashboard';
import { ResizableWidgetContainer } from './ResizableWidgetContainer';
import { EnhancedDashboardWidget } from './EnhancedDashboardWidget';
import { GridLayoutSystem, compactLayout } from './GridLayoutSystem';
import { DragDropHandler } from './DragDropHandler';

interface DashboardLayoutManagerProps {
  widgets: DashboardWidget[];
  initialLayout?: WidgetLayout[];
  settings?: DashboardSettings;
  onLayoutChange?: (layout: WidgetLayout[]) => void;
  onSettingsChange?: (settings: Partial<DashboardSettings>) => void;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const DashboardLayoutManager: React.FC<DashboardLayoutManagerProps> = ({
  widgets,
  initialLayout = [],
  settings,
  onLayoutChange,
  onSettingsChange,
  isEditMode = false,
  onEditModeChange
}) => {
  const [layout, setLayout] = useState<WidgetLayout[]>(initialLayout);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(settings?.compactMode ?? false);

  // Initialize layout for widgets that Don't have one
  const completeLayout = useMemo(() => {
    const existingIds = new Set(layout.map(l => l.id));
    const newLayouts: WidgetLayout[] = [];

    widgets.forEach((widget, index) => {
      if (!existingIds.has(widget.id)) {
        newLayouts.push({
          i: widget.id,
          id: widget.id,
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 3,
          w: widget.defaultW || 4,
          h: widget.defaultH || 3,
          minW: widget.minW || 2,
          minH: widget.minH || 2,
          maxW: widget.maxW || 12,
          maxH: widget.maxH || 8,
          isDraggable: true,
          isResizable: true
        });
      }
    });

    return [...layout, ...newLayouts];
  }, [widgets, layout]);

  // Update layout when complete layout changes
  useEffect(() => {
    if (completeLayout.length !== layout.length) {
      setLayout(completeLayout);
    }
  }, [completeLayout, layout.length]);

  // Handle widget move
  const handleWidgetMove = useCallback((widgetId: string, newPosition: { x: number; y: number }) => {
    const newLayout = completeLayout.map(l =>
      l.id === widgetId
        ? { ...l, x: newPosition.x, y: newPosition.y }
        : l
    );
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [completeLayout, onLayoutChange]);

  // Handle widget resize
  const handleWidgetResize = useCallback((widgetId: string, newSize: { w: number; h: number }) => {
    const newLayout = completeLayout.map(l =>
      l.id === widgetId
        ? { ...l, w: newSize.w, h: newSize.h }
        : l
    );
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [completeLayout, onLayoutChange]);

  // Handle drag start
  const handleDragStart = useCallback((widgetId: string) => {
    setDraggedItem(widgetId);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((widgetId: string) => {
    setDraggedItem(null);
  }, []);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    const newHiddenWidgets = new Set(hiddenWidgets);
    if (newHiddenWidgets.has(widgetId)) {
      newHiddenWidgets.delete(widgetId);
    } else {
      newHiddenWidgets.add(widgetId);
    }
    setHiddenWidgets(newHiddenWidgets);

    // Update settings
    const enabledWidgets = widgets
      .filter(w => !newHiddenWidgets.has(w.id))
      .map(w => w.id);

    onSettingsChange?.({ enabledWidgets });
  }, [hiddenWidgets, widgets, onSettingsChange]);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    const defaultLayout: WidgetLayout[] = widgets.map((widget, index) => ({
      i: widget.id,
      id: widget.id,
      x: (index % 3) * 4,
      y: Math.floor(index / 3) * 3,
      w: widget.defaultW || 4,
      h: widget.defaultH || 3,
      minW: widget.minW || 2,
      minH: widget.minH || 2,
      maxW: widget.maxW || 12,
      maxH: widget.maxH || 8,
      isDraggable: true,
      isResizable: true
    }));

    setLayout(defaultLayout);
    setHiddenWidgets(new Set());
    onLayoutChange?.(defaultLayout);
  }, [widgets, onLayoutChange]);

  // Compact layout
  const handleCompactLayout = useCallback(() => {
    const compactedLayout = compactLayout(completeLayout);
    setLayout(compactedLayout);
    onLayoutChange?.(compactedLayout);
  }, [completeLayout, onLayoutChange]);

  // Save current layout
  const saveLayout = useCallback(() => {
    const newSettings: Partial<DashboardSettings> = {
      layout,
      enabledWidgets: widgets
        .filter(w => !hiddenWidgets.has(w.id))
        .map(w => w.id),
      compactMode: isCompactMode,
      lastUpdated: new Date()
    };

    onSettingsChange?.(newSettings);
    onEditModeChange?.(false);
  }, [layout, hiddenWidgets, isCompactMode, widgets, onSettingsChange, onEditModeChange]);

  // Toggle compact mode
  const toggleCompactMode = useCallback(() => {
    const newCompactMode = !isCompactMode;
    setIsCompactMode(newCompactMode);
    onSettingsChange?.({ compactMode: newCompactMode });
  }, [isCompactMode, onSettingsChange]);

  // Render widget controls
  const renderWidgetControls = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Dashboard Layout
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isEditMode ? "default" : "secondary"}>
              {isEditMode ? "Edit Mode" : "View Mode"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditModeChange?.(!isEditMode)}
            >
              {isEditMode ? "Exit Edit" : "Edit Layout"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isEditMode && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Layout
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCompactLayout}
              className="flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Compact Layout
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleCompactMode}
              className="flex items-center gap-2"
            >
              {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              {isCompactMode ? "Expand View" : "Compact View"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saveLayout}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </Button>
          </div>

          <Separator className="mb-4" />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Widget Visibility</h4>
            <div className="flex flex-wrap gap-2">
              {widgets.map(widget => (
                <Button
                  key={widget.id}
                  variant={hiddenWidgets.has(widget.id) ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="flex items-center gap-2"
                >
                  {hiddenWidgets.has(widget.id) ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  {widget.title}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  // Filter visible widgets
  const visibleWidgets = widgets.filter(w => !hiddenWidgets.has(w.id));
  const visibleLayout = completeLayout.filter(l => !hiddenWidgets.has(l.id));

  // Grid configuration
  const gridCols = 12;
  const colWidth = 100;
  const rowHeight = 100;
  const margin: [number, number] = [16, 16];

  return (
    <div className="space-y-4">
      {renderWidgetControls()}

      <GridLayoutSystem
        widgets={visibleWidgets}
        layout={visibleLayout}
        onLayoutChange={onLayoutChange || (() => { })}
        gridCols={gridCols}
        gridRowHeight={rowHeight}
        margin={margin}
        containerPadding={margin}
        isEditMode={isEditMode}
      >
        {({ gridItems, gridStyle, getItemStyle, handleItemMove, handleItemResize }) => (
          <div style={gridStyle} className="relative">
            {gridItems.map((item) => (
              <DragDropHandler
                key={item.id}
                itemId={item.id}
                layout={item.layout}
                isEditMode={isEditMode}
                gridCols={gridCols}
                colWidth={colWidth}
                rowHeight={rowHeight}
                margin={margin}
                onMove={handleWidgetMove}
                onResize={handleWidgetResize}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div
                  style={getItemStyle(item)}
                  className={`${draggedItem === item.id ? 'opacity-80 z-50' : ''}`}
                >
                  <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {item.widget.title}
                        </CardTitle>
                        {isEditMode && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {item.layout.w}×{item.layout.h}
                            </Badge>
                            <Move className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 h-full">
                      <EnhancedDashboardWidget
                        widget={item.widget}
                        isVisible={true}
                        onError={(error) => console.error(`Widget ${item.id} error:`, error)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </DragDropHandler>
            ))}
          </div>
        )}
      </GridLayoutSystem>

      {visibleWidgets.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Grid3X3 className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No widgets visible</h3>
              <p className="text-sm text-muted-foreground">
                Enable some widgets to see your dashboard content
              </p>
            </div>
            {isEditMode && (
              <Button onClick={resetLayout} variant="outline">
                Reset to Default Layout
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};