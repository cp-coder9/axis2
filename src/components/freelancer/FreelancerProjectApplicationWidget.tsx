"use client"

import { useState } from "react"
import {
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Star,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppContext } from "@/contexts/AppContext"
import { cn } from "@/lib/utils"

interface AvailableProject {
  id: string
  title: string
  description: string
  client: string
  location?: string
  budget: {
    min: number
    max: number
    type: 'hourly' | 'fixed'
  }
  duration: {
    estimated: number
    unit: 'hours' | 'days' | 'weeks'
  }
  skills: string[]
  urgency: 'low' | 'medium' | 'high'
  postedDate: Date
  deadline?: Date
  applicants: number
  maxApplicants?: number
  status: 'open' | 'in_review' | 'closed'
}

interface ProjectApplication {
  id: string
  projectId: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  appliedDate: Date
  coverLetter: string
  proposedRate: number
  estimatedHours?: number
}

interface FreelancerProjectApplicationWidgetProps {
  className?: string
  showApplications?: boolean
}

export function FreelancerProjectApplicationWidget({ 
  className,
  showApplications = false 
}: FreelancerProjectApplicationWidgetProps) {
  const { user } = useAppContext()
  const [selectedProject, setSelectedProject] = useState<AvailableProject | null>(null)
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [proposedRate, setProposedRate] = useState(user?.hourlyRate || 75)
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for available projects
  const availableProjects: AvailableProject[] = [
    {
      id: "proj-1",
      title: "Hotel Lobby Renovation",
      description: "Looking for experienced architect for luxury hotel lobby design. The project involves creating modern, elegant spaces that blend functionality with aesthetic appeal.",
      client: "Luxury Hotels Group",
      location: "New York, NY",
      budget: { min: 80, max: 95, type: 'hourly' },
      duration: { estimated: 40, unit: 'hours' },
      skills: ["Interior Design", "3D Modeling", "AutoCAD", "Hospitality Design"],
      urgency: 'medium',
      postedDate: new Date('2024-12-10'),
      deadline: new Date('2024-12-25'),
      applicants: 8,
      maxApplicants: 15,
      status: 'open'
    },
    {
      id: "proj-2", 
      title: "Sustainable Housing Project",
      description: "Eco-friendly residential development planning with focus on sustainable materials and energy efficiency. Looking for architects with green building experience.",
      client: "EcoHomes Development",
      location: "Portland, OR",
      budget: { min: 85, max: 100, type: 'hourly' },
      duration: { estimated: 60, unit: 'hours' },
      skills: ["Sustainable Design", "LEED Certification", "Residential Architecture", "Environmental Planning"],
      urgency: 'high',
      postedDate: new Date('2024-12-08'),
      deadline: new Date('2024-12-20'),
      applicants: 12,
      maxApplicants: 10,
      status: 'in_review'
    },
    {
      id: "proj-3",
      title: "Corporate Campus Design", 
      description: "Modern office complex with collaborative spaces, wellness areas, and flexible work environments. Seeking innovative architectural solutions.",
      client: "TechCorp Industries",
      location: "Austin, TX",
      budget: { min: 90, max: 110, type: 'hourly' },
      duration: { estimated: 80, unit: 'hours' },
      skills: ["Commercial Architecture", "Workplace Design", "Space Planning", "BIM"],
      urgency: 'low',
      postedDate: new Date('2024-12-05'),
      deadline: new Date('2025-01-15'),
      applicants: 5,
      maxApplicants: 20,
      status: 'open'
    }
  ]

  // Mock data for user's applications
  const userApplications: ProjectApplication[] = [
    {
      id: "app-1",
      projectId: "proj-4",
      status: 'pending',
      appliedDate: new Date('2024-12-12'),
      coverLetter: "I am excited to apply for this residential project...",
      proposedRate: 85,
      estimatedHours: 45
    },
    {
      id: "app-2", 
      projectId: "proj-5",
      status: 'accepted',
      appliedDate: new Date('2024-12-10'),
      coverLetter: "With my experience in commercial architecture...",
      proposedRate: 95,
      estimatedHours: 60
    }
  ]

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'withdrawn': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleApplyToProject = async (project: AvailableProject) => {
    setSelectedProject(project)
    setApplicationDialogOpen(true)
    setCoverLetter("")
    setProposedRate(user?.hourlyRate || 75)
    setEstimatedHours(project.duration.estimated)
  }

  const handleSubmitApplication = async () => {
    if (!selectedProject || !coverLetter.trim()) return

    setIsSubmitting(true)
    
    try {
      // Mock API call - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Submitting application:', {
        projectId: selectedProject.id,
        coverLetter,
        proposedRate,
        estimatedHours
      })

      setApplicationDialogOpen(false)
      // Show success message or update UI
    } catch (error) {
      console.error('Failed to submit application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showApplications) {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applications submitted yet</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/freelancer/projects/available">Browse Projects</a>
              </Button>
            </div>
          ) : (
            userApplications.map((application) => (
              <div key={application.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">Project Application #{application.id}</h4>
                    <p className="text-sm text-muted-foreground">
                      Applied on {application.appliedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className={getApplicationStatusColor(application.status)}>
                    {getApplicationStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status}</span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Proposed Rate:</span>
                    <span className="ml-2 font-medium">${application.proposedRate}/hr</span>
                  </div>
                  {application.estimatedHours && (
                    <div>
                      <span className="text-muted-foreground">Est. Hours:</span>
                      <span className="ml-2 font-medium">{application.estimatedHours}h</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {application.status === 'pending' && (
                    <Button size="sm" variant="outline">
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Available Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableProjects.map((project) => (
            <div key={project.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{project.title}</h4>
                    <Badge variant="outline" className={getUrgencyColor(project.urgency)}>
                      {project.urgency} priority
                    </Badge>
                    <Badge variant="secondary" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{project.client}</p>
                  {project.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description}
              </p>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${project.budget.min}-${project.budget.max}/{project.budget.type === 'hourly' ? 'hr' : 'project'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{project.duration.estimated} {project.duration.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{project.applicants} applicants</span>
                </div>
                {project.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due {project.deadline.toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {project.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {project.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.skills.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Application Progress */}
              {project.maxApplicants && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Applications</span>
                    <span>{project.applicants} / {project.maxApplicants}</span>
                  </div>
                  <Progress value={(project.applicants / project.maxApplicants) * 100} className="h-1" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleApplyToProject(project)}
                  disabled={project.status !== 'open'}
                  className="flex-1"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Apply Now
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}

          <div className="text-center pt-4">
            <Button variant="outline" asChild>
              <a href="/freelancer/projects/available">
                View All Available Projects
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Application Dialog */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply to Project</DialogTitle>
            <DialogDescription>
              Submit your application for "{selectedProject?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Summary */}
            {selectedProject && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">{selectedProject.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{selectedProject.client}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>${selectedProject.budget.min}-${selectedProject.budget.max}/hr</span>
                  <span>{selectedProject.duration.estimated} {selectedProject.duration.unit}</span>
                </div>
              </div>
            )}

            {/* Application Form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposedRate">Proposed Hourly Rate ($)</Label>
                <Input
                  id="proposedRate"
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(Number(e.target.value))}
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours (optional)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={estimatedHours || ''}
                  onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                placeholder="Explain why you're the right fit for this project..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {coverLetter.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplicationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitApplication}
              disabled={!coverLetter.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}