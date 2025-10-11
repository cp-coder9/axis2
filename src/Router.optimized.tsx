import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProvider } from '@/contexts/AppContext'
import { ChartThemeProvider } from '@/components/charts/ChartThemeProvider'
import { DashboardLayout } from '@/components/navigation/AppLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { RoleRouter } from '@/components/auth/RoleRouter'
import { UserRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePerformanceMonitor } from '@/utils/performance/performanceOptimizer'

// Lazy load all pages for optimal code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const EnhancedAnalyticsDashboard = lazy(() => import('@/components/analytics/EnhancedAnalyticsDashboard').then(m => ({ default: m.EnhancedAnalyticsDashboard })))
const EnhancedFileManager = lazy(() => import('@/components/files/EnhancedFileManager').then(m => ({ default: m.EnhancedFileManager })))
const ThemeSystemIntegration = lazy(() => import('@/components/theme/ThemeSystemIntegration').then(m => ({ default: m.ThemeSystemIntegration })))
const PerformanceMonitorDashboard = lazy(() => import('@/components/performance/PerformanceMonitorDashboard').then(m => ({ default: m.PerformanceMonitorDashboard })))

// Freelancer pages
const FreelancerDashboard = lazy(() => import('./pages/FreelancerDashboard'))

// Client pages
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))

// Demo pages
const TimerDemo = lazy(() => import('./demos/TimerDemo'))
const TimerSyncDemo = lazy(() => import('./demo/components/timer/timer-sync-demo'))
const SkeletonDemo = lazy(() => import('@/components/demos/SkeletonDemo').then(m => ({ default: m.SkeletonDemo })))
const GlassmorphismModalDemo = lazy(() => import('@/components/demos/GlassmorphismModalDemo').then(m => ({ default: m.GlassmorphismModalDemo })))
const FormEnhancementsDemo = lazy(() => import('@/components/demos/FormEnhancementsDemo').then(m => ({ default: m.FormEnhancementsDemo })))

// Project workflow
const ProjectWorkflow = lazy(() => import('@/components/project/ProjectWorkflow'))

// Legacy dashboard
const DashboardContent = lazy(() => import('./pages/Dashboard'))

// Loading fallback component
function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="container mx-auto p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <div className="text-center text-muted-foreground mt-4">
        {message}
      </div>
    </div>
  )
}

// Optimized suspense wrapper with performance tracking
function SuspenseWithPerformance({ 
  children, 
  fallback, 
  componentName 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  componentName: string
}) {
  usePerformanceMonitor(componentName);
  
  return (
    <Suspense fallback={fallback || <PageLoader message={`Loading ${componentName}...`} />}>
      {children}
    </Suspense>
  )
}

