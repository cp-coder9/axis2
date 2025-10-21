import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Palette,
  Globe,
  Users,
  Shield,
  Database,
  Mail,
  Save,
  Clock,
  DollarSign,
  FileCheck,
  Timer,
  CheckCircle
} from 'lucide-react';
import AllocationApprovalPanel from '@/components/admin/AllocationApprovalPanel';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and preferences
          </p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="time-management">Time Management</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">System Name</label>
                <Input defaultValue="Acme Inc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <Input defaultValue="admin@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input defaultValue="UTC-5 (Eastern Time)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Input defaultValue="English (US)" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Configure data retention and backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Backup</p>
                  <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Retention</p>
                  <p className="text-sm text-muted-foreground">Keep data for 90 days</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage security and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password Policy</p>
                  <p className="text-sm text-muted-foreground">Minimum 8 characters, mixed case</p>
                </div>
                <Button variant="outline" size="sm">Edit Policy</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Access Control
              </CardTitle>
              <CardDescription>Manage user permissions and roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Role-Based Access</p>
                  <p className="text-sm text-muted-foreground">3 roles configured</p>
                </div>
                <Button variant="outline" size="sm">Manage Roles</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Management Settings */}
        <TabsContent value="time-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Allocation Policies
              </CardTitle>
              <CardDescription>Configure time allocation limits and approval workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Allocation Limit (hours)</label>
                <Input defaultValue="40" type="number" />
                <p className="text-xs text-muted-foreground">Maximum hours that can be allocated per freelancer per week</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Approval Threshold (hours)</label>
                <Input defaultValue="20" type="number" />
                <p className="text-xs text-muted-foreground">Allocations below this threshold are automatically approved</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Large Allocation Threshold (hours)</label>
                <Input defaultValue="50" type="number" />
                <p className="text-xs text-muted-foreground">Allocations above this threshold require multi-admin approval</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Admin Override for Large Allocations</p>
                  <p className="text-sm text-muted-foreground">Admins must explicitly override restrictions for large allocations</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Time Slot Pricing
              </CardTitle>
              <CardDescription>Configure pricing for time slot purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Hourly Rate ($)</label>
                <Input defaultValue="75" type="number" step="0.01" />
                <p className="text-xs text-muted-foreground">Standard hourly rate for time slots</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Premium Rate Multiplier</label>
                <Input defaultValue="1.5" type="number" step="0.1" />
                <p className="text-xs text-muted-foreground">Multiplier for urgent or specialized time slots</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bulk Purchase Discount (%)</label>
                <Input defaultValue="10" type="number" />
                <p className="text-xs text-muted-foreground">Discount for purchasing 50+ hours at once</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dynamic Pricing</p>
                  <p className="text-sm text-muted-foreground">Adjust prices based on demand and availability</p>
                </div>
                <Badge variant="secondary" className="text-orange-600">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Timer Restrictions
              </CardTitle>
              <CardDescription>Configure timer behavior and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Session Duration (hours)</label>
                <Input defaultValue="8" type="number" />
                <p className="text-xs text-muted-foreground">Maximum continuous timer session before requiring break</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Time Limit (hours)</label>
                <Input defaultValue="10" type="number" />
                <p className="text-xs text-muted-foreground">Maximum hours that can be logged per day</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enforce Time Slot Boundaries</p>
                  <p className="text-sm text-muted-foreground">Prevent timers from running outside allocated time slots</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Admin Override</p>
                  <p className="text-sm text-muted-foreground">Administrators can bypass timer restrictions</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Audit & Compliance
              </CardTitle>
              <CardDescription>Configure audit logging and data retention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audit Log Retention (days)</label>
                <Input defaultValue="365" type="number" />
                <p className="text-xs text-muted-foreground">How long to keep audit logs for time management operations</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Log All Timer Events</p>
                  <p className="text-sm text-muted-foreground">Record start, stop, pause, and resume events</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Log Allocation Changes</p>
                  <p className="text-sm text-muted-foreground">Track all time allocation modifications</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Log Time Slot Purchases</p>
                  <p className="text-sm text-muted-foreground">Record all client time slot purchases</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Approvals */}
        <TabsContent value="approvals" className="space-y-4">
          <AllocationApprovalPanel />
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send email for important events</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Badge variant="secondary" className="text-green-600">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Digest</p>
                  <p className="text-sm text-muted-foreground">Receive daily summary at 9:00 AM</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>Configure email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Server</label>
                <Input defaultValue="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Email</label>
                <Input defaultValue="noreply@example.com" type="email" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <div className="flex gap-2">
                  <Button variant="outline">Light</Button>
                  <Button variant="outline">Dark</Button>
                  <Button variant="default">System</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex gap-2">
                  {['blue', 'purple', 'green', 'orange'].map((color) => (
                    <div
                      key={color}
                      className={`w-12 h-12 rounded-lg bg-${color}-500 cursor-pointer border-2 border-transparent hover:border-gray-400`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compact Mode</label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Reduce spacing for denser layout</p>
                  <Badge variant="outline">Off</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
