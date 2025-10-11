import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn, shadcnClasses, getRoleClasses } from "@/lib/shadcn-utils"
import { useState } from "react"
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Users, 
  Settings, 
  Timer,
  BarChart3,
  Calendar,
  CreditCard,
  ChevronRight,
  Home,
  Briefcase,
  Clock,
  Archive,
  Shield,
  HelpCircle,
  Bell
} from "lucide-react"

interface SidebarProps {
  className?: string
  userRole?: 'Admin' | 'Freelancer' | 'Client'
  collapsed?: boolean
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  roles?: ('Admin' | 'Freelancer' | 'Client')[]
  description?: string
  children?: NavItem[]
}

interface NavSection {
  title: string
  items: NavItem[]
  roles?: ('Admin' | 'Freelancer' | 'Client')[]
  collapsible?: boolean
}

const navigationSections: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        title: "Home",
        href: "/",
        icon: Home,
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Return to homepage"
      },
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Overview of your workspace"
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
        badge: "12",
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Manage your projects",
        children: [
          {
            title: "Active Projects",
            href: "/projects/active",
            icon: Briefcase,
            badge: "8",
            roles: ['Admin', 'Freelancer', 'Client']
          },
          {
            title: "Archived Projects",
            href: "/projects/archived", 
            icon: Archive,
            roles: ['Admin', 'Freelancer']
          }
        ]
      }
    ]
  },
  {
    title: "Work",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        badge: "8",
        roles: ['Admin', 'Freelancer'],
        description: "Your assigned tasks"
      },
      {
        title: "Time Tracking",
        href: "/timer",
        icon: Clock,
        roles: ['Admin', 'Freelancer'],
        description: "Track your working hours"
      },
      {
        title: "Timer",
        href: "/timer/active",
        icon: Timer,
        roles: ['Admin', 'Freelancer'],
        description: "Active timer controls"
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Schedule and deadlines"
      }
    ]
  },
  {
    title: "Content",
    items: [
      {
        title: "Files",
        href: "/files",
        icon: FileText,
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Project files and documents"
      },
      {
        title: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: "3",
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "Team communication"
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: "5",
        roles: ['Admin', 'Freelancer', 'Client'],
        description: "System notifications and alerts"
      }
    ]
  },
  {
    title: "Administration",
    roles: ['Admin'],
    collapsible: true,
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: ['Admin'],
        description: "Performance metrics"
      },
      {
        title: "User Management",
        href: "/users",
        icon: Users,
        roles: ['Admin'],
        description: "Manage team members"
      },
      {
        title: "Billing",
        href: "/billing",
        icon: CreditCard,
        roles: ['Admin'],
        description: "Payments and invoices"
      },
      {
        title: "Security",
        href: "/security",
        icon: Shield,
        roles: ['Admin'],
        description: "Security settings"
      }
    ]
  }
]

const bottomNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ['Admin', 'Freelancer', 'Client'],
    description: "Account preferences"
  },
  {
    title: "Help & Support",
    href: "/support",
    icon: HelpCircle,
    roles: ['Admin', 'Freelancer', 'Client'],
    description: "Get help and support"
  }
]

export function Sidebar({ className, userRole = 'Admin', collapsed = false }: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Administration: true // Admin section open by default
  })

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  // Filter sections and items based on user role
  const filteredSections = navigationSections
    .filter(section => !section.roles || section.roles.includes(userRole))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(userRole))
    }))
    .filter(section => section.items.length > 0)

  const filteredBottomItems = bottomNavItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Logo section */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-architex-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight">Architex Axis</h1>
              <p className="text-xs text-muted-foreground">Project Management</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* User role indicator */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className={cn(
            "rounded-lg p-3 border-l-4",
            getRoleClasses(userRole.toLowerCase() as 'admin' | 'freelancer' | 'client')
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Role</p>
                <p className="text-xs text-muted-foreground">Logged in as</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation sections */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-2">
          {filteredSections.map((section) => (
            <div key={section.title}>
              {section.collapsible ? (
                <Collapsible 
                  open={openSections[section.title]} 
                  onOpenChange={() => toggleSection(section.title)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between h-auto p-2 font-medium text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      {!collapsed && section.title}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        openSections[section.title] && "rotate-90"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.href} item={item} collapsed={collapsed} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  {!collapsed && (
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </h3>
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.href} item={item} collapsed={collapsed} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Bottom navigation */}
      <div className="p-3 space-y-1">
        {filteredBottomItems.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  )
}

function NavItem({ item, collapsed = false, level = 0 }: { 
  item: NavItem
  collapsed?: boolean
  level?: number 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-auto py-2 px-3",
              level > 0 && "ml-4 w-[calc(100%-1rem)]",
              shadcnClasses.nav.item
            )}
          >
            <div className="flex items-center flex-1">
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-90"
                    )} />
                  </div>
                </>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent className="space-y-1">
            {item.children?.map((child) => (
              <NavItem 
                key={child.href} 
                item={child} 
                collapsed={collapsed} 
                level={level + 1} 
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start h-auto py-2 px-3",
        level > 0 && "ml-4 w-[calc(100%-1rem)]",
        shadcnClasses.nav.item
      )}
      asChild
    >
      <a 
        href={item.href}
        className="flex items-center"
        title={collapsed ? item.title : item.description}
      >
        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </a>
    </Button>
  )
}
