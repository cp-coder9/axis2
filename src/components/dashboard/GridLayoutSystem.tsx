import React, { useMemo, useCallback } from 'react';
import { DashboardWidget, WidgetLayout } from '@/types/dashboard';

/**
 * Grid Layout System
 * Provides a flexible grid-based layout system for dashboard widgets
 * Task 7.1: Implements drag-and-drop functionality with size constraints
 */

export interface GridItem {
  id: string;
  layout: WidgetLayout;
  widget: DashboardWidget;
}

export interface GridLayoutSystemProps {
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
  onLayoutChange: (layout: WidgetLayout[]) => void;
  gridCols?: number;
  gridRowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
  isEditMode?: boolean;
  children: (props: {
    gridItems: GridItem[];
    gridStyle: React.CSSProperties;
    getItemStyle: (item: GridItem) => React.CSSProperties;
    handleItemMove: (itemId: string, position: { x: number; y: number }) => void;
    handleItemResize: (itemId: string, size: { w: number; h: number }) => void;
  }) => React.ReactNode;
}

/**
 * Calculate grid item position and size
 */
function calculateItemStyle(
  layout: WidgetLayout,
  gridCols: number,
  gridRowHeight: number,
  margin: [number, number],
  containerWidth: number
): React.CSSProperties {
  const colWidth = (containerWidth - margin[0] * (gridCols - 1)) / gridCols;

  return {
    position: 'absolute',
    left: `${layout.x * (colWidth + margin[0])}px`,
    top: `${layout.y * (gridRowHeight + margin[1])}px`,
    width: `${layout.w * colWidth + (layout.w - 1) * margin[0]}px`,
    height: `${layout.h * gridRowHeight + (layout.h - 1) * margin[1]}px`,
    transition: 'all 0.2s ease-in-out'
  };
}

/**
 * Compact layout algorithm
 * Moves items up to fill empty spaces
 */
export function compactLayout(layout: WidgetLayout[]): WidgetLayout[] {
  const sorted = [...layout].sort((a, b) => {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  const compacted: WidgetLayout[] = [];

  for (const item of sorted) {
    let newY = 0;
    let collision = true;

    // Find the lowest Y position without collision
    while (collision) {
      collision = false;
      for (const placed of compacted) {
        if (
          item.x < placed.x + placed.w &&
          item.x + item.w > placed.x &&
          newY < placed.y + placed.h &&
          newY + item.h > placed.y
        ) {
          collision = true;
          newY = placed.y + placed.h;
          break;
        }
      }
    }

    compacted.push({ ...item, y: newY });
  }

  return compacted;
}

/**
 * Check for collisions between items
 */
function checkCollision(
  item1: WidgetLayout,
  item2: WidgetLayout
): boolean {
  return (
    item1.x < item2.x + item2.w &&
    item1.x + item1.w > item2.x &&
    item1.y < item2.y + item2.h &&
    item1.y + item1.h > item2.y
  );
}

/**
 * Resolve collisions by moving items
 */
function resolveCollisions(
  layout: WidgetLayout[],
  movedItem: WidgetLayout
): WidgetLayout[] {
  const result = layout.map(item =>
    item.id === movedItem.id ? movedItem : item
  );

  // Check for collisions and move items down
  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item.id === movedItem.id) continue;

    if (checkCollision(movedItem, item)) {
      // Move the colliding item down
      result[i] = {
        ...item,
        y: movedItem.y + movedItem.h
      };
    }
  }

  return result;
}

/**
 * Grid Layout System Component
 */
