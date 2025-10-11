import { ThemeProvider } from '@/components/theme-provider'
import { DashboardLayout } from '@/components/navigation/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import './globals.css'

function SimpleTest() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">shadcn-ui Test</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test card with proper shadcn-ui styling.</p>
          </CardContent>
        </Card>
        
        <div className="space-x-2">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        
        <div className="space-x-2">
          <Badge>Default Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="architex-ui-theme">
      <DashboardLayout userRole="Admin">
        <SimpleTest />
      </DashboardLayout>
    </ThemeProvider>
  )
}

export default App
