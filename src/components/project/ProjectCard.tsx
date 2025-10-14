import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  MoreHorizontal,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectStatus, UserRole } from '@/types'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  title?: string
  avatarUrl?: string
}

export interface Project {
  id: string
  title: string
  description: string
  clientId: string
  clientName?: string
  leadArchitectId: string
  leadArchitectName?: string
  assignedTeamIds: string[]
  assignedTeam?: User[]
  status: ProjectStatus
  budget?: number
  deadline?: Date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  tags: string[]
  purchasedHours?: number
  remainingHours?: number
  totalTimeSpentMinutes?: number
  totalAllocatedHours?: number
  completionPercentage?: number
  activeJobCards?: number
  totalJobCards?: number
  createdAt: Date
  updatedAt?: Date
}

export interface ProjectCardActions {
  onView?: (projectId: string) => void
  onEdit?: (projectId: string) => void
  onDelete?: (projectId: string) => void
  onStartTimer?: (projectId: string) => void
  onPauseTimer?: (projectId: string) => void
  onStopTimer?: (projectId: string) => void
  onDuplicate?: (projectId: string) => void
  onArchive?: (projectId: string) => void
}

export interface ProjectCardProps {
  project: Project
  actions?: ProjectCardActions
  showActions?: boolean
  showTimerControls?: boolean
  compact?: boolean
  userRole?: UserRole
  className?: string
  disabled?: boolean
  isTimerActive?: boolean
  isTimerPaused?: boolean
}

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: ProjectStatus) => {
  const configs = {
    [ProjectStatus.PENDING_APPROVAL]: {
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      icon: Clock,
      label: 'Pending Approval',
    },
    [ProjectStatus.IN_PROGRESS]: {
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      icon: Play,
      label: 'In Progress',
    },
    [ProjectStatus.COMPLETED]: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 hover:bg-green-200',
      icon: CheckCircle,
      label: 'Completed',
    },
    [ProjectStatus.ON_HOLD]: {
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      icon: Pause,
      label: 'On Hold',
    },
    [ProjectStatus.CANCELLED]: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-700 hover:bg-red-200',
      icon: Square,
      label: 'Cancelled',
    },
  }
  return configs[status]
}

/**
 * Get priority badge configuration
 */
const getPriorityConfig = (priority: string) => {
  const configs = {
    LOW: { variant: 'outline' as const, className: 'text-gray-600' },
    MEDIUM: { variant: 'secondary' as const, className: 'text-blue-600' },
    HIGH: { variant: 'default' as const, className: 'text-orange-600' },
    URGENT: { variant: 'destructive' as const, className: 'text-red-600' },
  }
  return configs[priority as keyof typeof configs] || configs.MEDIUM
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
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

/**
 * ProjectCard Component
 * 
 * Displays project information with status, progress, team, and actions
 * Migrated to use shadcn/ui components while preserving all functionality
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  actions = {},
  showActions = true,
  showTimerControls = true,
  compact = false,
  userRole = UserRole.ADMIN,
  className,
  disabled = false,
  isTimerActive = false,
  isTimerPaused = false,
}) => {
  const statusConfig = getStatusConfig(project.status)
  const priorityConfig = getPriorityConfig(project.priority || 'MEDIUM')
  const StatusIcon = statusConfig.icon

  // Calculate completion percentage
  const completionPercentage = project.completionPercentage ??
    (project.totalAllocatedHours && project.totalAllocatedHours > 0
      ? Math.min(100, ((project.totalTimeSpentMinutes || 0) / 60 / project.totalAllocatedHours) * 100)
      : 0)

  // Check if project is overdue
  const isOverdue = project.deadline && new Date() > project.deadline && project.status !== ProjectStatus.COMPLETED

  // Calculate hours spent
  const hoursSpent = (project.totalTimeSpentMinutes || 0) / 60

  // Timer control handlers
  const handleTimerAction = (action: 'start' | 'pause' | 'stop') => {
    if (disabled) return

    switch (action) {
      case 'start':
        actions.onStartTimer?.(project.id)
        break
      case 'pause':
        actions.onPauseTimer?.(project.id)
        break
      case 'stop':
        actions.onStopTimer?.(project.id)
        break
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className={cn(
        'project-card relative transition-all duration-200 hover:shadow-md',
        {
          'opacity-50 cursor-not-allowed': disabled,
          'border-l-4 border-l-red-500': isOverdue,
          'border-l-4 border-l-blue-500': isTimerActive,
          'h-48': compact,
        },
        className
      )}
    >
      <CardHeader className={cn('pb-3', { 'pb-2': compact })}>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className={cn('text-lg font-semibold leading-none', {
                'text-base': compact
              })}>
                {project.title}
              </CardTitle>
              {isOverdue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Project is overdue</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {project.description && !compact && (
              <CardDescription className="text-sm line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Badge
              variant={statusConfig.variant}
              className={cn('text-xs', statusConfig.className)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {compact ? statusConfig.label.slice(0, 6) : statusConfig.label}
            </Badge>

            {project.priority && (
              <Badge
                variant={priorityConfig.variant}
                className={cn('text-xs capitalize', priorityConfig.className)}
              >
                {project.priority.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Project Meta Info */}
        {!compact && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            {project.clientName && (
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {project.clientName}
              </div>
            )}

            {project.leadArchitectName && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {project.leadArchitectName}
              </div>
            )}

            {project.deadline && (
              <div className={cn('flex items-center gap-1', {
                'text-red-600 font-medium': isOverdue,
              })}>
                <Calendar className="w-3 h-3" />
                {project.deadline.toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className={cn('pb-3', { 'pb-2': compact })}>
        {/* Progress and Hours */}
        <div className="space-y-3">
          {/* Hours tracking */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {formatHours(hoursSpent)}
                  {project.purchasedHours && ` / ${formatHours(project.purchasedHours)}`}
                </span>
              </div>

              {project.budget && (
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="w-3 h-3 mr-1" />
                  <span className="text-xs">{formatCurrency(project.budget)}</span>
                </div>
              )}

              {project.totalJobCards && (
                <div className="flex items-center text-muted-foreground">
                  <Target className="w-3 h-3 mr-1" />
                  <span className="text-xs">
                    {project.activeJobCards || 0}/{project.totalJobCards} tasks
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {completionPercentage > 0 && (
            <div className="space-y-1">
              <Progress
                value={completionPercentage}
                className="h-2"
                aria-label={`Project progress: ${Math.round(completionPercentage)}%`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(completionPercentage)}% complete</span>
                {project.remainingHours && (
                  <span>{formatHours(project.remainingHours)} remaining</span>
                )}
              </div>
            </div>
          )}

          {/* Team avatars */}
          {project.assignedTeam && project.assignedTeam.length > 0 && !compact && (
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <div className="flex -space-x-1">
                {project.assignedTeam.slice(0, 4).map(member => (
                  <TooltipProvider key={member.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{member.name} ({member.title})</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {project.assignedTeam.length > 4 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{project.assignedTeam.length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{project.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className={cn('pt-0 flex justify-between', { 'pt-1': compact })}>
        {/* Timer Controls */}
        {showTimerControls && userRole !== UserRole.CLIENT && (
          <div className="flex items-center gap-2">
            {isTimerActive ? (
              <>
                <Button
                  size="sm"
                  variant={isTimerPaused ? "default" : "outline"}
                  onClick={() => handleTimerAction(isTimerPaused ? 'start' : 'pause')}
                  disabled={disabled}
                  className="h-7 px-2"
                >
                  {isTimerPaused ? (
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
                disabled={disabled || project.status === ProjectStatus.COMPLETED}
                className="h-7 px-2"
              >
                <Play className="w-3 h-3 mr-1" />
                Start Timer
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-1">
            {actions.onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => actions.onView?.(project.id)}
                disabled={disabled}
                className="h-7 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}

            {userRole === UserRole.ADMIN && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    className="h-7 w-7 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.onEdit && (
                    <DropdownMenuItem onClick={() => actions.onEdit?.(project.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                  )}

                  {actions.onDuplicate && (
                    <DropdownMenuItem onClick={() => actions.onDuplicate?.(project.id)}>
                      <Target className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                  )}

                  {actions.onArchive && (
                    <DropdownMenuItem onClick={() => actions.onArchive?.(project.id)}>
                      <Square className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}

                  {actions.onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => actions.onDelete?.(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Export as default for backward compatibility
export default ProjectCard

// Export aliases for different project card types
export const ProjectCardComponent = ProjectCard
