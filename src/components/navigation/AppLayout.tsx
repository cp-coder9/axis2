import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/lib/shadcn"
import { AppSidebar } from "./AppSidebar"
import { HeaderContent } from "./HeaderContent"
import { cn } from "@/lib/shadcn-utils"
import React from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Clock, 
  Users, 
  Settings, 
  MessageSquare,
  Menu,
  Bell,
  Search
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: 'Admin' | 'Freelancer' | 'Client'
  className?: string
}

export function AppLayout({ children, userRole = 'Admin', className }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
            <HeaderContent />
          </div>
        </header>
        <main className={cn("flex-1 p-4 pt-0", className)}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Layout variants for different dashboard sections
export function DashboardLayout({ children, userRole }: Omit<AppLayoutProps, 'className'>) {
  return (
    <AppLayout userRole={userRole} className="space-y-6">
      {children}
    </AppLayout>
  )
}

export function ProjectLayout({ children, userRole }: Omit<AppLayoutProps, 'className'>) {
  return (
    <AppLayout userRole={userRole} className="space-y-4">
      {children}
    </AppLayout>
  )
}

export function AdminLayout({ children }: Omit<AppLayoutProps, 'userRole' | 'className'>) {
  return (
    <AppLayout userRole="Admin" className="space-y-6">
      {children}
    </AppLayout>
  )
}

// For backward compatibility, export the original Layout as well
export { AppLayout as Layout }

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', active: true },
  { icon: FolderOpen, label: 'Projects', href: '/projects' },
  { icon: Clock, label: 'Timer', href: '/timer' },
  { icon: Users, label: 'Team', href: '/team' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn("pb-12 w-64", className)} data-focus-group="sidebar">
      <div className="space-y-4 py-4">
        {/* Logo/Brand */}
        <div className="px-3 py-2">
          <div className="flex items-center space-x-2 px-4">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Architex Axis</h2>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3">
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant={item.active ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <a href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </a>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Alternative layout using the older sidebar structure
export function LegacyDashboardLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex flex-col lg:pl-64">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-4 dark:bg-gray-800/40 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search projects, tasks..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>

          <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </header>

        {/* Main Content */}
        <main className={cn("flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
