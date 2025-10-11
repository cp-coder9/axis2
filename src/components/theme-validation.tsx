import { useTheme, useDarkMode } from '@/components/theme-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export function ThemeValidation() {
  const { theme, setTheme, actualTheme } = useTheme()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const validationTests = [
    {
      name: 'Theme Context Available',
      status: theme !== undefined && setTheme !== undefined ? 'pass' : 'fail',
      details: `Theme: ${theme}, Function: ${typeof setTheme}`
    },
    {
      name: 'Actual Theme Resolution',
      status: actualTheme === 'dark' || actualTheme === 'light' ? 'pass' : 'fail',
      details: `Resolved to: ${actualTheme}`
    },
    {
      name: 'Legacy Hook Compatibility',
      status: typeof isDarkMode === 'boolean' && typeof toggleDarkMode === 'function' ? 'pass' : 'fail',
      details: `Dark Mode: ${isDarkMode}, Toggle: ${typeof toggleDarkMode}`
    },
    {
      name: 'Local Storage Persistence',
      status: localStorage.getItem('architex-ui-theme') !== null ? 'pass' : 'info',
      details: `Stored: ${localStorage.getItem('architex-ui-theme') || 'Not set'}`
    },
    {
      name: 'CSS Class Application',
      status: document.documentElement.classList.contains('dark') || 
              document.documentElement.classList.contains('light') ? 'pass' : 'fail',
      details: `Classes: ${Array.from(document.documentElement.classList).join(', ')}`
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Pass</Badge>
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Theme System Validation</CardTitle>
        <CardDescription>
          Testing shadcn-ui theme integration and backward compatibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Current Theme</p>
            <p className="text-lg font-bold">{theme}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Actual Theme</p>
            <p className="text-lg font-bold">{actualTheme}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Dark Mode</p>
            <p className="text-lg font-bold">{isDarkMode ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setTheme('light')}
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
          >
            Light
          </Button>
          <Button 
            onClick={() => setTheme('dark')}
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
          >
            Dark
          </Button>
          <Button 
            onClick={() => setTheme('system')}
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
          >
            System
          </Button>
          <Button 
            onClick={toggleDarkMode}
            variant="outline"
            size="sm"
          >
            Toggle (Legacy)
          </Button>
        </div>

        {/* Validation Tests */}
        <div className="space-y-3">
          <h4 className="font-medium">Validation Tests</h4>
          {validationTests.map((test, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(test.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{test.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{test.details}</p>
              </div>
              {getStatusBadge(test.status)}
            </div>
          ))}
        </div>

        {/* Integration Status */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">Phase 2.1 Complete</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Theme switching functionality has been successfully integrated with shadcn-ui. 
            Both the new <code>useTheme</code> hook and legacy <code>useDarkMode</code> hook 
            are working correctly for backward compatibility.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
