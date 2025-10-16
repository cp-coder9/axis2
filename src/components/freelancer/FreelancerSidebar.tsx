"use client"

import * as React from "react"
import {
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  MessageSquare,
  Settings,
  User,
  Timer,
  TrendingUp,
  Calendar,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  GalleryVerticalEnd,
  AudioWaveform
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { FreelancerNavMain } from "./FreelancerNavMain"
import { FreelancerNavProjects } from "./FreelancerNavProjects"
import { FreelancerNavUser } from "./FreelancerNavUser"
import { FreelancerTimerWidget } from "./FreelancerTimerWidget"
import { FreelancerTeamSwitcher } from "./FreelancerTeamSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAppContext } from "@/contexts/AppContext"

// Freelancer-specific navigation data based on sidebar-07 structure
const freelancerNavData = {
  user: {
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: "/avatars/freelancer.jpg",
    role: "Freelancer",
    hourlyRate: 75,
    totalEarnings: 12450.50,
    hoursThisWeek: 28.5
  },
  teams: [
    {
      name: "Architex Axis",
      logo: GalleryVerticalEnd,
      plan: "Freelancer",
    },
    {
      name: "Personal Projects",
      logo: AudioWaveform,
      plan: "Individual",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/freelancer/dashboard",
      icon: Briefcase,
      isActive: true,
    },
    {
      title: "Timer & Tracking",
      url: "/freelancer/timer",
      icon: Timer,
      items: [
        {
          title: "Active Timer",
          url: "/freelancer/timer/active",
        },
        {
          title: "Time Logs",
          url: "/freelancer/timer/logs",
        },
        {
          title: "Manual Entry",
          url: "/freelancer/timer/manual",
        },
        {
          title: "Time Slots",
          url: "/freelancer/time-slots",
        },
        {
          title: "Utilization Report",
          url: "/freelancer/utilization",
        },
      ],
    },
    {
      title: "Projects",
      url: "/freelancer/projects",
      icon: Briefcase,
      items: [
        {
          title: "My Projects",
          url: "/freelancer/projects/assigned",
        },
        {
          title: "Available Projects",
          url: "/freelancer/projects/available",
        },
        {
          title: "Applications",
          url: "/freelancer/applications",
        },
      ],
    },
    {
      title: "Earnings",
      url: "/freelancer/earnings",
      icon: DollarSign,
      items: [
        {
          title: "Overview",
          url: "/freelancer/earnings/overview",
        },
        {
          title: "Reports",
          url: "/freelancer/earnings/reports",
        },
        {
          title: "Invoices",
          url: "/freelancer/earnings/invoices",
        },
      ],
    },
    {
      title: "Settings",
      url: "/freelancer/settings",
      icon: Settings,
      items: [
        {
          title: "Profile",
          url: "/freelancer/settings/profile",
        },
        {
          title: "Preferences",
          url: "/freelancer/settings/preferences",
        },
        {
          title: "Notifications",
          url: "/freelancer/settings/notifications",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Office Redesign",
      url: "/freelancer/projects/office-redesign",
      icon: Briefcase,
      status: "active",
      progress: 75,
      hoursLogged: 18.5,
      hoursAllocated: 25,
    },
    {
      name: "Residential Complex",
      url: "/freelancer/projects/residential-complex",
      icon: Briefcase,
      status: "review",
      progress: 90,
      hoursLogged: 32,
      hoursAllocated: 35,
    },
    {
      name: "Retail Store Design",
      url: "/freelancer/projects/retail-store",
      icon: Briefcase,
      status: "planning",
      progress: 25,
      hoursLogged: 8,
      hoursAllocated: 30,
    },
  ],
}

export function FreelancerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, activeTimer } = useAppContext()
  const location = useLocation()

  // Update user data from context if available
  const userData = user ? {
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl || "/avatars/freelancer.jpg",
    role: "Freelancer",
    hourlyRate: user.hourlyRate || 75,
    totalEarnings: 12450.50, // This would come from earnings calculation
    hoursThisWeek: 28.5 // This would come from time tracking
  } : freelancerNavData.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Team/Organization Switcher - Enhanced from sidebar-07 */}
        <FreelancerTeamSwitcher teams={freelancerNavData.teams} />

        {/* Freelancer Status Badge - Responsive */}
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg p-3 bg-green-50 border-l-4 border-green-500 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Freelancer Active
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ${userData.hourlyRate}/hour
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Compact Timer Widget in Header - Mobile Optimized */}
        <div className="group-data-[collapsible=icon]:hidden">
          <FreelancerTimerWidget compact />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <FreelancerNavMain items={freelancerNavData.navMain} />
        <FreelancerNavProjects projects={freelancerNavData.projects as any} />
      </SidebarContent>

      <SidebarFooter>
        <FreelancerNavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}