// Placeholder component for pages under development
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is currently under development as part of the shadcn/ui migration.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Layout wrapper component that provides theme, app context, and layout structure
function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <AuthGuard>
            <DashboardLayout userRole="Admin">
              <Outlet />
            </DashboardLayout>
          </AuthGuard>
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Admin layout with role-based access control
function AdminLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <AuthGuard requiredRole={UserRole.ADMIN}>
            <DashboardLayout userRole="Admin">
              <Outlet />
            </DashboardLayout>
          </AuthGuard>
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Freelancer layout with role-based access control
function FreelancerLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <AuthGuard requiredRole={UserRole.FREELANCER}>
            <Outlet />
          </AuthGuard>
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Client layout with role-based access control
function ClientLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <AuthGuard requiredRole={UserRole.CLIENT}>
            <DashboardLayout userRole="Client">
              <Outlet />
            </DashboardLayout>
          </AuthGuard>
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Public layout for login and other public pages
function PublicLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <Outlet />
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Standalone demo layout (no sidebar)
function DemoLayout() {
  return (
    <AppProvider>
      <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
        <ChartThemeProvider>
          <Outlet />
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Define routes with lazy loading and performance optimization
const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWithPerformance componentName="LoginPage">
            <LoginPage />
          </SuspenseWithPerformance>
        ),
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWithPerformance componentName="UnauthorizedPage">
            <UnauthorizedPage />
          </SuspenseWithPerformance>
        ),
      },
    ],
  },
  
  // Root route with role-based redirection
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <RoleRouter />,
      },
    ],
  },

  // Admin routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWithPerformance componentName="AdminDashboard">
            <AdminDashboard />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'projects',
        element: (
          <SuspenseWithPerformance componentName="ProjectWorkflow">
            <ProjectWorkflow />
          </SuspenseWithPerformance>
        ),
        children: [
          {
            path: 'active',
            element: <PlaceholderPage title="Active Projects" />,
          },
          {
            path: 'archived',
            element: <PlaceholderPage title="Archived Projects" />,
          },
        ],
      },
      {
        path: 'users',
        element: <PlaceholderPage title="User Management" />,
      },
      {
        path: 'analytics',
        element: (
          <SuspenseWithPerformance componentName="AnalyticsPage">
            <AnalyticsPage />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'enhanced-analytics',
        element: (
          <SuspenseWithPerformance componentName="EnhancedAnalyticsDashboard">
            <EnhancedAnalyticsDashboard />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'file-manager',
        element: (
          <SuspenseWithPerformance componentName="EnhancedFileManager">
            <EnhancedFileManager showAuditLog={true} />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'theme-system',
        element: (
          <SuspenseWithPerformance componentName="ThemeSystemIntegration">
            <ThemeSystemIntegration />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'performance',
        element: (
          <SuspenseWithPerformance componentName="PerformanceMonitorDashboard">
            <PerformanceMonitorDashboard />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'settings',
        element: <PlaceholderPage title="Admin Settings" />,
      },
    ],
  },

  // Freelancer routes
  {
    path: '/freelancer',
    element: <FreelancerLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWithPerformance componentName="FreelancerDashboard">
            <FreelancerDashboard />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'projects',
        element: <PlaceholderPage title="My Projects" />,
      },
      {
        path: 'timer',
        element: <PlaceholderPage title="Timer" />,
      },
      {
        path: 'earnings',
        element: <PlaceholderPage title="Earnings" />,
      },
      {
        path: 'applications',
        element: <PlaceholderPage title="Project Applications" />,
      },
    ],
  },

  // Client routes
  {
    path: '/client',
    element: <ClientLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWithPerformance componentName="ClientDashboard">
            <ClientDashboard />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'projects',
        element: <PlaceholderPage title="My Projects" />,
      },
      {
        path: 'files',
        element: <PlaceholderPage title="Project Files" />,
      },
      {
        path: 'messages',
        element: <PlaceholderPage title="Messages" />,
      },
    ],
  },

  // Legacy routes (for backward compatibility)
  {
    path: '/dashboard',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWithPerformance componentName="DashboardContent">
            <DashboardContent />
          </SuspenseWithPerformance>
        ),
      },
    ],
  },

  // Demo routes
  {
    path: '/demo',
    element: <DemoLayout />,
    children: [
      {
        path: 'timer',
        element: (
          <SuspenseWithPerformance componentName="TimerDemo">
            <TimerDemo />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'timer-sync',
        element: (
          <SuspenseWithPerformance componentName="TimerSyncDemo">
            <TimerSyncDemo />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'skeleton',
        element: (
          <SuspenseWithPerformance componentName="SkeletonDemo">
            <SkeletonDemo />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'glassmorphism-modals',
        element: (
          <SuspenseWithPerformance componentName="GlassmorphismModalDemo">
            <GlassmorphismModalDemo />
          </SuspenseWithPerformance>
        ),
      },
      {
        path: 'form-enhancements',
        element: (
          <SuspenseWithPerformance componentName="FormEnhancementsDemo">
            <FormEnhancementsDemo />
          </SuspenseWithPerformance>
        ),
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export const OptimizedRouter = () => {
  return <RouterProvider 
    router={router} 
    future={{
      v7_startTransition: true
    }}
  />
}

export default OptimizedRouter
