import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  MessageCircle, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Users,
  FileText,
  BarChart3
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'In Progress' | 'Review' | 'Completed' | 'On Hold' | 'Planning'
  progress: number
  leadArchitect: string
  dueDate: string
  budget: number
  startDate: string
  teamSize: number
  milestones: Milestone[]
  timeline: TimelineEvent[]
}

interface Milestone {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'completed' | 'in-progress' | 'pending'
  progress: number
}

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'update' | 'meeting' | 'delivery'
  status: 'completed' | 'upcoming' | 'overdue'
}

interface ClientProjectOverviewProps {
  projects?: Project[]
  onViewProject?: (projectId: string) => void
  onMessageTeam?: (projectId: string) => void
}

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'Office Redesign',
    description: 'Modern workspace transformation with open floor plan and collaborative spaces',
    status: 'In Progress',
    progress: 75,
    leadArchitect: 'Sarah Johnson',
    dueDate: '2024-12-15',
    startDate: '2024-09-01',
    budget: 45000,
    teamSize: 4,
    milestones: [
      {
        id: '1',
        title: 'Initial Design Phase',
        description: 'Concept development and space planning',
        dueDate: '2024-10-01',
        status: 'completed',
        progress: 100
      },
      {
        id: '2',
        title: 'Design Development',
        description: 'Detailed drawings and specifications',
        dueDate: '2024-11-15',
        status: 'in-progress',
        progress: 80
      },
      {
        id: '3',
        title: 'Construction Documentation',
        description: 'Final drawings and permit submission',
        dueDate: '2024-12-15',
        status: 'pending',
        progress: 0
      }
    ],
    timeline: [
      {
        id: '1',
        title: 'Project Kickoff',
        description: 'Initial client meeting and requirements gathering',
        date: '2024-09-01',
        type: 'milestone',
        status: 'completed'
      },
      {
        id: '2',
        title: 'Design Review Meeting',
        description: 'Client review of initial concepts',
        date: '2024-10-15',
        type: 'meeting',
        status: 'completed'
      },
      {
        id: '3',
        title: 'Updated Floor Plans',
        description: 'Revised plans incorporating client feedback',
        date: '2024-11-20',
        type: 'delivery',
        status: 'upcoming'
      }
    ]
  },
  {
    id: '2',
    name: 'Residential Complex',
    description: 'Luxury apartment development with sustainable design features',
    status: 'Review',
    progress: 60,
    leadArchitect: 'Michael Chen',
    dueDate: '2025-01-20',
    startDate: '2024-08-15',
    budget: 120000,
    teamSize: 6,
    milestones: [
      {
        id: '1',
        title: 'Site Analysis',
        description: 'Environmental and zoning analysis',
        dueDate: '2024-09-15',
        status: 'completed',
        progress: 100
      },
      {
        id: '2',
        title: 'Schematic Design',
        description: 'Building massing and layout concepts',
        dueDate: '2024-11-01',
        status: 'in-progress',
        progress: 70
      },
      {
        id: '3',
        title: 'Design Development',
        description: 'Detailed design and engineering coordination',
        dueDate: '2025-01-20',
        status: 'pending',
        progress: 0
      }
    ],
    timeline: [
      {
        id: '1',
        title: 'Site Survey Complete',
        description: 'Topographical and boundary survey completed',
        date: '2024-08-30',
        type: 'milestone',
        status: 'completed'
      },
      {
        id: '2',
        title: 'Design Presentation',
        description: 'Present initial design concepts to client',
        date: '2024-11-25',
        type: 'meeting',
        status: 'upcoming'
      }
    ]
  }
]

export function ClientProjectOverview({ 
  projects = defaultProjects,
  onViewProject,
  onMessageTeam
}: ClientProjectOverviewProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-green-100 text-green-800'
      case 'Review':
        return 'bg-yellow-100 text-yellow-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      case 'On Hold':
        return 'bg-red-100 text-red-800'
      case 'Planning':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'In Progress':
        return <Clock className="h-3 w-3" />
      case 'Review':
        return <AlertCircle className="h-3 w-3" />
      case 'Completed':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getMilestoneStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimelineStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'In Progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.teamSize, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total team size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1">{project.status}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Lead Architect</p>
                  <p className="font-medium">{project.leadArchitect}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Team Size</p>
                  <p className="font-medium">{project.teamSize} members</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(project.dueDate)}</p>
                  {calculateDaysRemaining(project.dueDate) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {calculateDaysRemaining(project.dueDate)} days remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSelectedProject(project)
                    onViewProject?.(project.id)
                  }}
                  className="flex-1 sm:flex-none"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onMessageTeam?.(project.id)}
                  className="flex-1 sm:flex-none"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Message Team
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Detail Modal/Expanded View */}
      {selectedProject && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedProject.name}</CardTitle>
                <CardDescription>{selectedProject.description}</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="milestones" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="milestones" className="space-y-4">
                <h3 className="text-lg font-semibold">Project Milestones</h3>
                <div className="space-y-3">
                  {selectedProject.milestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                        <Badge className={getMilestoneStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                        <span>Due: {formatDate(milestone.dueDate)}</span>
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <h3 className="text-lg font-semibold">Project Timeline</h3>
                <div className="space-y-3">
                  {selectedProject.timeline.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge className={getTimelineStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.date)}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'You don\'t have any projects yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}