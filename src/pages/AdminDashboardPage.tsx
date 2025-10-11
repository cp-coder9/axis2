import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { UserRole, User } from '@/types';
import { RoleManagementPanel } from '@/components/admin/RoleManagementPanel';
import { UserActivityMonitor } from '@/components/admin/UserActivityMonitor';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  BarChart3,
  Shield,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { authState } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has admin permissions
  if (!authState.user || authState.user.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-4xl font-bold text-gray-700 mb-4">Access Denied</h1>
        <p className="text-xl text-gray-500 mb-6">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive role management and system analytics
          </p>
        </div>
        <Button onClick={() => navigate('/admin/users')} className="gap-2">
          <Users className="h-4 w-4" />
          Manage Users
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Monitor
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View comprehensive system statistics and user distribution across roles.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('analytics')}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor user engagement and track activity patterns across the platform.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('activity')}
                >
                  View Activity
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Overview */}
          <SystemAnalytics />
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <RoleManagementPanel
            onCreateUser={() => navigate('/admin/users')}
            onEditUser={(user) => navigate('/admin/users')}
          />
        </TabsContent>

        {/* Activity Monitor Tab */}
        <TabsContent value="activity" className="space-y-6 mt-6">
          <UserActivityMonitor />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <SystemAnalytics />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default AdminDashboardPage;
