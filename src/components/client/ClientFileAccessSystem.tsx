import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  FolderOpen,
  Image,
  Archive,
  File,
  ExternalLink,
  Share,
  Star,
  Clock
} from 'lucide-react'

interface ProjectFile {
  id: string
  name: string
  type: 'document' | 'image' | 'archive' | 'other'
  size: string
  uploadedAt: string
  uploadedBy: string
  projectId: string
  projectName: string
  category: 'deliverables' | 'references' | 'progress' | 'specifications' | 'presentations'
  permissions: 'CLIENT_VISIBLE' | 'PROJECT_TEAM' | 'ADMIN_ONLY'
  description?: string
  version?: string
  tags: string[]
  cloudinaryUrl?: string
  thumbnailUrl?: string
  isStarred?: boolean
  downloadCount?: number
  lastAccessed?: string
}

interface ClientFileAccessSystemProps {
  files?: ProjectFile[]
  onDownloadFile?: (fileId: string) => Promise<void>
  onPreviewFile?: (fileId: string) => Promise<string>
  onStarFile?: (fileId: string, starred: boolean) => Promise<void>
  onShareFile?: (fileId: string) => void
}

const defaultFiles: ProjectFile[] = [
  {
    id: '1',
    name: 'Floor Plans v3.2.pdf',
    type: 'document',
    size: '2.4 MB',
    uploadedAt: '2024-01-15T10:30:00Z',
    uploadedBy: 'Sarah Johnson',
    projectId: '1',
    projectName: 'Office Redesign',
    category: 'deliverables',
    permissions: 'CLIENT_VISIBLE',
    description: 'Updated floor plans incorporating client feedback from design review meeting',
    version: '3.2',
    tags: ['floor-plans', 'final', 'approved'],
    isStarred: true,
    downloadCount: 5,
    lastAccessed: '2024-01-15T14:20:00Z'
  },
  {
    id: '2',
    name: '3D Renderings - Living Areas.zip',
    type: 'archive',
    size: '15.7 MB',
    uploadedAt: '2024-01-14T16:45:00Z',
    uploadedBy: 'Michael Chen',
    projectId: '2',
    projectName: 'Residential Complex',
    category: 'presentations',
    permissions: 'CLIENT_VISIBLE',
    description: 'High-resolution 3D renderings of living areas and common spaces',
    version: '1.0',
    tags: ['3d-rendering', 'visualization', 'living-areas'],
    downloadCount: 3,
    lastAccessed: '2024-01-14T18:00:00Z'
  },
  {
    id: '3',
    name: 'Material Specifications.docx',
    type: 'document',
    size: '1.8 MB',
    uploadedAt: '2024-01-13T09:15:00Z',
    uploadedBy: 'Sarah Johnson',
    projectId: '1',
    projectName: 'Office Redesign',
    category: 'specifications',
    permissions: 'CLIENT_VISIBLE',
    description: 'Detailed specifications for all materials and finishes',
    version: '2.1',
    tags: ['materials', 'specifications', 'finishes'],
    downloadCount: 2,
    lastAccessed: '2024-01-13T11:30:00Z'
  },
  {
    id: '4',
    name: 'Progress Report - Week 12.pdf',
    type: 'document',
    size: '892 KB',
    uploadedAt: '2024-01-12T17:00:00Z',
    uploadedBy: 'Admin Team',
    projectId: '2',
    projectName: 'Residential Complex',
    category: 'progress',
    permissions: 'CLIENT_VISIBLE',
    description: 'Weekly progress report with milestone updates and next steps',
    version: '1.0',
    tags: ['progress', 'weekly-report', 'milestones'],
    downloadCount: 1,
    lastAccessed: '2024-01-12T17:30:00Z'
  },
  {
    id: '5',
    name: 'Site Photos - January.jpg',
    type: 'image',
    size: '3.2 MB',
    uploadedAt: '2024-01-11T14:20:00Z',
    uploadedBy: 'Construction Team',
    projectId: '1',
    projectName: 'Office Redesign',
    category: 'progress',
    permissions: 'CLIENT_VISIBLE',
    description: 'Current site conditions and construction progress photos',
    tags: ['site-photos', 'progress', 'construction'],
    thumbnailUrl: '/api/files/5/thumbnail',
    downloadCount: 4,
    lastAccessed: '2024-01-11T16:45:00Z'
  }
]

