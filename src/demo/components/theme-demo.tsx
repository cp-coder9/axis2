/**
 * Theme Demo Component
 * 
 * This component showcases the Architex Axis theme system with shadcn/ui components.
 * It demonstrates color palettes, typography, spacing, and component variants.
 */

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Progress,
  Alert,
  AlertDescription,
  cn
} from '@/lib/shadcn'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  ARCHITEX_COLORS, 
  SEMANTIC_COLORS, 
  TYPOGRAPHY, 
  COMMON_CLASSES,
  STATUS_COLORS,
  ROLE_COLORS
} from '@/lib/theme-constants'

export function ThemeDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn(COMMON_CLASSES.text.title, "mb-2")}>
              Architex Axis Theme Demo
            </h1>
            <p className={COMMON_CLASSES.text.subtitle}>
              Showcasing the shadcn/ui integration with Architex brand colors
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Color Palette</CardTitle>
            <CardDescription>
              Primary brand colors used throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Colors */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Primary Colors</h3>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                {Object.entries(ARCHITEX_COLORS.primary).map(([shade, color]) => (
                  <div
                    key={shade}
                    className="aspect-square rounded-md border"
                    style={{ backgroundColor: color }}
                    title={`Primary ${shade}: ${color}`}
                  >
                    <div className="w-full h-full flex items-end justify-center pb-1">
                      <span className={cn(
                        "text-xs font-mono",
                        parseInt(shade) >= 500 ? "text-white" : "text-black"
                      )}>
                        {shade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Colors */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Secondary Colors</h3>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                {Object.entries(ARCHITEX_COLORS.secondary).map(([shade, color]) => (
                  <div
                    key={shade}
                    className="aspect-square rounded-md border"
                    style={{ backgroundColor: color }}
                    title={`Secondary ${shade}: ${color}`}
                  >
                    <div className="w-full h-full flex items-end justify-center pb-1">
                      <span className={cn(
                        "text-xs font-mono",
                        parseInt(shade) >= 500 ? "text-white" : "text-black"
                      )}>
                        {shade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Accent Colors</h3>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                {Object.entries(ARCHITEX_COLORS.accent).map(([shade, color]) => (
                  <div
                    key={shade}
                    className="aspect-square rounded-md border"
                    style={{ backgroundColor: color }}
                    title={`Accent ${shade}: ${color}`}
                  >
                    <div className="w-full h-full flex items-end justify-center pb-1">
                      <span className={cn(
                        "text-xs font-mono",
                        parseInt(shade) >= 400 ? "text-white" : "text-black"
                      )}>
                        {shade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semantic Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Semantic Colors</CardTitle>
            <CardDescription>
              Status and feedback colors for different states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(SEMANTIC_COLORS).map(([name, colors]) => (
                <div key={name} className="space-y-2">
                  <h4 className="font-medium capitalize">{name}</h4>
                  <div className="space-y-1">
                    {Object.entries(colors).slice(0, 5).map(([shade, color]) => (
                      <div
                        key={shade}
                        className="h-8 rounded flex items-center px-3 text-sm font-mono"
                        style={{ 
                          backgroundColor: color,
                          color: parseInt(shade) >= 400 ? 'white' : 'black'
                        }}
                      >
                        {shade}: {color}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Component Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Component Variants</CardTitle>
            <CardDescription>
              Different styles and variants of shadcn/ui components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            {/* Role-based styling */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Role-based Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <Card key={role} className="border-2" style={{ borderColor: color }}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium capitalize">{role}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {role === 'admin' ? 'System administration and user management' :
                         role === 'freelancer' ? 'Project work and time tracking' :
                         'Project viewing and communication'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Status indicators */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Status Indicators</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center space-x-2 p-2 rounded-md border">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>
              Font sizes and weights used throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(TYPOGRAPHY.fontSizes).map(([size, value]) => (
              <div key={size} className="flex items-center space-x-4">
                <code className="text-sm bg-muted px-2 py-1 rounded min-w-[60px]">
                  {size}
                </code>
                <div style={{ fontSize: value }} className="font-medium">
                  The quick brown fox jumps over the lazy dog
                </div>
                <span className="text-muted-foreground text-sm">({value})</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Progress and Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Project Progress</span>
                  <span>75%</span>
                </div>
                <Progress value={75} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Timer Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Storage Used</span>
                  <span>90%</span>
                </div>
                <Progress value={90} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  This is a default alert message.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertDescription>
                  This is a destructive alert message.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
