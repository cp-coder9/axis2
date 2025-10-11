import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Grid, 
  Settings, 
  Move, 
  Maximize2, 
  Minimize2, 
  MoreHorizontal,
  Layout,
  Monitor
} from 'lucide-react';

// Import unused grid layout utilities
import { 
  GridLayoutSystem, 
  GridItem, 
  compactLayout 
} from '@/components/dashboard/GridLayoutSystem';
import { 
  usePerformanceMonitor,
  useThrottledValue,
  PERFORMANCE_CONFIG
} from '@/utils/performance';
import { WidgetLayout, DashboardWidget } from '@/types/dashboard';

interface EnhancedDashboardGridProps {
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
  onLayoutChange: (layout: WidgetLayout[]) => void;
  isEditMode?: boolean;
  userRole?: string;
}

/**
 * Enhanced Dashboard Grid using unused GridLayoutSystem and performance utilities
 * Integrates drag-and-drop, performance monitoring, and responsive design
 */
export function EnhancedDashboardGrid({
  widgets,
  layout,
  onLayoutChange,
  isEditMode = false,
  userRole = 'Admin'
}: EnhancedDashboardGridProps) {
  const [editMode, setEditMode] = useState(isEditMode);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [gridSettings, setGridSettings] = useState({
    cols: 12,
    rowHeight: 100,
    margin: [10, 10] as [number, number],
    containerPadding: [10, 10] as [number, number]
  });

  // Performance monitoring for the grid system
  const { getStats } = usePerformanceMonitor('EnhancedDashboardGrid');

  // Throttle layout updates for performance
  const throttledLayout = useThrottledValue(layout, PERFORMANCE_CONFIG.RENDER_THROTTLE);

  // Filter widgets based on user role
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => 
      !widget.permissions || widget.permissions.includes(userRole as any)
    );
  }, [widgets, userRole]);

  // Handle layout changes with performance optimization
  const handleLayoutChange = useCallback((newLayout: WidgetLayout[]) => {
    // Use throttled updates to prevent excessive re-renders
    const optimizedLayout = compactLayout(newLayout);
    onLayoutChange(optimizedLayout);
  }, [onLayoutChange]);

  // Handle widget move with performance tracking
  const handleWidgetMove = useCallback((itemId: string, newPosition: { x: number; y: number }) => {
    const startTime = performance.now();
    
    const newLayout = layout.map(l => 
      l.id === itemId 
        ? { ...l, x: newPosition.x, y: newPosition.y }
        : l
    );
    
    handleLayoutChange(newLayout);
    
    const endTime = performance.now();
    if (PERFORMANCE_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
      console.log(`Widget move took ${endTime - startTime} milliseconds`);
    }
  }, [layout, handleLayoutChange]);

  // Handle widget resize with validation
  const handleWidgetResize = useCallback((itemId: string, newSize: { w: number; h: number }) => {
    const widget = widgets.find(w => w.id === itemId);
    if (!widget) return;

    // Validate size constraints
    const clampedW = Math.max(widget.minW || 2, Math.min(widget.maxW || 12, newSize.w));
    const clampedH = Math.max(widget.minH || 2, Math.min(widget.maxH || 8, newSize.h));

    const newLayout = layout.map(l => 
      l.id === itemId 
        ? { ...l, w: clampedW, h: clampedH }
        : l
    );
    
    handleLayoutChange(newLayout);
  }, [widgets, layout, handleLayoutChange]);

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedWidget(null);
  };

  // Reset layout to default
  const resetLayout = () => {
    const defaultLayout = widgets.map((widget, index) => ({
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
    
    handleLayoutChange(defaultLayout);
  };

  // Compact layout
  const handleCompactLayout = () => {
    const compactedLayout = compactLayout(layout);
    handleLayoutChange(compactedLayout);
  };

  // Render widget content
  const renderWidgetContent = (widget: DashboardWidget, gridItem: GridItem) => {
    const isSelected = selectedWidget === widget.id;
    
    return (
      <Card 
        className={`h-full transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${editMode ? 'cursor-move' : ''}`}
        onClick={() => editMode && setSelectedWidget(widget.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            {editMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleWidgetResize(widget.id, { w: 6, h: 4 })}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Expand
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleWidgetResize(widget.id, { w: 3, h: 2 })}>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {widget.description && (
            <CardDescription className="text-xs">{widget.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {/* Widget content would be rendered here */}
          <div className="flex items-center justify-center h-20 bg-muted rounded text-muted-foreground text-sm">
            {widget.type} Widget
          </div>
          
          {editMode && (
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{gridItem.layout.w}×{gridItem.layout.h}</span>
              <Badge variant="outline" className="text-xs">
                {widget.category}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Grid Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={toggleEditMode}
            />
            <Label htmlFor="edit-mode">Edit Mode</Label>
          </div>
          
          {editMode && (
            <div className="flex items-center gap-2">
              <Button onClick={handleCompactLayout} variant="outline" size="sm">
                <Layout className="h-4 w-4 mr-2" />
                Compact
              </Button>
              <Button onClick={resetLayout} variant="outline" size="sm">
                <Grid className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredWidgets.length} widgets
          </Badge>
          {PERFORMANCE_CONFIG.ENABLE_PERFORMANCE_MONITORING && (
            <Badge variant="outline">
              {getStats().renderCount} renders
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Settings (Edit Mode Only) */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grid Settings</CardTitle>
            <CardDescription>Configure grid layout parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="layout" className="w-full">
              <TabsList>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="layout" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="cols">Columns</Label>
                    <input
                      id="cols"
                      type="number"
                      min="6"
                      max="24"
                      value={gridSettings.cols}
                      onChange={(e) => setGridSettings(prev => ({ 
                        ...prev, 
                        cols: parseInt(e.target.value) 
                      }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rowHeight">Row Height</Label>
                    <input
                      id="rowHeight"
                      type="number"
                      min="50"
                      max="200"
                      value={gridSettings.rowHeight}
                      onChange={(e) => setGridSettings(prev => ({ 
                        ...prev, 
                        rowHeight: parseInt(e.target.value) 
                      }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin">Margin</Label>
                    <input
                      id="margin"
                      type="number"
                      min="0"
                      max="20"
                      value={gridSettings.margin[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setGridSettings(prev => ({ 
                          ...prev, 
                          margin: [value, value] as [number, number]
                        }));
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="padding">Padding</Label>
                    <input
                      id="padding"
                      type="number"
                      min="0"
                      max="20"
                      value={gridSettings.containerPadding[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setGridSettings(prev => ({ 
                          ...prev, 
                          containerPadding: [value, value] as [number, number]
                        }));
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Render Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{getStats().renderCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Throttle Delay</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {PERFORMANCE_CONFIG.RENDER_THROTTLE}ms
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Grid Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{filteredWidgets.length}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <GridLayoutSystem
        widgets={filteredWidgets}
        layout={throttledLayout}
        onLayoutChange={handleLayoutChange}
        gridCols={gridSettings.cols}
        gridRowHeight={gridSettings.rowHeight}
        margin={gridSettings.margin}
        containerPadding={gridSettings.containerPadding}
        isEditMode={editMode}
      >
        {({ gridItems, gridStyle, getItemStyle, handleItemMove, handleItemResize }) => (
          <div style={gridStyle} className="relative">
            {gridItems.map((gridItem) => {
              const widget = filteredWidgets.find(w => w.id === gridItem.id);
              if (!widget) return null;

              return (
                <div
                  key={gridItem.id}
                  style={getItemStyle(gridItem)}
                  className={`transition-all duration-200 ${
                    editMode ? 'hover:z-10' : ''
                  }`}
                  role={editMode ? "button" : undefined}
                  tabIndex={editMode ? 0 : undefined}
                  aria-label={editMode ? `Drag ${widget.name} widget` : undefined}
                  onKeyDown={editMode ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Handle keyboard activation
                    }
                  } : undefined}
                  onMouseDown={(e) => {
                    if (editMode && e.button === 0) {
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startPos = { x: gridItem.layout.x, y: gridItem.layout.y };

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = Math.round((moveEvent.clientX - startX) / (gridSettings.rowHeight + gridSettings.margin[0]));
                        const deltaY = Math.round((moveEvent.clientY - startY) / (gridSettings.rowHeight + gridSettings.margin[1]));
                        
                        handleItemMove(gridItem.id, {
                          x: Math.max(0, startPos.x + deltaX),
                          y: Math.max(0, startPos.y + deltaY)
                        });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }
                  }}
                >
                  {renderWidgetContent(widget, gridItem)}
                  
                  {/* Resize Handle */}
                  {editMode && (
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary/20 hover:bg-primary/40 transition-colors"
                      role="button"
                      tabIndex={0}
                      aria-label={`Resize ${widget.name} widget`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Handle keyboard resize
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startSize = { w: gridItem.layout.w, h: gridItem.layout.h };

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = Math.round((moveEvent.clientX - startX) / (gridSettings.rowHeight + gridSettings.margin[0]));
                          const deltaY = Math.round((moveEvent.clientY - startY) / (gridSettings.rowHeight + gridSettings.margin[1]));
                          
                          handleItemResize(gridItem.id, {
                            w: Math.max(widget.minW || 2, startSize.w + deltaX),
                            h: Math.max(widget.minH || 2, startSize.h + deltaY)
                          });
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GridLayoutSystem>

      {/* Selected Widget Info */}
      {editMode && selectedWidget && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Widget Properties</CardTitle>
            <CardDescription>
              Configure selected widget: {widgets.find(w => w.id === selectedWidget)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(() => {
                const widget = widgets.find(w => w.id === selectedWidget);
                const layoutItem = layout.find(l => l.id === selectedWidget);
                if (!widget || !layoutItem) return null;

                return (
                  <>
                    <div>
                      <Label>Position</Label>
                      <p>{layoutItem.x}, {layoutItem.y}</p>
                    </div>
                    <div>
                      <Label>Size</Label>
                      <p>{layoutItem.w} × {layoutItem.h}</p>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <p>{widget.type}</p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p>{widget.category}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedDashboardGrid;