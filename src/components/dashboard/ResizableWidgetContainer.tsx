import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EnhancedDashboardWidget } from './EnhancedDashboardWidget';
import { DashboardWidget as WidgetType, WidgetError, WidgetLayout } from '../../types/dashboard';

interface ResizableWidgetContainerProps {
  widgets: WidgetType[];
  layout: WidgetLayout[];
  onLayoutChange?: (layout: WidgetLayout[]) => void;
  onWidgetError?: (error: WidgetError) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetRefresh?: (widgetId: string) => void;
  className?: string;
  enableIntersectionObserver?: boolean;
  direction?: 'horizontal' | 'vertical';
}

interface VisibilityState {
  [widgetId: string]: boolean;
}

export const ResizableWidgetContainer: React.FC<ResizableWidgetContainerProps> = ({
  widgets,
  layout,
  onLayoutChange,
  onWidgetError,
  onWidgetRemove,
  onWidgetRefresh,
  className = '',
  enableIntersectionObserver = true,
  direction = 'horizontal'
}) => {
  const [visibilityState, setVisibilityState] = useState<VisibilityState>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize visibility state
  useEffect(() => {
    const initialVisibility: VisibilityState = {};
    widgets.forEach(widget => {
      initialVisibility[widget.id] = !enableIntersectionObserver; // If observer disabled, all visible
    });
    setVisibilityState(initialVisibility);
  }, [widgets, enableIntersectionObserver]);

  // Setup Intersection Observer for viewport-based loading
  useEffect(() => {
    if (!enableIntersectionObserver) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: VisibilityState = {};
        entries.forEach((entry) => {
          const widgetId = entry.target.getAttribute('data-widget-id');
          if (widgetId) {
            updates[widgetId] = entry.isIntersecting;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          setVisibilityState(prev => ({ ...prev, ...updates }));
        }
      },
      {
        root: containerRef.current,
        rootMargin: '50px', // Load widgets 50px before they come into view
        threshold: 0.1
      }
    );

    // Observe all widget elements
    widgetRefs.current.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableIntersectionObserver, widgets]);

  // Register widget ref and observe it
  const registerWidgetRef = useCallback((widgetId: string, element: HTMLDivElement | null) => {
    if (element) {
      widgetRefs.current.set(widgetId, element);
      element.setAttribute('data-widget-id', widgetId);
      
      if (observerRef.current && enableIntersectionObserver) {
        observerRef.current.observe(element);
      }
    } else {
      const existingElement = widgetRefs.current.get(widgetId);
      if (existingElement && observerRef.current) {
        observerRef.current.unobserve(existingElement);
      }
      widgetRefs.current.delete(widgetId);
    }
  }, [enableIntersectionObserver]);

  const handleWidgetError = useCallback((error: WidgetError) => {
    console.error(`Widget ${error.widgetId} error:`, error.error);
    onWidgetError?.(error);
  }, [onWidgetError]);

  const handleWidgetRemove = useCallback((widgetId: string) => {
    // Unregister the widget ref
    registerWidgetRef(widgetId, null);
    onWidgetRemove?.(widgetId);
  }, [onWidgetRemove, registerWidgetRef]);

  const handleWidgetRefresh = useCallback((widgetId: string) => {
    onWidgetRefresh?.(widgetId);
  }, [onWidgetRefresh]);

  // Handle panel resize
  const handlePanelResize = useCallback((sizes: number[]) => {
    if (!onLayoutChange) return;

    const newLayout = widgets.map((widget, index) => {
      const existingLayout = layout.find(item => item.id === widget.id);
      const size = sizes[index] || 25; // Default to 25% if size not available
      
      return {
        ...existingLayout,
        id: widget.id,
        x: direction === 'horizontal' ? index : 0,
        y: direction === 'vertical' ? index : 0,
        w: direction === 'horizontal' ? Math.round(size / 25) : 1, // Convert percentage to grid units
        h: direction === 'vertical' ? Math.round(size / 25) : 1,
      } as WidgetLayout;
    });

    onLayoutChange(newLayout);
  }, [widgets, layout, onLayoutChange, direction]);

  if (widgets.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground ${className}`}>
        <p>No widgets to display</p>
      </div>
    );
  }

  // For single widget, Don't use resizable panels
  if (widgets.length === 1) {
    const widget = widgets[0];
    const isVisible = visibilityState[widget.id] ?? false;
    
    return (
      <div
        ref={containerRef}
        className={`h-full ${className}`}
      >
        <div
          ref={(el) => registerWidgetRef(widget.id, el)}
          className="h-full"
        >
          <EnhancedDashboardWidget
            widget={widget}
            onError={handleWidgetError}
            onRemove={handleWidgetRemove}
            onRefresh={handleWidgetRefresh}
            isVisible={isVisible}
            className="h-full"
            enableDragHandle={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full ${className}`}
    >
      <ResizablePanelGroup
        direction={direction}
        onLayout={handlePanelResize}
        className="h-full"
      >
        {widgets.map((widget, index) => {
          const isVisible = visibilityState[widget.id] ?? false;
          const layoutItem = layout.find(item => item.id === widget.id);
          const defaultSize = layoutItem ? (direction === 'horizontal' ? layoutItem.w * 25 : layoutItem.h * 25) : 25;
          
          return (
            <React.Fragment key={widget.id}>
              <ResizablePanel
                defaultSize={defaultSize}
                minSize={15}
                maxSize={85}
              >
                <div
                  ref={(el) => registerWidgetRef(widget.id, el)}
                  className="h-full p-2"
                >
                  <EnhancedDashboardWidget
                    widget={widget}
                    onError={handleWidgetError}
                    onRemove={handleWidgetRemove}
                    onRefresh={handleWidgetRefresh}
                    isVisible={isVisible}
                    className="h-full"
                    enableDragHandle={false}
                  />
                </div>
              </ResizablePanel>
              {index < widgets.length - 1 && (
                <ResizableHandle withHandle />
              )}
            </React.Fragment>
          );
        })}
      </ResizablePanelGroup>
    </div>
  );
};