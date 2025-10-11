import React, { useCallback, useRef, useState, useEffect } from 'react';
import { WidgetLayout } from '@/types/dashboard';

interface DragDropHandlerProps {
  itemId: string;
  layout: WidgetLayout;
  isEditMode: boolean;
  gridCols: number;
  colWidth: number;
  rowHeight: number;
  margin: [number, number];
  onMove: (itemId: string, newPosition: { x: number; y: number }) => void;
  onResize: (itemId: string, newSize: { w: number; h: number }) => void;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: (itemId: string) => void;
  children: React.ReactNode;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  startX: number;
  startY: number;
  startGridX: number;
  startGridY: number;
  startWidth: number;
  startHeight: number;
  resizeHandle?: 'se' | 'e' | 's';
}

export const DragDropHandler: React.FC<DragDropHandlerProps> = ({
  itemId,
  layout,
  isEditMode,
  gridCols,
  colWidth,
  rowHeight,
  margin,
  onMove,
  onResize,
  onDragStart,
  onDragEnd,
  children
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startGridX: 0,
    startGridY: 0,
    startWidth: 0,
    startHeight: 0
  });

  // Convert pixel coordinates to grid coordinates
  const pixelToGrid = useCallback((pixelX: number, pixelY: number) => {
    const gridX = Math.round(pixelX / (colWidth + margin[0]));
    const gridY = Math.round(pixelY / (rowHeight + margin[1]));
    return { x: Math.max(0, Math.min(gridCols - 1, gridX)), y: Math.max(0, gridY) };
  }, [colWidth, rowHeight, margin, gridCols]);

  // Convert pixel size to grid size
  const pixelToGridSize = useCallback((pixelW: number, pixelH: number) => {
    const gridW = Math.max(1, Math.round(pixelW / (colWidth + margin[0])));
    const gridH = Math.max(1, Math.round(pixelH / (rowHeight + margin[1])));
    return { w: gridW, h: gridH };
  }, [colWidth, rowHeight, margin]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || !elementRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = elementRef.current.getBoundingClientRect();
    const isResizeHandle = (e.target as HTMLElement).classList.contains('resize-handle');
    const resizeHandle = isResizeHandle ? (e.target as HTMLElement).dataset.handle as 'se' | 'e' | 's' : undefined;

    setDragState({
      isDragging: !isResizeHandle,
      isResizing: isResizeHandle,
      startX: e.clientX,
      startY: e.clientY,
      startGridX: layout.x,
      startGridY: layout.y,
      startWidth: rect.width,
      startHeight: rect.height,
      resizeHandle
    });

    if (!isResizeHandle) {
      onDragStart?.(itemId);
    }
  }, [isEditMode, layout, itemId, onDragStart]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;

    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    if (dragState.isDragging) {
      // Handle dragging
      const newPixelX = dragState.startGridX * (colWidth + margin[0]) + deltaX;
      const newPixelY = dragState.startGridY * (rowHeight + margin[1]) + deltaY;
      const newGridPos = pixelToGrid(newPixelX, newPixelY);
      
      // Ensure the widget stays within bounds
      const maxX = gridCols - layout.w;
      const clampedX = Math.max(0, Math.min(maxX, newGridPos.x));
      const clampedY = Math.max(0, newGridPos.y);
      
      if (clampedX !== layout.x || clampedY !== layout.y) {
        onMove(itemId, { x: clampedX, y: clampedY });
      }
    } else if (dragState.isResizing && dragState.resizeHandle) {
      // Handle resizing
      let newWidth = dragState.startWidth;
      let newHeight = dragState.startHeight;

      if (dragState.resizeHandle.includes('e')) {
        newWidth = Math.max(colWidth, dragState.startWidth + deltaX);
      }
      if (dragState.resizeHandle.includes('s')) {
        newHeight = Math.max(rowHeight, dragState.startHeight + deltaY);
      }

      const newGridSize = pixelToGridSize(newWidth, newHeight);
      
      // Apply constraints
      const minW = layout.minW || 1;
      const minH = layout.minH || 1;
      const maxW = layout.maxW || gridCols;
      const maxH = layout.maxH || 20;
      
      const clampedW = Math.max(minW, Math.min(maxW, newGridSize.w));
      const clampedH = Math.max(minH, Math.min(maxH, newGridSize.h));
      
      // Ensure widget doesn't exceed grid bounds
      const maxAllowedW = gridCols - layout.x;
      const finalW = Math.min(clampedW, maxAllowedW);
      
      if (finalW !== layout.w || clampedH !== layout.h) {
        onResize(itemId, { w: finalW, h: clampedH });
      }
    }
  }, [dragState, colWidth, rowHeight, margin, gridCols, layout, pixelToGrid, pixelToGridSize, onMove, onResize, itemId]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || dragState.isResizing) {
      setDragState({
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        startGridX: 0,
        startGridY: 0,
        startWidth: 0,
        startHeight: 0
      });

      if (dragState.isDragging) {
        onDragEnd?.(itemId);
      }
    }
  }, [dragState, itemId, onDragEnd]);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.isDragging ? 'grabbing' : 'nw-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      role={isEditMode ? "button" : undefined}
      tabIndex={isEditMode ? 0 : undefined}
      aria-label={isEditMode ? "Drag to reposition widget" : undefined}
      onKeyDown={isEditMode ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle keyboard activation for drag
        }
      } : undefined}
      className={`relative ${isEditMode ? 'cursor-move' : ''} ${
        dragState.isDragging ? 'z-50 opacity-80' : ''
      }`}
      style={{
        transition: dragState.isDragging || dragState.isResizing ? 'none' : 'all 0.2s ease-in-out'
      }}
    >
      {children}
      
      {/* Resize handles */}
      {isEditMode && layout.isResizable && (
        <>
          {/* Bottom-right corner handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
            data-handle="se"
            style={{
              background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
              borderRadius: '0 0 4px 0'
            }}
          />
          
          {/* Right edge handle */}
          <div
            className="resize-handle absolute top-2 right-0 w-2 h-8 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity bg-blue-500 rounded-l"
            data-handle="e"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
          
          {/* Bottom edge handle */}
          <div
            className="resize-handle absolute bottom-0 left-2 w-8 h-2 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity bg-blue-500 rounded-t"
            data-handle="s"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
        </>
      )}
      
      {/* Drag indicator */}
      {isEditMode && dragState.isDragging && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded bg-blue-50/20 pointer-events-none" />
      )}
    </div>
  );
};