import * as React from "react"
import { 
  FolderOpen, 
  MessageSquare, 
  FileText, 
  Settings, 
  HelpCircle,
  User,
  Eye,
  Calendar,
  Download,
  Bell
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ClientSearchForm } from "./ClientSearchForm"

// Client-specific navigation data
const clientNavData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/client/dashboard",
      icon: Eye,
      items: [
        {
          title: "Project Overview",
          url: "/client/dashboard",
          isActive: true,
        },
        {
          title: "Recent Activity",
          url: "/client/dashboard/activity",
        },
      ],
    },
    {
      title: "My Projects",
      url: "/client/projects",
      icon: FolderOpen,
      badge: "2",
      items: [
        {
          title: "Active Projects",
          url: "/client/projects/active",
          badge: "2",
        },
        {
          title: "Completed Projects",
          url: "/client/projects/completed",
        },
        {
          title: "Project Timeline",
          url: "/client/projects/timeline",
        },
      ],
    },
    {
      title: "Communication",
      url: "/client/messages",
      icon: MessageSquare,
      badge: "3",
      items: [
        {
          title: "Project Messages",
          url: "/client/messages",
          badge: "3",
        },
        {
          title: "Team Contacts",
          url: "/client/messages/contacts",
        },
      ],
    },
    {
      title: "Files & Documents",
      url: "/client/files",
      icon: FileText,
      items: [
        {
          title: "Project Files",
          url: "/client/files",
        },
        {
          title: "Downloads",
          url: "/client/files/downloads",
          icon: Download,
        },
        {
          title: "Shared Documents",
          url: "/client/files/shared",
        },
      ],
    },
    {
      title: "Schedule",
      url: "/client/calendar",
      icon: Calendar,
      items: [
        {
          title: "Project Milestones",
          url: "/client/calendar/milestones",
        },
        {
          title: "Meetings",
          url: "/client/calendar/meetings",
        },
      ],
    },
  ],
}

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userName?: string
  userEmail?: string
}

export function ClientSidebar({ userName = "Client User", userEmail = "client@example.com", ...props }: ClientSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/client/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <User className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Architex Axis</span>
                  <span className="text-xs">Client Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ClientSearchForm />
      </SidebarHeader>
      
      <SidebarContent>
        {/* User Info Section */}
        <SidebarGroup>
          <div className="px-2 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                Client
              </Badge>
            </div>
          </div>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {clientNavData.navMain.map((item, index) => {
              const Icon = item.icon
              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={index === 0} // Dashboard open by default
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.items?.length ? (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subItem.isActive}
                              >
                                <a href={subItem.url} className="flex items-center justify-between">
                                  <span>{subItem.title}</span>
                                  {subItem.badge && (
                                    <Badge variant="secondary" className="text-xs">
                                      {subItem.badge}
                                    </Badge>
                                  )}
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Notifications Section */}
        <SidebarGroup>
          <div className="px-2">
            <SidebarMenuButton asChild>
              <a href="/client/notifications" className="flex items-center gap-3">
                <Bell className="size-4" />
                <span>Notifications</span>
                <Badge variant="secondary" className="ml-auto bg-red-100 text-red-800 text-xs">
                  5
                </Badge>
              </a>
            </SidebarMenuButton>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Navigation */}
      <div className="mt-auto p-2 space-y-1">
        <SidebarMenuButton asChild>
          <a href="/client/settings" className="flex items-center gap-3">
            <Settings className="size-4" />
            <span>Settings</span>
          </a>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <a href="/client/support" className="flex items-center gap-3">
            <HelpCircle className="size-4" />
            <span>Help & Support</span>
          </a>
        </SidebarMenuButton>
      </div>

      <SidebarRail />
    </Sidebar>
  )
}