import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, DollarSign, Clock, MapPin, Send } from 'lucide-react';

export default function FreelancerAvailableProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock available projects data
  const availableProjects = [
    {
      id: '1',
      title: 'Modern Office Workspace Design',
      client: 'TechCorp Solutions',
      description: 'Design a modern, collaborative workspace for a growing tech company with 50+ employees.',
      budget: 15000,
      duration: '3 months',
      location: 'Cape Town, South Africa',
      skills: ['Interior Design', 'Space Planning', '3D Modeling'],
      status: 'open',
      applicants: 5
    },
    {
      id: '2',
      title: 'Luxury Residential Renovation',
      client: 'Private Client',
      description: 'Complete renovation of a 4-bedroom luxury home including interior design and architectural plans.',
      budget: 25000,
      duration: '6 months',
      location: 'Johannesburg, South Africa',
      skills: ['Residential Design', 'Architecture', 'Project Management'],
      status: 'open',
      applicants: 8
    },
    {
      id: '3',
      title: 'Retail Store Layout Design',
      client: 'Fashion Forward',
      description: 'Design an engaging retail space that enhances customer experience and product display.',
      budget: 10000,
      duration: '2 months',
      location: 'Durban, South Africa',
      skills: ['Retail Design', 'Visual Merchandising', 'CAD'],
      status: 'open',
      applicants: 3
    },
    {
      id: '4',
      title: 'Restaurant Interior Concept',
      client: 'Gourmet Dining Co',
      description: 'Create a sophisticated dining atmosphere with custom furniture and lighting design.',
      budget: 12000,
      duration: '4 months',
      location: 'Pretoria, South Africa',
      skills: ['Restaurant Design', 'Lighting Design', 'Custom Furniture'],
      status: 'open',
      applicants: 6
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Available Projects</h1>
        <p className="text-muted-foreground">
          Browse and apply to new project opportunities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Available Projects List */}
      <div className="space-y-4">
        {availableProjects.map((project) => (
          <Card key={project.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {project.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {project.client}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Budget:</span>
                  <span className="text-muted-foreground">R {project.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Duration:</span>
                  <span className="text-muted-foreground">{project.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span className="text-muted-foreground">{project.location}</span>
                </div>
              </div>

              {/* Skills Required */}
              <div>
                <p className="text-sm font-medium mb-2">Required Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {project.applicants} applicants
                </p>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {availableProjects.length === 0 && (
        <Card>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available projects at the moment</p>
              <p className="text-sm mt-2">Check back later for new opportunities</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
