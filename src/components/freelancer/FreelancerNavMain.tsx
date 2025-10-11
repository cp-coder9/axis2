"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function FreelancerNavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Freelancer Tools</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isCurrentPath = location.pathname === item.url || 
                               location.pathname.startsWith(item.url + '/')
          
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isCurrentPath}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild={!item.items}
                    isActive={isCurrentPath}
                    className="transition-colors duration-200"
                  >
                    {item.items ? (
                      <div className="flex items-center w-full">
                        {item.icon && <item.icon className="shrink-0" />}
                        <span className="truncate">{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                      </div>
                    ) : (
                      <Link to={item.url} className="flex items-center w-full">
                        {item.icon && <item.icon className="shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.items && (
                  <CollapsibleContent className="transition-all duration-200 ease-in-out">
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubItemActive = location.pathname === subItem.url
                        
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton 
                              asChild
                              isActive={isSubItemActive}
                              className="transition-colors duration-200"
                            >
                              <Link to={subItem.url}>
                                <span className="truncate">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}