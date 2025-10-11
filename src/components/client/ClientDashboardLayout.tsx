import * as React from "react"
import { ClientSidebar } from "./ClientSidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface ClientDashboardLayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{
    title: string
    href?: string
    isActive?: boolean
  }>
  userName?: string
  userEmail?: string
}

export function ClientDashboardLayout({ 
  children, 
  breadcrumbs = [{ title: "Dashboard", isActive: true }],
  userName,
  userEmail
}: ClientDashboardLayoutProps) {
  return (
    <SidebarProvider>
      <ClientSidebar userName={userName} userEmail={userEmail} />
      <SidebarInset>
        {/* Header with breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.title}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                    {breadcrumb.isActive ? (
                      <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={breadcrumb.href || "#"}>
                        {breadcrumb.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}