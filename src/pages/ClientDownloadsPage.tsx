import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Download,
  FileText,
  Image,
  Archive,
  Eye,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { useState } from 'react'

interface DownloadFile {
  id: string
  name: string
  project: string
  size: string
  type: 'document' | 'image' | 'archive' | 'other'
  downloadedAt: string
  uploadedAt: string
  progress?: number
}

const downloadedFiles: DownloadFile[] = [
  {
    id: '1',
    name: 'Floor_Plans_v3.pdf',
    project: 'Corporate Office Renovation',
    size: '4.2 MB',
    type: 'document',
    downloadedAt: '2024-10-10',
    uploadedAt: '2024-10-08'
  },
  {
    id: '2',
    name: 'Exterior_Renders.zip',
    project: 'Modern Villa Design',
    size: '28.5 MB',
    type: 'archive',
    downloadedAt: '2024-10-09',
    uploadedAt: '2024-10-05'
  },
  {
    id: '3',
    name: 'Material_Specifications.pdf',
    project: 'Modern Villa Design',
    size: '1.8 MB',
    type: 'document',
    downloadedAt: '2024-10-08',
    uploadedAt: '2024-10-01'
  },
  {
    id: '4',
    name: 'Site_Photos_Collection.zip',
    project: 'Corporate Office Renovation',
    size: '45.3 MB',
    type: 'archive',
    downloadedAt: '2024-10-05',
    uploadedAt: '2024-09-28'
  },
  {
    id: '5',
    name: 'Interior_Design_Mockup.jpg',
    project: 'Modern Villa Design',
    size: '6.4 MB',
    type: 'image',
    downloadedAt: '2024-10-03',
    uploadedAt: '2024-09-25'
  }
]

export default function ClientDownloadsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)
  
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Files", href: "/client/files" },
    { title: "Downloads", isActive: true }
  ]

  const getFileIcon = (type: DownloadFile['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />
      case 'archive':
        return <Archive className="h-8 w-8 text-purple-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const handleDownload = (fileId: string) => {
    setDownloading(fileId)
    // Simulate download
    setTimeout(() => {
      setDownloading(null)
    }, 2000)
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
            <h1 className="text-3xl font-bold">Downloads</h1>
            <p className="text-muted-foreground">
              Files you've downloaded from your projects
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Download History</CardTitle>
            <CardDescription>
              {downloadedFiles.length} files in your download history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {downloadedFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-accent">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{file.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{file.size}</span>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {file.project}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-muted-foreground">
                                  Downloaded {new Date(file.downloadedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {file.type === 'image' && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleDownload(file.id)}
                              disabled={downloading === file.id}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {downloading === file.id ? 'Downloading...' : 'Download'}
                            </Button>
                          </div>
                        </div>
                        
                        {downloading === file.id && (
                          <div className="space-y-2">
                            <Progress value={65} className="h-2" />
                            <p className="text-sm text-muted-foreground">Downloading...</p>
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
