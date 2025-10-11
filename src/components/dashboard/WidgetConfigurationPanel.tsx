/**
 * Widget Configuration Panel
 * Provides UI for configuring widget properties including:
 * - Description and metadata
 * - Size constraints
 * - Permissions
 * - Display options
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Lock, 
  Maximize2, 
  Info, 
  Save, 
  X,
  AlertCircle 
} from 'lucide-react';
import { DashboardWidget, WidgetConfig, WidgetPermissions, WidgetLayout } from '../../types/dashboard';
import { UserRole } from '../../types';
import {
  updateWidgetConfig,
  updateWidgetPermissions,
  updateWidgetSizeConstraints,
  validateWidgetSize
} from '../../services/dashboardWidgetService';

// Extended widget type for configuration
interface ConfigurableWidget extends DashboardWidget {
  layout?: WidgetLayout;
  widgetPermissions?: WidgetPermissions;
}

interface WidgetConfigurationPanelProps {
  widget: ConfigurableWidget;
  onSave?: (widget: ConfigurableWidget) => void;
  onCancel?: () => void;
  userRole: UserRole;
}

export const WidgetConfigurationPanel: React.FC<WidgetConfigurationPanelProps> = ({
  widget,
  onSave,
  onCancel,
  userRole
}) => {
  const [localWidget, setLocalWidget] = useState<ConfigurableWidget>(widget);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSave = async () => {
    setIsSaving(true);
    setValidationErrors([]);

    try {
      // Validate size constraints if layout exists
      if (localWidget.layout?.w && localWidget.layout?.h) {
        // For now, just basic validation - the service function expects different parameters
        if (localWidget.minW && localWidget.layout.w < localWidget.minW) {
          setValidationErrors([`Width must be at least ${localWidget.minW}`]);
          setIsSaving(false);
          return;
        }
        if (localWidget.maxW && localWidget.layout.w > localWidget.maxW) {
          setValidationErrors([`Width must be at most ${localWidget.maxW}`]);
          setIsSaving(false);
          return;
        }
        if (localWidget.minH && localWidget.layout.h < localWidget.minH) {
          setValidationErrors([`Height must be at least ${localWidget.minH}`]);
          setIsSaving(false);
          return;
        }
        if (localWidget.maxH && localWidget.layout.h > localWidget.maxH) {
          setValidationErrors([`Height must be at most ${localWidget.maxH}`]);
          setIsSaving(false);
          return;
        }
      }

      // Update widget configuration
      if (localWidget.config) {
        await updateWidgetConfig(localWidget.id, localWidget.config);
      }

      // Update permissions
      if (localWidget.widgetPermissions) {
        await updateWidgetPermissions(localWidget.id, localWidget.widgetPermissions);
      }

      // Update size constraints
      await updateWidgetSizeConstraints(localWidget.id, {
        minW: localWidget.minW,
        maxW: localWidget.maxW,
        minH: localWidget.minH,
        maxH: localWidget.maxH
      });

      onSave?.(localWidget);
    } catch (error) {
      console.error('Error saving widget configuration:', error);
      setValidationErrors(['Failed to save widget configuration']);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setLocalWidget(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const updatePermissions = (key: keyof WidgetPermissions, value: any) => {
    setLocalWidget(prev => ({
      ...prev,
      widgetPermissions: {
        ...prev.widgetPermissions,
        roles: prev.widgetPermissions?.roles || [],
        [key]: value
      }
    }));
  };

  const updateSizeConstraint = (key: 'minW' | 'maxW' | 'minH' | 'maxH', value: number) => {
    setLocalWidget(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget Configuration
            </CardTitle>
            <CardDescription>
              Configure {localWidget.title} widget properties and permissions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !isAdmin}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Info className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="size">
              <Maximize2 className="h-4 w-4 mr-2" />
              Size
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Lock className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="display">
              <Settings className="h-4 w-4 mr-2" />
              Display
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                value={localWidget.title}
                onChange={(e) => setLocalWidget(prev => ({ ...prev, title: e.target.value }))}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={localWidget.description || ''}
                onChange={(e) => setLocalWidget(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this widget displays..."
                rows={3}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={localWidget.category}
                onValueChange={(value) => setLocalWidget(prev => ({ ...prev, category: value as any }))}
                disabled={!isAdmin}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {localWidget.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Widget Visible</Label>
              <Switch
                id="visible"
                checked={localWidget.isVisible ?? true}
                onCheckedChange={(checked) => setLocalWidget(prev => ({ ...prev, isVisible: checked }))}
                disabled={!isAdmin}
              />
            </div>
          </TabsContent>

          {/* Size Tab */}
          <TabsContent value="size" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minW">Minimum Width</Label>
                <Input
                  id="minW"
                  type="number"
                  value={localWidget.minW || ''}
                  onChange={(e) => updateSizeConstraint('minW', parseInt(e.target.value))}
                  placeholder="e.g., 2"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxW">Maximum Width</Label>
                <Input
                  id="maxW"
                  type="number"
                  value={localWidget.maxW || ''}
                  onChange={(e) => updateSizeConstraint('maxW', parseInt(e.target.value))}
                  placeholder="e.g., 12"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minH">Minimum Height</Label>
                <Input
                  id="minH"
                  type="number"
                  value={localWidget.minH || ''}
                  onChange={(e) => updateSizeConstraint('minH', parseInt(e.target.value))}
                  placeholder="e.g., 2"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxH">Maximum Height</Label>
                <Input
                  id="maxH"
                  type="number"
                  value={localWidget.maxH || ''}
                  onChange={(e) => updateSizeConstraint('maxH', parseInt(e.target.value))}
                  placeholder="e.g., 8"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Current Size</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">Width</div>
                  <div className="text-2xl font-bold">{localWidget.layout?.w || 'Auto'}</div>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">Height</div>
                  <div className="text-2xl font-bold">{localWidget.layout?.h || 'Auto'}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <div className="space-y-2">
              <Label>Allowed Roles</Label>
              <div className="space-y-2">
                {Object.values(UserRole).map((role) => (
                  <div key={role} className="flex items-center justify-between">
                    <Label htmlFor={`role-${role}`} className="font-normal">
                      {role}
                    </Label>
                    <Switch
                      id={`role-${role}`}
                      checked={localWidget.widgetPermissions?.roles?.includes(role) ?? false}
                      onCheckedChange={(checked) => {
                        const currentRoles = localWidget.widgetPermissions?.roles || [];
                        const newRoles = checked
                          ? [...currentRoles, role]
                          : currentRoles.filter(r => r !== role);
                        updatePermissions('roles', newRoles);
                      }}
                      disabled={!isAdmin}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Widget Actions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowEdit" className="font-normal">
                    Allow Edit
                  </Label>
                  <Switch
                    id="allowEdit"
                    checked={localWidget.widgetPermissions?.allowEdit ?? false}
                    onCheckedChange={(checked) => updatePermissions('allowEdit', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowDelete" className="font-normal">
                    Allow Delete
                  </Label>
                  <Switch
                    id="allowDelete"
                    checked={localWidget.widgetPermissions?.allowDelete ?? false}
                    onCheckedChange={(checked) => updatePermissions('allowDelete', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowShare" className="font-normal">
                    Allow Share
                  </Label>
                  <Switch
                    id="allowShare"
                    checked={localWidget.widgetPermissions?.allowShare ?? false}
                    onCheckedChange={(checked) => updatePermissions('allowShare', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowExport" className="font-normal">
                    Allow Export
                  </Label>
                  <Switch
                    id="allowExport"
                    checked={localWidget.widgetPermissions?.allowExport ?? false}
                    onCheckedChange={(checked) => updatePermissions('allowExport', checked)}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Auto-Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                value={localWidget.refreshInterval || ''}
                onChange={(e) => setLocalWidget(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                placeholder="e.g., 30"
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Input
                id="dataSource"
                value={localWidget.dataSource || ''}
                onChange={(e) => setLocalWidget(prev => ({ ...prev, dataSource: e.target.value }))}
                placeholder="e.g., /api/projects"
                disabled={!isAdmin}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showHeader" className="font-normal">
                    Show Header
                  </Label>
                  <Switch
                    id="showHeader"
                    checked={localWidget.config?.showHeader ?? true}
                    onCheckedChange={(checked) => updateConfig('showHeader', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showFooter" className="font-normal">
                    Show Footer
                  </Label>
                  <Switch
                    id="showFooter"
                    checked={localWidget.config?.showFooter ?? false}
                    onCheckedChange={(checked) => updateConfig('showFooter', checked)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showBorder" className="font-normal">
                    Show Border
                  </Label>
                  <Switch
                    id="showBorder"
                    checked={localWidget.config?.showBorder ?? true}
                    onCheckedChange={(checked) => updateConfig('showBorder', checked)}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
