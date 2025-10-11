"use client"

import {
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/AppContext"

interface Project {
  name: string
  url: string
  icon: LucideIcon
  status: 'active' | 'review' | 'planning' | 'completed'
  progress: number
  hoursLogged: number
  hoursAllocated: number
}

export function FreelancerNavProjects({
  projects,
}: {
  projects: Project[]
}) {
  const { isMobile } = useSidebar()
  const { activeTimer, startGlobalTimer } = useAppContext()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />
      case 'review':
        return <AlertCircle className="h-3 w-3" />
      case 'planning':
        return <Clock className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const handleStartTimer = async (project: Project) => {
    try {
      // Extract project ID from URL or use name as fallback
      const projectId = project.url.split('/').pop() || project.name.toLowerCase().replace(/\s+/g, '-')
      const jobCardId = `${projectId}-main-task` // This would be dynamic in real implementation
      
      await startGlobalTimer(jobCardId, project.name, projectId, project.hoursAllocated)
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>My Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.name}>
            <SidebarMenuButton asChild className="h-auto p-2 hover:bg-sidebar-accent transition-colors">
              <Link to={project.url} className="flex flex-col items-start space-y-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <project.icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-sm truncate">{project.name}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs shrink-0 ${getStatusColor(project.status)}`}
                  >
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize hidden sm:inline">{project.status}</span>
                  </Badge>
                </div>
                
                {/* Progress and Hours - Enhanced responsive design */}
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate">{project.hoursLogged}h / {project.hoursAllocated}h</span>
                    <span className="shrink-0">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1 bg-sidebar-accent/20" />
                </div>
              </Link>
            </SidebarMenuButton>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover className="hover:bg-sidebar-accent transition-colors">
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem 
                  onClick={() => handleStartTimer(project)}
                  className="hover:bg-sidebar-accent transition-colors"
                >
                  <Play className="text-muted-foreground" />
                  <span>Start Timer</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={project.url} className="hover:bg-sidebar-accent transition-colors">
                    <project.icon className="text-muted-foreground" />
                    <span>View Project</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`${project.url}/files`} className="hover:bg-sidebar-accent transition-colors">
                    <Clock className="text-muted-foreground" />
                    <span>Time Logs</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        
        {/* Quick Actions - Enhanced styling */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Link to="/freelancer/projects/available">
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>Browse Available Projects</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}