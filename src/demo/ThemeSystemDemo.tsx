import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { ThemeToggle, SimpleThemeToggle } from '@/components/ui/theme-toggle'
import {
  AccessibilityPanel,
  HighContrastToggle,
  ReducedMotionToggle,
  QuickAccessibilityButton,
} from '@/components/ui/accessibility-controls'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Eye, 
  Zap, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import {
  exportThemeConfig,
  importThemeConfig,
  validateThemeAccessibility,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  prefersHighContrast,
  prefersReducedMotion,
} from '@/lib/theme-utils'

export function ThemeSystemDemo() {
  const { theme, actualTheme, isTransitioning, cycleTheme } = useTheme()
  const [accessibilityReport, setAccessibilityReport] = useState(validateThemeAccessibility())

  const handleExportTheme = () => {
    const config = exportThemeConfig()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `architex-theme-${actualTheme}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportTheme = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const config = e.target?.result as string
          const success = importThemeConfig(config)
          if (success) {
            alert('Theme imported successfully!')
          } else {
            alert('Failed to import theme')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const validateAccessibility = () => {
    const report = validateThemeAccessibility()
    setAccessibilityReport(report)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Enhanced Theme System</h1>
        <p className="text-muted-foreground">
          Comprehensive theme management with accessibility features and smooth transitions
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Test theme features and keyboard shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <ThemeToggle />
            <SimpleThemeToggle />
            <QuickAccessibilityButton />
            <Button onClick={cycleTheme} variant="outline">
              Cycle Theme (Ctrl+Shift+T)
            </Button>
            <Button onClick={handleExportTheme} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Theme
            </Button>
            <Button onClick={handleImportTheme} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Theme
            </Button>
          </div>

          {/* Current State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium">Theme Preference</p>
              <Badge variant="secondary" className="capitalize">
                {theme === 'system' ? (
                  <><Monitor className="mr-1 h-3 w-3" /> System</>
                ) : theme === 'dark' ? (
                  <><Moon className="mr-1 h-3 w-3" /> Dark</>
                ) : (
                  <><Sun className="mr-1 h-3 w-3" /> Light</>
                )}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Theme</p>
              <Badge variant="secondary" className="capitalize">
                {actualTheme === 'dark' ? (
                  <><Moon className="mr-1 h-3 w-3" /> Dark</>
                ) : (
                  <><Sun className="mr-1 h-3 w-3" /> Light</>
                )}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Transition Status</p>
              <Badge variant={isTransitioning ? 'default' : 'outline'}>
                {isTransitioning ? 'Transitioning...' : 'Ready'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="accessibility" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accessibility">
            <Eye className="mr-2 h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="validation">
            <CheckCircle className="mr-2 h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="system">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <AccessibilityPanel />

          <Card>
            <CardHeader>
              <CardTitle>Quick Toggles</CardTitle>
              <CardDescription>
                Quickly enable or disable accessibility features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <HighContrastToggle />
              <ReducedMotionToggle />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Current theme color values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Background', var: '--background' },
                  { name: 'Foreground', var: '--foreground' },
                  { name: 'Primary', var: '--primary' },
                  { name: 'Secondary', var: '--secondary' },
                  { name: 'Accent', var: '--accent' },
                  { name: 'Destructive', var: '--destructive' },
                  { name: 'Muted', var: '--muted' },
                  { name: 'Border', var: '--border' },
                ].map((color) => (
                  <div key={color.var} className="space-y-2">
                    <div
                      className="h-20 rounded-lg border"
                      style={{ backgroundColor: `hsl(var(${color.var}))` }}
                    />
                    <p className="text-sm font-medium">{color.name}</p>
                    <code className="text-xs text-muted-foreground">{color.var}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Component Examples</CardTitle>
              <CardDescription>
                See how components look in the current theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Validation</CardTitle>
              <CardDescription>
                Check theme compliance with WCAG standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={validateAccessibility}>
                Run Validation
              </Button>

              {accessibilityReport && (
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center gap-2">
                    {accessibilityReport.isAccessible ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-500">
                          Theme is accessible
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-500">
                          Accessibility issues found
                        </span>
                      </>
                    )}
                  </div>

                  {/* Issues */}
                  {accessibilityReport.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-500">Issues</h4>
                      <ul className="space-y-1">
                        {accessibilityReport.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {accessibilityReport.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-500">Warnings</h4>
                      <ul className="space-y-1">
                        {accessibilityReport.warnings.map((warning, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {accessibilityReport.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Suggestions</h4>
                      <ul className="space-y-1">
                        {accessibilityReport.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>
                Detected system-level preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">High Contrast</p>
                  <Badge variant={prefersHighContrast() ? 'default' : 'secondary'}>
                    {prefersHighContrast() ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reduced Motion</p>
                  <Badge variant={prefersReducedMotion() ? 'default' : 'secondary'}>
                    {prefersReducedMotion() ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium">Keyboard Shortcuts</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center justify-between">
                    <span>Cycle theme</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      Ctrl + Shift + T
                    </kbd>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
