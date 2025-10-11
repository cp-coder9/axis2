import { ThemeProvider } from '@/components/theme-provider'
import { Layout, DashboardLayout, ProjectLayout, AdminLayout } from '@/components/navigation/Layout'
import { Button, Card, CardHeader, CardTitle, CardContent, CardDescription, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/shadcn'
import { shadcnClasses, getStatusClasses, getRoleClasses, layoutPatterns, responsive } from '@/lib/shadcn-utils'
import { CheckCircle, LayoutDashboard, Palette, Type, Navigation, Sidebar as SidebarIcon, Users, Settings, Clock } from 'lucide-react'
import './globals.css'

function DashboardDemo() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your Architex Axis workspace</p>
        </div>
        <Badge variant="secondary">Admin Dashboard</Badge>
      </div>

      {/* Phase 3 Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Phase 3: Core UI Component Migration - Complete ✅
          </CardTitle>
          <CardDescription>
            All 5 tasks successfully implemented with shadcn/ui integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <Type className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Typography Scale</p>
                <p className="text-xs text-muted-foreground">Enhanced font system</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <Palette className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Utility Classes</p>
                <p className="text-xs text-muted-foreground">shadcn-ui tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <LayoutDashboard className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Dashboard Layout</p>
                <p className="text-xs text-muted-foreground">Responsive structure</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <Navigation className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Header Component</p>
                <p className="text-xs text-muted-foreground">Navigation menu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <SidebarIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Sidebar Navigation</p>
                <p className="text-xs text-muted-foreground">Role-based structure</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Variants Demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Typography System</CardTitle>
            <CardDescription>Enhanced font scales and spacing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Heading 1</h1>
              <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <p className="text-lg font-semibold">Large text</p>
              <p className="text-base">Base text with proper line height</p>
              <p className="text-sm text-muted-foreground">Small muted text</p>
              <code className="font-mono text-sm">Monospace code</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Indicators</CardTitle>
            <CardDescription>Role-based and status-based styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Status Classes:</div>
              <div className={`p-2 rounded text-xs font-medium ${getStatusClasses('active')}`}>
                Active Status
              </div>
              <div className={`p-2 rounded text-xs font-medium ${getStatusClasses('pending')}`}>
                Pending Status  
              </div>
              <div className={`p-2 rounded text-xs font-medium ${getStatusClasses('completed')}`}>
                Completed Status
              </div>
              <div className={`p-2 rounded text-xs font-medium ${getStatusClasses('cancelled')}`}>
                Cancelled Status
              </div>
              <div className={`p-2 rounded text-xs font-medium ${getStatusClasses('draft')}`}>
                Draft Status
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role-Based Styling</CardTitle>
            <CardDescription>Visual differentiation by user role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${getRoleClasses('admin')}`}>
                <div className="font-medium text-sm">Admin Role</div>
                <div className="text-xs text-muted-foreground">Full system access</div>
              </div>
              <div className={`p-3 rounded-lg ${getRoleClasses('freelancer')}`}>
                <div className="font-medium text-sm">Freelancer Role</div>
                <div className="text-xs text-muted-foreground">Project contributor</div>
              </div>
              <div className={`p-3 rounded-lg ${getRoleClasses('client')}`}>
                <div className="font-medium text-sm">Client Role</div>
                <div className="text-xs text-muted-foreground">Project owner</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-architex-primary rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-architex-secondary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-architex-accent rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">847</div>
                <p className="text-xs text-muted-foreground">Hours Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-architex-success rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LayoutVariantsDemo() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Dashboard Layout</TabsTrigger>
        <TabsTrigger value="project">Project Layout</TabsTrigger>
        <TabsTrigger value="admin">Admin Layout</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Layout Variant</CardTitle>
            <CardDescription>Standard dashboard with clean background</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg ${shadcnClasses.backgrounds.clean}`}>
                <p className="text-center text-muted-foreground">
                  This demo shows the DashboardLayout component with clean background styling
                </p>
              </div>
              <div className={`flex gap-4 ${responsive.flexCol}`}>
                <Button>Primary Action</Button>
                <Button variant="outline">Secondary Action</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="project">
        <Card>
          <CardHeader>
            <CardTitle>Project Layout Variant</CardTitle>
            <CardDescription>Project-focused layout with muted background</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg ${layoutPatterns.project}`}>
                <p className="text-center text-muted-foreground">
                  This demo shows the ProjectLayout component with subtle muted background
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">Project Files</div>
                    <div className="text-xs text-muted-foreground">24 files</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">Team Members</div>
                    <div className="text-xs text-muted-foreground">8 members</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="admin">
        <Card>
          <CardHeader>
            <CardTitle>Admin Layout Variant</CardTitle>
            <CardDescription>Administrative interface layout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-center text-muted-foreground">
                  This demo shows the AdminLayout component locked to Admin role
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <Settings className="h-6 w-6 mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">System Settings</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">User Management</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <LayoutDashboard className="h-6 w-6 mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium">Analytics</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function AppContent() {
  return (
    <DashboardLayout userRole="Admin">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard Demo</TabsTrigger>
          <TabsTrigger value="layouts">Layout Variants</TabsTrigger>
          <TabsTrigger value="project">Project Layout</TabsTrigger>
          <TabsTrigger value="admin">Admin Layout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <DashboardDemo />
        </TabsContent>
        
        <TabsContent value="layouts">
          <LayoutVariantsDemo />
        </TabsContent>
        
        <TabsContent value="project">
          <ProjectLayout userRole="Freelancer">
            <Card>
              <CardHeader>
                <CardTitle>Project Layout Demo</CardTitle>
                <CardDescription>Dedicated project workspace layout</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This demonstrates the ProjectLayout component in action.</p>
              </CardContent>
            </Card>
          </ProjectLayout>
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminLayout>
            <Card>
              <CardHeader>
                <CardTitle>Admin Layout Demo</CardTitle>
                <CardDescription>Administrative interface layout</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This demonstrates the AdminLayout component with admin-only features.</p>
              </CardContent>
            </Card>
          </AdminLayout>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

// Also demonstrate the base Layout component
function LayoutDemo() {
  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Base Layout Demo</CardTitle>
          <CardDescription>Generic layout wrapper component</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This demonstrates the base Layout component functionality.</p>
        </CardContent>
      </Card>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
      <Tabs defaultValue="app" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="app">Main App Demo</TabsTrigger>
          <TabsTrigger value="layout">Base Layout Demo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="app">
          <AppContent />
        </TabsContent>
        
        <TabsContent value="layout">
          <LayoutDemo />
        </TabsContent>
      </Tabs>
    </ThemeProvider>
  )
}

export default App
