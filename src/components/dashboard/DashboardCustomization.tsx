import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ScrollArea 
} from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Grid, 
  Layout,
  Maximize2,
  Minimize2,
  Info,
  Check
} from 'lucide-react';
import { DashboardWidget, WidgetLayout, DashboardSettings } from '@/types/dashboard';
import { UserRole } from '@/types';
import { validateWidgetSize, checkWidgetPermission } from './WidgetRegistry';

/**
 * Dashboard Customization Component
 * Task 7.1: Provides UI for managing widget visibility, configuration, and permissions
 */

interface DashboardCustomizationProps {
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
  settings: DashboardSettings;
  onLayoutChange: (layout: WidgetLayout[]) => void;
  onSettingsChange: (settings: Partial<DashboardSettings>) => void;
  onWidgetVisibilityChange: (widgetId: string, visible: boolean) => void;
  userRole: UserRole;
}

export function DashboardCustomization({
  widgets,
  layout,
  settings,
  onLayoutChange,
  onSettingsChange,
  onWidgetVisibilityChange,
  userRole
}: DashboardCustomizationProps) {
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [activeTab, setActiveTab] = useState('widgets');

  // Filter widgets by permission
  const availableWidgets = widgets.filter(widget => 
    checkWidgetPermission(widget, userRole)
  );

  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  // Check if widget is enabled
  const isWidgetEnabled = (widgetId: string) => {
    return settings.enabledWidgets.includes(widgetId);
  };

  // Toggle widget visibility
  const handleToggleWidget = (widgetId: string) => {
    const isEnabled = isWidgetEnabled(widgetId);
    onWidgetVisibilityChange(widgetId, !isEnabled);
  };

  // Handle widget size preset
  const handleSizePreset = (widgetId: string, preset: 'small' | 'medium' | 'large') => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const sizeMap = {
      small: { w: widget.minW || 2, h: widget.minH || 2 },
      medium: { w: widget.defaultW || 4, h: widget.defaultH || 3 },
      large: { w: widget.maxW || 6, h: widget.maxH || 4 }
    };

    const newSize = sizeMap[preset];
    const validation = validateWidgetSize(widget, newSize.w, newSize.h);

    const newLayout = layout.map(l =>
      l.id === widgetId
        ? { ...l, w: validation.adjustedWidth, h: validation.adjustedHeight }
        : l
    );

    onLayoutChange(newLayout);
  };

  // Render widget card
  const renderWidgetCard = (widget: DashboardWidget) => {
    const isEnabled = isWidgetEnabled(widget.id);
    const layoutItem = layout.find(l => l.id === widget.id);

    return (
      <Card 
        key={widget.id}
        className={`transition-all duration-200 ${
          isEnabled ? 'border-primary/50' : 'opacity-60'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {widget.title}
                {widget.description && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <Info className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{widget.title}</DialogTitle>
                        <DialogDescription>{widget.description}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Type</Label>
                          <p className="text-sm text-muted-foreground">{widget.type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <p className="text-sm text-muted-foreground capitalize">{widget.category}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Size Constraints</Label>
                          <p className="text-sm text-muted-foreground">
                            Width: {widget.minW || 1} - {widget.maxW || 12} units<br />
                            Height: {widget.minH || 1} - {widget.maxH || 8} units
                          </p>
                        </div>
                        {widget.refreshInterval && (
                          <div>
                            <Label className="text-sm font-medium">Refresh Interval</Label>
                            <p className="text-sm text-muted-foreground">
                              {widget.refreshInterval / 1000} seconds
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {widget.category}
              </CardDescription>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={() => handleToggleWidget(widget.id)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {widget.type}
            </Badge>
            {layoutItem && (
              <Badge variant="outline" className="text-xs">
                {layoutItem.w}×{layoutItem.h}
              </Badge>
            )}
          </div>

          {isEnabled && layoutItem && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSizePreset(widget.id, 'small')}
              >
                <Minimize2 className="h-3 w-3 mr-1" />
                Small
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSizePreset(widget.id, 'medium')}
              >
                <Grid className="h-3 w-3 mr-1" />
                Medium
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSizePreset(widget.id, 'large')}
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                Large
              </Button>
            </div>
          )}

          {widget.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {widget.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dashboard Customization
            </CardTitle>
            <CardDescription>
              Manage widget visibility, size, and configuration
            </CardDescription>
          </div>
          <Badge variant="outline">
            {settings.enabledWidgets.length} / {availableWidgets.length} enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    availableWidgets.forEach(w => onWidgetVisibilityChange(w.id, true));
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    availableWidgets.forEach(w => onWidgetVisibilityChange(w.id, false));
                  }}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Disable All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold mb-3 capitalize flex items-center gap-2">
                      {category}
                      <Badge variant="secondary" className="text-xs">
                        {categoryWidgets.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryWidgets.map(renderWidgetCard)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch
                  id="compact-mode"
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => 
                    onSettingsChange({ compactMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => 
                    onSettingsChange({ autoRefresh: checked })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Layout Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Layout className="h-4 w-4 mr-2" />
                    Default
                  </Button>
                  <Button variant="outline" size="sm">
                    <Grid className="h-4 w-4 mr-2" />
                    Compact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Expanded
                  </Button>
                  <Button variant="outline" size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Custom
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Dashboard Theme</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Choose your preferred dashboard theme
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={settings.theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSettingsChange({ theme: 'light' })}
                  >
                    Light
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSettingsChange({ theme: 'dark' })}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={settings.theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSettingsChange({ theme: 'system' })}
                  >
                    System
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground">
                        Total Widgets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{availableWidgets.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground">
                        Enabled
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{settings.enabledWidgets.length}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Last Updated</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(settings.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DashboardCustomization;
