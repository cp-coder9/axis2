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
import { useProjects } from '@/contexts/ProjectsContext'

// Import our enhanced components
import { ProjectCreationDialog } from './ProjectCreationDialog'
import { ProjectDetailsView } from './ProjectDetailsView'
import { TaskManagementBoard } from './TaskManagementBoard'
import { TimerIntegrationPanel } from './TimerIntegrationPanel'
import { ProjectCard } from './ProjectCard'
import { GanttChart } from './GanttChart'
import ResourceCalendarView from './ResourceCalendarView'
import ProjectTimelineView from './ProjectTimelineView'

// Types for the workflow
export interface WorkflowProject {
  id: string
  title: string
  description: string
  status: ProjectStatusEnum
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
  const { state, loadProjects, loadProjectHierarchy, createDependency } = useProjects();
  const [activeView, setActiveView] = useState<'overview' | 'timeline' | 'kanban' | 'resources' | 'reports'>(defaultView as 'overview' | 'timeline' | 'kanban' | 'resources' | 'reports')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Use real projects from context
  const projects = state.projects;

  // Filter projects based on status and search
  const filteredProjects = projects.filter(project => {
    const statusMatch = filterStatus === 'all' || project.status === filterStatus
    const searchMatch = searchQuery === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName && project.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    return statusMatch && searchMatch
  })

  // Calculate dashboard stats
  const dashboardStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === ProjectStatusEnum.ACTIVE || p.status === ProjectStatusEnum.IN_PROGRESS).length,
    completedProjects: projects.filter(p => p.status === ProjectStatusEnum.COMPLETED).length,
    totalHoursSpent: projects.reduce((sum, p) => sum + (p.totalTimeSpentMinutes || 0) / 60, 0),
    averageProgress: projects.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / projects.length || 0
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    onProjectSelect?.(projectId)
    // Load project hierarchy when selected
    loadProjectHierarchy(projectId)
  }

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
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'overview' | 'timeline' | 'kanban' | 'resources' | 'reports')} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kanban">Task Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="summary">Project Summary</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
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
                project={project}
                actions={{
                  onView: () => handleProjectSelect(project.id),
                  onEdit: () => console.log('Edit project:', project.id),
                }}
                showTimerControls={true}
                isTimerActive={false} // TODO: Get from timer context
                isTimerPaused={false}
              />
            ))}
          </div>
        </TabsContent>

        {/* Task Board Tab */}
        <TabsContent value="kanban" className="space-y-4">
          <TaskManagementBoard
            projects={filteredProjects}
            tasks={state.tasks}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline & Scheduling</CardTitle>
              <CardDescription>
                View and manage project schedules, dependencies, and critical paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProject ? (
                <GanttChart
                  projectId={selectedProject}
                  tasks={state.tasks.filter(t => state.jobs.some(j => j.id === t.jobId && j.projectId === selectedProject))}
                  jobs={state.jobs.filter(j => j.projectId === selectedProject)}
                  dependencies={state.dependencies[selectedProject] || []}
                  onTaskUpdate={(taskId, updates) => {
                    // TODO: Implement task update through context
                    console.log('Update task:', taskId, updates);
                  }}
                  onTaskSelect={(task) => {
                    console.log('Selected task:', task);
                  }}
                  onDependencyCreate={async (dependency) => {
                    try {
                      await createDependency(dependency);
                    } catch (error) {
                      console.error('Failed to create dependency:', error);
                    }
                  }}
                  dependencyCreationMode={false}
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Select a project to view its timeline
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <ResourceCalendarView
            projectId={selectedProject || ''}
            className="h-full"
          />
        </TabsContent>

        {/* Project Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {selectedProject ? (
            <ProjectTimelineView
              project={projects.find(p => p.id === selectedProject)!}
              jobs={state.jobs.filter(j => j.projectId === selectedProject)}
              tasks={state.tasks.filter(t => state.jobs.some(j => j.id === t.jobId && j.projectId === selectedProject))}
            />
          ) : (
            <Card>
              <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
                Select a project to view its timeline summary
              </CardContent>
            </Card>
          )}
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
