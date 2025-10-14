import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectStatus as ProjectStatusEnum } from '@/types'

// Import our enhanced components
import { ProjectCreationDialog } from './ProjectCreationDialog'
import { ProjectDetailsView } from './ProjectDetailsView'
import { TaskManagementBoard } from './TaskManagementBoard'
import { TimerIntegrationPanel } from './TimerIntegrationPanel'
import { ProjectCard } from './ProjectCard'

// Types for the workflow
export interface WorkflowProject {
  id: string
  title: string
  description: string
  status: ProjectStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  clientName: string
  teamMembers: string[]
  dueDate: Date
  progress: number
  budget: number
  timeSpent: number
  timeAllocated: number
  tasks: WorkflowTask[]
  recentActivity: ActivityItem[]
}

export interface WorkflowTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  dueDate?: Date
  estimatedHours: number
  actualHours: number
  projectId: string
  dependencies?: string[]
  tags?: string[]
}

export interface ActivityItem {
  id: string
  type: 'task_created' | 'task_completed' | 'timer_started' | 'timer_stopped' | 'comment_added' | 'file_uploaded'
  description: string
  user: string
  timestamp: Date
  relatedId?: string
}

interface ProjectWorkflowProps {
  className?: string
  onProjectSelect?: (projectId: string) => void
  defaultView?: 'overview' | 'kanban' | 'timeline' | 'reports'
}

/**
 * ProjectWorkflow - Complete project management workflow component
 * Integrates projects, jobs, tasks, and timing in a unified interface
 */
