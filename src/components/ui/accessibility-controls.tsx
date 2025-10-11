import { useState, useEffect } from 'react'
import { Contrast, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { applyHighContrastMode, prefersHighContrast, prefersReducedMotion } from '@/lib/theme-utils'

export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    return localStorage.getItem('high-contrast') === 'true' || prefersHighContrast()
  })

  useEffect(() => {
    applyHighContrastMode(isHighContrast)
    localStorage.setItem('high-contrast', String(isHighContrast))
  }, [isHighContrast])

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="high-contrast"
        checked={isHighContrast}
        onCheckedChange={setIsHighContrast}
        aria-label="Toggle high contrast mode"
      />
      <Label htmlFor="high-contrast" className="cursor-pointer">
        High Contrast
      </Label>
    </div>
  )
}

export function ReducedMotionToggle() {
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    return localStorage.getItem('reduced-motion') === 'true' || prefersReducedMotion()
  })

  useEffect(() => {
    const root = document.documentElement
    if (isReducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    localStorage.setItem('reduced-motion', String(isReducedMotion))
  }, [isReducedMotion])

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="reduced-motion"
        checked={isReducedMotion}
        onCheckedChange={setIsReducedMotion}
        aria-label="Toggle reduced motion"
      />
      <Label htmlFor="reduced-motion" className="cursor-pointer">
        Reduce Motion
      </Label>
    </div>
  )
}

export function AccessibilityPanel() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    return localStorage.getItem('high-contrast') === 'true' || prefersHighContrast()
  })

  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    return localStorage.getItem('reduced-motion') === 'true' || prefersReducedMotion()
  })

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('font-size') || '100'
  })

  useEffect(() => {
    applyHighContrastMode(isHighContrast)
    localStorage.setItem('high-contrast', String(isHighContrast))
  }, [isHighContrast])

  useEffect(() => {
    const root = document.documentElement
    if (isReducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    localStorage.setItem('reduced-motion', String(isReducedMotion))
  }, [isReducedMotion])

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${fontSize}%`
    localStorage.setItem('font-size', fontSize)
  }, [fontSize])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize the interface to meet your accessibility needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* High Contrast Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast-panel" className="text-base font-medium">
                High Contrast Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Increase color contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast-panel"
              checked={isHighContrast}
              onCheckedChange={setIsHighContrast}
              aria-label="Toggle high contrast mode"
            />
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion-panel" className="text-base font-medium">
                Reduce Motion
              </Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion-panel"
              checked={isReducedMotion}
              onCheckedChange={setIsReducedMotion}
              aria-label="Toggle reduced motion"
            />
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <Label htmlFor="font-size" className="text-base font-medium">
              Font Size
            </Label>
            <p className="text-sm text-muted-foreground">
              Adjust text size for better readability
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(String(Math.max(75, parseInt(fontSize) - 10)))}
              aria-label="Decrease font size"
            >
              A-
            </Button>
            <span className="min-w-[60px] text-center text-sm font-medium">
              {fontSize}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(String(Math.min(150, parseInt(fontSize) + 10)))}
              aria-label="Increase font size"
            >
              A+
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize('100')}
              aria-label="Reset font size"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* System Preferences Detection */}
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="text-sm font-medium">System Preferences Detected</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              High Contrast: {prefersHighContrast() ? 'Enabled' : 'Disabled'}
            </p>
            <p>
              Reduced Motion: {prefersReducedMotion() ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickAccessibilityButton() {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        aria-label="Accessibility settings"
        title="Accessibility settings"
      >
        <Contrast className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      {showPanel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setShowPanel(false)}
                aria-label="Close accessibility panel"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              <AccessibilityPanel />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
