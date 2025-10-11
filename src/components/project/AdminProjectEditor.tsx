import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Users,
  AlertTriangle,
  Target,
  Building,
  Tag,
  User,
  CheckCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Type definitions (would typically come from a shared types file)
import { ProjectStatus, JobCardStatus, UserRole } from '@/types'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  title?: string
  avatarUrl?: string
}

export interface JobCard {
  id: string
  title: string
  description: string
  status: JobCardStatus
  estimatedTime?: number
  allocatedHours?: number
  assignedArchitectIds: string[]
  timeLogs?: TimeLog[]
}

export interface TimeLog {
  id: string
  durationMinutes: number
  createdAt: Date
}

export interface Project {
  id: string
  title: string
  description: string
  clientId: string
  leadArchitectId: string
  assignedTeamIds: string[]
  status: ProjectStatus
  budget?: number
  deadline?: Date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  tags: string[]
  requirements?: string
  deliverables: string[]
  jobCards: JobCard[]
  purchasedHours?: number
  remainingHours?: number
  totalTimeSpentMinutes?: number
  totalAllocatedHours?: number
  createdAt: Date
  updatedAt?: Date
}

// Validation schema
const projectFormSchema = z.object({
  title: z.string().min(2, { message: 'Project title must be at least 2 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  clientId: z.string().min(1, { message: 'Please select a client.' }),
  leadArchitectId: z.string().min(1, { message: 'Please select a lead architect.' }),
  assignedTeamIds: z.array(z.string()),
  status: z.nativeEnum(ProjectStatus),
  budget: z.number().min(0).optional(),
  deadline: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  requirements: z.string().optional(),
  tags: z.array(z.string()),
  deliverables: z.array(z.string()),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

export interface AdminProjectEditorProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  users: User[]
  clients: User[]
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>
  onUpdateJobCard?: (projectId: string, jobCardId: string, updates: Partial<JobCard>) => Promise<void>
  onAddJobCard?: (projectId: string, jobCard: Partial<JobCard>) => Promise<void>
  userRole?: UserRole
  isLoading?: boolean
}

export const AdminProjectEditor: React.FC<AdminProjectEditorProps> = ({
  isOpen,
  onClose,
  project,
  users,
  clients,
  onUpdateProject,
  onUpdateJobCard,
  onAddJobCard,
  userRole = UserRole.ADMIN,
  isLoading = false,
}) => {
  console.log('AdminProjectEditor rendered with props:', {
    isOpen,
    project: project?.title,
    usersCount: users?.length,
    clientsCount: clients?.length,
    userRole
  })

  const [activeTab, setActiveTab] = useState('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobCards, setJobCards] = useState<JobCard[]>(project.jobCards || [])
  const [newJobCard, setNewJobCard] = useState({
    title: '',
    description: '',
    allocatedHours: '',
    assignedArchitectIds: [] as string[],
  })
  const [newTag, setNewTag] = useState('')
  const [newDeliverable, setNewDeliverable] = useState('')

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project.title,
      description: project.description,
      clientId: project.clientId,
      leadArchitectId: project.leadArchitectId,
      assignedTeamIds: project.assignedTeamIds || [],
      status: project.status,
      budget: project.budget || 0,
      deadline: project.deadline
        ? project.deadline instanceof Date
          ? project.deadline.toISOString().split('T')[0]
          : new Date(project.deadline).toISOString().split('T')[0]
        : '',
      priority: project.priority || 'MEDIUM',
      requirements: project.requirements || '',
      tags: project.tags || [],
      deliverables: project.deliverables || [],
    },
  })

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      title: project.title,
      description: project.description,
      clientId: project.clientId,
      leadArchitectId: project.leadArchitectId,
      assignedTeamIds: project.assignedTeamIds || [],
      status: project.status,
      budget: project.budget || 0,
      deadline: project.deadline
        ? project.deadline instanceof Date
          ? project.deadline.toISOString().split('T')[0]
          : new Date(project.deadline).toISOString().split('T')[0]
        : '',
      priority: project.priority || 'MEDIUM',
      requirements: project.requirements || '',
      tags: project.tags || [],
      deliverables: project.deliverables || [],
    })
    setJobCards(project.jobCards || [])
  }, [project, form])

  // Filter users by role
  const freelancers = users.filter(u => u.role === UserRole.FREELANCER)
  const admins = users.filter(u => u.role === UserRole.ADMIN)

  // Check if user has permission to edit
  if (userRole !== UserRole.ADMIN) {
    return null
  }

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!onUpdateProject) return

    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: Partial<Project> = {
        title: values.title.trim(),
        description: values.description.trim(),
        clientId: values.clientId,
        leadArchitectId: values.leadArchitectId,
        assignedTeamIds: values.assignedTeamIds,
        status: values.status,
        budget: values.budget,
        deadline: values.deadline ? new Date(values.deadline) : undefined,
        priority: values.priority,
        tags: values.tags,
        requirements: values.requirements?.trim() || undefined,
        deliverables: values.deliverables,
      }

      await onUpdateProject(project.id, updateData)
      onClose()
    } catch (error) {
      console.error('Error updating project:', error)
      setError('Failed to update project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJobCardUpdate = async (jobCardId: string, updates: Partial<JobCard>) => {
    if (!onUpdateJobCard) return

    try {
      await onUpdateJobCard(project.id, jobCardId, updates)
      setJobCards(prev => prev.map(jc => (jc.id === jobCardId ? { ...jc, ...updates } : jc)))
    } catch (error) {
      console.error('Error updating job card:', error)
      setError('Failed to update task. Please try again.')
    }
  }

  const handleAddJobCard = async () => {
    if (!onAddJobCard || !newJobCard.title.trim() || !newJobCard.description.trim()) {
      setError('Please fill in title and description for the new task')
      return
    }

    try {
      await onAddJobCard(project.id, {
        title: newJobCard.title.trim(),
        description: newJobCard.description.trim(),
        allocatedHours: parseFloat(newJobCard.allocatedHours) || 0,
        assignedArchitectIds: newJobCard.assignedArchitectIds,
        status: JobCardStatus.TODO,
      })

      setNewJobCard({
        title: '',
        description: '',
        allocatedHours: '',
        assignedArchitectIds: [],
      })
    } catch (error) {
      console.error('Error adding job card:', error)
      setError('Failed to add task. Please try again.')
    }
  }

  const handleTagAdd = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags')
      form.setValue('tags', [...currentTags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    const currentTags = form.getValues('tags')
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
  }

  const handleDeliverableAdd = () => {
    if (newDeliverable.trim() && !form.getValues('deliverables').includes(newDeliverable.trim())) {
      const currentDeliverables = form.getValues('deliverables')
      form.setValue('deliverables', [...currentDeliverables, newDeliverable.trim()])
      setNewDeliverable('')
    }
  }

  const handleDeliverableRemove = (deliverableToRemove: string) => {
    const currentDeliverables = form.getValues('deliverables')
    form.setValue('deliverables', currentDeliverables.filter(d => d !== deliverableToRemove))
  }

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`
    }
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details, assign team members, and manage tasks
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 h-[600px] overflow-y-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting || isLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Status *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ProjectStatus.DRAFT}>
                                  Draft
                                </SelectItem>
                                <SelectItem value={ProjectStatus.PLANNING}>
                                  Planning
                                </SelectItem>
                                <SelectItem value={ProjectStatus.ACTIVE}>
                                  Active
                                </SelectItem>
                                <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                                <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                                <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="h-24 resize-none"
                              disabled={isSubmitting || isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Requirements</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="h-32 resize-none"
                              placeholder="Detailed project requirements, specifications, and constraints..."
                              disabled={isSubmitting || isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Detailed requirements and specifications for the project
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tags */}
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Tags</FormLabel>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {field.value.map(tag => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={() => handleTagRemove(tag)}
                                    disabled={isSubmitting || isLoading}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a tag"
                                disabled={isSubmitting || isLoading}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleTagAdd()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTagAdd}
                                disabled={!newTag.trim() || isSubmitting || isLoading}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Deliverables */}
                    <FormField
                      control={form.control}
                      name="deliverables"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Deliverables</FormLabel>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              {field.value.map((deliverable, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-muted p-3 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{deliverable}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeliverableRemove(deliverable)}
                                    disabled={isSubmitting || isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newDeliverable}
                                onChange={(e) => setNewDeliverable(e.target.value)}
                                placeholder="Add a deliverable"
                                disabled={isSubmitting || isLoading}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleDeliverableAdd()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDeliverableAdd}
                                disabled={!newDeliverable.trim() || isSubmitting || isLoading}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="team" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients.map(client => (
                                  <SelectItem key={client.id} value={client.id}>
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      {client.name} ({client.email})
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="leadArchitectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Architect *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select lead architect" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {admins.map(admin => (
                                  <SelectItem key={admin.id} value={admin.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {admin.name} ({admin.title})
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="assignedTeamIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>Assigned Team Members</FormLabel>
                          <Card>
                            <CardContent className="p-4 max-h-60 overflow-y-auto">
                              <div className="space-y-3">
                                {freelancers.map(freelancer => (
                                  <FormField
                                    key={freelancer.id}
                                    control={form.control}
                                    name="assignedTeamIds"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(freelancer.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, freelancer.id])
                                                : field.onChange(
                                                  field.value?.filter(value => value !== freelancer.id)
                                                )
                                            }}
                                            disabled={isSubmitting || isLoading}
                                          />
                                        </FormControl>
                                        <div className="flex items-center space-x-3">
                                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <FormLabel className="text-sm font-medium">
                                              {freelancer.name}
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                              {freelancer.title}
                                            </p>
                                          </div>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          <FormDescription>
                            Selected: {form.getValues('assignedTeamIds')?.length || 0} team member(s)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="tasks" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Existing Tasks</h3>
                      <div className="space-y-4">
                        {jobCards.map(jobCard => (
                          <Card key={jobCard.id}>
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={jobCard.title}
                                      onChange={(e) =>
                                        handleJobCardUpdate(jobCard.id, { title: e.target.value })
                                      }
                                      className="font-medium"
                                      disabled={isSubmitting}
                                    />
                                    <Textarea
                                      value={jobCard.description}
                                      onChange={(e) =>
                                        handleJobCardUpdate(jobCard.id, { description: e.target.value })
                                      }
                                      className="resize-none"
                                      rows={2}
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  <Select
                                    value={jobCard.status}
                                    onValueChange={(value) =>
                                      handleJobCardUpdate(jobCard.id, { status: value as JobCardStatus })
                                    }
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger className="w-32 ml-4">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={JobCardStatus.TODO}>To Do</SelectItem>
                                      <SelectItem value={JobCardStatus.IN_PROGRESS}>
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value={JobCardStatus.COMPLETED}>Completed</SelectItem>
                                      <SelectItem value={JobCardStatus.ON_HOLD}>On Hold</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label htmlFor={`estimated-time-${jobCard.id}`} className="text-xs text-muted-foreground">
                                      Estimated Time (hours)
                                    </label>
                                    <Input
                                      id={`estimated-time-${jobCard.id}`}
                                      type="number"
                                      value={jobCard.estimatedTime || ''}
                                      onChange={(e) =>
                                        handleJobCardUpdate(jobCard.id, {
                                          estimatedTime: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      min="0"
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`allocated-hours-${jobCard.id}`} className="text-xs text-muted-foreground">
                                      Allocated Hours
                                    </label>
                                    <Input
                                      id={`allocated-hours-${jobCard.id}`}
                                      type="number"
                                      value={jobCard.allocatedHours || ''}
                                      onChange={(e) =>
                                        handleJobCardUpdate(jobCard.id, {
                                          allocatedHours: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      min="0"
                                      step="0.5"
                                      disabled={isSubmitting}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">Time Logged</label>
                                    <div className="text-sm text-muted-foreground py-1">
                                      {formatHours(
                                        (jobCard.timeLogs || []).reduce(
                                          (total, log) => total + log.durationMinutes / 60,
                                          0
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="new-task-title" className="text-sm font-medium">Task Title</label>
                              <Input
                                id="new-task-title"
                                value={newJobCard.title}
                                onChange={(e) =>
                                  setNewJobCard(prev => ({ ...prev, title: e.target.value }))
                                }
                                placeholder="Enter task title"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div>
                              <label htmlFor="new-task-hours" className="text-sm font-medium">Allocated Hours</label>
                              <Input
                                id="new-task-hours"
                                type="number"
                                value={newJobCard.allocatedHours}
                                onChange={(e) =>
                                  setNewJobCard(prev => ({ ...prev, allocatedHours: e.target.value }))
                                }
                                placeholder="0"
                                min="0"
                                step="0.5"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="new-task-description" className="text-sm font-medium">Task Description</label>
                            <Textarea
                              id="new-task-description"
                              value={newJobCard.description}
                              onChange={(e) =>
                                setNewJobCard(prev => ({ ...prev, description: e.target.value }))
                              }
                              className="h-20 resize-none"
                              placeholder="Describe the task requirements"
                              disabled={isSubmitting}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddJobCard}
                            disabled={
                              isSubmitting ||
                              !newJobCard.title.trim() ||
                              !newJobCard.description.trim()
                            }
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="hours" className="space-y-6">
                    {/* Hour Management Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Hour Management Overview</CardTitle>
                        <CardDescription>
                          Track and manage allocated hours for this project. Monitor purchased hours, hours used, and remaining availability.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {project.purchasedHours || 0}h
                            </div>
                            <div className="text-sm text-muted-foreground">Purchased</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {(project.remainingHours || 0).toFixed(1)}h
                            </div>
                            <div className="text-sm text-muted-foreground">Remaining</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {((project.totalTimeSpentMinutes || 0) / 60).toFixed(1)}h
                            </div>
                            <div className="text-sm text-muted-foreground">Time Spent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {project.totalAllocatedHours || 0}h
                            </div>
                            <div className="text-sm text-muted-foreground">Allocated</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Task Hour Allocations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Task Hour Allocations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jobCards.map(jobCard => {
                          const timeSpent = (jobCard.timeLogs || []).reduce(
                            (sum, log) => sum + log.durationMinutes,
                            0
                          ) / 60
                          const progressPercentage = jobCard.allocatedHours
                            ? Math.min(100, (timeSpent / jobCard.allocatedHours) * 100)
                            : 0

                          return (
                            <Card key={jobCard.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium">{jobCard.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Time Spent: {formatHours(timeSpent)} • Status: {jobCard.status}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={jobCard.allocatedHours || 0}
                                      onChange={(e) =>
                                        handleJobCardUpdate(jobCard.id, {
                                          allocatedHours: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                    <span className="text-sm text-muted-foreground">hours</span>
                                  </div>
                                </div>
                                {jobCard.allocatedHours && jobCard.allocatedHours > 0 && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                      <span>Progress</span>
                                      <span>{progressPercentage.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                      value={progressPercentage}
                                      className={cn(
                                        'h-2',
                                        timeSpent > jobCard.allocatedHours && 'bg-red-100'
                                      )}
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </CardContent>
                    </Card>

                    {/* Allocation Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Allocation Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Allocated:</span>
                            <span className="font-medium ml-2">
                              {jobCards
                                .reduce((sum, jc) => sum + (jc.allocatedHours || 0), 0)
                                .toFixed(1)}h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Remaining Budget:</span>
                            <span className="font-medium ml-2">
                              {Math.max(
                                0,
                                (project.remainingHours || 0) -
                                jobCards.reduce((sum, jc) => sum + (jc.allocatedHours || 0), 0)
                              ).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                        {jobCards.reduce((sum, jc) => sum + (jc.allocatedHours || 0), 0) >
                          (project.remainingHours || 0) && (
                            <Alert variant="destructive" className="mt-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Warning: Total allocation exceeds remaining hours!
                              </AlertDescription>
                            </Alert>
                          )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Deadline</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={isSubmitting || isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Budget</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="pl-9"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                disabled={isSubmitting || isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>Project Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <div className="font-medium">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Updated:</span>
                            <div className="font-medium">
                              {project.updatedAt
                                ? new Date(project.updatedAt).toLocaleDateString()
                                : 'Never'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <DialogFooter className="pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoading || !form.formState.isValid}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminProjectEditor
