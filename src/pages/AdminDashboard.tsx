import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  FileText, 
  Shield, 
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  Settings,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { AdminDashboardSkeleton } from '@/components/loading/DashboardSkeleton';
import { ModernDashboardCard } from '@/components/dashboard/ModernDashboardCard';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate loading time for admin dashboard data
    const loadAdminData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setIsLoading(false);
    };
    
    loadAdminData();
  }, []);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, projects, and system settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernDashboardCard
          title="Total Users"
          value={24}
          icon={Users}
          trend={{ value: 24, change: 8.3, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[18, 19, 20, 22, 23, 24]}
          badge={{ text: '+2 new', variant: 'secondary' }}
        />

        <ModernDashboardCard
          title="Active Projects"
          value={12}
          icon={FileText}
          trend={{ value: 12, change: 25, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[8, 9, 10, 11, 11, 12]}
          badge={{ text: '3 pending', variant: 'outline' }}
        />

        <ModernDashboardCard
          title="Total Revenue"
          value="R 845,231"
          icon={DollarSign}
          trend={{ value: 845231, change: 20.1, changeType: 'increase', period: 'vs last month' }}
          sparklineData={[700000, 750000, 780000, 800000, 820000, 845231]}
        />

        <ModernDashboardCard
          title="System Health"
          value="98.5%"
          icon={Activity}
          trend={{ value: 98.5, change: 0, changeType: 'neutral', period: 'operational' }}
          sparklineData={[98, 98.2, 98.5, 98.3, 98.6, 98.5]}
          badge={{ text: 'Healthy', variant: 'secondary' }}
        />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system events and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user registered: John Doe</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Project "Office Redesign" completed</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">System backup completed</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Failed login attempt detected</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  12% faster than last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Clock className="h-3 w-3 text-blue-600 mr-1" />
                  6 users online now
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.02%</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                  Within acceptable range
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Detailed performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics charts will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>User management interface will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Overview of all projects and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Project management interface will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}