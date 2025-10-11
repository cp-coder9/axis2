import React, { useState, useRef, useCallback } from 'react'
import { User, UserRole, FileCategory } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  Camera,
  Crop,
  RotateCw,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cloudinaryManagementService } from '@/services/cloudinaryManagementService'
import { FileMetadata } from '@/services/cloudinaryFolderService'
import { FilePermissionLevel } from '@/types'

interface AvatarUploadSystemProps {
  user: User
  currentUser: User
  onAvatarUpdated?: (avatarUrl: string) => void
  onAvatarDeleted?: () => void
  maxFileSize?: number // MB
  allowedFormats?: string[]
}

interface CropSettings {
  x: number
  y: number
  width: number
  height: number
  scale: number
  rotation: number
}

interface UploadProgress {
  progress: number
  stage: 'uploading' | 'processing' | 'complete' | 'error'
  message: string
}

export function AvatarUploadSystem({
  user,
  currentUser,
  onAvatarUpdated,
  onAvatarDeleted,
  maxFileSize = 5, // 5MB default
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
}: AvatarUploadSystemProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1,
    rotation: 0
  })
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check permissions
  const canUploadAvatar = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const canDeleteAvatar = canUploadAvatar && user.avatarUrl

  /**
   * Generate fallback avatar with user initials
   */
  const generateFallbackAvatar = useCallback((name: string): string => {
    const initials = name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)

    // Create a simple SVG avatar with initials
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#0ea5e9"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" 
              fill="white" text-anchor="middle" font-weight="bold">
          ${initials}
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }, [])

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!allowedFormats.includes(file.type)) {
      toast.error(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`)
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      toast.error(`File size too large. Maximum size: ${maxFileSize}MB`)
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setShowCropDialog(true)
    }
    reader.readAsDataURL(file)
  }, [allowedFormats, maxFileSize])

  /**
   * Handle crop settings change
   */
  const handleCropChange = useCallback((newSettings: Partial<CropSettings>) => {
    setCropSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  /**
   * Apply crop and generate final image
   */
  const applyCropAndUpload = useCallback(async () => {
    if (!selectedFile || !previewUrl || !canvasRef.current) return

    try {
      setIsUploading(true)
      setUploadProgress({
        progress: 0,
        stage: 'processing',
        message: 'Processing image...'
      })

      // Create canvas for cropping
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Load image
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = previewUrl
      })

      // Set canvas size
      canvas.width = cropSettings.width
      canvas.height = cropSettings.height

      // Apply transformations
      ctx.save()
      ctx.translate(cropSettings.width / 2, cropSettings.height / 2)
      ctx.rotate((cropSettings.rotation * Math.PI) / 180)
      ctx.scale(cropSettings.scale, cropSettings.scale)
      
      // Draw cropped image
      ctx.drawImage(
        img,
        -cropSettings.width / 2,
        -cropSettings.height / 2,
        cropSettings.width,
        cropSettings.height
      )
      ctx.restore()

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.9)
      })

      // Create file from blob
      const processedFile = new File([blob], `avatar-${user.id}.jpg`, {
        type: 'image/jpeg'
      })

      // Upload to Cloudinary
      await uploadAvatarToCloudinary(processedFile)

    } catch (error) {
      console.error('Error processing avatar:', error)
      setUploadProgress({
        progress: 0,
        stage: 'error',
        message: 'Failed to process image'
      })
      toast.error('Failed to process avatar image')
    }
  }, [selectedFile, previewUrl, cropSettings, user.id])

  /**
   * Upload avatar to Cloudinary
   */
  const uploadAvatarToCloudinary = useCallback(async (file: File) => {
    try {
      setUploadProgress({
        progress: 10,
        stage: 'uploading',
        message: 'Uploading to cloud storage...'
      })

      // Prepare metadata for avatar upload
      const metadata: FileMetadata = {
        userId: user.id,
        userRole: user.role,
        category: FileCategory.PROFILE,
        tags: ['avatar', 'profile-image', `user:${user.id}`],
        permissions: FilePermissionLevel.PROJECT_TEAM,
        description: `Avatar for ${user.name}`
      }

      // Upload with progress tracking
      const result = await cloudinaryManagementService.uploadFile(
        file,
        metadata,
        (progress) => {
          setUploadProgress({
            progress: Math.min(progress, 90),
            stage: 'uploading',
            message: `Uploading... ${Math.round(progress)}%`
          })
        }
      )

      setUploadProgress({
        progress: 100,
        stage: 'complete',
        message: 'Avatar uploaded successfully!'
      })

      // Update user avatar URL
      const avatarUrl = result.cloudinaryResult.secure_url
      onAvatarUpdated?.(avatarUrl)
      
      toast.success('Avatar updated successfully!')
      
      // Close dialogs
      setShowCropDialog(false)
      setShowUploadDialog(false)
      
      // Reset state
      setSelectedFile(null)
      setPreviewUrl(null)
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setUploadProgress({
        progress: 0,
        stage: 'error',
        message: 'Upload failed'
      })
      toast.error('Failed to upload avatar')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(null), 3000)
    }
  }, [user.id, user.role, user.name, onAvatarUpdated])

  /**
   * Delete current avatar
   */
  const handleDeleteAvatar = useCallback(async () => {
    if (!user.avatarUrl || !canDeleteAvatar) return

    try {
      // Extract public ID from Cloudinary URL
      const publicId = user.avatarUrl.split('/').pop()?.split('.')[0]
      if (!publicId) throw new Error('Invalid avatar URL')

      const result = await cloudinaryManagementService.deleteFile(
        publicId,
        currentUser.role,
        currentUser.id
      )

      if (result.success) {
        onAvatarDeleted?.()
        toast.success('Avatar deleted successfully')
      } else {
        throw new Error(result.error || 'Failed to delete avatar')
      }
    } catch (error) {
      console.error('Error deleting avatar:', error)
      toast.error('Failed to delete avatar')
    }
  }, [user.avatarUrl, canDeleteAvatar, currentUser.role, currentUser.id, onAvatarDeleted])

  /**
   * Trigger file input
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (!canUploadAvatar) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            Avatar Management
          </CardTitle>
          <CardDescription>
            You can only manage your own avatar or access this as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Avatar Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Avatar
          </CardTitle>
          <CardDescription>
            Manage your profile picture and avatar settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {user.avatarUrl && (
                <Badge 
                  variant="secondary" 
                  className="absolute -bottom-2 -right-2 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>

            {/* Avatar Info */}
            <div className="flex-1 space-y-2">
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                {user.avatarUrl ? 'Custom avatar uploaded' : 'Using default avatar'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Max size: {maxFileSize}MB</span>
                <span>•</span>
                <span>Formats: JPG, PNG, WebP</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Avatar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Avatar</DialogTitle>
                  <DialogDescription>
                    Choose an image file to upload as your profile avatar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div 
                    role="button"
                    tabIndex={0}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={triggerFileInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerFileInput();
                      }
                    }}
                    aria-label="Click to upload avatar image"
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP up to {maxFileSize}MB
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={allowedFormats.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </DialogContent>
            </Dialog>

            {canDeleteAvatar && (
              <Button 
                variant="outline" 
                onClick={handleDeleteAvatar}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove Avatar
              </Button>
            )}

            {user.avatarUrl && (
              <Button 
                variant="outline" 
                onClick={() => window.open(user.avatarUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {uploadProgress.stage === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {uploadProgress.stage === 'complete' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {uploadProgress.stage === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">{uploadProgress.message}</span>
              </div>
              
              <Progress 
                value={uploadProgress.progress} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Cropping Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Avatar Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area and settings for your avatar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
                
                {/* Crop overlay would go here in a real implementation */}
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
              </div>
            )}

            {/* Crop Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="scale-slider" className="text-sm font-medium">Scale</label>
                <input
                  id="scale-slider"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={cropSettings.scale}
                  onChange={(e) => handleCropChange({ scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="rotation-slider" className="text-sm font-medium">Rotation</label>
                <input
                  id="rotation-slider"
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={cropSettings.rotation}
                  onChange={(e) => handleCropChange({ rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCropDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={applyCropAndUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Apply & Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Fallback Avatar Generation */}
      {!user.avatarUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Fallback Avatar
            </CardTitle>
            <CardDescription>
              Automatically generated avatar based on your initials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={generateFallbackAvatar(user.name)} 
                alt="Fallback avatar"
                className="h-16 w-16 rounded-full"
              />
              <div>
                <p className="text-sm font-medium">Generated Avatar</p>
                <p className="text-xs text-muted-foreground">
                  Based on your name: {user.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}