export const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({
  className,
  onProjectSelect,
  defaultView = 'overview'
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'timeline' | 'kanban' | 'reports'>(defaultView as 'overview' | 'timeline' | 'kanban' | 'reports')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [projects, setProjects] = useState<WorkflowProject[]>([])
  const [activeTimers] = useState<Record<string, any>>({})
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for demonstration - replace with real data hooks
  useEffect(() => {
    // Simulate loading projects from context/API
    const mockProjects: WorkflowProject[] = [
      {
        id: '1',
        title: 'Modern Office Building Design',
        description: 'Complete architectural design for a 15-story office complex in downtown area',
        status: ProjectStatus.IN_PROGRESS,
        priority: 'high',
        clientName: 'Metro Development Corp',
        teamMembers: ['John Doe', 'Jane Smith', 'Mike Wilson'],
        dueDate: new Date('2025-12-31'),
        progress: 65,
        budget: 250000,
        timeSpent: 340,
        timeAllocated: 520,
        tasks: [
          {
            id: 't1',
            title: 'Site Analysis',
            status: 'completed',
            priority: 'high',
            assignedTo: 'John Doe',
            estimatedHours: 40,
            actualHours: 38,
            projectId: '1'
          },
          {
            id: 't2',
            title: 'Conceptual Design',
            status: 'in-progress',
            priority: 'high',
            assignedTo: 'Jane Smith',
            estimatedHours: 80,
            actualHours: 45,
            projectId: '1'
          },
          {
            id: 't3',
            title: 'Structural Planning',
            status: 'todo',
            priority: 'medium',
            assignedTo: 'Mike Wilson',
            estimatedHours: 60,
            actualHours: 0,
            projectId: '1'
          }
        ],
        recentActivity: [
          {
            id: 'a1',
            type: 'timer_started',
            description: 'Started timer for Conceptual Design',
            user: 'Jane Smith',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: '2',
        title: 'Residential Complex Layout',
        description: 'Master plan for 200-unit residential development',
        status: ProjectStatus.PENDING_APPROVAL,
        priority: 'medium',
        clientName: 'Sunrise Properties',
        teamMembers: ['Sarah Connor', 'Tom Anderson'],
        dueDate: new Date('2026-03-15'),
        progress: 15,
        budget: 180000,
        timeSpent: 45,
        timeAllocated: 400,
        tasks: [],
        recentActivity: []
      }
    ]
    setProjects(mockProjects)
  }, [])

  // Filter projects based on status and search
  const filteredProjects = projects.filter(project => {
    const statusMatch = filterStatus === 'all' || project.status === filterStatus
    const searchMatch = searchQuery === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    return statusMatch && searchMatch
  })

  // Calculate dashboard stats
  const dashboardStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === ProjectStatusEnum.ACTIVE).length,
    completedProjects: projects.filter(p => p.status === ProjectStatusEnum.COMPLETED).length,
    totalHoursSpent: projects.reduce((sum, p) => sum + p.timeSpent, 0),
    averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length || 0
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    onProjectSelect?.(projectId)
  }

  // Convert WorkflowProject to Project interface for ProjectCard
  const convertToProject = (workflowProject: WorkflowProject) => ({
    id: workflowProject.id,
    title: workflowProject.title,
    description: workflowProject.description,
    clientId: 'client-' + workflowProject.id,
    clientName: workflowProject.clientName,
    leadArchitectId: 'architect-' + workflowProject.id,
    leadArchitectName: workflowProject.teamMembers[0] || 'Unassigned',
    assignedTeamIds: workflowProject.teamMembers.map((_, index) => `member-${index}`),
    status: workflowProject.status,
    budget: workflowProject.budget,
    deadline: workflowProject.dueDate,
    priority: workflowProject.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    tags: [],
    purchasedHours: workflowProject.timeAllocated,
    remainingHours: workflowProject.timeAllocated - workflowProject.timeSpent,
    totalTimeSpentMinutes: workflowProject.timeSpent * 60,
    totalAllocatedHours: workflowProject.timeAllocated,
    completionPercentage: workflowProject.progress,
    activeJobCards: workflowProject.tasks.filter(t => t.status === 'in-progress').length,
    totalJobCards: workflowProject.tasks.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return (
    <div className={cn('project-workflow w-full space-y-6', className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Workflow</h1>
          <p className="text-muted-foreground">
            Manage projects, tasks, and timing in one integrated workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardStats.activeProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.completedProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalHoursSpent}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(dashboardStats.averageProgress)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'timeline' | 'kanban' | 'reports')} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kanban">Task Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Projects Grid */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded px-3 py-1 text-sm w-64"
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={convertToProject(project)}
                actions={{
                  onView: () => handleProjectSelect(project.id),
                  onEdit: () => console.log('Edit project:', project.id),
                }}
                showTimerControls={true}
                isTimerActive={activeTimers[project.id]?.isActive || false}
                isTimerPaused={activeTimers[project.id]?.isPaused || false}
              />
            ))}
          </div>
        </TabsContent>

        {/* Task Board Tab */}
        <TabsContent value="kanban" className="space-y-4">
          <TaskManagementBoard
            projects={filteredProjects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                View project schedules and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timeline component would go here */}
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Timeline view coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking Report</CardTitle>
                <CardDescription>
                  Hours logged across all projects this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{project.title}</p>
                        <Progress value={(project.timeSpent / project.timeAllocated) * 100} className="w-32" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.timeSpent}h / {project.timeAllocated}h</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((project.timeSpent / project.timeAllocated) * 100)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>
                  Current status distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['planning', 'active', 'on-hold', 'completed'].map((status) => {
                    const count = projects.filter(p => p.status === status).length
                    const percentage = (count / projects.length) * 100
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {status.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm">{count} projects</span>
                        </div>
                        <Progress value={percentage} className="w-20" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Timer Integration Panel */}
      <TimerIntegrationPanel
        activeTimers={activeTimers}
        projects={projects}
        className="fixed bottom-4 right-4 z-50"
      />

      {/* Project Creation Dialog */}
      <ProjectCreationDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onSuccess={(projectData) => {
          console.log('Project created:', projectData)
          setIsCreating(false)
          // Refresh projects list
        }}
      />

      {/* Project Details View */}
      {selectedProject && (
        <ProjectDetailsView
          projectId={selectedProject}
          project={projects.find(p => p.id === selectedProject)!}
          onClose={() => setSelectedProject(null)}
          open={!!selectedProject}
        />
      )}
    </div>
  )
}

export default ProjectWorkflow
