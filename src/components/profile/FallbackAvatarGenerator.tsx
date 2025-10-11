import React, { useState, useCallback, useMemo } from 'react'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Palette, 
  Type, 
  Circle, 
  Square, 
  Hexagon, 
  Shuffle, 
  Download, 
  CheckCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface FallbackAvatarGeneratorProps {
  user: User
  onAvatarGenerated?: (avatarDataUrl: string) => void
  size?: number
  showCustomization?: boolean
}

interface AvatarStyle {
  id: string
  name: string
  shape: 'circle' | 'square' | 'hexagon' | 'rounded-square'
  backgroundType: 'solid' | 'gradient' | 'pattern'
  textStyle: 'initials' | 'icon' | 'emoji'
}

interface AvatarConfig {
  backgroundColor: string
  secondaryColor?: string
  textColor: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | 'light'
  shape: 'circle' | 'square' | 'hexagon' | 'rounded-square'
  backgroundType: 'solid' | 'gradient' | 'pattern'
  textStyle: 'initials' | 'icon' | 'emoji'
  borderWidth: number
  borderColor: string
}

const PRESET_COLORS = [
  '#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b', 
  '#10b981', '#f97316', '#6366f1', '#ec4899',
  '#06b6d4', '#84cc16', '#f43f5e', '#a855f7',
  '#3b82f6', '#eab308', '#22c55e', '#f97316'
]

const AVATAR_STYLES: AvatarStyle[] = [
  {
    id: 'modern',
    name: 'Modern',
    shape: 'circle',
    backgroundType: 'gradient',
    textStyle: 'initials'
  },
  {
    id: 'classic',
    name: 'Classic',
    shape: 'circle',
    backgroundType: 'solid',
    textStyle: 'initials'
  },
  {
    id: 'geometric',
    name: 'Geometric',
    shape: 'hexagon',
    backgroundType: 'solid',
    textStyle: 'initials'
  },
  {
    id: 'rounded',
    name: 'Rounded',
    shape: 'rounded-square',
    backgroundType: 'gradient',
    textStyle: 'initials'
  }
]

export function FallbackAvatarGenerator({
  user,
  onAvatarGenerated,
  size = 400,
  showCustomization = true
}: FallbackAvatarGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [config, setConfig] = useState<AvatarConfig>({
    backgroundColor: PRESET_COLORS[user.name.length % PRESET_COLORS.length],
    secondaryColor: PRESET_COLORS[(user.name.length + 1) % PRESET_COLORS.length],
    textColor: '#ffffff',
    fontSize: 0.4, // Relative to avatar size
    fontWeight: 'bold',
    shape: 'circle',
    backgroundType: 'gradient',
    textStyle: 'initials',
    borderWidth: 0,
    borderColor: '#ffffff'
  })

  // Generate user initials
  const userInitials = useMemo(() => {
    return user.name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }, [user.name])

  // Generate deterministic color based on user name
  const generateUserColor = useCallback((name: string, index: number = 0): string => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const colorIndex = Math.abs(hash + index) % PRESET_COLORS.length
    return PRESET_COLORS[colorIndex]
  }, [])

  // Generate SVG avatar
  const generateSVGAvatar = useCallback((customConfig?: Partial<AvatarConfig>): string => {
    const finalConfig = { ...config, ...customConfig }
    const { 
      backgroundColor, 
      secondaryColor, 
      textColor, 
      fontSize, 
      fontWeight,
      shape,
      backgroundType,
      textStyle,
      borderWidth,
      borderColor
    } = finalConfig

    let shapeElement = ''
    let backgroundFill = backgroundColor

    // Generate background
    if (backgroundType === 'gradient' && secondaryColor) {
      const gradientId = `gradient-${Date.now()}`
      backgroundFill = `url(#${gradientId})`
      
      const gradientDef = `
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
          </linearGradient>
        </defs>
      `
      
      shapeElement = gradientDef
    }

    // Generate shape
    const strokeStyle = borderWidth > 0 ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ''
    
    switch (shape) {
      case 'circle':
        shapeElement += `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - borderWidth}" fill="${backgroundFill}" ${strokeStyle} />`
        break
      case 'square':
        shapeElement += `<rect x="${borderWidth}" y="${borderWidth}" width="${size - borderWidth*2}" height="${size - borderWidth*2}" fill="${backgroundFill}" ${strokeStyle} />`
        break
      case 'rounded-square':
        const radius = size * 0.1
        shapeElement += `<rect x="${borderWidth}" y="${borderWidth}" width="${size - borderWidth*2}" height="${size - borderWidth*2}" rx="${radius}" ry="${radius}" fill="${backgroundFill}" ${strokeStyle} />`
        break
      case 'hexagon':
        const hexPoints = []
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const x = size/2 + (size/2 - borderWidth) * Math.cos(angle)
          const y = size/2 + (size/2 - borderWidth) * Math.sin(angle)
          hexPoints.push(`${x},${y}`)
        }
        shapeElement += `<polygon points="${hexPoints.join(' ')}" fill="${backgroundFill}" ${strokeStyle} />`
        break
    }

    // Generate text content
    let textContent = ''
    const textSize = size * fontSize
    const textY = size/2 + textSize * 0.35 // Adjust for vertical centering

    switch (textStyle) {
      case 'initials':
        textContent = `
          <text x="${size/2}" y="${textY}" 
                font-family="Arial, sans-serif" 
                font-size="${textSize}" 
                font-weight="${fontWeight}"
                fill="${textColor}" 
                text-anchor="middle" 
                dominant-baseline="middle">
            ${userInitials}
          </text>
        `
        break
      case 'icon':
        // Simple user icon
        const iconSize = size * 0.5
        const iconX = (size - iconSize) / 2
        const iconY = (size - iconSize) / 2
        textContent = `
          <g transform="translate(${iconX}, ${iconY})">
            <circle cx="${iconSize/2}" cy="${iconSize * 0.3}" r="${iconSize * 0.15}" fill="${textColor}" />
            <path d="M ${iconSize * 0.2} ${iconSize * 0.8} Q ${iconSize/2} ${iconSize * 0.6} ${iconSize * 0.8} ${iconSize * 0.8}" 
                  stroke="${textColor}" stroke-width="${iconSize * 0.05}" fill="none" />
          </g>
        `
        break
      case 'emoji':
        // Simple emoji-style face
        textContent = `
          <text x="${size/2}" y="${textY}" 
                font-family="Arial, sans-serif" 
                font-size="${textSize}" 
                fill="${textColor}" 
                text-anchor="middle" 
                dominant-baseline="middle">
            😊
          </text>
        `
        break
    }

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        ${shapeElement}
        ${textContent}
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }, [config, size, userInitials])

  // Apply preset style
  const applyStyle = useCallback((styleId: string) => {
    const style = AVATAR_STYLES.find(s => s.id === styleId)
    if (!style) return

    setSelectedStyle(styleId)
    setConfig(prev => ({
      ...prev,
      shape: style.shape,
      backgroundType: style.backgroundType,
      textStyle: style.textStyle,
      backgroundColor: generateUserColor(user.name, 0),
      secondaryColor: style.backgroundType === 'gradient' ? generateUserColor(user.name, 1) : undefined
    }))
  }, [generateUserColor, user.name])

  // Randomize avatar
  const randomizeAvatar = useCallback(() => {
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)]
    const randomPrimary = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    const randomSecondary = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    
    setConfig(prev => ({
      ...prev,
      backgroundColor: randomPrimary,
      secondaryColor: randomSecondary,
      shape: randomStyle.shape,
      backgroundType: randomStyle.backgroundType,
      textStyle: randomStyle.textStyle
    }))
  }, [])

  // Generate and save avatar
  const handleGenerateAvatar = useCallback(() => {
    const avatarDataUrl = generateSVGAvatar()
    onAvatarGenerated?.(avatarDataUrl)
    toast.success('Fallback avatar generated successfully!')
  }, [generateSVGAvatar, onAvatarGenerated])

  // Download avatar
  const handleDownloadAvatar = useCallback(() => {
    const avatarDataUrl = generateSVGAvatar()
    const link = document.createElement('a')
    link.href = avatarDataUrl
    link.download = `${user.name.replace(/\s+/g, '-').toLowerCase()}-avatar.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Avatar downloaded successfully!')
  }, [generateSVGAvatar, user.name])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Fallback Avatar Generator
          </CardTitle>
          <CardDescription>
            Generate a custom fallback avatar when no profile picture is uploaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <img 
                src={generateSVGAvatar()} 
                alt="Generated avatar"
                className="w-32 h-32 rounded-full border-2 border-muted"
              />
              <Badge 
                variant="secondary" 
                className="absolute -bottom-2 -right-2"
              >
                Preview
              </Badge>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Initials: {userInitials}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateAvatar}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Use This Avatar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleDownloadAvatar}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={randomizeAvatar}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  Randomize
                </Button>
              </div>
            </div>
          </div>

          {/* Style Presets */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Style Presets
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVATAR_STYLES.map((style) => (
                <Card 
                  key={style.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedStyle === style.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => applyStyle(style.id)}
                >
                  <CardContent className="p-3 text-center space-y-2">
                    <img 
                      src={generateSVGAvatar({
                        shape: style.shape,
                        backgroundType: style.backgroundType,
                        textStyle: style.textStyle
                      })} 
                      alt={style.name}
                      className="w-16 h-16 mx-auto rounded-full"
                    />
                    <p className="text-xs font-medium">{style.name}</p>
                    {selectedStyle === style.id && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customization Options */}
      {showCustomization && (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="colors" className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="shape" className="flex items-center gap-2">
                    <Circle className="h-4 w-4" />
                    Shape
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="colors" className="px-6 pb-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Primary Color</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          config.backgroundColor === color ? 'border-primary' : 'border-muted'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setConfig(prev => ({ ...prev, backgroundColor: color }))}
                      />
                    ))}
                  </div>
                </div>

                {config.backgroundType === 'gradient' && (
                  <div>
                    <Label className="text-sm font-medium">Secondary Color</Label>
                    <div className="grid grid-cols-8 gap-2 mt-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            config.secondaryColor === color ? 'border-primary' : 'border-muted'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setConfig(prev => ({ ...prev, secondaryColor: color }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Text Color</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['#ffffff', '#000000', '#6b7280', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          config.textColor === color ? 'border-primary' : 'border-muted'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setConfig(prev => ({ ...prev, textColor: color }))}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shape" className="px-6 pb-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Avatar Shape</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { value: 'circle', label: 'Circle', icon: Circle },
                      { value: 'square', label: 'Square', icon: Square },
                      { value: 'rounded-square', label: 'Rounded', icon: Square },
                      { value: 'hexagon', label: 'Hexagon', icon: Hexagon }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={config.shape === value ? "default" : "outline"}
                        onClick={() => setConfig(prev => ({ ...prev, shape: value as any }))}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Background Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      variant={config.backgroundType === 'solid' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, backgroundType: 'solid' }))}
                    >
                      Solid
                    </Button>
                    <Button
                      variant={config.backgroundType === 'gradient' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, backgroundType: 'gradient' }))}
                    >
                      Gradient
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="px-6 pb-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Text Style</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Button
                      variant={config.textStyle === 'initials' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, textStyle: 'initials' }))}
                    >
                      Initials
                    </Button>
                    <Button
                      variant={config.textStyle === 'icon' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, textStyle: 'icon' }))}
                    >
                      Icon
                    </Button>
                    <Button
                      variant={config.textStyle === 'emoji' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, textStyle: 'emoji' }))}
                    >
                      Emoji
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Font Size</Label>
                  <div className="mt-2">
                    <Slider
                      value={[config.fontSize]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, fontSize: value[0] }))}
                      min={0.2}
                      max={0.6}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Font Weight</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Button
                      variant={config.fontWeight === 'light' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, fontWeight: 'light' }))}
                    >
                      Light
                    </Button>
                    <Button
                      variant={config.fontWeight === 'normal' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, fontWeight: 'normal' }))}
                    >
                      Normal
                    </Button>
                    <Button
                      variant={config.fontWeight === 'bold' ? "default" : "outline"}
                      onClick={() => setConfig(prev => ({ ...prev, fontWeight: 'bold' }))}
                    >
                      Bold
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}