export function ClientFileAccessSystem({
  files = defaultFiles,
  onDownloadFile,
  onPreviewFile,
  onStarFile,
  onShareFile
}: ClientFileAccessSystemProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [projectFilter, setProjectFilter] = React.useState<string>('all')
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size' | 'downloads'>('date')
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
  const [selectedFile, setSelectedFile] = React.useState<ProjectFile | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string>('')

  // Filter files to only show CLIENT_VISIBLE files
  const clientVisibleFiles = files.filter(file => file.permissions === 'CLIENT_VISIBLE')

  const filteredFiles = clientVisibleFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
    const matchesProject = projectFilter === 'all' || file.projectId === projectFilter
    return matchesSearch && matchesCategory && matchesProject
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      case 'size':
        return parseFloat(b.size) - parseFloat(a.size)
      case 'downloads':
        return (b.downloadCount || 0) - (a.downloadCount || 0)
      default:
        return 0
    }
  })

  const uniqueProjects = Array.from(new Set(clientVisibleFiles.map(f => f.projectId)))
    .map(id => ({
      id,
      name: clientVisibleFiles.find(f => f.projectId === id)?.projectName || ''
    }))

  const getFileIcon = (type: ProjectFile['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'image':
        return <Image className="h-5 w-5 text-green-600" />
      case 'archive':
        return <Archive className="h-5 w-5 text-purple-600" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const getCategoryColor = (category: ProjectFile['category']) => {
    switch (category) {
      case 'deliverables':
        return 'bg-green-100 text-green-800'
      case 'references':
        return 'bg-blue-100 text-blue-800'
      case 'progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'specifications':
        return 'bg-purple-100 text-purple-800'
      case 'presentations':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (size: string) => {
    return size
  }

  const handleDownload = async (file: ProjectFile) => {
    try {
      await onDownloadFile?.(file.id)
      // In a real app, this would trigger the actual download
      console.log('Downloading file:', file.name)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const handlePreview = async (file: ProjectFile) => {
    try {
      const url = await onPreviewFile?.(file.id)
      if (url) {
        setPreviewUrl(url)
        setSelectedFile(file)
      }
    } catch (error) {
      console.error('Failed to preview file:', error)
    }
  }

  const handleStar = async (file: ProjectFile) => {
    try {
      await onStarFile?.(file.id, !file.isStarred)
      // Update local state (in real app, this would come from server)
      console.log('Toggling star for file:', file.name)
    } catch (error) {
      console.error('Failed to star file:', error)
    }
  }

  const getFileStats = () => {
    const totalFiles = clientVisibleFiles.length
    const totalSize = clientVisibleFiles.reduce((sum, file) => {
      const sizeNum = parseFloat(file.size.replace(/[^\d.]/g, ''))
      const unit = file.size.replace(/[\d.\s]/g, '').toLowerCase()
      const multiplier = unit === 'gb' ? 1024 : unit === 'kb' ? 0.001 : 1
      return sum + (sizeNum * multiplier)
    }, 0)
    
    return {
      totalFiles,
      totalSize: totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(1)} MB`,
      starredFiles: clientVisibleFiles.filter(f => f.isStarred).length
    }
  }

  const stats = getFileStats()

  return (
    <div className="space-y-6">
      {/* File Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Available to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSize}</div>
            <p className="text-xs text-muted-foreground">
              Storage used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Starred Files</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.starredFiles}</div>
            <p className="text-xs text-muted-foreground">
              Your favorites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search files, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="deliverables">Deliverables</SelectItem>
              <SelectItem value="references">References</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="specifications">Specifications</SelectItem>
              <SelectItem value="presentations">Presentations</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="downloads">Downloads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
          <CardDescription>
            Files shared with you by your project teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedFiles.length > 0 ? (
            <div className="space-y-3">
              {sortedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{file.name}</h4>
                        {file.isStarred && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        <Badge className={getCategoryColor(file.category)}>
                          {file.category}
                        </Badge>
                        {file.version && (
                          <Badge variant="outline" className="text-xs">
                            v{file.version}
                          </Badge>
                        )}
                      </div>
                      
                      {file.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {file.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {file.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(file.uploadedAt)}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {file.projectName}
                        </span>
                        {file.downloadCount && (
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {file.downloadCount} downloads
                          </span>
                        )}
                      </div>
                      
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStar(file)}
                    >
                      <Star className={`h-4 w-4 ${file.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                    
                    {file.type === 'image' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShareFile?.(file.id)}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No files have been shared with you yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>
              {selectedFile?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFile && (
            <div className="space-y-4">
              {selectedFile.type === 'image' && previewUrl && (
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt={selectedFile.name}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(selectedFile.category)}>
                      {selectedFile.category}
                    </Badge>
                    {selectedFile.version && (
                      <Badge variant="outline">v{selectedFile.version}</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Uploaded by {selectedFile.uploadedBy}</p>
                    <p>Size: {selectedFile.size}</p>
                    <p>Project: {selectedFile.projectName}</p>
                  </div>
                </div>
                
                <Button onClick={() => handleDownload(selectedFile)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}