export function GridLayoutSystem({
  widgets,
  layout,
  onLayoutChange,
  gridCols = 12,
  gridRowHeight = 100,
  margin = [10, 10],
  containerPadding = [10, 10],
  isEditMode = false,
  children
}: GridLayoutSystemProps) {
  // Calculate container height
  const containerHeight = useMemo(() => {
    if (layout.length === 0) return gridRowHeight;

    const maxY = Math.max(...layout.map(l => l.y + l.h));
    return maxY * gridRowHeight + (maxY - 1) * margin[1] + containerPadding[1] * 2;
  }, [layout, gridRowHeight, margin, containerPadding]);

  // Create grid items
  const gridItems: GridItem[] = useMemo(() => {
    return layout.map(l => {
      const widget = widgets.find(w => w.id === l.id);
      if (!widget) return null;

      return {
        id: l.id,
        layout: l,
        widget
      };
    }).filter(Boolean) as GridItem[];
  }, [widgets, layout]);

  // Grid container style
  const gridStyle: React.CSSProperties = useMemo(() => ({
    position: 'relative',
    width: '100%',
    minHeight: `${containerHeight}px`,
    padding: `${containerPadding[1]}px ${containerPadding[0]}px`
  }), [containerHeight, containerPadding]);

  // Get item style
  const getItemStyle = useCallback((item: GridItem): React.CSSProperties => {
    // Assume container width is 100% - we'll use a fixed width for calculation
    const containerWidth = 1200; // This should be dynamic in production
    return calculateItemStyle(
      item.layout,
      gridCols,
      gridRowHeight,
      margin,
      containerWidth
    );
  }, [gridCols, gridRowHeight, margin]);

  // Handle item move
  const handleItemMove = useCallback((itemId: string, position: { x: number; y: number }) => {
    if (!isEditMode) return;

    const item = layout.find(l => l.id === itemId);
    if (!item) return;

    // Clamp position to grid bounds
    const clampedX = Math.max(0, Math.min(gridCols - item.w, position.x));
    const clampedY = Math.max(0, position.y);

    const movedItem: WidgetLayout = {
      ...item,
      x: clampedX,
      y: clampedY
    };

    // Resolve collisions
    const newLayout = resolveCollisions(layout, movedItem);
    onLayoutChange(newLayout);
  }, [layout, gridCols, isEditMode, onLayoutChange]);

  // Handle item resize
  const handleItemResize = useCallback((itemId: string, size: { w: number; h: number }) => {
    if (!isEditMode) return;

    const item = layout.find(l => l.id === itemId);
    const widget = widgets.find(w => w.id === itemId);
    if (!item || !widget) return;

    // Apply size constraints
    const minW = widget.minW || item.minW || 1;
    const maxW = widget.maxW || item.maxW || gridCols;
    const minH = widget.minH || item.minH || 1;
    const maxH = widget.maxH || item.maxH || 8;

    const clampedW = Math.max(minW, Math.min(maxW, Math.min(gridCols - item.x, size.w)));
    const clampedH = Math.max(minH, Math.min(maxH, size.h));

    const resizedItem: WidgetLayout = {
      ...item,
      w: clampedW,
      h: clampedH
    };

    // Resolve collisions
    const newLayout = resolveCollisions(layout, resizedItem);
    onLayoutChange(newLayout);
  }, [layout, widgets, gridCols, isEditMode, onLayoutChange]);

  return (
    <>
      {children({
        gridItems,
        gridStyle,
        getItemStyle,
        handleItemMove,
        handleItemResize
      })}
    </>
  );
}

/**
 * Grid Layout Utilities
 */

/**
 * Generate default layout for widgets
 */
export function generateDefaultLayout(
  widgets: DashboardWidget[],
  gridCols: number = 12
): WidgetLayout[] {
  const layout: WidgetLayout[] = [];
  let currentX = 0;
  let currentY = 0;
  let maxHeightInRow = 0;

  for (const widget of widgets) {
    const w = widget.defaultW || 4;
    const h = widget.defaultH || 3;

    // Check if widget fits in current row
    if (currentX + w > gridCols) {
      currentX = 0;
      currentY += maxHeightInRow;
      maxHeightInRow = 0;
    }

    layout.push({
      i: widget.id,
      id: widget.id,
      x: currentX,
      y: currentY,
      w,
      h,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
      isDraggable: true,
      isResizable: true
    });

    currentX += w;
    maxHeightInRow = Math.max(maxHeightInRow, h);
  }

  return layout;
}

/**
 * Validate layout
 * Ensures all items are within bounds and don't overlap
 */
export function validateLayout(
  layout: WidgetLayout[],
  gridCols: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check bounds
  for (const item of layout) {
    if (item.x < 0 || item.y < 0) {
      errors.push(`Item ${item.id} has negative position`);
    }
    if (item.x + item.w > gridCols) {
      errors.push(`Item ${item.id} exceeds grid width`);
    }
    if (item.w <= 0 || item.h <= 0) {
      errors.push(`Item ${item.id} has invalid dimensions`);
    }
  }

  // Check overlaps
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (checkCollision(layout[i], layout[j])) {
        errors.push(`Items ${layout[i].id} and ${layout[j].id} overlap`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default GridLayoutSystem;
