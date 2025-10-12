import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Download,
  CheckCircle2,
  Calendar
} from 'lucide-react'

interface CompletedProject {
  id: string
  name: string
  description: string
  completedDate: string
  leadArchitect: string
  budget: number
  finalCost: number
  rating?: number
}

const completedProjects: CompletedProject[] = [
  {
    id: '1',
    name: 'Residential Complex',
    description: 'Multi-unit residential development with modern amenities',
    completedDate: '2024-09-15',
    leadArchitect: 'David Miller',
    budget: 850000,
    finalCost: 820000,
    rating: 5
  },
  {
    id: '2',
    name: 'Beachfront Restaurant',
    description: 'Coastal restaurant with panoramic ocean views',
    completedDate: '2024-07-20',
    leadArchitect: 'Emily Rodriguez',
    budget: 280000,
    finalCost: 275000,
    rating: 5
  },
  {
    id: '3',
    name: 'Urban Loft Conversion',
    description: 'Industrial space converted to modern loft apartments',
    completedDate: '2024-05-10',
    leadArchitect: 'Sarah Johnson',
    budget: 420000,
    finalCost: 435000,
    rating: 4
  }
]

export default function ClientCompletedProjectsPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Projects", href: "/client/projects" },
    { title: "Completed Projects", isActive: true }
  ]

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Completed Projects</h1>
            <p className="text-muted-foreground">
              {completedProjects.length} projects successfully completed
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {completedProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{project.name}</CardTitle>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Completed Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {new Date(project.completedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lead Architect</p>
                    <p className="text-sm font-medium">{project.leadArchitect}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Budget / Final Cost</p>
                    <p className="text-sm font-medium">
                      ${project.budget.toLocaleString()} / ${project.finalCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Your Rating</p>
                    <div className="flex items-center gap-1">
                      {project.rating && (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < project.rating! ? 'text-yellow-500' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
