import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  MessageCircle, 
  FileText, 
  Calendar, 
  Download, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'In Progress' | 'Review' | 'Completed' | 'On Hold'
  progress: number
  leadArchitect: string
  dueDate: string
  budget?: number
}

interface ProjectFile {
  id: string
  name: string
  project: string
  size: string
  type: 'document' | 'image' | 'archive' | 'other'
  uploadedAt: string
}

interface Message {
  id: string
  sender: string
  role: string
  content: string
  timestamp: string
  avatar: string
}

interface ClientDashboardWidgetsProps {
  projects?: Project[]
  recentFiles?: ProjectFile[]
  recentMessages?: Message[]
}

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'Office Redesign',
    description: 'Modern workspace transformation',
    status: 'In Progress',
    progress: 75,
    leadArchitect: 'Sarah Johnson',
    dueDate: 'Dec 15, 2024',
    budget: 45000
  },
  {
    id: '2',
    name: 'Residential Complex',
    description: 'Luxury apartment development',
    status: 'Review',
    progress: 60,
    leadArchitect: 'Michael Chen',
    dueDate: 'Jan 20, 2025',
    budget: 120000
  }
]

const defaultFiles: ProjectFile[] = [
  {
    id: '1',
    name: 'Floor Plans v3.2',
    project: 'Office Redesign',
    size: '2.4 MB',
    type: 'document',
    uploadedAt: '2 hours ago'
  },
  {
    id: '2',
    name: '3D Renderings',
    project: 'Residential Complex',
    size: '15.7 MB',
    type: 'image',
    uploadedAt: '1 day ago'
  },
  {
    id: '3',
    name: 'Material Specifications',
    project: 'Office Redesign',
    size: '1.8 MB',
    type: 'document',
    uploadedAt: '2 days ago'
  },
  {
    id: '4',
    name: 'Progress Report',
    project: 'Residential Complex',
    size: '892 KB',
    type: 'document',
    uploadedAt: '3 days ago'
  }
]

const defaultMessages: Message[] = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    role: 'Lead Architect',
    content: 'Updated floor plans are ready for your review. I\'ve incorporated all the feedback from our last meeting.',
    timestamp: '2 hours ago',
    avatar: 'SJ'
  },
  {
    id: '2',
    sender: 'Michael Chen',
    role: 'Lead Architect',
    content: 'The 3D renderings for the residential complex are complete. Would you like to schedule a presentation?',
    timestamp: '1 day ago',
    avatar: 'MC'
  },
  {
    id: '3',
    sender: 'Architex Admin',
    role: 'System',
    content: 'Your monthly project report is now available for download in the files section.',
    timestamp: '2 days ago',
    avatar: 'AA'
  }
]

export function ClientDashboardWidgets({ 
  projects = defaultProjects,
  recentFiles = defaultFiles,
  recentMessages = defaultMessages
}: ClientDashboardWidgetsProps) {
  const totalInvestment = projects.reduce((sum, project) => sum + (project.budget || 0), 0)
  const averageProgress = projects.reduce((sum, project) => sum + project.progress, 0) / projects.length
  const activeProjects = projects.filter(p => p.status === 'In Progress').length
  const reviewProjects = projects.filter(p => p.status === 'Review').length

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

  const getFileIcon = (type: ProjectFile['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-600'
      case 'image':
        return 'bg-green-100 text-green-600'
      case 'archive':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-orange-100 text-orange-600'
    }
  }

  const getAvatarColor = (avatar: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500'
    ]
    const index = avatar.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} in progress, {reviewProjects} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalInvestment.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Projects Card */}
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>
              Overview of your current projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{project.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1">{project.status}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span className="truncate">Lead: {project.leadArchitect}</span>
                  <span className="whitespace-nowrap">Due: {project.dueDate}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Message Team
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Files Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>
              Latest project deliverables and documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${getFileIcon(file.type)}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {file.project} • {file.size}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Communications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
          <CardDescription>
            Latest messages and updates from your project teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(message.avatar)}`}>
                  {message.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{message.sender}</p>
                    <Badge variant="outline" className="text-xs">
                      {message.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}