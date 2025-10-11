import React, { useState, useRef } from 'react'
import { User } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Save,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  exportProfileToJSON,
  exportProfileToCSV,
  downloadProfileData,
  importProfileFromJSON,
  importProfileFromCSV,
  createProfileBackup,
  restoreProfileFromBackup,
  saveBackupToLocalStorage,
  getBackupsFromLocalStorage,
  deleteBackupFromLocalStorage,
  ProfileBackup
} from '../../services/profileExportImportService'

interface ProfileExportImportProps {
  user: User
  onImport: (data: Partial<User>) => Promise<void>
}

export function ProfileExportImport({
  user,
  onImport
}: ProfileExportImportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [backups, setBackups] = useState<ProfileBackup[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = () => {
    const storedBackups = getBackupsFromLocalStorage()
    setBackups(storedBackups.filter(b => b.userId === user.id))
  }

  const handleExportJSON = () => {
    try {
      setIsExporting(true)
      const jsonData = exportProfileToJSON(user, false)
      const filename = `profile_${user.name.replace(/\s+/g, '_')}_${Date.now()}`
      downloadProfileData(jsonData, filename, 'json')
      toast.success('Profile exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export profile')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    try {
      setIsExporting(true)
      const csvData = exportProfileToCSV(user, false)
      const filename = `profile_${user.name.replace(/\s+/g, '_')}_${Date.now()}`
      downloadProfileData(csvData, filename, 'csv')
      toast.success('Profile exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export profile')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportErrors([])
    setImportWarnings([])

    try {
      const fileContent = await file.text()
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      let importResult
      if (fileExtension === 'json') {
        importResult = importProfileFromJSON(fileContent, user)
      } else if (fileExtension === 'csv') {
        importResult = importProfileFromCSV(fileContent, user)
      } else {
        toast.error('Unsupported file format. Please use JSON or CSV.')
        return
      }

      setImportErrors(importResult.errors)
      setImportWarnings(importResult.warnings)

      if (importResult.success && importResult.importedData) {
        await onImport(importResult.importedData)
        toast.success('Profile imported successfully')
        
        if (importResult.warnings.length > 0) {
          toast.warning(`Import completed with ${importResult.warnings.length} warning(s)`)
        }
      } else {
        toast.error('Import failed. Please check the errors below.')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import profile')
      setImportErrors(['An unexpected error occurred during import'])
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreateBackup = () => {
    try {
      const backup = createProfileBackup(user)
      saveBackupToLocalStorage(backup)
      loadBackups()
      toast.success('Backup created successfully')
    } catch (error) {
      console.error('Backup error:', error)
      toast.error('Failed to create backup')
    }
  }

  const handleRestoreBackup = async (backup: ProfileBackup) => {
    try {
      const restoreResult = restoreProfileFromBackup(backup, user)
      
      if (restoreResult.success && restoreResult.importedData) {
        await onImport(restoreResult.importedData)
        toast.success('Profile restored from backup')
        
        if (restoreResult.warnings.length > 0) {
          toast.warning(`Restore completed with ${restoreResult.warnings.length} warning(s)`)
        }
      } else {
        toast.error('Failed to restore backup')
        setImportErrors(restoreResult.errors)
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('Failed to restore backup')
    }
  }

  const handleDeleteBackup = (backupId: string) => {
    try {
      deleteBackupFromLocalStorage(backupId)
      loadBackups()
      toast.success('Backup deleted')
    } catch (error) {
      console.error('Delete backup error:', error)
      toast.error('Failed to delete backup')
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Profile
          </CardTitle>
          <CardDescription>
            Download your profile data in JSON or CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="flex-1"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
            
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              variant="outline"
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sensitive data (email, phone, rates) will be masked in exports for security.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Profile
          </CardTitle>
          <CardDescription>
            Import profile data from a previously exported file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Select File to Import'}
          </Button>

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Import Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Warnings */}
          {importWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Import Warnings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importWarnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only non-sensitive fields will be imported. Email and role cannot be changed through import.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Separator />

      {/* Backup & Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Create and manage profile backups locally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCreateBackup}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Create Backup Now
          </Button>

          {backups.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Available Backups:</p>
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(backup.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Version {backup.version}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreBackup(backup)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No backups available. Create your first backup to enable quick profile restoration.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backups are stored locally in your browser. Up to 5 recent backups are kept.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
