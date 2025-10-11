import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonWidget, 
  SkeletonForm 
} from '@/components/ui/skeleton';
import {
  DashboardSkeleton,
  AdminDashboardSkeleton,
  EnhancedDashboardGridSkeleton,
  StatsCardsSkeleton,
  ProjectProgressSkeleton,
  TeamPerformanceSkeleton,
  RecentActivitySkeleton,
  QuickActionsSkeleton
} from '@/components/loading/DashboardSkeleton';
import {
  ModalSkeleton,
  NavigationSkeleton,
  ProjectCardSkeleton,
  UserTableSkeleton,
  ChartSkeleton,
  FileManagerSkeleton,
  ChatSkeleton,
  TimerSkeleton,
  SettingsSkeleton
} from '@/components/loading/ComponentSkeletons';

export function SkeletonDemo() {
  const [activeDemo, setActiveDemo] = useState<string>('basic');
  const [isLoading, setIsLoading] = useState(false);

  const triggerLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skeleton Loading System Demo</h1>
          <p className="text-muted-foreground">
            Comprehensive showcase of modern skeleton loading patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Enhanced Animations
          </Badge>
          <Button onClick={triggerLoading} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Trigger Loading'}
          </Button>
        </div>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Skeleton Elements</CardTitle>
                <CardDescription>
                  Fundamental skeleton components with different variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Default Skeleton</h4>
                  <Skeleton width="100%" height="20px" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Shimmer Animation</h4>
                  <Skeleton width="80%" height="20px" variant="shimmer" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Wave Animation</h4>
                  <Skeleton width="90%" height="20px" variant="wave" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pulse Animation</h4>
                  <Skeleton width="70%" height="20px" variant="pulse" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Circle Skeleton</h4>
                  <div className="flex items-center space-x-3">
                    <Skeleton width="40px" height="40px" circle />
                    <Skeleton width="60px" height="40px" circle />
                    <Skeleton width="80px" height="40px" circle />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Skeletons</CardTitle>
                <CardDescription>
                  Multi-line text with staggered animations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Standard Text Block</h4>
                  <SkeletonText lines={3} />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Custom Width Pattern</h4>
                  <SkeletonText 
                    lines={4} 
                    width={['100%', '90%', '70%', '50%']}
                    variant="shimmer"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Avatar with Text</h4>
                  <div className="flex items-start space-x-3">
                    <SkeletonAvatar size={48} />
                    <div className="flex-1">
                      <SkeletonText lines={2} width={['60%', '40%']} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Skeletons</CardTitle>
                <CardDescription>
                  Complete dashboard loading states
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <StatsCardsSkeleton count={4} />
                    <div className="grid gap-6 md:grid-cols-2">
                      <ProjectProgressSkeleton />
                      <TeamPerformanceSkeleton />
                    </div>
                    <RecentActivitySkeleton />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Click "Trigger Loading" to see dashboard skeletons
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhanced Dashboard Grid</CardTitle>
                <CardDescription>
                  Widget-based dashboard loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <EnhancedDashboardGridSkeleton />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Click "Trigger Loading" to see enhanced dashboard grid
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card Skeletons</CardTitle>
                <CardDescription>
                  Various card loading patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SkeletonCard 
                  showImage={true}
                  bodyLines={2}
                  variant="shimmer"
                />
                <SkeletonCard 
                  showImage={false}
                  bodyLines={3}
                  showFooter={false}
                  variant="wave"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Widget Skeletons</CardTitle>
                <CardDescription>
                  Dashboard widget loading states
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SkeletonWidget height="150px" />
                <SkeletonWidget height="120px" showHeader={false} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Cards</CardTitle>
                <CardDescription>
                  Project-specific loading patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProjectCardSkeleton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chart Skeletons</CardTitle>
                <CardDescription>
                  Analytics and chart loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartSkeleton height="200px" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Form Skeletons</CardTitle>
                <CardDescription>
                  Form loading with field patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonForm fields={5} buttonWidth="150px" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modal Skeletons</CardTitle>
                <CardDescription>
                  Modal dialog loading states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModalSkeleton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timer Component</CardTitle>
                <CardDescription>
                  Timer interface loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimerSkeleton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings Page</CardTitle>
                <CardDescription>
                  Settings interface loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <SettingsSkeleton />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Table Skeletons</CardTitle>
                <CardDescription>
                  Data table loading patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTableSkeleton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Manager</CardTitle>
                <CardDescription>
                  File browser loading interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <FileManagerSkeleton />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Skeleton</CardTitle>
                <CardDescription>
                  Sidebar and navigation loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                  <NavigationSkeleton />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chat Interface</CardTitle>
                <CardDescription>
                  Messaging interface loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                  <ChatSkeleton />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staggered Animations</CardTitle>
                <CardDescription>
                  Sequential loading with delays
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <SkeletonAvatar size={32} />
                    <div className="flex-1">
                      <Skeleton 
                        width="70%" 
                        height="1rem" 
                        delay={index * 150}
                        variant="shimmer"
                      />
                    </div>
                    <Skeleton 
                      width="60px" 
                      height="24px" 
                      delay={index * 150 + 75}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Features</CardTitle>
                <CardDescription>
                  Accessibility and performance optimizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Reduced Motion Support</h4>
                  <p className="text-xs text-muted-foreground">
                    Animations respect prefers-reduced-motion settings
                  </p>
                  <Skeleton width="100%" height="20px" variant="shimmer" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">ARIA Labels</h4>
                  <p className="text-xs text-muted-foreground">
                    Screen reader announcements for loading states
                  </p>
                  <Skeleton 
                    width="100%" 
                    height="20px" 
                    aria-label="Loading user profile information"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Performance Optimized</h4>
                  <p className="text-xs text-muted-foreground">
                    CSS containment and hardware acceleration
                  </p>
                  <div className="flex space-x-2">
                    <Skeleton width="30%" height="20px" className="contain-layout" />
                    <Skeleton width="30%" height="20px" className="contain-paint" />
                    <Skeleton width="30%" height="20px" className="will-change-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}