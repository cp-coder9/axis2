import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  User,
  Flag,
  MoreHorizontal,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowProject, WorkflowTask } from './ProjectWorkflow'
import { JobCard } from './JobCard'

interface TaskManagementBoardProps {
  projects: WorkflowProject[]
  selectedProject?: string | null
  onProjectSelect?: (projectId: string) => void
  className?: string
}

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

interface TaskColumn {
  id: TaskStatus
  title: string
  color: string
  count: number
}

/**
 * TaskManagementBoard - Kanban-style task management with timer integration
 * Displays tasks in columns by status with drag-and-drop and timer controls
 */
export const TaskManagementBoard: React.FC<TaskManagementBoardProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  // Get all tasks from selected project or all projects
  const allTasks = useMemo(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject)
      return project?.tasks || []
    }
    return projects.flatMap(project => 
      project.tasks.map(task => ({
        ...task,
        projectTitle: project.title,
        projectId: project.id
      }))
    )
  }, [projects, selectedProject])

  // Get unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(allTasks.map(task => task.assignedTo))
    return Array.from(assignees).filter(Boolean)
  }, [allTasks])

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee
      
      return matchesSearch && matchesPriority && matchesAssignee
    })
  }, [allTasks, searchQuery, filterPriority, filterAssignee])

  // Define task columns
  const columns: TaskColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-gray-50 border-gray-200',
      count: filteredTasks.filter(t => t.status === 'todo').length
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-blue-50 border-blue-200',
      count: filteredTasks.filter(t => t.status === 'in-progress').length
    },
    {
      id: 'review',
      title: 'Review',
      color: 'bg-yellow-50 border-yellow-200',
      count: filteredTasks.filter(t => t.status === 'review').length
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-50 border-green-200',
      count: filteredTasks.filter(t => t.status === 'completed').length
    }
  ]

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    console.log('Update task status:', taskId, newStatus)
    // Implement status update logic here
  }

  const handleTimerAction = (taskId: string, action: 'start' | 'pause' | 'stop') => {
    console.log('Timer action:', action, 'for task:', taskId)
    // Implement timer logic here
  }

  return (
    <div className={cn('task-management-board space-y-6', className)}>
      {/* Header and Controls */}
      <div className="space-y-4">
        {/* Project Selector */}
        {!selectedProject && (
          <div className="flex items-center gap-4">
            <Select value={selectedProject || 'all'} onValueChange={onProjectSelect}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {uniqueAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" className="ml-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className={cn('min-h-[600px]', column.color)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>{column.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {column.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {filteredTasks
                .filter(task => task.status === column.id)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    onTimerAction={handleTimerAction}
                  />
                ))}
              
              {/* Add Task Button */}
              <Button
                variant="ghost"
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400"
                onClick={() => console.log('Add task to column:', column.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  )
}

// Individual Task Card Component for Kanban
interface TaskCardProps {
  task: WorkflowTask & { projectTitle?: string; projectId?: string }
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onTimerAction: (taskId: string, action: 'start' | 'pause' | 'stop') => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onTimerAction }) => {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isTimerPaused, setIsTimerPaused] = useState(false)

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleTimerClick = (action: 'start' | 'pause' | 'stop') => {
    if (action === 'start') {
      setIsTimerActive(true)
      setIsTimerPaused(false)
    } else if (action === 'pause') {
      setIsTimerPaused(true)
    } else if (action === 'stop') {
      setIsTimerActive(false)
      setIsTimerPaused(false)
    }
    onTimerAction(task.id, action)
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group">
      <CardContent className="p-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {task.title}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
              <Flag className="w-2 h-2 mr-1" />
              {task.priority}
            </Badge>
            
            {task.dueDate && (
              <span className="text-muted-foreground">
                Due: {task.dueDate.toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{task.actualHours}h / {task.estimatedHours}h</span>
            </div>
            
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-20">{task.assignedTo}</span>
              </div>
            )}
          </div>

          {task.projectTitle && (
            <div className="text-xs text-muted-foreground">
              Project: {task.projectTitle}
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-1 pt-2">
          {isTimerActive ? (
            <>
              <Button
                size="sm"
                variant={isTimerPaused ? "default" : "outline"}
                onClick={() => handleTimerClick(isTimerPaused ? 'start' : 'pause')}
                className="h-6 px-2 text-xs"
              >
                {isTimerPaused ? (
                  <><Play className="w-2 h-2 mr-1" />Resume</>
                ) : (
                  <><Pause className="w-2 h-2 mr-1" />Pause</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimerClick('stop')}
                className="h-6 px-2 text-xs"
              >
                <Square className="w-2 h-2 mr-1" />Stop
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleTimerClick('start')}
              className="h-6 px-2 text-xs"
              disabled={task.status === 'completed'}
            >
              <Play className="w-2 h-2 mr-1" />Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskManagementBoard
