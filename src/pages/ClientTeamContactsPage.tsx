import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Phone,
  Video,
  Mail,
  MessageSquare,
  User
} from 'lucide-react'
import { useState } from 'react'

interface TeamContact {
  id: string
  name: string
  role: string
  email: string
  phone?: string
  avatar: string
  projects: string[]
  status: 'online' | 'offline' | 'busy'
}

const teamContacts: TeamContact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Lead Architect',
    email: 'sarah.johnson@architex.com',
    phone: '+1 (555) 123-4567',
    avatar: 'SJ',
    projects: ['Modern Villa Design', 'Urban Loft Conversion'],
    status: 'online'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Senior Architect',
    email: 'michael.chen@architex.com',
    phone: '+1 (555) 234-5678',
    avatar: 'MC',
    projects: ['Corporate Office Renovation'],
    status: 'online'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Interior Designer',
    email: 'emily.rodriguez@architex.com',
    phone: '+1 (555) 345-6789',
    avatar: 'ER',
    projects: ['Modern Villa Design', 'Beachfront Restaurant'],
    status: 'busy'
  },
  {
    id: '4',
    name: 'David Miller',
    role: 'Project Manager',
    email: 'david.miller@architex.com',
    phone: '+1 (555) 456-7890',
    avatar: 'DM',
    projects: ['Residential Complex', 'Corporate Office Renovation'],
    status: 'offline'
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    role: 'Structural Engineer',
    email: 'lisa.anderson@architex.com',
    avatar: 'LA',
    projects: ['Modern Villa Design'],
    status: 'online'
  }
]

export default function ClientTeamContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Communication", href: "/client/messages" },
    { title: "Team Contacts", isActive: true }
  ]

  const filteredContacts = teamContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.projects.some(project => project.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusColor = (status: TeamContact['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
    }
  }

  const getAvatarColor = (avatar: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500'
    ]
    const index = avatar.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Contacts</h1>
            <p className="text-muted-foreground">
              Connect with your project team members
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Contacts</CardTitle>
                <CardDescription>
                  {filteredContacts.length} team members available
                </CardDescription>
              </div>
              <div className="w-full max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${getAvatarColor(contact.avatar)}`}>
                          {contact.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(contact.status)}`} />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{contact.name}</h3>
                            <p className="text-sm text-muted-foreground">{contact.role}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {contact.projects.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {contact.projects.map((project) => (
                              <Badge key={project} variant="secondary" className="text-xs">
                                {project}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  )
}
