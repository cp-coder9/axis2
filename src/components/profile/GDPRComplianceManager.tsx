import React, { useState, useEffect } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Database,
  Trash2,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface GDPRDataCategory {
  category: string
  description: string
  dataTypes: string[]
  retentionPeriod: string
  canBeDeleted: boolean
  size: string
}

interface GDPRComplianceManagerProps {
  targetUser: User
  currentUser: User
  onDataExported?: (category: string, data: any) => void
  onDataDeleted?: (category: string) => void
}

export function GDPRComplianceManager({ 
  targetUser, 
  currentUser, 
  onDataExported, 
  onDataDeleted 
}: GDPRComplianceManagerProps) {
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedCategories, setExportedCategories] = useState<Set<string>>(new Set())

  // GDPR data categories for the user
  const dataCategories: GDPRDataCategory[] = [
    {
      category: 'Profile Information',
      description: 'Basic profile data, contact information, and account settings',
      dataTypes: ['Name', 'Email', 'Phone', 'Company', 'Title', 'Avatar', 'Preferences'],
      retentionPeriod: 'Until account deletion',
      canBeDeleted: true,
      size: '< 1 MB'
    },
    {
      category: 'Time Tracking Data',
      description: 'Timer logs, work sessions, and time-based earnings',
      dataTypes: ['Timer logs', 'Work sessions', 'Duration records', 'Substantiation files'],
      retentionPeriod: '7 years (tax compliance)',
      canBeDeleted: false,
      size: '~5 MB'
    },
    {
      category: 'Project Data',
      description: 'Project assignments, job cards, and collaboration history',
      dataTypes: ['Project assignments', 'Job cards', 'Task completion', 'Team memberships'],
      retentionPeriod: '5 years (business records)',
      canBeDeleted: false,
      size: '~2 MB'
    },
    {
      category: 'Communication Data',
      description: 'Messages, chat history, and project communications',
      dataTypes: ['Messages', 'Chat history', 'File attachments', 'Typing indicators'],
      retentionPeriod: '3 years (communication records)',
      canBeDeleted: true,
      size: '~10 MB'
    },
    {
      category: 'File Data',
      description: 'Uploaded files, documents, and media content',
      dataTypes: ['Uploaded files', 'Document metadata', 'File permissions', 'Version history'],
      retentionPeriod: 'Project lifetime + 2 years',
      canBeDeleted: true,
      size: '~50 MB'
    },
    {
      category: 'Audit Logs',
      description: 'Security logs, access records, and system interactions',
      dataTypes: ['Login history', 'Action logs', 'Security events', 'Permission changes'],
      retentionPeriod: '10 years (security compliance)',
      canBeDeleted: false,
      size: '~1 MB'
    }
  ]

  // Check if user can access GDPR features
  const canAccessGDPR = currentUser.role === UserRole.ADMIN || targetUser.id === currentUser.id

  // Export specific data category
  const exportDataCategory = async (category: GDPRDataCategory) => {
    try {
      setIsExporting(true)
      
      // Simulate data collection and export
      const exportData = {
        category: category.category,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        },
        dataTypes: category.dataTypes,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.id,
        gdprCompliant: true,
        retentionInfo: {
          period: category.retentionPeriod,
          canBeDeleted: category.canBeDeleted
        },
        // In a real implementation, this would contain actual user data
        data: generateMockDataForCategory(category)
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `gdpr-export-${category.category.toLowerCase().replace(/\s+/g, '-')}-${targetUser.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Update exported categories
      setExportedCategories(prev => new Set([...prev, category.category]))
      
      toast.success(`${category.category} data exported successfully`)
      onDataExported?.(category.category, exportData)
    } catch (error) {
      console.error('Error exporting data category:', error)
      toast.error(`Failed to export ${category.category} data`)
    } finally {
      setIsExporting(false)
    }
  }

  // Export all user data
  const exportAllData = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)

      const allData = {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        },
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.id,
        gdprCompliant: true,
        categories: {}
      }

      // Export each category with progress updates
      for (let i = 0; i < dataCategories.length; i++) {
        const category = dataCategories[i]
        allData.categories[category.category] = generateMockDataForCategory(category)
        
        setExportProgress(((i + 1) / dataCategories.length) * 100)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Create comprehensive export file
      const dataStr = JSON.stringify(allData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `gdpr-complete-export-${targetUser.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Mark all categories as exported
      setExportedCategories(new Set(dataCategories.map(c => c.category)))
      
      toast.success('Complete GDPR data export completed')
    } catch (error) {
      console.error('Error exporting all data:', error)
      toast.error('Failed to export complete data')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  // Generate mock data for demonstration
  const generateMockDataForCategory = (category: GDPRDataCategory) => {
    switch (category.category) {
      case 'Profile Information':
        return {
          profile: {
            name: targetUser.name,
            email: targetUser.email,
            phone: targetUser.phone,
            company: targetUser.company,
            title: targetUser.title,
            role: targetUser.role,
            createdAt: targetUser.createdAt,
            lastActive: targetUser.lastActive
          }
        }
      case 'Time Tracking Data':
        return {
          timeLogs: [
            { date: '2024-01-15', duration: 480, project: 'Project A' },
            { date: '2024-01-16', duration: 360, project: 'Project B' }
          ],
          totalHours: 14.0,
          totalEarnings: 1400
        }
      default:
        return {
          message: `Mock data for ${category.category}`,
          recordCount: Math.floor(Math.random() * 100) + 1
        }
    }
  }

  if (!canAccessGDPR) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            GDPR Access Restricted
          </CardTitle>
          <CardDescription>
            You can only access GDPR data export for your own profile or as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* GDPR Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR Data Management
          </CardTitle>
          <CardDescription>
            Export and manage personal data in compliance with GDPR regulations for {targetUser.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-1">
              <h4 className="font-medium">Complete Data Export</h4>
              <p className="text-sm text-muted-foreground">
                Export all personal data across all categories
              </p>
            </div>
            <Button 
              onClick={exportAllData} 
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>
          
          {isExporting && exportProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Export Progress</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Data Categories</CardTitle>
          <CardDescription>
            Individual data categories with retention policies and export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataCategories.map((category, index) => (
              <div key={category.category}>
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{category.category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {category.size}
                        </Badge>
                        {exportedCategories.has(category.category) && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exported
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.dataTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportDataCategory(category)}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Retention:</span>
                      <span>{category.retentionPeriod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.canBeDeleted ? (
                        <Trash2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Database className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-muted-foreground">Deletion:</span>
                      <span>{category.canBeDeleted ? 'Allowed' : 'Restricted'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Access:</span>
                      <span>GDPR Compliant</span>
                    </div>
                  </div>
                </div>
                {index < dataCategories.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GDPR Rights Information */}
      <Card>
        <CardHeader>
          <CardTitle>GDPR Rights</CardTitle>
          <CardDescription>
            Your rights under the General Data Protection Regulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Data Subject Rights</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Right to access personal data</li>
                <li>• Right to rectification (correction)</li>
                <li>• Right to erasure ("right to be forgotten")</li>
                <li>• Right to restrict processing</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Data Portability</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Export data in machine-readable format</li>
                <li>• Transfer data to another service</li>
                <li>• Receive data without hindrance</li>
                <li>• Structured, commonly used format</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}