import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  Image,
  Download,
  Eye,
  Share,
  Users
} from 'lucide-react'

interface SharedDocument {
  id: string
  name: string
  project: string
  size: string
  type: 'document' | 'image' | 'archive' | 'other'
  sharedBy: string
  sharedDate: string
  accessLevel: 'view' | 'download' | 'full'
  viewers: number
}

const sharedDocuments: SharedDocument[] = [
  {
    id: '1',
    name: 'Project_Overview_Q4.pdf',
    project: 'Corporate Office Renovation',
    size: '2.1 MB',
    type: 'document',
    sharedBy: 'Michael Chen',
    sharedDate: '2024-10-12',
    accessLevel: 'full',
    viewers: 8
  },
  {
    id: '2',
    name: 'Design_Concepts.pdf',
    project: 'Modern Villa Design',
    size: '5.3 MB',
    type: 'document',
    sharedBy: 'Sarah Johnson',
    sharedDate: '2024-10-10',
    accessLevel: 'download',
    viewers: 12
  },
  {
    id: '3',
    name: 'Final_Renders_Collection.pdf',
    project: 'Modern Villa Design',
    size: '12.8 MB',
    type: 'document',
    sharedBy: 'Sarah Johnson',
    sharedDate: '2024-10-08',
    accessLevel: 'view',
    viewers: 15
  },
  {
    id: '4',
    name: 'Budget_Analysis.pdf',
    project: 'Corporate Office Renovation',
    size: '890 KB',
    type: 'document',
    sharedBy: 'David Miller',
    sharedDate: '2024-10-05',
    accessLevel: 'full',
    viewers: 6
  },
  {
    id: '5',
    name: 'Timeline_Update.pdf',
    project: 'Modern Villa Design',
    size: '1.2 MB',
    type: 'document',
    sharedBy: 'Sarah Johnson',
    sharedDate: '2024-10-03',
    accessLevel: 'download',
    viewers: 10
  }
]

export default function ClientSharedDocumentsPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Files", href: "/client/files" },
    { title: "Shared Documents", isActive: true }
  ]

  const getFileIcon = (type: SharedDocument['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const getAccessBadgeColor = (accessLevel: SharedDocument['accessLevel']) => {
    switch (accessLevel) {
      case 'full':
        return 'bg-green-100 text-green-800'
      case 'download':
        return 'bg-blue-100 text-blue-800'
      case 'view':
        return 'bg-gray-100 text-gray-800'
    }
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
            <h1 className="text-3xl font-bold">Shared Documents</h1>
            <p className="text-muted-foreground">
              Documents shared with you by your project teams
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Shared Documents</CardTitle>
            <CardDescription>
              {sharedDocuments.length} documents shared with you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-accent">
                        {getFileIcon(doc.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{doc.name}</h3>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-muted-foreground">{doc.size}</span>
                              <span className="text-muted-foreground">•</span>
                              <Badge variant="secondary" className="text-xs">
                                {doc.project}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                              <Badge className={getAccessBadgeColor(doc.accessLevel)}>
                                {doc.accessLevel === 'full' ? 'Full Access' : doc.accessLevel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Shared by {doc.sharedBy}</span>
                              <span>•</span>
                              <span>{new Date(doc.sharedDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{doc.viewers} viewers</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            {(doc.accessLevel === 'download' || doc.accessLevel === 'full') && (
                              <Button variant="default" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                            {doc.accessLevel === 'full' && (
                              <Button variant="outline" size="sm">
                                <Share className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
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
