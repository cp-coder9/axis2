import React, { useEffect, useState } from 'react';
import { ShadcnAnalyticsDashboard } from '../components/admin/ShadcnAnalyticsDashboard';
import { BusinessIntelligenceData, generateBusinessIntelligence } from '../utils/analyticsEngine';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedShadcnChart, InteractiveChart, AccessibleChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AnalyticsPage: React.FC = () => {
  const { projects, users } = useAppContext();
  const [analyticsData, setAnalyticsData] = useState<BusinessIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setLoading(true);
        // Generate analytics data directly without initialization
        const data = generateBusinessIntelligence(projects || [], users || []);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAnalytics();
  }, [projects, users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header Loading */}
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
            
            {/* KPI Grid Loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Charts Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                Analytics Dashboard
                <Badge variant="secondary" className="text-xs">
                  Enhanced Charts
                </Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive insights with interactive, accessible, and theme-aware charts
              </CardDescription>
            </CardHeader>
            {analyticsData && (
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✅ Enhanced chart theming system active</p>
                  <p>📊 Interactive features enabled</p>
                  <p>♿ Accessibility features included</p>
                  <p>🎨 Auto theme switching: Light/Dark mode</p>
                  <p>📈 Export functionality: PNG, PDF, CSV</p>
                </div>
              </CardContent>
            )}
          </Card>
          
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="interactive">Interactive</TabsTrigger>
              <TabsTrigger value="accessible">Accessible</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-6">
              <ShadcnAnalyticsDashboard />
            </TabsContent>
            
            <TabsContent value="interactive" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveChart
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                      label: 'Revenue',
                      data: [12000, 19000, 15000, 25000, 22000, 30000],
                      type: 'success'
                    }, {
                      label: 'Expenses',
                      data: [8000, 12000, 10000, 15000, 14000, 18000],
                      type: 'warning'
                    }]
                  }}
                  title="Interactive Revenue Chart"
                  type="line"
                  enableZoom={true}
                  enableFilter={true}
                  enableExport={true}
                  showTrend={true}
                />
                
                <InteractiveChart
                  data={{
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                      label: 'Projects Completed',
                      data: [15, 23, 18, 27],
                    }, {
                      label: 'Projects Started',
                      data: [20, 25, 22, 30],
                    }]
                  }}
                  title="Interactive Project Progress"
                  type="bar"
                  enableZoom={true}
                  enableFilter={true}
                  enableExport={true}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="accessible" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AccessibleChart
                  data={{
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                      label: 'Hours Logged',
                      data: [40, 45, 38, 42],
                    }]
                  }}
                  title="Accessible Hours Chart"
                  description="Weekly hours logged with full keyboard navigation and screen reader support"
                  type="bar"
                  enableKeyboardNavigation={true}
                  enableScreenReader={true}
                  enableDataAnnouncement={true}
                  autoPlay={true}
                />
                
                <AccessibleChart
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{
                      label: 'Productivity Score',
                      data: [85, 92, 78, 88, 95],
                    }]
                  }}
                  title="Accessible Productivity Chart"
                  description="Daily productivity scores with auto-play feature"
                  type="line"
                  enableKeyboardNavigation={true}
                  enableScreenReader={true}
                  enableDataAnnouncement={true}
                  autoPlay={true}
                  autoPlayInterval={1500}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="enhanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedShadcnChart
                  data={{
                    labels: ['Design', 'Development', 'Testing', 'Deployment'],
                    datasets: [{
                      label: 'Time Spent (Hours)',
                      data: [120, 200, 80, 40],
                      type: 'info'
                    }]
                  }}
                  title="Enhanced Project Phases"
                  description="Time allocation across project phases with enhanced theming"
                  type="pie"
                  height={350}
                  loading={false}
                  interactive={true}
                  showLegend={true}
                  showTooltip={true}
                />
                
                <EnhancedShadcnChart
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                    datasets: [{
                      label: 'Client Satisfaction',
                      data: [4.2, 4.5, 4.1, 4.7, 4.8],
                      type: 'success'
                    }, {
                      label: 'Project Complexity',
                      data: [3.1, 3.8, 4.2, 3.5, 3.9],
                      type: 'warning'
                    }]
                  }}
                  title="Enhanced Metrics Tracking"
                  description="Client satisfaction vs project complexity with enhanced features"
                  type="line"
                  height={350}
                  loading={false}
                  interactive={true}
                  showLegend={true}
                  showTooltip={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
