import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  Calendar,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Building,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Enums and types (would typically come from a shared types file)
export enum ProjectStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  FREELANCER = 'FREELANCER',
  CLIENT = 'CLIENT',
}

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

export interface ProjectTableActions {
  onView?: (projectId: string) => void
  onEdit?: (projectId: string) => void
  onDelete?: (projectId: string) => void
  onStartTimer?: (projectId: string) => void
  onPauseTimer?: (projectId: string) => void
  onStopTimer?: (projectId: string) => void
  onDuplicate?: (projectId: string) => void
  onArchive?: (projectId: string) => void
}

export interface ProjectTableProps {
  projects: Project[]
  actions?: ProjectTableActions
  userRole?: UserRole
  isLoading?: boolean
  showTimerControls?: boolean
  showPagination?: boolean
  pageSize?: number
  className?: string
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: ProjectFilters) => void
  activeTimerProjectId?: string
  isTimerPaused?: boolean
}

export interface ProjectFilters {
  search?: string
  status?: ProjectStatus | 'all'
  priority?: string | 'all'
  client?: string | 'all'
}

type SortField = 'title' | 'status' | 'deadline' | 'budget' | 'createdAt' | 'completionPercentage'

/**
 * Get status badge configuration
 */
const getStatusConfig = (status: ProjectStatus) => {
  const configs = {
    [ProjectStatus.PENDING_APPROVAL]: {
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
      label: 'Pending',
    },
    [ProjectStatus.IN_PROGRESS]: {
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-700',
      icon: Play,
      label: 'In Progress',
    },
    [ProjectStatus.COMPLETED]: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'Completed',
    },
    [ProjectStatus.ON_HOLD]: {
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-600',
      icon: Pause,
      label: 'On Hold',
    },
    [ProjectStatus.CANCELLED]: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-700',
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
    LOW: { variant: 'outline' as const, className: 'text-gray-600 border-gray-300' },
    MEDIUM: { variant: 'secondary' as const, className: 'text-blue-600 bg-blue-50' },
    HIGH: { variant: 'default' as const, className: 'text-orange-600 bg-orange-50' },
    URGENT: { variant: 'destructive' as const, className: 'text-red-600 bg-red-50' },
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get initials for avatar fallback
 */
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * ProjectTable Component
 * 
 * A comprehensive data table for displaying projects with filtering, sorting, and actions
 * Migrated to use shadcn/ui components while preserving all functionality
 */
export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  actions = {},
  userRole = UserRole.ADMIN,
  isLoading = false,
  showTimerControls = true,
  showPagination = true,
  pageSize = 10,
  className,
  onSort,
  onFilter,
  activeTimerProjectId,
  isTimerPaused = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    client: 'all',
  })

  // Get unique clients for filter dropdown
  const uniqueClients = useMemo(() => {
    const clients = projects
      .map(p => ({ id: p.clientId, name: p.clientName }))
      .filter((client, index, self) => 
        client.name && self.findIndex(c => c.id === client.id) === index
      )
    return clients
  }, [projects])

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.clientName?.toLowerCase().includes(searchLower) ||
        project.leadArchitectName?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status)
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(project => project.priority === filters.priority)
    }

    if (filters.client && filters.client !== 'all') {
      filtered = filtered.filter(project => project.clientId === filters.client)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle special cases
      if (sortField === 'completionPercentage') {
        aValue = a.completionPercentage ?? 0
        bValue = b.completionPercentage ?? 0
      } else if (sortField === 'deadline') {
        aValue = a.deadline ? new Date(a.deadline).getTime() : 0
        bValue = b.deadline ? new Date(b.deadline).getTime() : 0
      } else if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [projects, filters, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / pageSize)
  const paginatedProjects = showPagination
    ? filteredAndSortedProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredAndSortedProjects

  // Handle sorting
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
    onSort?.(field, newDirection)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProjectFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setCurrentPage(1) // Reset to first page when filtering
    onFilter?.(updatedFilters)
  }

  // Timer control handlers
  const handleTimerAction = (projectId: string, action: 'start' | 'pause' | 'stop') => {
    switch (action) {
      case 'start':
        actions.onStartTimer?.(projectId)
        break
      case 'pause':
        actions.onPauseTimer?.(projectId)
        break
      case 'stop':
        actions.onStopTimer?.(projectId)
        break
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => handleFilterChange({ status: value as any })}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.PENDING_APPROVAL}>Pending</SelectItem>
            <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
            <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => handleFilterChange({ priority: value })}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {uniqueClients.length > 0 && (
          <Select value={filters.client} onValueChange={(value) => handleFilterChange({ client: value })}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('title')}
                  className="h-auto p-0 font-medium"
                >
                  Project
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-medium"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('deadline')}
                  className="h-auto p-0 font-medium"
                >
                  Deadline
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Hours</TableHead>
              {userRole === UserRole.ADMIN && (
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('budget')}
                    className="h-auto p-0 font-medium"
                  >
                    Budget
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={userRole === UserRole.ADMIN ? 9 : 8} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map(project => {
                const statusConfig = getStatusConfig(project.status)
                const priorityConfig = getPriorityConfig(project.priority || 'MEDIUM')
                const StatusIcon = statusConfig.icon
                
                const isOverdue = project.deadline && 
                  new Date() > project.deadline && 
                  project.status !== ProjectStatus.COMPLETED
                
                const hoursSpent = (project.totalTimeSpentMinutes || 0) / 60
                const completionPercentage = project.completionPercentage ?? 0
                const isTimerActive = activeTimerProjectId === project.id

                return (
                  <TableRow 
                    key={project.id}
                    className={cn({
                      'border-l-4 border-l-blue-500': isTimerActive,
                      'border-l-4 border-l-red-500': isOverdue,
                    })}
                  >
                    {/* Project */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{project.title}</div>
                          {isOverdue && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        {project.priority && (
                          <Badge 
                            variant={priorityConfig.variant}
                            className={cn('text-xs', priorityConfig.className)}
                          >
                            {project.priority.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge 
                        variant={statusConfig.variant}
                        className={cn('text-xs', statusConfig.className)}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{project.clientName || 'Unknown'}</span>
                      </div>
                    </TableCell>

                    {/* Team */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {project.assignedTeam && project.assignedTeam.length > 0 ? (
                          <div className="flex -space-x-1">
                            {project.assignedTeam.slice(0, 3).map(member => (
                              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {project.assignedTeam.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  +{project.assignedTeam.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Users className="h-3 w-3" />
                            <span>No team</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Deadline */}
                    <TableCell>
                      {project.deadline ? (
                        <div className={cn('flex items-center gap-1 text-sm', {
                          'text-red-600 font-medium': isOverdue,
                        })}>
                          <Calendar className="h-3 w-3" />
                          {project.deadline.toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No deadline</span>
                      )}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="space-y-1 w-20">
                        <Progress value={completionPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {Math.round(completionPercentage)}%
                        </div>
                      </div>
                    </TableCell>

                    {/* Hours */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {formatHours(hoursSpent)}
                          {project.purchasedHours && ` / ${formatHours(project.purchasedHours)}`}
                        </span>
                      </div>
                    </TableCell>

                    {/* Budget (Admin only) */}
                    {userRole === UserRole.ADMIN && (
                      <TableCell>
                        {project.budget ? (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            {formatCurrency(project.budget)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Timer Controls */}
                        {showTimerControls && userRole !== UserRole.CLIENT && (
                          <div className="flex items-center gap-1">
                            {isTimerActive ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTimerAction(project.id, isTimerPaused ? 'start' : 'pause')}
                                  className="h-6 w-6 p-0"
                                  title={isTimerPaused ? 'Resume timer' : 'Pause timer'}
                                >
                                  {isTimerPaused ? (
                                    <Play className="h-3 w-3" />
                                  ) : (
                                    <Pause className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTimerAction(project.id, 'stop')}
                                  className="h-6 w-6 p-0"
                                  title="Stop timer"
                                >
                                  <Square className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTimerAction(project.id, 'start')}
                                disabled={project.status === ProjectStatus.COMPLETED}
                                className="h-6 w-6 p-0"
                                title="Start timer"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.onView && (
                              <DropdownMenuItem onClick={() => actions.onView?.(project.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            )}
                            
                            {userRole === UserRole.ADMIN && actions.onEdit && (
                              <DropdownMenuItem onClick={() => actions.onEdit?.(project.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                              </DropdownMenuItem>
                            )}
                            
                            {userRole === UserRole.ADMIN && actions.onDuplicate && (
                              <DropdownMenuItem onClick={() => actions.onDuplicate?.(project.id)}>
                                <Users className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                            )}
                            
                            {userRole === UserRole.ADMIN && actions.onDelete && (
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
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedProjects.length)} of{' '}
            {filteredAndSortedProjects.length} projects
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Export as default for backward compatibility
export default ProjectTable

// Export aliases
export const ProjectDataTable = ProjectTable
export const ProjectTableComponent = ProjectTable
