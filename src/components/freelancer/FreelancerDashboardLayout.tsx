"use client"

import React from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FreelancerSidebar } from "./FreelancerSidebar"
import { FreelancerHeaderContent } from "./FreelancerHeaderContent"
import { cn } from "@/lib/utils"

interface FreelancerDashboardLayoutProps {
  children: React.ReactNode
  className?: string
  breadcrumbs?: {
    label: string
    href?: string
  }[]
}

export function FreelancerDashboardLayout({ 
  children, 
  className,
  breadcrumbs = [
    { label: "Freelancer", href: "/freelancer" },
    { label: "Dashboard" }
  ]
}: FreelancerDashboardLayoutProps) {
  return (
    <SidebarProvider>
      <FreelancerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            
            {/* Breadcrumb Navigation - Enhanced for mobile */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {crumb.href ? (
                        <BreadcrumbLink 
                          href={crumb.href}
                          className="transition-colors hover:text-foreground"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          {/* Header Actions - Mobile Responsive */}
          <div className="ml-auto px-4">
            <FreelancerHeaderContent />
          </div>
        </header>
        
        {/* Main Content Area - Enhanced responsive design */}
        <div className={cn(
          "flex flex-1 flex-col gap-4 p-4 pt-0",
          "min-h-0", // Prevents flex item from growing beyond container
          "overflow-auto", // Allows scrolling when content overflows
          className
        )}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}