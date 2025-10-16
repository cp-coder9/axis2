import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { useProjects } from '@/contexts/ProjectsContext';
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Projects
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

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6 mt-6">
          <ProjectsOverview />
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

// Projects Overview Component
const ProjectsOverview: React.FC = () => {
  const { state, loadProjects } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-6">
      {/* Projects Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.jobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Jobs across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in all jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/admin/projects')} className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Manage Projects
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/projects/templates')} className="gap-2">
              <Settings className="h-4 w-4" />
              Project Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {state.loading.projects ? (
            <p className="text-muted-foreground">Loading projects...</p>
          ) : state.projects.length === 0 ? (
            <p className="text-muted-foreground">No projects found.</p>
          ) : (
            <div className="space-y-4">
              {state.projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/projects/${project.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
