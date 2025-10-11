import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Maximize2,
  Minimize2,
  Maximize,
  Minimize
} from "lucide-react";
import { InteractiveTooltip } from './ChartTooltipSystem';

export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  domain: {
    x: [number, number] | null;
    y: [number, number] | null;
  };
}

interface ChartZoomPanControlsProps {
  zoomState: ZoomState;
  onZoomChange: (newState: Partial<ZoomState>) => void;
  onReset: () => void;
  minZoom?: number;
  maxZoom?: number;
  enablePan?: boolean;
  className?: string;
}

export const ChartZoomPanControls: React.FC<ChartZoomPanControlsProps> = ({
  zoomState,
  onZoomChange,
  onReset,
  minZoom = 0.5,
  maxZoom = 5,
  enablePan = true,
  className = '',
}) => {
  const [isPanning, setIsPanning] = useState(false);

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(zoomState.scale * 1.2, maxZoom);
    onZoomChange({ scale: newScale });
  }, [zoomState.scale, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(zoomState.scale / 1.2, minZoom);
    onZoomChange({ scale: newScale });
  }, [zoomState.scale, minZoom, onZoomChange]);

  const handleZoomSliderChange = useCallback((value: number[]) => {
    onZoomChange({ scale: value[0] });
  }, [onZoomChange]);

  const togglePanMode = useCallback(() => {
    setIsPanning(!isPanning);
  }, [isPanning]);

  const isZoomed = zoomState.scale !== 1 || zoomState.translateX !== 0 || zoomState.translateY !== 0;

  return (
    <Card className={`${className} bg-background/95 backdrop-blur-sm border shadow-lg`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <InteractiveTooltip content="Zoom In">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomState.scale >= maxZoom}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Zoom Out">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomState.scale <= minZoom}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-xs text-muted-foreground">
              {Math.round(zoomState.scale * 100)}%
            </span>
            <Slider
              value={[zoomState.scale]}
              onValueChange={handleZoomSliderChange}
              min={minZoom}
              max={maxZoom}
              step={0.1}
              className="flex-1"
            />
          </div>

          {/* Pan Toggle */}
          {enablePan && (
            <InteractiveTooltip content={isPanning ? "Exit Pan Mode" : "Enter Pan Mode"}>
              <Button
                variant={isPanning ? "default" : "outline"}
                size="sm"
                onClick={togglePanMode}
                className="h-8 w-8 p-0"
              >
                <Move className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
          )}

          {/* Reset */}
          <InteractiveTooltip content="Reset Zoom & Pan">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!isZoomed}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </InteractiveTooltip>

          {/* Fullscreen Toggle */}
          <div className="flex items-center gap-1">
            <InteractiveTooltip content="Maximize View">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Toggle fullscreen mode
                  document.documentElement.requestFullscreen?.();
                }}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
            
            <InteractiveTooltip content="Minimize View">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Exit fullscreen mode
                  document.exitFullscreen?.();
                }}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </InteractiveTooltip>
          </div>

          {/* Status Badge */}
          {isZoomed && (
            <Badge variant="secondary" className="text-xs">
              Modified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for managing zoom and pan state
export const useChartZoomPan = (initialState?: Partial<ZoomState>) => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    domain: { x: null, y: null },
    ...initialState,
  });

  const updateZoomState = useCallback((updates: Partial<ZoomState>) => {
    setZoomState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetZoomState = useCallback(() => {
    setZoomState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      domain: { x: null, y: null },
    });
  }, []);

  const zoomToFit = useCallback((dataLength: number) => {
    // Calculate optimal zoom to fit all data based on data length
    const baseScale = dataLength > 20 ? 0.8 : dataLength < 5 ? 1.5 : 1;
    const optimalScale = Math.min(2, Math.max(0.5, baseScale));
    setZoomState(prev => ({
      ...prev,
      scale: optimalScale,
      translateX: 0,
      translateY: 0,
    }));
  }, []);

  const zoomToSelection = useCallback((startIndex: number, endIndex: number, dataLength: number) => {
    const selectionRatio = (endIndex - startIndex) / dataLength;
    const scale = Math.min(5, 1 / selectionRatio);
    const translateX = -(startIndex / dataLength) * scale * 100;
    
    setZoomState(prev => ({
      ...prev,
      scale,
      translateX,
      translateY: 0,
    }));
  }, []);

  return {
    zoomState,
    updateZoomState,
    resetZoomState,
    zoomToFit,
    zoomToSelection,
  };
};

// Chart container with zoom and pan capabilities
interface ZoomPanChartContainerProps {
  children: React.ReactNode;
  zoomState: ZoomState;
  onZoomChange: (updates: Partial<ZoomState>) => void;
  enableMouseWheel?: boolean;
  enablePinchZoom?: boolean;
  className?: string;
}

export const ZoomPanChartContainer: React.FC<ZoomPanChartContainerProps> = ({
  children,
  zoomState,
  onZoomChange,
  enableMouseWheel = true,
  enablePinchZoom = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse wheel zoom
  useEffect(() => {
    if (!enableMouseWheel || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(5, zoomState.scale * delta));
      
      onZoomChange({ scale: newScale });
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableMouseWheel, zoomState.scale, onZoomChange]);

  // Mouse drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onZoomChange({
      translateX: zoomState.translateX + deltaX,
      translateY: zoomState.translateY + deltaY,
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, zoomState.translateX, zoomState.translateY, onZoomChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch/pinch zoom (basic implementation)
  const [touchStart, setTouchStart] = useState<{ distance: number; center: { x: number; y: number } } | null>(null);

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    if (!touch1 || !touch2) return 0;
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    if (!touch1 || !touch2) return { x: 0, y: 0 };
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom || e.touches.length !== 2) return;
    
    const distance = getTouchDistance(e.touches as unknown as TouchList);
    const center = getTouchCenter(e.touches as unknown as TouchList);
    setTouchStart({ distance, center });
  }, [enablePinchZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom || !touchStart || e.touches.length !== 2) return;
    
    e.preventDefault();
    
    const distance = getTouchDistance(e.touches as unknown as TouchList);
    const scale = distance / touchStart.distance;
    const newScale = Math.max(0.5, Math.min(5, zoomState.scale * scale));
    
    onZoomChange({ scale: newScale });
  }, [enablePinchZoom, touchStart, zoomState.scale, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="button"
      tabIndex={0}
      aria-label="Interactive chart with zoom and pan controls"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle keyboard interaction
        }
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `scale(${zoomState.scale}) translate(${zoomState.translateX}px, ${zoomState.translateY}px)`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      {children}
    </div>
  );
};
