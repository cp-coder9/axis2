import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Job Card Status Types
 */
export type JobStatus = 
  | 'not-started' 
  | 'in-progress' 
  | 'paused' 
  | 'completed' 
  | 'overdue' 
  | 'on-hold'

/**
 * Job Card Priority Types
 */
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Job Card Data Interface
 */
export interface JobCardData {
  id: string
  title: string
  description?: string
  status: JobStatus
  priority: JobPriority
  allocatedHours: number
  usedHours: number
  remainingHours: number
  dueDate?: Date
  assignedTo?: string
  projectId: string
  projectTitle: string
  tags?: string[]
  isTimerActive?: boolean
  isTimerPaused?: boolean
  completionPercentage?: number
}

/**
 * Job Card Action Callbacks
 */
export interface JobCardActions {
  onStartTimer?: (jobId: string) => void
  onPauseTimer?: (jobId: string) => void
  onStopTimer?: (jobId: string) => void
  onEdit?: (jobId: string) => void
  onView?: (jobId: string) => void
  onDelete?: (jobId: string) => void
  onStatusChange?: (jobId: string, status: JobStatus) => void
}

/**
 * Job Card Props
 */
export interface JobCardProps {
  job: JobCardData
  actions?: JobCardActions
  showTimerControls?: boolean
  showProjectInfo?: boolean
  compact?: boolean
  className?: string
  disabled?: boolean
}

/**
 * Get status color and styling
 */
const getStatusBadge = (status: JobStatus) => {
  const statusConfig = {
    'not-started': { 
      variant: 'secondary' as const, 
      icon: Calendar, 
      label: 'Not Started',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    'in-progress': { 
      variant: 'default' as const, 
      icon: Play, 
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    'paused': { 
      variant: 'outline' as const, 
      icon: Pause, 
      label: 'Paused',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    },
    'completed': { 
      variant: 'default' as const, 
      icon: CheckCircle, 
      label: 'Completed',
      className: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    'overdue': { 
      variant: 'destructive' as const, 
      icon: AlertTriangle, 
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    'on-hold': { 
      variant: 'secondary' as const, 
      icon: Square, 
      label: 'On Hold',
      className: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    },
  }
  return statusConfig[status]
}

/**
 * Get priority color and styling
 */
const getPriorityBadge = (priority: JobPriority) => {
  const priorityConfig = {
    low: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-600' },
    medium: { variant: 'outline' as const, className: 'bg-blue-100 text-blue-600' },
    high: { variant: 'default' as const, className: 'bg-orange-100 text-orange-600' },
    urgent: { variant: 'destructive' as const, className: 'bg-red-100 text-red-600' },
  }
  return priorityConfig[priority]
}

/**
 * Format hours for display
 */
const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * JobCard Component
 * 
 * Displays job information with status, progress, and timer controls
 * Migrated to use shadcn/ui components while preserving all functionality
 */
export const JobCard: React.FC<JobCardProps> = ({
  job,
  actions = {},
  showTimerControls = true,
  showProjectInfo = true,
  compact = false,
  className,
  disabled = false,
}) => {
  const statusConfig = getStatusBadge(job.status)
  const priorityConfig = getPriorityBadge(job.priority)
  const StatusIcon = statusConfig.icon
  
  // Calculate progress percentage
  const progressPercentage = job.completionPercentage ?? 
    Math.min(100, (job.usedHours / job.allocatedHours) * 100)
  
  // Check if overdue
  const isOverdue = job.dueDate && new Date() > job.dueDate && job.status !== 'completed'
  
  // Timer control handlers
  const handleTimerAction = (action: 'start' | 'pause' | 'stop') => {
    if (disabled) return
    
    switch (action) {
      case 'start':
        actions.onStartTimer?.(job.id)
        break
      case 'pause':
        actions.onPauseTimer?.(job.id)
        break
      case 'stop':
        actions.onStopTimer?.(job.id)
        break
    }
  }

  return (
    <Card 
      className={cn(
        'job-card relative transition-all duration-200 hover:shadow-md',
        {
          'opacity-50 cursor-not-allowed': disabled,
          'border-l-4 border-l-red-500': isOverdue,
          'border-l-4 border-l-blue-500': job.isTimerActive,
          'h-40': compact,
        },
        className
      )}
    >
      <CardHeader className={cn('pb-3', { 'pb-2': compact })}>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className={cn('text-base font-semibold leading-none', {
              'text-sm': compact
            })}>
              {job.title}
            </CardTitle>
            {job.description && !compact && (
              <CardDescription className="text-sm line-clamp-2">
                {job.description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Badge 
              variant={statusConfig.variant}
              className={cn('text-xs', statusConfig.className)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {compact ? statusConfig.label.slice(0, 4) : statusConfig.label}
            </Badge>
            
            <Badge 
              variant={priorityConfig.variant}
              className={cn('text-xs capitalize', priorityConfig.className)}
            >
              {job.priority}
            </Badge>
          </div>
        </div>

        {showProjectInfo && !compact && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Target className="w-3 h-3 mr-1" />
            {job.projectTitle}
          </div>
        )}
      </CardHeader>

      <CardContent className={cn('pb-3', { 'pb-2': compact })}>
        {/* Time allocation and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {formatHours(job.usedHours)} / {formatHours(job.allocatedHours)}
                </span>
              </div>
              
              {job.assignedTo && (
                <div className="flex items-center text-muted-foreground">
                  <User className="w-3 h-3 mr-1" />
                  <span className="text-xs">{job.assignedTo}</span>
                </div>
              )}
            </div>
            
            {job.dueDate && (
              <div className={cn('text-xs', {
                'text-red-600 font-medium': isOverdue,
                'text-muted-foreground': !isOverdue,
              })}>
                Due: {job.dueDate.toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              aria-label={`Job progress: ${Math.round(progressPercentage)}%`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>{formatHours(job.remainingHours)} remaining</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-3">
            {job.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{job.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className={cn('pt-0 flex justify-between', { 'pt-1': compact })}>
        {/* Timer Controls */}
        {showTimerControls && (
          <div className="flex items-center gap-2">
            {job.isTimerActive ? (
              <>
                <Button
                  size="sm"
                  variant={job.isTimerPaused ? "default" : "outline"}
                  onClick={() => handleTimerAction(job.isTimerPaused ? 'start' : 'pause')}
                  disabled={disabled}
                  className="h-7 px-2"
                >
                  {job.isTimerPaused ? (
                    <><Play className="w-3 h-3 mr-1" />Resume</>
                  ) : (
                    <><Pause className="w-3 h-3 mr-1" />Pause</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTimerAction('stop')}
                  disabled={disabled}
                  className="h-7 px-2"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleTimerAction('start')}
                disabled={disabled || job.status === 'completed'}
                className="h-7 px-2"
              >
                <Play className="w-3 h-3 mr-1" />
                Start Timer
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {actions.onView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.onView?.(job.id)}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              View
            </Button>
          )}
          
          {actions.onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.onEdit?.(job.id)}
              disabled={disabled}
              className="h-7 px-2 text-xs"
            >
              Edit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// Export as default for backward compatibility
export default JobCard

// Export aliases for different card types
export const TaskCard = JobCard
export const JobCardComponent = JobCard
