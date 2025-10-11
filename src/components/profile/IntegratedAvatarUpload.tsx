import React, { useState, useCallback } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Eye, 
  Sparkles, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// Import our avatar components
import { AvatarUploadSystem } from './AvatarUploadSystem'
import { AvatarPreviewManager } from './AvatarPreviewManager'
import { FallbackAvatarGenerator } from './FallbackAvatarGenerator'
import { ImageCropperModal } from './ImageCropperModal'

interface IntegratedAvatarUploadProps {
  user: User
  currentUser: User
  onAvatarUpdated?: (avatarUrl: string) => void
  onAvatarDeleted?: () => void
  showAllFeatures?: boolean
}

interface AvatarUploadState {
  isUploading: boolean
  showCropper: boolean
  selectedImageUrl: string | null
  uploadProgress: number
  error: string | null
}

export function IntegratedAvatarUpload({
  user,
  currentUser,
  onAvatarUpdated,
  onAvatarDeleted,
  showAllFeatures = true
}: IntegratedAvatarUploadProps) {
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [uploadState, setUploadState] = useState<AvatarUploadState>({
    isUploading: false,
    showCropper: false,
    selectedImageUrl: null,
    uploadProgress: 0,
    error: null
  })

  // Check permissions
  const canManageAvatar = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isOwnProfile = user.id === currentUser.id

  // Handle avatar update from any component
  const handleAvatarUpdate = useCallback((avatarUrl: string) => {
    onAvatarUpdated?.(avatarUrl)
    toast.success('Avatar updated successfully!')
    
    // Switch to preview tab to show the new avatar
    if (showAllFeatures) {
      setActiveTab('preview')
    }
  }, [onAvatarUpdated, showAllFeatures])

  // Handle avatar deletion
  const handleAvatarDelete = useCallback(() => {
    onAvatarDeleted?.()
    toast.success('Avatar deleted successfully!')
    
    // Switch to fallback generator tab
    if (showAllFeatures) {
      setActiveTab('fallback')
    }
  }, [onAvatarDeleted, showAllFeatures])

  // Handle fallback avatar generation
  const handleFallbackGenerated = useCallback((avatarDataUrl: string) => {
    // Convert data URL to blob and upload
    fetch(avatarDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${user.name}-fallback-avatar.svg`, {
          type: 'image/svg+xml'
        })
        
        // This would trigger the upload process
        handleAvatarUpdate(avatarDataUrl)
      })
      .catch(error => {
        console.error('Error converting fallback avatar:', error)
        toast.error('Failed to generate fallback avatar')
      })
  }, [user.name, handleAvatarUpdate])

  // Handle cropped image
  const handleCroppedImage = useCallback((croppedBlob: Blob) => {
    // Convert blob to data URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      handleAvatarUpdate(dataUrl)
    }
    reader.readAsDataURL(croppedBlob)
    
    setUploadState(prev => ({ ...prev, showCropper: false }))
  }, [handleAvatarUpdate])

  if (!canManageAvatar) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            Avatar Management
          </CardTitle>
          <CardDescription>
            You can only manage your own avatar or access this as an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access restricted. You can only manage your own profile avatar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Simple upload-only view for limited features
  if (!showAllFeatures) {
    return (
      <div className="space-y-4">
        <AvatarUploadSystem
          user={user}
          currentUser={currentUser}
          onAvatarUpdated={handleAvatarUpdate}
          onAvatarDeleted={handleAvatarDelete}
        />
        
        {uploadState.showCropper && uploadState.selectedImageUrl && (
          <ImageCropperModal
            isOpen={uploadState.showCropper}
            onClose={() => setUploadState(prev => ({ ...prev, showCropper: false }))}
            imageUrl={uploadState.selectedImageUrl}
            onCropComplete={handleCroppedImage}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Avatar Management System
          </CardTitle>
          <CardDescription>
            Complete avatar management with upload, cropping, preview, and fallback generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Cloudinary Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Image Cropping</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Fallback Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Preview Management</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      {uploadState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadState.error}</AlertDescription>
        </Alert>
      )}

      {uploadState.isUploading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Uploading avatar... {uploadState.uploadProgress}%
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="fallback" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Upload Tab */}
            <TabsContent value="upload" className="px-6 pb-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 1</Badge>
                  <h3 className="font-medium">Upload & Crop Avatar</h3>
                </div>
                
                <AvatarUploadSystem
                  user={user}
                  currentUser={currentUser}
                  onAvatarUpdated={handleAvatarUpdate}
                  onAvatarDeleted={handleAvatarDelete}
                  maxFileSize={10} // 10MB for high quality uploads
                  allowedFormats={['image/jpeg', 'image/png', 'image/webp', 'image/heic']}
                />
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="px-6 pb-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 2</Badge>
                  <h3 className="font-medium">Preview & Manage</h3>
                </div>
                
                <AvatarPreviewManager
                  user={user}
                  currentUser={currentUser}
                  onAvatarChange={handleAvatarUpdate}
                  showHistory={true}
                  showSettings={isOwnProfile}
                />
              </div>
            </TabsContent>

            {/* Fallback Generator Tab */}
            <TabsContent value="fallback" className="px-6 pb-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Alternative</Badge>
                  <h3 className="font-medium">Generate Fallback Avatar</h3>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Generate a custom avatar when no profile picture is available. 
                    This will be used as your default avatar across the platform.
                  </AlertDescription>
                </Alert>
                
                <FallbackAvatarGenerator
                  user={user}
                  onAvatarGenerated={handleFallbackGenerated}
                  size={400}
                  showCustomization={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Cropper Modal */}
      {uploadState.showCropper && uploadState.selectedImageUrl && (
        <ImageCropperModal
          isOpen={uploadState.showCropper}
          onClose={() => setUploadState(prev => ({ ...prev, showCropper: false }))}
          imageUrl={uploadState.selectedImageUrl}
          onCropComplete={handleCroppedImage}
          aspectRatio={1} // Square avatars
          outputSize={{ width: 400, height: 400 }}
        />
      )}

      {/* Quick Actions Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Avatar Status</h4>
              <p className="text-sm text-muted-foreground">
                {user.avatarUrl ? 'Custom avatar active' : 'Using fallback avatar'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Avatar Set
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Fallback Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}