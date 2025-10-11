import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '@/types'
import { useAppContext } from '@/contexts/AppContext'
import { signInWithGoogle } from '@/services/authService'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Chrome, Loader2 } from 'lucide-react'

interface UnifiedLoginFormProps {
  className?: string
  onRoleRedirect?: (role: UserRole) => void
}

export function UnifiedLoginForm({
  className,
  onRoleRedirect,
  ...props
}: UnifiedLoginFormProps & React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.FREELANCER)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login, getRoleBasedRedirectPath } = useAppContext()

  // Demo mode configuration
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV

  // Role configuration for UI display
  const roleConfig = {
    [UserRole.ADMIN]: {
      label: 'Admin',
      description: 'Full system access and management',
      color: 'bg-red-100 text-red-800 hover:bg-red-200',
      selectedColor: 'bg-red-500 text-white'
    },
    [UserRole.CLIENT]: {
      label: 'Client',
      description: 'Project oversight and collaboration',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      selectedColor: 'bg-blue-500 text-white'
    },
    [UserRole.FREELANCER]: {
      label: 'Freelancer',
      description: 'Project participation and delivery',
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      selectedColor: 'bg-green-500 text-white'
    }
  }

  // Role-based redirection logic
  const handleRoleRedirection = (role: UserRole) => {
    if (onRoleRedirect) {
      onRoleRedirect(role)
      return
    }

    // Use context method for consistent redirection
    const redirectPath = getRoleBasedRedirectPath()
    navigate(redirectPath, { replace: true })
  }

  // Handle email/password authentication
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use real Firebase authentication through AppContext
      await login(email, password, selectedRole)
      console.log('User authenticated successfully')
      handleRoleRedirection(selectedRole)
      
    } catch (error: any) {
      console.error('Authentication Error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google authentication
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use real Google authentication through auth service
      await signInWithGoogle(selectedRole)
      console.log('Google authentication successful')
      handleRoleRedirection(selectedRole)
      
    } catch (error: any) {
      console.error('Google Authentication Error:', error)
      
      let errorMessage = 'Failed to sign in with Google. Please try again.'
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please allow popups for this site.'
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User cancelled - Don't show error
        setIsLoading(false)
        return
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-primary rounded"></div>
            <CardTitle className="text-2xl font-bold">Architex Axis</CardTitle>
          </div>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Select Account Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(roleConfig).map(([role, config]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role as UserRole)}
                  className={cn(
                    "p-3 rounded-lg text-xs font-medium transition-all border",
                    selectedRole === role 
                      ? config.selectedColor 
                      : config.color
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {roleConfig[selectedRole].description}
            </p>
          </div>

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isDemoMode ? "demo@architex.com" : "m@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground bg-transparent border-none cursor-pointer"
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        if (!email) {
                          setError('Please enter your email address to reset password')
                          return
                        }
                        // Import Firebase password reset
                        const { sendPasswordResetEmail } = await import('firebase/auth')
                        const { auth } = await import('@/firebase')
                        await sendPasswordResetEmail(auth, email)
                        setError('Password reset email sent! Check your inbox.')
                      } catch (err: any) {
                        setError(err.message || 'Failed to send password reset email')
                      }
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isDemoMode ? "demo123" : ""}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? 'Hide password' : 'Show password'}
                    </span>
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <button 
                type="button"
                className="underline underline-offset-4 hover:text-primary bg-transparent border-none cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  // Navigate to sign up page when route is added
                  // For now, show informational message
                  setError('Sign up is available through admin user creation. Contact your administrator.')
                }}
              >
                Sign up
              </button>
            </div>
          </form>

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 text-center">
                <strong>Demo Mode:</strong> You can use any email and password (min 6 characters) to test the system.
                No real authentication is required.
              </p>
            </div>
          )}

          {/* Admin Notice */}
          {selectedRole === UserRole.ADMIN && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-600 text-center">
                <strong>Admin Access:</strong> Administrative accounts require approval.
                Contact your system administrator if you need admin privileges.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}