"use client"

import { Bell, Search, Settings, User } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/AppContext"

export function FreelancerHeaderContent() {
  const { user } = useAppContext()

  return (
    <div className="flex items-center gap-2">
      {/* Search - Enhanced responsive design */}
      <div className="relative hidden lg:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, tasks..."
          className="w-64 pl-8 bg-background/50 backdrop-blur-sm border-sidebar-border focus:bg-background transition-colors"
        />
      </div>

      {/* Mobile Search Button */}
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Quick Actions - Enhanced spacing and hover effects */}
      <div className="flex items-center gap-1">
        {/* Notifications - Enhanced with better mobile support */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs animate-pulse"
              >
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/freelancer/notifications" className="flex flex-col items-start p-3 hover:bg-sidebar-accent transition-colors">
                <div className="font-medium">New project assignment</div>
                <div className="text-sm text-muted-foreground">
                  You've been assigned to "Office Redesign" project
                </div>
                <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/freelancer/notifications" className="flex flex-col items-start p-3 hover:bg-sidebar-accent transition-colors">
                <div className="font-medium">Timer reminder</div>
                <div className="text-sm text-muted-foreground">
                  Don't forget to log your time for today
                </div>
                <div className="text-xs text-muted-foreground mt-1">4 hours ago</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/freelancer/notifications" className="w-full text-center font-medium">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings - Enhanced hover effects */}
        <Button variant="ghost" size="icon" asChild className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <Link to="/freelancer/settings">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>

        {/* Profile - Enhanced hover effects */}
        <Button variant="ghost" size="icon" asChild className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <Link to="/freelancer/profile">
            <User className="h-4 w-4" />
            <span className="sr-only">Profile</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}