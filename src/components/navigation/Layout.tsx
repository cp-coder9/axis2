import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { cn, layoutPatterns, responsive } from "@/lib/shadcn-utils"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  userRole?: 'Admin' | 'Freelancer' | 'Client'
  className?: string
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

export function Layout({ 
  children, 
  userRole = 'Admin', 
  className,
  sidebarOpen: controlledSidebarOpen,
  onSidebarToggle 
}: LayoutProps) {
  // Internal state for sidebar when not controlled
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const sidebarOpen = controlledSidebarOpen ?? internalSidebarOpen
  const handleSidebarToggle = onSidebarToggle ?? (() => setInternalSidebarOpen(prev => !prev))

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        handleSidebarToggle()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen, handleSidebarToggle])

  return (
    <div className={cn(layoutPatterns.dashboard, className)}>
      {/* Header with mobile menu toggle */}
      <div className={layoutPatterns.header}>
        <div className={responsive.padding}>
          <div className="flex h-14 items-center justify-between">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={handleSidebarToggle}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-full">
                  <Sidebar userRole={userRole} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop header content */}
            <div className="hidden md:block flex-1">
              <Header />
            </div>

            {/* Mobile header content (simplified) */}
            <div className="md:hidden flex-1 flex justify-center">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-architex-primary rounded"></div>
                <span className="font-bold text-lg">Architex Axis</span>
              </div>
            </div>

            {/* Mobile header actions */}
            <div className="md:hidden">
              <Header />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden md:flex w-64 flex-col fixed left-0 top-14 h-[calc(100vh-3.5rem)] border-r bg-background z-30",
          "transition-transform duration-300 ease-in-out"
        )}>
          <Sidebar userRole={userRole} />
        </aside>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 md:ml-64 transition-all duration-300 ease-in-out",
          "min-h-[calc(100vh-3.5rem)]"
        )}>
          <div className={cn(
            layoutPatterns.content,
            responsive.padding,
            "pt-6 pb-6"
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={handleSidebarToggle}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Layout variants for different dashboard sections
export function DashboardLayout({ children, userRole }: Omit<LayoutProps, 'className'>) {
  return (
    <Layout userRole={userRole} className="bg-background">
      <div className="space-y-6">
        {children}
      </div>
    </Layout>
  )
}

export function ProjectLayout({ children, userRole }: Omit<LayoutProps, 'className'>) {
  return (
    <Layout userRole={userRole} className="bg-muted/50">
      <div className="space-y-4">
        {children}
      </div>
    </Layout>
  )
}

export function AdminLayout({ children }: Omit<LayoutProps, 'userRole' | 'className'>) {
  return (
    <Layout userRole="Admin" className="bg-background">
      <div className="space-y-6">
        {children}
      </div>
    </Layout>
  )
}
