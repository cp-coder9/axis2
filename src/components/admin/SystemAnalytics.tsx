import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/contexts/AppContext';
import { UserRole, ProjectStatus } from '@/types';
import {
  Users,
  Briefcase,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const SystemAnalytics: React.FC = () => {
  const { users, projects } = useAppContext();

  // Calculate user statistics by role
  const userStats = useMemo(() => {
    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === UserRole.ADMIN).length,
      freelancers: users.filter(u => u.role === UserRole.FREELANCER).length,
      clients: users.filter(u => u.role === UserRole.CLIENT).length,
    };

    return {
      ...stats,
      adminPercentage: stats.total > 0 ? (stats.admins / stats.total) * 100 : 0,
      freelancerPercentage: stats.total > 0 ? (stats.freelancers / stats.total) * 100 : 0,
      clientPercentage: stats.total > 0 ? (stats.clients / stats.total) * 100 : 0,
    };
  }, [users]);

  // Calculate project statistics
  const projectStats = useMemo(() => {
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
      completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      onHold: projects.filter(p => p.status === ProjectStatus.ON_HOLD).length,
      draft: projects.filter(p => p.status === ProjectStatus.DRAFT).length,
    };

    return {
      ...stats,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      activeRate: stats.total > 0 ? (stats.active / stats.total) * 100 : 0,
    };
  }, [projects]);

  // Calculate time and earnings statistics
  const timeEarningsStats = useMemo(() => {
    let totalHours = 0;
    let totalEarnings = 0;
    let totalAllocatedHours = 0;

    projects.forEach(project => {
      if (project.totalTimeSpentMinutes) {
        totalHours += project.totalTimeSpentMinutes / 60;
      }
      if (project.totalEarnings) {
        totalEarnings += project.totalEarnings;
      }
      if (project.totalAllocatedHours) {
        totalAllocatedHours += project.totalAllocatedHours;
      }
    });

    const utilizationRate = totalAllocatedHours > 0 
      ? (totalHours / totalAllocatedHours) * 100 
      : 0;

    return {
      totalHours: Math.round(totalHours),
      totalEarnings: Math.round(totalEarnings),
      totalAllocatedHours: Math.round(totalAllocatedHours),
      utilizationRate,
      avgHourlyRate: totalHours > 0 ? totalEarnings / totalHours : 0,
    };
  }, [projects]);

  // Calculate team utilization
  const teamUtilization = useMemo(() => {
    const freelancers = users.filter(u => u.role === UserRole.FREELANCER);
    const activeFreelancers = new Set<string>();

    projects.forEach(project => {
      if (project.status === ProjectStatus.ACTIVE && project.assignedTeamIds) {
        project.assignedTeamIds.forEach(id => {
          if (freelancers.some(f => f.id === id)) {
            activeFreelancers.add(id);
          }
        });
      }
    });

    const utilizationRate = freelancers.length > 0 
      ? (activeFreelancers.size / freelancers.length) * 100 
      : 0;

    return {
      totalFreelancers: freelancers.length,
      activeFreelancers: activeFreelancers.size,
      utilizationRate,
    };
  }, [users, projects]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userStats.freelancers} freelancers, {userStats.clients} clients
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{projectStats.active}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {projectStats.total} total projects
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{timeEarningsStats.totalHours}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeEarningsStats.totalAllocatedHours} allocated
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(timeEarningsStats.totalEarnings)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(timeEarningsStats.avgHourlyRate)}/hr avg
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution by Role</CardTitle>
          <CardDescription>
            Breakdown of users across different roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">Admin</Badge>
                <span className="text-muted-foreground">{userStats.admins} users</span>
              </span>
              <span className="font-medium">{userStats.adminPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={userStats.adminPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-600 text-white">Freelancer</Badge>
                <span className="text-muted-foreground">{userStats.freelancers} users</span>
              </span>
              <span className="font-medium">{userStats.freelancerPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={userStats.freelancerPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">Client</Badge>
                <span className="text-muted-foreground">{userStats.clients} users</span>
              </span>
              <span className="font-medium">{userStats.clientPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={userStats.clientPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Project Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>
              Current state of all projects in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{projectStats.active}</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  {projectStats.activeRate.toFixed(0)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{projectStats.completed}</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {projectStats.completionRate.toFixed(0)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">On Hold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{projectStats.onHold}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{projectStats.draft}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
            <CardDescription>
              Freelancer engagement and project assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Freelancers</span>
                <span className="font-medium">
                  {teamUtilization.activeFreelancers} / {teamUtilization.totalFreelancers}
                </span>
              </div>
              <Progress value={teamUtilization.utilizationRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {teamUtilization.utilizationRate.toFixed(1)}% of freelancers are currently assigned to active projects
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Time Utilization</span>
                <span className="font-medium">
                  {timeEarningsStats.totalHours} / {timeEarningsStats.totalAllocatedHours} hrs
                </span>
              </div>
              <Progress value={timeEarningsStats.utilizationRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {timeEarningsStats.utilizationRate.toFixed(1)}% of allocated hours have been utilized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance Indicators</CardTitle>
          <CardDescription>
            Key metrics for platform health and efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project Completion Rate</p>
                <p className="text-2xl font-bold">{projectStats.completionRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Utilization</p>
                <p className="text-2xl font-bold">{teamUtilization.utilizationRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hourly Rate</p>
                <p className="text-2xl font-bold">{formatCurrency(timeEarningsStats.avgHourlyRate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
