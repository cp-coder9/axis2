import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { EnhancedModalWrapper } from "@/components/ui/enhanced-modal-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Briefcase,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  Sparkles,
  X
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ProjectStatus } from "@/types"

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  clientName: z.string().min(2, "Client name is required"),
  budget: z.number().min(0, "Budget must be positive").optional(),
  allocatedHours: z.number().min(0, "Hours must be positive").optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.nativeEnum(ProjectStatus),
  tags: z.array(z.string()).default([]),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface EnhancedProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: z.output<typeof projectSchema>) => Promise<void>
  existingProjects?: Array<{ name: string }>
}

export function EnhancedProjectCreationDialog({
  isOpen,
  onClose,
  onSubmit,
  existingProjects = [],
}: EnhancedProjectCreationDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [newTag, setNewTag] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])

  const form = useForm<z.input<typeof projectSchema>, any, z.output<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientName: "",
      budget: undefined,
      allocatedHours: undefined,
      startDate: new Date(),
      endDate: undefined,
      status: ProjectStatus.PENDING_APPROVAL,
      tags: [],
    },
  })

  const handleSubmit = async (data: z.output<typeof projectSchema>) => {
    setIsSubmitting(true)
    setError(null)

    // Check for duplicate project names
    const isDuplicate = existingProjects.some(
      (p) => p.name.toLowerCase() === data.name.toLowerCase()
    )

    if (isDuplicate) {
      setError("A project with this name already exists")
      setIsSubmitting(false)
      return
    }

    // Validate end date is after start date
    if (data.endDate && data.endDate < data.startDate) {
      setError("End date must be after start date")
      setIsSubmitting(false)
      return
    }

    try {
      await onSubmit({ ...data, tags })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setTags([])
    setNewTag("")
    setError(null)
    onClose()
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        onClick={form.handleSubmit(handleSubmit)}
        disabled={isSubmitting}
        className="min-w-[140px]"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Creating...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create Project
          </div>
        )}
      </Button>
    </>
  )

  return (
    <EnhancedModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description="Set up a new architectural project with all the essential details"
      variant="glass"
      size="2xl"
      overlayVariant="glass"
      bottomSheetHeight="full"
      footer={footer}
      closeOnOverlayClick={!isSubmitting}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Project Basics */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Project Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Modern Office Complex"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project scope, objectives, and key deliverables..."
                rows={4}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client & Budget */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Client & Budget</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="Client or organization name"
                  {...form.register("clientName")}
                />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    {...form.register("budget", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedHours">Allocated Hours (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="allocatedHours"
                  type="number"
                  placeholder="Total hours allocated"
                  className="pl-9"
                  {...form.register("allocatedHours", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Status */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Timeline & Status</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("startDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("startDate") ? (
                        format(form.watch("startDate"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("startDate")}
                      onSelect={(date) => date && form.setValue("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("endDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("endDate") ? (
                        format(form.watch("endDate"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("endDate")}
                      onSelect={(date) => form.setValue("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.PENDING_APPROVAL}>Planning</SelectItem>
                  <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Project Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag (e.g., residential, commercial)..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </form>
    </EnhancedModalWrapper>
  )
}