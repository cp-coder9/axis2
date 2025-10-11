import React, { useState, useCallback, useMemo } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Download, 
  Share2, 
  History, 
  Settings, 
  Palette,
  User as UserIcon,
  Camera,
  Grid3X3,
  Maximize2
} from 'lucide-react'
import { toast } from 'sonner'

interface AvatarPreviewManagerProps {
  user: User
  currentUser: User
  onAvatarChange?: (avatarUrl: string) => void
  showHistory?: boolean
  showSettings?: boolean
}

interface AvatarVariant {
  id: string
  name: string
  url: string
  size: string
  format: string
  createdAt: Date
  isActive: boolean
}

interface AvatarSettings {
  showInProfile: boolean
  allowPublicView: boolean
  compressionQuality: number
  autoOptimize: boolean
}

export function AvatarPreviewManager({
  user,
  currentUser,
  onAvatarChange,
  showHistory = true,
  showSettings = true
}: AvatarPreviewManagerProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('current')
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>({
    showInProfile: true,
    allowPublicView: true,
    compressionQuality: 85,
    autoOptimize: true
  })
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  // Check permissions
  const canManageAvatar = currentUser.role === UserRole.ADMIN || user.id === currentUser.id
  const isOwnProfile = user.id === currentUser.id

  // Generate avatar variants (different sizes and formats)
  const avatarVariants = useMemo((): AvatarVariant[] => {
    if (!user.avatarUrl) return []

    const baseUrl = user.avatarUrl.split('/upload/')[0] + '/upload/'
    const publicId = user.avatarUrl.split('/upload/')[1]

    return [
      {
        id: 'current',
        name: 'Current Avatar',
        url: user.avatarUrl,
        size: 'Original',
        format: 'Auto',
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'thumbnail',
        name: 'Thumbnail',
        url: `${baseUrl}w_150,h_150,c_thumb,f_auto,q_auto/${publicId}`,
        size: '150x150',
        format: 'Auto',
        createdAt: new Date(),
        isActive: false
      },
      {
        id: 'medium',
        name: 'Medium',
        url: `${baseUrl}w_400,h_400,c_fit,f_auto,q_auto/${publicId}`,
        size: '400x400',
        format: 'Auto',
        createdAt: new Date(),
        isActive: false
      },
      {
        id: 'large',
        name: 'Large',
        url: `${baseUrl}w_800,h_800,c_fit,f_auto,q_auto/${publicId}`,
        size: '800x800',
        format: 'Auto',
        createdAt: new Date(),
        isActive: false
      },
      {
        id: 'webp',
        name: 'WebP Optimized',
        url: `${baseUrl}w_400,h_400,c_fit,f_webp,q_auto/${publicId}`,
        size: '400x400',
        format: 'WebP',
        createdAt: new Date(),
        isActive: false
      }
    ]
  }, [user.avatarUrl])

  // Generate fallback avatar
  const generateFallbackAvatar = useCallback((name: string, size: number = 200): string => {
    const initials = name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)

    const colors = [
      '#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b', 
      '#10b981', '#f97316', '#6366f1', '#ec4899'
    ]
    
    const colorIndex = name.length % colors.length
    const backgroundColor = colors[colorIndex]

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.1}"/>
        <text x="${size / 2}" y="${size / 2 + size * 0.1}" 
              font-family="Arial, sans-serif" 
              font-size="${size * 0.4}" 
              fill="white" 
              text-anchor="middle" 
              font-weight="bold">
          ${initials}
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }, [])

  // Handle avatar variant selection
  const handleVariantSelect = useCallback((variantId: string) => {
    const variant = avatarVariants.find(v => v.id === variantId)
    if (variant && onAvatarChange) {
      onAvatarChange(variant.url)
      toast.success(`Avatar updated to ${variant.name}`)
    }
  }, [avatarVariants, onAvatarChange])

  // Handle download
  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(downloadUrl)
      toast.success('Avatar downloaded successfully')
    } catch (error) {
      console.error('Error downloading avatar:', error)
      toast.error('Failed to download avatar')
    }
  }, [])

  // Handle share
  const handleShare = useCallback(async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name}'s Avatar`,
          url: url
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Avatar URL copied to clipboard')
      } catch (error) {
        toast.error('Failed to copy URL')
      }
    }
  }, [user.name])

  if (!canManageAvatar) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            Avatar Preview
          </CardTitle>
          <CardDescription>
            You can only preview your own avatar or access this as an administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Avatar Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Avatar Preview & Management
          </CardTitle>
          <CardDescription>
            Preview different avatar variants and manage display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Avatar Display */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {user.avatarUrl && (
                <Badge 
                  variant="secondary" 
                  className="absolute -bottom-2 -right-2"
                >
                  Active
                </Badge>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Full Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Avatar Preview</DialogTitle>
                      <DialogDescription>
                        Full size preview of {user.name}'s avatar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-6">
                      <Avatar className="h-64 w-64">
                        <AvatarImage 
                          src={user.avatarUrl} 
                          alt={user.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-6xl font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DialogContent>
                </Dialog>

                {user.avatarUrl && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(user.avatarUrl, `${user.name}-avatar.jpg`)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShare(user.avatarUrl)}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Variants */}
          {avatarVariants.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Available Variants
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {avatarVariants.map((variant) => (
                  <Card 
                    key={variant.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      variant.isActive ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleVariantSelect(variant.id)}
                  >
                    <CardContent className="p-3 text-center space-y-2">
                      <Avatar className="h-16 w-16 mx-auto">
                        <AvatarImage 
                          src={variant.url} 
                          alt={variant.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="text-xs font-medium">{variant.name}</p>
                        <p className="text-xs text-muted-foreground">{variant.size}</p>
                        <p className="text-xs text-muted-foreground">{variant.format}</p>
                      </div>
                      
                      {variant.isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Avatar Preview */}
          {!user.avatarUrl && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Fallback Avatar Options
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[150, 200, 300].map((size) => (
                  <Card key={size} className="text-center">
                    <CardContent className="p-3 space-y-2">
                      <img 
                        src={generateFallbackAvatar(user.name, size)} 
                        alt={`Fallback ${size}px`}
                        className="w-16 h-16 mx-auto rounded-full"
                      />
                      <p className="text-xs font-medium">{size}px</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avatar Management Tabs */}
      {(showHistory || showSettings) && (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue={showHistory ? "history" : "settings"} className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2">
                  {showHistory && (
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      History
                    </TabsTrigger>
                  )}
                  {showSettings && (
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {showHistory && (
                <TabsContent value="history" className="px-6 pb-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Avatar History</h4>
                    <div className="space-y-3">
                      {/* Mock history entries */}
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl} alt="Previous avatar" />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Current Avatar</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded today
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No previous avatars found</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {showSettings && isOwnProfile && (
                <TabsContent value="settings" className="px-6 pb-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Avatar Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Show in Profile</p>
                          <p className="text-xs text-muted-foreground">
                            Display avatar in your public profile
                          </p>
                        </div>
                        <Button
                          variant={avatarSettings.showInProfile ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAvatarSettings(prev => ({
                            ...prev,
                            showInProfile: !prev.showInProfile
                          }))}
                        >
                          {avatarSettings.showInProfile ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Allow Public View</p>
                          <p className="text-xs text-muted-foreground">
                            Allow others to view your avatar
                          </p>
                        </div>
                        <Button
                          variant={avatarSettings.allowPublicView ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAvatarSettings(prev => ({
                            ...prev,
                            allowPublicView: !prev.allowPublicView
                          }))}
                        >
                          {avatarSettings.allowPublicView ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Auto Optimize</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically optimize avatar for web
                          </p>
                        </div>
                        <Button
                          variant={avatarSettings.autoOptimize ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAvatarSettings(prev => ({
                            ...prev,
                            autoOptimize: !prev.autoOptimize
                          }))}
                        >
                          {avatarSettings.autoOptimize ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}