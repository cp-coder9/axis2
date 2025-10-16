import { Calendar, Home, Settings, Clock, FolderOpen, CheckSquare, FileText, MessageSquare, Users, BarChart3, CreditCard, Shield, HelpCircle, Bell, Timer } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Badge
} from "@/lib/shadcn"
import { cn, getRoleClasses } from "@/lib/shadcn-utils"

interface AppSidebarProps {
  userRole?: 'Admin' | 'Freelancer' | 'Client'
}

// Menu items organized by user role
const menuData = {
  main: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      badge: "12",
      roles: ['Admin', 'Freelancer', 'Client'],
      items: [
        {
          title: "Active Projects",
          url: "/projects/active",
          badge: "8",
          roles: ['Admin', 'Freelancer', 'Client'],
        },
        {
          title: "Archived Projects",
          url: "/projects/archived",
          roles: ['Admin', 'Freelancer'],
        },
      ],
    },
  ],
  work: [
    {
      title: "Tasks",
      url: "/tasks",
      icon: CheckSquare,
      badge: "8",
      roles: ['Admin', 'Freelancer'],
    },
    {
      title: "Time Tracking",
      url: "/timer",
      icon: Clock,
      roles: ['Admin', 'Freelancer'],
    },
    {
      title: "Timer",
      url: "/timer/active",
      icon: Timer,
      roles: ['Admin', 'Freelancer'],
    },
    {
      title: "Time Purchase",
      url: "/time-purchase",
      icon: CreditCard,
      roles: ['Client'],
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
  ],
  content: [
    {
      title: "Files",
      url: "/files",
      icon: FileText,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
      badge: "3",
      roles: ['Admin', 'Freelancer', 'Client'],
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      badge: "5",
      roles: ['Admin', 'Freelancer', 'Client'],
    },
  ],
  admin: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      roles: ['Admin'],
    },
    {
      title: "Time Planning",
      url: "/time-planning",
      icon: Clock,
      roles: ['Admin'],
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
      roles: ['Admin'],
    },
    {
      title: "Billing",
      url: "/billing",
      icon: CreditCard,
      roles: ['Admin'],
    },
    {
      title: "Security",
      url: "/security",
      icon: Shield,
      roles: ['Admin'],
    },
  ],
  settings: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
    {
      title: "Help & Support",
      url: "/support",
      icon: HelpCircle,
      roles: ['Admin', 'Freelancer', 'Client'],
    },
  ],
}

export function AppSidebar({ userRole = 'Admin' }: AppSidebarProps) {
  // Get role-based URL prefix
  const getRolePrefix = () => {
    switch (userRole) {
      case 'Admin':
        return '/admin'
      case 'Freelancer':
        return '/freelancer'
      case 'Client':
        return '/client'
      default:
        return ''
    }
  }

  const rolePrefix = getRolePrefix()

  // Filter menu items based on user role
  const filterByRole = (items: any[]) =>
    items.filter(item => !item.roles || item.roles.includes(userRole))

  // Add role prefix to URL
  const getRoleUrl = (url: string) => {
    if (url === '/') return url
    return `${rolePrefix}${url}`
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center space-x-3 px-2">
          <div className="h-8 w-8 bg-architex-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Architex Axis</h1>
            <p className="text-xs text-muted-foreground">Project Management</p>
          </div>
        </div>

        {/* User role indicator */}
        <div className="mt-3">
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
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(menuData.main).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={getRoleUrl(item.url)} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {item.items && (
                    <SidebarMenuSub>
                      {filterByRole(item.items).map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={getRoleUrl(subItem.url)} className="flex items-center">
                              <span>{subItem.title}</span>
                              {subItem.badge && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {subItem.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Work Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Work</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(menuData.work).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={getRoleUrl(item.url)} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterByRole(menuData.content).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={getRoleUrl(item.url)} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only visible to Admin users */}
        {userRole === 'Admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterByRole(menuData.admin).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={getRoleUrl(item.url)} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {filterByRole(menuData.settings).map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={getRoleUrl(item.url)} className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
