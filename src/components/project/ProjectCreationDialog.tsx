import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, Plus, X, Users, DollarSign, Clock, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'

// Enhanced project creation schema
const projectCreationSchema = z.object({
  title: z.string().min(3, 'Project title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  budget: z.number().min(18000, 'Budget must be at least R 18,000'),
  dueDate: z.date({
    message: 'Due date is required'
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['planning', 'active', 'on-hold']).default('planning'),
  teamMembers: z.array(z.object({
    name: z.string().min(2, 'Name is required'),
    role: z.string().min(2, 'Role is required'),
    email: z.string().email('Valid email required')
  })).min(1, 'At least one team member is required'),
  initialTasks: z.array(z.object({
    title: z.string().min(3, 'Task title is required'),
    description: z.string().optional(),
    estimatedHours: z.number().min(1, 'Estimated hours must be at least 1'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    assignedTo: z.string().min(1, 'Task must be assigned to someone')
  })).optional(),
  deliverables: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export type ProjectCreationFormData = z.infer<typeof projectCreationSchema>

interface ProjectCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (projectData: ProjectCreationFormData) => void
  editMode?: boolean
  initialData?: Partial<ProjectCreationFormData>
}

/**
 * ProjectCreationDialog - Enhanced project creation with comprehensive workflow setup
 * Includes team assignment, task creation, and timing integration
 */
export const ProjectCreationDialog: React.FC<ProjectCreationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(projectCreationSchema),
    defaultValues: {
      priority: 'medium',
      status: 'planning',
      teamMembers: [{ name: '', role: '', email: '' }],
      initialTasks: [],
      deliverables: [],
      tags: [],
      ...initialData
    }
  })

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control: form.control,
    name: 'teamMembers'
  })

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control: form.control,
    name: 'initialTasks'
  })

  const { fields: deliverableFields, append: appendDeliverable, remove: removeDeliverable } = useFieldArray({
    control: form.control,
    name: 'deliverables'
  })

  const onSubmit = async (data: ProjectCreationFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess(data)
      form.reset()
      setCurrentStep('basic')
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    const steps = ['basic', 'team', 'tasks', 'deliverables']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const previousStep = () => {
    const steps = ['basic', 'team', 'tasks', 'deliverables']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const canProceed = () => {
    const formValues = form.getValues()
    switch (currentStep) {
      case 'basic':
        return formValues.title && formValues.description && formValues.clientName && formValues.budget && formValues.dueDate
      case 'team':
        return formValues.teamMembers?.length > 0 && formValues.teamMembers.every(member => member.name && member.role && member.email)
      case 'tasks':
        return true // Tasks are optional
      case 'deliverables':
        return true // Can finalize without deliverables
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {editMode ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            Set up your project with team members, tasks, and delivery milestones
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              {['Basic Info', 'Team Setup', 'Initial Tasks', 'Deliverables'].map((step, index) => {
                const stepKey = ['basic', 'team', 'tasks', 'deliverables'][index]
                const isActive = currentStep === stepKey
                const isCompleted = ['basic', 'team', 'tasks', 'deliverables'].indexOf(currentStep) > index
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    )}>
                      {index + 1}
                    </div>
                    <div className="ml-2 text-sm font-medium">{step}</div>
                    {index < 3 && <div className="w-12 h-px bg-gray-300 mx-4" />}
                  </div>
                )
              })}
            </div>

            <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Modern Office Complex Design" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Metro Development Corp" {...field} />
                            </FormControl>
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
                          <FormLabel>Project Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed description of the project scope, requirements, and objectives..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Budget (ZAR)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="250000"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Setup */}
              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teamFields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Team Member {index + 1}</h4>
                          {teamFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeam(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`teamMembers.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`teamMembers.${index}.role`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <FormControl>
                                  <Input placeholder="Lead Architect" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`teamMembers.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendTeam({ name: '', role: '', email: '' })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Setup */}
              <TabsContent value="tasks" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Initial Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {taskFields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Task {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`initialTasks.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Site Analysis" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`initialTasks.${index}.assignedTo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {form.watch('teamMembers')?.map((member, idx) => (
                                      <SelectItem key={idx} value={member.name}>
                                        {member.name} ({member.role})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`initialTasks.${index}.estimatedHours`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Hours</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="40"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`initialTasks.${index}.priority`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`initialTasks.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Task description and requirements..."
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendTask({ 
                        title: '', 
                        description: '', 
                        estimatedHours: 1, 
                        priority: 'medium', 
                        assignedTo: '' 
                      })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Initial Task
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Deliverables */}
              <TabsContent value="deliverables" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {deliverableFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`deliverables.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Architectural drawings and plans" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDeliverable(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendDeliverable('')}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deliverable
                    </Button>

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Special requirements, constraints, or notes..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Navigation Buttons */}
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {currentStep !== 'basic' && (
                  <Button type="button" variant="outline" onClick={previousStep}>
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {currentStep !== 'deliverables' ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? 'Creating...' : editMode ? 'Update Project' : 'Create Project'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectCreationDialog
