import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Users, LayoutDashboard, Clock, Sun, Moon, Monitor, Settings, TrendingUp, Briefcase, DollarSign } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { ThemeValidation } from '@/components/theme-validation'
import { Link } from 'react-router-dom'
import { DashboardLayoutManager } from '@/components/dashboard/DashboardLayoutManager'
import { widgetRegistry, getWidgetsByRole } from '@/components/dashboard/WidgetRegistry'
import { EnhancedAnalyticsDashboard } from '@/components/analytics/EnhancedAnalyticsDashboard'
import { EnhancedFileManager } from '@/components/files/EnhancedFileManager'
import { EnhancedDashboardGrid } from '@/components/dashboard/EnhancedDashboardGrid'
import { ThemeSystemIntegration } from '@/components/theme/ThemeSystemIntegration'
import { WidgetLayout, DashboardSettings } from '@/types/dashboard'
import { UserRole } from '@/types'
import { 
  DashboardSkeleton, 
  EnhancedDashboardGridSkeleton 
} from '@/components/loading/DashboardSkeleton'
import { ModernDashboardCard, AnimatedStatCard } from '@/components/dashboard/ModernDashboardCard'
import { 
  AnimatedProgress, 
  ComparisonBar,
  RealTimeValue 
} from '@/components/dashboard/EnhancedDataVisualization'
import { DashboardCustomization } from '@/components/dashboard/DashboardCustomization'

function DashboardContent() {
  const { theme, setTheme } = useTheme()
  const [isEditMode, setIsEditMode] = useState(false)
  const [dashboardLayout, setDashboardLayout] = useState<WidgetLayout[]>([])
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    userId: 'current-user', // This would come from auth context
    layout: [],
    enabledWidgets: [],
    refreshIntervals: {},
    autoRefresh: true,
    compactMode: false,
    lastUpdated: new Date()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Mock user role - this would come from auth context
  const userRole = UserRole.ADMIN;
  const availableWidgets = getWidgetsByRole(userRole);

  // Load saved layout from localStorage (in real app, this would be from API)
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API loading time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const savedLayout = localStorage.getItem('dashboard-layout');
      const savedSettings = localStorage.getItem('dashboard-settings');
      
      if (savedLayout) {
        try {
          setDashboardLayout(JSON.parse(savedLayout));
        } catch (error) {
          console.error('Failed to load dashboard layout:', error);
        }
      }
      
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setDashboardSettings({ ...dashboardSettings, ...settings });
        } catch (error) {
          console.error('Failed to load dashboard settings:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadDashboardData();
  }, []);

  // Handle layout changes
  const handleLayoutChange = (newLayout: WidgetLayout[]) => {
    setDashboardLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
  };

  // Handle settings changes
  const handleSettingsChange = (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...dashboardSettings, ...newSettings, lastUpdated: new Date() };
    setDashboardSettings(updatedSettings);
    localStorage.setItem('dashboard-settings', JSON.stringify(updatedSettings));
  };

  // Handle widget visibility changes
  const handleWidgetVisibilityChange = (widgetId: string, visible: boolean) => {
    const updatedWidgets = visible
      ? [...dashboardSettings.enabledWidgets, widgetId]
      : dashboardSettings.enabledWidgets.filter(id => id !== widgetId);
    
    handleSettingsChange({ enabledWidgets: updatedWidgets });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Architex Axis Dashboard</h1>
          <p className="text-muted-foreground">Project Management Platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Online
          </Badge>
          <div className="flex gap-1">
            <Button 
              onClick={() => setTheme('light')} 
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="btn-hover-scale transition-all duration-200"
            >
              <Sun className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setTheme('dark')} 
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="btn-hover-scale transition-all duration-200"
            >
              <Moon className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setTheme('system')} 
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              className="btn-hover-scale transition-all duration-200"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setIsEditMode(!isEditMode)} 
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              className="btn-hover-scale transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/demo/timer">Timer Demo</Link>
        </Button>
        <Button variant="outline" onClick={() => {
          const validationCard = document.getElementById('theme-validation')
          if (validationCard) {
            validationCard.scrollIntoView({ behavior: 'smooth' })
          }
        }}>
          Theme Validation
        </Button>
      </div>

      {/* Dashboard Layout Manager */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => setActiveTab('analytics')}>Analytics</TabsTrigger>
          <TabsTrigger value="files" onClick={() => setActiveTab('files')}>Files</TabsTrigger>
          <TabsTrigger value="theme" onClick={() => setActiveTab('theme')}>Theme</TabsTrigger>
          <TabsTrigger value="legacy" onClick={() => setActiveTab('legacy')}>Legacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4 mt-6">
          {isLoading && activeTab === 'dashboard' ? (
            <EnhancedDashboardGridSkeleton />
          ) : (
            <div className="space-y-4">
              {isEditMode && (
                <DashboardCustomization
                  widgets={availableWidgets}
                  layout={dashboardLayout}
                  settings={dashboardSettings}
                  onLayoutChange={handleLayoutChange}
                  onSettingsChange={handleSettingsChange}
                  onWidgetVisibilityChange={handleWidgetVisibilityChange}
                  userRole={userRole}
                />
              )}
              <EnhancedDashboardGrid
                widgets={availableWidgets}
                layout={dashboardLayout}
                onLayoutChange={handleLayoutChange}
                isEditMode={isEditMode}
                userRole="Admin"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <EnhancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="files" className="space-y-4 mt-6">
          <EnhancedFileManager showAuditLog={true} />
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 mt-6">
          <ThemeSystemIntegration />
        </TabsContent>
        
        <TabsContent value="legacy" className="space-y-4 mt-6">
          {isLoading && activeTab === 'legacy' ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Legacy dashboard content */}

      {/* Modern Stats Cards with Animations and Sparklines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModernDashboardCard
          title="Active Users"
          description="Currently online"
          value={24}
          icon={Users}
          trend={{
            value: 24,
            change: 8.3,
            changeType: 'increase',
            period: 'vs last hour'
          }}
          sparklineData={[18, 20, 19, 22, 21, 23, 24]}
          badge={{ text: 'Live', variant: 'default' }}
        />
        
        <ModernDashboardCard
          title="Active Projects"
          description="In progress"
          value={12}
          icon={Briefcase}
          trend={{
            value: 12,
            change: 25,
            changeType: 'increase',
            period: 'vs last week'
          }}
          sparklineData={[8, 9, 10, 11, 10, 11, 12]}
          badge={{ text: '3 completed', variant: 'outline' }}
        />
        
        <ModernDashboardCard
          title="Hours Tracked"
          description="This month"
          value={847}
          icon={Clock}
          trend={{
            value: 847,
            change: 12,
            changeType: 'increase',
            period: 'vs last month'
          }}
          sparklineData={[720, 750, 780, 800, 820, 835, 847]}
        />
        
        <ModernDashboardCard
          title="Completion Rate"
          description="Overall performance"
          value="89%"
          icon={CheckCircle}
          trend={{
            value: 89,
            change: 5,
            changeType: 'increase',
            period: 'vs last quarter'
          }}
          sparklineData={[82, 84, 85, 86, 87, 88, 89]}
          badge={{ text: 'Excellent', variant: 'default' }}
        />
      </div>

      {/* Animated Statistics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnimatedStatCard
          label="Total Revenue"
          value={125000}
          prefix="$"
          icon={DollarSign}
          color="success"
          trend={{ value: 125000, change: 15.3, changeType: 'increase' }}
        />
        <AnimatedStatCard
          label="Project Value"
          value={450000}
          prefix="$"
          icon={TrendingUp}
          color="primary"
          trend={{ value: 450000, change: 8.7, changeType: 'increase' }}
        />
        <AnimatedStatCard
          label="Team Members"
          value={24}
          icon={Users}
          color="warning"
          trend={{ value: 24, change: 20, changeType: 'increase' }}
        />
      </div>

      {/* Main Content with Enhanced Visualizations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-hover transition-all duration-200">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overview of current project statuses with milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatedProgress
              value={75}
              label="Residential Complex Design"
              milestone={80}
              celebrateOnComplete={true}
            />
            <AnimatedProgress
              value={45}
              label="Commercial Tower Planning"
              milestone={50}
              color="warning"
            />
            <AnimatedProgress
              value={90}
              label="Urban Park Development"
              milestone={85}
              color="success"
              celebrateOnComplete={true}
            />
          </CardContent>
        </Card>

        <Card className="card-hover transition-all duration-200">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Current team metrics with visual comparisons</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="transition-all duration-200">Overview</TabsTrigger>
                <TabsTrigger value="metrics" className="transition-all duration-200">Metrics</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 mt-4 animate-fade-in">
                <RealTimeValue
                  value={8}
                  previousValue={7}
                  label="Active Team Members"
                />
                <RealTimeValue
                  value={5}
                  previousValue={4}
                  label="Projects in Progress"
                />
                <RealTimeValue
                  value={3}
                  label="Completed This Month"
                />
              </TabsContent>
              <TabsContent value="metrics" className="space-y-4 mt-4 animate-fade-in">
                <ComparisonBar
                  items={[
                    { label: 'Productivity Score', value: 92, color: 'hsl(var(--primary))' },
                    { label: 'Quality Rating', value: 88, color: 'hsl(var(--chart-2))' },
                    { label: 'On-time Delivery', value: 95, color: 'hsl(var(--chart-1))' }
                  ]}
                  showValues={true}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity with Micro-interactions */}
      <Card className="card-hover transition-all duration-200">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer group">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-subtle"></div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Project milestone completed</p>
                <p className="text-xs text-muted-foreground">Residential Complex Design - Phase 2</p>
              </div>
              <Badge variant="outline" className="transition-transform duration-200 group-hover:scale-105">2 hours ago</Badge>
            </div>
            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer group">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-subtle"></div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors duration-200">New team member joined</p>
                <p className="text-xs text-muted-foreground">Sarah Johnson - Senior Architect</p>
              </div>
              <Badge variant="outline" className="transition-transform duration-200 group-hover:scale-105">5 hours ago</Badge>
            </div>
            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer group">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse-subtle"></div>
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Client feedback received</p>
                <p className="text-xs text-muted-foreground">Commercial Tower Planning - Revision requested</p>
              </div>
              <Badge variant="outline" className="transition-transform duration-200 group-hover:scale-105">1 day ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Theme Validation */}
          <div id="theme-validation">
            <ThemeValidation />
          </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardContent
