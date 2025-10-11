import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProvider } from '@/contexts/AppContext'
import { ChartThemeProvider } from '@/components/charts/ChartThemeProvider'
import { DashboardLayout } from '@/components/navigation/AppLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { RoleRouter } from '@/components/auth/RoleRouter'
import { UserRole } from '@/types'
import DashboardContent from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboardPage'
import FreelancerDashboard from './pages/FreelancerDashboard'
import ClientDashboard from './pages/ClientDashboard'
import UnauthorizedPage from './pages/UnauthorizedPage'
import AnalyticsPage from './pages/AnalyticsPage'
import TimerDemo from './demos/TimerDemo'
import TimerSyncDemo from './demo/components/timer/timer-sync-demo'
import ProjectWorkflow from '@/components/project/ProjectWorkflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedAnalyticsDashboard } from '@/components/analytics/EnhancedAnalyticsDashboard'
import { EnhancedFileManager } from '@/components/files/EnhancedFileManager'
import { ThemeSystemIntegration } from '@/components/theme/ThemeSystemIntegration'
import { PerformanceMonitorDashboard } from '@/components/performance/PerformanceMonitorDashboard'
import { SkeletonDemo } from '@/components/demos/SkeletonDemo'
import { GlassmorphismModalDemo } from '@/components/demos/GlassmorphismModalDemo'
import { FormEnhancementsDemo } from '@/components/demos/FormEnhancementsDemo'
import { MobileOptimizationsDemo } from '@/pages/MobileOptimizationsDemo'
import CSPTestPage from '@/pages/CSPTestPage'
import { Toaster } from 'sonner'

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
          <Toaster position="top-right" richColors />
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
          <Toaster position="top-right" richColors />
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
          <Toaster position="top-right" richColors />
          <AuthGuard requiredRole={UserRole.FREELANCER}>
            <DashboardLayout userRole="Freelancer">
              <Outlet />
            </DashboardLayout>
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
          <Toaster position="top-right" richColors />
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
          <Toaster position="top-right" richColors />
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
          <Toaster position="top-right" richColors />
          <Outlet />
        </ChartThemeProvider>
      </ThemeProvider>
    </AppProvider>
  )
}

// Define routes with future flags for React Router v7 compatibility
const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <UnauthorizedPage />,
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
        element: <AdminDashboard />,
      },
      {
        path: 'projects',
        element: <ProjectWorkflow />,
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
        element: <AnalyticsPage />,
      },
      {
        path: 'enhanced-analytics',
        element: <EnhancedAnalyticsDashboard />,
      },
      {
        path: 'file-manager',
        element: <EnhancedFileManager showAuditLog={true} />,
      },
      {
        path: 'theme-system',
        element: <ThemeSystemIntegration />,
      },
      {
        path: 'performance',
        element: <PerformanceMonitorDashboard />,
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
        element: <FreelancerDashboard />,
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
        element: <ClientDashboard />,
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
        element: <DashboardContent />,
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
        element: <TimerDemo />,
      },
      {
        path: 'timer-sync',
        element: <TimerSyncDemo />,
      },
      {
        path: 'skeleton',
        element: <SkeletonDemo />,
      },
      {
        path: 'glassmorphism-modals',
        element: <GlassmorphismModalDemo />,
      },
      {
        path: 'form-enhancements',
        element: <FormEnhancementsDemo />,
      },
      {
        path: 'mobile-optimizations',
        element: <MobileOptimizationsDemo />,
      },
      {
        path: 'csp-test',
        element: <CSPTestPage />,
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export const Router = () => {
  return <RouterProvider 
    router={router} 
    future={{
      v7_startTransition: true
    }}
  />
}

export default Router
