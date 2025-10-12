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
import FreelancerProjectsPage from './pages/FreelancerProjectsPage'
import FreelancerTimerPage from './pages/FreelancerTimerPage'
import FreelancerEarningsPage from './pages/FreelancerEarningsPage'
import FreelancerApplicationsPage from './pages/FreelancerApplicationsPage'
import FreelancerTimerActivePage from './pages/FreelancerTimerActivePage'
import FreelancerTimeLogsPage from './pages/FreelancerTimeLogsPage'
import FreelancerManualEntryPage from './pages/FreelancerManualEntryPage'
import FreelancerAssignedProjectsPage from './pages/FreelancerAssignedProjectsPage'
import FreelancerAvailableProjectsPage from './pages/FreelancerAvailableProjectsPage'
import FreelancerEarningsOverviewPage from './pages/FreelancerEarningsOverviewPage'
import FreelancerEarningsReportsPage from './pages/FreelancerEarningsReportsPage'
import FreelancerInvoicesPage from './pages/FreelancerInvoicesPage'
import FreelancerSettingsPage from './pages/FreelancerSettingsPage'
import FreelancerNotificationsPage from './pages/FreelancerNotificationsPage'
import FreelancerProfilePage from './pages/FreelancerProfilePage'
import ClientDashboard from './pages/ClientDashboard'
import ClientActivityPage from './pages/ClientActivityPage'
import ClientProjectsPage from './pages/ClientProjectsPage'
import ClientActiveProjectsPage from './pages/ClientActiveProjectsPage'
import ClientCompletedProjectsPage from './pages/ClientCompletedProjectsPage'
import ClientProjectTimelinePage from './pages/ClientProjectTimelinePage'
import ClientFilesPage from './pages/ClientFilesPage'
import ClientDownloadsPage from './pages/ClientDownloadsPage'
import ClientSharedDocumentsPage from './pages/ClientSharedDocumentsPage'
import ClientMessagesPage from './pages/ClientMessagesPage'
import ClientTeamContactsPage from './pages/ClientTeamContactsPage'
import ClientCalendarPage from './pages/ClientCalendarPage'
import ClientProjectMilestonesPage from './pages/ClientProjectMilestonesPage'
import ClientMeetingsPage from './pages/ClientMeetingsPage'
import ClientNotificationsPage from './pages/ClientNotificationsPage'
import ClientSettingsPage from './pages/ClientSettingsPage'
import ClientSupportPage from './pages/ClientSupportPage'
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

// Admin pages
import LifecyclePage from './pages/admin/LifecyclePage'
import TeamPage from './pages/admin/TeamPage'
import DataLibraryPage from './pages/admin/DataLibraryPage'
import ReportsPage from './pages/admin/ReportsPage'
import WordAssistantPage from './pages/admin/WordAssistantPage'
import SettingsPage from './pages/admin/SettingsPage'
import HelpPage from './pages/admin/HelpPage'
import SearchPage from './pages/admin/SearchPage'
import { AdminAppLayout } from '@/components/dashboards/admin/AdminAppLayout'

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
            <AdminAppLayout>
              <Outlet />
            </AdminAppLayout>
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
        path: 'lifecycle',
        element: <LifecyclePage />,
      },
      {
        path: 'team',
        element: <TeamPage />,
      },
      {
        path: 'data-library',
        element: <DataLibraryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'word-assistant',
        element: <WordAssistantPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
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
        element: <FreelancerProjectsPage />,
      },
      {
        path: 'projects/assigned',
        element: <FreelancerAssignedProjectsPage />,
      },
      {
        path: 'projects/available',
        element: <FreelancerAvailableProjectsPage />,
      },
      {
        path: 'timer',
        element: <FreelancerTimerPage />,
      },
      {
        path: 'timer/active',
        element: <FreelancerTimerActivePage />,
      },
      {
        path: 'timer/logs',
        element: <FreelancerTimeLogsPage />,
      },
      {
        path: 'timer/manual',
        element: <FreelancerManualEntryPage />,
      },
      {
        path: 'earnings',
        element: <FreelancerEarningsPage />,
      },
      {
        path: 'earnings/overview',
        element: <FreelancerEarningsOverviewPage />,
      },
      {
        path: 'earnings/reports',
        element: <FreelancerEarningsReportsPage />,
      },
      {
        path: 'earnings/invoices',
        element: <FreelancerInvoicesPage />,
      },
      {
        path: 'applications',
        element: <FreelancerApplicationsPage />,
      },
      {
        path: 'settings',
        element: <FreelancerSettingsPage />,
      },
      {
        path: 'settings/profile',
        element: <FreelancerSettingsPage />,
      },
      {
        path: 'settings/preferences',
        element: <FreelancerSettingsPage />,
      },
      {
        path: 'settings/notifications',
        element: <FreelancerSettingsPage />,
      },
      {
        path: 'notifications',
        element: <FreelancerNotificationsPage />,
      },
      {
        path: 'profile',
        element: <FreelancerProfilePage />,
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
        path: 'dashboard/activity',
        element: <ClientActivityPage />,
      },
      {
        path: 'projects',
        element: <ClientProjectsPage />,
      },
      {
        path: 'projects/active',
        element: <ClientActiveProjectsPage />,
      },
      {
        path: 'projects/completed',
        element: <ClientCompletedProjectsPage />,
      },
      {
        path: 'projects/timeline',
        element: <ClientProjectTimelinePage />,
      },
      {
        path: 'files',
        element: <ClientFilesPage />,
      },
      {
        path: 'files/downloads',
        element: <ClientDownloadsPage />,
      },
      {
        path: 'files/shared',
        element: <ClientSharedDocumentsPage />,
      },
      {
        path: 'messages',
        element: <ClientMessagesPage />,
      },
      {
        path: 'messages/contacts',
        element: <ClientTeamContactsPage />,
      },
      {
        path: 'calendar',
        element: <ClientCalendarPage />,
      },
      {
        path: 'calendar/milestones',
        element: <ClientProjectMilestonesPage />,
      },
      {
        path: 'calendar/meetings',
        element: <ClientMeetingsPage />,
      },
      {
        path: 'notifications',
        element: <ClientNotificationsPage />,
      },
      {
        path: 'settings',
        element: <ClientSettingsPage />,
      },
      {
        path: 'support',
        element: <ClientSupportPage />,
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
