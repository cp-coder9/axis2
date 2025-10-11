import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  Settings,
  Edit,
  Plus,
  Target,
  Activity,
  Building,
  Mail,
  MoreHorizontal,
  Download,
  Upload,
  Share,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Search,
  Folder,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Calendar as GanttIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowProject } from './ProjectWorkflow'
import { TaskManagementBoard } from './TaskManagementBoard'
import { AdminProjectEditor, Project, User } from './AdminProjectEditor'
import { ProjectStatus, UserRole } from '@/types'
import { ProjectSettingsDialog, ProjectSettings } from './ProjectSettingsDialog'

interface ProjectDetailsViewProps {
  project: WorkflowProject
  projectId: string
  open: boolean
  onClose: () => void
  userRole?: 'admin' | 'freelancer' | 'client'
  onUpdateProject?: (projectId: string, updates: Partial<WorkflowProject>) => void
}



/**
 * ProjectDetailsView - Comprehensive project detail view with integrated workflow
 * Shows project info, tasks, timeline, team, and timer integration
 */
export const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({
  project,
  projectId: _projectId,
  open,
  onClose,
  userRole: _userRole = 'freelancer',
  onUpdateProject
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Modal states for edit and settings
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Handle project editing
  const handleEditProject = () => {
    console.log('Edit button clicked! Opening edit modal...')
    console.log('Current isEditModalOpen state:', isEditModalOpen)
    setIsEditModalOpen(true)
    console.log('Setting isEditModalOpen to true')
  }

  // Handle project settings
  const handleProjectSettings = () => {
    setIsSettingsModalOpen(true)
  }

  // Handle project updates
  const handleProjectUpdate = async (projectId: string, updates: Partial<Project>) => {
    if (onUpdateProject) {
      // Convert ProjectStatus enum back to workflow string format
      const statusMap: Record<ProjectStatus, string> = {
        [ProjectStatus.DRAFT]: 'pending',
        [ProjectStatus.PLANNING]: 'planning',
        [ProjectStatus.ACTIVE]: 'active',
        [ProjectStatus.IN_PROGRESS]: 'active',
        [ProjectStatus.ON_HOLD]: 'on-hold',
        [ProjectStatus.COMPLETED]: 'completed',
        [ProjectStatus.CANCELLED]: 'cancelled',
      };

      // Convert updates back to WorkflowProject format if needed
      const workflowUpdates: Partial<WorkflowProject> = {
        title: updates.title,
        description: updates.description,
        budget: updates.budget,
        dueDate: updates.deadline,
        // Convert status back to workflow format
        status: updates.status ? statusMap[updates.status] : undefined,
        // Convert priority back to lowercase
        priority: updates.priority?.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
      }
      await onUpdateProject(projectId, workflowUpdates)
    }
    setIsEditModalOpen(false)
  }  // Convert WorkflowProject to AdminProjectEditor's Project type
  const convertToAdminProject = (workflowProject: WorkflowProject): Project => {
    const statusMap: Record<string, ProjectStatus> = {
      'planning': ProjectStatus.PLANNING,
      'active': ProjectStatus.ACTIVE,
      'on-hold': ProjectStatus.ON_HOLD,
      'completed': ProjectStatus.COMPLETED,
      'cancelled': ProjectStatus.CANCELLED,
      'pending': ProjectStatus.DRAFT,
    };

    return {
      id: workflowProject.id,
      title: workflowProject.title,
      description: workflowProject.description,
      clientId: 'mock-client-id', // You might need to get this from project data
      leadArchitectId: 'mock-lead-id', // You might need to get this from project data
      assignedTeamIds: [], // You might need to map team members to IDs
      status: statusMap[workflowProject.status] || ProjectStatus.DRAFT,
      budget: workflowProject.budget,
      deadline: workflowProject.dueDate,
      priority: workflowProject.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      tags: [],
      requirements: workflowProject.description,
      deliverables: [],
      jobCards: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }  // Convert team members to User objects
  const convertToUsers = (): User[] => {
    return [
      {
        id: 'mock-user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.FREELANCER
      }
    ]
  }

  // Convert client info to User objects
  const convertToClients = (): User[] => {
    return [
      {
        id: 'mock-client-1',
        name: project.clientName,
        email: 'client@example.com',
        role: UserRole.CLIENT
      }
    ]
  }

  // Convert user role
  const convertUserRole = (role?: string): UserRole => {
    switch (role) {
      case 'admin': return UserRole.ADMIN
      case 'freelancer': return UserRole.FREELANCER
      case 'client': return UserRole.CLIENT
      default: return UserRole.FREELANCER
    }
  }

  // Handle settings save
  const handleSettingsSave = async (settings: ProjectSettings) => {
    // In a real implementation, this would save to the backend
    console.log('Saving project settings:', settings)
    setIsSettingsModalOpen(false)
  }

  // Calculate project statistics
  const stats = useMemo(() => ({
    totalTasks: project.tasks.length,
    completedTasks: project.tasks.filter(t => t.status === 'completed').length,
    totalHours: project.tasks.reduce((sum, task) => sum + task.actualHours, 0),
    remainingHours: project.timeAllocated - project.timeSpent,
    budgetUsed: (project.timeSpent / project.timeAllocated) * project.budget || 0,
    overdueTasks: project.tasks.filter(t => t.dueDate && new Date() > t.dueDate && t.status !== 'completed').length,
    todayTasks: project.tasks.filter(t => {
      if (!t.dueDate) return false
      const today = new Date()
      const taskDate = new Date(t.dueDate)
      return today.toDateString() === taskDate.toDateString()
    }).length
  }), [project])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  // Filtered tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return project.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [project.tasks, searchQuery, filterStatus, filterPriority])

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
                <DialogDescription>
                  View and manage project details, tasks, timeline, and team collaboration
                </DialogDescription>
                <div className="flex items-center gap-3">
                  <Badge className={cn('capitalize', getStatusColor(project.status))}>
                    {project.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={cn('capitalize', getPriorityColor(project.priority))}>
                    {project.priority} priority
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Due: {project.dueDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEditProject}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleProjectSettings}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.progress}%</div>
                    <Progress value={project.progress} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completedTasks} of {stats.totalTasks} tasks complete
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatHours(project.timeSpent)}</div>
                    <p className="text-xs text-muted-foreground">
                      of {formatHours(project.timeAllocated)} allocated
                    </p>
                    <Progress
                      value={(project.timeSpent / project.timeAllocated) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.budgetUsed)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(project.budget)} budget
                    </p>
                    <Progress
                      value={(stats.budgetUsed / project.budget) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{project.teamMembers.length}</div>
                    <p className="text-xs text-muted-foreground">members assigned</p>
                    <div className="flex -space-x-2 mt-2">
                      {project.teamMembers.slice(0, 3).map((member, index) => (
                        <Avatar key={index} className="w-6 h-6 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {member.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.teamMembers.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{project.teamMembers.length - 3}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('tasks')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Tasks Due Today</div>
                        <div className="text-lg font-bold">{stats.todayTasks}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('tasks')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Overdue Tasks</div>
                        <div className="text-lg font-bold">{stats.overdueTasks}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('team')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Team Performance</div>
                        <div className="text-lg font-bold">85%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('files')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Project Files</div>
                        <div className="text-lg font-bold">24</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">Client:</span>
                        <span>{project.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Due Date:</span>
                        <span>{project.dueDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">Budget:</span>
                        <span>{formatCurrency(project.budget)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">{activity.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{activity.user}</span>
                              <span>•</span>
                              <span>{activity.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {project.recentActivity.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              {/* Task Management Header */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => setShowTaskForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>

              {/* Task Kanban Board */}
              <TaskManagementBoard
                projects={[project]}
                selectedProject={project.id}
                onProjectSelect={() => { }}
              />

              {/* Task Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{filteredTasks.length}</div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {filteredTasks.filter(t => t.status === 'in-progress').length}
                      </div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {filteredTasks.filter(t => t.status === 'completed').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(filteredTasks.reduce((sum, t) => sum + t.actualHours, 0))}h
                      </div>
                      <p className="text-sm text-muted-foreground">Hours Logged</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.teamMembers.map((member, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/placeholder-avatar-${index + 1}.jpg`} />
                          <AvatarFallback>
                            {member.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{member}</h4>
                          <p className="text-sm text-muted-foreground">
                            Team Member
                          </p>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56">
                            <div className="space-y-2">
                              <Button variant="ghost" size="sm" className="w-full justify-start">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Member
                              </Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start">
                                <Mail className="w-4 h-4 mr-2" />
                                Send Message
                              </Button>
                              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
                                <UserMinus className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tasks Assigned</span>
                          <span className="font-medium">
                            {project.tasks.filter(t => t.assignedTo === member).length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Hours Logged</span>
                          <span className="font-medium">
                            {project.tasks
                              .filter(t => t.assignedTo === member)
                              .reduce((sum, t) => sum + t.actualHours, 0)
                            }h
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate</span>
                          <span className="font-medium">
                            {(() => {
                              const memberTasks = project.tasks.filter(t => t.assignedTo === member)
                              const completedTasks = memberTasks.filter(t => t.status === 'completed')
                              return memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0
                            })()}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Team Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>
                    Overview of team productivity and task completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.teamMembers.map((member, index) => {
                      const memberTasks = project.tasks.filter(t => t.assignedTo === member)
                      const completedTasks = memberTasks.filter(t => t.status === 'completed')
                      const completionRate = memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0

                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{member}</p>
                            <Progress value={completionRate} className="w-32" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{completedTasks.length}/{memberTasks.length} tasks</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(completionRate)}% complete
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GanttIcon className="w-5 h-5" />
                    Project Timeline
                  </CardTitle>
                  <CardDescription>
                    Track milestones and deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Timeline Visualization */}
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>

                      {/* Project Milestones */}
                      <div className="space-y-6">
                        <div className="relative flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold relative z-10">
                            1
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">Project Kickoff</h4>
                            <p className="text-sm text-muted-foreground">Initial planning and team assignment</p>
                            <p className="text-xs text-muted-foreground">Completed on {new Date(project.dueDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        </div>

                        <div className="relative flex items-center gap-4">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold relative z-10">
                            2
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">Design Phase</h4>
                            <p className="text-sm text-muted-foreground">Create initial designs and mockups</p>
                            <p className="text-xs text-muted-foreground">In progress</p>
                          </div>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        </div>

                        <div className="relative flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold relative z-10">
                            3
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">Development Phase</h4>
                            <p className="text-sm text-muted-foreground">Implementation and coding</p>
                            <p className="text-xs text-muted-foreground">Starts in 2 weeks</p>
                          </div>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>

                        <div className="relative flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold relative z-10">
                            4
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">Final Delivery</h4>
                            <p className="text-sm text-muted-foreground">Project completion and handover</p>
                            <p className="text-xs text-muted-foreground">Due {project.dueDate.toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            <Target className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">25%</div>
                            <p className="text-sm text-muted-foreground">Timeline Progress</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">14</div>
                            <p className="text-sm text-muted-foreground">Days Remaining</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">2</div>
                            <p className="text-sm text-muted-foreground">Active Milestones</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Project Files</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Folder className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                  <Button size="sm" onClick={() => setUploadingFile(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>

              {/* File Categories */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-lg font-bold">12</div>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-lg font-bold">8</div>
                      <p className="text-sm text-muted-foreground">Drawings</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-lg font-bold">4</div>
                      <p className="text-sm text-muted-foreground">Images</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="text-lg font-bold">3</div>
                      <p className="text-sm text-muted-foreground">Other</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* File List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Sample file entries */}
                    {[
                      { name: 'Project_Proposal_v2.pdf', size: '2.4 MB', type: 'PDF', date: '2 hours ago', permission: 'private' },
                      { name: 'Floor_Plans_Draft.dwg', size: '15.8 MB', type: 'AutoCAD', date: '1 day ago', permission: 'team' },
                      { name: 'Client_Requirements.docx', size: '890 KB', type: 'Word', date: '3 days ago', permission: 'public' },
                      { name: 'Site_Photos.zip', size: '45.2 MB', type: 'Archive', date: '1 week ago', permission: 'private' },
                    ].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size} • {file.type} • {file.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {file.permission === 'private' ? (
                              <><Lock className="w-3 h-3 mr-1" />Private</>
                            ) : file.permission === 'team' ? (
                              <><Users className="w-3 h-3 mr-1" />Team</>
                            ) : (
                              <><Unlock className="w-3 h-3 mr-1" />Public</>
                            )}
                          </Badge>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                              <div className="space-y-1">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </Button>
                                <Separator />
                                <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Area */}
                  <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload project files</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <Button>Choose Files</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <AdminProjectEditor
        isOpen={isEditModalOpen}
        onClose={() => {
          console.log('AdminProjectEditor onClose called')
          setIsEditModalOpen(false)
        }}
        project={convertToAdminProject(project)}
        users={convertToUsers()}
        clients={convertToClients()}
        onUpdateProject={handleProjectUpdate}
        onUpdateJobCard={async () => { }}
        onAddJobCard={async () => { }}
        userRole={convertUserRole(_userRole)}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsDialog
        project={project}
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSettingsSave}
        userRole={_userRole}
      />

      {/* Task Creation Modal */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for this project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="taskTitle" className="text-sm font-medium">
                Task Title
              </label>
              <Input
                id="taskTitle"
                placeholder="Enter task title..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="taskDescription" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="taskDescription"
                placeholder="Describe the task..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="taskPriority" className="text-sm font-medium">
                  Priority
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="taskDueDate" className="text-sm font-medium">
                  Due Date
                </label>
                <Input
                  id="taskDueDate"
                  type="date"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="estimatedHours" className="text-sm font-medium">
                  Estimated Hours
                </label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignedTo" className="text-sm font-medium">
                  Assigned To
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {project.teamMembers.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTaskForm(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Implement task creation logic
              console.log('Creating task...')
              setShowTaskForm(false)
            }}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProjectDetailsView
